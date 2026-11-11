'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, X, LocateFixed, Check, Loader2, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function getPickerTileUrl(isDark: boolean): string {
  if (MAPBOX_TOKEN) {
    const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
    return `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
  }
  return `https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`;
}

export interface SelectedLocationData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  formattedLocation: string;
}

interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: SelectedLocationData) => void;
  initialQuery?: string;
}

export function extractCoordsFromQuery(str: string): { lat: number; lng: number } | null {
  if (!str) return null;
  const m = str.match(/(?:query=|q=|@)(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

export function extractCleanQuery(str: string): string {
  if (!str) return '';
  return str
    .replace(/https?:\/\/[^\s]+/g, '')
    .trim()
    .replace(/\s*[-–—:]+\s*$/g, '')
    .trim();
}

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialQuery = '',
}) => {
  const t = useLanguageStore((s) => s.t);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const selectedFallbackRef = useRef(t.collab.mapPickerSelectedFallback);
  selectedFallbackRef.current = t.collab.mapPickerSelectedFallback;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const reverseGeocode = useCallback(async (lat: number, lng: number, fallbackName?: string) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`/api/locations/reverse?lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const displayName = data.address || data.name || '';
        const name =
          fallbackName || data.name || displayName.split(',')[0] || selectedFallbackRef.current;
        setSelectedPlace({ name, address: displayName, lat, lng });
      } else {
        setSelectedPlace({
          name: fallbackName || `${selectedFallbackRef.current} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          address: '',
          lat,
          lng,
        });
      }
    } catch {
      setSelectedPlace({
        name: fallbackName || `${selectedFallbackRef.current} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        address: '',
        lat,
        lng,
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  const updateMarker = useCallback(
    (lat: number, lng: number) => {
      if (!mapRef.current) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
          <div style="transform: translate(-50%, -100%);">
            <div style="background-color: #E11D48; color: white; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
              <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
            </div>
          </div>
        `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        markerRef.current = L.marker([lat, lng], {
          icon: customIcon,
          draggable: true,
        }).addTo(mapRef.current);

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });
      }
    },
    [reverseGeocode],
  );

  const executeSearch = useCallback(async (query: string): Promise<any[]> => {
    if (!query || query.trim().length < 2) return [];

    try {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Ignore search failure
    }
    return [];
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    const existingCoords = extractCoordsFromQuery(initialQuery);
    const cleanName = extractCleanQuery(initialQuery);

    setSearchQuery(cleanName);
    setGeoError(null);

    const defaultLat = existingCoords ? existingCoords.lat : 10.7769;
    const defaultLng = existingCoords ? existingCoords.lng : 106.7009;
    const defaultZoom = existingCoords ? 16 : 13;

    const map = L.map(container, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: true,
      attributionControl: false,
    });

    const pickerTileOptions: L.TileLayerOptions = {
      tileSize: MAPBOX_TOKEN ? 512 : 256,
      zoomOffset: MAPBOX_TOKEN ? -1 : 0,
      maxZoom: MAPBOX_TOKEN ? 22 : 20,
      attribution: MAPBOX_TOKEN ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap © CARTO',
    };
    if (!MAPBOX_TOKEN) {
      pickerTileOptions.subdomains = 'abcd';
    }

    const tileLayer = L.tileLayer(getPickerTileUrl(isDark), pickerTileOptions).addTo(map);

    mapRef.current = map;
    tileLayerRef.current = tileLayer;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
      reverseGeocode(lat, lng);
    });

    const timer = setTimeout(async () => {
      map.invalidateSize();

      if (existingCoords) {
        map.setView([existingCoords.lat, existingCoords.lng], 16);
        updateMarker(existingCoords.lat, existingCoords.lng);
        reverseGeocode(existingCoords.lat, existingCoords.lng, cleanName || undefined);
      } else if (cleanName && cleanName.length >= 2) {
        setIsSearching(true);
        const results = await executeSearch(cleanName);
        setIsSearching(false);
        if (results.length > 0) {
          const top = results[0];
          const lat = parseFloat(top.lat);
          const lng = parseFloat(top.lon);
          const name = top.name || top.display_name.split(',')[0] || cleanName;
          map.flyTo([lat, lng], 16);
          updateMarker(lat, lng);
          setSelectedPlace({ name, address: top.display_name, lat, lng });
        } else {
          updateMarker(defaultLat, defaultLng);
          reverseGeocode(defaultLat, defaultLng);
        }
      } else {
        updateMarker(defaultLat, defaultLng);
        reverseGeocode(defaultLat, defaultLng);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, initialQuery, updateMarker, reverseGeocode, executeSearch]);

  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getPickerTileUrl(isDark));
    }
  }, [isDark]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await executeSearch(searchQuery);
      setIsSearching(false);
      setSearchResults(results);
      setShowResultsDropdown(results.length > 0);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.name || item.display_name.split(',')[0] || searchQuery;
    const address = item.display_name;

    setSelectedPlace({ name, address, lat, lng });
    setShowResultsDropdown(false);
    setSearchQuery(name);

    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
      updateMarker(lat, lng);
    }
  };

  const handleLocateMe = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(t.collab.mapPickerGeoUnsupported);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
          updateMarker(lat, lng);
          reverseGeocode(lat, lng);
        }
      },
      () => {
        setGeoError(t.common.locationFetchError);
      },
    );
  };

  const handleConfirm = () => {
    if (!selectedPlace) return;

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`;
    const formattedLocation = `${selectedPlace.name} - ${mapUrl}`;

    onSelect({
      name: selectedPlace.name,
      address: selectedPlace.address,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      formattedLocation,
    });
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative flex flex-col w-full max-w-2xl h-[560px] max-h-[90vh] rounded-2xl glass-sheet shadow-2xl overflow-hidden">
        {/* Header (Bare Icon Invariant) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-circle-hairline dark:border-circle-dark-hairline z-10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                {t.collab.mapPickerTitle}
              </h3>
              <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                {t.collab.mapPickerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
            title={t.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar Overlay */}
        <div className="relative px-4 pt-3 pb-2 z-20 bg-circle-canvas/70 dark:bg-circle-dark-canvas/70 backdrop-blur-md border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.collab.mapPickerSearchPlaceholder}
              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface pl-9 pr-9 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/70 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-2.5 h-3.5 w-3.5 animate-spin text-circle-slate dark:text-circle-dark-muted" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {geoError && (
            <div className="mt-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] font-medium text-rose-700 dark:text-rose-400">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{geoError}</span>
              </div>
              <button
                type="button"
                onClick={() => setGeoError(null)}
                className="p-0.5 rounded hover:bg-rose-500/15"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 rounded-xl glass-sheet shadow-xl overflow-hidden max-h-56 overflow-y-auto z-30">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-circle-wash dark:hover:bg-circle-dark-wash border-b border-circle-hairline/40 dark:border-circle-dark-hairline/40 last:border-none flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                      {item.name || item.display_name.split(',')[0]}
                    </p>
                    <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                      {item.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="relative flex-1 w-full bg-circle-canvas dark:bg-circle-dark-canvas overflow-hidden">
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* GPS Locate Me Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 z-[400] flex h-9 w-9 items-center justify-center rounded-xl glass text-circle-charcoal dark:text-circle-dark-text shadow-md hover:scale-105 transition-all active:scale-95"
            title={t.collab.mapPickerLocateMe}
          >
            <LocateFixed className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            {isReverseGeocoding ? (
              <div className="flex items-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t.collab.mapPickerResolving}</span>
              </div>
            ) : selectedPlace ? (
              <div>
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{selectedPlace.name}</span>
                </p>
                <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                  {selectedPlace.address ||
                    t.collab.mapPickerCoordsPrefix
                      .replace('{lat}', selectedPlace.lat.toFixed(4))
                      .replace('{lng}', selectedPlace.lng.toFixed(4))}
                </p>
              </div>
            ) : (
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted italic">
                {t.collab.mapPickerTapHint}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              disabled={!selectedPlace || isReverseGeocoding}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{t.collab.mapPickerConfirm}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
