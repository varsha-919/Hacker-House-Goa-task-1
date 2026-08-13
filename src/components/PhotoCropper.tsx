// PhotoCropper — clean controls for the user to dial in their photo's
// crop before generating the card. Pure presentational: it renders the
// current adjust values and fires onChange when the user moves sliders
// or presses a button.

import React from 'react';
import type { CropAdjust } from '../lib/image';

type Props = {
  adjust: CropAdjust;
  onChange: (a: CropAdjust) => void;
  onReset: () => void;
};

export function PhotoCropper({ adjust, onChange, onReset }: Props) {
  const setScale = (s: number) => onChange({ ...adjust, scale: s });
  const setX = (x: number) => onChange({ ...adjust, offsetX: x });
  const setY = (y: number) => onChange({ ...adjust, offsetY: y });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-mono font-bold uppercase tracking-super text-ink/70">
          Fit your photo
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-mono uppercase tracking-super text-ink/60 hover:text-pink transition-colors"
        >
          ↻ Reset
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-super text-ink/70">
            Zoom
          </span>
          <span className="text-[11px] font-mono text-pink">
            {adjust.scale.toFixed(2)}×
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale(Math.max(1, adjust.scale - 0.1))}
            className="w-8 h-8 rounded-full bg-cream border-2 border-ink text-ink font-bold text-base leading-none hover:bg-sun"
            aria-label="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={adjust.scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-sun h-1.5 cursor-pointer"
            style={{ touchAction: 'manipulation' }}
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => setScale(Math.min(3, adjust.scale + 0.1))}
            className="w-8 h-8 rounded-full bg-cream border-2 border-ink text-ink font-bold text-base leading-none hover:bg-sun"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-super text-ink/70">
            Position
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setX(Math.max(-1, adjust.offsetX - 0.1))}
              className="w-7 h-7 rounded-full bg-cream border-2 border-ink text-ink text-sm leading-none hover:bg-sun"
              aria-label="Move left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setX(Math.min(1, adjust.offsetX + 0.1))}
              className="w-7 h-7 rounded-full bg-cream border-2 border-ink text-ink text-sm leading-none hover:bg-sun"
              aria-label="Move right"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => setY(Math.max(-1, adjust.offsetY - 0.1))}
              className="w-7 h-7 rounded-full bg-cream border-2 border-ink text-ink text-sm leading-none hover:bg-sun"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => setY(Math.min(1, adjust.offsetY + 0.1))}
              className="w-7 h-7 rounded-full bg-cream border-2 border-ink text-ink text-sm leading-none hover:bg-sun"
              aria-label="Move down"
            >
              ↓
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={adjust.offsetX}
            onChange={(e) => setX(Number(e.target.value))}
            className="w-full accent-sun h-1.5 cursor-pointer"
            style={{ touchAction: 'manipulation' }}
            aria-label="Horizontal position"
          />
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={adjust.offsetY}
            onChange={(e) => setY(Number(e.target.value))}
            className="w-full accent-sun h-1.5 cursor-pointer"
            style={{ touchAction: 'manipulation' }}
            aria-label="Vertical position"
          />
        </div>
      </div>
    </div>
  );
}
