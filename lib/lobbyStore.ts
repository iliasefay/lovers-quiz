import { Lobby, HostAnswer, PlayerAnswer, Verdict } from "./types";
import { getQuestionsForPack, questionPacks } from "./questionBank";
import { getConfig } from "./env";
import logger from "./logger";
import { randomUUID } from "crypto";

// In-memory lobby storage
const lobbies = new Map<string, Lobby>();

// Socket ID to lobby code mapping for quick lookups
const socketToLobby = new Map<string, { code: string; role: "host" | "player" }>();

// Session tokens for security (code -> { hostToken, playerToken })
const lobbyTokens = new Map<string, { hostToken: string; playerToken: string | null }>();

// Generate a cryptographically secure random token
function generateToken(): string {
  return randomUUID();
}

// Check if we've hit the lobby limit
function isAtCapacity(): boolean {
  const config = getConfig();
  return lobbies.size >= config.MAX_LOBBIES;
}

// Generate a unique 5-digit code
function generateCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = Math.floor(10000 + Math.random() * 90000).toString();
    attempts++;
  } while (lobbies.has(code) && attempts < 100);
  return code;
}

// Create a new lobby
export function createLobby(hostId: string, hostName: string): { lobby: Lobby; hostToken: string } | null {
  // Check capacity before creating
  if (isAtCapacity()) {
    logger.warn("Lobby creation rejected: at capacity", { currentCount: lobbies.size });
    return null;
  }

  const code = generateCode();
  const defaultPack = questionPacks[0];
  const questions = getQuestionsForPack(defaultPack.id);
  const hostToken = generateToken();

  logger.lobby("created", code, { hostName: hostName.trim().slice(0, 20) });

  const lobby: Lobby = {
    code,
    createdAt: Date.now(),
    host: {
      id: hostId,
      name: hostName.trim().slice(0, 20), // Sanitize
      joinedAt: Date.now(),
    },
    player: null,
    packId: defaultPack.id,
    questionIds: defaultPack.questionIds.slice(), // Copy array
    questions,
    hostAnswers: [],
    playerAnswers: [],
    currentIndex: 0,
    phase: "WAITING_FOR_PLAYERS",
    perQuestionSeconds: 25,
    questionStartAt: null,
    verdicts: [],
    hostConnected: true,
    playerConnected: false,
    disconnectedAt: null,
  };

  lobbies.set(code, lobby);
  socketToLobby.set(hostId, { code, role: "host" });
  lobbyTokens.set(code, { hostToken, playerToken: null });

  return { lobby, hostToken };
}

// Join an existing lobby
export function joinLobby(
  code: string,
  playerId: string,
  playerName: string
): { lobby: Lobby; playerToken: string } | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;

  // Don't allow joining if player exists and is connected
  if (lobby.player && lobby.playerConnected) return null;

  const playerToken = generateToken();

  lobby.player = {
    id: playerId,
    name: playerName.trim().slice(0, 20), // Sanitize
    joinedAt: Date.now(),
  };
  lobby.playerConnected = true;
  lobby.disconnectedAt = null;

  // Update phase if host already finished setup
  if (lobby.hostAnswers.length === 10 && lobby.phase === "HOST_SETUP") {
    lobby.phase = "READY_TO_START";
  }

  socketToLobby.set(playerId, { code, role: "player" });

  const tokens = lobbyTokens.get(code);
  if (tokens) {
    tokens.playerToken = playerToken;
  }

  return { lobby, playerToken };
}

// Get lobby by code
export function getLobby(code: string): Lobby | null {
  return lobbies.get(code) || null;
}

// Get lobby by socket ID
export function getLobbyBySocketId(
  socketId: string
): { lobby: Lobby; role: "host" | "player" } | null {
  const mapping = socketToLobby.get(socketId);
  if (!mapping) return null;

  const lobby = lobbies.get(mapping.code);
  if (!lobby) return null;

  return { lobby, role: mapping.role };
}

// Validate session token
export function validateToken(code: string, role: "host" | "player", token: string): boolean {
  const tokens = lobbyTokens.get(code);
  if (!tokens) return false;

  if (role === "host") {
    return tokens.hostToken === token;
  } else {
    return tokens.playerToken === token;
  }
}

// Select question pack (only allowed before setup starts)
export function selectPack(code: string, packId: string): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;

  // Only allow pack selection in WAITING_FOR_PLAYERS phase with no answers
  if (lobby.phase !== "WAITING_FOR_PLAYERS") return null;
  if (lobby.hostAnswers.length > 0) return null;

  const questions = getQuestionsForPack(packId);
  if (questions.length !== 10) return null; // Ensure exactly 10 questions

  lobby.packId = packId;
  lobby.questions = questions;
  lobby.questionIds = questions.map((q) => q.id);

  return lobby;
}

