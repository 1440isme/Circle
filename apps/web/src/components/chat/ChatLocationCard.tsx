'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';

interface ChatLocationCardProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  isSenderMe?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const ChatLocationCard: React.FC<ChatLocationCardProps> = ({
  lat,
  lng,
  title,
  address,
  isSenderMe = false,
}) => {
  const t = useLanguageStore((s) => s.t);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const [imageError, setImageError] = useState(false);

  const displayTitle = title || t.collab.locationCardTitle;
  const displayAddress = address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/static/pin-s-heart+2563eb(${lng},${lat})/${lng},${lat},14,0/400x180@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <div className="flex flex-col gap-2.5 py-1 min-w-[240px] max-w-[320px] select-none text-left">
      {/* Header Info */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSenderMe
              ? 'bg-black/15 dark:bg-white/15 text-current'
              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
          }`}
        >
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className={`text-xs font-bold truncate ${
              isSenderMe ? 'text-current' : 'text-circle-charcoal dark:text-circle-dark-text'
            }`}
          >
            {displayTitle}
          </span>
          <span
            className={`text-[11px] truncate ${
              isSenderMe ? 'text-current opacity-80' : 'text-circle-slate dark:text-circle-dark-muted'
            }`}
          >
            {displayAddress}
          </span>
        </div>
      </div>

      {/* Styled Mapbox Preview */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-32 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-slate-900 flex items-center justify-center group shadow-xs cursor-pointer"
        title={t.collab.openInGoogleMaps}
      >
        {!imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staticMapUrl}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            {/* Fallback Grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf810_1px,transparent_1px),linear-gradient(to_bottom,#38bdf810_1px,transparent_1px)] bg-[size:16px_16px]" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.6)]">
                <Navigation className="w-4 h-4 fill-current rotate-45" />
              </div>
              <span className="mt-1 text-[10px] font-mono font-bold text-sky-200 bg-slate-950/80 px-2 py-0.5 rounded-full border border-sky-400/30">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>
          </>
        )}

        <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <span>Mapbox</span>
        </div>
      </a>

      {/* Action: Open in Maps */}
      <div className="pt-0.5 flex justify-end">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            isSenderMe
              ? 'bg-black/15 hover:bg-black/25 text-current'
              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t.collab.openInGoogleMaps}</span>
        </a>
      </div>
    </div>
  );
};
