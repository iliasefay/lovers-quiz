"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { useSocket } from "@/contexts/SocketContext";
import HeartProgress from "@/components/HeartProgress";

export default function ResultsScreen() {
  const { lobby, role, restartGame, leaveLobby } = useSocket();
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");

  // Fire confetti on mount
  useEffect(() => {
    const score = lobby?.verdicts.filter((v) => v.isCorrect).length || 0;

    // Different confetti based on score
    if (score >= 8) {
      // Amazing score - lots of confetti
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.6 },
        colors: ["#ff69b4", "#ff1493", "#ff6b6b", "#ffd93d"],
      });
    } else if (score >= 5) {
      // Good score - some confetti
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#ff69b4", "#ffd93d"],
      });
    } else {
      // Low score - sad confetti
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#9ca3af"],
      });
    }
  }, [lobby?.verdicts]);

  if (!lobby) return null;

  const isHost = role === "host";
  const score = lobby.verdicts.filter((v) => v.isCorrect).length;
  const total = 10;

  // Get message based on score
  const getMessage = () => {
    const percentage = (score / total) * 100;
    if (percentage >= 90)
      return { emoji: "🔥", title: "Perfect Match!", subtitle: "You two are soulmates!" };
    if (percentage >= 70)
      return { emoji: "💕", title: "Amazing!", subtitle: "You really know each other!" };
    if (percentage >= 50)
      return { emoji: "😊", title: "Not Bad!", subtitle: "Room to grow together!" };
    if (percentage >= 30)
      return { emoji: "🤔", title: "Hmm...", subtitle: "Time to talk more!" };
    return { emoji: "💔", title: "Uh Oh!", subtitle: "Maybe a second date?" };
  };

  const message = getMessage();

  // Generate share text
  const getShareText = useCallback(() => {
    const hearts = lobby.verdicts.map(v => v.isCorrect ? "💕" : "💔").join("");
    return `${message.emoji} ${lobby.host?.name} & ${lobby.player?.name} scored ${score}/${total} on LoveLobby!\n${hearts}\n\nHow well do you know YOUR partner? Try it at lovelobby.app`;
  }, [lobby, message.emoji, score, total]);

  // Handle share
  const handleShare = async () => {
    const shareText = getShareText();

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LoveLobby Results",
          text: shareText,
        });
        setShareStatus("shared");
        setTimeout(() => setShareStatus("idle"), 2000);
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Score display */}
      <div className="text-center mb-6">
        <div className="text-7xl mb-4">{message.emoji}</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {message.title}
        </h1>
        <p className="text-gray-500">{message.subtitle}</p>
      </div>

      {/* Score card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mb-6">
        <div className="text-center mb-6">
          <div className="text-6xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            {score}/{total}
          </div>
          <p className="text-gray-500 mt-2">Questions Correct</p>
        </div>

        {/* Heart progress */}
        <HeartProgress
          current={total}
          total={total}
          verdicts={lobby.verdicts}
        />

        {/* Breakdown */}
        <div className="mt-6 space-y-3 max-h-60 overflow-y-auto">
          {lobby.questions.map((question, i) => {
            const verdict = lobby.verdicts.find((v) => v.index === i);
            const hostAnswer = lobby.hostAnswers.find(
              (a) => a.questionId === question.id
            );
            const playerAnswer = lobby.playerAnswers.find(
              (a) => a.questionId === question.id
            );

            return (
              <div
                key={question.id}
                className={`p-3 rounded-xl ${
                  verdict?.isCorrect ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {verdict?.isCorrect ? "✅" : "❌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {question.prompt}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="text-pink-500">
                        {hostAnswer?.value}
                      </span>
                      {" vs "}
                      <span className="text-blue-500">
                        {playerAnswer?.timedOut
                          ? "(timed out)"
                          : playerAnswer?.value}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Players */}
      <div className="text-center text-gray-600 mb-6">
        <p>
          <span className="font-semibold text-pink-500">
            {lobby.host?.name}
          </span>{" "}
          &{" "}
          <span className="font-semibold text-rose-500">
            {lobby.player?.name}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3 w-full max-w-xs">
        {isHost && (
          <button
            onClick={restartGame}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
          >
            Play Again 🔄
          </button>
        )}
        <button
          onClick={leaveLobby}
          className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
        >
          Leave Lobby
        </button>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="mt-6 px-6 py-3 bg-white border-2 border-pink-300 text-pink-500 rounded-xl font-semibold hover:bg-pink-50 transition-all flex items-center gap-2"
      >
        {shareStatus === "copied" ? (
          <>Copied! ✓</>
        ) : shareStatus === "shared" ? (
          <>Shared! ✓</>
        ) : (
          <>Share Results 📤</>
        )}
      </button>

      <p className="text-center text-gray-400 text-xs mt-4">
        Challenge your friends to beat your score!
      </p>
    </div>
  );
}
