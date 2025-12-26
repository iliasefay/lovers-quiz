"use client";

import { useMemo } from "react";
import { useSocket } from "@/contexts/SocketContext";
import QuestionCard from "@/components/QuestionCard";
import HeartProgress from "@/components/HeartProgress";
import Timer from "@/components/Timer";
import DisconnectBanner from "@/components/DisconnectBanner";
import LiveAnnouncer from "@/components/LiveAnnouncer";

export default function GameScreen() {
  const {
    lobby,
    role,
    secondsLeft,
    playerDraft,
    updatePlayerDraft,
    submitPlayerAnswer,
    judgeAnswer,
  } = useSocket();

  if (!lobby) return null;

  const isHost = role === "host";
  const isPlayer = role === "player";
  const currentQuestion = lobby.questions[lobby.currentIndex];
  const isJudging = lobby.phase === "JUDGING";

  // Check partner connection status
  const partnerName = isHost ? lobby.player?.name : lobby.host?.name;
  const isPartnerConnected = isHost ? lobby.playerConnected : lobby.hostConnected;
  const isPaused = lobby.disconnectedAt !== null;

  // Generate announcement for screen readers
  const announcement = useMemo(() => {
    if (isPaused) return "Game paused. Waiting for partner to reconnect.";
    if (isJudging && isPlayer) return `${lobby.host?.name} is judging your answer.`;
    if (isJudging && isHost) return "Time to judge the answer.";
    if (secondsLeft !== null && secondsLeft <= 5 && secondsLeft > 0) return `${secondsLeft} seconds remaining.`;
    if (secondsLeft === 0) return "Time is up!";
    return "";
  }, [isPaused, isJudging, isPlayer, isHost, lobby.host?.name, secondsLeft]);

  // Get host's answer for current question
  const hostAnswer = lobby.hostAnswers.find(
    (a) => a.questionId === currentQuestion?.id
  );

  // Get player's answer for current question
  const playerAnswer = lobby.playerAnswers.find(
    (a) => a.questionId === currentQuestion?.id
  );

  // Player view - answering questions
  if (isPlayer && !isJudging) {
    return (
      <div className={`min-h-screen flex flex-col p-4 ${isPaused ? "pt-16" : ""}`}>
        <LiveAnnouncer message={announcement} />
        <DisconnectBanner
          partnerName={partnerName || "Partner"}
          isPartnerConnected={isPartnerConnected}
        />
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-xl font-bold text-gray-800">
            Guess {lobby.host?.name}&apos;s Answer!
          </h1>
        </div>

        {/* Progress */}
        <HeartProgress
          current={lobby.currentIndex}
          total={10}
          verdicts={lobby.verdicts}
        />

        {/* Timer */}
        <div className="my-4">
          <Timer seconds={secondsLeft} total={lobby.perQuestionSeconds} />
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              index={lobby.currentIndex}
              onAnswer={(value) =>
                submitPlayerAnswer(lobby.currentIndex, value)
              }
              onDraftChange={(text) =>
                updatePlayerDraft(lobby.currentIndex, text)
              }
            />
          )}
        </div>
      </div>
    );
  }

  // Player view - waiting for judgment
  if (isPlayer && isJudging) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isPaused ? "pt-16" : ""}`}>
        <LiveAnnouncer message={announcement} />
        <DisconnectBanner
          partnerName={partnerName || "Partner"}
          isPartnerConnected={isPartnerConnected}
        />
        <HeartProgress
          current={lobby.currentIndex}
          total={10}
          verdicts={lobby.verdicts}
          pendingJudgment={true}
        />
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto text-center mt-8">
          <div className="text-5xl mb-4 animate-bounce">🤔</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {lobby.host?.name} is judging...
          </h2>
          <p className="text-gray-500">
            Did you get it right? The suspense!
          </p>

          {/* Show submitted answer */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">Your answer:</p>
            <p className="text-lg font-medium text-gray-800">
              {playerAnswer?.timedOut
                ? "(Time's up! No answer)"
                : playerAnswer?.value || "—"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Host view - watching player answer
  if (isHost && !isJudging) {
    return (
      <div className={`min-h-screen flex flex-col p-4 ${isPaused ? "pt-16" : ""}`}>
        <LiveAnnouncer message={announcement} />
        <DisconnectBanner
          partnerName={partnerName || "Partner"}
          isPartnerConnected={isPartnerConnected}
        />
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-xl font-bold text-gray-800">
            {lobby.player?.name} is answering...
          </h1>
        </div>

        {/* Progress */}
        <HeartProgress
          current={lobby.currentIndex}
          total={10}
          verdicts={lobby.verdicts}
        />

        {/* Timer */}
        <div className="my-4">
          <Timer seconds={secondsLeft} total={lobby.perQuestionSeconds} />
        </div>

        {/* Question and live typing */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-lg w-full space-y-4">
            {/* Question card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-sm text-pink-500 font-medium mb-2">
                Question {lobby.currentIndex + 1} of 10
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {currentQuestion?.prompt}
              </h2>

              {/* Your answer */}
              <div className="p-4 bg-pink-50 rounded-xl mb-4">
                <p className="text-sm text-pink-500 mb-1">Your answer:</p>
                <p className="text-lg font-medium text-gray-800">
                  {hostAnswer?.value || "—"}
                </p>
              </div>

              {/* Live typing preview */}
              {currentQuestion?.type === "TEXT" && (
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 mb-1">
                    {lobby.player?.name} is typing...
                  </p>
                  <p className="text-lg text-gray-600 min-h-[1.5rem]">
                    {playerDraft || (
                      <span className="text-gray-300 italic">
                        waiting for input...
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Host view - judging
  if (isHost && isJudging) {
    return (
      <div className={`min-h-screen flex flex-col p-4 ${isPaused ? "pt-16" : ""}`}>
        <LiveAnnouncer message={announcement} politeness="assertive" />
        <DisconnectBanner
          partnerName={partnerName || "Partner"}
          isPartnerConnected={isPartnerConnected}
        />
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-xl font-bold text-gray-800">Time to Judge!</h1>
          <p className="text-gray-500">Was {lobby.player?.name} close enough?</p>
        </div>

        {/* Progress */}
        <HeartProgress
          current={lobby.currentIndex}
          total={10}
          verdicts={lobby.verdicts}
          pendingJudgment={true}
        />

        {/* Judging card */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-sm text-pink-500 font-medium mb-2">
                Question {lobby.currentIndex + 1} of 10
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion?.prompt}
              </h2>

              {/* Answers comparison */}
              <div className="grid gap-4 mb-6">
                <div className="p-4 bg-pink-50 rounded-xl">
                  <p className="text-sm text-pink-500 mb-1">Your answer:</p>
                  <p className="text-lg font-medium text-gray-800">
                    {hostAnswer?.value || "—"}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-500 mb-1">
                    {lobby.player?.name}&apos;s guess:
                  </p>
                  <p className="text-lg font-medium text-gray-800">
                    {playerAnswer?.timedOut
                      ? "(Time's up! No answer submitted)"
                      : playerAnswer?.value || "—"}
                  </p>
                </div>
              </div>

              {/* Judgment buttons */}
              <div className="space-y-3">
                <p className="text-center text-sm text-gray-500 mb-2">
                  Close enough counts! 💛
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => judgeAnswer(lobby.currentIndex, true)}
                    className="py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all active:scale-95"
                  >
                    ✅ Correct!
                  </button>
                  <button
                    onClick={() => judgeAnswer(lobby.currentIndex, false)}
                    className="py-4 bg-gradient-to-r from-red-400 to-rose-400 text-white rounded-xl font-semibold text-lg hover:from-red-500 hover:to-rose-500 transition-all active:scale-95"
                  >
                    ❌ Nope
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
