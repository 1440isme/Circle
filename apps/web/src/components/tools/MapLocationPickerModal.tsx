'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, X, LocateFixed, Check, Loader2 } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export interface SelectedLocationData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  formattedLocation: string; // Clean place name / address without attached URLs
}

interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: SelectedLocationData) => void;
  initialQuery?: string;
}

// Helper to extract coordinates if present in URL
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

// Helper to extract clean query text for the search box
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
  const [mounted, setMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSelectingResultRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResultsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to reverse geocode coordinates using local API route or fallback
  const reverseGeocode = useCallback(async (lat: number, lng: number, fallbackName?: string) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`/api/locations/reverse?lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const displayName = data.address || data.name || '';
        const name = fallbackName || data.name || displayName.split(',')[0] || 'Vị trí đã chọn';
        const address = displayName;
        setSelectedPlace({ name, address, lat, lng });
      } else {
        setSelectedPlace({
          name: fallbackName || `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          address: '',
          lat,
          lng,
        });
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      setSelectedPlace({
        name: fallbackName || `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
        address: '',
        lat,
        lng,
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Update or create pin marker
  const updateMarker = useCallback((lat: number, lng: number) => {
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
  }, [reverseGeocode]);

  // Search function helper with direct client fallback to Photon
  const executeSearch = useCallback(async (query: string): Promise<any[]> => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    try {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Place search API error, attempting direct fallback:', err);
    }

    // Direct Photon OSM fallback to guarantee search works reliably
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        trimmed
      )}&lat=10.7769&lon=106.7009&limit=6`;
      const pRes = await fetch(photonUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        const features = pData.features || [];
        if (features.length > 0) {
          return features.map((f: any) => {
            const p = f.properties || {};
            const name = p.name || p.street || trimmed;
            const parts = [
              p.name,
              p.housenumber ? `Số ${p.housenumber}` : '',
              p.street,
              p.locality || p.district,
              p.city,
              p.state || p.country,
            ].filter(Boolean);
            return {
              name,
              display_name: Array.from(new Set(parts)).join(', ') || name,
              lat: f.geometry?.coordinates?.[1],
              lon: f.geometry?.coordinates?.[0],
            };
          });
        }
      }
    } catch (fErr) {
      console.warn('Direct fallback error:', fErr);
    }

    return [];
  }, []);

  // 1. Initialize Map with initialQuery coordinates or clean name search
  useEffect(() => {
    if (!isOpen || !mounted) return;

    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    const existingCoords = extractCoordsFromQuery(initialQuery);
    const cleanName = extractCleanQuery(initialQuery);

    setSearchQuery(cleanName);

    // Initial center: if coordinates provided, use them; otherwise default to HCM center
    const defaultLat = existingCoords ? existingCoords.lat : 10.7769;
    const defaultLng = existingCoords ? existingCoords.lng : 106.7009;
    const defaultZoom = existingCoords ? 16 : 13;

    const map = L.map(container, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Mapbox Raster Tiles (streets-v12 / dark-v11) with ESRI fallback
    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');
    const mapboxStyle = isDark ? 'dark-v11' : 'streets-v12';
    const tileUrl = MAPBOX_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(tileUrl, {
      tileSize: MAPBOX_TOKEN ? 512 : 256,
      zoomOffset: MAPBOX_TOKEN ? -1 : 0,
      maxZoom: 22,
      attribution: MAPBOX_TOKEN ? '© Mapbox © OpenStreetMap' : 'Esri',
    }).addTo(map);

    mapRef.current = map;

    // Handle map clicks to place/move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
      reverseGeocode(lat, lng);
      setShowResultsDropdown(false);
    });

    const timer = setTimeout(async () => {
      map.invalidateSize();

      if (existingCoords) {
        // Has exact coordinates: center map, place marker and reverse geocode
        map.setView([existingCoords.lat, existingCoords.lng], 16);
        updateMarker(existingCoords.lat, existingCoords.lng);
        reverseGeocode(existingCoords.lat, existingCoords.lng, cleanName || undefined);
      } else if (cleanName && cleanName.length >= 2) {
        // Has clean name text: search map right away on open
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
      markerRef.current = null;
    };
  }, [isOpen, mounted, initialQuery, updateMarker, reverseGeocode, executeSearch]);

  // 2. Search places on user input change (debounced)
  useEffect(() => {
    if (isSelectingResultRef.current) {
      isSelectingResultRef.current = false;
      return;
    }

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
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.name || item.display_name.split(',')[0] || searchQuery;
    const address = item.display_name;

    setSelectedPlace({ name, address, lat, lng });
    setShowResultsDropdown(false);
    isSelectingResultRef.current = true;
    setSearchQuery(name);

    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
      updateMarker(lat, lng);
    }
  };

  const handleTriggerSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || query.length < 2) return;

    setIsSearching(true);
    const results = await executeSearch(query);
    setIsSearching(false);
    setSearchResults(results);

    if (results.length > 0) {
      handleSelectSearchResult(results[0]);
    } else {
      setShowResultsDropdown(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
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
        alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí.');
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedPlace) return;

    // Use clean place name or address, NEVER append the google maps link URL
    let cleanLocation = selectedPlace.name || selectedPlace.address;
    if (
      (!cleanLocation ||
        cleanLocation === 'Vị trí đã chọn' ||
        cleanLocation.startsWith('Vị trí (')) &&
      selectedPlace.address
    ) {
      cleanLocation = selectedPlace.address;
    }

    cleanLocation = (cleanLocation || `Vị trí (${selectedPlace.lat.toFixed(5)}, ${selectedPlace.lng.toFixed(5)})`)
      .replace(/https?:\/\/[^\s]+/g, '')
      .trim()
      .replace(/\s*[-–—:]+\s*$/g, '')
      .trim();

    onSelect({
      name: selectedPlace.name,
      address: selectedPlace.address,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      formattedLocation: cleanLocation,
    });
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-2xl h-[580px] rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                Tìm Kiếm & Chọn Địa Điểm Trên Bản Đồ
              </h3>
              <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
                Gõ tìm kiếm địa điểm hoặc chạm trực tiếp trên bản đồ để ghim vị trí
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar Overlay with dedicated Search action */}
        <div
          ref={searchContainerRef}
          className="relative px-4 pt-3 pb-2 z-30 bg-circle-canvas/90 dark:bg-circle-dark-canvas/90 backdrop-blur-md border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 shrink-0"
        >
          <form onSubmit={handleTriggerSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-circle-slate" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResultsDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTriggerSearch();
                  }
                }}
                placeholder="Tìm kiếm: Đại học Sư phạm Kỹ thuật, Landmark 81, Hồ Con Rùa..."
                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface pl-9 pr-8 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/70 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResultsDropdown(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              disabled={isSearching || !searchQuery.trim()}
              onClick={() => handleTriggerSearch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span>Tìm</span>
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl overflow-hidden max-h-56 overflow-y-auto z-50 animate-in fade-in duration-100">
              <div className="px-3.5 py-1.5 bg-circle-wash/60 dark:bg-circle-dark-wash/60 border-b border-circle-hairline/40 text-[10px] font-bold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
                Kết quả tìm kiếm ({searchResults.length})
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-circle-wash dark:hover:bg-circle-dark-wash border-b border-circle-hairline/40 dark:border-circle-dark-hairline/40 last:border-none flex items-start gap-2.5 transition-colors cursor-pointer"
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

          {/* Mapbox badge */}
          {MAPBOX_TOKEN && (
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-circle-hairline dark:border-circle-dark-hairline text-[10px] font-semibold text-circle-charcoal dark:text-circle-dark-text shadow-sm">
                Mapbox
              </span>
            </div>
          )}

          {/* GPS Locate Me Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text shadow-md hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95 cursor-pointer"
            title="Định vị vị trí của tôi"
          >
            <LocateFixed className="h-4 w-4 text-circle-primary" />
          </button>
        </div>

        {/* Footer Selected Place Info & Confirm */}
        <div className="px-4 py-3 bg-white dark:bg-circle-dark-surface border-t border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            {isReverseGeocoding ? (
              <div className="flex items-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang xác định địa chỉ...</span>
              </div>
            ) : selectedPlace ? (
              <div>
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                  📍 {selectedPlace.name}
                </p>
                <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                  {selectedPlace.address || `Tọa độ: ${selectedPlace.lat.toFixed(4)}, ${selectedPlace.lng.toFixed(4)}`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted italic">
                Chạm vào bản đồ hoặc tìm kiếm để chọn địa điểm
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedPlace || isReverseGeocoding}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-95 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Chọn địa điểm này</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
