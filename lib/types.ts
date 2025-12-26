// LoveLobby - Shared Types

export type LobbyPhase =
  | "WAITING_FOR_PLAYERS"
  | "HOST_SETUP"
  | "READY_TO_START"
  | "IN_PROGRESS"
  | "JUDGING"
  | "FINISHED";

export type QuestionType = "TEXT" | "MULTI_CHOICE" | "THIS_OR_THAT" | "SCALE";

export type QuestionState = "UNANSWERED" | "ANSWERING" | "SUBMITTED" | "JUDGED";

export interface Participant {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  helper?: string;
  maxLen?: number;
}

export interface QuestionPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  questionIds: string[];
}

export interface HostAnswer {
  questionId: string;
  value: string;
}

export interface PlayerAnswer {
  questionId: string;
  value: string;
  submittedAt: number;
  timedOut: boolean;
  liveDraft?: string;
}

export interface Verdict {
  questionId: string;
  index: number;
  isCorrect: boolean;
  judgedAt: number;
}

export interface Lobby {
  code: string;
  createdAt: number;
  host: Participant | null;
  player: Participant | null;

  packId: string;
  questionIds: string[];
  questions: Question[];

  hostAnswers: HostAnswer[];
  playerAnswers: PlayerAnswer[];

  currentIndex: number;
  phase: LobbyPhase;

  perQuestionSeconds: number;
  questionStartAt: number | null;

  verdicts: Verdict[];

  // Connection tracking
  hostConnected: boolean;
  playerConnected: boolean;
  disconnectedAt: number | null;
}

// Socket event payloads
export interface CreateLobbyPayload {
  hostName: string;
}

export interface JoinLobbyPayload {
  code: string;
  playerName: string;
}

export interface SelectPackPayload {
  packId: string;
}

export interface HostAnswerPayload {
  index: number;
  questionId: string;
  value: string;
}

export interface PlayerDraftPayload {
  index: number;
  text: string;
}

export interface PlayerAnswerPayload {
  index: number;
  value: string;
}

export interface JudgePayload {
  index: number;
  isCorrect: boolean;
}

export interface ReconnectPayload {
  code: string;
  role: "host" | "player";
  token?: string;
}

// Client state
export interface ClientState {
  lobby: Lobby | null;
  role: "host" | "player" | null;
  error: string | null;
  connected: boolean;
}

// Socket events from server
export type ServerToClientEvents = {
  "lobby:state": (lobby: Lobby) => void;
  "lobby:error": (error: string) => void;
  "lobby:created": (data: { code: string; lobby: Lobby; token: string }) => void;
  "lobby:joined": (data: { lobby: Lobby; token: string }) => void;
  "timer:tick": (data: { secondsLeft: number }) => void;
  "player:draft": (data: { index: number; text: string }) => void;
};

// Socket events from client
export type ClientToServerEvents = {
  "lobby:create": (payload: CreateLobbyPayload) => void;
  "lobby:join": (payload: JoinLobbyPayload) => void;
  "lobby:reconnect": (payload: ReconnectPayload) => void;
  "lobby:leave": () => void;
  "pack:select": (payload: SelectPackPayload) => void;
  "host:answer:set": (payload: HostAnswerPayload) => void;
  "host:setup:complete": () => void;
  "game:start": () => void;
  "player:draft:update": (payload: PlayerDraftPayload) => void;
  "player:answer:submit": (payload: PlayerAnswerPayload) => void;
  "host:judge": (payload: JudgePayload) => void;
  "game:restart": () => void;
};
