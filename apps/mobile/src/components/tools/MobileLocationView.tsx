import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Radio,
  LocateFixed,
  RotateCw,
  Navigation,
  Send,
  CheckCircle2,
  X,
  Clock,
  Flag,
  Trash2,
} from 'lucide-react-native';
import {
  getLiveLocationsApi,
  startLiveLocationApi,
  updateLiveLocationApi,
  stopLiveLocationApi,
  getMeetingPointApi,
  setMeetingPointApi,
  deleteMeetingPointApi,
} from '../../services/circle-tools.service';
import { getSocket } from '../../services/socket';
import { LiveLocationEntity, CircleMeetingPointEntity, MessageType } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { useSendMessageMutation, useCircleDetailQuery } from '../../hooks/use-circle-queries';
import { MobileLocationSearchInput } from './MobileLocationSearchInput';

interface MobileLocationViewProps {
  circleId: string;
  onRegisterBack?: (handler: (() => boolean) | null) => void;
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
  const topClearance = Platform.OS === 'ios' ? 52 : 36;

  const [locations, setLocations] = useState<LiveLocationEntity[]>([]);
  const [meetingPoint, setMeetingPoint] = useState<CircleMeetingPointEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 15, 30, 60 mins

  const handleCycleDuration = () => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedDuration((prev) => (prev === 15 ? 30 : prev === 30 ? 60 : 15));
  };

  const [isSharing, setIsSharing] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Meeting Point Modal
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingAddress, setMeetingAddress] = useState('');
  const [meetingLat, setMeetingLat] = useState<number | null>(null);
  const [meetingLng, setMeetingLng] = useState<number | null>(null);
  const [isSavingMeetingPoint, setIsSavingMeetingPoint] = useState(false);

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

  // Acquire GPS coordinates on mount (No silent Saigon fallback)
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
          if (isMounted) {
            showError(t.collab.gpsDeniedMessage);
          }
        }
      } catch {
        if (isMounted) {
          showError(t.collab.gpsDeniedMessage);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [t.collab.gpsDeniedMessage]);

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

  const loadMeetingPoint = async () => {
    try {
      const data = await getMeetingPointApi(circleId);
      setMeetingPoint(data);
    } catch {}
  };

  useEffect(() => {
    loadLocations();
    loadMeetingPoint();
  }, [circleId]);

  // Real-time Socket Synchronization
  useEffect(() => {
    let isSubscribed = true;
    getSocket().then((socket) => {
      if (!socket || !isSubscribed) return;

      const handleLocationUpdate = () => {
        loadLocations();
      };
      const handleMeetingPointUpdate = () => {
        loadMeetingPoint();
      };

      socket.on('circle:location-updated', handleLocationUpdate);
      socket.on('circle:location-stopped', handleLocationUpdate);
      socket.on('circle:meeting-point-updated', handleMeetingPointUpdate);
    });

    return () => {
      isSubscribed = false;
    };
  }, [circleId]);

  // Live Location continuous GPS tracking when active sharing
  useEffect(() => {
    if (!isSharing) return;
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 8000,
            distanceInterval: 10,
          },
          (loc) => {
            if (!isMounted) return;
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            setMyCoords({ lat, lng });
            updateLiveLocationApi(circleId, { latitude: lat, longitude: lng }).catch(() => {});
          },
        );
      } catch {}
    })();

    return () => {
      isMounted = false;
      locationSubscription?.remove();
    };
  }, [isSharing, circleId]);

  const handleStartSharing = async () => {
    try {
      Haptics.selectionAsync();
      setIsLoading(true);
      setErrorNotice(null);

      let lat = myCoords?.lat;
      let lng = myCoords?.lng;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setMyCoords({ lat, lng });
        } else {
          showError(t.collab.gpsDeniedMessage);
          setIsLoading(false);
          return;
        }
      } catch {
        showError(t.collab.gpsDeniedMessage);
        setIsLoading(false);
        return;
      }

      if (lat === undefined || lng === undefined) {
        showError(t.collab.gpsDeniedMessage);
        setIsLoading(false);
        return;
      }

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
    const lat = myCoords?.lat || meetingPoint?.latitude || 10.7828;
    const lng = myCoords?.lng || meetingPoint?.longitude || 106.6958;
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

  const handleWebViewMessage = (event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === 'MAP_LONG_PRESS') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const { lat, lng } = parsed;
        setMeetingLat(lat);
        setMeetingLng(lng);
        setMeetingTitle(t.collab.dropMeetingPointHere || 'Điểm hẹn mới');
        setMeetingAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        webViewRef.current?.injectJavaScript(`
          if (window.dropTempPin) {
            window.dropTempPin(${lat}, ${lng}, '${t.collab.dropMeetingPointHere || 'Điểm hẹn'}');
          }
          true;
        `);
        setIsMeetingModalOpen(true);
        // Reverse geocode in background
        fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`)
          .then((r) => r.json())
          .then((geoData) => {
            const p = geoData.features?.[0]?.properties;
            if (p) {
              const name = p.name || p.street || '';
              const parts = [p.name, p.street, p.district || p.locality, p.city].filter(Boolean);
              const fullAddr = Array.from(new Set(parts)).join(', ');
              if (name) setMeetingTitle(name);
              if (fullAddr) setMeetingAddress(fullAddr);
            }
          })
          .catch(() => {});
      }
    } catch {}
  };

  const handleSaveMeetingPoint = async () => {
    if (!meetingTitle.trim()) return;
    const lat = meetingLat ?? myCoords?.lat ?? 10.7828;
    const lng = meetingLng ?? myCoords?.lng ?? 106.6958;

    try {
      setIsSavingMeetingPoint(true);
      const saved = await setMeetingPointApi(circleId, {
        title: meetingTitle.trim(),
        address: meetingAddress.trim() || undefined,
        latitude: lat,
        longitude: lng,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMeetingPoint(saved);
      setIsMeetingModalOpen(false);
      setMeetingTitle('');
      setMeetingAddress('');
      setMeetingLat(null);
      setMeetingLng(null);
    } catch (err: any) {
      showError(err?.message || t.collab.setMeetingPoint);
    } finally {
      setIsSavingMeetingPoint(false);
    }
  };

  const handleDeleteMeetingPoint = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteMeetingPointApi(circleId);
      setMeetingPoint(null);
    } catch (err: any) {
      showError(err?.message || t.collab.removeMeetingPoint);
    }
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return t.collab.sharingExpired;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Distance to meeting point
  const distanceToMeetingText = useMemo(() => {
    if (!meetingPoint || !myCoords) return null;
    const km = calculateDistanceKm(
      myCoords.lat,
      myCoords.lng,
      meetingPoint.latitude,
      meetingPoint.longitude,
    );
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }, [meetingPoint, myCoords]);

  // Leaflet HTML template with CartoDB dark_all / light_all fallback
  const mapHtml = useMemo(() => {
    const centerLat = myCoords?.lat || meetingPoint?.latitude || 10.7828;
    const centerLng = myCoords?.lng || meetingPoint?.longitude || 106.6958;

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

    const meetingPointData = meetingPoint
      ? JSON.stringify({
          title: meetingPoint.title,
          address: meetingPoint.address,
          lat: meetingPoint.latitude,
          lng: meetingPoint.longitude,
        })
      : 'null';

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
    .mp-pin-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }
    .mp-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      border: 2.5px solid #FFFFFF;
      background: ${colors.primary};
      box-shadow: 0 0 16px rgba(56, 102, 65, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 16px;
    }
    .mp-tag {
      margin-top: 3px;
      padding: 2px 8px;
      border-radius: 10px;
      background: #D97706;
      border: 1px solid #FCD34D;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/${tileTheme}/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var markersGroup = L.featureGroup().addTo(map);

    var pins = ${pinsData};
    var meetingPoint = ${meetingPointData};

    if (meetingPoint) {
      var mpIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        iconSize: [40, 56],
        iconAnchor: [20, 28],
        html: '<div class="mp-pin-marker">' +
                '<div class="mp-icon-box"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg></div>' +
                '<div class="mp-tag">' + meetingPoint.title + '</div>' +
              '</div>'
      });
      L.marker([meetingPoint.lat, meetingPoint.lng], { icon: mpIcon }).addTo(markersGroup);
    }

    pins.forEach(function(p) {
      var initials = p.name ? p.name.substring(0, 2).toUpperCase() : '??';
      var avatarInner = p.avatarUrl
        ? '<img src="' + p.avatarUrl + '" style="width:100%;height:100%;object-fit:cover;" />'
        : initials;

      var html = '<div class="member-pin-marker">' +
                   '<div class="member-avatar-box ' + (p.isMe ? 'is-me' : '') + '">' +
                     avatarInner +
                   '</div>' +
                   '<div class="member-name-tag">' + (p.isMe ? p.meSuffix : p.name) + '</div>' +
                 '</div>';

      var icon = L.divIcon({
        className: 'custom-leaflet-pin',
        iconSize: [38, 54],
        iconAnchor: [19, 27],
        html: html
      });

      L.marker([p.lat, p.lng], { icon: icon }).addTo(markersGroup);
    });

    if (markersGroup.getLayers().length > 0) {
      try {
        var b = markersGroup.getBounds();
        if (b.isValid()) map.fitBounds(b, { padding: [50, 50], maxZoom: 16 });
      } catch(e) {}
    }

    window.panToCoords = function(lat, lng) {
      map.setView([lat, lng], 15, { animate: true });
    };

    var tempPinMarker = null;
    window.dropTempPin = function(lat, lng, title) {
      if (tempPinMarker) {
        map.removeLayer(tempPinMarker);
      }
      var tempIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        iconSize: [40, 56],
        iconAnchor: [20, 28],
        html: '<div class="mp-pin-marker" style="transform: scale(1.05);">' +
                '<div class="mp-icon-box" style="background:#059669;box-shadow:0 0 16px rgba(16,185,129,0.9);"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg></div>' +
                '<div class="mp-tag" style="background:#059669;border-color:#34D399;">' + (title || 'Điểm đã chọn') + '</div>' +
              '</div>'
      });
      tempPinMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(map);
      map.panTo([lat, lng], { animate: true });
    };

    var pressTimer = null;
    var pressStart = null;

    map.on('touchstart', function(e) {
      if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length === 1) {
        pressStart = { x: e.originalEvent.touches[0].clientX, y: e.originalEvent.touches[0].clientY };
        var latlng = e.latlng;
        pressTimer = setTimeout(function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MAP_LONG_PRESS',
              lat: latlng.lat,
              lng: latlng.lng
            }));
          }
        }, 500);
      }
    });

    map.on('touchmove', function(e) {
      if (pressTimer && pressStart && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length === 1) {
        var dx = Math.abs(e.originalEvent.touches[0].clientX - pressStart.x);
        var dy = Math.abs(e.originalEvent.touches[0].clientY - pressStart.y);
        if (dx > 12 || dy > 12) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      }
    });

    map.on('touchend touchcancel', function() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    map.on('contextmenu', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_LONG_PRESS',
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }));
      }
    });
  </script>
</body>
</html>`;
  }, [locations, myCoords, meetingPoint, isDark, colors, t, user]);

  const pillSurfaceColor = isGlass
    ? glassTheme.colors.glassBg
    : isDark
    ? '#1D1D21'
    : colors.surface;
  const pillBorderColor = isGlass ? glassTheme.colors.glassBorder : colors.hairline;

  const durationCycleInner = (
    <TouchableOpacity
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      onPress={handleCycleDuration}
      style={styles.durationTouch}
      accessibilityLabel={t.collab.startLiveShare}
    >
      <Clock size={12} color={colors.primary} />
      <Text style={[styles.durationCycleText, { color: colors.text }]}>
        {selectedDuration}m
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Floating Top Toolbar */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topClearance,
          left: 60,
          right: 16,
          zIndex: 30,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        {/* Meeting Point Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            setMeetingTitle(meetingPoint?.title || '');
            setMeetingAddress(meetingPoint?.address || '');
            setIsMeetingModalOpen(true);
          }}
          style={[
            styles.iconActionBtn,
            {
              backgroundColor: pillSurfaceColor,
              borderColor: pillBorderColor,
            },
          ]}
          accessibilityLabel={t.collab.setMeetingPoint}
        >
          <Flag size={15} color={colors.primary} />
        </TouchableOpacity>

        {/* Cycle Duration Button when not sharing */}
        {!isSharing ? (
          isGlass ? (
            <BlurView
              intensity={glassTheme.blur.intensity}
              tint={glassTheme.blur.tint}
              style={[
                styles.durationCycleShell,
                { backgroundColor: pillSurfaceColor, borderColor: pillBorderColor },
              ]}
            >
              {durationCycleInner}
            </BlurView>
          ) : (
            <View
              style={[
                styles.durationCycleShell,
                { backgroundColor: pillSurfaceColor, borderColor: pillBorderColor },
              ]}
            >
              {durationCycleInner}
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

      {/* Meeting Point Banner if set */}
      {meetingPoint && (
        <View pointerEvents="box-none" style={[styles.meetingBannerWrapper, { top: topClearance + 46 }]}>
          <View
            style={[
              styles.meetingBannerCard,
              {
                backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
                borderColor: colors.primary,
              },
            ]}
          >
            <Flag size={14} color={colors.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.meetingTitleText, { color: colors.text }]} numberOfLines={1}>
                {meetingPoint.title}
              </Text>
              {distanceToMeetingText && (
                <Text style={[styles.meetingDistText, { color: colors.primary }]}>
                  {t.collab.distanceToMeetingPoint.replace('{distance}', distanceToMeetingText)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleDeleteMeetingPoint}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.meetingDeleteBtn}
            >
              <Trash2 size={13} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Inline Error Banner */}
      {errorNotice && (
        <View pointerEvents="box-none" style={[styles.errorWrapper, { top: topClearance + (meetingPoint ? 92 : 46) }]}>
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
          onMessage={handleWebViewMessage}
        />

        {/* Floating Hint: Long-press map to set meeting point */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: topClearance + (meetingPoint ? 98 : 52),
            alignSelf: 'center',
            zIndex: 10,
          }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(19, 19, 22, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              borderWidth: 1,
              borderColor: colors.hairline,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Flag size={11} color={colors.primary} />
            <Text style={{ fontSize: 10, color: colors.subtle, fontWeight: '700' }}>
              {t.collab.rightClickOrLongPressDropHint || 'Nhấn giữ trên bản đồ để đặt điểm hẹn'}
            </Text>
          </View>
        </View>

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
              <>
                <Send size={14} color={colors.onPrimary} />
                <Text style={[styles.floatingCheckinText, { color: colors.onPrimary }]}>
                  {t.collab.sendStaticLocationHint}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal: Set Meeting Point */}
      <Modal
        visible={isMeetingModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsMeetingModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Flag size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {meetingPoint ? t.collab.editMeetingPoint : t.collab.setMeetingPoint}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsMeetingModalOpen(false)}>
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.subtle }]}>
              {t.collab.meetingPointTitle}
            </Text>
            <TextInput
              value={meetingTitle}
              onChangeText={setMeetingTitle}
              placeholder="Ví dụ: Cổng 1 Công viên Lê Văn Tám"
              placeholderTextColor={colors.subtle}
              autoFocus
              style={[styles.input, { color: colors.text, borderColor: colors.hairline, backgroundColor: colors.canvas }]}
            />

            <Text style={[styles.inputLabel, { color: colors.subtle, marginTop: 12 }]}>
              {t.collab.meetingPointAddressPlaceholder}
            </Text>
            <MobileLocationSearchInput
              value={meetingAddress}
              onChange={setMeetingAddress}
              onSelectCoords={(coords) => {
                setMeetingLat(coords.lat);
                setMeetingLng(coords.lng);
                if (!meetingTitle) setMeetingTitle(coords.title);
                webViewRef.current?.injectJavaScript(`
                  if (window.dropTempPin) {
                    window.dropTempPin(${coords.lat}, ${coords.lng}, '${coords.title}');
                  }
                  true;
                `);
              }}
              placeholder={t.collab.meetingPointAddressPlaceholder}
            />

            {meetingLat !== null && meetingLng !== null && (
              <Text style={{ fontSize: 11, color: colors.subtle, marginTop: 8 }}>
                Tọa độ ghim: {meetingLat.toFixed(4)}, {meetingLng.toFixed(4)}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsMeetingModalOpen(false)}
                disabled={isSavingMeetingPoint}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.subtle }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveMeetingPoint}
                disabled={isSavingMeetingPoint}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              >
                {isSavingMeetingPoint ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalSubmitText, { color: '#FFFFFF' }]}>
                    {t.common.save}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationCycleShell: {
    height: 38,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  durationTouch: {
    height: '100%',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  durationCycleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  startBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stopBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetingBannerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 25,
  },
  meetingBannerCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  meetingTitleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  meetingDistText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  meetingDeleteBtn: {
    padding: 4,
  },
  errorWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
    alignItems: 'center',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  floatingActionGroup: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  floatingCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingCheckinBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingCheckinText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    minWidth: 80,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
