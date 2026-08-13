// CardPreview — renders the live composited card (master artwork +
// optional user photo). Uses an <img> for the initial-state "show
// the original card" experience, and switches to a <canvas> as soon
// as the user uploads a photo. The canvas is what we later export
// at full resolution.

import React, { useEffect, useRef, useState } from 'react';
import {
  composeCardAsync,
  loadMasterCard,
  type PhotoInput,
} from '../lib/cardComposer';
import { DEFAULT_ADJUST, type CropAdjust } from '../lib/image';

type Props = {
  // The user's uploaded image (HTMLImageElement), or null when nothing
  // has been uploaded yet. The initial state shows the original card.
  photoImage: HTMLImageElement | null;
  // The crop adjustment the user has dialed in. Ignored if no photo.
  adjust: CropAdjust;
  // When true, the preview is hidden (used for the generated state).
  visible?: boolean;
};

export function CardPreview({ photoImage, adjust, visible = true }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const masterRef = useRef<HTMLImageElement | null>(null);
  const photoRef = useRef<PhotoInput | null>(null);
  const rafRef = useRef<number | null>(null);

  // Preload master card once.
  useEffect(() => {
    let cancelled = false;
    loadMasterCard().then((img) => {
      if (!cancelled) masterRef.current = img;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-render the composited canvas whenever photo or adjust changes.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!photoImage) {
      setDataUrl(null);
      return;
    }
    // Debounce via RAF so slider drag doesn't spam the composer.
    rafRef.current = requestAnimationFrame(async () => {
      const photo: PhotoInput = {
        image: photoImage,
        width: photoImage.naturalWidth,
        height: photoImage.naturalHeight,
        adjust,
      };
      photoRef.current = photo;
      const canvas = await composeCardAsync({
        // Preview at the native 1684×2528 size for crisp display.
        photo,
      });
      setDataUrl(canvas.toDataURL('image/png'));
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [photoImage, adjust.scale, adjust.offsetX, adjust.offsetY]);

  if (!visible) return null;

  // The preview is always shown at the card's native aspect ratio
  // (682:1024 = 0.666). Width is set to "min(100%, 460px)" via the
  // parent. This component is just the artwork itself.
  return (
    <div className="relative w-full h-full">
      {/* Show the master card when no photo, or the composited preview once a photo is set. */}
      {photoImage && dataUrl ? (
        <img
          src={dataUrl}
          alt="Your Hacker House Goa builder card"
          className="block w-full h-full object-contain select-none"
          draggable={false}
        />
      ) : (
        <img
          src="/ticket.png"
          alt="Hacker House Goa 2026 builder card — the master artwork"
          className="block w-full h-full object-contain select-none"
          draggable={false}
        />
      )}
    </div>
  );
}

export const DEFAULT_PHOTO_ADJUST: CropAdjust = DEFAULT_ADJUST;
