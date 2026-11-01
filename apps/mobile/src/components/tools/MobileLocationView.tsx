import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  MapPin,
  Radio,
  Clock,
  LocateFixed,
  RotateCw,
  Users,
  Navigation,
  Send,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import {
  getLiveLocationsApi,
  startLiveLocationApi,
  stopLiveLocationApi,
} from '../../services/circle-tools.service';
import { LiveLocationEntity, MessageType } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { useSendMessageMutation, useCircleDetailQuery } from '../../hooks/use-circle-queries';

interface MobileLocationViewProps {
  circleId: string;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const MobileLocationView: React.FC<MobileLocationViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();
  const user = useAuthStore((s) => s.user);

  const [locations, setLocations] = useState<LiveLocationEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 15, 30, 60 mins
  const [isSharing, setIsSharing] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState(false);

  const webViewRef = useRef<WebView>(null);

  const { data: circle } = useCircleDetailQuery(circleId);
  const channels = circle?.channels || [];
  const defaultChannel = channels[0];
  const sendMessageMutation = useSendMessageMutation(defaultChannel?.id || '');

  // Acquire GPS coordinates on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isMounted) {
            setMyCoords({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            });
          }
        } else {
          // Saigon default
          if (isMounted) setMyCoords({ lat: 10.7828, lng: 106.6958 });
        }
      } catch {
        if (isMounted) setMyCoords({ lat: 10.7828, lng: 106.6958 });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getLiveLocationsApi(circleId);
      setLocations(data);
      const isMeSharing = data.some(
        (loc) => loc.member?.userId === user?.id || (loc as any).memberId === user?.id,
      );
      setIsSharing(isMeSharing);
    } catch (err: any) {
      console.error('Failed to load locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
    const interval = setInterval(loadLocations, 10000);
    return () => clearInterval(interval);
  }, [circleId]);

  const handleStartSharing = async () => {
    try {
      Haptics.selectionAsync();
      setIsLoading(true);

      let lat = myCoords?.lat || 10.7828;
      let lng = myCoords?.lng || 106.6958;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setMyCoords({ lat, lng });
        }
      } catch {}

      await startLiveLocationApi(circleId, {
        latitude: lat,
        longitude: lng,
        shareDuration: selectedDuration,
      });

      setIsSharing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadLocations();

      webViewRef.current?.injectJavaScript(`
        if (window.panToCoords) {
          window.panToCoords(${lat}, ${lng});
        }
        true;
      `);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể bắt đầu chia sẻ vị trí');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSharing = async () => {
    try {
      Haptics.selectionAsync();
      await stopLiveLocationApi(circleId);
      setIsSharing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadLocations();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể dừng chia sẻ');
    }
  };

  const handleRecenter = () => {
    Haptics.selectionAsync();
    const lat = myCoords?.lat || 10.7828;
    const lng = myCoords?.lng || 106.6958;
    webViewRef.current?.injectJavaScript(`
      if (window.panToCoords) {
        window.panToCoords(${lat}, ${lng});
      }
      true;
    `);
  };

  const handleSendToChat = async () => {
    if (!defaultChannel?.id || !myCoords) return;
    try {
      setIsSendingToChat(true);
      Haptics.selectionAsync();
      const payload = {
        lat: myCoords.lat,
        lng: myCoords.lng,
        title: t.collab?.locationCardTitle || 'Điểm hẹn nhóm',
        address: 'Vị trí hiện tại',
      };
      await sendMessageMutation.mutateAsync({
        content: `[LOCATION_PIN]:${JSON.stringify(payload)}`,
        type: MessageType.TEXT,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChatSentSuccess(true);
      setTimeout(() => setChatSentSuccess(false), 3000);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể chia sẻ vị trí vào chat');
    } finally {
      setIsSendingToChat(false);
    }
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return t.collab?.sharingExpired || 'Hết hạn';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Leaflet HTML template for OpenStreetMap tiles map
  const mapHtml = useMemo(() => {
    const centerLat = myCoords?.lat || 10.7828;
    const centerLng = myCoords?.lng || 106.6958;

    const pinsData = JSON.stringify(
      locations.map((loc) => ({
        id: loc.id,
        lat: loc.latitude,
        lng: loc.longitude,
        name: loc.member?.user?.profile?.displayName || 'Thành viên',
        avatarUrl: loc.member?.user?.profile?.avatarUrl,
        remaining: getRemainingTime(loc.expiresAt),
        isMe: loc.member?.userId === user?.id,
      })),
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      background: ${isDark ? '#0f172a' : '#f8fafc'};
    }
    #map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
    .custom-leaflet-pin {
      background: none !important;
      border: none !important;
    }
    .member-pin-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }
    .member-avatar-box {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      border: 2.5px solid #FFFFFF;
      background: #0284C7;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 13px;
    }
    .member-avatar-box.is-me {
      background: #3B82F6;
      border-color: #93C5FD;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4), 0 4px 14px rgba(0,0,0,0.35);
    }
    .member-name-tag {
      margin-top: 3px;
      padding: 2px 7px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${centerLat}, ${centerLng}],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    var mapboxToken = '${process.env.EXPO_PUBLIC_MAPBOX_TOKEN || ''}';
    var mapboxStyle = '${isDark ? 'dark-v11' : 'streets-v12'}';
    var tileUrl = mapboxToken
      ? 'https://api.mapbox.com/styles/v1/mapbox/' + mapboxStyle + '/tiles/512/{z}/{x}/{y}@2x?access_token=' + mapboxToken
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(tileUrl, {
      maxZoom: mapboxToken ? 22 : 19,
      tileSize: mapboxToken ? 512 : 256,
      zoomOffset: mapboxToken ? -1 : 0
    }).addTo(map);

    var pins = ${pinsData};
    var markersGroup = L.featureGroup().addTo(map);

    pins.forEach(function(pin) {
      var initials = (pin.name || 'US').substring(0, 2).toUpperCase();
      var avatarContent = pin.avatarUrl 
        ? '<img src="' + pin.avatarUrl + '" style="width:100%;height:100%;object-fit:cover;" />' 
        : initials;

      var html = '<div class="member-pin-marker">' +
        '<div class="member-avatar-box ' + (pin.isMe ? 'is-me' : '') + '">' + avatarContent + '</div>' +
        '<div class="member-name-tag">' + (pin.name || 'Thành viên') + (pin.isMe ? ' (Tôi)' : '') + '</div>' +
        '</div>';

      var customIcon = L.divIcon({
        html: html,
        className: 'custom-leaflet-pin',
        iconSize: [40, 52],
        iconAnchor: [20, 26]
      });

      L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(markersGroup);
    });

    window.panToCoords = function(lat, lng) {
      map.setView([lat, lng], 15, { animate: true });
    };

    if (pins.length > 0) {
      try {
        var bounds = markersGroup.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch(e) {}
    }
  </script>
</body>
</html>`;
  }, [locations, myCoords, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Controls Strip */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }]}>
        <View style={styles.topBarLeft}>
          <View style={[styles.iconBox, { backgroundColor: colors.wash }]}>
            <MapPin size={16} color="#0284C7" />
          </View>
          <View>
            <Text style={[styles.topTitle, { color: colors.text }]}>
              {t.collab?.locationTitle || 'Chia sẻ vị trí'}
            </Text>
            <Text style={[styles.topSub, { color: colors.subtle }]}>
              {t.collab?.activeBroadcastingCount?.replace('{count}', String(locations.length)) ||
                `${locations.length} người đang phát sóng`}
            </Text>
          </View>
        </View>

        {/* Duration Selector or Stop Button */}
        {!isSharing ? (
          <View style={[styles.durationWrap, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
            {[15, 30, 60].map((dur) => (
              <TouchableOpacity
                key={dur}
                activeOpacity={0.7}
                onPress={() => setSelectedDuration(dur)}
                style={[
                  styles.durBtn,
                  selectedDuration === dur && [styles.durBtnActive, { backgroundColor: colors.surface }],
                ]}
              >
                <Text
                  style={[
                    styles.durBtnText,
                    { color: selectedDuration === dur ? colors.text : colors.subtle },
                  ]}
                >
                  {dur}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.topActionsRow}>
          {isSharing ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleStopSharing}
              style={styles.stopBtn}
            >
              <Text style={styles.stopBtnText}>
                {t.collab?.stopLiveShare || 'Dừng'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleStartSharing}
              disabled={isLoading}
              style={[styles.startBtn, { backgroundColor: '#0284C7' }]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Radio size={14} color="#FFFFFF" />
                  <Text style={styles.startBtnText}>
                    {t.collab?.startLiveShare || 'Bật'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={loadLocations}
            style={[styles.iconActionBtn, { borderColor: colors.hairline }]}
          >
            <RotateCw size={15} color={colors.subtle} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Leaflet Map via WebView */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />

        {/* Floating Actions on Map */}
        <View style={styles.floatingActionGroup}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRecenter}
            style={[styles.floatingCircleBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <LocateFixed size={18} color="#0284C7" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSendToChat}
            disabled={isSendingToChat || !myCoords}
            style={[styles.floatingCheckinBtn, { backgroundColor: chatSentSuccess ? '#10B981' : '#0284C7' }]}
          >
            {isSendingToChat ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : chatSentSuccess ? (
              <CheckCircle2 size={15} color="#FFFFFF" />
            ) : (
              <Send size={15} color="#FFFFFF" />
            )}
            <Text style={styles.floatingCheckinText}>
              {chatSentSuccess ? 'Đã gửi' : (t.collab?.sendStaticLocation || 'Gửi vào Chat')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Members Horizontal Strip */}
      <View style={[styles.bottomStrip, { backgroundColor: colors.surface, borderTopColor: colors.hairline }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomScroll}
        >
          {locations.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Navigation size={14} color={colors.subtle} />
              <Text style={[styles.emptyText, { color: colors.subtle }]}>
                {t.collab?.emptyLocationTitle || 'Chưa có ai đang chia sẻ vị trí'}
              </Text>
            </View>
          ) : (
            locations.map((loc) => {
              const isMe = loc.member?.userId === user?.id;
              const name = loc.member?.user?.profile?.displayName || 'Thành viên';
              const avatar = loc.member?.user?.profile?.avatarUrl;
              const initials = name.substring(0, 2).toUpperCase();

              let distanceText: string | null = null;
              if (myCoords && !isMe) {
                const dist = calculateDistanceKm(
                  myCoords.lat,
                  myCoords.lng,
                  loc.latitude,
                  loc.longitude,
                );
                if (dist < 1) {
                  distanceText = `${Math.round(dist * 1000)}m`;
                } else {
                  distanceText = `${dist.toFixed(1)}km`;
                }
              }

              return (
                <TouchableOpacity
                  key={loc.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.selectionAsync();
                    webViewRef.current?.injectJavaScript(`
                      if (window.panToCoords) {
                        window.panToCoords(${loc.latitude}, ${loc.longitude});
                      }
                      true;
                    `);
                  }}
                  style={[
                    styles.memberPill,
                    {
                      backgroundColor: colors.wash,
                      borderColor: colors.hairline,
                    },
                  ]}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{initials}</Text>
                  </View>
                  <View>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {name} {isMe && '(Tôi)'}
                    </Text>
                    <Text style={[styles.memberRemaining, { color: '#F59E0B' }]}>
                      {distanceText ? `${distanceText} · ` : ''}
                      {getRemainingTime(loc.expiresAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  topSub: {
    fontSize: 10,
  },
  durationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  durBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durBtnActive: {
    shadowOpacity: 0.1,
    elevation: 1,
  },
  durBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stopBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  floatingActionGroup: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 10,
  },
  floatingCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  floatingCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingCheckinText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomStrip: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 12,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '700',
  },
  memberRemaining: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
});
