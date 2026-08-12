import React, { useRef, useState } from 'react';

type Props = {
  onFile: (file: File) => void;
  onError?: (msg: string) => void;
  loading?: boolean;
};

export function PhotoUploader({ onFile, onError, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ok =
      /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name) ||
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(
        file.type,
      );
    if (!ok) {
      onError?.('That file type is not supported. Please pick a JPG, PNG, or HEIC photo.');
      return;
    }
    onFile(file);
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
        handleFiles(e.dataTransfer.files);
      }}
      disabled={loading}
      aria-label="Upload your photo"
      className={[
        'group relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-all',
        'flex flex-col items-center justify-center text-center',
        'min-h-[200px] sm:min-h-[240px] p-6 sm:p-8',
        dragOver
          ? 'border-sun bg-sun/15'
          : 'border-ink/25 bg-cream hover:border-pink hover:bg-cream-50',
        loading ? 'opacity-60 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-sun flex items-center justify-center text-ink text-2xl font-bold leading-none border-2 border-ink">
          +
        </div>
        <div>
          <div className="text-ink display-xl-tight text-2xl sm:text-3xl">
            {loading ? 'READING PHOTO…' : 'DROP YOUR PHOTO HERE'}
          </div>
          <div className="text-ink/60 text-xs sm:text-sm mt-2 tracking-super font-mono uppercase">
            JPG · PNG · HEIC from iPhone
          </div>
        </div>
      </div>

      {/* striped accent corners */}
      <span
        className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-sun"
        aria-hidden
      />
      <span
        className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-pink"
        aria-hidden
      />
      <span
        className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-pink"
        aria-hidden
      />
      <span
        className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-sun"
        aria-hidden
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </button>
  );
}
