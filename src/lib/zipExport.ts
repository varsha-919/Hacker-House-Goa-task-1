// ZIP export — bundles multiple PNG files into a single .zip and
// triggers a browser download. Uses fflate for browser-side zipping
// with zero dependencies and no server round-trip.
//
// Usage:
//   await downloadZip(
//     [
//       { name: 'card-alex.png', data: pngBytes },
//       { name: 'card-blair.png', data: pngBytes },
//     ],
//     'team-cards.zip',
//   );

import { zip } from 'fflate';

export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

export async function downloadZip(
  files: ZipEntry[],
  zipFilename: string,
): Promise<void> {
  if (files.length === 0) {
    throw new Error('No files to bundle.');
  }

  // Build a record keyed by entry name. fflate accepts a record of
  // { [name]: data } and produces a single zipped Uint8Array.
  const record: Record<string, Uint8Array> = {};
  for (const f of files) {
    record[f.name] = f.data;
  }

  const zipped = await new Promise<Uint8Array>((resolve, reject) => {
    zip(record, { level: 6 }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  // Wrap as a Blob, create an object URL, trigger download.
  const blob = new Blob([zipped], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}