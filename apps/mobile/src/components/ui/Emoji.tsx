import React, { useState } from 'react';
import { Image as RNImage, Text, View, StyleSheet } from 'react-native';

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
  return r.filter((x) => x !== 'fe0f').join('-');
}

interface EmojiProps {
  emoji: string;
  size?: number;
  style?: any;
}

/**
 * Premium Apple-style high-resolution Emoji component for Mobile
 * Renders authentic, glossy Apple Color Emoji 160x160 with native text fallback.
 */
export const Emoji: React.FC<EmojiProps> = ({
  emoji,
  size = 18,
  style,
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const uri = `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=apple`;

  if (loadFailed) {
    return (
      <Text style={[{ fontSize: size, lineHeight: size * 1.15 }, style]}>
        {emoji}
      </Text>
    );
  }

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <RNImage
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setLoadFailed(true)}
      />
    </View>
  );
};
