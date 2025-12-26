"use client";

import { useState, useMemo } from "react";
import { useSocket } from "@/contexts/SocketContext";
import QuestionCard from "@/components/QuestionCard";

export default function HostSetupScreen() {
  const { lobby, setHostAnswer, completeHostSetup } = useSocket();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build a set of answered question IDs for quick lookup
  const answeredIds = useMemo(() => {
    if (!lobby) return new Set<string>();
    return new Set(lobby.hostAnswers.map((a) => a.questionId));
  }, [lobby?.hostAnswers, lobby]);

  if (!lobby) return null;

  const currentQuestion = lobby.questions[currentIndex];
  const answeredCount = lobby.hostAnswers.length;
  const isComplete = answeredCount === 10;

  // Get the current answer if already set
  const currentAnswer = lobby.hostAnswers.find(
    (a) => a.questionId === currentQuestion?.id
  );

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;

    setHostAnswer(currentIndex, currentQuestion.id, value);

    // Auto-advance to next unanswered question
    if (currentIndex < 9) {
      // Find next unanswered question
      let nextIndex = currentIndex + 1;
      while (nextIndex < 10 && answeredIds.has(lobby.questions[nextIndex]?.id)) {
        nextIndex++;
      }
      // If all remaining are answered, just go to next
      if (nextIndex >= 10) {
        nextIndex = currentIndex + 1;
      }
      setTimeout(() => setCurrentIndex(nextIndex < 10 ? nextIndex : 9), 300);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < 9) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Custom progress indicator for setup
  const SetupProgress = () => (
    <div className="flex justify-center gap-2 my-4">
      {Array.from({ length: 10 }).map((_, i) => {
        const question = lobby.questions[i];
        const isAnswered = question && answeredIds.has(question.id);
        const isCurrent = i === currentIndex;

        let heartClass = "text-gray-300"; // unanswered
        if (isAnswered) {
          heartClass = "text-pink-500"; // answered
        } else if (isCurrent) {
          heartClass = "text-pink-400 animate-pulse"; // current
        }

        return (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`text-2xl transition-all duration-300 hover:scale-110 ${heartClass}`}
          >
            {isAnswered ? "💕" : "🤍"}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-xl font-bold text-gray-800">Answer About Yourself</h1>
        <p className="text-gray-500 text-sm">
          Your partner will try to guess these answers!
        </p>
      </div>

      {/* Progress */}
      <SetupProgress />

      {/* Question counter */}
      <div className="text-center text-sm text-gray-500 mb-4">
        {answeredCount}/10 answered
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        {!isComplete && currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            onAnswer={handleAnswer}
            initialValue={currentAnswer?.value || ""}
            showSubmit={currentQuestion.type === "TEXT"}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg mx-auto text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              All Done!
            </h2>
            <p className="text-gray-600 mb-6">
              You&apos;ve answered all 10 questions. Ready to see how well your
              partner knows you?
            </p>
            <button
              onClick={completeHostSetup}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold text-lg hover:from-pink-600 hover:to-rose-600 transition-all"
            >
              I&apos;m Ready!
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {!isComplete && (
        <div className="flex justify-between items-center py-4 max-w-lg mx-auto w-full">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const question = lobby.questions[i];
              const isAnswered = question && answeredIds.has(question.id);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === currentIndex
                      ? "bg-pink-500 scale-125"
                      : isAnswered
                      ? "bg-pink-300"
                      : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
          <button
            onClick={handleNext}
            disabled={currentIndex === 9}
            className="px-6 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
