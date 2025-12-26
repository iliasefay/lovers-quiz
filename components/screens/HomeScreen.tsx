"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function HomeScreen() {
  const { createLobby, joinLobby, connected, loading } = useSocket();
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleCreate = () => {
    if (name.trim()) {
      createLobby(name.trim());
    }
  };

  const handleJoin = () => {
    if (name.trim() && code.length === 5) {
      joinLobby(code, name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  const waitingMessages = [
    "Getting the love vibes ready...",
    "Preparing romantic questions...",
    "Shuffling the heart cards...",
  ];

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">💕</div>
          <p className="text-gray-600">
            {waitingMessages[Math.floor(Math.random() * waitingMessages.length)]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">💕</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            LoveLobby
          </h1>
          <p className="text-gray-600 mt-2">
            How well do you really know each other?
          </p>
        </div>

        {mode === "select" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-semibold text-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl"
            >
              Create Lobby
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full py-4 bg-white text-pink-500 border-2 border-pink-300 rounded-2xl font-semibold text-lg hover:bg-pink-50 transition-all"
            >
              Join Lobby
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <button
              onClick={() => setMode("select")}
              className="text-gray-400 hover:text-gray-600 mb-2"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              Create a New Lobby
            </h2>
            <p className="text-gray-500 text-sm">
              You&apos;ll be the host! Answer questions about yourself, then watch
              your partner try to guess.
            </p>
            <label htmlFor="create-name" className="sr-only">Your nickname</label>
            <input
              id="create-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleCreate)}
              placeholder="Your nickname"
              maxLength={20}
              aria-label="Enter your nickname"
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              aria-label="Create a new lobby"
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-pink-300 focus:outline-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                "Create Lobby"
              )}
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <button
              onClick={() => setMode("select")}
              aria-label="Go back to mode selection"
              className="text-gray-400 hover:text-gray-600 mb-2 focus:outline-none focus:text-pink-500"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              Join a Lobby
            </h2>
            <p className="text-gray-500 text-sm">
              Enter the 5-digit code from your partner to join their game!
            </p>
            <label htmlFor="join-name" className="sr-only">Your nickname</label>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your nickname"
              maxLength={20}
              aria-label="Enter your nickname"
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <label htmlFor="join-code" className="sr-only">5-digit lobby code</label>
            <input
              id="join-code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              onKeyDown={(e) => handleKeyDown(e, handleJoin)}
              placeholder="5-digit code"
              maxLength={5}
              aria-label="Enter 5-digit lobby code"
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 text-center text-2xl tracking-widest font-mono"
            />
            <button
              onClick={handleJoin}
              disabled={!name.trim() || code.length !== 5 || loading}
              aria-label="Join the lobby"
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-pink-300 focus:outline-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Joining...
                </>
              ) : (
                "Join Lobby"
              )}
            </button>
          </div>
        )}

        {/* Fun tagline */}
        <p className="text-center text-gray-400 text-sm mt-8">
          10 questions. Countless memories. One winner. 💝
        </p>
      </div>
    </div>
  );
}
