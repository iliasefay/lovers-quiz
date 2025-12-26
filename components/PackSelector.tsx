"use client";

import { questionPacks } from "@/lib/questionBank";

interface PackSelectorProps {
  selectedPackId: string;
  onSelect: (packId: string) => void;
  disabled?: boolean;
}

export default function PackSelector({
  selectedPackId,
  onSelect,
  disabled = false,
}: PackSelectorProps) {
  return (
    <div className="grid gap-3">
      <h3 className="text-lg font-semibold text-gray-700">
        Choose a Question Pack
      </h3>
      {questionPacks.map((pack) => (
        <button
          key={pack.id}
          onClick={() => onSelect(pack.id)}
          disabled={disabled}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            selectedPackId === pack.id
              ? "border-pink-500 bg-pink-50"
              : "border-gray-200 hover:border-pink-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{pack.emoji}</span>
            <div>
              <div className="font-semibold text-gray-800">{pack.name}</div>
              <div className="text-sm text-gray-600">{pack.description}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
