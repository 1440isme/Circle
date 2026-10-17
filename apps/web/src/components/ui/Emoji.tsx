import React from 'react';

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
 * Premium Apple-style high-resolution Emoji component
 * Renders authentic, glossy Apple Color Emoji 160x160 with native text fallback.
 */
export const Emoji: React.FC<EmojiProps> = ({
  emoji,
  size = 18,
  className = '',
  style,
}) => {
  const src = `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=apple`;
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={`inline-flex items-center justify-center align-middle select-none shrink-0 ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        ...style,
      }}
    >
      <img
        src={src}
        alt={emoji}
        draggable={false}
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
        loading="lazy"
        onError={(e) => {
          // If network image fails, fallback to rendering the text character directly
          const target = e.currentTarget;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.textContent = emoji;
          }
        }}
      />
    </span>
  );
};
