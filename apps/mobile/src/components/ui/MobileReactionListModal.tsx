import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image as RNImage,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Smile } from 'lucide-react-native';
import { Emoji } from './Emoji';

export interface MobileReactionListModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  reactions?: any[];
  reactionCounts?: Record<string, number>;
  colors: any;
  t: any;
  isDark?: boolean;
}

export function normalizeMobileReactionItem(r: any, defaultName: string) {
  if (!r) return { emoji: '', name: defaultName, avatarUrl: null, id: '' };
  const emoji = r.emoji || '';
  const memberUser = r.member?.user;
  const profile = memberUser?.profile;
  const name =
    r.name ||
    r.member?.nickname ||
    profile?.displayName ||
    r.user?.displayName ||
    r.user?.profile?.displayName ||
    memberUser?.email?.split('@')[0] ||
    defaultName;
  const avatarUrl =
    r.avatarUrl !== undefined
      ? r.avatarUrl
      : profile?.avatarUrl || r.user?.avatarUrl || r.user?.profile?.avatarUrl || null;

  return {
    id: r.id || `${name}-${emoji}`,
    emoji,
    name,
    avatarUrl,
    createdAt: r.createdAt,
  };
}

export const MobileReactionListModal: React.FC<MobileReactionListModalProps> = ({
  visible,
  onClose,
  title,
  reactions = [],
  reactionCounts,
  colors,
  t,
  isDark = false,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedEmojiFilter, setSelectedEmojiFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSelectedEmojiFilter(null);
  }, [visible]);

  if (!visible) return null;

  const defaultName = t?.chat?.defaultMemberName || t?.collab?.memberDefault || 'Thành viên';
  const normalizedList = reactions.map((r) => normalizeMobileReactionItem(r, defaultName));

  const computedCounts: Record<string, number> = reactionCounts
    ? { ...reactionCounts }
    : normalizedList.reduce<Record<string, number>>((acc, item) => {
        if (item.emoji) {
          acc[item.emoji] = (acc[item.emoji] || 0) + 1;
        }
        return acc;
      }, {});

  const emojiTabs = Object.keys(computedCounts);
  const totalCount = Object.values(computedCounts).reduce((acc, count) => acc + count, 0);

  const filteredReactions = selectedEmojiFilter
    ? normalizedList.filter((r) => r.emoji === selectedEmojiFilter)
    : normalizedList;

  const headerTitle = title || t?.chat?.reactorsListTitle || t?.moments?.reactionsTitle || 'Người thả cảm xúc';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.scrim}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.elevated : colors.surface,
              borderColor: colors.hairline,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Top grabber */}
          <View style={[styles.grabber, { backgroundColor: colors.hairline }]} />

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerTitleWrap}>
              <Smile size={16} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {headerTitle}
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.wash }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {totalCount}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
              accessibilityLabel={t?.common?.close || 'Đóng'}
            >
              <X size={16} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Emoji Tabs Filter */}
          {emojiTabs.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
              style={{ maxHeight: 46 }}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setSelectedEmojiFilter(null)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor:
                      selectedEmojiFilter === null ? colors.primary : colors.wash,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color:
                        selectedEmojiFilter === null
                          ? colors.onPrimary || '#FFFFFF'
                          : colors.text,
                    },
                  ]}
                >
                  {t?.moments?.viewAll || t?.common?.all || 'Tất cả'} ({totalCount})
                </Text>
              </TouchableOpacity>
              {emojiTabs.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.75}
                  onPress={() => setSelectedEmojiFilter(emoji)}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor:
                        selectedEmojiFilter === emoji ? colors.primary : colors.wash,
                    },
                  ]}
                >
                  <Emoji emoji={emoji} size={14} />
                  <Text
                    style={[
                      styles.tabPillText,
                      {
                        color:
                          selectedEmojiFilter === emoji
                            ? colors.onPrimary || '#FFFFFF'
                            : colors.text,
                      },
                    ]}
                  >
                    {computedCounts[emoji]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Reactors List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredReactions.length > 0 ? (
              filteredReactions.map((r, idx) => {
                const name = r.name;
                const avatar = r.avatarUrl;

                return (
                  <View
                    key={r.id || `reactor-${idx}`}
                    style={[
                      styles.reactorRow,
                      {
                        backgroundColor: colors.wash,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.avatarWrap}>
                      {avatar ? (
                        <RNImage source={{ uri: avatar }} style={styles.avatarImg} />
                      ) : (
                        <View
                          style={[
                            styles.avatarFallback,
                            { backgroundColor: colors.wash },
                          ]}
                        >
                          <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                            {name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      numberOfLines={1}
                      style={[styles.reactorName, { color: colors.text }]}
                    >
                      {name}
                    </Text>

                    <View
                      style={[
                        styles.emojiBadge,
                        {
                          backgroundColor: isDark ? colors.elevated : '#FFFFFF',
                          borderColor: colors.hairline,
                        },
                      ]}
                    >
                      <Emoji emoji={r.emoji} size={16} />
                    </View>
                  </View>
                );
              })
            ) : emojiTabs.length > 0 ? (
              <View style={{ gap: 8, paddingVertical: 8 }}>
                {emojiTabs.map((emoji) => (
                  <View
                    key={emoji}
                    style={[
                      styles.reactorRow,
                      {
                        backgroundColor: colors.wash,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    <Emoji emoji={emoji} size={20} />
                    <Text style={[styles.reactorName, { color: colors.text }]}>
                      {computedCounts[emoji]} {t?.chat?.reactionsCountSuffix || 'lượt'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Smile size={32} color={colors.subtle} />
                <Text style={[styles.emptyText, { color: colors.subtle }]}>
                  {t?.chat?.noReactionsYet || t?.moments?.noReactorsForEmoji || 'Chưa có cảm xúc nào'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    flexGrow: 0,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 12,
    gap: 8,
  },
  reactorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '700',
  },
  reactorName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  emojiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
});
