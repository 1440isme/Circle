import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { X, Search, MessageSquare, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { searchMessagesApi } from '../../services/chat.service';
import { MessageEntity } from '@circle/types';

interface SearchMessagesModalProps {
  visible: boolean;
  onClose: () => void;
  channelId: string | null;
  onJumpToMessage: (messageId: string) => void;
  colors: any;
  t: any;
}

export const SearchMessagesModal: React.FC<SearchMessagesModalProps> = ({
  visible,
  onClose,
  channelId,
  onJumpToMessage,
  colors,
  t,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setIsLoading(false);
      return;
    }
  }, [visible]);

  useEffect(() => {
    if (!channelId || !query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchMessagesApi(channelId, query.trim());
        setResults(res.messages || []);
      } catch (err) {
        console.error('Failed to search messages:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [channelId, query]);

  if (!visible) return null;

  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <Text style={{ color: colors.text }}>{text}</Text>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <Text style={{ color: colors.text }}>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <Text
              key={index}
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.35)',
                color: colors.text,
                fontWeight: '700',
              }}
            >
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          ),
        )}
      </Text>
    );
  };

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

        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          <View style={[styles.grabber, { backgroundColor: colors.hairline }]} />

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.searchIconBadge, { backgroundColor: colors.wash }]}>
                <Search size={14} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t.chat?.searchInChannel || 'Tìm kiếm tin nhắn'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
            >
              <X size={16} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View style={[styles.inputContainer, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
            <Search size={16} color={colors.subtle} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder={t.chat?.searchPlaceholder || 'Tìm kiếm trong cuộc trò chuyện...'}
              placeholderTextColor={colors.subtle}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={colors.subtle} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results Area */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : !query.trim() || query.trim().length < 2 ? (
              <View style={styles.stateContainer}>
                <View style={[styles.iconBox, { backgroundColor: colors.wash }]}>
                  <Search size={24} color={colors.subtle} />
                </View>
                <Text style={[styles.stateTitle, { color: colors.text }]}>
                  {t.chat?.searchInChannel || 'Tìm kiếm trong cuộc trò chuyện'}
                </Text>
                <Text style={[styles.stateDesc, { color: colors.subtle }]}>
                  {t.chat?.searchHint || 'Nhập từ khóa để tìm lại nội dung tin nhắn'}
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.stateContainer}>
                <View style={[styles.iconBox, { backgroundColor: colors.wash }]}>
                  <MessageSquare size={24} color={colors.subtle} />
                </View>
                <Text style={[styles.stateTitle, { color: colors.text }]}>
                  {t.chat?.noSearchResults || 'Không tìm thấy tin nhắn phù hợp'}
                </Text>
              </View>
            ) : (
              results.map((msg) => {
                const senderProfile = (msg.sender as any)?.profile || (msg.sender as any)?.user?.profile;
                const senderName =
                  (msg.sender as any)?.nickname ||
                  senderProfile?.displayName ||
                  (msg.sender as any)?.displayName ||
                  'Member';

                const sentTime = msg.sentAt
                  ? new Date(msg.sentAt).toLocaleDateString([], {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <TouchableOpacity
                    key={msg.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onClose();
                      onJumpToMessage(msg.id);
                    }}
                    style={[
                      styles.resultCard,
                      { backgroundColor: colors.wash, borderColor: colors.hairline },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.senderWrap}>
                        {senderProfile?.avatarUrl ? (
                          <RNImage
                            source={{ uri: senderProfile.avatarUrl }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <View style={[styles.avatarFallback, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                              {senderName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
                          {senderName}
                        </Text>
                      </View>
                      {Boolean(sentTime) && (
                        <View style={styles.timeWrap}>
                          <Clock size={10} color={colors.subtle} />
                          <Text style={[styles.timeText, { color: colors.subtle }]}>
                            {sentTime}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.contentWrap}>
                      {renderHighlightedText(msg.content || '', query)}
                    </View>
                  </TouchableOpacity>
                );
              })
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '82%',
    minHeight: '50%',
    paddingBottom: 28,
  },
  grabber: {
    width: 38,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stateDesc: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  senderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
  },
  contentWrap: {
    marginTop: 2,
  },
});