// Set host answer with bounds checking
export function setHostAnswer(
  code: string,
  index: number,
  questionId: string,
  value: string
): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;
  if (lobby.phase !== "HOST_SETUP" && lobby.phase !== "WAITING_FOR_PLAYERS") return null;

  // Bounds check
  if (index < 0 || index >= lobby.questions.length) return null;

  // Verify questionId matches the question at this index
  if (lobby.questions[index]?.id !== questionId) return null;

  // Start host setup phase if not already
  if (lobby.phase === "WAITING_FOR_PLAYERS") {
    lobby.phase = "HOST_SETUP";
  }

  // Sanitize value
  const sanitizedValue = value.trim().slice(0, 200);

  // Find or create the answer
  const existingIndex = lobby.hostAnswers.findIndex(
    (a) => a.questionId === questionId
  );
  const answer: HostAnswer = { questionId, value: sanitizedValue };

  if (existingIndex >= 0) {
    lobby.hostAnswers[existingIndex] = answer;
  } else {
    lobby.hostAnswers.push(answer);
  }

  return lobby;
}

// Complete host setup
export function completeHostSetup(code: string): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;
  if (lobby.phase !== "HOST_SETUP") return null;
  if (lobby.hostAnswers.length !== 10) return null;

  lobby.phase = lobby.player && lobby.playerConnected ? "READY_TO_START" : "WAITING_FOR_PLAYERS";
  return lobby;
}

// Start the game
export function startGame(code: string): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;
  if (!lobby.player || !lobby.playerConnected) return null;
  if (lobby.hostAnswers.length !== 10) return null;
  if (lobby.phase !== "READY_TO_START") return null;

  lobby.phase = "IN_PROGRESS";
  lobby.currentIndex = 0;
  lobby.playerAnswers = [];
  lobby.verdicts = [];
  lobby.questionStartAt = Date.now();

  return lobby;
}

// Update player draft (for live typing)
export function updatePlayerDraft(
  code: string,
  index: number,
  text: string
): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;
  if (lobby.phase !== "IN_PROGRESS") return null;
  if (index !== lobby.currentIndex) return null;

  // Bounds check
  if (index < 0 || index >= lobby.questions.length) return null;

  const question = lobby.questions[index];
  if (!question) return null;

  // Sanitize text
  const sanitizedText = text.slice(0, 200);

  const existingIndex = lobby.playerAnswers.findIndex(
    (a) => a.questionId === question.id
  );

  if (existingIndex >= 0) {
    lobby.playerAnswers[existingIndex].liveDraft = sanitizedText;
  } else {
    lobby.playerAnswers.push({
      questionId: question.id,
      value: "",
      submittedAt: 0,
      timedOut: false,
      liveDraft: sanitizedText,
    });
  }

  return lobby;
}

// Submit player answer with double-submit prevention
export function submitPlayerAnswer(
  code: string,
  index: number,
  value: string,
  timedOut: boolean = false
): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;
  if (lobby.phase !== "IN_PROGRESS") return null;
  if (index !== lobby.currentIndex) return null;

  // Bounds check
  if (index < 0 || index >= lobby.questions.length) return null;

  const question = lobby.questions[index];
  if (!question) return null;

  // Check if already submitted (prevent double-submit)
  const existingAnswer = lobby.playerAnswers.find(
    (a) => a.questionId === question.id && a.submittedAt > 0
  );
  if (existingAnswer) {
    // Already submitted, transition to judging anyway
    lobby.phase = "JUDGING";
    lobby.questionStartAt = null;
    return lobby;
  }

  // Sanitize value
  const sanitizedValue = timedOut ? "" : value.trim().slice(0, 200);

  const answer: PlayerAnswer = {
    questionId: question.id,
    value: sanitizedValue,
    submittedAt: Date.now(),
    timedOut,
  };

  // Find or create the answer
  const existingIndex = lobby.playerAnswers.findIndex(
    (a) => a.questionId === question.id
  );
  if (existingIndex >= 0) {
    lobby.playerAnswers[existingIndex] = answer;
  } else {
    lobby.playerAnswers.push(answer);
  }

  lobby.phase = "JUDGING";
  lobby.questionStartAt = null;

  return lobby;
}

