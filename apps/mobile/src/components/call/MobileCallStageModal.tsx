import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
} from 'lucide-react-native';
import { CallType, CallSessionDetailEntity, CallParticipantEntity } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { useLeaveCallMutation } from '../../hooks/use-call-queries';
import { useCircleMembersQuery } from '../../hooks/use-circle-queries';

interface MobileCallStageModalProps {
  callSession: CallSessionDetailEntity | null;
  visible: boolean;
  onClose: () => void;
}

export function MobileCallStageModal({
  callSession,
  visible,
  onClose,
}: MobileCallStageModalProps) {
  const { colors, theme } = useThemeStore();
  const { t, locale } = useLanguageStore();
  const { user } = useAuthStore();
  const leaveCallMutation = useLeaveCallMutation();

  const circleId = callSession?.circleId || null;
  const { data: members = [] } = useCircleMembersQuery(circleId);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(
    callSession?.callType === CallType.AUDIO,
  );
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Call timer
  useEffect(() => {
    if (!visible) {
      setDurationSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible || !callSession) return null;

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveCall = async () => {
    try {
      if (callSession.id) {
        await leaveCallMutation.mutateAsync({ callSessionId: callSession.id });
      }
    } catch (e) {
      console.warn('Error leaving call session:', e);
    } finally {
      onClose();
    }
  };

  const currentParticipants: CallParticipantEntity[] = callSession.participants || [];
  const otherParticipants = currentParticipants.filter(
    (p) => p.member?.userId !== user?.id && (p as any).userId !== user?.id,
  );

  const userDisplayName =
    user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleLeaveCall}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f1015" />
      <SafeAreaView style={[styles.container, { backgroundColor: '#0f1015' }]}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.liveIndicator}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveBadgeText}>
                  {callSession.callType === CallType.VIDEO
                    ? locale === 'vi' ? 'VIDEO STAGE' : 'VIDEO STAGE'
                    : locale === 'vi' ? 'VOICE STAGE' : 'VOICE STAGE'}
                </Text>
              </View>
              <Text style={styles.durationText}>{formatDuration(durationSeconds)}</Text>
            </View>
            <Text style={styles.circleName} numberOfLines={1}>
              {callSession.circle?.name || (locale === 'vi' ? 'Vòng tròn CIRCLE' : 'CIRCLE Circle')}
            </Text>
          </View>

          <View style={styles.participantCountBadge}>
            <Users size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.participantCountText}>
              {otherParticipants.length + 1}
            </Text>
          </View>
        </View>

        {/* Stage Center Area / Participant Grid */}
        <ScrollView
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Local User Tile */}
          <View style={[styles.participantTile, { borderColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.avatarGlowWrapper}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>{getInitials(userDisplayName)}</Text>
              </View>
              {!isAudioMuted && <View style={styles.speakingWaveRing} />}
            </View>

            <View style={styles.tileFooter}>
              <Text style={styles.participantName} numberOfLines={1}>
                {userDisplayName} ({locale === 'vi' ? 'Bạn' : 'You'})
              </Text>
              <View style={[styles.micStatusBadge, { backgroundColor: isAudioMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)' }]}>
                {isAudioMuted ? (
                  <MicOff size={12} color="#ef4444" />
                ) : (
                  <Mic size={12} color="#10b981" />
                )}
              </View>
            </View>
          </View>

          {/* Remote Participants */}
          {otherParticipants.map((p, idx) => {
            const peerUserId = p.member?.userId || (p as any).userId;
            const memberMatch = members.find((m) => m.userId === peerUserId || m.id === p.memberId);
            const pName =
              p.member?.user?.profile?.displayName ||
              p.member?.nickname ||
              memberMatch?.user?.profile?.displayName ||
              memberMatch?.nickname ||
              p.member?.user?.email?.split('@')[0] ||
              `${t.calls.memberDefault} ${idx + 1}`;

            const isSpeaking = (p as any).isSpeaking;
            const isMuted = (p as any).isMuted;

            return (
              <View
                key={p.id || idx}
                style={[styles.participantTile, { borderColor: 'rgba(255,255,255,0.1)' }]}
              >
                <View style={styles.avatarGlowWrapper}>
                  <View style={[styles.avatarCircle, { backgroundColor: '#374151' }]}>
                    <Text style={styles.avatarInitials}>{getInitials(pName)}</Text>
                  </View>
                  {isSpeaking && <View style={styles.speakingWaveRing} />}
                </View>

                <View style={styles.tileFooter}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {pName}
                  </Text>
                  <View style={[styles.micStatusBadge, { backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)' }]}>
                    {isMuted ? (
                      <MicOff size={12} color="#ef4444" />
                    ) : (
                      <Mic size={12} color="#10b981" />
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Floating Call Stage Controls Bar */}
        <View style={styles.controlsBar}>
          {/* Mic Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsAudioMuted(!isAudioMuted)}
            style={[
              styles.controlBtn,
              { backgroundColor: isAudioMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.12)' },
            ]}
          >
            {isAudioMuted ? (
              <MicOff size={22} color="#ef4444" />
            ) : (
              <Mic size={22} color="#ffffff" />
            )}
            <Text style={styles.controlBtnLabel}>
              {isAudioMuted ? (locale === 'vi' ? 'Bật mic' : 'Unmute') : (locale === 'vi' ? 'Tắt mic' : 'Mute')}
            </Text>
          </TouchableOpacity>

          {/* Video Toggle */}
          {callSession.callType === CallType.VIDEO && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsVideoMuted(!isVideoMuted)}
              style={[
                styles.controlBtn,
                { backgroundColor: isVideoMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.12)' },
              ]}
            >
              {isVideoMuted ? (
                <VideoOff size={22} color="#ef4444" />
              ) : (
                <Video size={22} color="#ffffff" />
              )}
              <Text style={styles.controlBtnLabel}>
                {isVideoMuted ? (locale === 'vi' ? 'Bật cam' : 'Cam on') : (locale === 'vi' ? 'Tắt cam' : 'Cam off')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Speakerphone Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
            style={[
              styles.controlBtn,
              { backgroundColor: isSpeakerOn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.12)' },
            ]}
          >
            {isSpeakerOn ? (
              <Volume2 size={22} color="#ffffff" />
            ) : (
              <VolumeX size={22} color="rgba(255,255,255,0.5)" />
            )}
            <Text style={styles.controlBtnLabel}>
              {isSpeakerOn ? (locale === 'vi' ? 'Loa ngoài' : 'Speaker') : (locale === 'vi' ? 'Loa trong' : 'Earpiece')}
            </Text>
          </TouchableOpacity>

          {/* End / Leave Call */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLeaveCall}
            style={[styles.controlBtn, styles.endCallBtn]}
          >
            <PhoneOff size={24} color="#ffffff" />
            <Text style={[styles.controlBtnLabel, { color: '#ffffff', fontWeight: '700' }]}>
              {locale === 'vi' ? 'Rời gọi' : 'Leave'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerInfo: {
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  circleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  participantCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  participantCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  participantTile: {
    width: Dimensions.get('window').width > 400 ? '47%' : '46%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarGlowWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  speakingWaveRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#10b981',
    opacity: 0.75,
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  participantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  micStatusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#16181f',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    gap: 3,
  },
  controlBtnLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  endCallBtn: {
    backgroundColor: '#ef4444',
  },
});
