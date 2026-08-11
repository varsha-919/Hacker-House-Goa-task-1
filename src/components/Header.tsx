import React from 'react';

export function Header() {
  return (
    <header className="relative z-10 px-5 sm:px-8 pt-6 pb-3">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sun flex items-center justify-center">
            <span
              className="text-ink"
              style={{
                fontFamily: 'Anton, Impact, sans-serif',
                fontSize: 22,
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              HH
            </span>
          </div>
          <div className="leading-tight">
            <div
              className="text-cream"
              style={{
                fontFamily: 'Anton, Impact, sans-serif',
                fontSize: 18,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              HACKER HOUSE
            </div>
            <div
              className="text-sun"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.24em',
                marginTop: 2,
              }}
            >
              GOA · 2026
            </div>
          </div>
        </div>
        <a
          href="https://twitter.com/search?q=%23FrameInGoa"
          target="_blank"
          rel="noreferrer"
          className="pill text-cream/80 hover:text-cream hover:border-cream/40"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
          #FrameInGoa
        </a>
      </div>
    </header>
  );
}
