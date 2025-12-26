import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Lobby,
} from "../lib/types";
import {
  CreateLobbySchema,
  JoinLobbySchema,
  SelectPackSchema,
  HostAnswerSchema,
  PlayerDraftSchema,
  PlayerAnswerSchema,
  JudgeSchema,
  ReconnectSchema,
  validatePayload,
} from "../lib/schemas";
import * as lobbyStore from "../lib/lobbyStore";
import { getConfig } from "../lib/env";
import logger from "../lib/logger";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Timer tracking for each lobby (question timer)
const lobbyTimers = new Map<string, NodeJS.Timeout>();

// Judging timeout tracking (auto-accept if host doesn't judge in time)
const judgingTimers = new Map<string, NodeJS.Timeout>();
const JUDGING_TIMEOUT_MS = 60000; // 60 seconds to judge

// Rate limiting: track last action time per socket
const lastActionTime = new Map<string, number>();
const RATE_LIMIT_MS = 100; // Minimum 100ms between actions

// Safe timer cleanup helper
function clearLobbyTimer(lobbyCode: string) {
  const timer = lobbyTimers.get(lobbyCode);
  if (timer) {
    clearInterval(timer);
    lobbyTimers.delete(lobbyCode);
  }
}

// Safe judging timer cleanup helper
function clearJudgingTimer(lobbyCode: string) {
  const timer = judgingTimers.get(lobbyCode);
  if (timer) {
    clearTimeout(timer);
    judgingTimers.delete(lobbyCode);
  }
}

// Rate limit check
function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const last = lastActionTime.get(socketId) || 0;
  if (now - last < RATE_LIMIT_MS) {
    return true;
  }
  lastActionTime.set(socketId, now);
  return false;
}

