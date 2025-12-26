"use client";

import { useState, useEffect } from "react";
import { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  index: number;
  onAnswer: (value: string) => void;
  onDraftChange?: (text: string) => void;
  disabled?: boolean;
  initialValue?: string;
  showSubmit?: boolean;
}

export default function QuestionCard({
  question,
  index,
  onAnswer,
  onDraftChange,
  disabled = false,
  initialValue = "",
  showSubmit = true,
}: QuestionCardProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, question.id]);

  const handleTextChange = (text: string) => {
    setValue(text);
    onDraftChange?.(text);
  };

  const handleSubmit = () => {
    if (value.trim() || question.type !== "TEXT") {
      onAnswer(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && value.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOptionSelect = (option: string) => {
    setValue(option);
    onAnswer(option);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-lg mx-auto">
      <div className="text-sm text-pink-500 font-medium mb-2">
        Question {index + 1} of 10
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {question.prompt}
      </h2>

      {question.helper && (
        <p className="text-sm text-gray-500 mb-4 italic">{question.helper}</p>
      )}

      {/* TEXT input */}
      {question.type === "TEXT" && (
        <div className="space-y-4">
          <label htmlFor={`question-${question.id}`} className="sr-only">
            Your answer to: {question.prompt}
          </label>
          <textarea
            id={`question-${question.id}`}
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            disabled={disabled}
            maxLength={question.maxLen || 200}
            aria-label="Type your answer"
            dir="auto"
            className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none h-24 text-black placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
          />
          {showSubmit && (
            <button
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              aria-label="Submit your answer"
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-pink-300 focus:outline-none"
            >
              Submit Answer
            </button>
          )}
        </div>
      )}

      {/* THIS_OR_THAT / MULTI_CHOICE / SCALE */}
      {(question.type === "THIS_OR_THAT" ||
        question.type === "MULTI_CHOICE" ||
        question.type === "SCALE") &&
        question.options && (
          <div
            className={`grid gap-3 ${
              question.type === "SCALE" ? "grid-cols-5" : "grid-cols-1"
            }`}
          >
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                disabled={disabled}
                aria-pressed={value === option}
                aria-label={`Select ${option}`}
                className={`p-4 rounded-xl border-2 transition-all focus:ring-2 focus:ring-pink-300 focus:outline-none ${
                  value === option
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 hover:border-pink-300 text-gray-800"
                } ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-pink-50"
                } ${question.type === "SCALE" ? "text-lg font-bold" : ""}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
    </div>
  );
}
