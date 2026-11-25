import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { Compass, Users, ArrowRight } from 'lucide-react-native';
import { LiveWheelMessagePayload, LiveWheelSession } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import { joinLiveWheelApi } from '../../services/circle-tools.service';

export interface MobileLiveWheelChatEmbedProps {
  content: string;
  circleId: string;
  isSenderMe?: boolean;
  onOpenLiveWheel?: (sessionId: string) => void;
}

export const MobileLiveWheelChatEmbed: React.FC<MobileLiveWheelChatEmbedProps> = ({
  content,
  circleId,
  isSenderMe = false,
  onOpenLiveWheel,
}) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { locale } = useLanguageStore();

  const [isJoining, setIsJoining] = useState(false);

  let payload: LiveWheelMessagePayload | null = null;
  try {
    const raw = content.startsWith('[LIVE_WHEEL]:')
      ? content.replace('[LIVE_WHEEL]:', '').trim()
      : content;
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }

  if (!payload) return null;

  const isFinished = payload.stageStatus === 'finished';
  const participants = payload.participants || [];
  const participantsCount = participants.length;

  const handleJoin = async () => {
    if (isFinished) return;
    let joinedSession: LiveWheelSession | null = null;
    try {
      setIsJoining(true);
      joinedSession = await joinLiveWheelApi(circleId, payload?.sessionId);
    } catch {}
    finally {
      setIsJoining(false);
      DeviceEventEmitter.emit('circle:open-live-wheel', {
        circleId,
        sessionId: payload?.sessionId,
        session: joinedSession,
      });
      onOpenLiveWheel?.(payload?.sessionId || '');
    }
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? colors.elevated : '#FFFFFF',
          borderColor: isFinished
            ? (isDark ? '#334155' : '#E2E8F0')
            : (isDark ? `${colors.primary}50` : '#99F6E4'),
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isFinished
                  ? (isDark ? '#334155' : '#F1F5F9')
                  : `${colors.primary}20`,
              },
            ]}
          >
            <Compass
              size={18}
              color={isFinished ? (isDark ? '#64748B' : '#94A3B8') : colors.primary}
            />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {payload.wheelTitle || (locale === 'vi' ? 'Vòng quay ngẫu nhiên' : 'Random Wheel')}
          </Text>
        </View>

        {isFinished ? (
          <View
            style={[
              styles.tagBadge,
              {
                backgroundColor: isDark ? '#334155' : '#F1F5F9',
              },
            ]}
          >
            <Text
              style={[
                styles.tagBadgeText,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              {locale === 'vi' ? 'Đã kết thúc' : 'Ended'}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.tagBadge,
              {
                backgroundColor: `${colors.primary}15`,
              },
            ]}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#10B981',
                marginRight: 4,
              }}
            />
            <Text
              style={[
                styles.tagBadgeText,
                { color: colors.primary },
              ]}
            >
              LIVE
            </Text>
          </View>
        )}
      </View>

      {/* Creator Info */}
      <View style={styles.creatorRow}>
        {payload.creatorAvatar ? (
          <Image source={{ uri: payload.creatorAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: `${colors.primary}25` }]}>
            <Text style={[styles.avatarFallbackText, { color: colors.primary }]}>
              {payload.creatorName?.charAt(0) || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.creatorTextCol}>
          <Text style={[styles.creatorText, { color: colors.text }]}>
            <Text style={styles.creatorNameBold}>{payload.creatorName}</Text>{' '}
            {locale === 'vi' ? 'đã mở phiên vòng quay ngẫu nhiên' : 'started a random wheel session'}
          </Text>
          <View style={styles.participantsRow}>
            <Users size={12} color={colors.primary} />
            <Text style={[styles.participantsCountText, { color: colors.subtle }]}>
              {participantsCount > 0
                ? locale === 'vi'
                  ? `${participantsCount} người đang tham gia`
                  : `${participantsCount} participants`
                : locale === 'vi'
                ? 'Chưa có người tham gia'
                : 'No participants'}
            </Text>
          </View>
        </View>
      </View>

      {/* Avatars Stack */}
      {participantsCount > 0 && (
        <View style={styles.avatarStackRow}>
          {participants.slice(0, 5).map((p, idx) => (
            <View
              key={p.userId || idx}
              style={[
                styles.stackedAvatar,
                {
                  borderColor: isDark ? colors.elevated : '#FFFFFF',
                  backgroundColor: `${colors.primary}30`,
                },
              ]}
            >
              {p.avatarUrl ? (
                <Image source={{ uri: p.avatarUrl }} style={styles.stackedImg} />
              ) : (
                <Text style={[styles.stackedFallbackText, { color: colors.primary }]}>
                  {p.displayName?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
          ))}
          {participantsCount > 5 && (
            <Text style={[styles.moreCountText, { color: colors.subtle }]}>
              +{participantsCount - 5}
            </Text>
          )}
        </View>
      )}

      {/* Join Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isJoining || isFinished}
        onPress={handleJoin}
        style={[
          styles.joinBtn,
          {
            backgroundColor: isFinished
              ? (isDark ? '#334155' : '#E2E8F0')
              : colors.primary,
          },
        ]}
      >
        {isJoining ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Compass
              size={15}
              color={isFinished ? (isDark ? '#94A3B8' : '#64748B') : '#FFFFFF'}
            />
            <Text
              style={[
                styles.joinBtnText,
                { color: isFinished ? (isDark ? '#94A3B8' : '#64748B') : '#FFFFFF' },
              ]}
            >
              {isFinished
                ? (locale === 'vi' ? 'Phiên đã kết thúc' : 'Stage Closed')
                : (locale === 'vi' ? 'Tham gia vòng quay' : 'Join Wheel')}
            </Text>
            {!isFinished && <ArrowRight size={14} color="#FFFFFF" />}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  tagBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  creatorTextCol: {
    flex: 1,
  },
  creatorText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  creatorNameBold: {
    fontWeight: '800',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  participantsCountText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  stackedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: -6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stackedImg: {
    width: '100%',
    height: '100%',
  },
  stackedFallbackText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  moreCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
