HH GOA 2026 FRAME GENERATOR
============================

Build your Hacker House Goa 2026 identity. Pick a frame or craft a builder card.
Download it. Share it on X. #FrameInGoa

SETUP
-----

    npm install

DEV
---

    npm run dev

Open http://localhost:5173.

BUILD
-----

    npm run build

Outputs static assets into `dist/`.

DEPLOY (VERCEL)
---------------

    vercel

Or import the repo in the Vercel dashboard. No environment variables are
required. All image generation runs entirely in the browser.

ARCHITECTURE
------------

Frontend only. No backend. The generated PNG is rendered to a canvas by
html-to-image, then either downloaded directly or routed through the in-app
share page (/s/<slug>?img=<data-url>) which dynamically sets
og:image / twitter:image so X renders the actual graphic in the link preview.

FORMAT A — PFP FRAME
    1080 × 1080 PNG. The photo dominates the center; the HH Goa 2026 brand
    wraps the edges.

FORMAT B — BUILDER ID CARD
    1080 × 1350 PNG. Photo top-right, name + stack + auto-generated builder
    title on a cream/pink layout.

ENVIRONMENT VARIABLES
---------------------

None required. See `.env.example` for optional overrides.

HEIC HANDLING
-------------

Browsers don't decode HEIC. We use `heic2any` to convert HEIC -> JPEG in the
browser before any other processing. JPG, PNG, WEBP, GIF pass through
unchanged.

NOTES ON SHARE-TO-X
-------------------

Browsers cannot attach a local file to an X Web Intent. The chosen path is:
  1. Generate the image (PNG data URL).
  2. Encode it into a URL-safe query param on the in-app share page.
  3. The share page sets og:image / twitter:image meta tags dynamically.
  4. The X Web Intent URL contains the share page URL + caption.

This produces a real preview that shows the user's actual graphic, not a
generic thumbnail.

The share page is rendered client-side because data URLs can't be embedded
into a server-rendered HTML file at scale. X's crawler runs JavaScript when
it encounters summary_large_image cards, so this works in practice.

LIMITATIONS
-----------

- The share URL embeds the image as a data URL, which makes it long.
  Acceptable for short-lived links; not a substitute for permanent storage.
- For an even more robust share path (shorter URLs, crawler-friendly CDN
  images) you can wire this up to Supabase Storage or S3 + a /api/share
  endpoint. The architecture supports adding that without changes to the UI.
