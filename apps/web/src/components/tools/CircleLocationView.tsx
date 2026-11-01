'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Radio,
  Clock,
  LocateFixed,
  RotateCw,
  Users,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  useLiveLocationsQuery,
  useStartLiveLocationMutation,
  useStopLiveLocationMutation,
} from '../../hooks/use-circle-tools';
import { useSendMessageMutation } from '../../hooks/use-chat-queries';
import { useCircleDetailQuery } from '../../hooks/use-circle-queries';
import { MessageType } from '@circle/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface CircleLocationViewProps {
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

export const CircleLocationView: React.FC<CircleLocationViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 15, 30, 60 mins
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const {
    data: activeLocations = [],
    isLoading: isLoadingLocations,
    refetch,
  } = useLiveLocationsQuery(circleId);

  const { data: circle } = useCircleDetailQuery(circleId);
  const channels = circle?.channels || [];
  const defaultChannel = channels[0];
  const sendMessageMutation = useSendMessageMutation(defaultChannel?.id || '');

  const startMutation = useStartLiveLocationMutation(circleId);
  const stopMutation = useStopLiveLocationMutation(circleId);

  // Check if current user is actively sharing
  const myActiveShare = activeLocations.find(
    (loc) => loc.member?.userId === user?.id || (loc as any).memberId === user?.id,
  );

  // Acquire initial GPS position on mount
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
          // Saigon default
          setCurrentCoords({ lat: 10.7828, lng: 106.6958 });
        },
        { enableHighAccuracy: true, timeout: 6000 },
      );
    } else {
      setCurrentCoords({ lat: 10.7828, lng: 106.6958 });
    }
  }, []);

  // Format remaining time in MM:SS
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

    const initialLat = currentCoords?.lat || 10.7828;
    const initialLng = currentCoords?.lng || 106.6958;

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });
    } catch (err) {
      console.error('Failed to init map:', err);
      return;
    }

    // Mapbox Tiles (with fallback to ArcGIS if token is missing)
    const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
    const tileUrl = MAPBOX_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: MAPBOX_TOKEN ? 22 : 19,
      tileSize: MAPBOX_TOKEN ? 512 : 256,
      zoomOffset: MAPBOX_TOKEN ? -1 : 0,
      attribution: MAPBOX_TOKEN ? '© Mapbox © OpenStreetMap' : 'Esri',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersGroup = L.featureGroup().addTo(map);
    mapRef.current = map;
    markersGroupRef.current = markersGroup;

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

  // Update tile layer style when theme (dark/light) changes
  useEffect(() => {
    if (!tileLayerRef.current || !MAPBOX_TOKEN) return;
    const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
    const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
    tileLayerRef.current.setUrl(tileUrl);
  }, [isDark]);

  // 2. Render Markers onto Map whenever activeLocations or currentCoords change
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Current User Marker (if available)
    if (currentCoords) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-circle-primary text-white border-2 border-white dark:border-circle-dark-surface shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center justify-center font-bold text-xs select-none">
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
        .bindTooltip(user?.profile?.displayName || 'Tôi', { permanent: false, direction: 'top' })
        .addTo(markersGroup);
    }

    // Active Members Markers
    activeLocations.forEach((loc) => {
      const isMe = loc.member?.userId === user?.id;
      if (isMe && currentCoords) return; // avoid duplicate pin for current user

      const name = loc.member?.user?.profile?.displayName || 'Thành viên';
      const initials = name.substring(0, 2).toUpperCase();
      const avatarUrl = loc.member?.user?.profile?.avatarUrl;

      const memberHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-sky-500 text-white border-2 border-white dark:border-circle-dark-surface shadow-[0_0_15px_rgba(56,189,248,0.7)] flex items-center justify-center overflow-hidden font-bold text-xs">
            ${
              avatarUrl
                ? `<img src="${avatarUrl}" class="w-full h-full object-cover" />`
                : initials
            }
          </div>
          <div class="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-sky-400/40 text-[10px] font-bold text-white whitespace-nowrap shadow-md">
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

      L.marker([loc.latitude, loc.longitude], { icon: memberIcon })
        .bindPopup(`
          <div class="p-1 text-xs">
            <p class="font-bold text-circle-charcoal">${name}</p>
            <p class="text-[10px] text-circle-slate mt-0.5">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</p>
            <p class="text-[10px] text-amber-600 font-semibold mt-1">Còn ${getRemainingTime(loc.expiresAt)}</p>
          </div>
        `)
        .addTo(markersGroup);
    });

    // Auto fit bounds if multiple pins exist
    if (markersGroup.getLayers().length > 0) {
      try {
        const bounds = markersGroup.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch {}
    }
  }, [activeLocations, currentCoords]);

  const handleRecenter = () => {
    if (!mapRef.current || !currentCoords) return;
    mapRef.current.setView([currentCoords.lat, currentCoords.lng], 15, { animate: true });
  };

  const handleStartSharing = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      startSharingWithCoords(10.7828, 106.6958);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startSharingWithCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        startSharingWithCoords(10.7828, 106.6958);
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
      console.error('Failed to start live location:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleStopSharing = async () => {
    try {
      await stopMutation.mutateAsync();
    } catch (err: any) {
      console.error('Failed to stop live location:', err);
    }
  };

  const handleSendLocationToChat = async () => {
    if (!defaultChannel?.id || !currentCoords) return;
    try {
      setIsSendingToChat(true);
      const payload = {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        title: t.collab.locationCardTitle,
        address: 'Vị trí hiện tại',
      };
      await sendMessageMutation.mutateAsync({
        content: `[LOCATION_PIN]:${JSON.stringify(payload)}`,
        type: MessageType.TEXT,
      });
      setChatSentSuccess(true);
      setTimeout(() => setChatSentSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to send location pin:', err);
    } finally {
      setIsSendingToChat(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-3.5 border-b border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-between bg-white dark:bg-circle-dark-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-2">
              {t.collab.locationTitle}
              {activeLocations.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  {t.collab.activeBroadcastingCount.replace('{count}', String(activeLocations.length))}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
              {t.collab.locationSubtitle}
            </p>
          </div>
        </div>

        {/* Controls: Duration Selector + Actions */}
        <div className="flex items-center gap-2.5">
          {!myActiveShare ? (
            <div className="flex items-center rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-canvas p-0.5 text-xs">
              {[15, 30, 60].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSelectedDuration(dur)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedDuration === dur
                      ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-2xs'
                      : 'text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          ) : null}

          {myActiveShare ? (
            <button
              type="button"
              onClick={handleStopSharing}
              disabled={stopMutation.isPending}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-xs"
            >
              {t.collab.stopLiveShare}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSharing}
              disabled={isLocating || startMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-xs disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              )}
              <span>{t.collab.startLiveShare}</span>
            </button>
          )}

          {/* Send static checkin to chat */}
          <button
            type="button"
            onClick={handleSendLocationToChat}
            disabled={isSendingToChat || !currentCoords}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              chatSentSuccess
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash'
            }`}
            title={t.collab.sendStaticLocationHint}
          >
            {isSendingToChat ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : chatSentSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Send className="w-3.5 h-3.5 text-sky-500" />
            )}
            <span>{chatSentSuccess ? 'Đã gửi vào Chat' : t.collab.sendStaticLocation}</span>
          </button>

          {/* Recenter */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors"
            title={t.collab.recenterMap}
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors"
            title={t.common.refresh}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Leaflet Map + Active Members Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leaflet Map Canvas */}
        <div ref={containerRef} className="flex-1 h-full w-full z-0" />

        {MAPBOX_TOKEN && (
          <div className="absolute bottom-4 right-76 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md pointer-events-none opacity-80 select-none">
            Mapbox
          </div>
        )}

        {/* Floating Privacy Notice */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-circle-dark-surface/90 backdrop-blur-md border border-circle-hairline dark:border-circle-dark-hairline px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] text-circle-slate dark:text-circle-dark-muted shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t.collab.locationPrivacyNotice}</span>
        </div>

        {/* Right Sidebar: Active Members List */}
        <div className="w-72 border-l border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface flex flex-col z-10 shadow-xs">
          <div className="p-3.5 border-b border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>
                {t.collab.activeBroadcastingCount.replace('{count}', String(activeLocations.length))}
              </span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeLocations.length === 0 ? (
              <div className="text-center py-10 px-4 flex flex-col items-center justify-center gap-2">
                <Navigation className="w-8 h-8 text-sky-400 stroke-[1.5]" />
                <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.collab.emptyLocationTitle}
                </h4>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                  {t.collab.emptyLocationDesc}
                </p>
              </div>
            ) : (
              activeLocations.map((loc) => {
                const isMe = loc.member?.userId === user?.id;
                const name = loc.member?.user?.profile?.displayName || 'Thành viên';
                const avatar = loc.member?.user?.profile?.avatarUrl;
                const initials = name.substring(0, 2).toUpperCase();

                let distanceText: string | null = null;
                if (currentCoords && !isMe) {
                  const dist = calculateDistanceKm(
                    currentCoords.lat,
                    currentCoords.lng,
                    loc.latitude,
                    loc.longitude,
                  );
                  if (dist < 1) {
                    distanceText = t.collab.distanceAwayM.replace(
                      '{distance}',
                      String(Math.round(dist * 1000)),
                    );
                  } else {
                    distanceText = t.collab.distanceAwayKm.replace(
                      '{distance}',
                      dist.toFixed(1),
                    );
                  }
                }

                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setView([loc.latitude, loc.longitude], 16, {
                          animate: true,
                        });
                      }
                    }}
                    className="p-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash/60 dark:bg-circle-dark-canvas/60 hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-all flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-sky-500/20 text-sky-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {avatar ? (
                          <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                          {name} {isMe && '(Tôi)'}
                        </p>
                        {distanceText && (
                          <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                            {distanceText}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold block">
                        {getRemainingTime(loc.expiresAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
