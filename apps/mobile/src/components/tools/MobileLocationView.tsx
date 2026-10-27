import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Radio,
  Clock,
  Compass,
  RotateCw,
  Users,
  Navigation,
} from 'lucide-react-native';
import {
  getLiveLocationsApi,
  startLiveLocationApi,
  stopLiveLocationApi,
} from '../../services/circle-tools.service';
import { LiveLocationEntity } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';

interface MobileLocationViewProps {
  circleId: string;
}

const { width } = Dimensions.get('window');

export const MobileLocationView: React.FC<MobileLocationViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const [locations, setLocations] = useState<LiveLocationEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 15, 30, 60 mins
  const [isSharing, setIsSharing] = useState(false);

  const loadLocations = async () => {
    try {
      setIsLoading(true);
      const data = await getLiveLocationsApi(circleId);
      setLocations(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách vị trí');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
    // Poll every 10 seconds for live updates
    const interval = setInterval(loadLocations, 10000);
    return () => clearInterval(interval);
  }, [circleId]);

  const handleStartSharing = async () => {
    try {
      // Hồ Con Rùa Saigon coordinates as authentic reference baseline
      const lat = 10.7828;
      const lng = 106.6958;
      await startLiveLocationApi(circleId, {
        latitude: lat,
        longitude: lng,
        shareDuration: selectedDuration,
      });
      setIsSharing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadLocations();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể bắt đầu chia sẻ vị trí');
    }
  };

  const handleStopSharing = async () => {
    try {
      await stopLiveLocationApi(circleId);
      setIsSharing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadLocations();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể dừng chia sẻ');
    }
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Hết hạn';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }]}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.title, { color: colors.text }]}>Vị Trí Trực Tiếp</Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            {locations.length > 0
              ? `${locations.length} thành viên đang phát sóng`
              : 'Chưa có ai đang chia sẻ vị trí'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={loadLocations}
          style={[styles.refreshBtn, { backgroundColor: isDark ? colors.elevated : '#F1F5F9' }]}
        >
          <RotateCw size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Radar Map Visual Simulation */}
      <View style={[styles.radarCard, { backgroundColor: isDark ? '#020617' : '#0F172A' }]}>
        <View style={styles.radarCircleOuter}>
          <View style={styles.radarCircleMid}>
            <View style={styles.radarCircleInner}>
              <Compass size={24} color="#38BDF8" />
            </View>
          </View>
        </View>

        {locations.map((loc, idx) => {
          const angle = (idx * (360 / Math.max(1, locations.length)) * Math.PI) / 180;
          const radius = 60 + (idx % 2) * 30;
          const left = width / 2 - 20 + Math.cos(angle) * radius;
          const top = 100 + Math.sin(angle) * radius;

          return (
            <View key={loc.id} style={[styles.avatarPin, { left, top }]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {loc.member?.user?.profile?.displayName?.substring(0, 2).toUpperCase() || 'MB'}
                </Text>
              </View>
              <View style={styles.pinLabel}>
                <Text style={styles.pinName} numberOfLines={1}>
                  {loc.member?.user?.profile?.displayName?.split(' ')[0] || 'Member'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Action Controls */}
      <View style={[styles.controlsCard, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }]}>
        <View style={[styles.durationSelector, { backgroundColor: isDark ? colors.elevated : '#F1F5F9' }]}>
          {[15, 30, 60].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setSelectedDuration(d)}
              style={[
                styles.durationBtn,
                selectedDuration === d && [styles.durationBtnActive, { backgroundColor: colors.surface }],
              ]}
            >
              <Text
                style={[
                  styles.durationBtnText,
                  { color: selectedDuration === d ? colors.primary : colors.subtle },
                  selectedDuration === d && styles.durationBtnTextActive,
                ]}
              >
                {d} phút
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={isSharing ? handleStopSharing : handleStartSharing}
          style={[styles.shareBtn, { backgroundColor: colors.primary }, isSharing && styles.shareBtnStop]}
        >
          <Radio size={16} color="#FFF" />
          <Text style={styles.shareBtnText}>
            {isSharing ? 'Dừng chia sẻ vị trí' : 'Bật phát sóng vị trí'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Members List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        <Text style={[styles.listHeaderTitle, { color: colors.subtle }]}>Thành viên phát sóng</Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
        ) : locations.length === 0 ? (
          <View style={styles.emptyNotice}>
            <Navigation size={32} color={colors.subtle} />
            <Text style={[styles.emptyNoticeText, { color: colors.subtle }]}>
              Bật chia sẻ vị trí để bạn bè trong Vòng tròn thấy điểm hẹn của bạn.
            </Text>
          </View>
        ) : (
          locations.map((loc) => (
            <View key={loc.id} style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <View style={[styles.memberAvatar, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE' }]}>
                <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                  {loc.member?.user?.profile?.displayName?.substring(0, 2).toUpperCase() || 'MB'}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {loc.member?.user?.profile?.displayName || 'Thành viên'}
                </Text>
                <Text style={[styles.memberCoords, { color: colors.subtle }]}>
                  Tọa độ: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#F0F9FF' }]}>
                <Clock size={12} color={colors.primary} />
                <Text style={[styles.timeBadgeText, { color: colors.primary }]}>
                  {getRemainingTime(loc.expiresAt)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  radarCard: {
    height: 240,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  radarCircleOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleMid: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  avatarPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pinLabel: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  pinName: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '600',
  },
  controlsCard: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  durationSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  durationBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  durationBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  durationBtnTextActive: {
    color: '#0284C7',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareBtnStop: {
    backgroundColor: '#EF4444',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#64748B',
    marginBottom: 10,
  },
  emptyNotice: {
    padding: 32,
    alignItems: 'center',
  },
  emptyNoticeText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  memberCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberCoords: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
});
