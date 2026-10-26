import React from 'react';
import { MapPin, Video, ExternalLink, Globe } from 'lucide-react';

interface EventLocationDisplayProps {
  location: string;
  className?: string;
  iconClassName?: string;
}

export interface ParsedLocation {
  type: 'meet' | 'map' | 'link' | 'mixed' | 'text';
  text: string;
  url: string | null;
  linkText: string | null;
}

export function parseEventLocation(raw: string): ParsedLocation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { type: 'text', text: '', url: null, linkText: null };
  }

  // Regex to extract URL (with or without http/https)
  const urlPattern =
    /(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps|zoom\.us|teams\.microsoft\.com)\/[^\s]+)/i;
  const match = trimmed.match(urlPattern);

  if (!match) {
    return { type: 'text', text: trimmed, url: null, linkText: null };
  }

  const rawUrl = match[0];
  const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`;

  const isFullUrl = trimmed === rawUrl;
  const textPrefix = trimmed.replace(rawUrl, '').trim().replace(/^[-–—:]|[-–—:]$/g, '').trim();

  // Determine link category
  const isMeet =
    /meet\.google\.com/i.test(url) ||
    /zoom\.us/i.test(url) ||
    /teams\.microsoft\.com/i.test(url);

  const isMap =
    /maps\.google\.com/i.test(url) ||
    /maps\.app\.goo\.gl/i.test(url) ||
    /goo\.gl\/maps/i.test(url) ||
    /google\.com\/maps/i.test(url);

  let category: 'meet' | 'map' | 'link' = 'link';
  let defaultLabel = 'Mở liên kết';

  if (isMeet) {
    category = 'meet';
    defaultLabel = /zoom\.us/i.test(url)
      ? 'Tham gia Zoom'
      : /teams\.microsoft\.com/i.test(url)
      ? 'Tham gia Teams'
      : 'Tham gia Google Meet';
  } else if (isMap) {
    category = 'map';
    defaultLabel = 'Xem trên Google Maps';
  }

  if (isFullUrl) {
    return {
      type: category,
      text: defaultLabel,
      url,
      linkText: defaultLabel,
    };
  }

  return {
    type: 'mixed',
    text: textPrefix || trimmed,
    url,
    linkText: defaultLabel,
  };
}

export const EventLocationDisplay: React.FC<EventLocationDisplayProps> = ({
  location,
  className = '',
  iconClassName = 'h-3.5 w-3.5 shrink-0',
}) => {
  const parsed = parseEventLocation(location);

  if (!parsed.url) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <MapPin className={`${iconClassName} text-circle-slate dark:text-circle-dark-muted`} />
        <span className="truncate">{parsed.text}</span>
      </div>
    );
  }

  // Pure Meeting Link (Google Meet, Zoom, etc.)
  if (parsed.type === 'meet') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Video className={`${iconClassName} text-blue-500`} />
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline"
          title={`Mở cuộc họp: ${parsed.url}`}
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-80" />
        </a>
      </div>
    );
  }

  // Pure Map Link (Google Maps)
  if (parsed.type === 'map') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <MapPin className={`${iconClassName} text-rose-500`} />
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold hover:underline"
          title={`Mở bản đồ: ${parsed.url}`}
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-80" />
        </a>
      </div>
    );
  }

  // Mixed text + URL (e.g. "Phòng B204 - meet.google.com/xyz")
  if (parsed.type === 'mixed') {
    return (
      <div className={`flex items-center flex-wrap gap-1.5 ${className}`}>
        <MapPin className={`${iconClassName} text-circle-slate dark:text-circle-dark-muted`} />
        {parsed.text && <span className="truncate font-medium">{parsed.text}</span>}
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-[10px] font-semibold transition-colors"
          title={parsed.url}
        >
          <span>{parsed.linkText}</span>
          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
        </a>
      </div>
    );
  }

  // Generic link
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Globe className={`${iconClassName} text-teal-500`} />
      <a
        href={parsed.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold hover:underline"
        title={parsed.url}
      >
        <span className="truncate">{parsed.text}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-80" />
      </a>
    </div>
  );
};
