// Hacker House Goa 2026 — Builder ID Generator.
//
// Flow:
//   1. Upload a photo, enter name + stack -> "Builder Class" auto-titles.
//   2. Preview shows the live poster (DOM mirrors canvas exactly).
//   3. "Generate" rasterizes a 1080x1350 PNG via Canvas and unlocks
//      download + share-to-X.
//   4. "Add teammate" lets the user add up to 2 more builders
//      (max 3 total) and produce a combined team poster.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoEditor } from './components/PhotoEditor';
import { BuilderIDPreview } from './components/BuilderIDPreview';
import { TeamPreview, type TeamMemberInput } from './components/TeamPreview';
import { DEFAULT_ADJUST, loadImageFromFile, type LoadedImage, type CropAdjust } from './lib/image';
import {
  renderBuilderIDToCanvas,
  canvasToPngDataUrl,
  downloadDataUrl,
  sanitizeFilename,
} from './lib/export';
import { renderTeamPosterToCanvas } from './lib/teamExport';
import { CARD_W, CARD_H } from './lib/posterLayout';
import { SHARE_TEXT, openXShare, isShareHosted, uploadGeneratedImage, buildShareLink } from './lib/share';
import { pickTitleVariant, allTitlesForInput } from './lib/builderTitles';

type Step = 'input' | 'generated';

type BuilderSlot = {
  loaded: LoadedImage | null;
  adjust: CropAdjust;
  name: string;
  stack: string;
  titleVariant: number;
};

function emptySlot(): BuilderSlot {
  return { loaded: null, adjust: DEFAULT_ADJUST, name: '', stack: '', titleVariant: 0 };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label-field">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="input-field"
        autoComplete="off"
        spellCheck={false}
      />
      {hint && <div className="text-[11px] text-cream/40 mt-1.5 font-mono uppercase tracking-super">{hint}</div>}
    </label>
  );
}

