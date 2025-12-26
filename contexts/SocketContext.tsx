"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import {
  Lobby,
  ClientToServerEvents,
  ServerToClientEvents,
  CreateLobbyPayload,
  JoinLobbyPayload,
  SelectPackPayload,
  HostAnswerPayload,
  PlayerDraftPayload,
  PlayerAnswerPayload,
  JudgePayload,
  ReconnectPayload,
} from "@/lib/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Session storage keys for reconnection
const SESSION_KEY = "lovelobby_session";

interface SessionData {
  code: string;
  role: "host" | "player";
  token: string;
  timestamp: number;
}

interface SocketContextType {
  socket: TypedSocket | null;
  connected: boolean;
  loading: boolean;
  lobby: Lobby | null;
  role: "host" | "player" | null;
  error: string | null;
  secondsLeft: number | null;
  playerDraft: string;

  // Actions
  createLobby: (hostName: string) => void;
  joinLobby: (code: string, playerName: string) => void;
  leaveLobby: () => void;
  selectPack: (packId: string) => void;
  setHostAnswer: (index: number, questionId: string, value: string) => void;
  completeHostSetup: () => void;
  startGame: () => void;
  updatePlayerDraft: (index: number, text: string) => void;
  submitPlayerAnswer: (index: number, value: string) => void;
  judgeAnswer: (index: number, isCorrect: boolean) => void;
  restartGame: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// Helper to save session for reconnection
function saveSession(code: string, role: "host" | "player", token: string) {
  try {
    const data: SessionData = { code, role, token, timestamp: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage not available
  }
}

// Helper to get saved session
function getSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: SessionData = JSON.parse(raw);
    // Session expires after 30 minutes
    if (Date.now() - data.timestamp > 30 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Helper to clear session
function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage not available
  }
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [role, setRole] = useState<"host" | "player" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [playerDraft, setPlayerDraft] = useState("");

  // Track previous question index to reset draft
  const prevQuestionIndex = useRef<number>(-1);
  const hasAttemptedReconnect = useRef(false);

  // Reset playerDraft when question changes
  useEffect(() => {
    if (lobby && lobby.currentIndex !== prevQuestionIndex.current) {
      setPlayerDraft("");
      prevQuestionIndex.current = lobby.currentIndex;
    }
  }, [lobby?.currentIndex, lobby]);

  useEffect(() => {
    const socketInstance: TypedSocket = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);

      // Try to reconnect to existing session on connection
      if (!hasAttemptedReconnect.current) {
        hasAttemptedReconnect.current = true;
        const session = getSession();
        if (session && session.token) {
          console.log("Attempting to reconnect to session:", session.code);
          const payload: ReconnectPayload = {
            code: session.code,
            role: session.role,
            token: session.token,
          };
          socketInstance.emit("lobby:reconnect", payload);
        }
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    socketInstance.on("lobby:state", (lobbyData) => {
      setLobby(lobbyData);
      // Clear error on successful state update
    });

    socketInstance.on("lobby:error", (errorMessage) => {
      setError(errorMessage);
      setLoading(false);
      // If reconnect failed, clear the session
      if (errorMessage.includes("reconnect") || errorMessage.includes("expired")) {
        clearSession();
      }
    });

    socketInstance.on("lobby:created", ({ lobby: lobbyData, token }) => {
      setLobby(lobbyData);
      setRole("host");
      setError(null);
      setLoading(false);
      saveSession(lobbyData.code, "host", token);
    });

    socketInstance.on("lobby:joined", ({ lobby: lobbyData, token }) => {
      setLobby(lobbyData);
      setLoading(false);
      // Determine role based on session or fresh join
      const session = getSession();
      if (session && session.code === lobbyData.code) {
        // Reconnecting - keep existing role from session
        setRole(session.role);
        // Update token if provided (fresh reconnect)
        if (token) {
          saveSession(lobbyData.code, session.role, token);
        }
      } else {
        // Fresh join - we're the player
        setRole("player");
        saveSession(lobbyData.code, "player", token);
      }
      setError(null);
    });

    socketInstance.on("timer:tick", ({ secondsLeft: seconds }) => {
      setSecondsLeft(seconds);
    });

    socketInstance.on("player:draft", ({ text }) => {
      setPlayerDraft(text);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createLobby = useCallback(
    (hostName: string) => {
      if (socket) {
        setLoading(true);
        setError(null);
        const payload: CreateLobbyPayload = { hostName };
        socket.emit("lobby:create", payload);
      }
    },
    [socket]
  );

  const joinLobby = useCallback(
    (code: string, playerName: string) => {
      if (socket) {
        setLoading(true);
        setError(null);
        const payload: JoinLobbyPayload = { code, playerName };
        socket.emit("lobby:join", payload);
      }
    },
    [socket]
  );

  const leaveLobby = useCallback(() => {
    if (socket) {
      socket.emit("lobby:leave");
      setLobby(null);
      setRole(null);
      setSecondsLeft(null);
      setPlayerDraft("");
      clearSession();
    }
  }, [socket]);

  const selectPack = useCallback(
    (packId: string) => {
      if (socket) {
        const payload: SelectPackPayload = { packId };
        socket.emit("pack:select", payload);
      }
    },
    [socket]
  );

  const setHostAnswer = useCallback(
    (index: number, questionId: string, value: string) => {
      if (socket) {
        const payload: HostAnswerPayload = { index, questionId, value };
        socket.emit("host:answer:set", payload);
      }
    },
    [socket]
  );

  const completeHostSetup = useCallback(() => {
    if (socket) {
      socket.emit("host:setup:complete");
    }
  }, [socket]);

  const startGame = useCallback(() => {
    if (socket) {
      socket.emit("game:start");
    }
  }, [socket]);

  const updatePlayerDraft = useCallback(
    (index: number, text: string) => {
      if (socket) {
        const payload: PlayerDraftPayload = { index, text };
        socket.emit("player:draft:update", payload);
      }
    },
    [socket]
  );

  const submitPlayerAnswer = useCallback(
    (index: number, value: string) => {
      if (socket) {
        const payload: PlayerAnswerPayload = { index, value };
        socket.emit("player:answer:submit", payload);
        // Reset timer display after submit
        setSecondsLeft(null);
      }
    },
    [socket]
  );

  const judgeAnswer = useCallback(
    (index: number, isCorrect: boolean) => {
      if (socket) {
        const payload: JudgePayload = { index, isCorrect };
        socket.emit("host:judge", payload);
        // Reset player draft after judging
        setPlayerDraft("");
      }
    },
    [socket]
  );

  const restartGame = useCallback(() => {
    if (socket) {
      socket.emit("game:restart");
      setSecondsLeft(null);
      setPlayerDraft("");
    }
  }, [socket]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        loading,
        lobby,
        role,
        error,
        secondsLeft,
        playerDraft,
        createLobby,
        joinLobby,
        leaveLobby,
        selectPack,
        setHostAnswer,
        completeHostSetup,
        startGame,
        updatePlayerDraft,
        submitPlayerAnswer,
        judgeAnswer,
        restartGame,
        clearError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
