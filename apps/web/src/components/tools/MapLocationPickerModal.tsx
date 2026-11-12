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

  // Highly robust reverse geocoding: tries internal API first, falls back directly to BigDataCloud
  const reverseGeocode = useCallback(async (lat: number, lng: number, fallbackName?: string) => {
    setIsReverseGeocoding(true);

    // 1. Try local API route
    try {
      const res = await fetch(`/api/locations/reverse?lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const displayName = data.address || data.name || '';
        const nameCandidate = fallbackName || (data.name && !data.name.startsWith('Vị trí (')) ? data.name : (displayName.split(',')[0] || '');
        if (nameCandidate && !nameCandidate.startsWith('Vị trí (')) {
          const place = { name: nameCandidate, address: displayName, lat, lng };
          setSelectedPlace(place);
          setIsReverseGeocoding(false);
          return place;
        }
      }
    } catch (err) {
      console.warn('Local reverse geocode error:', err);
    }

    // 2. High reliability client fallback: BigDataCloud (supports Vietnamese language, always succeeds)
    try {
      const bRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`
      );
      if (bRes.ok) {
        const d = await bRes.json();
        const info = d.localityInfo?.informative || [];
        const districtObj = info.find(
          (x: any) =>
            x.name &&
            (x.name.includes('Quận') ||
              x.name.includes('Huyện') ||
              x.name.includes('Thị xã') ||
              x.name.includes('Thành phố') ||
              x.name.includes('District'))
        );
        const district = districtObj ? districtObj.name : '';
        const locality = d.locality || '';
        const city = d.city || d.principalSubdivision || '';
        const resolvedName = district
          ? locality && locality !== district
            ? `${locality}, ${district}`
            : district
          : locality || city || fallbackName || 'Vị trí hiện tại';
        const addressParts = [locality, district, city, d.countryName || 'Việt Nam'].filter(Boolean);
        const resolvedAddress = Array.from(new Set(addressParts)).join(', ');

        const place = { name: resolvedName, address: resolvedAddress || resolvedName, lat, lng };
        setSelectedPlace(place);
        setIsReverseGeocoding(false);
        return place;
      }
    } catch (bErr) {
      console.warn('BigDataCloud reverse geocode error:', bErr);
    }

    // 3. Fallback when network is completely offline
    const fallbackPlace = {
      name: fallbackName || 'Vị trí hiện tại',
      address: '',
      lat,
      lng,
    };
    setSelectedPlace(fallbackPlace);
    setIsReverseGeocoding(false);
    return fallbackPlace;
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
            <div style="background-color: #0D9488; color: white; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.45); border: 2px solid white;">
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

      markerRef.current.on('dragend', async () => {
        const pos = markerRef.current!.getLatLng();
        const place = await reverseGeocode(pos.lat, pos.lng);
        if (place && place.name && !place.name.startsWith('Vị trí (')) {
          isSelectingResultRef.current = true;
          setSearchQuery(place.name);
        }
      });
    }
  }, [reverseGeocode]);

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

    if (cleanName) {
      isSelectingResultRef.current = true;
      setSearchQuery(cleanName);
    }

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
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
      setShowResultsDropdown(false);
      const place = await reverseGeocode(lat, lng);
      if (place && place.name && !place.name.startsWith('Vị trí (')) {
        isSelectingResultRef.current = true;
        setSearchQuery(place.name);
      }
    });

    const timer = setTimeout(async () => {
      map.invalidateSize();

      if (existingCoords) {
        map.setView([existingCoords.lat, existingCoords.lng], 16);
        updateMarker(existingCoords.lat, existingCoords.lng);
        reverseGeocode(existingCoords.lat, existingCoords.lng, cleanName || undefined);
      } else if (cleanName && cleanName.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/locations/search?q=${encodeURIComponent(cleanName)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const top = data[0];
              const lat = typeof top.lat === 'string' ? parseFloat(top.lat) : Number(top.lat);
              const rawLon = top.lon ?? top.lng;
              const lng = typeof rawLon === 'string' ? parseFloat(rawLon) : Number(rawLon);
              const name = top.name || top.display_name?.split(',')?.[0] || cleanName;
              if (!isNaN(lat) && !isNaN(lng)) {
                map.flyTo([lat, lng], 16);
                updateMarker(lat, lng);
                setSelectedPlace({ name, address: top.display_name || name, lat, lng });
              }
            } else {
              updateMarker(defaultLat, defaultLng);
              reverseGeocode(defaultLat, defaultLng);
            }
          } else {
            updateMarker(defaultLat, defaultLng);
            reverseGeocode(defaultLat, defaultLng);
          }
        } catch {
          updateMarker(defaultLat, defaultLng);
          reverseGeocode(defaultLat, defaultLng);
        } finally {
          setIsSearching(false);
          setShowResultsDropdown(false);
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
  }, [isOpen, mounted, initialQuery, updateMarker, reverseGeocode]);

  // 2. Debounced search on user input change — matching "ở ngoài" LocationSearchInput 1:1
  useEffect(() => {
    if (isSelectingResultRef.current) {
      isSelectingResultRef.current = false;
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSearchResults(data);
            setShowResultsDropdown(true);
          } else {
            setSearchResults([]);
            setShowResultsDropdown(false);
          }
        } else {
          setSearchResults([]);
          setShowResultsDropdown(false);
        }
      } catch (err) {
        console.warn('Place search API error:', err);
        setSearchResults([]);
        setShowResultsDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (item: any) => {
    const rawLat = item.lat;
    const rawLon = item.lon ?? item.lng;
    const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : Number(rawLat);
    const lng = typeof rawLon === 'string' ? parseFloat(rawLon) : Number(rawLon);

    const rawName = item.name || item.display_name?.split(',')?.[0] || searchQuery;
    const cleanName = rawName
      .replace(/https?:\/\/[^\s]+/g, '')
      .trim()
      .replace(/\s*[-–—:]+\s*$/g, '')
      .trim();
    const address = item.display_name || cleanName;

    setSelectedPlace({ name: cleanName, address, lat, lng });
    setShowResultsDropdown(false);
    isSelectingResultRef.current = true;
    setSearchQuery(cleanName);

    if (mapRef.current && !isNaN(lat) && !isNaN(lng)) {
      mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
      updateMarker(lat, lng);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    setIsReverseGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
          updateMarker(lat, lng);
          const place = await reverseGeocode(lat, lng);
          if (place && place.name && !place.name.startsWith('Vị trí (')) {
            isSelectingResultRef.current = true;
            setSearchQuery(place.name);
          }
        }
      },
      (err) => {
        setIsReverseGeocoding(false);
        console.warn('Geolocation error:', err);
        alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleConfirm = () => {
    if (!selectedPlace) return;

    // Use clean place name or clean address, NEVER append the google maps link URL
    let cleanLocation = selectedPlace.name || selectedPlace.address;
    if (
      (!cleanLocation ||
        cleanLocation === 'Vị trí đã chọn' ||
        cleanLocation.startsWith('Vị trí (')) &&
      selectedPlace.address &&
      !selectedPlace.address.startsWith('Vị trí (')
    ) {
      cleanLocation = selectedPlace.address;
    }

    if (!cleanLocation || cleanLocation.startsWith('Vị trí (')) {
      cleanLocation = 'Vị trí hiện tại';
    }

    cleanLocation = cleanLocation
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-circle-primary/10 text-circle-sage dark:text-circle-dark-primary">
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

        {/* Search Bar Overlay — styled exactly like "ở ngoài" LocationSearchInput */}
        <div
          ref={searchContainerRef}
          className="relative px-4 pt-3 pb-2.5 z-[1100] bg-circle-canvas/95 dark:bg-circle-dark-canvas/95 backdrop-blur-md border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 shrink-0"
        >
          <div className="relative w-full">
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
                  if (searchResults.length > 0) {
                    handleSelectSearchResult(searchResults[0]);
                  }
                }
              }}
              placeholder="Tìm địa điểm trên bản đồ: Landmark 81, Hồ Con Rùa, SPKT..."
              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface pl-3.5 pr-8 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 focus:outline-hidden focus:ring-1 focus:ring-circle-primary focus:border-circle-primary"
            />
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
              {isSearching && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-circle-slate" />
              )}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResultsDropdown(false);
                  }}
                  className="text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown — EXACT styling as "ở ngoài" */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl overflow-hidden max-h-56 overflow-y-auto z-[1200] animate-in fade-in duration-100">
              <div className="px-3 py-1.5 bg-circle-wash/50 dark:bg-circle-dark-wash/50 border-b border-circle-hairline/40 text-[10px] font-bold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
                Gợi ý địa điểm từ bản đồ
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectSearchResult(item);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSearchResult(item);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-circle-wash dark:hover:bg-circle-dark-wash border-b border-circle-hairline/30 dark:border-circle-dark-hairline/30 last:border-none flex items-start gap-2 transition-colors cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 text-circle-sage dark:text-circle-dark-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                      {item.name || item.display_name?.split(',')?.[0]}
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
        <div className="relative flex-1 w-full bg-circle-canvas dark:bg-circle-dark-canvas overflow-hidden isolate z-0">
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* Mapbox badge */}
          {MAPBOX_TOKEN && (
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm border border-circle-primary/30 text-[10px] font-semibold text-circle-sage dark:text-circle-dark-primary shadow-xs">
                Mapbox
              </span>
            </div>
          )}

          {/* GPS Locate Me Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-sage dark:text-circle-dark-primary shadow-md hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95 cursor-pointer"
            title="Định vị vị trí của tôi"
          >
            <LocateFixed className="h-4 w-4" />
          </button>
        </div>

        {/* Footer Selected Place Info & Confirm */}
        <div className="px-4 py-3 bg-white dark:bg-circle-dark-surface border-t border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            {isReverseGeocoding ? (
              <div className="flex items-center gap-1.5 text-xs text-circle-sage dark:text-circle-dark-primary font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-circle-sage" />
                <span>Đang xác định địa chỉ...</span>
              </div>
            ) : selectedPlace ? (
              <div>
                <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-circle-primary shrink-0" />
                  {selectedPlace.name}
                </p>
                <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate pl-3.5">
                  {selectedPlace.address || selectedPlace.name}
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
              className="rounded-full px-4 h-9 text-xs sm:text-sm font-bold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedPlace || isReverseGeocoding}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 rounded-full bg-circle-primary hover:bg-circle-sage text-white px-4 h-9 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-95 cursor-pointer"
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