export default function App() {
  const [slots, setSlots] = useState<BuilderSlot[]>([emptySlot()]);
  const [loadingImage, setLoadingImage] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedKind, setGeneratedKind] = useState<'single' | 'team'>('single');
  const [error, setError] = useState<string | null>(null);
  const [uploadingShare, setUploadingShare] = useState(false);
  const [step, setStep] = useState<Step>('input');
  const [teamName, setTeamName] = useState('BUILDER CREW');

  const previewRef = useRef<HTMLDivElement>(null);

  // Derived: the active builder (always the first slot while in input step)
  const active = slots[0];

  // Builder class for the active builder — purely visual (shown in editor)
  const builderClass = useMemo(
    () => pickTitleVariant(active.stack, active.titleVariant).title,
    [active.stack, active.titleVariant],
  );

  // Cycle title when stack changes
  useEffect(() => {
    setSlots((s) => s.map((slot, i) => (i === 0 ? { ...slot, titleVariant: 0 } : slot)));
  }, [active.stack]);

  const canGenerate = useMemo(() => {
    return slots.every((s) => s.loaded && s.name.trim() && s.stack.trim());
  }, [slots]);

  // ------------ handlers ------------

  const handleFile = useCallback(async (file: File) => {
    setLoadingImage(true);
    setError(null);
    try {
      const img = await loadImageFromFile(file);
      setSlots((s) => {
        const copy = [...s];
        copy[0] = { ...copy[0], loaded: img, adjust: DEFAULT_ADJUST };
        return copy;
      });
    } catch (e: any) {
      setError(humanError(e?.message || 'Could not load that photo.'));
    } finally {
      setLoadingImage(false);
    }
  }, []);

  const handleTeammateFile = useCallback(async (idx: number, file: File) => {
    setLoadingImage(true);
    setError(null);
    try {
      const img = await loadImageFromFile(file);
      setSlots((s) => {
        const copy = [...s];
        copy[idx] = { ...copy[idx], loaded: img, adjust: DEFAULT_ADJUST };
        return copy;
      });
    } catch (e: any) {
      setError(humanError(e?.message || 'Could not load that photo.'));
    } finally {
      setLoadingImage(false);
    }
  }, []);

  const updateActiveAdjust = useCallback((a: CropAdjust) => {
    setSlots((s) => {
      const copy = [...s];
      copy[0] = { ...copy[0], adjust: a };
      return copy;
    });
  }, []);

  const setActiveName = useCallback((v: string) => {
    setSlots((s) => {
      const copy = [...s];
      copy[0] = { ...copy[0], name: v };
      return copy;
    });
  }, []);

  const setActiveStack = useCallback((v: string) => {
    setSlots((s) => {
      const copy = [...s];
      copy[0] = { ...copy[0], stack: v };
      return copy;
    });
  }, []);

  const setTeammateName = useCallback((idx: number, v: string) => {
    setSlots((s) => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], name: v };
      return copy;
    });
  }, []);

  const setTeammateStack = useCallback((idx: number, v: string) => {
    setSlots((s) => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], stack: v };
      return copy;
    });
  }, []);

  const updateTeammateAdjust = useCallback((idx: number, a: CropAdjust) => {
    setSlots((s) => {
      const copy = [...s];
      copy[idx] = { ...copy[idx], adjust: a };
      return copy;
    });
  }, []);

  const handleRetryTitle = useCallback(() => {
    setSlots((s) => {
      const copy = [...s];
      const list = allTitlesForInput(copy[0].stack);
      copy[0] = { ...copy[0], titleVariant: (copy[0].titleVariant + 1) % list.length };
      return copy;
    });
  }, []);

  // ------------ generate / download / share ------------

  const ensureFontsReady = useCallback(async () => {
    try {
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
    } catch {
      /* ignore */
    }
    // tiny RAF wait so layout settles
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) {
      setError('Upload photos, names and stacks for every builder first.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await ensureFontsReady();

      if (slots.length === 1) {
        const slot = slots[0];
        const canvas = renderBuilderIDToCanvas({
          name: slot.name.trim(),
          stackOrRole: slot.stack.trim(),
          builderClass,
          photo: slot.loaded!.exportSource,
          adjust: slot.adjust,
        });
        const dataUrl = canvasToPngDataUrl(canvas);
        setGeneratedUrl(dataUrl);
        setGeneratedKind('single');
      } else {
        const members: TeamMemberInput[] = slots.map((s) => ({
          name: s.name.trim(),
          stackOrRole: s.stack.trim(),
          builderClass: pickTitleVariant(s.stack, 0).title,
          photo: s.loaded!.exportSource,
          adjust: s.adjust,
        }));
        const canvas = renderTeamPosterToCanvas({
          teamName: teamName.trim() || 'BUILDER CREW',
          members,
        });
        const dataUrl = canvasToPngDataUrl(canvas);
        setGeneratedUrl(dataUrl);
        setGeneratedKind('team');
      }
      setStep('generated');
    } catch (e: any) {
      console.error(e);
      setError(humanError(e?.message || 'Could not generate the image.'));
    } finally {
      setGenerating(false);
    }
  }, [canGenerate, slots, builderClass, teamName, ensureFontsReady]);

  const handleDownload = useCallback(() => {
    if (!generatedUrl) return;
    const baseName = generatedKind === 'team' ? teamName || 'builder-crew' : slots[0].name || 'builder-id';
    const slug = sanitizeFilename(baseName);
    const suffix = generatedKind === 'team' ? 'team' : 'id';
    downloadDataUrl(generatedUrl, `hh-goa-2026-${slug}-${suffix}.png`);
  }, [generatedUrl, generatedKind, teamName, slots]);

  const handleShare = useCallback(async () => {
    if (!generatedUrl) return;
    setUploadingShare(true);
    setError(null);
    try {
      let shareLink: string;
      if (isShareHosted()) {
        const { publicUrl } = await uploadGeneratedImage(generatedUrl);
        shareLink = buildShareLink({ hostedImageUrl: publicUrl });
      } else {
        shareLink = buildShareLink({ dataUrl: generatedUrl });
      }
      openXShare(SHARE_TEXT, shareLink);
    } catch (e: any) {
      console.error(e);
      setError(humanError(e?.message || 'Could not prepare the share link.'));
    } finally {
      setUploadingShare(false);
    }
  }, [generatedUrl]);

  const handleEdit = useCallback(() => setStep('input'), []);

  const handleReset = useCallback(() => {
    setSlots([emptySlot()]);
    setTeamName('BUILDER CREW');
    setGeneratedUrl(null);
    setError(null);
    setStep('input');
  }, []);

  const handleAddTeammate = useCallback(() => {
    setSlots((s) => (s.length >= 3 ? s : [...s, emptySlot()]));
  }, []);

  const handleRemoveTeammate = useCallback((idx: number) => {
    setSlots((s) => s.filter((_, i) => i !== idx));
  }, []);

  // ------------ render ------------

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mx-auto max-w-6xl pt-2 sm:pt-4">
          {step === 'input' && (
            <section className="mb-5 sm:mb-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="pill text-cream/80 border-cream/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink" />
                  HACKER HOUSE · GOA 2026
                </span>
              </div>
              <h1 className="display-xl text-cream text-[44px] leading-[0.92] sm:text-7xl md:text-[88px]">
                BUILD YOUR
                <br />
                <span className="text-sun">BUILDER ID.</span>
              </h1>
              <p className="mt-4 text-cream/70 text-base sm:text-lg max-w-2xl leading-relaxed">
                Upload your photo, tell us what you build, and we'll turn it into your
                Hacker House Goa 2026 identity. Bring up to two teammates and frame the
                whole crew.
              </p>
            </section>
          )}

          <div
            className={[
              'grid grid-cols-1 gap-6 lg:gap-10',
              step === 'generated' ? 'lg:grid-cols-12' : 'lg:grid-cols-2',
            ].join(' ')}
          >
            {/* LEFT: form */}
            <div className={step === 'generated' ? 'lg:col-span-5 order-2 lg:order-1' : 'lg:order-1'}>
              {step === 'input' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-cream/15 bg-ink-900/40 p-5">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-super text-cream/60 mb-3">
                      01 · Your photo
                    </div>
                    {!active.loaded ? (
                      <PhotoUploader
                        onFile={handleFile}
                        onError={(m) => setError(m)}
                        loading={loadingImage}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden border border-cream/20">
                          <img
                            src={active.loaded.image.src}
                            alt="Uploaded preview"
                            className="block w-full h-auto"
                          />
                          <button
                            type="button"
                            onClick={handleReset}
                            className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-ink/90 text-cream text-[11px] font-mono uppercase tracking-super border border-cream/20 hover:bg-ink"
                          >
                            ↻ Start over
                          </button>
                        </div>
                        <PhotoEditor
                          adjust={active.adjust}
                          onChange={updateActiveAdjust}
                          onReset={() => updateActiveAdjust(DEFAULT_ADJUST)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-cream/15 bg-ink-900/40 p-5">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-super text-cream/60 mb-3">
                      02 · Your details
                    </div>
                    <div className="space-y-4">
                      <Field
                        label="Name"
                        value={active.name}
                        onChange={setActiveName}
                        placeholder="Your name"
                        maxLength={32}
                      />
                      <Field
                        label="Stack / Role"
                        value={active.stack}
                        onChange={setActiveStack}
                        placeholder="What do you build?"
                        maxLength={48}
                        hint="e.g. Full Stack Developer, AI/ML Engineer"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cream/15 bg-ink-900/40 p-5">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-super text-cream/60 mb-2">
                      03 · Builder title
                    </div>
                    <div
                      className="display-xl-tight text-3xl sm:text-4xl text-pink"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {builderClass}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRetryTitle}
                        className="text-[11px] font-mono uppercase tracking-super text-cream/60 hover:text-sun"
                      >
                        ↻ Try another title
                      </button>
                      <span className="text-cream/30 text-[11px] font-mono uppercase tracking-super">
                        Auto-matched from stack
                      </span>
                    </div>
                  </div>

                  {/* Teammates */}
                  <div className="rounded-2xl border border-cream/15 bg-ink-900/40 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-super text-cream/60">
                        04 · Bring your crew
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-super text-cream/40">
                        {slots.length}/3 builders
                      </div>
                    </div>

                    {slots.slice(1).map((slot, i) => {
                      const idx = i + 1;
                      return (
                        <div key={idx} className="rounded-xl border border-cream/10 p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-mono uppercase tracking-super text-cream/50">
                              BUILDER {String(idx + 1).padStart(2, '0')}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTeammate(idx)}
                              className="text-[10px] font-mono uppercase tracking-super text-cream/50 hover:text-pink"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          {!slot.loaded ? (
                            <TeammateUploader
                              loading={loadingImage}
                              onFile={(f) => handleTeammateFile(idx, f)}
                            />
                          ) : (
                            <div className="space-y-3">
                              <div className="relative rounded-lg overflow-hidden border border-cream/20">
                                <img
                                  src={slot.loaded.image.src}
                                  alt={`Teammate ${idx + 1}`}
                                  className="block w-full h-auto"
                                />
                              </div>
                              <PhotoEditor
                                adjust={slot.adjust}
                                onChange={(a) => updateTeammateAdjust(idx, a)}
                                onReset={() => updateTeammateAdjust(idx, DEFAULT_ADJUST)}
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            <input
                              type="text"
                              value={slot.name}
                              onChange={(e) => setTeammateName(idx, e.target.value)}
                              placeholder="Name"
                              maxLength={32}
                              className="input-field text-sm"
                            />
                            <input
                              type="text"
                              value={slot.stack}
                              onChange={(e) => setTeammateStack(idx, e.target.value)}
                              placeholder="Stack / role"
                              maxLength={48}
                              className="input-field text-sm"
                            />
                          </div>
                          {slots.length > 1 && (
                            <div className="mt-3">
                              <div className="text-[10px] font-mono uppercase tracking-super text-cream/40 mb-1">
                                Team name
                              </div>
                              <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Builder Crew"
                                maxLength={40}
                                className="input-field text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {slots.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddTeammate}
                        className="w-full mt-1 rounded-xl border border-dashed border-cream/30 py-3 text-cream/80 hover:text-sun hover:border-sun text-sm font-mono uppercase tracking-super transition-colors"
                      >
                        + Add teammate ({3 - slots.length} left)
                      </button>
                    )}
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-pink/40 bg-pink/10 p-4 text-sm text-cream"
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
                    disabled={!canGenerate || generating}
                    className="btn-primary w-full text-lg py-4"
                  >
                    {generating ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-ink/40 border-t-ink animate-spin" />
                        {slots.length > 1 ? 'FRAMING YOUR CREW…' : 'BUILDING YOUR ID…'}
                      </>
                    ) : (
                      <>
                        {slots.length > 1 ? 'GENERATE TEAM FRAME' : 'GENERATE MY BUILDER ID'}
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
                  {!canGenerate && !error && (
                    <p className="text-[11px] text-cream/40 text-center -mt-2 font-mono uppercase tracking-super">
                      Fill out every builder to continue
                    </p>
                  )}
                </div>
              )}

              {step === 'generated' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-cream/15 bg-ink-900/40 p-5">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-super text-cream/60 mb-2">
                      {generatedKind === 'team' ? 'Your Crew' : 'Your Builder ID'}
                    </div>
                    {generatedKind === 'team' ? (
                      <div>
                        <div className="display-xl-tight text-3xl sm:text-4xl text-sun">
                          {teamName.toUpperCase()}
                        </div>
                        <div className="mt-3 space-y-2">
                          {slots.map((s, i) => {
                            const klass = pickTitleVariant(s.stack, 0).title;
                            return (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="text-cream font-mono uppercase tracking-super">
                                  {s.name.toUpperCase()} · {s.stack.toUpperCase()}
                                </div>
                                <div className="text-pink font-mono uppercase tracking-super text-xs">
                                  {klass}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="display-xl-tight text-3xl sm:text-4xl text-sun"
                          style={{ letterSpacing: '-0.01em' }}
                        >
                          {active.name.toUpperCase()}
                        </div>
                        <div className="mt-1 text-cream/70 text-sm font-mono uppercase tracking-super">
                          {active.stack.toUpperCase()}
                        </div>
                        <div className="mt-4 text-pink display-xl-tight text-2xl">
                          {builderClass}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="btn-primary w-full text-lg py-4"
                    disabled={!generatedUrl}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    DOWNLOAD {generatedKind === 'team' ? 'TEAM FRAME' : 'ID'}
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="btn-pink w-full text-lg py-4"
                    disabled={uploadingShare}
                  >
                    {uploadingShare ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
                        PREPARING…
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        SHARE ON X
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="btn-ghost" onClick={handleEdit}>
                      Edit details
                    </button>
                    <button className="btn-ghost" onClick={handleReset}>
                      Start over
                    </button>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-pink/40 bg-pink/10 p-4 text-sm text-cream"
                    >
                      <div className="font-mono text-[10px] uppercase tracking-super text-pink mb-1">
                        Heads up
                      </div>
                      {error}
                    </div>
                  )}

                  <p className="text-[11px] text-cream/40 text-center leading-relaxed">
                    Downloads as a single flattened 1080×1350 PNG.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: preview */}
            <div className={step === 'generated' ? 'lg:col-span-7 order-1 lg:order-2' : 'lg:order-2'}>
              <div className="lg:sticky lg:top-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="pill text-cream/70 border-cream/15">
                    {step === 'generated'
                      ? generatedKind === 'team'
                        ? 'TEAM FRAME'
                        : 'YOUR BUILDER ID'
                      : 'PREVIEW'}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-super text-cream/40">
                    1080 × 1350 · PNG
                  </span>
                </div>

                <div className="relative rounded-2xl border border-cream/10 bg-ink-900/30 p-3 sm:p-5 overflow-hidden grid-paper">
                  <div className="flex items-center justify-center">
                    <div
                      style={{
                        width: 'min(100%, 460px)',
                        aspectRatio: `${CARD_W} / ${CARD_H}`,
                      }}
                    >
                      <ScaledPreview>
                        {generatedKind === 'team' || slots.length > 1 ? (
                          <TeamPreview
                            ref={previewRef}
                            teamName={teamName}
                            members={slots.map((s) => ({
                              name: s.name || (slots[0] === s ? 'YOUR NAME' : `BUILDER ${slots.indexOf(s) + 1}`),
                              stackOrRole: s.stack || 'BUILDER',
                              builderClass: pickTitleVariant(s.stack, s.titleVariant).title,
                              photo: s.loaded?.exportSource ?? null,
                              adjust: s.adjust,
                            }))}
                            size={CARD_W}
                            className="w-full h-full"
                          />
                        ) : (
                          <BuilderIDPreview
                            ref={previewRef}
                            data={{
                              name: active.name || 'YOUR NAME',
                              stackOrRole: active.stack || 'BUILDER',
                              builderTitle: builderClass,
                              photo: active.loaded?.exportSource ?? null,
                              adjust: active.adjust,
                            }}
                            size={CARD_W}
                            className="w-full h-full"
                          />
                        )}
                      </ScaledPreview>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-cream/40 mt-3 text-center leading-relaxed">
                  {slots.length > 1
                    ? 'Photo + builder details + classes baked into one team frame.'
                    : 'Photo + name + stack + builder class + all branding, baked into one image.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto px-4 sm:px-8 py-6 border-t border-cream/10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-cream/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-super">
              HACKER HOUSE GOA · 2026
            </span>
          </div>
          <div className="font-mono uppercase tracking-super">
            Build · Ship · Repeat · 28—31 Oct 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

// Tiny teammate uploader — just a button.
function TeammateUploader({ loading, onFile }: { loading: boolean; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={loading}
      className="w-full rounded-xl border border-dashed border-cream/25 bg-ink-900/40 py-4 text-cream/70 hover:text-sun hover:border-sun text-sm font-mono uppercase tracking-super"
    >
      + Drop teammate photo
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </button>
  );
}

function ScaledPreview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / CARD_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden">
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_W,
          height: CARD_H,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function humanError(msg: string): string {
  if (!msg) return 'Something went wrong.';
  if (msg.includes('HEIC')) return msg;
  if (msg.includes('50MB')) return msg;
  if (msg.includes('decode')) return "We couldn't read that photo. Try a different one.";
  if (msg.includes('Upload a photo')) return msg;
  if (msg.includes('Tell us')) return msg;
  return msg;
}
