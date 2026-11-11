'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Radio,
  LocateFixed,
  RotateCw,
  ShieldCheck,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import { useCircleStore } from '../../stores/circle.store';
import {
  useLiveLocationsQuery,
  useStartLiveLocationMutation,
  useStopLiveLocationMutation,
} from '../../hooks/use-circle-tools';
import { useSendMessageMutation } from '../../hooks/use-chat-queries';
import { useCircleDetailQuery } from '../../hooks/use-circle-queries';
import { MessageType } from '@circle/types';

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

  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const targetLocationCoords = useCircleStore((s) => s.targetLocationCoords);
  const setTargetLocationCoords = useCircleStore((s) => s.setTargetLocationCoords);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const { data: activeLocations = [], refetch } = useLiveLocationsQuery(circleId);

  const { data: circle } = useCircleDetailQuery(circleId);
  const channels = circle?.channels || [];
  const defaultChannel = channels[0];
  const sendMessageMutation = useSendMessageMutation(defaultChannel?.id || '');

  const startMutation = useStartLiveLocationMutation(circleId);
  const stopMutation = useStopLiveLocationMutation(circleId);

  const myActiveShare = activeLocations.find(
    (loc) => loc.member?.userId === user?.id || (loc as any).memberId === user?.id,
  );

  useEffect(() => {
    if (targetLocationCoords && mapRef.current) {
      mapRef.current.setView([targetLocationCoords.lat, targetLocationCoords.lng], 16, {
        animate: true,
      });
      setTargetLocationCoords(null);
    }
  }, [targetLocationCoords, setTargetLocationCoords]);

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
          setCurrentCoords({ lat: 10.7828, lng: 106.6958 });
        },
        { enableHighAccuracy: true, timeout: 6000 },
      );
    } else {
      setCurrentCoords({ lat: 10.7828, lng: 106.6958 });
    }
  }, []);

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

  // Update tile layer style when theme changes (for BOTH Mapbox and CartoDB)
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getLiveLocationTileUrl(isDark));
  }, [isDark]);

  // 2. Render Markers
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (currentCoords) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-circle-primary text-circle-charcoal border-2 border-white dark:border-circle-dark-surface shadow-[0_0_15px_rgba(16,185,129,0.6)] flex items-center justify-center font-bold text-xs select-none">
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

    activeLocations.forEach((loc) => {
      const isMe = loc.member?.userId === user?.id;
      if (isMe && currentCoords) return;

      const name = loc.member?.user?.profile?.displayName || t.collab.memberDefault;
      const initials = name.substring(0, 2).toUpperCase();
      const avatarUrl = loc.member?.user?.profile?.avatarUrl;

      const memberHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-circle-primary text-circle-charcoal border-2 border-white dark:border-circle-dark-surface shadow-[0_0_15px_rgba(16,185,129,0.7)] flex items-center justify-center overflow-hidden font-bold text-xs">
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
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch {}
    }
  }, [activeLocations, currentCoords, t, user]);

  const handleRecenter = () => {
    if (!mapRef.current || !currentCoords) return;
    mapRef.current.setView([currentCoords.lat, currentCoords.lng], 15, { animate: true });
  };

  const handleStartSharing = () => {
    setLocationError(null);
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

  return (
    <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Floating Glass Toolbar */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-[1000] flex flex-col items-center gap-2 px-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2.5 rounded-full glass shadow-md max-w-4xl w-full transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin className="w-5 h-5 text-circle-sage dark:text-circle-dark-primary shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                {t.collab.locationTitle}
              </h2>
              {activeLocations.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-circle-primary/15 text-circle-sage dark:text-circle-dark-primary shrink-0">
                  {t.collab.activeBroadcastingCount.replace(
                    '{count}',
                    String(activeLocations.length),
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!myActiveShare && (
              <div className="hidden sm:flex items-center rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash/80 dark:bg-circle-dark-canvas/80 p-0.5 text-xs">
                {[15, 30, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      selectedDuration === dur
                        ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-2xs'
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
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-xs"
              >
                {t.collab.stopLiveShare}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSharing}
                disabled={isLocating || startMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white transition-all shadow-xs disabled:opacity-50"
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
              className={`p-1.5 rounded-full border transition-all shadow-xs ${
                chatSentSuccess
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-circle-hairline dark:border-circle-dark-hairline bg-white/90 dark:bg-circle-dark-surface/90 text-circle-sage dark:text-circle-dark-primary hover:text-circle-charcoal dark:hover:text-white'
              }`}
              title={t.collab.sendStaticLocationHint}
            >
              {isSendingToChat ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : chatSentSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleRecenter}
              className="p-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors shadow-xs"
              title={t.collab.recenterMap}
            >
              <LocateFixed className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors shadow-xs"
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

        <div className="absolute bottom-4 left-4 z-10 glass px-3.5 py-1.5 rounded-full flex items-center gap-2 text-[11px] text-circle-slate dark:text-circle-dark-muted shadow-md max-w-[calc(100%-2rem)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">{t.collab.locationPrivacyNotice}</span>
        </div>
      </div>
    </div>
  );
};
