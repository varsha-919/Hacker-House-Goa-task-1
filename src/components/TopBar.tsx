// Top bar — sticky header used on BOTH the landing page and the
// generator view. Cream paper background with deep-green type and a
// pink-bordered yellow APPLY button.

import React from 'react';

type Props = {
  onHome?: () => void;
};

export function TopBar({ onHome }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-goa/95 backdrop-blur-sm border-b-2 border-ink/40">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-3 group focus:outline-none"
          aria-label={onHome ? 'Back to landing' : 'Hacker House Goa'}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-sun flex items-center justify-center border-2 border-ink transition-transform group-hover:scale-105">
            <span
              className="text-ink"
              style={{
                fontFamily: 'Anton, Impact, sans-serif',
                fontSize: 20,
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              HH
            </span>
          </div>
          <div className="leading-none flex items-center gap-2 sm:gap-3">
            <span
              className="hidden sm:inline-block text-cream"
              style={{
                fontFamily: 'Anton, Impact, sans-serif',
                fontSize: 18,
                letterSpacing: '0.02em',
              }}
            >
              HACKER HOUSE
            </span>
            <span
              className="hidden sm:inline-block w-1 h-1 rounded-full bg-pink"
              aria-hidden
            />
            <span
              className="text-sun font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: '0.22em',
              }}
            >
              2:47 PM STUDIO
            </span>
          </div>
        </button>

        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href=""
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 text-cream/80 hover:text-sun font-mono uppercase text-[11px] transition-colors"
            style={{ letterSpacing: '0.2em' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
            CHECK HYPE
          </a>
          <a
            href="#generate"
            target="_blank"
            rel="noreferrer"
            className="ticket-btn-tiny"
          >
            GENERATE ↗
          </a>
        </div>
      </div>
    </header>
  );
}
