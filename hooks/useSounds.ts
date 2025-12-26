"use client";

import { useCallback, useRef, useEffect, useState } from "react";

// Simple sound effects using Web Audio API oscillators
// No external files needed - generates tones programmatically

type SoundType = "correct" | "incorrect" | "tick" | "submit" | "celebration";

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const SOUNDS: Record<SoundType, SoundConfig[]> = {
  correct: [
    { frequency: 523.25, duration: 0.1, type: "sine", volume: 0.3 }, // C5
    { frequency: 659.25, duration: 0.1, type: "sine", volume: 0.3 }, // E5
    { frequency: 783.99, duration: 0.2, type: "sine", volume: 0.3 }, // G5
  ],
  incorrect: [
    { frequency: 311.13, duration: 0.15, type: "sine", volume: 0.3 }, // Eb4
    { frequency: 261.63, duration: 0.3, type: "sine", volume: 0.3 },  // C4
  ],
  tick: [
    { frequency: 800, duration: 0.05, type: "sine", volume: 0.1 },
  ],
  submit: [
    { frequency: 440, duration: 0.08, type: "sine", volume: 0.2 },
    { frequency: 554.37, duration: 0.08, type: "sine", volume: 0.2 },
  ],
  celebration: [
    { frequency: 523.25, duration: 0.1, type: "sine", volume: 0.3 },
    { frequency: 659.25, duration: 0.1, type: "sine", volume: 0.3 },
    { frequency: 783.99, duration: 0.1, type: "sine", volume: 0.3 },
    { frequency: 1046.5, duration: 0.3, type: "sine", volume: 0.3 },
  ],
};

// Storage key for mute preference
const MUTE_KEY = "lovelobby_muted";

export function useSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  // Load mute preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MUTE_KEY);
      if (stored === "true") {
        setMuted(true);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Get or create audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a sequence of notes
  const playSound = useCallback((type: SoundType) => {
    if (muted) return;

    try {
      const ctx = getAudioContext();
      const notes = SOUNDS[type];
      let startTime = ctx.currentTime;

      notes.forEach((note) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.frequency, startTime);

        gainNode.gain.setValueAtTime(note.volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);

        startTime += note.duration;
      });
    } catch {
      // Audio not supported or blocked
    }
  }, [muted, getAudioContext]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem(MUTE_KEY, String(newValue));
      } catch {
        // localStorage not available
      }
      return newValue;
    });
  }, []);

  return {
    playSound,
    muted,
    toggleMute,
  };
}

export default useSounds;
