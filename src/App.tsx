// Hacker House Goa 2026 — Builder ID Generator.
//
// Single-flow app: upload a photo -> name + stack -> position
// photo -> preview -> generate -> download 1080x1350 PNG -> share on X.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoEditor } from './components/PhotoEditor';
import { BuilderIDPreview } from './components/BuilderIDPreview';
import { DEFAULT_ADJUST, loadImageFromFile, type LoadedImage, type CropAdjust } from './lib/image';
import {
  renderBuilderIDToCanvas,
  canvasToPngDataUrl,
  downloadDataUrl,
  sanitizeFilename,
} from './lib/export';
import { CARD_W, CARD_H } from './lib/builderIdLayout';
import { SHARE_TEXT, openXShare, isShareHosted, uploadGeneratedImage, buildShareLink } from './lib/share';
import { pickTitleVariant, allTitlesForInput } from './lib/builderTitles';

type Step = 'input' | 'generated';

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
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
        inputMode={inputMode}
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
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [adjust, setAdjust] = useState<CropAdjust>(DEFAULT_ADJUST);
  const [name, setName] = useState('');
  const [stack, setStack] = useState('');
  const [titleVariant, setTitleVariant] = useState(0);
  const [loadingImage, setLoadingImage] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingShare, setUploadingShare] = useState(false);
  const [step, setStep] = useState<Step>('input');

  const previewRef = useRef<HTMLDivElement>(null);

  const builderTitle = useMemo(() => pickTitleVariant(stack, titleVariant).title, [stack, titleVariant]);
  const previewData = useMemo(
    () => ({
      name: name || 'Your Name',
      stackOrRole: stack || 'What do you build?',
      builderTitle,
      photo: loaded?.exportSource ?? null,
      adjust,
    }),
    [name, stack, builderTitle, loaded, adjust],
  );

  // Reset title variant when stack changes
  useEffect(() => {
    setTitleVariant(0);
  }, [stack]);

  const handleFile = useCallback(async (file: File) => {
    setLoadingImage(true);
    setError(null);
    setGeneratedUrl(null);
    setStep('input');
    try {
      const img = await loadImageFromFile(file);
      setLoaded(img);
      setAdjust(DEFAULT_ADJUST);
    } catch (e: any) {
      setError(humanError(e?.message || 'Could not load that photo.'));
    } finally {
      setLoadingImage(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!loaded) {
      setError('Upload a photo first.');
      return;
    }
    if (!name.trim()) {
      setError('Tell us your name.');
      return;
    }
    if (!stack.trim()) {
      setError('Tell us what you build.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      // Fonts settle before raster so the canvas text matches the preview
      try {
        if ((document as any).fonts?.ready) {
          await (document as any).fonts.ready;
        }
      } catch {
        /* ignore */
      }
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const canvas = renderBuilderIDToCanvas({
        name: name.trim(),
        stackOrRole: stack.trim(),
        builderTitle,
        photo: loaded.exportSource,
        adjust,
      });
      const dataUrl = canvasToPngDataUrl(canvas);
      setGeneratedUrl(dataUrl);
      setStep('generated');

      if (typeof window !== 'undefined' && window.location.search.includes('__test=1')) {
        (window as any).__generatedPng = dataUrl;
      }
    } catch (e: any) {
      console.error(e);
      setError(humanError(e?.message || 'Could not generate the image.'));
    } finally {
      setGenerating(false);
    }
  }, [loaded, name, stack, builderTitle, adjust]);

  const handleDownload = useCallback(() => {
    if (!generatedUrl) return;
    const slug = sanitizeFilename(name || 'builder-id');
    downloadDataUrl(generatedUrl, `hh-goa-2026-${slug}.png`);
  }, [generatedUrl, name]);

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

  const handleEdit = useCallback(() => {
    setStep('input');
  }, []);

  const handleReset = useCallback(() => {
    setLoaded(null);
    setAdjust(DEFAULT_ADJUST);
    setName('');
    setStack('');
    setTitleVariant(0);
    setGeneratedUrl(null);
    setError(null);
    setStep('input');
  }, []);

  const handleRetryTitle = useCallback(() => {
    const list = allTitlesForInput(stack);
    setTitleVariant((v) => (v + 1) % list.length);
  }, [stack]);

  const canGenerate = !!loaded && !!name.trim() && !!stack.trim();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mx-auto max-w-6xl pt-2 sm:pt-4">
          {/* Hero */}
          {step === 'input' && (
            <section className="mb-5 sm:mb-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="pill text-cream/80 border-cream/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink" />
                  THE ROAD TO 247
                </span>
              </div>
              <h1 className="display-xl text-cream text-[44px] leading-[0.92] sm:text-7xl md:text-[88px]">
                BUILD YOUR
                <br />
                <span className="text-sun">BUILDER ID.</span>
              </h1>
              <p className="mt-4 text-cream/70 text-base sm:text-lg max-w-2xl leading-relaxed">
                Upload your photo. Tell us what you build. We'll turn it into your
                Hacker House Goa 2026 identity.
              </p>
            </section>
          )}

          {/* Two-column layout on lg+, stacked on mobile */}
          <div
            className={[
              'grid grid-cols-1 gap-6 lg:gap-10',
              step === 'generated' ? 'lg:grid-cols-12' : 'lg:grid-cols-2',
            ].join(' ')}
          >
            {/* Left column — form */}
            <div className={step === 'generated' ? 'lg:col-span-5 order-2 lg:order-1' : 'lg:order-1'}>
              {step === 'input' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-cream/15 bg-ink-900/40 p-5">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-super text-cream/60 mb-3">
                      01 · Your photo
                    </div>
                    {!loaded ? (
                      <PhotoUploader
                        onFile={handleFile}
                        onError={(m) => setError(m)}
                        loading={loadingImage}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden border border-cream/20">
                          <img
                            src={loaded.image.src}
                            alt="Uploaded preview"
                            className="block w-full h-auto"
                          />
                          <button
                            type="button"
                            onClick={handleReset}
                            className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-ink/90 text-cream text-[11px] font-mono uppercase tracking-super border border-cream/20 hover:bg-ink"
                          >
                            ↻ New photo
                          </button>
                        </div>
                        <PhotoEditor
                          adjust={adjust}
                          onChange={setAdjust}
                          onReset={() => setAdjust(DEFAULT_ADJUST)}
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
                        value={name}
                        onChange={setName}
                        placeholder="Your name"
                        maxLength={32}
                      />
                      <Field
                        label="Stack / Role"
                        value={stack}
                        onChange={setStack}
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
                      {builderTitle}
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
                        BUILDING YOUR ID…
                      </>
                    ) : (
                      <>
                        GENERATE MY BUILDER ID
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
                      Upload a photo and fill in your details to continue
                    </p>
                  )}
                </div>
              )}

              {step === 'generated' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-cream/15 bg-ink-900/40 p-5">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-super text-cream/60 mb-2">
                      Your Builder ID
                    </div>
                    <div
                      className="display-xl-tight text-3xl sm:text-4xl text-sun"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {name.toUpperCase()}
                    </div>
                    <div className="mt-1 text-cream/70 text-sm font-mono uppercase tracking-super">
                      {stack.toUpperCase()}
                    </div>
                    <div className="mt-4 text-pink display-xl-tight text-2xl">
                      {builderTitle}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="btn-primary w-full text-lg py-4"
                    disabled={!generatedUrl}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    DOWNLOAD ID
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
                    <div role="alert" className="rounded-xl border border-pink/40 bg-pink/10 p-4 text-sm text-cream">
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

            {/* Right column — preview */}
            <div className={step === 'generated' ? 'lg:col-span-7 order-1 lg:order-2' : 'lg:order-2'}>
              <div className="lg:sticky lg:top-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="pill text-cream/70 border-cream/15">
                    {step === 'generated' ? 'YOUR BUILDER ID' : 'PREVIEW'}
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
                        <BuilderIDPreview
                          ref={previewRef}
                          data={previewData}
                          size={CARD_W}
                          className="w-full h-full"
                        />
                      </ScaledPreview>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-cream/40 mt-3 text-center leading-relaxed">
                  Photo + name + stack + builder title + all branding, baked into one image.
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
            The road to 247 · 28—31 Oct 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

// Renders children at full export resolution while scaling the CSS so
// preview and export share the same DOM positioning.
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
