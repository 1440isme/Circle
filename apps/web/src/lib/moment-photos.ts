/**
 * Utility to parse dual camera Moment URLs.
 * Format: `${mainUrl}#pip=${encodeURIComponent(pipUrl)}#corner=${cornerIndex}`
 */

export interface ParsedMomentPhotos {
  mainUrl: string;
  pipUrl: string | null;
  cornerIndex: number;
}

export function parseMomentPhotos(rawUrl?: string | null): ParsedMomentPhotos {
  if (!rawUrl) {
    return { mainUrl: '', pipUrl: null, cornerIndex: 0 };
  }

  if (rawUrl.includes('#pip=')) {
    const parts = rawUrl.split('#pip=');
    const main = parts[0] || '';
    const pipPart = decodeURIComponent(parts[1] || '');
    let pip = pipPart;
    let cornerIndex = 0;

    if (pipPart.includes('#corner=')) {
      const pipSplit = pipPart.split('#corner=');
      pip = pipSplit[0] || '';
      cornerIndex = parseInt(pipSplit[1] || '0', 10) || 0;
    }

    return {
      mainUrl: main,
      pipUrl: pip || null,
      cornerIndex,
    };
  }

  return { mainUrl: rawUrl, pipUrl: null, cornerIndex: 0 };
}