export function initSocketServer(httpServer: HttpServer) {
  const config = getConfig();

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.ALLOWED_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socketio",
  });

  logger.info("Socket.IO server initialized", {
    env: config.NODE_ENV,
    corsOrigin: config.NODE_ENV === "production" ? config.ALLOWED_ORIGIN : "*"
  });

  // Broadcast lobby state to all participants
  function broadcastLobbyState(lobby: Lobby) {
    io.to(lobby.code).emit("lobby:state", lobby);
  }

  // Start timer for current question
  function startQuestionTimer(lobby: Lobby) {
    // Clear existing timer safely
    clearLobbyTimer(lobby.code);

    const timer = setInterval(() => {
      const currentLobby = lobbyStore.getLobby(lobby.code);
      if (!currentLobby || currentLobby.phase !== "IN_PROGRESS") {
        clearLobbyTimer(lobby.code);
        return;
      }

      // Check if paused due to disconnect
      if (currentLobby.disconnectedAt) {
        return; // Don't tick, just wait
      }

      if (!currentLobby.questionStartAt) {
        clearLobbyTimer(lobby.code);
        return;
      }

      const elapsed = (Date.now() - currentLobby.questionStartAt) / 1000;
      const secondsLeft = Math.max(
        0,
        currentLobby.perQuestionSeconds - Math.floor(elapsed)
      );

      // Send timer to both players so they're in sync
      io.to(lobby.code).emit("timer:tick", { secondsLeft });

      // Auto-submit on timeout
      if (secondsLeft <= 0) {
        clearLobbyTimer(lobby.code);

        const updatedLobby = lobbyStore.submitPlayerAnswer(
          lobby.code,
          currentLobby.currentIndex,
          "",
          true
        );
        if (updatedLobby) {
          broadcastLobbyState(updatedLobby);
        }
      }
    }, 1000);

    lobbyTimers.set(lobby.code, timer);
  }

  io.on("connection", (socket: TypedSocket) => {
    logger.debug("Client connected", { socketId: socket.id });

    // Create lobby
    socket.on("lobby:create", (payload) => {
      if (isRateLimited(socket.id)) return;

      const validation = validatePayload(CreateLobbySchema, payload);
      if (!validation.success) {
        socket.emit("lobby:error", validation.error);
        return;
      }

      const result = lobbyStore.createLobby(socket.id, validation.data.hostName);
      if (!result) {
        socket.emit("lobby:error", "Server is at capacity. Please try again later.");
        return;
      }

      socket.join(result.lobby.code);
      socket.emit("lobby:created", {
        code: result.lobby.code,
        lobby: result.lobby,
        token: result.hostToken
      });
      logger.socket("lobby:created", "out", { lobbyCode: result.lobby.code });
    });

    // Join lobby
    socket.on("lobby:join", (payload) => {
      if (isRateLimited(socket.id)) return;

      const validation = validatePayload(JoinLobbySchema, payload);
      if (!validation.success) {
        socket.emit("lobby:error", validation.error);
        return;
      }

      // Check if lobby exists first
      const existingLobby = lobbyStore.getLobby(validation.data.code);
      if (!existingLobby) {
        socket.emit("lobby:error", "Lobby not found. Check the code and try again.");
        return;
      }

      if (existingLobby.player && existingLobby.playerConnected) {
        socket.emit("lobby:error", "Lobby is full. Someone else already joined.");
        return;
      }

      const result = lobbyStore.joinLobby(
        validation.data.code,
        socket.id,
        validation.data.playerName
      );

      if (!result) {
        socket.emit("lobby:error", "Could not join lobby. Please try again.");
        return;
      }

      socket.join(result.lobby.code);
      socket.emit("lobby:joined", { lobby: result.lobby, token: result.playerToken });
      broadcastLobbyState(result.lobby);
    });

    // Reconnect to existing lobby
    socket.on("lobby:reconnect", (payload) => {
      if (isRateLimited(socket.id)) return;

      const validation = validatePayload(ReconnectSchema, payload);
      if (!validation.success) {
        socket.emit("lobby:error", validation.error);
        return;
      }

      const lobby = lobbyStore.handleReconnect(
        validation.data.code,
        socket.id,
        validation.data.role,
        validation.data.token
      );

      if (!lobby) {
        socket.emit("lobby:error", "Could not reconnect. Lobby may have expired.");
        return;
      }

      socket.join(lobby.code);
      // Token is guaranteed to exist here since handleReconnect validates it
      socket.emit("lobby:joined", { lobby, token: validation.data.token || "" });

      // Resume timer if game was in progress and both connected
      if (
        lobby.phase === "IN_PROGRESS" &&
        lobby.hostConnected &&
        lobby.playerConnected &&
        !lobbyTimers.has(lobby.code)
      ) {
        startQuestionTimer(lobby);
      }

      broadcastLobbyState(lobby);
    });

    // Leave lobby
    socket.on("lobby:leave", () => {
      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (result) {
        socket.leave(result.lobby.code);
        // Clear timer if host leaves
        if (result.role === "host") {
          clearLobbyTimer(result.lobby.code);
        }
      }
      const lobby = lobbyStore.leaveLobby(socket.id);
      if (lobby) {
        broadcastLobbyState(lobby);
      }
    });

    // Select pack (host only, only before setup starts)
    socket.on("pack:select", (payload) => {
      if (isRateLimited(socket.id)) return;

      const validation = validatePayload(SelectPackSchema, payload);
      if (!validation.success) {
        socket.emit("lobby:error", validation.error);
        return;
      }

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "host") {
        socket.emit("lobby:error", "Not authorized");
        return;
      }

      const lobby = lobbyStore.selectPack(result.lobby.code, validation.data.packId);
      if (lobby) {
        broadcastLobbyState(lobby);
      } else {
        socket.emit("lobby:error", "Cannot change pack now. Start fresh if needed.");
      }
    });

    // Set host answer
    socket.on("host:answer:set", (payload) => {
      if (isRateLimited(socket.id)) return;

      const validation = validatePayload(HostAnswerSchema, payload);
      if (!validation.success) {
        socket.emit("lobby:error", validation.error);
        return;
      }

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "host") {
        socket.emit("lobby:error", "Not authorized");
        return;
      }

      const lobby = lobbyStore.setHostAnswer(
        result.lobby.code,
        validation.data.index,
        validation.data.questionId,
        validation.data.value
      );
      if (lobby) {
        broadcastLobbyState(lobby);
      }
    });

    // Complete host setup
    socket.on("host:setup:complete", () => {
      if (isRateLimited(socket.id)) return;

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "host") {
        socket.emit("lobby:error", "Not authorized");
        return;
      }

      const lobby = lobbyStore.completeHostSetup(result.lobby.code);
      if (lobby) {
        broadcastLobbyState(lobby);
      } else {
        socket.emit("lobby:error", "Please answer all 10 questions first");
      }
    });

    // Start game (host only)
    socket.on("game:start", () => {
      if (isRateLimited(socket.id)) return;

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "host") {
        socket.emit("lobby:error", "Not authorized");
        return;
      }

      if (!result.lobby.player || !result.lobby.playerConnected) {
        socket.emit("lobby:error", "Waiting for player to connect");
        return;
      }

      const lobby = lobbyStore.startGame(result.lobby.code);
      if (lobby) {
        broadcastLobbyState(lobby);
        startQuestionTimer(lobby);
      } else {
        socket.emit("lobby:error", "Cannot start game yet. Complete setup first.");
      }
    });

    // Update player draft (for live typing)
    socket.on("player:draft:update", (payload) => {
      // No rate limit for drafts to allow smooth typing
      const validation = validatePayload(PlayerDraftSchema, payload);
      if (!validation.success) return;

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "player") return;

      // Don't send drafts if game isn't in progress
      if (result.lobby.phase !== "IN_PROGRESS") return;

      const lobby = lobbyStore.updatePlayerDraft(
        result.lobby.code,
        validation.data.index,
        validation.data.text
      );
      if (lobby && lobby.host && lobby.hostConnected) {
        // Send draft to host only
        io.to(lobby.host.id).emit("player:draft", {
          index: validation.data.index,
          text: validation.data.text,
        });
      }
    });

    // Submit player answer
    socket.on("player:answer:submit", (payload) => {
      if (isRateLimited(socket.id)) return;

      const validation = validatePayload(PlayerAnswerSchema, payload);
      if (!validation.success) {
        socket.emit("lobby:error", validation.error);
        return;
      }

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "player") {
        socket.emit("lobby:error", "Not authorized");
        return;
      }

      if (result.lobby.phase !== "IN_PROGRESS") {
        socket.emit("lobby:error", "Cannot submit answer now");
        return;
      }

      // Clear timer
      clearLobbyTimer(result.lobby.code);

      const lobby = lobbyStore.submitPlayerAnswer(
        result.lobby.code,
        validation.data.index,
        validation.data.value
      );
      if (lobby) {
        broadcastLobbyState(lobby);

        // Start judging timeout - auto-accept if host doesn't respond
        if (lobby.phase === "JUDGING") {
          clearJudgingTimer(lobby.code);
          const judgingTimer = setTimeout(() => {
            const currentLobby = lobbyStore.getLobby(lobby.code);
            if (currentLobby && currentLobby.phase === "JUDGING") {
              logger.info("Judging timeout - auto-accepting answer", { lobbyCode: lobby.code });
              const updatedLobby = lobbyStore.judgeAnswer(
                lobby.code,
                currentLobby.currentIndex,
                true // Auto-accept as correct
              );
              if (updatedLobby) {
                broadcastLobbyState(updatedLobby);
                if (updatedLobby.phase === "IN_PROGRESS") {
                  startQuestionTimer(updatedLobby);
                }
              }
            }
          }, JUDGING_TIMEOUT_MS);
          judgingTimers.set(lobby.code, judgingTimer);
        }
      }
    });

    // Judge answer (host only)
    socket.on("host:judge", (payload) => {
      if (isRateLimited(socket.id)) return;

      const validation = validatePayload(JudgeSchema, payload);
      if (!validation.success) {
        socket.emit("lobby:error", validation.error);
        return;
      }

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "host") {
        socket.emit("lobby:error", "Not authorized");
        return;
      }

      if (result.lobby.phase !== "JUDGING") {
        socket.emit("lobby:error", "Not in judging phase");
        return;
      }

      // Clear the judging timeout since host is responding
      clearJudgingTimer(result.lobby.code);

      const lobby = lobbyStore.judgeAnswer(
        result.lobby.code,
        validation.data.index,
        validation.data.isCorrect
      );

      if (lobby) {
        broadcastLobbyState(lobby);

        // Start timer for next question if not finished
        if (lobby.phase === "IN_PROGRESS") {
          startQuestionTimer(lobby);
        }
      }
    });

    // Restart game
    socket.on("game:restart", () => {
      if (isRateLimited(socket.id)) return;

      const result = lobbyStore.getLobbyBySocketId(socket.id);
      if (!result || result.role !== "host") {
        socket.emit("lobby:error", "Not authorized");
        return;
      }

      // Clear any existing timers
      clearLobbyTimer(result.lobby.code);
      clearJudgingTimer(result.lobby.code);

      const lobby = lobbyStore.restartGame(result.lobby.code);
      if (lobby) {
        broadcastLobbyState(lobby);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      logger.debug("Client disconnected", { socketId: socket.id });

      // Clean up rate limiting
      lastActionTime.delete(socket.id);

      const result = lobbyStore.handleDisconnect(socket.id);
      if (result) {
        logger.lobby("player disconnected", result.lobby.code, { role: result.role });
        // If game in progress and someone disconnected, pause timer
        if (result.lobby.phase === "IN_PROGRESS") {
          clearLobbyTimer(result.lobby.code);
        }
        broadcastLobbyState(result.lobby);
      }
    });
  });

  // Cleanup old lobbies every 2 minutes
  setInterval(() => {
    lobbyStore.cleanupOldLobbies();

    // Clean up stale timers
    for (const [code] of lobbyTimers) {
      if (!lobbyStore.getLobby(code)) {
        clearLobbyTimer(code);
      }
    }

    // Clean up stale judging timers
    for (const [code] of judgingTimers) {
      if (!lobbyStore.getLobby(code)) {
        clearJudgingTimer(code);
      }
    }

    // Clean up old rate limit entries
    const now = Date.now();
    for (const [socketId, time] of lastActionTime) {
      if (now - time > 60000) {
        lastActionTime.delete(socketId);
      }
    }
  }, 2 * 60 * 1000);

  return io;
}
