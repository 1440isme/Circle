import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { EMOJI_CATEGORIES } from '@circle/shared';
import { Emoji } from './Emoji';

interface FullEmojiPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  title?: string;
}

export const FullEmojiPickerModal: React.FC<FullEmojiPickerModalProps> = ({
  visible,
  onClose,
  onSelectEmoji,
  title,
}) => {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const resolvedTitle = title || t.emoji.title;
  const isDark = resolvedTheme === 'dark';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    EMOJI_CATEGORIES[0]?.id || 'smileys',
  );

  if (!visible) return null;

  const currentCategory =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId) || EMOJI_CATEGORIES[0];

  const displayedEmojis = currentCategory.emojis;

  const sheetInner = (
    <>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
        <Text style={[styles.titleText, { color: colors.text }]}>{resolvedTitle}</Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.closeBtn, { backgroundColor: colors.wash }]}
          accessibilityLabel={t.common.close}
        >
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs (Clean Icon-Only Tabs) */}
      <View style={[styles.categoryBar, { borderBottomColor: colors.hairline }]}>
        <View style={styles.categoryIconsRow}>
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const categoryName = (t.emoji.categories as any)?.[cat.id] || cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategoryId(cat.id)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                style={[
                  styles.categoryTab,
                  isActive && [
                    styles.categoryTabActive,
                    { backgroundColor: colors.wash, borderColor: colors.hairline },
                  ],
                ]}
                accessibilityLabel={categoryName}
              >
                <Text style={[styles.categoryIcon, { fontSize: 20 }]}>{cat.icon}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Emoji Grid */}
      <ScrollView
        style={styles.emojiScroll}
        contentContainerStyle={[
          styles.emojiGrid,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={true}
      >
        {displayedEmojis.map((emoji, index) => (
          <TouchableOpacity
            key={`${emoji}-${index}`}
            activeOpacity={0.65}
            onPress={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            style={styles.emojiGridItem}
          >
            <Emoji emoji={emoji} size={30} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={onClose}
        />

        {uiStyle === 'glass' ? (
          <BlurView
            intensity={glassTheme.blur.intensity}
            tint={glassTheme.blur.tint}
            style={[
              styles.sheetContainer,
              {
                maxHeight: screenHeight * 0.62,
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: glassTheme.colors.glassBorder,
              },
            ]}
          >
            {sheetInner}
          </BlurView>
        ) : (
          <View
            style={[
              styles.sheetContainer,
              {
                maxHeight: screenHeight * 0.62,
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: colors.hairline,
              },
            ]}
          >
            {sheetInner}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    minHeight: 380,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBar: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {},
  categoryIcon: {
    fontSize: 20,
  },
  emojiScroll: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  emojiGridItem: {
    width: '14.28%', // 7 emojis per row
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
});