// Judge an answer
export function judgeAnswer(
  code: string,
  index: number,
  isCorrect: boolean
): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;
  if (lobby.phase !== "JUDGING") return null;
  if (index !== lobby.currentIndex) return null;

  // Bounds check
  if (index < 0 || index >= lobby.questions.length) return null;

  const question = lobby.questions[index];
  if (!question) return null;

  // Check if already judged (prevent double-judge)
  const existingVerdict = lobby.verdicts.find((v) => v.index === index);
  if (existingVerdict) return lobby; // Already judged, return current state

  const verdict: Verdict = {
    questionId: question.id,
    index,
    isCorrect,
    judgedAt: Date.now(),
  };

  lobby.verdicts.push(verdict);

  // Move to next question or finish
  if (index >= 9) {
    lobby.phase = "FINISHED";
    lobby.questionStartAt = null;
  } else {
    lobby.currentIndex++;
    lobby.phase = "IN_PROGRESS";
    lobby.questionStartAt = Date.now();
  }

  return lobby;
}

// Restart game (same lobby, reset state, optionally with new questions)
export function restartGame(code: string, newPackId?: string): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;

  // Optionally change pack
  if (newPackId && newPackId !== lobby.packId) {
    const questions = getQuestionsForPack(newPackId);
    if (questions.length === 10) {
      lobby.packId = newPackId;
      lobby.questions = questions;
      lobby.questionIds = questions.map((q) => q.id);
    }
  }

  lobby.phase = "HOST_SETUP";
  lobby.currentIndex = 0;
  lobby.hostAnswers = [];
  lobby.playerAnswers = [];
  lobby.verdicts = [];
  lobby.questionStartAt = null;
  lobby.disconnectedAt = null;

  return lobby;
}

// Handle disconnect
export function handleDisconnect(socketId: string): {
  lobby: Lobby;
  role: "host" | "player";
} | null {
  const mapping = socketToLobby.get(socketId);
  if (!mapping) return null;

  const lobby = lobbies.get(mapping.code);
  if (!lobby) return null;

  if (mapping.role === "host") {
    lobby.hostConnected = false;
  } else {
    lobby.playerConnected = false;
  }

  // Pause timer if in progress and store pause timestamp
  if (lobby.phase === "IN_PROGRESS" && lobby.questionStartAt && !lobby.disconnectedAt) {
    lobby.disconnectedAt = Date.now();
  }

  socketToLobby.delete(socketId);

  return { lobby, role: mapping.role };
}

// Handle reconnect with token validation
export function handleReconnect(
  code: string,
  socketId: string,
  role: "host" | "player",
  token?: string
): Lobby | null {
  const lobby = lobbies.get(code);
  if (!lobby) return null;

  // Validate token if provided
  if (token && !validateToken(code, role, token)) {
    return null;
  }

  if (role === "host") {
    if (!lobby.host) return null;
    lobby.host.id = socketId;
    lobby.hostConnected = true;
  } else {
    if (!lobby.player) return null;
    lobby.player.id = socketId;
    lobby.playerConnected = true;
  }

  socketToLobby.set(socketId, { code, role });

  // Resume timer if both connected and was paused
  if (lobby.hostConnected && lobby.playerConnected && lobby.disconnectedAt && lobby.questionStartAt) {
    // Calculate how much time was paused
    const pauseDuration = Date.now() - lobby.disconnectedAt;
    // Move questionStartAt forward by pause duration to preserve remaining time
    lobby.questionStartAt = lobby.questionStartAt + pauseDuration;
    lobby.disconnectedAt = null;
  }

  return lobby;
}

// Leave lobby
export function leaveLobby(socketId: string): Lobby | null {
  const result = handleDisconnect(socketId);
  return result?.lobby || null;
}

// Cleanup old lobbies (call periodically)
export function cleanupOldLobbies(): number {
  const config = getConfig();
  const now = Date.now();
  let cleaned = 0;

  for (const [code, lobby] of lobbies) {
    // Clean up if old OR if both players disconnected for too long
    const isOld = now - lobby.createdAt > config.LOBBY_TTL_MS;
    const bothDisconnected = !lobby.hostConnected && !lobby.playerConnected;
    const disconnectedTooLong = lobby.disconnectedAt && (now - lobby.disconnectedAt > config.DISCONNECT_TTL_MS);

    if (isOld || (bothDisconnected && disconnectedTooLong)) {
      lobbies.delete(code);
      lobbyTokens.delete(code);
      logger.lobby("cleaned", code, { reason: isOld ? "expired" : "disconnected" });
      cleaned++;
    }
  }

  // Clean up stale socket mappings
  for (const [socketId, mapping] of socketToLobby) {
    if (!lobbies.has(mapping.code)) {
      socketToLobby.delete(socketId);
    }
  }

  if (cleaned > 0) {
    logger.info("Lobby cleanup completed", { cleaned, remaining: lobbies.size });
  }

  return cleaned;
}

// Get lobby count (for monitoring)
export function getLobbyCount(): number {
  return lobbies.size;
}
