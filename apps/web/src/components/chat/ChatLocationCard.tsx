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
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/static/pin-s-heart+10b981(${lng},${lat})/${lng},${lat},14,0/400x180@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block w-full min-w-[240px] max-w-[320px] h-36 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-slate-900 group shadow-sm select-none cursor-pointer transition-transform active:scale-[0.99]"
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
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98110_1px,transparent_1px),linear-gradient(to_bottom,#10b98110_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full bg-circle-primary text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.6)]">
              <Navigation className="w-4 h-4 fill-current rotate-45" />
            </div>
            <span className="mt-1 text-[10px] font-mono font-bold text-emerald-200 bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
        </>
      )}

      {/* Floating Bottom Info Overlay (Title + Address + Mapbox attribution) */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-white">
            <MapPin className="w-3.5 h-3.5 text-circle-primary shrink-0" />
            <span className="text-xs font-bold truncate drop-shadow-xs">{displayTitle}</span>
          </div>
          <span className="text-[10px] text-white/80 truncate block pl-5 drop-shadow-xs">{displayAddress}</span>
        </div>
        <span className="text-[9px] text-white/60 font-mono shrink-0">Mapbox</span>
      </div>
    </a>
  );
};
