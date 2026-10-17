import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Search } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { EMOJI_CATEGORIES, EmojiCategory } from '@circle/shared';
import { Emoji } from './Emoji';

interface FullEmojiPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FullEmojiPickerModal: React.FC<FullEmojiPickerModalProps> = ({
  visible,
  onClose,
  onSelectEmoji,
  title = 'Chọn biểu cảm',
}) => {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const glassTheme = getGlassTheme(isDark, uiStyle);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(EMOJI_CATEGORIES[0]?.id || 'smileys');
  const [searchQuery, setSearchQuery] = useState('');

  if (!visible) return null;

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId) || EMOJI_CATEGORIES[0];

  const displayedEmojis = searchQuery.trim().length > 0
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : currentCategory.emojis;

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

        <BlurView
          intensity={glassTheme.blur.intensity + 20}
          tint={glassTheme.blur.tint}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: glassTheme.colors.glassBgSheet,
              borderColor: glassTheme.colors.glassBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <View style={[styles.categoryBar, { borderBottomColor: colors.hairline }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {EMOJI_CATEGORIES.map((cat) => {
                const isActive = activeCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setActiveCategoryId(cat.id);
                      setSearchQuery('');
                    }}
                    style={[
                      styles.categoryTab,
                      isActive && [styles.categoryTabActive, { backgroundColor: colors.wash, borderColor: colors.hairline }],
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryName,
                        { color: isActive ? colors.text : colors.subtle },
                        isActive && { fontWeight: '700' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Emoji Grid */}
          <ScrollView
            style={styles.emojiScroll}
            contentContainerStyle={styles.emojiGrid}
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
        </BlurView>
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
    maxHeight: SCREEN_HEIGHT * 0.62,
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
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {},
  categoryIcon: {
    fontSize: 15,
  },
  categoryName: {
    fontSize: 12,
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
