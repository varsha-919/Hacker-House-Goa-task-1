// Share page — receives the user's generated Builder ID via a query parameter
// and renders it inside Open Graph metadata so the X link preview shows the
// actual image (not a generic thumbnail).

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const CAPTION = 'Just built my Hacker House Goa 2026 Builder ID. See you in Goa. #FrameInGoa';

function SharePage() {
  const [img, setImg] = useState<string | null>(null);
  const [isHostedImage, setIsHostedImage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const imgParam = params.get('img');
    const hosted = imgParam ? /^https?:\/\//i.test(imgParam) : false;
    setImg(imgParam);
    setIsHostedImage(hosted);

    if (imgParam) {
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:image', imgParam, 'name');
      setMeta('twitter:image:src', imgParam, 'name');
      setMeta('og:image', imgParam, 'property');
      setMeta('og:image:secure_url', imgParam, 'property');
      setMeta('og:image:type', 'image/png', 'property');
      setMeta('og:image:width', '1684', 'property');
      setMeta('og:image:height', '2528', 'property');
      setMeta('og:title', 'Hacker House Goa 2026 · Builder ID', 'property');
      setMeta('og:description', CAPTION, 'property');
      setMeta('twitter:title', 'Hacker House Goa 2026 · Builder ID', 'name');
      setMeta('twitter:description', CAPTION, 'name');
    }
  }, []);

  if (!img) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-xl bg-sun mx-auto mb-4 flex items-center justify-center">
            <span
              className="text-ink"
              style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 24, letterSpacing: '-1px' }}
            >
              HH
            </span>
          </div>
          <h1 className="text-cream display-xl text-3xl mb-2">NO BUILDER ID FOUND</h1>
          <p className="text-cream/60 text-sm leading-relaxed">
            This share link is missing its image. Build a fresh Builder ID on the home page and try sharing again.
          </p>
          <a href="/" className="btn-primary mt-6 inline-flex">
            Build my Builder ID
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div className="text-center mb-6">
        <div className="pill text-cream/70 border-cream/15 mb-3 inline-flex">
          <span className="w-1.5 h-1.5 rounded-full bg-pink" />
          BUILDER ID
        </div>
        <h1 className="text-cream display-xl text-3xl sm:text-4xl">
          YOUR GOA 2026 ID
        </h1>
      </div>

      <div className="rounded-2xl border border-cream/10 bg-ink-900/30 p-3 sm:p-4 mb-6 max-w-full">
        <img
          src={img}
          alt="Hacker House Goa 2026 Builder ID"
          className="block max-w-full h-auto rounded-md"
          style={{ width: 'min(90vw, 460px)', height: 'auto' }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a href={img} download="hh-goa-2026-builder-id.png" className="btn-primary">
          Download image
        </a>
        <a href="/" className="btn-ghost">
          Build yours
        </a>
      </div>

      <p className="text-cream/40 text-xs mt-6 text-center max-w-sm">
        This page is the link preview shown when this Builder ID is shared on X.
        You're seeing the same image right here.
        {!isHostedImage && (
          <span className="block mt-2 text-cream/30">
            Tip: configure Supabase Storage so the share link is short and the preview renders on every client.
          </span>
        )}
      </p>
    </main>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SharePage />);
}

export default SharePage;
