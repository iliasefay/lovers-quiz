"use client";

interface TimerProps {
  seconds: number | null;
  total: number;
}

export default function Timer({ seconds, total }: TimerProps) {
  if (seconds === null) return null;

  const percentage = (seconds / total) * 100;
  const isLow = seconds <= 5;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Time remaining</span>
        <span
          className={`text-xl font-bold ${
            isLow ? "text-red-500 animate-pulse" : "text-pink-500"
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isLow
              ? "bg-red-500"
              : percentage > 50
              ? "bg-pink-500"
              : "bg-orange-400"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
