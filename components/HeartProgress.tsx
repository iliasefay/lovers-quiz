"use client";

interface HeartProgressProps {
  current: number;
  total: number;
  verdicts?: { isCorrect: boolean }[];
  pendingJudgment?: boolean; // True when current question is awaiting judgment
}

export default function HeartProgress({
  current,
  total,
  verdicts = [],
  pendingJudgment = false,
}: HeartProgressProps) {
  return (
    <div className="flex justify-center gap-2 my-4">
      {Array.from({ length: total }).map((_, i) => {
        const verdict = verdicts[i];
        const isCurrent = i === current;
        const isPast = i < current;

        let heartClass = "text-gray-300"; // default empty/future
        let emoji = "🤍";

        if (verdict?.isCorrect === true) {
          heartClass = "text-pink-500"; // correct
          emoji = "💕";
        } else if (verdict?.isCorrect === false) {
          heartClass = "text-gray-400"; // incorrect
          emoji = "💔";
        } else if (isCurrent && pendingJudgment) {
          // Current question is pending judgment - show as submitted
          heartClass = "text-yellow-500 animate-pulse";
          emoji = "💛";
        } else if (isCurrent) {
          // Current question being answered
          heartClass = "text-pink-400 animate-pulse";
          emoji = "💗";
        } else if (isPast) {
          // Past but not yet judged (shouldn't happen normally)
          heartClass = "text-pink-300";
          emoji = "💕";
        }

        return (
          <span
            key={i}
            className={`text-2xl transition-all duration-300 ${heartClass}`}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}
