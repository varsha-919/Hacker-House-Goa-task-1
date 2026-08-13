// CardPhotoUploader — themed dropzone for the user's builder photo.
// Supports click-to-pick, drag-and-drop, and rejects anything that
// isn't a supported image type with a friendly error message.
//
// `slot` makes the component slot-aware: when used 3 times on the same
// page (teammates 1/2/3), the copy and accent color rotate so each
// dropzone is visually distinct.

import React, { useRef, useState } from 'react';

type Props = {
  onFile: (file: File) => void;
  onError?: (msg: string) => void;
  loading?: boolean;
  // Slot index (1, 2, or 3). Defaults to 1 — backward-compatible.
  slot?: 1 | 2 | 3;
  // Optional override for the button copy. If unset, defaults to the
  // slot label ("Teammate 1", "Teammate 2", "Teammate 3").
  label?: string;
};

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

// Per-slot visual accent colors. We rotate between sun (yellow),
// pink, and a third tone so all 3 dropzones are visually distinct.
const SLOT_ACCENTS = {
  1: { corner1: 'border-sun', corner2: 'border-pink', corner3: 'border-pink', corner4: 'border-sun', label: 'Teammate 1' },
  2: { corner1: 'border-pink', corner2: 'border-sun', corner3: 'border-sun', corner4: 'border-pink', label: 'Teammate 2' },
  3: { corner1: 'border-sun', corner2: 'border-pink', corner3: 'border-pink', corner4: 'border-sun', label: 'Teammate 3' },
} as const;

export function CardPhotoUploader({ onFile, onError, loading, slot = 1, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const accents = SLOT_ACCENTS[slot];
  const slotLabel = label ?? accents.label;

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    const ok =
      /\.(jpe?g|png|webp)$/i.test(f.name) ||
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type);
    if (!ok) {
      onError?.("That file type isn't supported. Please pick a JPG, PNG, or WEBP photo.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      onError?.("That image is over 50MB. Please pick a smaller photo.");
      return;
    }
    onFile(f);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      disabled={loading}
      aria-label={`Upload ${slotLabel.toLowerCase()}'s photo`}
      className={[
        'group relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all',
        'flex flex-col items-center justify-center text-center',
        'min-h-[160px] p-5',
        dragOver
          ? 'border-sun bg-sun/15'
          : 'border-ink/30 bg-cream-50 hover:border-pink hover:bg-cream',
        loading ? 'opacity-60 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] font-mono font-bold uppercase tracking-super text-ink/60">
          {slotLabel}
        </div>
        <div className="w-10 h-10 rounded-full bg-sun flex items-center justify-center text-ink text-xl font-bold leading-none border-2 border-ink">
          +
        </div>
        <div>
          <div className="text-ink display-xl-tight text-lg">
            {loading ? 'READING PHOTO…' : 'DROP PHOTO HERE'}
          </div>
          <div className="text-ink/60 text-[10px] mt-1 tracking-super font-mono uppercase">
            JPG · PNG · WEBP
          </div>
        </div>
      </div>

      {/* corner accents — rotated per slot */}
      <span className={`absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 ${accents.corner1}`} aria-hidden />
      <span className={`absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 ${accents.corner2}`} aria-hidden />
      <span className={`absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 ${accents.corner3}`} aria-hidden />
      <span className={`absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 ${accents.corner4}`} aria-hidden />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </button>
  );
}
