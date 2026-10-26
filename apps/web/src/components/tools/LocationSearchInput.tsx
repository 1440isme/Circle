'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Map, X, Loader2 } from 'lucide-react';
import type { SelectedLocationData } from './MapLocationPickerModal';

const MapLocationPickerModal = dynamic(
  () => import('./MapLocationPickerModal').then((m) => m.MapLocationPickerModal),
  { ssr: false }
);

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Tìm địa điểm trên bản đồ hoặc dán link Google Meet / Google Maps...',
}) => {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search on input change
  useEffect(() => {
    const trimmed = value.trim();

    // Do not search if it's already a URL, empty, or too short
    if (
      !trimmed ||
      trimmed.length < 2 ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('meet.google.com') ||
      trimmed.includes('google.com/maps')
    ) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.warn('Location query error:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelectSuggestion = (item: any) => {
    const name = item.name || item.display_name?.split(',')?.[0] || 'Địa điểm';
    const lat = item.lat;
    const lon = item.lon;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    onChange(`${name} - ${mapUrl}`);
    setShowSuggestions(false);
  };

  const handleSelectFromMap = (data: SelectedLocationData) => {
    onChange(data.formattedLocation);
  };

  return (
    <div ref={wrapperRef} className="space-y-1.5 relative w-full">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas pl-3.5 pr-8 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
          />
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
            {isSearching && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-circle-slate" />
            )}
            {value && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Button to open interactive Leaflet Map Picker */}
        <button
          type="button"
          onClick={() => setIsMapModalOpen(true)}
          className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all shrink-0 active:scale-95 shadow-2xs cursor-pointer"
          title="Mở bản đồ tìm kiếm và ghim vị trí"
        >
          <Map className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Bản đồ</span>
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-16 top-full mt-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl overflow-hidden max-h-56 overflow-y-auto z-50 animate-in fade-in duration-100">
          <div className="px-3 py-1.5 bg-circle-wash/50 dark:bg-circle-dark-wash/50 border-b border-circle-hairline/40 text-[10px] font-bold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
            Gợi ý địa điểm từ bản đồ
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full text-left px-3 py-2 hover:bg-circle-wash dark:hover:bg-circle-dark-wash border-b border-circle-hairline/30 dark:border-circle-dark-hairline/30 last:border-none flex items-start gap-2 transition-colors cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
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

      {/* Leaflet Map Picker Modal (dynamically loaded on client) */}
      {isMapModalOpen && (
        <MapLocationPickerModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          onSelect={handleSelectFromMap}
          initialQuery={value}
        />
      )}
    </div>
  );
};
