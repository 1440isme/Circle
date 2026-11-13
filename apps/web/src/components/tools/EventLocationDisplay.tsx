'use client';

import React from 'react';
import { MapPin, Video, ExternalLink, Globe } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';

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

export interface EventLocationLabels {
  openLink?: string;
  joinZoom?: string;
  joinTeams?: string;
  joinMeet?: string;
  viewMaps?: string;
}

export function parseEventLocation(
  raw: string,
  labels?: EventLocationLabels,
): ParsedLocation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { type: 'text', category: 'text', text: '', url: null, linkText: null };
  }

  const urlPattern =
    /(https?:\/\/[^\s]+|(?:meet\.google\.com|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps|zoom\.us|teams\.microsoft\.com)\/[^\s]+)/i;
  const match = trimmed.match(urlPattern);

  if (!match) {
    return { type: 'text', category: 'text', text: trimmed, url: null, linkText: null };
  }

  const rawUrl = match[0];
  const url =
    rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`;

  const isFullUrl = trimmed === rawUrl;
  const textPrefix = trimmed
    .replace(rawUrl, '')
    .trim()
    .replace(/\s*[-–—:]+\s*$/g, '')
    .trim();

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
  let defaultLabel = labels?.openLink || 'Open link';

  if (isMeet) {
    category = 'meet';
    defaultLabel = /zoom\.us/i.test(url)
      ? labels?.joinZoom || 'Join Zoom'
      : /teams\.microsoft\.com/i.test(url)
        ? labels?.joinTeams || 'Join Teams'
        : labels?.joinMeet || 'Join Google Meet';
  } else if (isMap) {
    category = 'map';
    defaultLabel = labels?.viewMaps || 'View on Google Maps';
  }

  if (isFullUrl) {
    return {
      type: category,
      category,
      text: rawUrl,
      url,
      linkText: null,
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
  const t = useLanguageStore((s) => s.t);

  const parsed = parseEventLocation(location, {
    openLink: t.collab.eventLocationOpenLink,
    joinZoom: t.collab.eventLocationJoinZoom,
    joinTeams: t.collab.eventLocationJoinTeams,
    joinMeet: t.collab.eventLocationJoinMeet,
    viewMaps: t.collab.eventLocationViewMaps,
  });

  if (!parsed.url) {
    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        <MapPin className={`${iconClassName} text-circle-slate dark:text-circle-dark-muted`} />
        <span className="truncate">{parsed.text}</span>
      </div>
    );
  }

  if (parsed.type === 'meet') {
    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        <Video className={`${iconClassName} text-circle-sage dark:text-circle-dark-primary`} />
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="truncate font-semibold text-circle-sage dark:text-circle-dark-primary hover:underline inline-flex items-center gap-1"
          title={t.collab.eventLocationOpenMeeting.replace('{url}', parsed.url)}
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      </div>
    );
  }

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
          title={t.collab.eventLocationOpenMaps.replace('{url}', parsed.url)}
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      </div>
    );
  }

  if (parsed.type === 'mixed') {
    const isMapCategory = parsed.category === 'map';
    const isMeetCategory = parsed.category === 'meet';

    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
        {isMeetCategory ? (
          <Video className={`${iconClassName} text-circle-sage dark:text-circle-dark-primary`} />
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
              ? 'text-circle-sage dark:text-circle-dark-primary'
              : isMapCategory
                ? 'text-circle-charcoal dark:text-circle-dark-text hover:text-rose-600 dark:hover:text-rose-400'
                : 'text-circle-sage dark:text-circle-dark-primary'
          }`}
          title={
            isMapCategory
              ? t.collab.eventLocationOpenMaps.replace('{url}', parsed.url)
              : parsed.url
          }
        >
          <span className="truncate">{parsed.text}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
      <Globe className={`${iconClassName} text-circle-sage dark:text-circle-dark-primary`} />
      <a
        href={parsed.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="truncate font-semibold text-circle-sage dark:text-circle-dark-primary hover:underline inline-flex items-center gap-1"
        title={parsed.url}
      >
        <span className="truncate">{parsed.text}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </a>
    </div>
  );
};
