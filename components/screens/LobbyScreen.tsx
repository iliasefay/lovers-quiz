"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import PackSelector from "@/components/PackSelector";

export default function LobbyScreen() {
  const {
    lobby,
    role,
    leaveLobby,
    selectPack,
    setHostAnswer,
    startGame,
  } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  if (!lobby) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(lobby.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waitingMessages = [
    "Patience is a virtue in love...",
    "Good things come to those who wait...",
    "They're on their way!",
    "Almost there...",
  ];

  const isHost = role === "host";
  const hasPlayer = !!lobby.player;
  const hostFinishedSetup = lobby.hostAnswers.length === 10;
  const canStart = isHost && hasPlayer && hostFinishedSetup;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">💕</div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isHost ? "Your Lobby" : "Joined Lobby"}
          </h1>
        </div>

        {/* Code display */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <p className="text-sm text-gray-500 text-center mb-2">Lobby Code</p>
          <button
            onClick={copyCode}
            className="w-full p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl text-4xl font-mono tracking-widest text-center text-pink-600 hover:from-pink-200 hover:to-rose-200 transition-all"
          >
            {lobby.code}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            {copied ? "Copied! 💕" : "Tap to copy"}
          </p>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h3 className="font-semibold text-gray-700 mb-4">Players</h3>
          <div className="space-y-3">
            {/* Host */}
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-bold">
                {lobby.host?.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {lobby.host?.name}
                  {isHost && " (You)"}
                </div>
                <div className="text-xs text-pink-500">Host</div>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  lobby.hostConnected ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            </div>

            {/* Player */}
            {lobby.player ? (
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                  {lobby.player.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {lobby.player.name}
                    {!isHost && " (You)"}
                  </div>
                  <div className="text-xs text-rose-500">Player</div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    lobby.playerConnected ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                  ?
                </div>
                <div className="flex-1">
                  <div className="text-gray-400">Waiting for partner...</div>
                  <div className="text-xs text-gray-400">
                    {
                      waitingMessages[
                        Math.floor(Math.random() * waitingMessages.length)
                      ]
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Host controls */}
        {isHost && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            {/* Pack selection */}
            {lobby.phase === "WAITING_FOR_PLAYERS" && lobby.hostAnswers.length === 0 && (
              <>
                <PackSelector
                  selectedPackId={lobby.packId}
                  onSelect={selectPack}
                />
                <button
                  onClick={() => {
                    // Start the host setup by answering the first question placeholder
                    // This triggers the transition to HOST_SETUP phase
                    const firstQuestion = lobby.questions[0];
                    if (firstQuestion) {
                      setHostAnswer(0, firstQuestion.id, "");
                    }
                  }}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold text-lg hover:from-pink-600 hover:to-rose-600 transition-all"
                >
                  Start Answering Questions ✏️
                </button>
              </>
            )}

            {/* Status messages */}
            {lobby.phase === "HOST_SETUP" && (
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <p className="text-yellow-700">
                  You&apos;re answering questions...
                </p>
                <p className="text-sm text-yellow-600">
                  {lobby.hostAnswers.length}/10 completed
                </p>
              </div>
            )}

            {lobby.phase === "READY_TO_START" && canStart && (
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all animate-pulse"
              >
                Start Game! 🎮
              </button>
            )}
          </div>
        )}

        {/* Player waiting state */}
        {!isHost && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="text-center">
              {lobby.phase === "WAITING_FOR_PLAYERS" && (
                <>
                  <div className="text-3xl mb-2 animate-bounce">⏳</div>
                  <p className="text-gray-600">
                    Waiting for host to set up questions...
                  </p>
                </>
              )}
              {lobby.phase === "HOST_SETUP" && (
                <>
                  <div className="text-3xl mb-2 animate-pulse">✏️</div>
                  <p className="text-gray-600">
                    {lobby.host?.name} is answering questions...
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Get ready to guess!
                  </p>
                </>
              )}
              {lobby.phase === "READY_TO_START" && (
                <>
                  <div className="text-3xl mb-2 animate-bounce">🎉</div>
                  <p className="text-gray-600">All set!</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Waiting for host to start the game...
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Leave button */}
        <button
          onClick={leaveLobby}
          className="w-full py-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          Leave Lobby
        </button>
      </div>
    </div>
  );
}
