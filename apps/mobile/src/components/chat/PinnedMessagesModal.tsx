import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image as RNImage,
} from 'react-native';
import { X, Pin, FileText, Image as ImageIcon } from 'lucide-react-native';

interface PinnedMessagesModalProps {
  visible: boolean;
  onClose: () => void;
  pinnedMessages: any[];
  onJumpToMessage: (messageId: string) => void;
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
  colors: any;
  t: any;
}

export const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({
  visible,
  onClose,
  pinnedMessages,
  onJumpToMessage,
  onTogglePin,
  colors,
  t,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Scrim dismissal */}
        <TouchableOpacity
          style={styles.scrim}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet Card */}
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          {/* Top grabber */}
          <View style={[styles.grabber, { backgroundColor: colors.hairline }]} />

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.pinIconBadge, { backgroundColor: colors.wash }]}>
                <Pin size={14} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t.chat?.pinnedMessagesTitle?.replace('{count}', String(pinnedMessages.length)) ||
                  `Tin nhắn đã ghim (${pinnedMessages.length})`}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
              accessibilityLabel={t.common?.close || 'Đóng'}
            >
              <X size={16} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* List of Pinned Messages */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {pinnedMessages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.wash }]}>
                  <Pin size={24} color={colors.subtle} />
                </View>
                <Text style={[styles.emptyText, { color: colors.subtle }]}>
                  {t.chat?.noPinnedMessages || 'Không có tin nhắn nào được ghim'}
                </Text>
              </View>
            ) : (
              pinnedMessages.map((msg) => {
                const senderProfile = msg.sender?.profile || msg.sender?.user?.profile;
                const senderName =
                  msg.sender?.nickname ||
                  senderProfile?.displayName ||
                  msg.sender?.displayName ||
                  msg.sender?.name ||
                  msg.sender?.user?.email?.split('@')[0] ||
                  msg.sender?.email?.split('@')[0] ||
                  'User';

                const sentTime = msg.sentAt || msg.createdAt
                  ? new Date(msg.sentAt || msg.createdAt).toLocaleDateString([], {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <TouchableOpacity
                    key={msg.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      onJumpToMessage(msg.id);
                      onClose();
                    }}
                    style={[
                      styles.pinnedItemCard,
                      { backgroundColor: colors.wash, borderColor: colors.hairline },
                    ]}
                  >
                    {/* Item Header */}
                    <View style={styles.itemHeader}>
                      <View style={styles.senderInfo}>
                        {senderProfile?.avatarUrl ? (
                          <RNImage
                            source={{ uri: senderProfile.avatarUrl }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <View style={[styles.avatarFallback, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                              {senderName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.senderTextWrap}>
                          <Text numberOfLines={1} style={[styles.senderName, { color: colors.text }]}>
                            {senderName}
                          </Text>
                          {Boolean(sentTime) && (
                            <Text style={[styles.sentTime, { color: colors.subtle }]}>
                              {sentTime}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Unpin action button */}
                      {Boolean(onTogglePin) && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => onTogglePin?.(msg.id, true)}
                          style={[styles.unpinBtn, { backgroundColor: colors.surface }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Pin size={12} color={colors.warning || '#F59E0B'} fill={colors.warning || '#F59E0B'} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Item Message Content Preview */}
                    {Boolean(msg.content) && (
                      <Text numberOfLines={3} style={[styles.messageContent, { color: colors.text }]}>
                        {msg.content}
                      </Text>
                    )}

                    {/* Media preview */}
                    {Boolean(msg.fileUrl) && (
                      <View style={styles.mediaPreviewWrap}>
                        <ImageIcon size={13} color={colors.primary} />
                        <Text numberOfLines={1} style={[styles.mediaText, { color: colors.primary }]}>
                          {t.chat?.imageAttachment || 'Hình ảnh đính kèm'}
                        </Text>
                      </View>
                    )}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '75%',
    minHeight: 260,
    overflow: 'hidden',
    paddingBottom: 24,
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
  pinIconBadge: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pinnedItemCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '700',
  },
  senderTextWrap: {
    flex: 1,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
  },
  sentTime: {
    fontSize: 10,
    marginTop: 1,
  },
  unpinBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  messageContent: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  mediaPreviewWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mediaText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
