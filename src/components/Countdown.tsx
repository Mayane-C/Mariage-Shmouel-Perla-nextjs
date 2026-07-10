'use client';

import { useEffect, useState } from 'react';
import { content } from '@/lib/content';

function computeDiff(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

export function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const target = new Date(content.dateISO).getTime();
    setT(computeDiff(target));
    const id = setInterval(() => setT(computeDiff(target)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-countdown">
      <p className="script-label">Se marient dans</p>
      <div className="countdown" aria-live="polite">
        <div className="cell">
          <span className="num">{pad(t.d)}</span>
          <span className="unit">jours</span>
        </div>
        <div className="cell">
          <span className="num">{pad(t.h)}</span>
          <span className="unit">heures</span>
        </div>
        <div className="cell">
          <span className="num">{pad(t.m)}</span>
          <span className="unit">min</span>
        </div>
        <div className="cell">
          <span className="num">{pad(t.s)}</span>
          <span className="unit">sec</span>
        </div>
      </div>
    </div>
  );
}
