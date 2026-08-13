// Hacker House Goa 2026 — Builder Card Generator.
//
// The supplied public/ticket.png is the IMMUTABLE master artwork. The
// generator's only job is to:
//   1. Show the master card as-is (no photos uploaded) on first load.
//   2. Accept photos for up to 3 teammates, composite each into the
//      portrait window on the master card.
//   3. Provide live crop controls (zoom + position) per teammate.
//   4. Stamp a small "+NAME1 · NAME2 · NAME3" label outside the card
//      frame so every generated card lists all 3 teammates.
//   5. Export 3 high-resolution PNGs (one per teammate), bundled into
//      a single ZIP for download.
//
// All processing is client-side (canvas + blob + zip, no server upload).
// The card's typography, decorations, and colors are NEVER regenerated
// or redrawn by the app — they live in ticket.png.

import React, { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { LandingPage } from './components/LandingPage';
import { CardPreview } from './components/CardPreview';
import { CardPhotoUploader } from './components/CardPhotoUploader';
import { PhotoCropper } from './components/PhotoCropper';
import {
  composeCardAsync,
  canvasToPngBlob,
  sanitizeFilename,
  fileToDataUrl,
  loadImageFromDataUrl,
} from './lib/cardComposer';
import { downloadZip } from './lib/zipExport';
import { DEFAULT_ADJUST, type CropAdjust } from './lib/image';

// One teammate's worth of state.
type Slot = {
  photoImage: HTMLImageElement | null;
  adjust: CropAdjust;
  name: string;
};

const NUM_SLOTS = 3;

function emptySlot(): Slot {
  return { photoImage: null, adjust: DEFAULT_ADJUST, name: '' };
}

export default function App() {
  // 3 slots, one per teammate. Each slot holds its own photo, crop
  // adjustment, and name.
  const [slots, setSlots] = useState<[Slot, Slot, Slot]>(() => [
    emptySlot(),
    emptySlot(),
    emptySlot(),
  ]);
  const [filenamePrefix, setFilenamePrefix] = useState('');
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which slot is shown in the live preview. Tabs above the preview let
  // the user flip between the 3 teammates.
  const [activePreview, setActivePreview] = useState<0 | 1 | 2>(0);

  // Hash-based routing: '/' or '' shows the landing page; '#generate'
  // shows the actual generator.
  const [view, setView] = useState<'home' | 'generate'>(() => {
    if (typeof window === 'undefined') return 'home';
    return window.location.hash === '#generate' ? 'generate' : 'home';
  });

  useEffect(() => {
    const sync = () => {
      const next = window.location.hash === '#generate' ? 'generate' : 'home';
      setView(next);
      if (next === 'generate') {
        requestAnimationFrame(() => {
          const el = document.getElementById('generator-root');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('hashchange', sync);
    sync();
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const goGenerate = useCallback(() => {
    window.location.hash = '#generate';
  }, []);

  const goHome = useCallback(() => {
    if (window.location.hash) {
      window.location.hash = '';
    } else {
      setView('home');
    }
  }, []);

  // ------------ slot helpers ------------

  // Immutable patch helper: returns a new slot array with one slot
  // replaced by a shallow-merged version.
  const updateSlot = useCallback(
    (idx: 0 | 1 | 2, patch: Partial<Slot>) => {
      setSlots((prev) => {
        const next = [...prev] as [Slot, Slot, Slot];
        next[idx] = { ...next[idx], ...patch };
        return next;
      });
    },
    [],
  );

  const handleFile = useCallback(
    async (idx: 0 | 1 | 2, file: File) => {
      setLoadingSlot(idx);
      setError(null);
      try {
        const dataUrl = await fileToDataUrl(file);
        const image = await loadImageFromDataUrl(dataUrl);
        updateSlot(idx, { photoImage: image, adjust: DEFAULT_ADJUST });
        // Auto-focus the preview on the slot the user just uploaded.
        setActivePreview(idx);
      } catch (e: any) {
        setError(humanError(e?.message || 'Could not load that photo.'));
      } finally {
        setLoadingSlot(null);
      }
    },
    [updateSlot],
  );

  const handleSlotReset = useCallback(
    (idx: 0 | 1 | 2) => {
      updateSlot(idx, emptySlot());
      setError(null);
    },
    [updateSlot],
  );

  // ------------ export ------------

  const allPhotosLoaded = slots.every((s) => s.photoImage !== null);

  const handleGenerate = useCallback(async () => {
    if (!allPhotosLoaded) return;
    setGenerating(true);
    setError(null);
    try {
      const allNames = slots.map((s) => s.name.trim());
      const prefix = filenamePrefix.trim() || 'team';
      const entries: { name: string; data: Uint8Array }[] = [];

      for (let i = 0; i < NUM_SLOTS; i++) {
        const s = slots[i];
        if (!s.photoImage) continue;
        const canvas = await composeCardAsync({
          photo: {
            image: s.photoImage,
            width: s.photoImage.naturalWidth,
            height: s.photoImage.naturalHeight,
            adjust: s.adjust,
          },
          // 2× the source for retina-sharp output (3368×5056).
          outputW: 3368,
          outputH: 5056,
          // Stamp the small "+name1 · name2 · name3" label on every card.
          teammateNames: allNames,
        });
        const blob = await canvasToPngBlob(canvas);
        const teammateName = allNames[i] || `teammate-${i + 1}`;
        const filename = `Hacker-House-Goa-Builder-Frame-${sanitizeFilename(
          prefix,
        )}-${sanitizeFilename(teammateName)}.png`;
        const bytes = new Uint8Array(await blob.arrayBuffer());
        entries.push({ name: filename, data: bytes });
      }

      if (entries.length === 0) {
        setError('Add a photo for each teammate before generating.');
        return;
      }
      const zipName = `Hacker-House-Goa-Builder-Frames-${sanitizeFilename(
        prefix,
      )}.zip`;
      await downloadZip(entries, zipName);
    } catch (e: any) {
      console.error(e);
      setError(humanError(e?.message || 'Could not generate the cards.'));
    } finally {
      setGenerating(false);
    }
  }, [allPhotosLoaded, slots, filenamePrefix]);

  // ------------ render ------------

  if (view === 'home') {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar onHome={goHome} />
        <LandingPage onGenerate={goGenerate} />
      </div>
    );
  }

  const activeSlot = slots[activePreview];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar onHome={goHome} />

      <main id="generator-root" className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mx-auto max-w-6xl pt-2 sm:pt-4">
          <section className="mb-5 sm:mb-7">
            <div className="flex items-center gap-2 mb-3">
              <span className="pill text-cream/90">
                <span className="w-1.5 h-1.5 rounded-full bg-pink" />
                HACKER HOUSE · GOA 2026
              </span>
              <button
                type="button"
                onClick={goHome}
                className="ml-auto text-[11px] font-mono uppercase tracking-super text-cream/70 hover:text-sun transition-colors"
              >
                ← Back to hype
              </button>
            </div>
            <h1 className="huge-title text-[44px] sm:text-7xl md:text-[110px]">
              DROP YOUR
              <br />
              <span>BUILDER PHOTOS.</span>
            </h1>
            <p className="mt-4 text-cream/90 text-base sm:text-lg max-w-2xl leading-relaxed">
              Upload photos for up to 3 teammates. We'll print each one
              into the official Hacker House Goa 2026 builder card and
              bundle all three PNGs into a single ZIP.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:grid-cols-2">
            {/* LEFT: form — three stacked slots + filename + button */}
            <div className="lg:order-1">
              <div className="space-y-5">
                {slots.map((slot, idx) => (
                  <SlotBlock
                    key={idx}
                    slotIndex={idx as 0 | 1 | 2}
                    slot={slot}
                    loading={loadingSlot === idx}
                    onFile={(file) => handleFile(idx as 0 | 1 | 2, file)}
                    onReset={() => handleSlotReset(idx as 0 | 1 | 2)}
                    onNameChange={(name) =>
                      updateSlot(idx as 0 | 1 | 2, { name })
                    }
                    onAdjustChange={(adjust) =>
                      updateSlot(idx as 0 | 1 | 2, { adjust })
                    }
                    onAdjustReset={() =>
                      updateSlot(idx as 0 | 1 | 2, {
                        adjust: DEFAULT_ADJUST,
                      })
                    }
                    onPreview={() => setActivePreview(idx as 0 | 1 | 2)}
                    isActive={activePreview === idx}
                  />
                ))}

                {/* Filename prefix */}
                <div className="rounded-2xl border-2 border-ink/30 bg-cream-50 p-5 shadow-lg shadow-ink/30">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-super text-ink/70 mb-3">
                    04 · File name prefix (optional)
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-super text-ink/80 mb-2 block">
                      Team or project name
                    </span>
                    <input
                      type="text"
                      value={filenamePrefix}
                      onChange={(e) => setFilenamePrefix(e.target.value)}
                      placeholder="e.g. core-team"
                      maxLength={40}
                      className="input-field"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border-2 border-pink bg-pink/15 p-4 text-sm text-ink"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-super text-pink mb-1">
                      Heads up
                    </div>
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!allPhotosLoaded || generating}
                  className="btn-primary w-full text-lg py-4"
                >
                  {generating ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-ink/40 border-t-ink animate-spin" />
                      RENDERING 3 CARDS…
                    </>
                  ) : (
                    <>
                      GENERATE 3 BUILDER IDS
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
                {!allPhotosLoaded && !error && (
                  <p className="text-[11px] text-ink/40 text-center -mt-2 font-mono uppercase tracking-super">
                    Upload all 3 photos to generate
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: preview */}
            <div className="lg:order-2">
              <div className="lg:sticky lg:top-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="pill text-ink/80 border-ink/20">
                    {activeSlot.photoImage
                      ? `TEAMMATE ${activePreview + 1} · ${activeSlot.name || 'YOUR FRAME'}`
                      : 'OFFICIAL CARD'}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-super text-cream/70">
                    1684 × 2528 · PNG
                  </span>
                </div>

                {/* Tab switcher: pick which teammate the preview shows */}
                <div
                  role="tablist"
                  aria-label="Preview teammate"
                  className="mb-3 flex gap-1 rounded-full bg-ink/20 p-1 border-2 border-ink/30"
                >
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={activePreview === idx}
                      onClick={() => setActivePreview(idx as 0 | 1 | 2)}
                      className={[
                        'flex-1 rounded-full px-3 py-1.5 text-[11px] font-mono uppercase tracking-super transition-colors',
                        activePreview === idx
                          ? 'bg-sun text-ink border-2 border-ink'
                          : 'text-cream/70 hover:text-cream',
                      ].join(' ')}
                    >
                      {slots[idx].photoImage ? '●' : '○'} 0{idx + 1}
                      {slots[idx].name ? ` · ${slots[idx].name.split(' ')[0]}` : ''}
                    </button>
                  ))}
                </div>

                <div className="relative rounded-2xl border-2 border-ink/40 bg-cream-50 p-3 sm:p-5 overflow-hidden grain shadow-xl shadow-ink/40">
                  <div className="flex items-center justify-center">
                    <div
                      style={{
                        width: 'min(100%, 460px)',
                        aspectRatio: '1684 / 2528',
                      }}
                    >
                      <CardPreview
                        photoImage={activeSlot.photoImage}
                        adjust={activeSlot.adjust}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-cream/70 mt-3 text-center leading-relaxed">
                  {activeSlot.photoImage
                    ? `Previewing teammate ${activePreview + 1}. Use zoom + position to dial it in.`
                    : `Teammate ${activePreview + 1}'s photo will land in the centre of the ticket.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto px-4 sm:px-8 py-8 bg-ink/95 text-cream border-t-2 border-ink">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-cream/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-super">
              HACKER HOUSE GOA · 2026
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={goHome}
              className="font-mono uppercase tracking-super text-cream/70 hover:text-sun transition-colors"
            >
              ← Back to hype
            </button>
            <span className="font-mono uppercase tracking-super text-sun">
              Build · Ship · Repeat · 28—31 Oct 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// One teammate's form block: upload + name + crop controls.
function SlotBlock(props: {
  slotIndex: 0 | 1 | 2;
  slot: Slot;
  loading: boolean;
  onFile: (file: File) => void;
  onReset: () => void;
  onNameChange: (name: string) => void;
  onAdjustChange: (adjust: CropAdjust) => void;
  onAdjustReset: () => void;
  onPreview: () => void;
  isActive: boolean;
}) {
  const {
    slotIndex,
    slot,
    loading,
    onFile,
    onReset,
    onNameChange,
    onAdjustChange,
    onAdjustReset,
    onPreview,
    isActive,
  } = props;
  const idx = slotIndex + 1;
  const accentRing = isActive
    ? 'border-sun shadow-lg shadow-sun/30'
    : 'border-ink/30 shadow-lg shadow-ink/30';

  return (
    <div
      className={`rounded-2xl border-2 ${accentRing} bg-cream-50 p-5 transition-shadow`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono font-bold uppercase tracking-super text-ink/70">
          0{idx} · Teammate {idx}
        </div>
        <button
          type="button"
          onClick={onPreview}
          className="text-[10px] font-mono uppercase tracking-super text-ink/50 hover:text-pink transition-colors"
        >
          {isActive ? '● previewing' : '○ show in preview'}
        </button>
      </div>

      {!slot.photoImage ? (
        <CardPhotoUploader
          onFile={onFile}
          onError={(m) => {
            // Surface errors via a window-level dispatch so App can show
            // the friendly alert. We attach it to the slot for now.
            console.warn('uploader error:', m);
          }}
          loading={loading}
          slot={idx as 1 | 2 | 3}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border-2 border-ink/30 bg-cream p-3">
            <button
              type="button"
              onClick={onPreview}
              className="w-16 h-16 rounded-lg overflow-hidden border-2 border-ink/30 flex-none hover:border-pink transition-colors"
              aria-label={`Preview teammate ${idx}`}
            >
              <img
                src={slot.photoImage.src}
                alt={`Teammate ${idx}`}
                className="block w-full h-full object-cover"
              />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={slot.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={`Teammate ${idx}'s name`}
                maxLength={40}
                className="input-field text-sm"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 rounded-full bg-cream text-ink text-[11px] font-mono uppercase tracking-super border-2 border-ink hover:bg-sun"
            >
              ↻ Replace
            </button>
          </div>
          <PhotoCropper
            adjust={slot.adjust}
            onChange={onAdjustChange}
            onReset={onAdjustReset}
          />
        </div>
      )}
    </div>
  );
}

function humanError(msg: string): string {
  if (!msg) return 'Something went wrong.';
  if (msg.includes('decode')) return "We couldn't read that photo. Try a different one.";
  if (msg.includes('load')) return "That photo couldn't be loaded. Try a JPG, PNG, or WEBP file.";
  return msg;
}