'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  LocateFixed,
  RotateCw,
  ShieldCheck,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Flag,
  Trash2,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import { useCircleStore } from '../../stores/circle.store';
import {
  useLiveLocationsQuery,
  useStartLiveLocationMutation,
  useUpdateLiveLocationMutation,
  useStopLiveLocationMutation,
  useMeetingPointQuery,
  useSetMeetingPointMutation,
  useDeleteMeetingPointMutation,
  TOOLS_KEYS,
} from '../../hooks/use-circle-tools';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { useSendMessageMutation } from '../../hooks/use-chat-queries';
import { useCircleDetailQuery } from '../../hooks/use-circle-queries';
import { MessageType } from '@circle/types';
import { calculateDistanceMeters, formatDistance } from '@circle/shared';
import { LocationSearchInput } from './LocationSearchInput';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function getLiveLocationTileUrl(isDark: boolean): string {
  if (MAPBOX_TOKEN) {
    const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
    return `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
  }
  return `https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`;
}

interface CircleLocationViewProps {
  circleId: string;
}

export const CircleLocationView: React.FC<CircleLocationViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const queryClient = useQueryClient();

  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Meeting Point Modal
  const [isMeetingPointModalOpen, setIsMeetingPointModalOpen] = useState(false);
  const [meetingPointTitle, setMeetingPointTitle] = useState('');
  const [meetingPointAddress, setMeetingPointAddress] = useState('');
  const [meetingPointLat, setMeetingPointLat] = useState<number | null>(null);
  const [meetingPointLng, setMeetingPointLng] = useState<number | null>(null);

  const targetLocationCoords = useCircleStore((s) => s.targetLocationCoords);
  const setTargetLocationCoords = useCircleStore((s) => s.setTargetLocationCoords);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const { data: activeLocations = [], refetch } = useLiveLocationsQuery(circleId);
  const { data: meetingPoint } = useMeetingPointQuery(circleId);

  const { data: circle } = useCircleDetailQuery(circleId);
  const channels = circle?.channels || [];
  const defaultChannel = channels[0];
  const sendMessageMutation = useSendMessageMutation(defaultChannel?.id || '');

  const startMutation = useStartLiveLocationMutation(circleId);
  const updateMutation = useUpdateLiveLocationMutation(circleId);
  const stopMutation = useStopLiveLocationMutation(circleId);
  const setMeetingPointMutation = useSetMeetingPointMutation(circleId);
  const deleteMeetingPointMutation = useDeleteMeetingPointMutation(circleId);

  const myActiveShare = activeLocations.find(
    (loc) => loc.member?.userId === user?.id || (loc as any).memberId === user?.id,
  );

  // Real-time socket sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !circleId) return;

    const handleLocationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.liveLocations(circleId) });
    };
    const handleMeetingPointUpdate = () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.meetingPoint(circleId) });
    };

    socket.on('circle:location-updated', handleLocationUpdate);
    socket.on('circle:location-stopped', handleLocationUpdate);
    socket.on('circle:meeting-point-updated', handleMeetingPointUpdate);

    return () => {
      socket.off('circle:location-updated', handleLocationUpdate);
      socket.off('circle:location-stopped', handleLocationUpdate);
      socket.off('circle:meeting-point-updated', handleMeetingPointUpdate);
    };
  }, [circleId, queryClient]);

  // Jump to coordinates if targetLocationCoords was set in store
  useEffect(() => {
    if (targetLocationCoords && mapRef.current) {
      mapRef.current.setView([targetLocationCoords.lat, targetLocationCoords.lng], 16, {
        animate: true,
      });
      setTargetLocationCoords(null);
    }
  }, [targetLocationCoords, setTargetLocationCoords]);

  // Initial user GPS position acquisition (Never silently fake Saigon coords)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setLocationError(t.collab.gpsDeniedMessage);
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } else {
      setLocationError(t.collab.gpsDeniedMessage);
    }
  }, [t.collab.gpsDeniedMessage]);

  // Watch position when active live share is ongoing
  useEffect(() => {
    if (!myActiveShare) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });
        updateMutation.mutate({ latitude: lat, longitude: lng });
      },
      () => {
        setLocationError(t.collab.gpsDeniedMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [myActiveShare]);

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return t.collab.sharingExpired;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    const initialLat = currentCoords?.lat || meetingPoint?.latitude || 10.7828;
    const initialLng = currentCoords?.lng || meetingPoint?.longitude || 106.6958;

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });
    } catch {
      return;
    }

    const tileLayerOptions: L.TileLayerOptions = {
      maxZoom: MAPBOX_TOKEN ? 22 : 20,
      tileSize: MAPBOX_TOKEN ? 512 : 256,
      zoomOffset: MAPBOX_TOKEN ? -1 : 0,
      attribution: MAPBOX_TOKEN ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap © CARTO',
    };
    if (!MAPBOX_TOKEN) {
      tileLayerOptions.subdomains = 'abcd';
    }

    const tileLayer = L.tileLayer(getLiveLocationTileUrl(isDark), tileLayerOptions).addTo(map);
    tileLayerRef.current = tileLayer;

    const markersGroup = L.featureGroup().addTo(map);
    mapRef.current = map;
    markersGroupRef.current = markersGroup;

    // Right-click to immediately drop a pin / set a meeting point at clicked coordinates
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setMeetingPointLat(lat);
      setMeetingPointLng(lng);
      setMeetingPointTitle(t.collab.dropMeetingPointHere || 'Điểm hẹn mới');
      setMeetingPointAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setIsMeetingPointModalOpen(true);

      // Reverse geocode in background to fetch clean title/address
      fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`)
        .then((r) => r.json())
        .then((data) => {
          const p = data.features?.[0]?.properties;
          if (p) {
            const placeName = p.name || p.street || '';
            const parts = [p.name, p.street, p.district || p.locality, p.city].filter(Boolean);
            const fullAddress = Array.from(new Set(parts)).join(', ');
            if (placeName) setMeetingPointTitle(placeName);
            if (fullAddress) setMeetingPointAddress(fullAddress);
          }
        })
        .catch(() => {});
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update tile layer style when theme changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getLiveLocationTileUrl(isDark));
  }, [isDark]);

  // 2. Render Markers (User, Members, Meeting Point)
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Render User marker
    if (currentCoords) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-circle-primary text-white border-2 border-white dark:border-circle-dark-surface shadow-[0_0_15px_rgba(16,185,129,0.6)] flex items-center justify-center font-bold text-xs select-none">
            ${user?.profile?.displayName?.substring(0, 2).toUpperCase() || 'ME'}
          </div>
          <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: 'custom-user-leaflet-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([currentCoords.lat, currentCoords.lng], { icon: userIcon })
        .bindTooltip(user?.profile?.displayName || t.calls.youLabel, {
          permanent: false,
          direction: 'top',
        })
        .addTo(markersGroup);
    }

    // Render Meeting Point marker
    if (meetingPoint) {
      const mpHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group">
          <div class="w-10 h-10 rounded-full bg-circle-primary text-white border-2 border-white dark:border-circle-dark-surface shadow-[0_0_20px_rgba(56,102,65,0.7)] flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-circle-primary/40 text-[11px] font-bold text-white whitespace-nowrap shadow-md">
            ${meetingPoint.title}
          </div>
        </div>
      `;

      const mpIcon = L.divIcon({
        html: mpHtml,
        className: 'custom-meeting-point-pin',
        iconSize: [40, 52],
        iconAnchor: [20, 26],
      });

      L.marker([meetingPoint.latitude, meetingPoint.longitude], { icon: mpIcon })
        .bindPopup(`
          <div class="p-1 text-xs">
            <p class="font-bold text-circle-primary dark:text-circle-dark-primary text-sm">${meetingPoint.title}</p>
            ${meetingPoint.address ? `<p class="text-[11px] text-circle-slate mt-0.5">${meetingPoint.address}</p>` : ''}
            <p class="text-[10px] text-circle-slate/70 mt-1">${meetingPoint.latitude.toFixed(4)}, ${meetingPoint.longitude.toFixed(4)}</p>
          </div>
        `)
        .addTo(markersGroup);
    }

    // Render Active Sharing Members
    activeLocations.forEach((loc) => {
      const isMe = loc.member?.userId === user?.id;
      if (isMe && currentCoords) return;

      const name = loc.member?.user?.profile?.displayName || t.collab.memberDefault;
      const initials = name.substring(0, 2).toUpperCase();
      const avatarUrl = loc.member?.user?.profile?.avatarUrl;

      const memberHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-circle-primary text-white border-2 border-white dark:border-circle-dark-surface shadow-[0_0_15px_rgba(16,185,129,0.7)] flex items-center justify-center overflow-hidden font-bold text-xs">
            ${
              avatarUrl
                ? `<img src="${avatarUrl}" class="w-full h-full object-cover" />`
                : initials
            }
          </div>
          <div class="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-[10px] font-bold text-white whitespace-nowrap shadow-md">
            ${name}
          </div>
        </div>
      `;

      const memberIcon = L.divIcon({
        html: memberHtml,
        className: 'custom-member-leaflet-pin',
        iconSize: [36, 48],
        iconAnchor: [18, 24],
      });

      const remainingText = t.collab.locationRemainingPrefix.replace(
        '{time}',
        getRemainingTime(loc.expiresAt),
      );

      L.marker([loc.latitude, loc.longitude], { icon: memberIcon })
        .bindPopup(`
          <div class="p-1 text-xs">
            <p class="font-bold text-circle-charcoal">${name}</p>
            <p class="text-[10px] text-circle-slate mt-0.5">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</p>
            <p class="text-[10px] text-amber-600 font-semibold mt-1">${remainingText}</p>
          </div>
        `)
        .addTo(markersGroup);
    });

    if (markersGroup.getLayers().length > 0) {
      try {
        const bounds = markersGroup.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        }
      } catch {}
    }
  }, [activeLocations, currentCoords, meetingPoint, t, user]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (currentCoords) {
      mapRef.current.setView([currentCoords.lat, currentCoords.lng], 15, { animate: true });
    } else if (meetingPoint) {
      mapRef.current.setView([meetingPoint.latitude, meetingPoint.longitude], 15, { animate: true });
    }
  };

  const handleStartSharing = () => {
    setLocationError(null);
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationError(t.collab.gpsDeniedMessage);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startSharingWithCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationError(t.collab.gpsDeniedMessage);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  const startSharingWithCoords = async (latitude: number, longitude: number) => {
    try {
      await startMutation.mutateAsync({
        latitude,
        longitude,
        shareDuration: selectedDuration,
      });
      setCurrentCoords({ lat: latitude, lng: longitude });
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 15, { animate: true });
      }
    } catch (err: any) {
      setLocationError(err?.message || t.collab.startLocationError);
    } finally {
      setIsLocating(false);
    }
  };

  const handleStopSharing = async () => {
    setLocationError(null);
    try {
      await stopMutation.mutateAsync();
    } catch (err: any) {
      setLocationError(err?.message || t.collab.stopLocationError);
    }
  };

  const handleSendLocationToChat = async () => {
    if (!defaultChannel?.id || !currentCoords) return;
    setLocationError(null);
    try {
      setIsSendingToChat(true);
      const payload = {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        title: t.collab.locationCardTitle,
        address: t.collab.locationCurrentLabel,
      };
      await sendMessageMutation.mutateAsync({
        content: `[LOCATION_PIN]:${JSON.stringify(payload)}`,
        type: MessageType.TEXT,
      });
      setChatSentSuccess(true);
      setTimeout(() => setChatSentSuccess(false), 3000);
    } catch (err: any) {
      setLocationError(err?.message || t.collab.locationSendToChatError);
    } finally {
      setIsSendingToChat(false);
    }
  };

  const handleSaveMeetingPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingPointTitle.trim()) return;

    const lat = meetingPointLat ?? currentCoords?.lat ?? 10.7828;
    const lng = meetingPointLng ?? currentCoords?.lng ?? 106.6958;

    try {
      await setMeetingPointMutation.mutateAsync({
        title: meetingPointTitle.trim(),
        address: meetingPointAddress.trim() || undefined,
        latitude: lat,
        longitude: lng,
      });
      setIsMeetingPointModalOpen(false);
      setMeetingPointTitle('');
      setMeetingPointAddress('');
    } catch (err: any) {
      setLocationError(err?.message || t.collab.setMeetingPoint);
    }
  };

  const handleDeleteMeetingPoint = async () => {
    try {
      await deleteMeetingPointMutation.mutateAsync();
    } catch (err: any) {
      setLocationError(err?.message || t.collab.removeMeetingPoint);
    }
  };

  // Distance to meeting point
  const distanceToMeeting = React.useMemo(() => {
    if (!meetingPoint || !currentCoords) return null;
    const meters = calculateDistanceMeters(
      currentCoords.lat,
      currentCoords.lng,
      meetingPoint.latitude,
      meetingPoint.longitude,
    );
    return formatDistance(meters);
  }, [meetingPoint, currentCoords]);

  return (
    <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Floating Controls Bar */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-[1000] flex flex-col items-center gap-2 px-4 md:px-6">
        <div className="w-full flex items-center justify-between gap-2">
          {/* Left: Active broadcasting or Meeting Point Info */}
          <div className="flex items-center gap-2">
            {activeLocations.length > 0 && (
              <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  {t.collab.activeBroadcastingCount.replace(
                    '{count}',
                    String(activeLocations.length),
                  )}
                </span>
              </div>
            )}

            {meetingPoint && (
              <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 h-9 rounded-full backdrop-blur-xl bg-circle-primary/15 border border-circle-primary/30 shadow-sm text-xs font-bold text-circle-primary dark:text-circle-dark-primary">
                <Flag className="w-3.5 h-3.5" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{meetingPoint.title}</span>
                {distanceToMeeting && (
                  <span className="font-mono text-[11px] text-circle-charcoal dark:text-circle-dark-text opacity-90">
                    ({distanceToMeeting})
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleDeleteMeetingPoint}
                  disabled={deleteMeetingPointMutation.isPending}
                  className="hover:text-rose-500 p-0.5 rounded transition-colors"
                  title={t.collab.removeMeetingPoint}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Floating Pill Buttons */}
          <div className="pointer-events-auto flex items-center gap-2 shrink-0">
            {/* Set Meeting Point Button */}
            <button
              type="button"
              onClick={() => {
                setMeetingPointTitle(meetingPoint?.title || '');
                setMeetingPointAddress(meetingPoint?.address || '');
                setMeetingPointLat(meetingPoint?.latitude ?? currentCoords?.lat ?? 10.7828);
                setMeetingPointLng(meetingPoint?.longitude ?? currentCoords?.lng ?? 106.6958);
                setIsMeetingPointModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 text-circle-primary dark:text-circle-dark-primary" />
              <span className="hidden sm:inline">
                {meetingPoint ? t.collab.editMeetingPoint : t.collab.setMeetingPoint}
              </span>
            </button>

            {!myActiveShare && (
              <div className="hidden sm:inline-flex items-center h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 p-0.5 shadow-sm text-xs">
                {[15, 30, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`px-3 h-full rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      selectedDuration === dur
                        ? 'bg-circle-primary text-white shadow-xs'
                        : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            )}

            {myActiveShare ? (
              <button
                type="button"
                onClick={handleStopSharing}
                disabled={stopMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-sm border border-rose-400/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>{t.collab.stopLiveShare}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSharing}
                disabled={isLocating || startMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm border border-circle-hairline/60 dark:border-white/12 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                )}
                <span>{t.collab.startLiveShare}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSendLocationToChat}
              disabled={isSendingToChat || !currentCoords}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-xl border shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                chatSentSuccess
                  ? 'border-circle-primary/40 bg-circle-primary/20 text-circle-sage dark:text-circle-dark-primary'
                  : 'border-circle-hairline/80 dark:border-white/12 bg-white/92 dark:bg-circle-dark-surface/90 text-circle-slate dark:text-circle-dark-muted hover:text-circle-sage dark:hover:text-circle-dark-primary hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
              }`}
              title={t.collab.sendStaticLocationHint}
            >
              {isSendingToChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : chatSentSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-circle-primary" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleRecenter}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-slate dark:text-circle-dark-muted hover:text-circle-sage dark:hover:text-circle-dark-primary hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95 cursor-pointer"
              title={t.collab.recenterMap}
            >
              <LocateFixed className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-slate dark:text-circle-dark-muted hover:text-circle-sage dark:hover:text-circle-dark-primary hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95 cursor-pointer"
              title={t.common.refresh}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {locationError && (
          <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-rose-700 dark:text-rose-400 max-w-4xl w-full backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="p-0.5 rounded-full hover:bg-rose-500/20"
              title={t.common.dismiss}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        <div
          ref={containerRef}
          className="flex-1 h-full w-full z-0 [&_.leaflet-top]:!top-28 lg:[&_.leaflet-top]:!top-16"
        />

        {MAPBOX_TOKEN && (
          <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-md pointer-events-none opacity-80 select-none shadow-sm">
            Mapbox
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-[calc(100%-2rem)]">
          <div className="glass px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[11px] text-circle-slate dark:text-circle-dark-muted shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{t.collab.locationPrivacyNotice}</span>
          </div>
          <div className="glass px-3 py-1.5 rounded-full hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-circle-primary dark:text-circle-dark-primary shadow-md">
            <Flag className="w-3 h-3 text-circle-primary dark:text-circle-dark-primary" />
            <span>{t.collab.rightClickOrLongPressDropHint || 'Nhấp chuột phải trên bản đồ để đặt điểm hẹn'}</span>
          </div>
        </div>
      </div>

      {/* Modal: Set Meeting Point */}
      {isMeetingPointModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setIsMeetingPointModalOpen(false)}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-sheet rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-circle-primary dark:text-circle-dark-primary" />
                <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {meetingPoint ? t.collab.editMeetingPoint : t.collab.setMeetingPoint}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMeetingPointModalOpen(false)}
                className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingPoint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {t.collab.meetingPointTitle}
                </label>
                <input
                  type="text"
                  value={meetingPointTitle}
                  onChange={(e) => setMeetingPointTitle(e.target.value)}
                  placeholder="Ví dụ: Cổng 1 Công viên Lê Văn Tám"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {t.collab.meetingPointAddressPlaceholder}
                </label>
                <LocationSearchInput
                  value={meetingPointAddress}
                  onChange={setMeetingPointAddress}
                  showMapButton={false}
                  onSelectCoords={(coords) => {
                    setMeetingPointLat(coords.lat);
                    setMeetingPointLng(coords.lng);
                    if (!meetingPointTitle) setMeetingPointTitle(coords.title || '');
                    if (mapRef.current) {
                      mapRef.current.panTo([coords.lat, coords.lng]);
                    }
                  }}
                  placeholder={t.collab.meetingPointAddressPlaceholder}
                />
              </div>

              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                Tọa độ ghim: {meetingPointLat?.toFixed(4)}, {meetingPointLng?.toFixed(4)}
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMeetingPointModalOpen(false)}
                  className="px-4 h-9 text-xs sm:text-sm font-bold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-full transition-all active:scale-95 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={setMeetingPointMutation.isPending}
                  className="px-5 h-9 text-xs sm:text-sm font-bold bg-circle-primary hover:bg-circle-sage text-white rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {setMeetingPointMutation.isPending ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
