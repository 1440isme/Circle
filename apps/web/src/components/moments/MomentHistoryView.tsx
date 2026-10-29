'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Calendar,
  Map as MapIcon,
  MapPin,
  LocateFixed,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useMyMomentsQuery, useDeleteMomentMutation } from '@/hooks/use-moment-queries';
import { MomentEntity } from '@circle/types';
import { parseMomentPhotos } from '@/lib/moment-photos';
import dynamic from 'next/dynamic';

const MomentPlacesMap = dynamic(
  () => import('./MomentPlacesMap').then((m) => m.MomentPlacesMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900 text-white gap-3 select-none">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-xs text-white/70">Đang tải bản đồ...</p>
      </div>
    ),
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

const WEEKDAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function getOsmTileUrl(lat: number, lng: number, zoom: number = 15): string {
  if (MAPBOX_TOKEN) {
    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');
    const style = isDark ? 'dark-v11' : 'streets-v12';
    return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/pin-s-camera+3b82f6(${lng},${lat})/${lng},${lat},${zoom},0/400x200@2x?access_token=${MAPBOX_TOKEN}`;
  }
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${y}/${x}`;
}

export function resolveMomentLocation(m: any, fallbackIndex: number = 0) {
  if (!m) {
    const p = VIETNAM_LOCATIONS[0]!;
    return {
      id: 'default',
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      staticMapUrl: getOsmTileUrl(p.lat, p.lng, 15),
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
    const name = m.locationName?.trim() || m.address?.trim() || 'Vị trí đã chụp';
    const address = m.address?.trim() || m.locationName?.trim() || 'Việt Nam';
    return {
      id: m.id || 'loc',
      name,
      address,
      lat,
      lng,
      staticMapUrl: getOsmTileUrl(lat, lng, 15),
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
    const name = locMatch ? decodeURIComponent(locMatch[1]!) : 'Vị trí đã chụp';
    const address = addrMatch ? decodeURIComponent(addrMatch[1]!) : 'Việt Nam';
    return {
      id: m.id || 'loc',
      name,
      address,
      lat,
      lng,
      staticMapUrl: getOsmTileUrl(lat, lng, 15),
    };
  }

  const p = VIETNAM_LOCATIONS[fallbackIndex % VIETNAM_LOCATIONS.length]!;
  return {
    id: m.id || `loc-${fallbackIndex}`,
    name: m.locationName || p.name,
    address: m.address || p.address,
    lat: p.lat,
    lng: p.lng,
    staticMapUrl: getOsmTileUrl(p.lat, p.lng, 15),
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
  const locale = useLanguageStore((s) => s.locale);
  const isVi = locale === 'vi';

  const [internalViewMode, setInternalViewMode] = useState<'month' | 'map'>('month');
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;

  const [selectedDayMoments, setSelectedDayMoments] = useState<any[] | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [activeCluster, setActiveCluster] = useState<MapClusterPin | null>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [lightboxSwapped, setLightboxSwapped] = useState<boolean>(false);

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
      const label = isVi ? `Tháng ${month}, ${year}` : `Month ${month}, ${year}`;

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
  }, [myMoments, latestStreakKeysSet, isVi]);

  // Assign location coordinates to moments
  const momentsWithLocations: MomentLocation[] = useMemo(() => {
    return myMoments.map((m, index) => {
      const loc = resolveMomentLocation(m, index);
      return {
        id: m.id,
        moment: m,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
      };
    });
  }, [myMoments]);

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
        setSelectedDayMoments(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxSwapped(false);
        setActivePhotoIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowRight') {
        setLightboxSwapped(false);
        setActivePhotoIndex((prev) => Math.min(prev + 1, selectedDayMoments.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDayMoments]);

  const handleDeleteCurrentLightboxMoment = async () => {
    if (!selectedDayMoments || selectedDayMoments.length === 0) return;
    const currentMoment = selectedDayMoments[activePhotoIndex];
    if (!currentMoment || currentMoment.id === 'captured-today') return;

    const isOwn =
      currentMoment.authorId === user?.id ||
      currentMoment.author?.id === user?.id ||
      currentMoment.userId === user?.id;

    if (isOwn) {
      const confirmDelete = window.confirm(
        isVi
          ? 'Xoá vĩnh viễn khoảnh khắc này khỏi Circle? Bạn bè sẽ không thể xem lại nữa.'
          : 'Delete this moment permanently from Circle?',
      );
      if (!confirmDelete) return;

      try {
        await deleteMomentMutation.mutateAsync(currentMoment.id);
        setSelectedDayMoments(null);
      } catch (err: any) {
        alert(err?.message || 'Không thể xoá khoảnh khắc');
      }
    } else {
      const confirmHide = window.confirm(
        isVi
          ? 'Ẩn khoảnh khắc này khỏi trang của bạn? Bạn bè trong Vòng tròn vẫn xem được bình thường.'
          : 'Hide this moment from your view?',
      );
      if (!confirmHide) return;

      try {
        const stored = localStorage.getItem('circle_hidden_moments');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(currentMoment.id)) {
          list.push(currentMoment.id);
          localStorage.setItem('circle_hidden_moments', JSON.stringify(list));
        }
      } catch {}
      setSelectedDayMoments(null);
    }
  };

  const weekdays = isVi ? WEEKDAYS_VI : WEEKDAYS_EN;

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-circle-canvas dark:bg-circle-dark-canvas relative overflow-hidden select-none">
      {/* Top Header Toolbar */}
      <header className="w-full shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 backdrop-blur-md z-20">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-2">
            <span>{isVi ? 'Khoảnh khắc của tôi' : 'My Moments'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-circle-primary/10 text-circle-primary font-bold">
              {myMoments.length}
            </span>
          </h2>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted hidden sm:block">
            {isVi ? 'Lưu trữ kỉ niệm & địa điểm đã ghi lại' : 'Archive of moments and places captured'}
          </p>
        </div>

        {/* Switcher Tabs: Lịch tháng vs Bản đồ */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-circle-wash dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-sm'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{isVi ? 'Lịch tháng' : 'Calendar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-sm'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>{isVi ? 'Bản đồ' : 'Places'}</span>
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-white transition-colors"
              title={isVi ? 'Quay lại Bảng tin' : 'Back to Feed'}
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
                      {cal.daysWithPhotosCount} {isVi ? 'ngày chụp' : 'active days'} • {cal.totalPhotos} {isVi ? 'khoảnh khắc' : 'moments'}
                    </p>
                  </div>
                  <div className="text-xs px-2.5 py-1 rounded-full font-bold bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline dark:border-circle-dark-hairline">
                    {cal.totalPhotos} {isVi ? 'ảnh' : 'photos'}
                  </div>
                </div>

                {/* 7-Column Weekday Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekdays.map((wd, wIdx) => (
                    <div
                      key={wIdx}
                      className={`text-center text-[11px] font-bold ${
                        wIdx === 6
                          ? 'text-circle-primary'
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

                    // Day WITH photo(s) - nằm vừa khung giống ảnh đơn, không ghi ngày ở góc
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
                            <div className="w-full h-full flex items-center justify-center bg-circle-wash dark:bg-circle-dark-canvas text-circle-slate">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}

                          {/* Streak Flame Indicator at Top Left */}
                          {isPartOfStreak && (
                            <div className="absolute top-1 left-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                              <Flame className="h-2.5 w-2.5 fill-white" />
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
                <ImageIcon className="h-4 w-4 text-circle-primary" />
                <span>{myMoments.length} {isVi ? 'khoảnh khắc' : 'moments'}</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text text-xs font-bold shadow-xs">
                <Flame className={`h-4 w-4 ${latestStreakKeysSet.size >= 2 ? 'text-red-500 fill-red-500' : 'text-circle-slate'}`} />
                <span>{latestStreakKeysSet.size} {isVi ? 'ngày liên tiếp' : 'days streak'}</span>
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
          <div className="w-full shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white/90 dark:bg-circle-dark-surface/90 backdrop-blur-md overflow-x-auto custom-scrollbar z-10">
            <button
              type="button"
              onClick={() => setSelectedMonthFilter('all')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedMonthFilter === 'all'
                  ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-xs'
                  : 'bg-circle-wash dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
              }`}
            >
              {isVi ? 'Tất cả' : 'All'} ({momentsWithLocations.length})
            </button>

            {monthlyCalendars.map((cal) => (
              <button
                key={cal.key}
                type="button"
                onClick={() => setSelectedMonthFilter(cal.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedMonthFilter === cal.key
                    ? 'bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-xs'
                    : 'bg-circle-wash dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
                }`}
              >
                {cal.label} ({cal.totalPhotos})
              </button>
            ))}
          </div>

          {/* Native Leaflet OpenStreetMap Map */}
          <div className="flex-1 w-full min-h-[480px] h-full relative overflow-hidden" style={{ minHeight: '480px', height: '100%' }}>
            <MomentPlacesMap
              clusters={effectiveClusters}
              selectedCluster={activeCluster}
              onSelectCluster={setActiveCluster}
              onViewClusterMoments={(clusterMoments) => {
                setLightboxSwapped(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md flex flex-col items-center">
            {/* Header Bar */}
            <div className="w-full flex items-center justify-between text-white pb-3">
              <div>
                <p className="text-sm font-bold">
                  {new Date(selectedDayMoments[activePhotoIndex]!.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {selectedDayMoments.length > 1 && (
                  <p className="text-xs text-white/70">
                    {isVi ? 'Ảnh' : 'Photo'} {activePhotoIndex + 1} / {selectedDayMoments.length}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteCurrentLightboxMoment}
                  className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                  title={isVi ? 'Xoá khoảnh khắc' : 'Delete moment'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDayMoments(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title={isVi ? 'Đóng' : 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Media Container 1:1 Square Card */}
            {(() => {
              const currentMoment = selectedDayMoments[activePhotoIndex]!;
              const { mainUrl, pipUrl } = parseMomentPhotos(currentMoment.photoUrl);
              const displayMain = lightboxSwapped ? pipUrl || mainUrl : mainUrl;
              const displayPip = lightboxSwapped ? mainUrl : pipUrl;
              const locInfo = resolveMomentLocation(currentMoment, activePhotoIndex);

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
                        title={isVi ? 'Nhấn để đổi ảnh' : 'Click to swap photo'}
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
                              setActivePhotoIndex((prev) => Math.max(prev - 1, 0));
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-colors z-20"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                        )}

                        {activePhotoIndex < selectedDayMoments.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxSwapped(false);
                              setActivePhotoIndex((prev) => Math.min(prev + 1, selectedDayMoments.length - 1));
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-colors z-20"
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
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
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
