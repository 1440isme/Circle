import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  MapPin,
  Radio,
  LocateFixed,
  RotateCw,
  Navigation,
  Send,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import {
  getLiveLocationsApi,
  startLiveLocationApi,
  stopLiveLocationApi,
} from '../../services/circle-tools.service';
import { LiveLocationEntity, MessageType } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { getGlassTheme } from '../../constants/glass-theme';
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
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = useMemo(() => getGlassTheme(isDark, uiStyle), [isDark, uiStyle]);
  const { t } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const topClearance = Math.max(insets.top + 52, Platform.OS === 'ios' ? 74 : 64);

  const [locations, setLocations] = useState<LiveLocationEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 15, 30, 60 mins
  const [isSharing, setIsSharing] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const webViewRef = useRef<WebView>(null);

  const { data: circle } = useCircleDetailQuery(circleId);
  const channels = circle?.channels || [];
  const defaultChannel = channels[0];
  const sendMessageMutation = useSendMessageMutation(defaultChannel?.id || '');

  const showError = (msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorNotice(msg);
    errorTimerRef.current = setTimeout(() => setErrorNotice(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

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
      setErrorNotice(null);

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
      showError(err?.message || t.collab.startLocationError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSharing = async () => {
    try {
      Haptics.selectionAsync();
      setErrorNotice(null);
      await stopLiveLocationApi(circleId);
      setIsSharing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadLocations();
    } catch (err: any) {
      showError(err?.message || t.collab.stopLocationError);
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
      setErrorNotice(null);
      Haptics.selectionAsync();
      const payload = {
        lat: myCoords.lat,
        lng: myCoords.lng,
        title: t.collab.locationCardTitle,
        address: t.collab.locationCurrentLabel,
      };
      await sendMessageMutation.mutateAsync({
        content: `[LOCATION_PIN]:${JSON.stringify(payload)}`,
        type: MessageType.TEXT,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChatSentSuccess(true);
      setTimeout(() => setChatSentSuccess(false), 3000);
    } catch (err: any) {
      showError(err?.message || t.collab.locationSendToChatError);
    } finally {
      setIsSendingToChat(false);
    }
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return t.collab.sharingExpired;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Leaflet HTML template with CartoDB dark_all / light_all fallback
  const mapHtml = useMemo(() => {
    const centerLat = myCoords?.lat || 10.7828;
    const centerLng = myCoords?.lng || 106.6958;

    const pinsData = JSON.stringify(
      locations.map((loc) => ({
        id: loc.id,
        lat: loc.latitude,
        lng: loc.longitude,
        name: loc.member?.user?.profile?.displayName || t.collab.memberDefault,
        avatarUrl: loc.member?.user?.profile?.avatarUrl,
        remaining: getRemainingTime(loc.expiresAt),
        isMe: loc.member?.userId === user?.id,
        meSuffix: t.collab.meLabel,
      })),
    );

    const tileTheme = isDark ? 'dark_all' : 'light_all';
    const canvasBg = isDark ? '#131316' : '#FFFFFF';
    const tagBg = isDark ? 'rgba(22, 22, 26, 0.92)' : 'rgba(23, 23, 26, 0.88)';
    const borderSurface = isDark ? '#1D1D21' : '#FFFFFF';

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
      background: ${canvasBg};
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
      border: 2.5px solid ${borderSurface};
      background: ${colors.primary};
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${colors.onPrimary};
      font-weight: 700;
      font-size: 13px;
    }
    .member-avatar-box.is-me {
      background: ${colors.primary};
      border-color: ${borderSurface};
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4), 0 4px 14px rgba(0,0,0,0.35);
    }
    .member-name-tag {
      margin-top: 3px;
      padding: 2px 7px;
      border-radius: 10px;
      background: ${tagBg};
      border: 1px solid rgba(52, 211, 153, 0.4);
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
      : 'https://{s}.basemaps.cartocdn.com/${tileTheme}/{z}/{x}/{y}{r}.png';

    var tileOptions = {
      maxZoom: mapboxToken ? 22 : 20,
      tileSize: mapboxToken ? 512 : 256,
      zoomOffset: mapboxToken ? -1 : 0
    };
    if (!mapboxToken) {
      tileOptions.subdomains = 'abcd';
    }
    L.tileLayer(tileUrl, tileOptions).addTo(map);

    var pins = ${pinsData};
    var markersGroup = L.featureGroup().addTo(map);

    pins.forEach(function(pin) {
      var initials = (pin.name || 'US').substring(0, 2).toUpperCase();
      var avatarContent = pin.avatarUrl
        ? '<img src="' + pin.avatarUrl + '" style="width:100%;height:100%;object-fit:cover;" />'
        : initials;

      var html = '<div class="member-pin-marker">' +
        '<div class="member-avatar-box ' + (pin.isMe ? 'is-me' : '') + '">' + avatarContent + '</div>' +
        '<div class="member-name-tag">' + pin.name + (pin.isMe ? ' ' + pin.meSuffix : '') + '</div>' +
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
  }, [locations, myCoords, isDark, colors.primary, colors.onPrimary, t.collab.memberDefault, t.collab.meLabel, t.collab.sharingExpired]);

  const pillSurfaceColor = isGlass ? glassTheme.colors.glassBg : colors.surface;
  const pillBorderColor = isGlass ? glassTheme.colors.glassBorder : colors.hairline;

  const badgePillInner = (
    <View style={styles.topPillInner}>
      <MapPin size={15} color={colors.sage} />
      <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
        {locations.length > 0
          ? `${locations.length} ${t.collab.locationLiveBadge}`
          : t.collab.locationMapTabLabel}
      </Text>
    </View>
  );

  const durationSelectorInner = (
    <View style={styles.durationInnerRow}>
      {[15, 30, 60].map((dur) => (
        <TouchableOpacity
          key={dur}
          activeOpacity={0.7}
          onPress={() => setSelectedDuration(dur)}
          style={[
            styles.durBtn,
            selectedDuration === dur && [styles.durBtnActive, { backgroundColor: colors.wash }],
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
  );

  const bottomStripInner = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bottomScroll}
    >
      {locations.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Navigation size={14} color={colors.subtle} />
          <Text style={[styles.emptyText, { color: colors.subtle }]}>
            {t.collab.emptyLocationTitle}
          </Text>
        </View>
      ) : (
        locations.map((loc) => {
          const isMe = loc.member?.userId === user?.id;
          const name = loc.member?.user?.profile?.displayName || t.collab.memberDefault;
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
              <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.memberAvatarText, { color: colors.onPrimary }]}>{initials}</Text>
              </View>
              <View>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {isMe ? `${name} ${t.collab.meLabel}` : name}
                </Text>
                <Text style={[styles.memberRemaining, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                  {distanceText ? `${distanceText} · ` : ''}
                  {getRemainingTime(loc.expiresAt)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Floating Top Toolbar (strictly gated Glass vs Flat) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topClearance,
          left: 14,
          right: 14,
          zIndex: 30,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        {isGlass ? (
          <BlurView
            intensity={glassTheme.blur.intensity}
            tint={glassTheme.blur.tint}
            style={[
              styles.topBadgeShell,
              { backgroundColor: pillSurfaceColor, borderColor: pillBorderColor },
            ]}
          >
            {badgePillInner}
          </BlurView>
        ) : (
          <View
            style={[
              styles.topBadgeShell,
              { backgroundColor: pillSurfaceColor, borderColor: pillBorderColor },
            ]}
          >
            {badgePillInner}
          </View>
        )}

        {/* Duration Selector when not currently sharing */}
        {!isSharing ? (
          isGlass ? (
            <BlurView
              intensity={glassTheme.blur.intensity}
              tint={glassTheme.blur.tint}
              style={[
                styles.durationShell,
                { backgroundColor: pillSurfaceColor, borderColor: pillBorderColor },
              ]}
            >
              {durationSelectorInner}
            </BlurView>
          ) : (
            <View
              style={[
                styles.durationShell,
                { backgroundColor: pillSurfaceColor, borderColor: pillBorderColor },
              ]}
            >
              {durationSelectorInner}
            </View>
          )
        ) : null}

        <View style={styles.topActionsRow}>
          {isSharing ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleStopSharing}
              style={styles.stopBtn}
            >
              <Text style={styles.stopBtnText}>{t.collab.stopLiveShare}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleStartSharing}
              disabled={isLoading}
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <Radio size={14} color={colors.onPrimary} />
                  <Text style={[styles.startBtnText, { color: colors.onPrimary }]}>
                    {t.collab.startLiveShare}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={loadLocations}
            style={[
              styles.iconActionBtn,
              {
                backgroundColor: pillSurfaceColor,
                borderColor: pillBorderColor,
              },
            ]}
            accessibilityLabel={t.common.refresh}
          >
            <RotateCw size={15} color={colors.subtle} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline Error Banner */}
      {errorNotice && (
        <View pointerEvents="box-none" style={[styles.errorWrapper, { top: topClearance + 46 }]}>
          <View style={[styles.errorBanner, { backgroundColor: colors.surface, borderColor: '#DC2626' }]}>
            <Text style={[styles.errorText, { color: colors.text }]} numberOfLines={2}>
              {errorNotice}
            </Text>
            <TouchableOpacity onPress={() => setErrorNotice(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
        <View style={[styles.floatingActionGroup, { bottom: Math.max(insets.bottom + 78, 84) }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={handleRecenter}
            style={[styles.floatingCircleBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
            accessibilityLabel={t.collab.recenterMap}
          >
            <LocateFixed size={18} color={colors.sage} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSendToChat}
            disabled={isSendingToChat || !myCoords}
            style={[styles.floatingCheckinBtn, { backgroundColor: colors.primary }]}
          >
            {isSendingToChat ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : chatSentSuccess ? (
              <CheckCircle2 size={15} color={colors.onPrimary} />
            ) : (
              <Send size={15} color={colors.onPrimary} />
            )}
            <Text style={[styles.floatingCheckinText, { color: colors.onPrimary }]}>
              {chatSentSuccess ? t.collab.locationSentBadge : t.collab.sendStaticLocation}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Members Floating Strip (strictly gated Glass vs Flat) */}
      {isGlass ? (
        <BlurView
          intensity={glassTheme.blur.intensity}
          tint={glassTheme.blur.tint}
          style={[
            styles.bottomStrip,
            {
              bottom: Math.max(insets.bottom + 8, 14),
              backgroundColor: pillSurfaceColor,
              borderColor: pillBorderColor,
            },
          ]}
        >
          {bottomStripInner}
        </BlurView>
      ) : (
        <View
          style={[
            styles.bottomStrip,
            {
              bottom: Math.max(insets.bottom + 8, 14),
              backgroundColor: pillSurfaceColor,
              borderColor: pillBorderColor,
            },
          ]}
        >
          {bottomStripInner}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBadgeShell: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  topPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  topTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  durationShell: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  durationInnerRow: {
    flexDirection: 'row',
    padding: 3,
    gap: 2,
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
    borderRadius: 999,
  },
  startBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stopBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DC2626',
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  iconActionBtn: {
    padding: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 35,
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingCheckinText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomStrip: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 30,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
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
