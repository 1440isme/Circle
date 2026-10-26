import React from 'react';
import { MapPin, Video, ExternalLink, Globe } from 'lucide-react';

interface EventLocationDisplayProps {
  location: string;
  className?: string;
  iconClassName?: string;
}

export interface ParsedLocation {
  type: 'meet' | 'map' | 'link' | 'mixed' | 'text';
  category: 'meet' | 'map' | 'link' | 'text';
  text: string;
  url: string | null;
  linkText: string | null;
}

export function parseEventLocation(raw: string): ParsedLocation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { type: 'text', category: 'text', text: '', url: null, linkText: null };
  }

  // Regex to extract URL (with or without http/https)
  const urlPattern =
    /(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps|zoom\.us|teams\.microsoft\.com)\/[^\s]+)/i;
  const match = trimmed.match(urlPattern);

  if (!match) {
    return { type: 'text', category: 'text', text: trimmed, url: null, linkText: null };
  }

  const rawUrl = match[0];
  const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`;

  const isFullUrl = trimmed === rawUrl;
  const textPrefix = trimmed
    .replace(rawUrl, '')
    .trim()
    .replace(/\s*[-–—:]+\s*$/g, '')
    .trim();

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
      category,
      text: defaultLabel,
      url,
      linkText: defaultLabel,
    };
  }

  return {
    type: 'mixed',
    category,
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

  // 1. Plain text with no link
  if (!parsed.url) {
    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        <MapPin className={`${iconClassName} text-circle-slate dark:text-circle-dark-muted`} />
        <span className="truncate">{parsed.text}</span>
      </div>
    );
  }

  // 2. Pure Meeting Link
  if (parsed.type === 'meet') {
    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        <Video className={`${iconClassName} text-blue-500`} />
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="truncate font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1"
          title={`Mở cuộc họp: ${parsed.url}`}
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      </div>
    );
  }

  // 3. Pure Map Link
  if (parsed.type === 'map') {
    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        <MapPin className={`${iconClassName} text-rose-500`} />
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="truncate font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline inline-flex items-center gap-1"
          title={`Mở Google Maps: ${parsed.url}`}
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      </div>
    );
  }

  // 4. Mixed text with embedded URL (Clicking text directly opens link, NO separate button)
  if (parsed.type === 'mixed') {
    const isMapCategory = parsed.category === 'map';
    const isMeetCategory = parsed.category === 'meet';

    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        {isMeetCategory ? (
          <Video className={`${iconClassName} text-blue-500`} />
        ) : (
          <MapPin
            className={`${iconClassName} ${
              isMapCategory ? 'text-rose-500' : 'text-circle-slate dark:text-circle-dark-muted'
            }`}
          />
        )}
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`truncate font-semibold hover:underline inline-flex items-center gap-1 transition-colors ${
            isMeetCategory
              ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
              : isMapCategory
              ? 'text-circle-charcoal dark:text-circle-dark-text hover:text-rose-600 dark:hover:text-rose-400'
              : 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300'
          }`}
          title={isMapCategory ? `Mở trên Google Maps: ${parsed.url}` : parsed.url}
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
        </a>
      </div>
    );
  }

  // 5. Generic Web Link
  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
      <Globe className={`${iconClassName} text-teal-500`} />
      <a
        href={parsed.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="truncate font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline inline-flex items-center gap-1"
        title={parsed.url}
      >
        <span className="truncate">{parsed.text}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </a>
    </div>
  );
};
