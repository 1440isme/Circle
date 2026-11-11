'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  Map as MapIcon,
  MapPin,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trash2,
  FolderPlus,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useCircleStore } from '@/stores/circle.store';
import { useAlbumsQuery, useAddPhotosMutation } from '@/hooks/use-circle-tools';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useThemeStore } from '@/stores/theme.store';
import { useMyMomentsQuery, useDeleteMomentMutation } from '@/hooks/use-moment-queries';
import { MomentEntity } from '@circle/types';
import { parseMomentPhotos } from '@/lib/moment-photos';
import dynamic from 'next/dynamic';

function DynamicMapLoading() {
  const t = useLanguageStore((s) => s.t);
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text gap-3 select-none">
      <div className="w-8 h-8 rounded-full border-2 border-circle-primary border-t-transparent animate-spin" />
      <p className="text-xs text-circle-slate dark:text-circle-dark-muted">{t.moments.mapLoading}</p>
    </div>
  );
}

const MomentPlacesMap = dynamic(
  () => import('./MomentPlacesMap').then((m) => m.MomentPlacesMap),
  {
    ssr: false,
    loading: () => <DynamicMapLoading />,
  },
);

interface MomentHistoryViewProps {
  onClose?: () => void;
  allCircleMoments?: MomentEntity[];
  viewMode?: 'month' | 'map';
  onViewModeChange?: (mode: 'month' | 'map') => void;
}

interface MomentLocation {
  id: string;
  moment: any;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface MapClusterPin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  thumbUrl: string;
  count: number;
  moments: any[];
}

