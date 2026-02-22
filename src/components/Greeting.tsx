/**
 * Greeting.tsx
 *
 * Displays a time-appropriate greeting using the user's local hour.
 * Initialized on client only to avoid SSR hydration mismatch.
 *
 * 04:00 – 11:59 → Good morning
 * 12:00 – 17:59 → Good afternoon
 * 18:00 – 03:59 → Good evening
 */

"use client";

import { useEffect, useState } from "react";

function getGreeting(hour: number): string {
  if (hour >= 4 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Greeting() {
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    function update() {
      setGreeting(getGreeting(new Date().getHours()));
    }
    update();
    // Re-evaluate every minute in case the session crosses a time boundary
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!greeting) return null;

  return (
    <div className="px-6 py-4 border-b border-white/10">
      <p className="text-white/50 text-sm tracking-[0.25em] uppercase font-mono">
        {greeting},{" "}
        <span className="text-white font-bold tracking-widest">PETER</span>
      </p>
    </div>
  );
}
