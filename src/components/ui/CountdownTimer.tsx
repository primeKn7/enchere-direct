"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function computeTimeLeft(endDate: string): TimeLeft {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer({ endDate }: { endDate: string }) {
  const [time, setTime] = useState<TimeLeft>(() => computeTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => setTime(computeTimeLeft(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (time.expired) {
    return (
      <div className="flex items-center gap-1">
        <div className="countdown-block" style={{ background: "var(--danger)", minWidth: "auto", padding: "8px 20px" }}>
          <span className="value" style={{ fontSize: "16px" }}>TERMINÉ</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="countdown-block">
        <span className="value">{pad(time.hours)}</span>
        <span className="label">Heures</span>
      </div>
      <span className="text-[20px] font-bold" style={{ color: "var(--ink-muted)" }}>:</span>
      <div className="countdown-block">
        <span className="value">{pad(time.minutes)}</span>
        <span className="label">Min</span>
      </div>
      <span className="text-[20px] font-bold" style={{ color: "var(--ink-muted)" }}>:</span>
      <div className="countdown-block">
        <span className="value">{pad(time.seconds)}</span>
        <span className="label">Sec</span>
      </div>
    </div>
  );
}
