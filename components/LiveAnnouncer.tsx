"use client";

import { useEffect, useState, useRef } from "react";

interface LiveAnnouncerProps {
  message: string;
  politeness?: "polite" | "assertive";
}

// Component for screen reader announcements
export default function LiveAnnouncer({
  message,
  politeness = "polite",
}: LiveAnnouncerProps) {
  const [announcement, setAnnouncement] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (message) {
      // Clear previous announcement first
      setAnnouncement("");

      // Set new announcement after a brief delay to ensure it's read
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setAnnouncement(message);
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
