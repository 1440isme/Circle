'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, MapPin, X } from 'lucide-react';
import { useLanguageStore } from '@/stores/language.store';
import { useThemeStore } from '@/stores/theme.store';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function resolveTileConfig(isDark: boolean) {
  if (MAPBOX_TOKEN) {
    const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 22,
      subdomains: undefined as string | undefined,
      attribution: '© Mapbox © OpenStreetMap',
    };
  }
  return {
    url: `https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}@2x.png`,
    tileSize: 256,
    zoomOffset: 0,
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '© OpenStreetMap © CARTO',
  };
}

export interface MapClusterPin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  thumbUrl: string;
  count: number;
  moments: any[];
}

interface MomentPlacesMapProps {
  clusters: MapClusterPin[];
  selectedCluster: MapClusterPin | null;
  onSelectCluster: (cluster: MapClusterPin | null) => void;
  onViewClusterMoments: (moments: any[]) => void;
  locale?: string;
}

export const MomentPlacesMap: React.FC<MomentPlacesMapProps> = ({
  clusters,
  selectedCluster,
  onSelectCluster,
  onViewClusterMoments,
  locale: propLocale,
}) => {
  const t = useLanguageStore((s) => s.t);
  const storeLocale = useLanguageStore((s) => s.locale);
  const activeLocale = propLocale || storeLocale;
  const isVi = activeLocale === 'vi';
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const markersMapRef = useRef<Record<string, L.Marker>>({});
  const onSelectClusterRef = useRef(onSelectCluster);
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  useEffect(() => {
    onSelectClusterRef.current = onSelectCluster;
  }, [onSelectCluster]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [10.8231, 106.6297],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });
    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err);
      return;
    }

    const cfg = resolveTileConfig(isDarkRef.current);
    const tileLayer = L.tileLayer(cfg.url, {
      tileSize: cfg.tileSize,
      zoomOffset: cfg.zoomOffset,
      maxZoom: cfg.maxZoom,
      ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {}),
      attribution: cfg.attribution,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const markersGroup = L.featureGroup().addTo(map);

    mapRef.current = map;
    markersGroupRef.current = markersGroup;

    const timer1 = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 60);
    const timer2 = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 200);
    const timer3 = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 600);

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      resizeObserver.disconnect();
      try {
        map.remove();
      } catch {}
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
      mapRef.current = null;
      tileLayerRef.current = null;
      markersGroupRef.current = null;
    };
  }, []);

  // Update tiles seamlessly on Dark/Light theme change
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(resolveTileConfig(isDark).url);
  }, [isDark]);

  // 2. Render Markers on Clusters Change (Only when clusters dataset changes)
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markersMapRef.current = {};

    if (clusters.length === 0) {
      map.setView([10.8231, 106.6297], 13);
      return;
    }

    const bounds: [number, number][] = [];

    clusters.forEach((cluster) => {
      const badgeHtml =
        cluster.count > 1 ? `<span class="photo-pin-badge">+${cluster.count}</span>` : '';

      const html = `
        <div class="photo-pin-marker" id="pin-${cluster.id}">
          <div class="photo-pin-bubble">
            <img class="photo-pin-img" src="${cluster.thumbUrl}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\'><rect width=\\'48\\' height=\\'48\\' fill=\\'%2364748b\\'/></svg>'" />
            ${badgeHtml}
          </div>
          <div class="photo-pin-tail"></div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'custom-pin-container',
        iconSize: [48, 55],
        iconAnchor: [24, 55],
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectClusterRef.current(cluster);
        // Pan smoothly to clicked pin WITHOUT changing the current zoom level
        map.panTo([cluster.lat, cluster.lng], { animate: true, duration: 0.35 });
      });

      marker.addTo(markersGroup);
      markersMapRef.current[cluster.id] = marker;
      bounds.push([cluster.lat, cluster.lng]);
    });

    const applyMapBounds = () => {
      if (!mapRef.current) return;
      const size = mapRef.current.getSize();
      // Only invoke fitBounds if container has painted dimensions (>100px) to prevent NaN zoom
      if (bounds.length > 1 && size.x > 100 && size.y > 100) {
        try {
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch {
          mapRef.current.setView(bounds[0]!, 13);
        }
      } else if (bounds.length >= 1 && bounds[0]) {
        mapRef.current.setView(bounds[0], 13);
      }
    };

    applyMapBounds();
    const deferredBoundsTimer = setTimeout(applyMapBounds, 250);

    return () => {
      clearTimeout(deferredBoundsTimer);
    };
  }, [clusters]);

  // 3. Update Selected Marker Highlighting & Pan without Zooming Out
  useEffect(() => {
    if (!containerRef.current) return;
    const bubbles = containerRef.current.querySelectorAll('.photo-pin-bubble');
    bubbles.forEach((b) => b.classList.remove('selected'));

    if (selectedCluster?.id) {
      const targetPin = containerRef.current.querySelector(`#pin-${selectedCluster.id} .photo-pin-bubble`);
      if (targetPin) {
        targetPin.classList.add('selected');
      }
    }
  }, [selectedCluster?.id]);

  const handleRecenter = () => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    if (markersGroup.getLayers().length > 0) {
      map.fitBounds(markersGroup.getBounds(), { padding: [60, 60], maxZoom: 15 });
    } else {
      map.setView([10.8231, 106.6297], 13);
    }
    onSelectCluster(null);
  };

  return (
    <div
      className={`relative w-full h-full min-h-[400px] overflow-hidden select-none ${
        isDark ? 'places-map-dark bg-circle-dark-canvas' : 'places-map-light bg-circle-canvas'
      }`}
    >
      {/* Embedded CSS for custom Leaflet photo pins */}
      <style jsx global>{`
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          font-family: inherit !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        .places-map-dark .leaflet-container {
          background: #0f1115 !important;
        }
        .places-map-light .leaflet-container {
          background: #faf9f7 !important;
        }
        .custom-pin-container {
          background: none !important;
          border: none !important;
        }
        .photo-pin-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          user-select: none;
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .photo-pin-marker:hover {
          transform: scale(1.14);
          z-index: 1000 !important;
        }
        .photo-pin-marker:active {
          transform: scale(0.94);
        }
        .photo-pin-bubble {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: #181a20;
          border: 3px solid #ffffff;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .photo-pin-bubble.selected {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.35), 0 8px 24px rgba(0, 0, 0, 0.5);
        }
        .photo-pin-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 20px;
        }
        .photo-pin-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          background: #10b981;
          color: #131316;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 10px;
          border: 1.5px solid #ffffff;
          line-height: 1.2;
        }
        .photo-pin-tail {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid #ffffff;
          margin-top: -1px;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2) !important;
          border-radius: 14px !important;
          overflow: hidden;
          margin-right: 16px !important;
          margin-bottom: 24px !important;
        }
        .places-map-dark .leaflet-control-zoom a {
          background: #181a20 !important;
          color: #f3f4f6 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
        }
        .places-map-dark .leaflet-control-zoom a:hover {
          background: #27272a !important;
        }
        .places-map-light .leaflet-control-zoom a {
          background: #ffffff !important;
          color: #131316 !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
        }
        .places-map-light .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
        }
      `}</style>

      {/* Real Native DOM Leaflet Map Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      />

      {/* Mapbox attribution pill */}
      {MAPBOX_TOKEN && (
        <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
          <div className="glass px-2 py-0.5 rounded-md border border-circle-hairline dark:border-circle-dark-hairline text-[10px] font-semibold text-circle-slate dark:text-circle-dark-muted">
            Mapbox
          </div>
        </div>
      )}

      {/* Floating Recenter Map Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={handleRecenter}
          className="glass flex items-center justify-center h-10 w-10 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text shadow-lg hover:scale-105 active:scale-95 transition-transform"
          title={t.moments.recenterMap}
          aria-label={t.moments.recenterMap}
        >
          <LocateFixed className="h-5 w-5 text-circle-sage dark:text-circle-dark-primary" />
        </button>
      </div>

      {/* Floating Preview Card when Pin is Selected */}
      {selectedCluster && (
        <div className="glass-sheet absolute bottom-6 inset-x-4 sm:inset-x-auto sm:left-6 sm:w-96 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline p-4 shadow-2xl z-20 animate-fade-in flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <img
              src={selectedCluster.thumbUrl}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover shrink-0 border border-circle-hairline dark:border-circle-dark-hairline"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-circle-charcoal dark:text-circle-dark-text font-bold text-sm truncate">
                <MapPin className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                <span className="truncate">{selectedCluster.name}</span>
              </div>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted truncate mt-0.5">
                {selectedCluster.address}
              </p>
              <p className="text-xs font-bold text-circle-sage dark:text-circle-dark-primary mt-1">
                {selectedCluster.count > 1
                  ? `${selectedCluster.count} ${t.moments.momentsAtLocation}`
                  : new Date(selectedCluster.moments[0]?.createdAt).toLocaleDateString(
                      isVi ? 'vi-VN' : 'en-US',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      },
                    )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectCluster(null)}
              aria-label={t.common.close}
              title={t.common.close}
              className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onViewClusterMoments(selectedCluster.moments)}
            className="w-full py-2.5 rounded-2xl bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas text-xs font-bold hover:bg-circle-sage dark:hover:bg-circle-primary-hover transition-colors text-center"
          >
            {t.moments.viewPhotosHere.replace('{count}', String(selectedCluster.count))}
          </button>
        </div>
      )}
    </div>
  );
};
