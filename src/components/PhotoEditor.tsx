import React from 'react';
import type { CropAdjust } from '../lib/image';

type Props = {
  adjust: CropAdjust;
  onChange: (a: CropAdjust) => void;
  onReset: () => void;
};

export function PhotoEditor({ adjust, onChange, onReset }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="label-field !mb-0">Fit your photo</span>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-mono uppercase tracking-super text-ink/60 hover:text-pink"
        >
          ↻ Reset
        </button>
      </div>

      <Slider
        label="Zoom"
        value={adjust.scale}
        min={1}
        max={2.5}
        step={0.05}
        onChange={(v) => onChange({ ...adjust, scale: v })}
        format={(v) => `${v.toFixed(2)}×`}
      />
      <Slider
        label="Left / Right"
        value={adjust.offsetX}
        min={-1}
        max={1}
        step={0.05}
        onChange={(v) => onChange({ ...adjust, offsetX: v })}
        format={(v) => (v === 0 ? 'Center' : v < 0 ? `← ${Math.abs(v).toFixed(2)}` : `${v.toFixed(2)} →`)}
      />
      <Slider
        label="Up / Down"
        value={adjust.offsetY}
        min={-1}
        max={1}
        step={0.05}
        onChange={(v) => onChange({ ...adjust, offsetY: v })}
        format={(v) => (v === 0 ? 'Center' : v < 0 ? `↑ ${Math.abs(v).toFixed(2)}` : `↓ ${v.toFixed(2)}`)}
      />
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono font-bold uppercase tracking-super text-ink/70">
          {label}
        </span>
        <span className="text-[11px] font-mono text-pink">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sun h-1.5 cursor-pointer"
        style={{ touchAction: 'manipulation' }}
      />
    </div>
  );
}
