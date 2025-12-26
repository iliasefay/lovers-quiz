"use client";

import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import HomeScreen from "@/components/screens/HomeScreen";
import LobbyScreen from "@/components/screens/LobbyScreen";
import HostSetupScreen from "@/components/screens/HostSetupScreen";
import GameScreen from "@/components/screens/GameScreen";
import ResultsScreen from "@/components/screens/ResultsScreen";

export default function Home() {
  const { lobby, role, connected, error, clearError } = useSocket();

  // Auto-dismiss error toast with proper useEffect
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500 animate-pulse"
          }`}
        />
        {connected ? "Connected" : "Connecting..."}
      </div>
    </div>
  );

  // Error toast
  const ErrorToast = () =>
    error ? (
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg cursor-pointer"
        onClick={clearError}
      >
        {error}
      </div>
    ) : null;

  // Render based on lobby state and role
  const renderScreen = () => {
    // Not in a lobby yet - show home
    if (!lobby || !role) {
      return <HomeScreen />;
    }

    const { phase } = lobby;

    // Waiting for players / host setup
    if (phase === "WAITING_FOR_PLAYERS") {
      if (role === "host") {
        // Host can start setup or wait for player
        return lobby.hostAnswers.length > 0 ? (
          <HostSetupScreen />
        ) : (
          <LobbyScreen />
        );
      }
      return <LobbyScreen />;
    }

    // Host is setting up answers
    if (phase === "HOST_SETUP") {
      if (role === "host") {
        return <HostSetupScreen />;
      }
      return <LobbyScreen />;
    }

    // Ready to start
    if (phase === "READY_TO_START") {
      return <LobbyScreen />;
    }

    // Game in progress or judging
    if (phase === "IN_PROGRESS" || phase === "JUDGING") {
      return <GameScreen />;
    }

    // Game finished
    if (phase === "FINISHED") {
      return <ResultsScreen />;
    }

    // Default fallback
    return <HomeScreen />;
  };

  return (
    <main className="min-h-screen">
      <ConnectionStatus />
      <ErrorToast />
      {renderScreen()}
    </main>
  );
}
