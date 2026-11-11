import React, { useState } from 'react';

/**
 * Convert any emoji character to Twitter/Apple standard hex code points
 */
export function emojiToCodePoint(str: string): string {
  const r: string[] = [];
  let p = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      p = 0;
    } else if (0xd800 <= c && c <= 0xdbff) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  // Filter standard variation selector FE0F
  return r.filter((x) => x !== 'fe0f').join('-');
}

interface EmojiProps {
  emoji: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reliable Emoji component with always-visible native fallback underneath
 * and Apple Color Emoji CDN overlay that cross-fades cleanly upon load.
 */
export const Emoji: React.FC<EmojiProps> = ({
  emoji,
  size = 18,
  className = '',
  style,
}) => {
  const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const src = `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=apple`;
  const numericSize = typeof size === 'number' ? size : parseFloat(String(size)) || 18;
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={`relative inline-flex items-center justify-center align-middle select-none shrink-0 ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        lineHeight: pixelSize,
        fontSize: `${Math.max(11, Math.round(numericSize * 0.84))}px`,
        ...style,
      }}
      aria-label={emoji}
    >
      <span
        className={`leading-none select-none transition-opacity duration-150 ${
          imgState === 'loaded' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {emoji}
      </span>
      {imgState !== 'error' && (
        <img
          src={src}
          alt={emoji}
          draggable={false}
          loading="lazy"
          onLoad={() => setImgState('loaded')}
          onError={() => setImgState('error')}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] transition-opacity duration-150 ${
            imgState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </span>
  );
};
