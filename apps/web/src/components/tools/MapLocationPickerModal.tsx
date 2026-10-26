'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, X, LocateFixed, Check, Loader2 } from 'lucide-react';

export interface SelectedLocationData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  formattedLocation: string; // e.g. "Landmark 81 - https://www.google.com/maps/search/?api=1&query=..."
}

interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: SelectedLocationData) => void;
  initialQuery?: string;
}

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialQuery = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
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

  // Helper to reverse geocode coordinates using OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CircleApp/1.0 (dev@circle.local)',
            'Accept-Language': 'vi,en;q=0.9',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const displayName = data.display_name || '';
        const name = data.name || displayName.split(',')[0] || 'Vị trí đã chọn';
        const address = displayName;
        setSelectedPlace({ name, address, lat, lng });
      } else {
        setSelectedPlace({
          name: `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          address: '',
          lat,
          lng,
        });
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      setSelectedPlace({
        name: `Vị trí (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
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

  // 1. Initialize Map
  useEffect(() => {
    if (!isOpen) return;

    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }
    container.innerHTML = '';

    // Default center: Ho Chi Minh City (HCMUTE / Landmark area)
    const initialLat = 10.7958;
    const initialLng = 106.7225;

    const map = L.map(container, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    // ArcGIS Online World Street Map (high-speed, clean tiles, free)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Esri',
      }
    ).addTo(map);

    mapRef.current = map;

    // Handle map clicks to place/move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
      reverseGeocode(lat, lng);
    });

    // Invalidate map size after container animation
    const timer = setTimeout(() => {
      map.invalidateSize();
      updateMarker(initialLat, initialLng);
      reverseGeocode(initialLat, initialLng);
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, updateMarker, reverseGeocode]);

  // 2. Search places with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Priority query to Nominatim with countrycodes=vn
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=vn&limit=5&addressdetails=1`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'CircleApp/1.0 (dev@circle.local)',
            'Accept-Language': 'vi,en;q=0.9',
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSearchResults(data);
            setShowResultsDropdown(true);
          } else {
            // Fallback to Photon
            const pRes = await fetch(
              `https://photon.komoot.io/api/?q=${encodeURIComponent(
                searchQuery
              )}&lat=10.7769&lon=106.7009&limit=5`
            );
            if (pRes.ok) {
              const pData = await pRes.json();
              const mapped = (pData.features || []).map((f: any) => ({
                name: f.properties.name || f.properties.street || searchQuery,
                display_name: [
                  f.properties.name,
                  f.properties.street,
                  f.properties.district,
                  f.properties.city,
                ]
                  .filter(Boolean)
                  .join(', '),
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
              }));
              setSearchResults(mapped);
              setShowResultsDropdown(mapped.length > 0);
            }
          }
        }
      } catch (err) {
        console.warn('Place search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

    // Generate Google Maps URL
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-2xl h-[560px] rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl overflow-hidden">
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
                Gõ tìm kiếm hoặc bấm trực tiếp lên bản đồ để gắn vị trí
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar Overlay */}
        <div className="relative px-4 pt-3 pb-2 z-20 bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 backdrop-blur-md border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-circle-slate" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm: Đại học Sư phạm Kỹ thuật, Landmark 81, Hồ Con Rùa..."
              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface pl-9 pr-9 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/70 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-2.5 h-3.5 w-3.5 animate-spin text-circle-slate" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-circle-slate hover:text-circle-charcoal"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-xl overflow-hidden max-h-56 overflow-y-auto z-30">
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
            className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text shadow-md hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95"
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
                Chạm vào bản đồ để chọn địa điểm
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedPlace || isReverseGeocoding}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Chọn địa điểm này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
