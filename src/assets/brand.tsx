// Reusable brand SVGs for the event. These are typographic interpretations
// inspired by the reference poster — no fabricated logos.

import React from 'react';

export function HHLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Hacker House logo"
    >
      <rect x="2" y="2" width="96" height="96" rx="18" fill="#FFD23F" stroke="#0E2A1F" strokeWidth="4" />
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontFamily="Anton, Impact, sans-serif"
        fontSize="52"
        fill="#0E2A1F"
        letterSpacing="-2"
      >
        HH
      </text>
    </svg>
  );
}

export function CornerMark({ className = '', color = '#FFD23F' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M0 0 L40 0 L40 8 L8 8 L8 40 L0 40 Z" fill={color} />
    </svg>
  );
}

export function GeometricSun({ className = '', color = '#FFD23F' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="40" fill={color} />
      <g stroke={color} strokeWidth="8" strokeLinecap="round">
        <line x1="50" y1="2" x2="50" y2="14" />
        <line x1="50" y1="86" x2="50" y2="98" />
        <line x1="2" y1="50" x2="14" y2="50" />
        <line x1="86" y1="50" x2="98" y2="50" />
        <line x1="17" y1="17" x2="25" y2="25" />
        <line x1="75" y1="75" x2="83" y2="83" />
        <line x1="17" y1="83" x2="25" y2="75" />
        <line x1="75" y1="25" x2="83" y2="17" />
      </g>
    </svg>
  );
}