const VIETNAM_LOCATIONS = [
  { name: 'ĐH Sư Phạm Kỹ Thuật (HCMUTE)', address: 'Thủ Đức, TP. Hồ Chí Minh', lat: 10.8505, lng: 106.7719 },
  { name: 'Phố đi bộ Nguyễn Huệ & Chợ Bến Thành', address: 'Quận 1, TP. Hồ Chí Minh', lat: 10.7745, lng: 106.7035 },
  { name: 'Landmark 81 & Central Park', address: 'Bình Thạnh, TP. Hồ Chí Minh', lat: 10.795, lng: 106.7219 },
  { name: 'Hồ Bán Nguyệt & Cầu Ánh Sao', address: 'Quận 7, TP. Hồ Chí Minh', lat: 10.7292, lng: 106.7196 },
  { name: 'Hồ Xuân Hương & Lâm Viên', address: 'TP. Đà Lạt, Lâm Đồng', lat: 11.9404, lng: 108.4583 },
  { name: 'Bãi Trước & Ngọn Hải Đăng', address: 'TP. Vũng Tàu, Bà Rịa - Vũng Tàu', lat: 10.346, lng: 107.0843 },
  { name: 'Hồ Gươm & Phố Cổ Hà Nội', address: 'Hoàn Kiếm, Hà Nội', lat: 21.0285, lng: 105.8542 },
  { name: 'Phố Cổ Hội An & Sông Hoài', address: 'Hội An, Quảng Nam', lat: 15.8801, lng: 108.338 },
];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function getOsmTileUrl(
  lat: number,
  lng: number,
  zoom: number = 15,
  forceDark?: boolean,
): string {
  const isDark =
    forceDark !== undefined
      ? forceDark
      : typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark');

  if (MAPBOX_TOKEN) {
    const style = isDark ? 'dark-v11' : 'streets-v12';
    return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/pin-s-camera+3b82f6(${lng},${lat})/${lng},${lat},${zoom},0/400x200@2x?access_token=${MAPBOX_TOKEN}`;
  }
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  const cartoStyle = isDark ? 'dark_all' : 'light_all';
  return `https://a.basemaps.cartocdn.com/${cartoStyle}/${zoom}/${x}/${y}@2x.png`;
}

export function resolveMomentLocation(
  m: any,
  fallbackIndex: number = 0,
  forceDark?: boolean,
  fallbackCapturedLabel: string = '',
) {
  if (!m) {
    const p = VIETNAM_LOCATIONS[0]!;
    return {
      id: 'default',
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      staticMapUrl: getOsmTileUrl(p.lat, p.lng, 15, forceDark),
    };
  }

  // 1. Direct persistent DB fields
  if (
    m.latitude != null &&
    m.longitude != null &&
    !isNaN(Number(m.latitude)) &&
    !isNaN(Number(m.longitude))
  ) {
    const lat = Number(m.latitude);
    const lng = Number(m.longitude);
    const name = m.locationName?.trim() || m.address?.trim() || fallbackCapturedLabel;
    const address = m.address?.trim() || m.locationName?.trim() || 'Vietnam';
    return {
      id: m.id || 'loc',
      name,
      address,
      lat,
      lng,
      staticMapUrl: getOsmTileUrl(lat, lng, 15, forceDark),
    };
  }

  // 2. Hash params inside photoUrl
  const rawUrl = m.photoUrl || m.imageUrl || m.mediaUrl || '';
  const latMatch = rawUrl.match(/#lat=([\d.-]+)/);
  const lngMatch = rawUrl.match(/#lng=([\d.-]+)/);
  const locMatch = rawUrl.match(/#loc=([^#]+)/);
  const addrMatch = rawUrl.match(/#addr=([^#]+)/);

  if (latMatch && lngMatch) {
    const lat = parseFloat(latMatch[1]!);
    const lng = parseFloat(lngMatch[1]!);
    const name = locMatch ? decodeURIComponent(locMatch[1]!) : fallbackCapturedLabel;
    const address = addrMatch ? decodeURIComponent(addrMatch[1]!) : 'Vietnam';
    return {
      id: m.id || 'loc',
      name,
      address,
      lat,
      lng,
      staticMapUrl: getOsmTileUrl(lat, lng, 15, forceDark),
    };
  }

  const p = VIETNAM_LOCATIONS[fallbackIndex % VIETNAM_LOCATIONS.length]!;
  return {
    id: m.id || `loc-${fallbackIndex}`,
    name: m.locationName || p.name,
    address: m.address || p.address,
    lat: p.lat,
    lng: p.lng,
    staticMapUrl: getOsmTileUrl(p.lat, p.lng, 15, forceDark),
  };
}

function normalizeMoment(raw: any) {
  if (!raw) return null;
  const it = raw.data || raw;
  const id = it.id || raw.id || 'moment-' + Math.random();
  const photoUrl = it.photoUrl || it.imageUrl || it.mediaUrl || it.url || it.image || raw.photoUrl || raw.imageUrl || '';
  if (!photoUrl) return null;

  const rawDate = it.createdAt || it.capturedAt || it.created_at || raw.createdAt || raw.capturedAt;
  const dateObj = rawDate ? new Date(rawDate) : new Date();
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const { mainUrl, pipUrl, cornerIndex } = parseMomentPhotos(photoUrl);

  return {
    ...it,
    id,
    photoUrl,
    mainUrl,
    pipUrl,
    cornerIndex,
    dateObj: validDate,
    createdAt: validDate.toISOString(),
    caption: it.caption || '',
    reactions: it.reactions || [],
  };
}

export const MomentHistoryView: React.FC<MomentHistoryViewProps> = ({
  onClose,
  allCircleMoments = [],
  viewMode: controlledViewMode,
  onViewModeChange,
}) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isVi = locale === 'vi';
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const [internalViewMode, setInternalViewMode] = useState<'month' | 'map'>('month');
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;

  const [selectedDayMoments, setSelectedDayMoments] = useState<any[] | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [activeCluster, setActiveCluster] = useState<MapClusterPin | null>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [lightboxSwapped, setLightboxSwapped] = useState<boolean>(false);
  const [confirmDeleteLightbox, setConfirmDeleteLightbox] = useState<boolean>(false);
  const [lightboxError, setLightboxError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: myServerMoments = [] } = useMyMomentsQuery();
  const deleteMomentMutation = useDeleteMomentMutation();

  // Combine and deduplicate moments authored by the account owner or visible in circle
  const myMoments = useMemo(() => {
    const rawList: any[] = [];

    if (Array.isArray(myServerMoments) && myServerMoments.length > 0) {
      rawList.push(...myServerMoments);
    }

    if (Array.isArray(allCircleMoments) && allCircleMoments.length > 0) {
      rawList.push(...allCircleMoments);
    }

    // Hidden moments from local storage
    let hiddenIds: string[] = [];
    try {
      const stored = localStorage.getItem('circle_hidden_moments');
      if (stored) hiddenIds = JSON.parse(stored);
    } catch {}

    const map = new Map<string, any>();
    for (const item of rawList) {
      if (item?.id && hiddenIds.includes(item.id)) continue;
      const norm = normalizeMoment(item);
      if (norm && norm.mainUrl) {
        map.set(norm.id, norm);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.dateObj.getTime() - a.dateObj.getTime(),
    );
  }, [myServerMoments, allCircleMoments]);

  // Global set of dates (YYYY-MM-DD) that have moments
  const allActiveDateKeys = useMemo(() => {
    const set = new Set<string>();
    myMoments.forEach((m) => {
      const d = m.dateObj;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      set.add(k);
    });
    return set;
  }, [myMoments]);

  // STREAK: Calculate consecutive streak ending at newest moment
  const latestStreakKeysSet = useMemo(() => {
    if (allActiveDateKeys.size === 0) return new Set<string>();

    const sortedDescDates = Array.from(allActiveDateKeys).sort((a, b) => b.localeCompare(a));
    const newestDateKey = sortedDescDates[0]!;

    const [yStr, mStr, dStr] = newestDateKey.split('-');
    let curr = new Date(parseInt(yStr!, 10), parseInt(mStr!, 10) - 1, parseInt(dStr!, 10));

    const streakKeys = [newestDateKey];

    while (true) {
      curr.setDate(curr.getDate() - 1);
      const prevKey = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      if (allActiveDateKeys.has(prevKey)) {
        streakKeys.push(prevKey);
      } else {
        break;
      }
    }

    if (streakKeys.length >= 2) {
      return new Set<string>(streakKeys);
    }

    return new Set<string>();
  }, [allActiveDateKeys]);

  // Group moments by Month & Year with Calendar calculation & Streak detection
  const monthlyCalendars = useMemo(() => {
    const monthKeysSet = new Set<string>();

    const now = new Date();
    monthKeysSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    myMoments.forEach((m) => {
      const d = m.dateObj;
      monthKeysSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });

    const sortedMonthKeys = Array.from(monthKeysSet).sort((a, b) => b.localeCompare(a));

    return sortedMonthKeys.map((key) => {
      const [yStr, mStr] = key.split('-');
      const year = parseInt(yStr!, 10);
      const month = parseInt(mStr!, 10);
      const label = t.moments.monthYearFormat
        .replace('{month}', String(month))
        .replace('{year}', String(year));

      const totalDays = new Date(year, month, 0).getDate();
      // Monday = index 0
      const startDayIndex = (new Date(year, month - 1, 1).getDay() + 6) % 7;

      const monthMoments = myMoments.filter((m) => {
        const d = m.dateObj;
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      const days = [];
      let daysWithPhotosCount = 0;

      for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
        const dayMoments = monthMoments
          .filter((m) => m.dateObj.getDate() === dayNum)
          .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

        const hasPhotos = dayMoments.length > 0;
        if (hasPhotos) {
          daysWithPhotosCount++;
        }

        const nextDateObj = new Date(year, month - 1, dayNum + 1);
        const currentKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const nextKey = `${nextDateObj.getFullYear()}-${String(nextDateObj.getMonth() + 1).padStart(2, '0')}-${String(nextDateObj.getDate()).padStart(2, '0')}`;

        const isPartOfStreak = hasPhotos && latestStreakKeysSet.has(currentKey);
        const connectsRight = hasPhotos && latestStreakKeysSet.has(currentKey) && latestStreakKeysSet.has(nextKey);

        days.push({
          day: dayNum,
          moments: dayMoments,
          isPartOfStreak,
          connectsRight,
        });
      }

      return {
        key,
        year,
        month,
        label,
        totalPhotos: monthMoments.length,
        daysWithPhotosCount,
        startDayIndex,
        days,
        moments: monthMoments,
      };
    });
  }, [myMoments, latestStreakKeysSet, t.moments.monthYearFormat]);

  // Assign location coordinates to moments
  const momentsWithLocations: MomentLocation[] = useMemo(() => {
    return myMoments.map((m, index) => {
      const loc = resolveMomentLocation(m, index, isDark, t.moments.capturedLocation);
      return {
        id: m.id,
        moment: m,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
      };
    });
  }, [myMoments, isDark, t.moments.capturedLocation]);

  // Filtered moments on map by month
  const mapFilteredLocations = useMemo(() => {
    if (selectedMonthFilter === 'all') return momentsWithLocations;
    return momentsWithLocations.filter((item) => {
      const d = new Date(item.moment.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonthFilter;
    });
  }, [momentsWithLocations, selectedMonthFilter]);

  // Group moments into location clusters for map view
  const clusters = useMemo<MapClusterPin[]>(() => {
    const map = new Map<string, MapClusterPin>();
    mapFilteredLocations.forEach((item) => {
      const key = `${item.name}-${item.lat.toFixed(3)}-${item.lng.toFixed(3)}`;
      const rawSrc =
        item.moment.mainUrl ||
        item.moment.photoUrl ||
        (item.moment as any)?.imageUrl ||
        (item.moment as any)?.mediaUrl ||
        '';
      const { mainUrl } = parseMomentPhotos(rawSrc);
      const finalThumb = item.moment.mainUrl || mainUrl || rawSrc;

      if (!map.has(key)) {
        map.set(key, {
          id: item.id,
          name: item.name,
          address: item.address,
          lat: item.lat,
          lng: item.lng,
          thumbUrl: finalThumb,
          count: 1,
          moments: [item.moment],
        });
      } else {
        const existing = map.get(key)!;
        existing.count += 1;
        existing.moments.push(item.moment);
      }
    });
    return Array.from(map.values());
  }, [mapFilteredLocations]);

  // Fallback demo clusters if no geotagged moments yet
  const effectiveClusters = useMemo<MapClusterPin[]>(() => {
    if (clusters.length > 0) return clusters;
    return [
      {
        id: 'cluster-hcmute',
        name: 'ĐH Sư Phạm Kỹ Thuật (HCMUTE)',
        address: '1 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
        lat: 10.8505,
        lng: 106.7719,
        thumbUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300',
        count: 3,
        moments: [
          {
            id: 'demo-moment-1',
            photoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
            caption: 'Khuôn viên trường ĐH Sư Phạm Kỹ Thuật TP.HCM ✨',
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'cluster-q1',
        name: 'Phố đi bộ Nguyễn Huệ & Chợ Bến Thành',
        address: 'Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        lat: 10.7745,
        lng: 106.7035,
        thumbUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300',
        count: 2,
        moments: [
          {
            id: 'demo-moment-2',
            photoUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
            caption: 'Dạo phố đi bộ Sài Gòn cuối tuần 🌆',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'cluster-dalat',
        name: 'Hồ Xuân Hương & Lâm Viên',
        address: 'Phường 10, TP. Đà Lạt, Lâm Đồng',
        lat: 11.9404,
        lng: 108.4583,
        thumbUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300',
        count: 4,
        moments: [
          {
            id: 'demo-moment-3',
            photoUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
            caption: 'Không khí se lạnh và hoa Đà Lạt nở rộ 🌸',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ],
      },
      {
        id: 'cluster-landmark',
        name: 'Landmark 81 & Central Park',
        address: '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP. Hồ Chí Minh',
        lat: 10.795,
        lng: 106.7219,
        thumbUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
        count: 1,
        moments: [
          {
            id: 'demo-moment-4',
            photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
            caption: 'Hoàng hôn bên sông Sài Gòn 🌅',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
          },
        ],
      },
    ];
  }, [clusters]);

  // Handle keyboard navigation in Lightbox
  useEffect(() => {
    if (!selectedDayMoments) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDeleteLightbox) {
          setConfirmDeleteLightbox(false);
        } else {
          setLightboxError(null);
          setSelectedDayMoments(null);
        }
      } else if (e.key === 'ArrowLeft') {
        setLightboxSwapped(false);
        setConfirmDeleteLightbox(false);
        setLightboxError(null);
        setActivePhotoIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowRight') {
        setLightboxSwapped(false);
        setConfirmDeleteLightbox(false);
        setLightboxError(null);
        setActivePhotoIndex((prev) => Math.min(prev + 1, selectedDayMoments.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDayMoments, confirmDeleteLightbox]);

  const handleConfirmDeleteCurrentLightboxMoment = async () => {
    if (!selectedDayMoments || selectedDayMoments.length === 0) return;
    const currentMoment = selectedDayMoments[activePhotoIndex];
    if (!currentMoment || currentMoment.id === 'captured-today') return;

    const isOwn =
      currentMoment.authorId === user?.id ||
      currentMoment.author?.id === user?.id ||
      currentMoment.userId === user?.id;

    setLightboxError(null);
    if (isOwn) {
      try {
        await deleteMomentMutation.mutateAsync(currentMoment.id);
        setConfirmDeleteLightbox(false);
        setSelectedDayMoments(null);
      } catch (err: any) {
        setLightboxError(err?.message || t.moments.deleteMomentError);
      }
    } else {
      try {
        const stored = localStorage.getItem('circle_hidden_moments');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(currentMoment.id)) {
          list.push(currentMoment.id);
          localStorage.setItem('circle_hidden_moments', JSON.stringify(list));
        }
      } catch {}
      setConfirmDeleteLightbox(false);
      setSelectedDayMoments(null);
    }
  };

  const weekdays = [
    t.moments.weekdayMon,
    t.moments.weekdayTue,
    t.moments.weekdayWed,
    t.moments.weekdayThu,
    t.moments.weekdayFri,
    t.moments.weekdaySat,
    t.moments.weekdaySun,
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-circle-canvas dark:bg-circle-dark-canvas relative overflow-hidden select-none">
      {/* Top Header Toolbar (clears fixed Header on mobile/tablet) */}
      <header className="w-full shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 pt-14 pb-3 lg:py-3 border-b border-circle-hairline dark:border-circle-dark-hairline frosted-glass z-20">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-2 truncate">
            <span className="truncate">{t.moments.myMomentsTitle}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-circle-primary/15 text-circle-sage dark:text-circle-dark-primary font-bold shrink-0">
              {myMoments.length}
            </span>
          </h2>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted hidden sm:block truncate">
            {t.moments.archiveSubtitle}
          </p>
        </div>

        {/* Switcher Tabs: Lịch tháng vs Bản đồ */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-circle-wash dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas shadow-sm'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{t.moments.calendarMode}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas shadow-sm'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>{t.moments.placesMode}</span>
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-white transition-colors"
              title={t.moments.backToFeed}
              aria-label={t.moments.backToFeed}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
          MODE 1: THEO THÁNG (CALENDAR GRID VỚI CHUỖI STREAK VÀ HIỆU ỨNG THẺ DÀY)
         ========================================================================= */}
      {viewMode === 'month' && (
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col items-center">
          <div className="w-full max-w-2xl space-y-8 pb-20">
            {monthlyCalendars.map((cal) => (
              <div
                key={cal.key}
                className="bg-white dark:bg-circle-dark-surface rounded-3xl p-5 sm:p-6 border border-circle-hairline dark:border-circle-dark-hairline shadow-sm"
              >
                {/* Month Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
                      {cal.label}
                    </h3>
                    <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                      {cal.daysWithPhotosCount} {t.moments.activeDaysUnit} • {cal.totalPhotos} {t.moments.momentsUnit}
                    </p>
                  </div>
                  <div className="text-xs px-2.5 py-1 rounded-full font-bold bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline dark:border-circle-dark-hairline">
                    {cal.totalPhotos} {t.moments.photosUnit}
                  </div>
                </div>

                {/* 7-Column Weekday Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekdays.map((wd, wIdx) => (
                    <div
                      key={wIdx}
                      className={`text-center text-[11px] font-bold ${
                        wIdx === 6
                          ? 'text-circle-sage dark:text-circle-dark-primary'
                          : 'text-circle-slate/70 dark:text-circle-dark-muted/70'
                      }`}
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* 7-Column Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty padding cells for start of month */}
                  {Array.from({ length: cal.startDayIndex }).map((_, padIdx) => (
                    <div key={`pad-${padIdx}`} className="aspect-square" />
                  ))}

                  {/* Actual Month Days */}
                  {cal.days.map((dayItem) => {
                    const hasPhotos = dayItem.moments.length > 0;
                    const latestPhoto = hasPhotos ? dayItem.moments[0] : null;
                    const mainUrl = latestPhoto?.mainUrl;
                    const isMultiple = dayItem.moments.length > 1;
                    const isPartOfStreak = Boolean(dayItem.isPartOfStreak);

                    if (!hasPhotos) {
                      return (
                        <div
                          key={`day-${dayItem.day}`}
                          className="aspect-square rounded-2xl flex flex-col items-center justify-center p-1 border border-circle-hairline/60 dark:border-circle-dark-hairline/60 bg-circle-canvas/30 dark:bg-circle-dark-canvas/30 text-circle-slate/50 dark:text-circle-dark-muted/50"
                        >
                          <span className="text-xs font-semibold">{dayItem.day}</span>
                          <span className="w-1 h-1 rounded-full bg-circle-hairline dark:bg-circle-dark-hairline mt-1" />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`day-${dayItem.day}`}
                        className="relative aspect-square group"
                      >
                        {/* Streak connector bridge to the right cell */}
                        {dayItem.connectsRight && (cal.startDayIndex + dayItem.day - 1) % 7 !== 6 && (
                          <div
                            className="absolute top-1/2 -right-2.5 w-3 h-1 -translate-y-1/2 bg-emerald-500 z-10 pointer-events-none"
                            style={{ borderRadius: '2px' }}
                          />
                        )}

                        {/* Foreground Top Photo Thumbnail */}
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxSwapped(false);
                            setConfirmDeleteLightbox(false);
                            setLightboxError(null);
                            setActivePhotoIndex(0);
                            setSelectedDayMoments(dayItem.moments);
                          }}
                          className={`relative w-full h-full rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-95 hover:scale-105 shadow-sm ${
                            isPartOfStreak
                              ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-circle-dark-surface'
                              : 'border border-circle-hairline dark:border-circle-dark-hairline'
                          }`}
                        >
                          {mainUrl ? (
                            <img
                              src={mainUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-circle-wash dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}

                          {/* Streak Flame Indicator at Top Left */}
                          {isPartOfStreak && (
                            <div className="absolute top-1 left-1 p-0.5 rounded-full bg-circle-primary text-circle-charcoal shadow-xs">
                              <Flame className="h-2.5 w-2.5 fill-circle-charcoal" />
                            </div>
                          )}

                          {/* Multiple Photos Badge */}
                          {isMultiple && (
                            <div className="absolute top-1 right-1 px-1 py-0.5 rounded-md bg-black/75 text-[9px] font-extrabold text-white leading-none">
                              +{dayItem.moments.length}
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Basic Summary Row at bottom */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text text-xs font-bold shadow-xs">
                <ImageIcon className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary" />
                <span>{myMoments.length} {t.moments.momentsUnit}</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text text-xs font-bold shadow-xs">
                <Flame className={`h-4 w-4 ${latestStreakKeysSet.size >= 2 ? 'text-rose-500 fill-rose-500' : 'text-circle-slate dark:text-circle-dark-muted'}`} />
                <span>{latestStreakKeysSet.size} {t.moments.daysStreakUnit}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: BẢN ĐỒ ALBUM TƯƠNG TÁC (PLACES MAP)
         ========================================================================= */}
      {viewMode === 'map' && (
        <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden">
          {/* Top Month Filter Strip */}
          <div className="w-full shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-circle-hairline dark:border-circle-dark-hairline frosted-glass overflow-x-auto custom-scrollbar z-10">
            <button
              type="button"
              onClick={() => setSelectedMonthFilter('all')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedMonthFilter === 'all'
                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas shadow-xs'
                  : 'bg-circle-wash dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              {t.common.all} ({momentsWithLocations.length})
            </button>

            {monthlyCalendars.map((cal) => (
              <button
                key={cal.key}
                type="button"
                onClick={() => setSelectedMonthFilter(cal.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedMonthFilter === cal.key
                    ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-dark-canvas shadow-xs'
                    : 'bg-circle-wash dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
                }`}
              >
                {cal.label} ({cal.totalPhotos})
              </button>
            ))}
          </div>

          {/* Native Leaflet Map */}
          <div className="flex-1 w-full min-h-[480px] h-full relative overflow-hidden" style={{ minHeight: '480px', height: '100%' }}>
            <MomentPlacesMap
              clusters={effectiveClusters}
              selectedCluster={activeCluster}
              onSelectCluster={setActiveCluster}
              onViewClusterMoments={(clusterMoments) => {
                setLightboxSwapped(false);
                setConfirmDeleteLightbox(false);
                setLightboxError(null);
                setActivePhotoIndex(0);
                setSelectedDayMoments(clusterMoments);
              }}
              locale={locale}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          FULL-SCREEN PHOTO DETAIL LIGHTBOX MODAL
         ========================================================================= */}
      {selectedDayMoments && selectedDayMoments.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => {
            setConfirmDeleteLightbox(false);
            setLightboxError(null);
            setSelectedDayMoments(null);
          }}
        >
          <div
            className="relative w-full max-w-md flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div className="w-full flex items-center justify-between text-white pb-3 gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {new Date(selectedDayMoments[activePhotoIndex]!.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {selectedDayMoments.length > 1 && (
                  <p className="text-xs text-white/70">
                    {t.moments.photoCounterLabel} {activePhotoIndex + 1} / {selectedDayMoments.length}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedDayMoments[activePhotoIndex]?.id !== 'captured-today' && !confirmDeleteLightbox && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteLightbox(true)}
                    className="p-2 rounded-full bg-white/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                    title={t.moments.deleteTitle}
                    aria-label={t.moments.deleteTitle}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteLightbox(false);
                    setLightboxError(null);
                    setSelectedDayMoments(null);
                  }}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title={t.common.close}
                  aria-label={t.common.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Inline Delete / Hide Confirmation Strip */}
            {confirmDeleteLightbox && (() => {
              const currentMoment = selectedDayMoments[activePhotoIndex]!;
              const isOwn =
                currentMoment.authorId === user?.id ||
                currentMoment.author?.id === user?.id ||
                currentMoment.userId === user?.id;

              return (
                <div className="w-full mb-3 flex items-center justify-between gap-2 rounded-2xl bg-rose-500/20 border border-rose-400/40 px-3.5 py-2 text-xs text-rose-100">
                  <span className="min-w-0 flex-1">
                    {isOwn ? t.moments.deleteForeverConfirm : t.moments.hideMomentConfirm}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleConfirmDeleteCurrentLightboxMoment}
                      disabled={deleteMomentMutation.isPending}
                      className="rounded-full bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 font-bold transition-colors"
                    >
                      {t.common.confirm}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteLightbox(false)}
                      className="rounded-full bg-white/10 hover:bg-white/20 text-white px-3 py-1 font-semibold transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              );
            })()}

            {lightboxError && (
              <div className="w-full mb-3 flex items-center justify-between gap-2 rounded-2xl bg-rose-500/20 border border-rose-400/40 px-3.5 py-2 text-xs text-rose-200">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{lightboxError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxError(null)}
                  aria-label={t.common.dismiss}
                  className="p-0.5 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Media Container 1:1 Square Card */}
            {(() => {
              const currentMoment = selectedDayMoments[activePhotoIndex]!;
              const { mainUrl, pipUrl } = parseMomentPhotos(currentMoment.photoUrl);
              const displayMain = lightboxSwapped ? pipUrl || mainUrl : mainUrl;
              const displayPip = lightboxSwapped ? mainUrl : pipUrl;
              const locInfo = resolveMomentLocation(
                currentMoment,
                activePhotoIndex,
                isDark,
                t.moments.capturedLocation,
              );

              return (
                <div className="w-full flex flex-col items-center space-y-3">
                  <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10">
                    <img
                      src={displayMain}
                      alt=""
                      className="w-full h-full object-cover"
                    />

                    {/* Dual PiP Floating Window */}
                    {displayPip && (
                      <button
                        type="button"
                        onClick={() => setLightboxSwapped(!lightboxSwapped)}
                        className="absolute bottom-4 right-4 w-[28%] h-[28%] min-w-[80px] aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-transform z-20"
                        title={t.moments.swapPhotoTitle}
                        aria-label={t.moments.swapPhotoTitle}
                      >
                        <img
                          src={displayPip}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}

                    {/* Caption Overlay */}
                    {currentMoment.caption && (
                      <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
                        <div className="inline-block px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium max-w-[85%] break-words">
                          {currentMoment.caption}
                        </div>
                      </div>
                    )}

                    {/* Navigation Arrows if Day has Multiple Photos */}
                    {selectedDayMoments.length > 1 && (
                      <>
                        {activePhotoIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxSwapped(false);
                              setConfirmDeleteLightbox(false);
                              setLightboxError(null);
                              setActivePhotoIndex((prev) => Math.max(prev - 1, 0));
                            }}
                            aria-label={t.moments.prevStory}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-sm transition-colors z-20"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                        )}

                        {activePhotoIndex < selectedDayMoments.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxSwapped(false);
                              setConfirmDeleteLightbox(false);
                              setLightboxError(null);
                              setActivePhotoIndex((prev) => Math.min(prev + 1, selectedDayMoments.length - 1));
                            }}
                            aria-label={t.moments.nextStory}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-sm transition-colors z-20"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Location Card at Bottom of Media */}
                  <div className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white">
                    <img
                      src={locInfo.staticMapUrl}
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover shrink-0 border border-white/20"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                        <MapPin className="h-3.5 w-3.5 text-circle-dark-primary shrink-0" />
                        <span className="truncate">{locInfo.name}</span>
                      </div>
                      <p className="text-[11px] text-white/70 truncate mt-0.5">
                        {locInfo.address}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
