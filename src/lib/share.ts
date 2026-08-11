// X (Twitter) share via Web Intent. The browser cannot upload a file directly
// to X — we use the Web Intent URL with a pre-filled caption + link to a
// public share page. The share page has Open Graph metadata so X renders
// the user's actual graphic as the link preview.
//
// Hosting the generated graphic:
//   If VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY + VITE_SUPABASE_BUCKET are
//   set in env, we upload the PNG to Supabase Storage (public bucket) and
//   use the public URL as the og:image. This is what X's crawler will see.
//
//   If those env vars are missing, we fall back to embedding the image as a
//   data URL in the share URL. That works for short links but most PNGs
//   exceed safe URL length, so the upload path is strongly recommended.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sanitizeFilename } from './export';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
const SUPABASE_BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined)?.trim() || 'hh-goa-2026';

export const SHARE_URL_BASE = (typeof window !== 'undefined' ? window.location.origin : '').replace(/\/$/, '');
export const SHARE_TEXT =
  'Just built my Hacker House Goa 2026 Builder ID. See you in Goa. #FrameInGoa';

let supabaseClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}

export function isShareHosted(): boolean {
  return !!getSupabase();
}

function buildShareSlug(): string {
  const stamp = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `id-${stamp}-${rnd}`;
}

function buildShareUrl(slug: string): string {
  return `${SHARE_URL_BASE}/s/${slug}`;
}

function buildXIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function openXShare(text: string, url: string): void {
  window.open(buildXIntentUrl(text, url), '_blank', 'noopener,noreferrer');
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export type UploadedShare = {
  publicUrl: string;
  storagePath: string;
};

export async function uploadGeneratedImage(dataUrl: string): Promise<UploadedShare> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Share hosting is not configured.');
  }
  const blob = await dataUrlToBlob(dataUrl);
  const slug = buildShareSlug();
  const path = `builder-id/${slug}.png`;

  const { error: uploadError } = await sb.storage
    .from(SUPABASE_BUCKET)
    .upload(path, blob, {
      cacheControl: '31536000',
      upsert: true,
      contentType: 'image/png',
    });
  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }
  const { data } = sb.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Could not get public URL.');
  }
  return { publicUrl: data.publicUrl, storagePath: path };
}

// Build a share URL given the hosted or data URL image.
// The share page (/s/<slug>) reads ?img=<url> and renders og:image from it.
export function buildShareLink(opts: {
  hostedImageUrl?: string;
  dataUrl?: string;
}): string {
  const slug = buildShareSlug();
  const params = new URLSearchParams();
  if (opts.hostedImageUrl) params.set('img', opts.hostedImageUrl);
  else if (opts.dataUrl) params.set('img', opts.dataUrl);
  return `${buildShareUrl(slug)}?${params.toString()}`;
}

export { sanitizeFilename };
