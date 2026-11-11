import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image as RNImage,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
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
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { useMyMomentsQuery, useDeleteMomentMutation } from '../../hooks/use-circle-queries';
import { getItem, setItem } from '../../services/storage';
import { MomentEntity } from '@circle/types';
import { resolveMobileMediaUrl } from '../../services/api';

interface MomentHistoryViewProps {
  onClose?: () => void;
  allCircleMoments?: MomentEntity[];
  capturedPhotoUrl?: string | null;
  containerHeight?: number;
  viewMode?: 'month' | 'map';
  onViewModeChange?: (mode: 'month' | 'map') => void;
  hideInternalHeader?: boolean;
}

interface MomentLocation {
  id: string;
  moment: MomentEntity;
  name: string;
  address: string;
  lat: number;
  lng: number;
  xRatio: number;
  yRatio: number;
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

const PRESET_LOCATIONS_VI = [
  { name: 'ĐH Sư Phạm Kỹ Thuật (HCMUTE)', address: 'Thủ Đức, TP. Hồ Chí Minh', lat: 10.8505, lng: 106.7719, x: 0.62, y: 0.36 },
  { name: 'Phố đi bộ Nguyễn Huệ & Chợ Bến Thành', address: 'Quận 1, TP. Hồ Chí Minh', lat: 10.7745, lng: 106.7035, x: 0.44, y: 0.52 },
  { name: 'Landmark 81 & Central Park', address: 'Bình Thạnh, TP. Hồ Chí Minh', lat: 10.7950, lng: 106.7219, x: 0.54, y: 0.44 },
  { name: 'Hồ Bán Nguyệt & Cầu Ánh Sao', address: 'Quận 7, TP. Hồ Chí Minh', lat: 10.7292, lng: 106.7196, x: 0.50, y: 0.68 },
  { name: 'Hồ Xuân Hương & Lâm Viên', address: 'TP. Đà Lạt, Lâm Đồng', lat: 11.9404, lng: 108.4583, x: 0.78, y: 0.26 },
  { name: 'Bãi Trước & Ngọn Hải Đăng', address: 'TP. Vũng Tàu, Bà Rịa - Vũng Tàu', lat: 10.3460, lng: 107.0843, x: 0.72, y: 0.78 },
  { name: 'Hồ Gươm & Phố Cổ Hà Nội', address: 'Hoàn Kiếm, Hà Nội', lat: 21.0285, lng: 105.8542, x: 0.30, y: 0.18 },
  { name: 'Phố Cổ Hội An & Sông Hoài', address: 'Hội An, Quảng Nam', lat: 15.8801, lng: 108.3380, x: 0.66, y: 0.20 },
];

const PRESET_LOCATIONS_EN = [
  { name: 'HCMUTE Campus', address: 'Thu Duc, Ho Chi Minh City', lat: 10.8505, lng: 106.7719, x: 0.62, y: 0.36 },
  { name: 'Nguyen Hue Walking Street', address: 'District 1, Ho Chi Minh City', lat: 10.7745, lng: 106.7035, x: 0.44, y: 0.52 },
  { name: 'Landmark 81 & Central Park', address: 'Binh Thanh, Ho Chi Minh City', lat: 10.7950, lng: 106.7219, x: 0.54, y: 0.44 },
  { name: 'Crescent Lake & Starlight Bridge', address: 'District 7, Ho Chi Minh City', lat: 10.7292, lng: 106.7196, x: 0.50, y: 0.68 },
  { name: 'Xuan Huong Lake & Square', address: 'Da Lat, Lam Dong', lat: 11.9404, lng: 108.4583, x: 0.78, y: 0.26 },
  { name: 'Front Beach & Lighthouse', address: 'Vung Tau, Ba Ria - Vung Tau', lat: 10.3460, lng: 107.0843, x: 0.72, y: 0.78 },
  { name: 'Hoan Kiem Lake & Old Quarter', address: 'Hoan Kiem, Hanoi', lat: 21.0285, lng: 105.8542, x: 0.30, y: 0.18 },
  { name: 'Hoi An Ancient Town', address: 'Hoi An, Quang Nam', lat: 15.8801, lng: 108.3380, x: 0.66, y: 0.20 },
];

function parseDualPhotos(rawUrl?: string | null): { mainUrl: string; pipUrl: string | null; cornerIndex: number } {
  if (!rawUrl) return { mainUrl: '', pipUrl: null, cornerIndex: 0 };
  let mainRaw = rawUrl;
  let pipRaw: string | null = null;
  let cornerIndex = 0;
  if (rawUrl.includes('#pip=')) {
    const parts = rawUrl.split('#pip=');
    mainRaw = parts[0] || '';
    const pipPart = decodeURIComponent(parts[1] || '');
    if (pipPart.includes('#corner=')) {
      const pipSplit = pipPart.split('#corner=');
      pipRaw = pipSplit[0] || '';
      cornerIndex = parseInt(pipSplit[1] || '0', 10) || 0;
    } else {
      pipRaw = pipPart;
    }
  }
  // Strip all trailing metadata hash tags such as #lat=..., #lng=..., #loc=...
  mainRaw = mainRaw.split('#')[0] || '';
  if (pipRaw) {
    pipRaw = pipRaw.split('#')[0] || '';
  }
  return {
    mainUrl: resolveMobileMediaUrl(mainRaw),
    pipUrl: pipRaw ? resolveMobileMediaUrl(pipRaw) : null,
    cornerIndex,
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

  const { mainUrl, pipUrl, cornerIndex } = parseDualPhotos(photoUrl);

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

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export function getOsmTileUrl(
  lat: number,
  lng: number,
  zoom: number = 15,
  isDark: boolean = false,
): string {
  if (MAPBOX_TOKEN) {
    const style = isDark ? 'dark-v11' : 'streets-v12';
    return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/pin-s-camera+10b981(${lng},${lat})/${lng},${lat},${zoom},0/400x200@2x?access_token=${MAPBOX_TOKEN}`;
  }
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  const cartoTheme = isDark ? 'dark_all' : 'light_all';
  return `https://a.basemaps.cartocdn.com/${cartoTheme}/${zoom}/${x}/${y}@2x.png`;
}

export function resolveMomentLocation(
  m: any,
  fallbackIndex: number = 0,
  opts?: {
    fallbackName?: string;
    fallbackAddress?: string;
    isDark?: boolean;
    locale?: string;
  },
) {
  const presets = opts?.locale === 'en' ? PRESET_LOCATIONS_EN : PRESET_LOCATIONS_VI;
  const fallbackName = opts?.fallbackName || 'Moment Location';
  const fallbackAddress = opts?.fallbackAddress || 'Nearby area';
  const isDark = Boolean(opts?.isDark);

  if (!m) {
    const p = presets[0]!;
    return {
      id: 'default',
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      staticMapUrl: getOsmTileUrl(p.lat, p.lng, 15, isDark),
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
    const name = m.locationName?.trim() || m.address?.trim() || fallbackName;
    const address = m.address?.trim() || m.locationName?.trim() || fallbackAddress;
    return {
      id: m.id || 'loc',
      name,
      address,
      lat,
      lng,
      staticMapUrl: getOsmTileUrl(lat, lng, 15, isDark),
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
    const name = locMatch ? decodeURIComponent(locMatch[1]!) : fallbackName;
    const address = addrMatch ? decodeURIComponent(addrMatch[1]!) : fallbackAddress;
    return {
      id: m.id || 'loc',
      name,
      address,
      lat,
      lng,
      staticMapUrl: getOsmTileUrl(lat, lng, 15, isDark),
    };
  }

  const p = presets[fallbackIndex % presets.length]!;
  return {
    id: m.id || `loc-${fallbackIndex}`,
    name: m.locationName || p.name,
    address: m.address || p.address,
    lat: p.lat,
    lng: p.lng,
    staticMapUrl: getOsmTileUrl(p.lat, p.lng, 15, isDark),
  };
}

export const MomentHistoryView: React.FC<MomentHistoryViewProps> = ({
  onClose,
  allCircleMoments = [],
  capturedPhotoUrl,
  containerHeight,
  viewMode: controlledViewMode,
  onViewModeChange,
  hideInternalHeader = false,
}) => {
  const { colors, resolvedTheme } = useThemeStore();
  const { locale, t } = useLanguageStore();
  const isDark = resolvedTheme === 'dark';
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const { width: screenWidth } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);

  const [internalViewMode, setInternalViewMode] = useState<'month' | 'map'>('month');
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;
  const [selectedDayMoments, setSelectedDayMoments] = useState<any[] | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [activePinMoment, setActivePinMoment] = useState<MomentLocation | null>(null);
  const [activeCluster, setActiveCluster] = useState<MapClusterPin | null>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [lightboxSwapped, setLightboxSwapped] = useState<boolean>(false);
  const [lightboxConfirmMode, setLightboxConfirmMode] = useState<'delete' | 'hide' | null>(null);
  const [lightboxActionError, setLightboxActionError] = useState<string | null>(null);
  const [isLightboxProcessing, setIsLightboxProcessing] = useState<boolean>(false);
  const webViewRef = useRef<WebView>(null);

  // Queries
  const { data: myServerMoments = [] } = useMyMomentsQuery();
  const deleteMomentMutation = useDeleteMomentMutation(null);

  const currentLightboxMoment =
    selectedDayMoments && selectedDayMoments.length > 0
      ? selectedDayMoments[activePhotoIndex]
      : null;

  const isOwnLightboxMoment = Boolean(
    currentLightboxMoment &&
      (currentLightboxMoment.authorId === user?.id ||
        currentLightboxMoment.author?.id === user?.id ||
        currentLightboxMoment.userId === user?.id),
  );

  const closeLightbox = () => {
    setSelectedDayMoments(null);
    setLightboxConfirmMode(null);
    setLightboxActionError(null);
    setIsLightboxProcessing(false);
  };

  const handleRequestDeleteCurrentLightboxMoment = () => {
    if (!currentLightboxMoment || currentLightboxMoment.id === 'captured-today') return;
    setLightboxActionError(null);
    setLightboxConfirmMode(isOwnLightboxMoment ? 'delete' : 'hide');
  };

  const handleConfirmLightboxAction = async () => {
    if (!currentLightboxMoment || currentLightboxMoment.id === 'captured-today') return;
    if (lightboxConfirmMode === 'delete') {
      try {
        setIsLightboxProcessing(true);
        setLightboxActionError(null);
        await deleteMomentMutation.mutateAsync(currentLightboxMoment.id);
        closeLightbox();
      } catch (err: any) {
        setLightboxActionError(err?.message || t.moments.deleteMomentError);
      } finally {
        setIsLightboxProcessing(false);
      }
    } else if (lightboxConfirmMode === 'hide') {
      try {
        setIsLightboxProcessing(true);
        setLightboxActionError(null);
        const stored = await getItem('circle_hidden_moments');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(currentLightboxMoment.id)) {
          list.push(currentLightboxMoment.id);
          await setItem('circle_hidden_moments', JSON.stringify(list));
        }
        closeLightbox();
      } catch (err: any) {
        setLightboxActionError(err?.message || t.moments.deleteMomentError);
      } finally {
        setIsLightboxProcessing(false);
      }
    }
  };

  // Combine and deduplicate moments authored by the account owner or visible in circle
  const myMoments = useMemo(() => {
    const rawList: any[] = [];

    if (Array.isArray(myServerMoments) && myServerMoments.length > 0) {
      rawList.push(...myServerMoments);
    }

    if (Array.isArray(allCircleMoments) && allCircleMoments.length > 0) {
      rawList.push(...allCircleMoments);
    }

    if (capturedPhotoUrl) {
      rawList.push({
        id: 'captured-today',
        photoUrl: capturedPhotoUrl,
        createdAt: new Date().toISOString(),
        authorId: user?.id,
      });
    }

    const map = new Map<string, any>();
    for (const item of rawList) {
      const norm = normalizeMoment(item);
      if (norm && norm.mainUrl) {
        map.set(norm.id, norm);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.dateObj.getTime() - a.dateObj.getTime(),
    );
  }, [myServerMoments, allCircleMoments, capturedPhotoUrl, user?.id]);

  // Global set of dates (YYYY-MM-DD) that have moments
  const allActiveDateKeys = useMemo(() => {
    const set = new Set<string>();
    myMoments.forEach((m) => {
      const d = m.dateObj;
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      set.add(k);
    });
    return set;
  }, [myMoments]);

  // STREAK MỚI NHẤT: Chỉ tính và nối chuỗi liên tiếp kết thúc ở ảnh mới nhất
  // Các chuỗi rời rạc cũ trong quá khứ không nối ("streak là cái mới nhất thui chứ ko phải cái nào cũng nối")
  const latestStreakKeysSet = useMemo(() => {
    if (allActiveDateKeys.size === 0) return new Set<string>();

    const sortedDescDates = Array.from(allActiveDateKeys).sort((a, b) => b.localeCompare(a));
    const newestDateKey = sortedDescDates[0];

    const [yStr, mStr, dStr] = newestDateKey.split('-');
    let curr = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10));

    const streakKeys = [newestDateKey];

    // Đi lùi từng ngày về trước:
    while (true) {
      curr.setDate(curr.getDate() - 1);
      const prevKey = curr.getFullYear() + '-' + String(curr.getMonth() + 1).padStart(2, '0') + '-' + String(curr.getDate()).padStart(2, '0');
      if (allActiveDateKeys.has(prevKey)) {
        streakKeys.push(prevKey);
      } else {
        break;
      }
    }

    // Chỉ khi có từ 2 ngày liên tiếp trở lên mới tạo thành chuỗi nối!
    if (streakKeys.length >= 2) {
      return new Set<string>(streakKeys);
    }

    return new Set<string>();
  }, [allActiveDateKeys]);

  // Group moments by Month & Year with Calendar calculation & Streak detection
  const monthlyCalendars = useMemo(() => {
    const monthKeysSet = new Set<string>();

    // Always include current month
    const now = new Date();
    monthKeysSet.add(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));

    myMoments.forEach((m) => {
      const d = m.dateObj;
      monthKeysSet.add(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    });

    // Sắp xếp theo thứ tự thời gian tự nhiên: tháng trước ở trên, tháng sau ở dưới (ví dụ tháng 9 ở trên tháng 10)
    const sortedMonthKeys = Array.from(monthKeysSet).sort((a, b) => a.localeCompare(b));

    return sortedMonthKeys.map((key) => {
      const [yStr, mStr] = key.split('-');
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10);
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

        const dateObj = new Date(year, month - 1, dayNum);
        const prevDateObj = new Date(year, month - 1, dayNum - 1);
        const nextDateObj = new Date(year, month - 1, dayNum + 1);

        const currentKey = year + '-' + String(month).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
        const nextKey = nextDateObj.getFullYear() + '-' + String(nextDateObj.getMonth() + 1).padStart(2, '0') + '-' + String(nextDateObj.getDate()).padStart(2, '0');

        // CHỈ THUỘC STREAK NẾU THUỘC CHUỖI MỚI NHẤT
        const isPartOfStreak = hasPhotos && latestStreakKeysSet.has(currentKey);
        // CHỈ NỐI CẦU SANG PHẢI NẾU CẢ HÔM NAY VÀ HÔM SAU ĐỀU THUỘC CHUỖI MỚI NHẤT
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
  }, [myMoments, latestStreakKeysSet, t]);

  // Assign location coordinates to moments
  const momentsWithLocations: MomentLocation[] = useMemo(() => {
    const presets = locale === 'en' ? PRESET_LOCATIONS_EN : PRESET_LOCATIONS_VI;
    return myMoments.map((m, index) => {
      // 1. Direct persistent DB fields
      if (
        m.latitude != null &&
        m.longitude != null &&
        !isNaN(Number(m.latitude)) &&
        !isNaN(Number(m.longitude))
      ) {
        const lat = Number(m.latitude);
        const lng = Number(m.longitude);
        const locName = m.locationName?.trim() || m.address?.trim() || t.moments.capturedLocation;
        const address = m.address?.trim() || m.locationName?.trim() || t.moments.capturedAreaFallback;
        const x = Math.min(Math.max((lng - 105.0) / 4.0, 0.15), 0.85);
        const y = Math.min(Math.max((22.0 - lat) / 12.0, 0.15), 0.85);
        return {
          id: m.id,
          moment: m,
          name: locName,
          address,
          lat,
          lng,
          xRatio: x,
          yRatio: y,
        };
      }

      // 2. Hash params inside photoUrl
      const latMatch = m.photoUrl?.match(/#lat=([\d.-]+)/);
      const lngMatch = m.photoUrl?.match(/#lng=([\d.-]+)/);
      const locMatch = m.photoUrl?.match(/#loc=([^#]+)/);
      const addrMatch = m.photoUrl?.match(/#addr=([^#]+)/);

      if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]!);
        const lng = parseFloat(lngMatch[1]!);
        const locName = locMatch ? decodeURIComponent(locMatch[1]!) : t.moments.capturedLocation;
        const address = addrMatch ? decodeURIComponent(addrMatch[1]!) : t.moments.capturedAreaFallback;
        const x = Math.min(Math.max((lng - 105.0) / 4.0, 0.15), 0.85);
        const y = Math.min(Math.max((22.0 - lat) / 12.0, 0.15), 0.85);
        return {
          id: m.id,
          moment: m,
          name: locName,
          address,
          lat,
          lng,
          xRatio: x,
          yRatio: y,
        };
      }

      const locPreset = presets[index % presets.length]!;
      const jitterX = ((index * 17) % 7 - 3) * 0.02;
      const jitterY = ((index * 23) % 7 - 3) * 0.02;

      return {
        id: m.id,
        moment: m,
        name: locPreset.name,
        address: locPreset.address,
        lat: locPreset.lat,
        lng: locPreset.lng,
        xRatio: Math.min(Math.max(locPreset.x + jitterX, 0.12), 0.88),
        yRatio: Math.min(Math.max(locPreset.y + jitterY, 0.12), 0.88),
      };
    });
  }, [myMoments, locale, t]);

  // Filtered moments on map by month
  const mapFilteredLocations = useMemo(() => {
    if (selectedMonthFilter === 'all') return momentsWithLocations;
    return momentsWithLocations.filter((item) => {
      const d = new Date(item.moment.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonthFilter;
    });
  }, [momentsWithLocations, selectedMonthFilter]);

  // Group moments into location clusters for map view (Apple Photos Places style)
  const clusters = useMemo<MapClusterPin[]>(() => {
    const map = new Map<string, MapClusterPin>();
    mapFilteredLocations.forEach((item) => {
      const key = `${item.name}-${item.lat.toFixed(3)}-${item.lng.toFixed(3)}`;
      const rawPinSrc =
        item.moment.photoUrl ||
        (item.moment as any)?.imageUrl ||
        (item.moment as any)?.mediaUrl;
      const { mainUrl } = parseDualPhotos(rawPinSrc);

      if (!map.has(key)) {
        map.set(key, {
          id: item.id,
          name: item.name,
          address: item.address,
          lat: item.lat,
          lng: item.lng,
          thumbUrl: mainUrl,
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

  // Demo fallback clusters if account has not captured moments with geo-tagging yet
  const effectiveClusters = useMemo<MapClusterPin[]>(() => {
    if (clusters.length > 0) return clusters;
    const isVi = locale === 'vi';
    return [
      {
        id: 'cluster-hcmute',
        name: isVi ? 'ĐH Sư Phạm Kỹ Thuật (HCMUTE)' : 'HCMUTE Campus',
        address: isVi ? '1 Võ Văn Ngân, Thủ Đức, TP. Hồ Chí Minh' : '1 Vo Van Ngan, Thu Duc, Ho Chi Minh City',
        lat: 10.8505,
        lng: 106.7719,
        thumbUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300',
        count: 3,
        moments: [
          {
            id: 'demo-moment-1',
            photoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
            caption: isVi ? 'Khuôn viên trường ĐH Sư Phạm Kỹ Thuật TP.HCM ✨' : 'HCMUTE University Campus ✨',
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'cluster-q1',
        name: isVi ? 'Phố đi bộ Nguyễn Huệ & Chợ Bến Thành' : 'Nguyen Hue Walking Street',
        address: isVi ? 'Bến Nghé, Quận 1, TP. Hồ Chí Minh' : 'Ben Nghe, District 1, Ho Chi Minh City',
        lat: 10.7745,
        lng: 106.7035,
        thumbUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300',
        count: 2,
        moments: [
          {
            id: 'demo-moment-2',
            photoUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
            caption: isVi ? 'Dạo phố đi bộ Sài Gòn cuối tuần 🌆' : 'Weekend walk downtown Saigon 🌆',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'cluster-dalat',
        name: isVi ? 'Hồ Xuân Hương & Lâm Viên' : 'Xuan Huong Lake & Square',
        address: isVi ? 'Phường 10, TP. Đà Lạt, Lâm Đồng' : 'Ward 10, Da Lat, Lam Dong',
        lat: 11.9404,
        lng: 108.4583,
        thumbUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300',
        count: 4,
        moments: [
          {
            id: 'demo-moment-3',
            photoUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
            caption: isVi ? 'Không khí se lạnh và hoa Đà Lạt nở rộ 🌸' : 'Cool breeze & blooming flowers in Da Lat 🌸',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ],
      },
      {
        id: 'cluster-landmark',
        name: 'Landmark 81 & Central Park',
        address: isVi ? '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP. Hồ Chí Minh' : '208 Nguyen Huu Canh, Binh Thanh, Ho Chi Minh City',
        lat: 10.795,
        lng: 106.7219,
        thumbUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
        count: 1,
        moments: [
          {
            id: 'demo-moment-4',
            photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
            caption: isVi ? 'Hoàng hôn bên sông Sài Gòn 🌅' : 'Sunset by the Saigon River 🌅',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
          },
        ],
      },
    ];
  }, [clusters, locale]);

  // Leaflet HTML template for OpenStreetMap tiles map
  const mapHtml = useMemo(() => {
    const pinsData = JSON.stringify(
      effectiveClusters.map((c) => ({
        id: c.id,
        lat: c.lat,
        lng: c.lng,
        name: c.name,
        address: c.address,
        thumbUrl: c.thumbUrl,
        count: c.count,
      }))
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      background: ${isDark ? '#131316' : '#F8FAFC'};
    }
    #map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
    .custom-pin-container { background: none !important; border: none !important; }
    .photo-pin-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .photo-pin-marker:active {
      transform: scale(0.92);
    }
    .photo-pin-bubble {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      border: 2.5px solid #FFFFFF;
      background: #FFFFFF;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-pin-bubble.selected {
      border-color: ${colors.sage};
      box-shadow: 0 0 0 3px ${colors.sage}50, 0 6px 18px rgba(0,0,0,0.5);
      transform: scale(1.12);
    }
    .photo-pin-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .photo-pin-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: rgba(19, 19, 22, 0.92);
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.4);
      line-height: 12px;
    }
    .photo-pin-tail {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid #FFFFFF;
      margin-top: -1px;
    }
    .photo-pin-bubble.selected + .photo-pin-tail {
      border-top-color: ${colors.sage};
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function startMap() {
      if (typeof L === 'undefined') {
        setTimeout(startMap, 60);
        return;
      }
      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        tap: true
      });

      var mapboxToken = '${MAPBOX_TOKEN}';
      var mapboxStyle = '${isDark ? 'dark-v11' : 'streets-v12'}';
      var cartoTheme = '${isDark ? 'dark_all' : 'light_all'}';
      var tileUrl = mapboxToken
        ? 'https://api.mapbox.com/styles/v1/mapbox/' + mapboxStyle + '/tiles/512/{z}/{x}/{y}@2x?access_token=' + mapboxToken
        : 'https://{s}.basemaps.cartocdn.com/' + cartoTheme + '/{z}/{x}/{y}@2x.png';

      L.tileLayer(tileUrl, {
        tileSize: mapboxToken ? 512 : 256,
        zoomOffset: mapboxToken ? -1 : 0,
        maxZoom: 20,
        attribution: ''
      }).addTo(map);

      function triggerInvalidate() {
        if (map) {
          map.invalidateSize();
        }
      }
      setTimeout(triggerInvalidate, 50);
      setTimeout(triggerInvalidate, 200);
      setTimeout(triggerInvalidate, 600);
      setTimeout(triggerInvalidate, 1500);
      window.addEventListener('resize', triggerInvalidate);
      window.triggerInvalidate = triggerInvalidate;

      var markersGroup = L.featureGroup().addTo(map);
      var currentMarkers = {};
      var rawPins = ${pinsData};

      function renderPins(pins, selectedId) {
        markersGroup.clearLayers();
        currentMarkers = {};

        if (!pins || pins.length === 0) {
          map.setView([10.8231, 106.6297], 13);
          return;
        }

        var bounds = [];
        pins.forEach(function(p) {
          var isSel = (p.id === selectedId);
          var badgeHtml = p.count > 1 ? '<span class="photo-pin-badge">+' + p.count + '</span>' : '';
          var html = '<div class="photo-pin-marker" id="pin-' + p.id + '">' +
                     '  <div class="photo-pin-bubble ' + (isSel ? 'selected' : '') + '">' +
                     '    <img class="photo-pin-img" src="' + p.thumbUrl + '" onerror="this.src=\\'data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'44\\\' height=\\\'44\\\'><rect width=\\\'44\\\' height=\\\'44\\\' fill=\\\'%2394a3b8\\\'/></svg>\\'" />' +
                     badgeHtml +
                     '  </div>' +
                     '  <div class="photo-pin-tail"></div>' +
                     '</div>';

          var icon = L.divIcon({
            html: html,
            className: 'custom-pin-container',
            iconSize: [44, 50],
            iconAnchor: [22, 50]
          });

          var marker = L.marker([p.lat, p.lng], { icon: icon });
          marker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_PIN', id: p.id }));
            }
          });

          marker.addTo(markersGroup);
          currentMarkers[p.id] = marker;
          bounds.push([p.lat, p.lng]);
        });

        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 14);
        }
      }

      function selectPin(id) {
        document.querySelectorAll('.photo-pin-bubble').forEach(function(el) {
          el.classList.remove('selected');
        });
        if (!id) return;
        var target = document.getElementById('pin-' + id);
        if (target) {
          var bubble = target.querySelector('.photo-pin-bubble');
          if (bubble) bubble.classList.add('selected');
        }
        if (currentMarkers[id]) {
          map.panTo(currentMarkers[id].getLatLng(), { animate: true, duration: 0.4 });
        }
      }

      function recenter() {
        if (markersGroup.getLayers().length > 0) {
          map.fitBounds(markersGroup.getBounds(), { padding: [50, 50], maxZoom: 15 });
        } else {
          map.setView([10.8231, 106.6297], 13);
        }
      }

      window.renderPins = renderPins;
      window.selectPin = selectPin;
      window.recenter = recenter;

      renderPins(rawPins, null);
    }
    startMap();
  </script>
</body>
</html>`;
  }, [effectiveClusters, isDark, colors.sage]);

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_PIN') {
        const found = effectiveClusters.find((c) => c.id === data.id);
        if (found) {
          setActiveCluster(found);
          webViewRef.current?.injectJavaScript(`window.selectPin('${found.id}'); true;`);
        }
      }
    } catch {}
  };

  // Calculate 7-column calendar day cell size dynamically from screenWidth
  const calendarGap = 6;
  const calendarPadding = 14;
  const cellWidth = Math.floor((screenWidth - calendarPadding * 2 - calendarGap * 6) / 7);

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
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Sub-Header Toolbar with Switcher Tabs */}
      {!hideInternalHeader && (
        <View style={[styles.subHeader, { borderBottomColor: colors.hairline }]}>
          <View style={styles.titleColumn}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              {t.moments.myMomentsTitle}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.subtle }]}>
              {myMoments.length} {t.moments.momentsUnit}
            </Text>
          </View>

          {/* Switcher Tabs: Month vs Map */}
          <View style={[styles.segmentedBar, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setViewMode('month')}
              style={[
                styles.segmentBtn,
                viewMode === 'month' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
              ]}
            >
              <Calendar
                size={13}
                color={viewMode === 'month' ? colors.onPrimary : colors.subtle}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  { color: viewMode === 'month' ? colors.onPrimary : colors.subtle },
                ]}
              >
                {t.moments.calendarMode}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setViewMode('map')}
              style={[
                styles.segmentBtn,
                viewMode === 'map' && [styles.segmentBtnActive, { backgroundColor: colors.primary }],
              ]}
            >
              <MapIcon
                size={13}
                color={viewMode === 'map' ? colors.onPrimary : colors.subtle}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  { color: viewMode === 'map' ? colors.onPrimary : colors.subtle },
                ]}
              >
                {t.moments.placesMode}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================================================================
          MODE 1: CALENDAR GRID WITH STREAK CONNECTORS & STACK THUMBNAILS
         ========================================================================= */}
      {viewMode === 'month' && (
        <ScrollView
          style={styles.monthScrollView}
          contentContainerStyle={styles.monthContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {monthlyCalendars.map((cal) => (
            <View key={cal.key} style={styles.calendarCard}>
              {/* Month Card Header */}
              <View style={styles.calendarHeaderRow}>
                <View style={styles.calendarTitleWrap}>
                  <Text style={[styles.calendarMonthTitle, { color: colors.text }]}>
                    {cal.label}
                  </Text>
                  <Text style={[styles.calendarSubStats, { color: colors.subtle }]}>
                    {cal.daysWithPhotosCount} {t.moments.activeDaysUnit} • {cal.totalPhotos}{' '}
                    {t.moments.photosUnit}
                  </Text>
                </View>

                <View style={styles.headerBadgesRow}>
                  <View style={[styles.monthBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[styles.monthBadgeText, { color: colors.text }]}>
                      {cal.totalPhotos} {t.moments.photosUnit}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 7-Column Weekday Header Row */}
              <View style={styles.weekdayRow}>
                {weekdays.map((wd, wIdx) => (
                  <View key={wIdx} style={[styles.weekdayCell, { width: cellWidth }]}>
                    <Text
                      style={[
                        styles.weekdayText,
                        { color: wIdx === 6 ? colors.sage : colors.subtle },
                      ]}
                    >
                      {wd}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 7-Column Days Grid */}
              <View style={styles.daysGrid}>
                {/* Empty padding cells for start of month */}
                {Array.from({ length: cal.startDayIndex }).map((_, padIdx) => (
                  <View
                    key={`pad-${padIdx}`}
                    style={[styles.emptyPadCell, { width: cellWidth, height: cellWidth }]}
                  />
                ))}

                {/* Actual Month Days */}
                {cal.days.map((dayItem) => {
                  const hasPhotos = dayItem.moments.length > 0;
                  const latestPhoto = hasPhotos ? dayItem.moments[0] : null;
                  const mainUrl = latestPhoto?.mainUrl || parseDualPhotos(latestPhoto?.photoUrl || (latestPhoto as any)?.imageUrl || (latestPhoto as any)?.mediaUrl).mainUrl;
                  const isMultiple = dayItem.moments.length > 1;
                  const isPartOfStreak = Boolean(dayItem.isPartOfStreak);

                  if (!hasPhotos) {
                    return (
                      <View
                        key={`day-${dayItem.day}`}
                        style={[
                          styles.emptyDayCell,
                          {
                            width: cellWidth,
                            height: cellWidth,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderColor: colors.hairline,
                          },
                        ]}
                      >
                        <Text style={[styles.emptyDayNum, { color: colors.subtle }]}>
                          {dayItem.day}
                        </Text>
                        <View style={[styles.emptyDayDot, { backgroundColor: colors.hairline }]} />
                      </View>
                    );
                  }

                  // Day WITH photo(s): latest photo with stacked "dày dày" effect + count badge
                  return (
                    <TouchableOpacity
                      key={`day-${dayItem.day}`}
                      activeOpacity={0.85}
                      onPress={() => {
                        setLightboxSwapped(false);
                        setLightboxConfirmMode(null);
                        setLightboxActionError(null);
                        setActivePhotoIndex(0);
                        setSelectedDayMoments(dayItem.moments);
                      }}
                      style={[styles.photoDayCell, { width: cellWidth, height: cellWidth }]}
                    >
                      {/* Streak connector bridge to the right cell (kết nối viền xanh liên tiếp) */}
                      {dayItem.connectsRight && (cal.startDayIndex + dayItem.day - 1) % 7 !== 6 && (
                        <View
                          style={[
                            styles.streakConnectorBar,
                            {
                              backgroundColor: colors.primary,
                              top: Math.floor(cellWidth / 2) - 2.5,
                              left: cellWidth - 3,
                              width: calendarGap + 6,
                            },
                          ]}
                        />
                      )}

                      {/* Foreground Top Photo Thumbnail - nằm vừa khung giống ảnh đơn */}
                      <View
                        style={[
                          styles.dayPhotoForeground,
                          {
                            width: cellWidth,
                            height: cellWidth,
                            backgroundColor: colors.surface,
                            borderColor: isPartOfStreak ? colors.primary : colors.hairline,
                            borderWidth: isPartOfStreak ? 2.5 : 1,
                          },
                          isPartOfStreak && {
                            shadowColor: colors.primary,
                            shadowOpacity: 0.35,
                            shadowRadius: 4,
                            elevation: 4,
                          },
                        ]}
                      >
                        {mainUrl ? (
                          <RNImage
                            source={{ uri: mainUrl }}
                            style={[StyleSheet.absoluteFill, styles.dayPhotoImg]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.dayPhotoImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.wash }]}>
                            <ImageIcon size={16} color={colors.subtle} />
                          </View>
                        )}

                        {/* Streak Mini Flame Indicator at Top Left */}
                        {isPartOfStreak && (
                          <View style={[styles.streakDayTag, { backgroundColor: colors.primary }]}>
                            <Flame size={8} color={colors.onPrimary} />
                          </View>
                        )}

                        {/* Multiple Photos Badge: "+5" */}
                        {isMultiple && (
                          <View style={[styles.multipleBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(30,30,30,0.85)' }]}>
                            <Text style={[styles.multipleBadgeText, { color: '#FFFFFF' }]}>
                              +{dayItem.moments.length}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Summary footer pills */}
          <View style={styles.basicSummaryRow}>
            {/* Pill 1: Photo icon + Total */}
            <View style={[styles.basicStatPill, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <ImageIcon size={16} color={colors.sage} />
              <Text style={[styles.basicStatNumber, { color: colors.text }]}>
                {myMoments.length}
              </Text>
            </View>

            {/* Pill 2: Streak flame + Count */}
            <View style={[styles.basicStatPill, { backgroundColor: colors.surface, borderColor: latestStreakKeysSet.size >= 2 ? colors.sage : colors.hairline }]}>
              <Flame size={16} color={latestStreakKeysSet.size >= 2 ? colors.danger : colors.subtle} />
              <Text style={[styles.basicStatNumber, { color: latestStreakKeysSet.size >= 2 ? colors.danger : colors.text }]}>
                {latestStreakKeysSet.size}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* =========================================================================
          MODE 2: INTERACTIVE MAP CANVAS
         ========================================================================= */}
      {viewMode === 'map' && (
        <View style={styles.mapRoot}>
          {/* Top Month Filter Horizon Scroll */}
          <View style={[styles.mapFilterStrip, { borderBottomColor: colors.hairline }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapFilterScroll}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedMonthFilter('all')}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selectedMonthFilter === 'all' ? colors.primary : colors.surface,
                    borderColor: colors.hairline,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: selectedMonthFilter === 'all' ? colors.onPrimary : colors.text },
                  ]}
                >
                  {t.common.all} ({momentsWithLocations.length})
                </Text>
              </TouchableOpacity>

              {monthlyCalendars.map((cal) => (
                <TouchableOpacity
                  key={cal.key}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMonthFilter(cal.key)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: selectedMonthFilter === cal.key ? colors.primary : colors.surface,
                      borderColor: colors.hairline,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: selectedMonthFilter === cal.key ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {cal.label} ({cal.totalPhotos})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Real Interactive Leaflet / CartoDB Map via WebView */}
          <View style={styles.mapWebViewContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={styles.mapWebView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              onMessage={handleWebViewMessage}
            />

            {/* Floating Controls: Recenter */}
            <View style={styles.mapFloatingControls}>
              <TouchableOpacity
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t.moments.recenterMap}
                onPress={() => {
                  webViewRef.current?.injectJavaScript('window.recenter(); true;');
                  setActiveCluster(null);
                }}
                style={[
                  styles.mapControlBtn,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <LocateFixed size={17} color={colors.sage} />
              </TouchableOpacity>
            </View>

            {/* Floating Preview Card when Pin is Selected */}
            {activeCluster && (
              <View
                style={[
                  styles.pinBottomCard,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <View style={styles.pinCardContent}>
                  <RNImage
                    source={{ uri: activeCluster.thumbUrl }}
                    style={styles.pinCardThumb}
                  />
                  <View style={styles.pinCardDetails}>
                    <View style={styles.pinCardTitleRow}>
                      <MapPin size={13} color={colors.sage} />
                      <Text
                        style={[styles.pinCardTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {activeCluster.name}
                      </Text>
                    </View>
                    <Text style={[styles.pinCardDate, { color: colors.subtle }]} numberOfLines={1}>
                      {activeCluster.address || t.moments.capturedAreaFallback}
                    </Text>
                    <Text style={[styles.pinCardCaption, { color: colors.sage }]}>
                      {activeCluster.count > 1
                        ? `${activeCluster.count} ${t.moments.momentsAtLocation}`
                        : `${new Date(activeCluster.moments[0]?.createdAt).toLocaleDateString(dateLocale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setLightboxSwapped(false);
                      setLightboxConfirmMode(null);
                      setLightboxActionError(null);
                      setActivePhotoIndex(0);
                      setSelectedDayMoments(activeCluster.moments);
                    }}
                    style={[styles.pinViewPhotoBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.pinViewPhotoBtnText, { color: colors.onPrimary }]}>
                      {activeCluster.count > 1
                        ? `${activeCluster.count} ${t.moments.photosUnit}`
                        : t.moments.photoBadge}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={t.common.close}
                  onPress={() => {
                    setActiveCluster(null);
                    webViewRef.current?.injectJavaScript('window.selectPin(null); true;');
                  }}
                  style={styles.pinCardCloseBtn}
                >
                  <X size={13} color={colors.subtle} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* =========================================================================
          FULL-SCREEN PHOTO DETAIL LIGHTBOX MODAL (SUPPORTS SWIPING DAY PHOTOS)
         ========================================================================= */}
      {selectedDayMoments && selectedDayMoments.length > 0 && (
        <Modal
          visible={Boolean(selectedDayMoments)}
          animationType="fade"
          transparent
          onRequestClose={closeLightbox}
        >
          <View style={styles.detailBackdrop}>
            <View style={styles.detailCardWrapper}>
              {/* Header Bar */}
              <View style={[styles.detailHeaderBar, { width: screenWidth - 36 }]}>
                <View>
                  <Text style={styles.detailDateText}>
                    {new Date(selectedDayMoments[activePhotoIndex]!.createdAt).toLocaleDateString(dateLocale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {selectedDayMoments.length > 1 && (
                    <Text style={styles.detailMultiCountText}>
                      {t.moments.photoCounterOfTotal
                        .replace('{current}', String(activePhotoIndex + 1))
                        .replace('{total}', String(selectedDayMoments.length))}
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {currentLightboxMoment?.id !== 'captured-today' && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={isOwnLightboxMoment ? t.moments.deleteMomentForeverAction : t.moments.deleteForMeAction}
                      onPress={handleRequestDeleteCurrentLightboxMoment}
                      style={styles.detailDeleteBtn}
                    >
                      <Trash2 size={16} color="#FCA5A5" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={t.common.close}
                    onPress={closeLightbox}
                    style={styles.detailCloseBtn}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inline 2-step confirmation & error pill inside lightbox */}
              {(lightboxConfirmMode || lightboxActionError) && (
                <View
                  style={[
                    styles.lightboxInlineBar,
                    {
                      width: screenWidth - 36,
                      backgroundColor: colors.surface,
                      borderColor: lightboxActionError ? colors.danger : colors.hairline,
                    },
                  ]}
                >
                  <Text style={[styles.lightboxInlineText, { color: lightboxActionError ? colors.danger : colors.text }]}>
                    {lightboxActionError
                      ? lightboxActionError
                      : lightboxConfirmMode === 'delete'
                      ? t.moments.deleteForeverConfirm
                      : t.moments.hideMomentConfirm}
                  </Text>

                  {lightboxActionError ? (
                    <TouchableOpacity
                      onPress={() => setLightboxActionError(null)}
                      style={[styles.lightboxInlineBtn, { borderColor: colors.hairline, borderWidth: 1 }]}
                    >
                      <Text style={[styles.lightboxInlineBtnText, { color: colors.text }]}>
                        {t.common.dismiss}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.lightboxInlineActions}>
                      <TouchableOpacity
                        disabled={isLightboxProcessing}
                        onPress={() => setLightboxConfirmMode(null)}
                        style={[styles.lightboxInlineBtn, { borderColor: colors.hairline, borderWidth: 1 }]}
                      >
                        <Text style={[styles.lightboxInlineBtnText, { color: colors.subtle }]}>
                          {t.common.cancel}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={isLightboxProcessing}
                        onPress={handleConfirmLightboxAction}
                        style={[styles.lightboxInlineBtn, { backgroundColor: '#DC2626' }]}
                      >
                        {isLightboxProcessing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={[styles.lightboxInlineBtnText, { color: '#FFFFFF' }]}>
                            {lightboxConfirmMode === 'delete'
                              ? t.moments.deleteMomentForeverAction
                              : t.moments.deleteForMeAction}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Media Container 1:1 Square Card */}
              {(() => {
                const currentMoment = selectedDayMoments[activePhotoIndex]!;
                const rawMomentSrc = currentMoment.photoUrl || (currentMoment as any)?.imageUrl || (currentMoment as any)?.mediaUrl;
                const { mainUrl, pipUrl } = parseDualPhotos(rawMomentSrc);
                const displayMain = lightboxSwapped ? pipUrl || mainUrl : mainUrl;
                const displayPip = lightboxSwapped ? mainUrl : pipUrl;
                const cardDim = screenWidth - 36;

                return (
                  <View style={[styles.detailPhotoContainer, { width: cardDim, height: cardDim }]}>
                    <RNImage
                      source={{ uri: displayMain }}
                      style={styles.detailMainImage}
                      resizeMode="cover"
                    />

                    {/* Dual PiP Floating Window */}
                    {displayPip && (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setLightboxSwapped(!lightboxSwapped)}
                        style={styles.detailPipWindow}
                      >
                        <RNImage
                          source={{ uri: displayPip }}
                          style={styles.detailPipImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}

                    {/* Caption Overlay */}
                    {currentMoment.caption && (
                      <View style={styles.detailCaptionBox}>
                        <Text style={styles.detailCaptionText}>{currentMoment.caption}</Text>
                      </View>
                    )}

                    {/* Navigation Arrows if Day has Multiple Photos */}
                    {selectedDayMoments.length > 1 && (
                      <>
                        {activePhotoIndex > 0 && (
                          <TouchableOpacity
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel={t.moments.prevStory}
                            onPress={() => {
                              setLightboxSwapped(false);
                              setLightboxConfirmMode(null);
                              setLightboxActionError(null);
                              setActivePhotoIndex((prev) => Math.max(prev - 1, 0));
                            }}
                            style={[styles.navArrowBtn, { left: 10 }]}
                          >
                            <ChevronLeft size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                        {activePhotoIndex < selectedDayMoments.length - 1 && (
                          <TouchableOpacity
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel={t.moments.nextStory}
                            onPress={() => {
                              setLightboxSwapped(false);
                              setLightboxConfirmMode(null);
                              setLightboxActionError(null);
                              setActivePhotoIndex((prev) => Math.min(prev + 1, selectedDayMoments.length - 1));
                            }}
                            style={[styles.navArrowBtn, { right: 10 }]}
                          >
                            <ChevronRight size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                );
              })()}

              {/* Mini Map Location Card below Photo */}
              {(() => {
                const currentMoment = selectedDayMoments[activePhotoIndex]!;
                const locInfo = resolveMomentLocation(currentMoment, activePhotoIndex, {
                  fallbackName: t.moments.capturedLocation,
                  fallbackAddress: t.moments.capturedAreaFallback,
                  isDark,
                  locale,
                });

                return (
                  <View
                    style={[
                      styles.detailLocationCard,
                      {
                        width: screenWidth - 36,
                        backgroundColor: colors.surface,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    {/* Left: Mini Map Image Tile snippet with Pin */}
                    <View style={[styles.detailMiniMapWrap, { backgroundColor: colors.elevated }]}>
                      <RNImage
                        source={{ uri: locInfo.staticMapUrl }}
                        style={styles.detailMiniMapImg}
                        resizeMode="cover"
                      />
                      <View style={styles.detailMiniMapCenterPin}>
                        <View style={[styles.detailMiniMapPinCircle, { backgroundColor: colors.primary, borderColor: colors.onPrimary }]}>
                          <MapPin size={11} color={colors.onPrimary} />
                        </View>
                      </View>
                    </View>

                    {/* Right: Location & Address text column */}
                    <View style={styles.detailLocationInfoCol}>
                      <View style={styles.detailLocationTitleRow}>
                        <MapPin size={13} color={colors.sage} />
                        <Text
                          style={[styles.detailLocationTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {locInfo.name}
                        </Text>
                      </View>
                      <Text
                        style={[styles.detailLocationAddress, { color: colors.subtle }]}
                        numberOfLines={1}
                      >
                        {locInfo.address}
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => {
                          closeLightbox();
                          setViewMode('map');
                          setTimeout(() => {
                            webViewRef.current?.injectJavaScript(`window.selectPin && window.selectPin('${locInfo.id}'); true;`);
                          }, 500);
                        }}
                        style={styles.detailViewMapLink}
                      >
                        <Text style={[styles.detailViewMapLinkText, { color: colors.sage }]}>
                          {t.moments.viewOnLargeMap}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}

              {/* Reactions Footer */}
              {Array.isArray(selectedDayMoments[activePhotoIndex]?.reactions) &&
                selectedDayMoments[activePhotoIndex]!.reactions!.length > 0 && (
                  <View style={styles.detailReactionsRow}>
                    <Text style={styles.detailReactionsText}>
                      {t.moments.reactionSummaryFromFriends.replace(
                        '{count}',
                        String(selectedDayMoments[activePhotoIndex]!.reactions!.length),
                      )}
                    </Text>
                  </View>
                )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export const MomentHistoryModal = MomentHistoryView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleColumn: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 2.5,
    borderWidth: 1,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    gap: 5,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Monthly Calendar Card
  monthScrollView: {
    flex: 1,
  },
  monthContentContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 95,
  },
  basicSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  basicStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  basicStatNumber: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  calendarCard: {
    marginBottom: 24,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  calendarTitleWrap: {
    gap: 2,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  calendarSubStats: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  streakHeaderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  monthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emptyPadCell: {
    opacity: 0,
  },
  emptyDayCell: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyDayNum: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyDayDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    marginTop: 2,
  },

  // Photo Day Cell with Stack Layers for "dày dày" look
  photoDayCell: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakConnectorBar: {
    position: 'absolute',
    height: 5,
    borderRadius: 2.5,
    zIndex: 2,
  },
  streakDayTag: {
    position: 'absolute',
    top: 3,
    left: 3,
    paddingHorizontal: 3.5,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  stackLayerBack: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    transform: [{ rotate: '5deg' }, { scale: 0.92 }],
    zIndex: 1,
  },
  stackLayerMid: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    transform: [{ rotate: '-3deg' }, { scale: 0.96 }],
    zIndex: 2,
  },
  dayPhotoForeground: {
    borderRadius: 13,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  dayPhotoImg: {
    width: '100%',
    height: '100%',
  },
  dayNumTag: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
  },
  dayNumTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  multipleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  multipleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Map View
  mapRoot: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapFilterStrip: {
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  mapFilterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mapWebViewContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapFloatingControls: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 40,
  },
  mapControlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  pinBottomCard: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 7,
    zIndex: 50,
  },
  pinCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinCardThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  pinCardDetails: {
    flex: 1,
  },
  pinCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  pinCardDate: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  pinCardCaption: {
    fontSize: 10,
    marginTop: 1,
    fontStyle: 'italic',
  },
  pinViewPhotoBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 11,
  },
  pinViewPhotoBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pinCardCloseBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 3,
  },

  // Detail Modal Lightbox
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lightboxInlineBar: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  lightboxInlineText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  lightboxInlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  lightboxInlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxInlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailDateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detailMultiCountText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  detailDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPhotoContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    position: 'relative',
  },
  detailMainImage: {
    width: '100%',
    height: '100%',
  },
  detailPipWindow: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 7,
  },
  detailPipImage: {
    width: '100%',
    height: '100%',
  },
  detailCaptionBox: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  detailCaptionText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  navArrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  detailReactionsRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  detailReactionsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  detailMiniMapWrap: {
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#334155',
  },
  detailMiniMapImg: {
    width: '100%',
    height: '100%',
  },
  detailMiniMapCenterPin: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailMiniMapPinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  detailLocationInfoCol: {
    flex: 1,
    gap: 2,
  },
  detailLocationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailLocationTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  detailLocationAddress: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailViewMapLink: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  detailViewMapLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
