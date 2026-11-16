import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  FolderOpen,
  Plus,
  ArrowLeft,
  Trash2,
  X,
  UploadCloud,
  Calendar,
  Image as ImageIcon,
  Check,
  Link2,
  FileText,
  Globe,
  Copy,
  ExternalLink,
  Download,
  Search,
  Camera,
  Filter,
  Pencil,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from 'lucide-react-native';
import {
  getAlbumsApi,
  getAlbumDetailApi,
  createAlbumApi,
  updateAlbumApi,
  deleteAlbumApi,
  addPhotosApi,
  deletePhotoApi,
  getMediaHubApi,
} from '../../services/circle-tools.service';
import { uploadMobileMedia } from '../../services/storage-upload.service';
import { SharedAlbumEntity, PhotoEntity, MediaHubResponse } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { useLanguageStore } from '../../stores/language.store';
import { copyTextSafe } from '../../utils/clipboard';

interface MobileAlbumsViewProps {
  circleId: string;
  onBack?: () => void;
}

type HubTab = 'media' | 'links' | 'files';
type FileTypeFilter = 'ALL' | 'PDF' | 'WORD' | 'EXCEL' | 'CANVA' | 'ARCHIVES' | 'OTHER';

export const MobileAlbumsView: React.FC<MobileAlbumsViewProps> = ({ circleId, onBack }) => {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = useMemo(() => getGlassTheme(isDark, uiStyle), [isDark, uiStyle]);
  const { t, locale } = useLanguageStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photoSize = (width - 48) / 3;
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const styles = useMemo(() => createStyles(colors, isDark, photoSize), [colors, isDark, photoSize]);

  // Top header and bottom dock clearances
  const topHeaderTop = Math.max(insets.top + 8, 16);
  const bottomDockBottom = Math.max(insets.bottom + 10, 16);

  // Albums & Media state
  const [albums, setAlbums] = useState<SharedAlbumEntity[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<SharedAlbumEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // 3 Bottom Tabs: 'media' | 'links' | 'files'
  const [activeTab, setActiveTab] = useState<HubTab>('media');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const [mediaHub, setMediaHub] = useState<MediaHubResponse>({ media: [], links: [], files: [] });
  const [isLoadingHub, setIsLoadingHub] = useState(false);
  const mediaItems = mediaHub.media || [];
  const linkItems = mediaHub.links || [];
  const fileItems = mediaHub.files || [];

  const [selectedHubPhoto, setSelectedHubPhoto] = useState<any | null>(null);
  const photos = selectedAlbum?.photos || [];
  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;
  const setSelectedPhoto = (photo: PhotoEntity | null) => {
    if (!photo) setSelectedPhotoIndex(null);
    else {
      const idx = photos.findIndex((p) => p.id === photo.id);
      setSelectedPhotoIndex(idx >= 0 ? idx : 0);
    }
  };

  // Inline feedback & notice banner
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConfirmingDeleteAlbum, setIsConfirmingDeleteAlbum] = useState(false);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);
  const [isConfirmingDeletePhoto, setIsConfirmingDeletePhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  // Create album modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Global Hub Filters (Search, Sender, Date Range, File Type)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [senderSearchQuery, setSenderSearchQuery] = useState('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [activeDateField, setActiveDateField] = useState<'from' | 'to'>('from');
  const [pickerMonth, setPickerMonth] = useState(() => new Date());

  const [selectedFileType, setSelectedFileType] = useState<FileTypeFilter>('ALL');

  // Album Detail Inner State (In-place Rename, Multi-select, Search & Filter in Album)
  const [isEditingAlbumTitle, setIsEditingAlbumTitle] = useState(false);
  const [editingAlbumTitleText, setEditingAlbumTitleText] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const [albumSearchQuery, setAlbumSearchQuery] = useState('');
  const [selectedAlbumSenderId, setSelectedAlbumSenderId] = useState<string>('ALL');
  const [isAlbumSenderModalOpen, setIsAlbumSenderModalOpen] = useState(false);
  const [albumSenderSearchQuery, setAlbumSenderSearchQuery] = useState('');

  const [albumDateFrom, setAlbumDateFrom] = useState('');
  const [albumDateTo, setAlbumDateTo] = useState('');
  const [isAlbumDateModalOpen, setIsAlbumDateModalOpen] = useState(false);
  const [albumDraftFrom, setAlbumDraftFrom] = useState('');
  const [albumDraftTo, setAlbumDraftTo] = useState('');
  const [albumActiveDateField, setAlbumActiveDateField] = useState<'from' | 'to'>('from');
  const [albumPickerMonth, setAlbumPickerMonth] = useState(() => new Date());

  // Extract unique senders across media hub
  const uniqueSenders = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    albums.forEach((alb) => {
      const u = alb.creator?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    mediaItems.forEach((m) => {
      const u = m.uploader?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    linkItems.forEach((l) => {
      const u = l.sender?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    fileItems.forEach((f) => {
      const u = f.sender?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    return Array.from(map.values());
  }, [albums, mediaItems, linkItems, fileItems, t]);

  // Extract senders inside current album
  const albumSenders = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (selectedAlbum?.photos || []).forEach((p) => {
      const u = p.uploader?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    return Array.from(map.values());
  }, [selectedAlbum, t]);

  // Helper: check if a date string falls within [fromStr, toStr]
  const isWithinDateRange = (dateInput?: string | Date | null, fromStr?: string, toStr?: string) => {
    const f = fromStr !== undefined ? fromStr : dateFrom;
    const to = toStr !== undefined ? toStr : dateTo;
    if (!f && !to) return true;
    if (!dateInput) return false;
    const itemDate = new Date(dateInput).getTime();
    if (isNaN(itemDate)) return false;
    if (f) {
      const fromT = new Date(`${f}T00:00:00`).getTime();
      if (itemDate < fromT) return false;
    }
    if (to) {
      const toT = new Date(`${to}T23:59:59`).getTime();
      if (itemDate > toT) return false;
    }
    return true;
  };

  // Filtered Albums in Hub
  const filteredAlbums = useMemo(() => {
    const result = albums.filter((alb) => {
      if (selectedSenderId !== 'ALL' && alb.creator?.user?.id !== selectedSenderId) {
        return false;
      }
      if (!isWithinDateRange(alb.updatedAt || alb.createdAt)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          alb.albumTitle.toLowerCase().includes(q) ||
          (alb.description && alb.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
  }, [albums, selectedSenderId, dateFrom, dateTo, searchQuery]);

  // Filtered Media in Hub
  const filteredMediaItems = useMemo(() => {
    const result = mediaItems.filter((item) => {
      if (selectedSenderId !== 'ALL' && item.uploader?.user?.id !== selectedSenderId) {
        return false;
      }
      if (!isWithinDateRange(item.createdAt)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (item.caption && item.caption.toLowerCase().includes(q)) ||
          (item.fileName && item.fileName.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt || '').getTime();
      const timeB = new Date(b.createdAt || '').getTime();
      return timeB - timeA;
    });
  }, [mediaItems, selectedSenderId, dateFrom, dateTo, searchQuery]);

  // Filtered Links in Hub
  const filteredLinkItems = useMemo(() => {
    const result = linkItems.filter((item) => {
      if (selectedSenderId !== 'ALL' && item.sender?.user?.id !== selectedSenderId) {
        return false;
      }
      if (!isWithinDateRange(item.sentAt)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.url.toLowerCase().includes(q) || item.domain.toLowerCase().includes(q);
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return timeB - timeA;
    });
  }, [linkItems, selectedSenderId, dateFrom, dateTo, searchQuery]);

  // Filtered Files in Hub
  const filteredFileItems = useMemo(() => {
    const result = fileItems.filter((item) => {
      if (selectedSenderId !== 'ALL' && item.sender?.user?.id !== selectedSenderId) {
        return false;
      }
      if (!isWithinDateRange(item.sentAt)) {
        return false;
      }
      if (selectedFileType !== 'ALL') {
        const ext = (item.extension || '').toUpperCase();
        if (selectedFileType === 'PDF' && ext !== 'PDF') return false;
        if (selectedFileType === 'WORD' && !['DOC', 'DOCX'].includes(ext)) return false;
        if (selectedFileType === 'EXCEL' && !['XLS', 'XLSX', 'CSV'].includes(ext)) return false;
        if (selectedFileType === 'CANVA' && ext !== 'CANVA') return false;
        if (selectedFileType === 'ARCHIVES' && !['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) return false;
        if (
          selectedFileType === 'OTHER' &&
          ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'CSV', 'CANVA', 'ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)
        ) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.fileName.toLowerCase().includes(q) ||
          (item.extension && item.extension.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return timeB - timeA;
    });
  }, [fileItems, selectedSenderId, dateFrom, dateTo, selectedFileType, searchQuery]);

  // Filtered Photos inside Selected Album
  const filteredAlbumPhotos = useMemo(() => {
    if (!selectedAlbum?.photos) return [];
    return selectedAlbum.photos.filter((p) => {
      if (selectedAlbumSenderId !== 'ALL' && p.uploader?.user?.id !== selectedAlbumSenderId) {
        return false;
      }
      if (!isWithinDateRange(p.createdAt, albumDateFrom, albumDateTo)) {
        return false;
      }
      if (albumSearchQuery.trim()) {
        const q = albumSearchQuery.toLowerCase();
        const uploaderName = p.uploader?.user?.profile?.displayName?.toLowerCase() || '';
        const caption = p.caption?.toLowerCase() || '';
        return uploaderName.includes(q) || caption.includes(q);
      }
      return true;
    });
  }, [selectedAlbum, selectedAlbumSenderId, albumDateFrom, albumDateTo, albumSearchQuery]);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusNotice({ type, message });
    statusTimerRef.current = setTimeout(() => setStatusNotice(null), 3000);
  };

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      const data = await getAlbumsApi(circleId);
      setAlbums(data);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadAlbumsError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMediaHub = async () => {
    try {
      setIsLoadingHub(true);
      const data = await getMediaHubApi(circleId);
      setMediaHub(data);
    } catch (err: any) {
      showNotice(err?.message || t.common.error, 'error');
    } finally {
      setIsLoadingHub(false);
    }
  };

  useEffect(() => {
    loadAlbums();
    loadMediaHub();
  }, [circleId]);

  const loadAlbumDetail = async (albumId: string) => {
    try {
      setIsLoading(true);
      const data = await getAlbumDetailApi(circleId, albumId);
      setSelectedAlbum(data);
      setSelectedAlbumSenderId('ALL');
      setAlbumDateFrom('');
      setAlbumDateTo('');
      setAlbumSearchQuery('');
      setIsSelectionMode(false);
      setSelectedPhotoIds(new Set());
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadAlbumDetailError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create album (only Album Name, description removed per user requirement)
  const handleCreateAlbum = async () => {
    if (!albumTitle.trim()) {
      setFormError(t.collab.enterAlbumNameError);
      return;
    }
    try {
      setIsCreating(true);
      await createAlbumApi(circleId, {
        albumTitle: albumTitle.trim(),
      });
      setAlbumTitle('');
      setIsCreateModalOpen(false);
      showNotice(t.collab.albumCreatedSuccess || 'Đã tạo album mới!', 'success');
      loadAlbums();
    } catch (err: any) {
      setFormError(err?.message || t.collab.createAlbumError);
    } finally {
      setIsCreating(false);
    }
  };

  // In-place rename album title
  const handleSaveAlbumTitle = async () => {
    if (!selectedAlbum) return;
    const trimmed = editingAlbumTitleText.trim();
    if (!trimmed || trimmed === selectedAlbum.albumTitle) {
      setIsEditingAlbumTitle(false);
      return;
    }
    try {
      await updateAlbumApi(circleId, selectedAlbum.id, {
        albumTitle: trimmed,
        description: selectedAlbum.description || undefined,
      });
      setSelectedAlbum((prev) => (prev ? { ...prev, albumTitle: trimmed } : null));
      showNotice(t.collab.editAlbumSave || 'Đã lưu thay đổi!', 'success');
      loadAlbums();
    } catch (err: any) {
      showNotice(err?.message || (t.collab.renameAlbumError || 'Không thể đổi tên album'), 'error');
    } finally {
      setIsEditingAlbumTitle(false);
    }
  };

  // Delete entire album
  const handleConfirmDeleteAlbum = async () => {
    if (!selectedAlbum) return;
    try {
      setIsDeletingAlbum(true);
      await deleteAlbumApi(circleId, selectedAlbum.id);
      setSelectedAlbum(null);
      setIsConfirmingDeleteAlbum(false);
      showNotice(t.common.deleteSuccess || 'Đã xóa album', 'success');
      loadAlbums();
    } catch (err: any) {
      showNotice(err?.message || t.collab.deleteAlbumError, 'error');
    } finally {
      setIsDeletingAlbum(false);
    }
  };

  // Add photos to album
  const handlePickAndUploadPhotos = async () => {
    if (!selectedAlbum) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showNotice(t.collab.permissionDenied || 'Cần cấp quyền truy cập ảnh', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      setIsUploading(true);
      const uploadedPhotos: { fileUrl: string; caption?: string }[] = [];

      for (const asset of result.assets) {
        try {
          const uploadedRes = await uploadMobileMedia({ folder: 'albums', uri: asset.uri });
          uploadedPhotos.push({ fileUrl: uploadedRes.publicUrl });
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr);
        }
      }

      if (uploadedPhotos.length === 0) {
        showNotice(t.collab.uploadPhotoAlbumError, 'error');
        return;
      }

      await addPhotosApi(circleId, selectedAlbum.id, { photos: uploadedPhotos });
      await loadAlbumDetail(selectedAlbum.id);
      showNotice(t.collab.albumUploadSuccess || 'Đã thêm ảnh vào album!', 'success');
      loadAlbums();
    } catch (err: any) {
      showNotice(err?.message || t.collab.uploadPhotoAlbumError, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete single photo
  const handleConfirmDeletePhoto = async () => {
    if (!selectedPhoto || !selectedAlbum) return;
    try {
      setIsDeletingPhoto(true);
      await deletePhotoApi(circleId, selectedPhoto.id);
      setIsConfirmingDeletePhoto(false);
      setSelectedPhotoIndex(null);
      await loadAlbumDetail(selectedAlbum.id);
      showNotice(t.common.deleteSuccess || 'Đã xóa ảnh', 'success');
      loadAlbums();
    } catch (err: any) {
      showNotice(err?.message || t.common.error, 'error');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Multi-select toggle
  const handleToggleSelectPhoto = (photoId: string) => {
    Haptics.selectionAsync();
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  // Batch delete selected photos
  const handleBatchDeletePhotos = () => {
    if (selectedPhotoIds.size === 0 || !selectedAlbum) return;
    const count = selectedPhotoIds.size;
    const confirmMsg = t.collab.batchDeletePhotosConfirm
      ? t.collab.batchDeletePhotosConfirm.replace('{count}', String(count))
      : `Bạn có chắc chắn muốn xóa ${count} ảnh đã chọn khỏi album này?`;

    Alert.alert(
      t.collab.deletePhotoTitle,
      confirmMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            setIsBatchDeleting(true);
            try {
              await Promise.all(
                Array.from(selectedPhotoIds).map((pId) => deletePhotoApi(circleId, pId)),
              );
              setSelectedAlbum((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  photos: (prev.photos || []).filter((p) => !selectedPhotoIds.has(p.id)),
                };
              });
              setSelectedPhotoIds(new Set());
              setIsSelectionMode(false);
              showNotice(
                (t.collab.batchDeletePhotosSuccess || 'Đã xóa {count} ảnh khỏi album').replace(
                  '{count}',
                  String(count),
                ),
                'success',
              );
              loadAlbums();
            } catch (err: any) {
              showNotice(err?.message || t.common.error, 'error');
            } finally {
              setIsBatchDeleting(false);
            }
          },
        },
      ],
    );
  };

  // Reverse Image Search / Camera button
  const handleImageSearch = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showNotice(t.collab.permissionDenied || 'Cần cấp quyền truy cập ảnh', 'error');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.6,
      });
      if (result.canceled || !result.assets?.length) return;
      showNotice(t.collab.imageSearchComingSoon || 'Tính năng tìm kiếm bằng hình ảnh đang được xử lý', 'success');
    } catch {
      showNotice(t.collab.imageSearchComingSoon || 'Tính năng tìm kiếm bằng hình ảnh đang được hoàn thiện', 'success');
    }
  };

  const handleCopyLink = async (id: string, url: string) => {
    await copyTextSafe(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedLinkId(id);
    showNotice(t.collab.copyLinkSuccess, 'success');
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleDownloadFile = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showNotice(t.common.error, 'error');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderNoticeBanner = () =>
    statusNotice ? (
      <View pointerEvents="none" style={[styles.noticeWrapper, { top: topHeaderTop + 46 }]}>
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: statusNotice.type === 'error' ? colors.danger : colors.primary,
              borderColor: colors.hairline,
            },
          ]}
        >
          <Text style={[styles.noticeText, { color: '#FFFFFF' }]}>{statusNotice.message}</Text>
        </View>
      </View>
    ) : null;

  // Calendar Day Pad
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatShortDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dStr;
  };

  // Reusable Calendar Picker Modal
  const renderCalendarPickerModal = (
    visible: boolean,
    onClose: () => void,
    dFrom: string,
    setDFrom: (s: string) => void,
    dTo: string,
    setDTo: (s: string) => void,
    actField: 'from' | 'to',
    setActField: (f: 'from' | 'to') => void,
    pMonth: Date,
    setPMonth: React.Dispatch<React.SetStateAction<Date>>,
    onApply: (f: string, t: string) => void,
  ) => {
    const year = pMonth.getFullYear();
    const month = pMonth.getMonth(); // 0-11
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex < 0) firstDayIndex = 6;

    const weekdays = locale === 'vi'
      ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const handleSelectDay = (day: number) => {
      const dayKey = `${year}-${pad(month + 1)}-${pad(day)}`;
      if (actField === 'from') {
        setDFrom(dayKey);
        setActField('to');
      } else {
        if (dFrom && dayKey < dFrom) {
          setDFrom(dayKey);
          setDTo('');
        } else {
          setDTo(dayKey);
        }
      }
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.dateModalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
                paddingBottom: Math.max(insets.bottom + 16, 20),
              },
            ]}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                {t.collab.filterDateTitle}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {/* From / To Date Selection Tabs */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActField('from')}
                style={[
                  styles.dateFieldBtn,
                  actField === 'from'
                    ? { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(13,148,136,0.18)' : 'rgba(13,148,136,0.08)' }
                    : { borderColor: colors.hairline, backgroundColor: colors.canvas },
                ]}
              >
                <Text style={{ fontSize: 11, color: colors.subtle, fontWeight: '600' }}>
                  {t.collab.filterDateFrom}:
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: dFrom ? colors.text : colors.subtle }}>
                  {dFrom ? formatShortDate(dFrom) : t.collab.filterDateFrom}
                </Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 12, color: colors.subtle, fontWeight: '700' }}>—</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActField('to')}
                style={[
                  styles.dateFieldBtn,
                  actField === 'to'
                    ? { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(13,148,136,0.18)' : 'rgba(13,148,136,0.08)' }
                    : { borderColor: colors.hairline, backgroundColor: colors.canvas },
                ]}
              >
                <Text style={{ fontSize: 11, color: colors.subtle, fontWeight: '600' }}>
                  {t.collab.filterDateTo}:
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: dTo ? formatShortDate(dTo) : colors.subtle }}>
                  {dTo ? formatShortDate(dTo) : t.collab.filterDateTo}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 }}>
              <TouchableOpacity
                onPress={() => setPMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
                style={{ padding: 6, borderRadius: 8, backgroundColor: colors.wash }}
              >
                <ChevronLeft size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {locale === 'vi' ? `Tháng ${pad(month + 1)}, ${year}` : `Month ${pad(month + 1)}, ${year}`}
              </Text>
              <TouchableOpacity
                onPress={() => setPMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
                style={{ padding: 6, borderRadius: 8, backgroundColor: colors.wash }}
              >
                <ChevronRight size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              {weekdays.map((w) => (
                <View key={w} style={{ width: (width - 76) / 7, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtle }}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <View key={`blank-${i}`} style={{ width: (width - 76) / 7, height: 34 }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayKey = `${year}-${pad(month + 1)}-${pad(day)}`;
                const isFrom = dayKey === dFrom;
                const isTo = dayKey === dTo;
                const isSelected = isFrom || isTo;
                const isInRange = Boolean(dFrom && dTo && dayKey > dFrom && dayKey < dTo);

                return (
                  <TouchableOpacity
                    key={dayKey}
                    activeOpacity={0.7}
                    onPress={() => handleSelectDay(day)}
                    style={{
                      width: (width - 76) / 7,
                      height: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={[
                        {
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                        isSelected && { backgroundColor: colors.primary },
                        isInRange && { backgroundColor: isDark ? 'rgba(13,148,136,0.22)' : 'rgba(13,148,136,0.12)' },
                      ]}
                    >
                      <Text
                        style={[
                          { fontSize: 12, fontWeight: '600', color: colors.text },
                          isSelected && { color: '#FFFFFF', fontWeight: '700' },
                          isInRange && { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Buttons: Xóa on left, Xong on right */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 14,
                paddingTop: 10,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.hairline,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setDFrom('');
                  setDTo('');
                }}
                style={{ paddingVertical: 8, paddingHorizontal: 12 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger }}>
                  {t.common.clear || 'Xóa'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onApply(dFrom, dTo)}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  {t.common.done || 'Xong'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Reusable Sender Filter Modal
  const renderSenderFilterModal = (
    visible: boolean,
    onClose: () => void,
    senderList: { id: string; name: string }[],
    currentSenderId: string,
    onSelectSender: (sId: string) => void,
    searchVal: string,
    setSearchVal: (s: string) => void,
  ) => {
    const filteredSenders = senderList.filter((s) =>
      s.name.toLowerCase().includes(searchVal.trim().toLowerCase()),
    );

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: Math.max(insets.bottom + 16, 24),
              maxHeight: '65%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                {t.collab.filterBySender}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {/* Search sender input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.canvas,
                borderRadius: 12,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.hairline,
                paddingHorizontal: 10,
                height: 38,
                marginBottom: 12,
                gap: 6,
              }}
            >
              <Search size={14} color={colors.subtle} />
              <TextInput
                value={searchVal}
                onChangeText={setSearchVal}
                placeholder={t.collab.searchSendersPlaceholder}
                placeholderTextColor={colors.subtle}
                style={{ flex: 1, fontSize: 13, color: colors.text, paddingVertical: 0 }}
              />
              {searchVal.length > 0 && (
                <TouchableOpacity onPress={() => setSearchVal('')}>
                  <X size={13} color={colors.subtle} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Option: ALL */}
              <TouchableOpacity
                onPress={() => {
                  onSelectSender('ALL');
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: currentSenderId === 'ALL' ? '700' : '500',
                    color: currentSenderId === 'ALL' ? colors.primary : colors.text,
                  }}
                >
                  {t.collab.filterAllSenders}
                </Text>
                {currentSenderId === 'ALL' && <Check size={16} color={colors.primary} />}
              </TouchableOpacity>

              {/* Sender items */}
              {filteredSenders.map((sender) => {
                const isSelected = currentSenderId === sender.id;
                return (
                  <TouchableOpacity
                    key={sender.id}
                    onPress={() => {
                      onSelectSender(sender.id);
                      onClose();
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.hairline,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: isDark ? 'rgba(13,148,136,0.2)' : 'rgba(13,148,136,0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                          {sender.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? colors.primary : colors.text,
                        }}
                      >
                        {sender.name}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // =========================================================================
  // VIEW: ALBUM DETAIL
  // =========================================================================
  if (selectedAlbum) {
    const creatorName =
      selectedAlbum.creator?.user?.profile?.displayName || t.collab.memberDefault;
    const countText = t.collab.albumPhotoUnit.replace(
      '{count}',
      String(selectedAlbum.photos?.length || 0),
    );
    const creatorText = t.collab.calendarCreatorLabel.replace('{name}', creatorName);

    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        {renderNoticeBanner()}

        {/* Pinned Top Header Row for Album Detail */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: topHeaderTop,
            left: 14,
            right: 14,
            zIndex: 40,
            gap: 8,
          }}
        >
          {/* Row 1: Back Button + Editable Title + Chọn + Thêm + Xóa */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Back button (< icon only) */}
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                setIsConfirmingDeleteAlbum(false);
                setIsSelectionMode(false);
                setSelectedPhotoIds(new Set());
                setSelectedAlbum(null);
                loadAlbums();
              }}
              style={[
                styles.headerIconBtn,
                { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
              ]}
              accessibilityLabel={t.common.back}
            >
              <ArrowLeft size={16} color={colors.text} />
            </TouchableOpacity>

            {/* Inline Editable Album Title */}
            <View
              style={{
                flex: 1,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isEditingAlbumTitle ? colors.primary : (isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline),
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                gap: 6,
              }}
            >
              {isEditingAlbumTitle ? (
                <TextInput
                  value={editingAlbumTitleText}
                  onChangeText={setEditingAlbumTitleText}
                  onBlur={handleSaveAlbumTitle}
                  onSubmitEditing={handleSaveAlbumTitle}
                  returnKeyType="done"
                  autoFocus
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.text,
                    paddingVertical: 0,
                  }}
                />
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingAlbumTitleText(selectedAlbum.albumTitle);
                    setIsEditingAlbumTitle(true);
                  }}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 13, fontWeight: '700', color: colors.text, maxWidth: width - 240 }}
                  >
                    {selectedAlbum.albumTitle}
                  </Text>
                  <Pencil size={12} color={colors.subtle} />
                </TouchableOpacity>
              )}
              {isEditingAlbumTitle && (
                <TouchableOpacity onPress={handleSaveAlbumTitle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Check size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Multi-select ("Chọn") button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setIsSelectionMode((prev) => !prev);
                setSelectedPhotoIds(new Set());
              }}
              style={[
                styles.actionPillBtn,
                isSelectionMode
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)', borderColor: colors.hairline },
              ]}
            >
              <Text
                style={[
                  styles.actionPillText,
                  { color: isSelectionMode ? colors.onPrimary : colors.text },
                ]}
              >
                {t.collab.selectAction || 'Chọn'}
              </Text>
            </TouchableOpacity>

            {/* Thêm ảnh Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickAndUploadPhotos}
              disabled={isUploading}
              style={[styles.actionPillBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <UploadCloud size={13} color={colors.onPrimary} />
                  <Text style={[styles.actionPillText, { color: colors.onPrimary }]}>
                    {t.collab.addPhotosBtn}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Xóa Album Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setIsConfirmingDeleteAlbum(true)}
              style={[
                styles.headerIconBtn,
                { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
              ]}
              accessibilityLabel={t.collab.deleteAlbumTitle}
            >
              <Trash2 size={15} color={colors.danger} />
            </TouchableOpacity>
          </View>

          {/* Row 2: Search in album + Sender + Date Filter inside Album */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                flex: 1,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                gap: 6,
              }}
            >
              <Search size={13} color={colors.subtle} />
              <TextInput
                value={albumSearchQuery}
                onChangeText={setAlbumSearchQuery}
                placeholder={t.collab.searchMediaPlaceholder}
                placeholderTextColor={colors.subtle}
                style={{ flex: 1, fontSize: 11, color: colors.text, paddingVertical: 0 }}
              />
              {albumSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setAlbumSearchQuery('')}>
                  <X size={12} color={colors.subtle} />
                </TouchableOpacity>
              )}
            </View>

            {albumSenders.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsAlbumSenderModalOpen(true)}
                style={[
                  styles.headerSmallBtn,
                  selectedAlbumSenderId !== 'ALL' && { backgroundColor: colors.primary },
                  selectedAlbumSenderId === 'ALL' && { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
                ]}
              >
                <Filter size={12} color={selectedAlbumSenderId !== 'ALL' ? colors.onPrimary : colors.subtle} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAlbumDraftFrom(albumDateFrom);
                setAlbumDraftTo(albumDateTo);
                setAlbumActiveDateField('from');
                setIsAlbumDateModalOpen(true);
              }}
              style={[
                styles.headerSmallBtn,
                (albumDateFrom || albumDateTo) && { backgroundColor: colors.primary },
                (!albumDateFrom && !albumDateTo) && { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
              ]}
            >
              <Calendar size={12} color={(albumDateFrom || albumDateTo) ? colors.onPrimary : colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline 2-step Confirm Bar for Deleting Album */}
        {isConfirmingDeleteAlbum && (
          <View
            style={[
              styles.inlineConfirmCard,
              {
                top: topHeaderTop + 86,
                backgroundColor: colors.surface,
                borderColor: '#DC2626',
              },
            ]}
          >
            <Text style={[styles.inlineConfirmText, { color: colors.text }]}>
              {t.collab.deleteAlbumConfirm}
            </Text>
            <View style={styles.inlineConfirmActions}>
              <TouchableOpacity
                disabled={isDeletingAlbum}
                onPress={() => setIsConfirmingDeleteAlbum(false)}
                style={[styles.inlineCancelBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
              >
                <Text style={[styles.inlineCancelText, { color: colors.text }]}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isDeletingAlbum}
                onPress={handleConfirmDeleteAlbum}
                style={styles.inlineDangerBtn}
              >
                {isDeletingAlbum ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.inlineDangerText}>{t.common.delete}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Photos Grid with scroll-under header */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: topHeaderTop + 96 }} />
        ) : (
          <FlatList
            data={filteredAlbumPhotos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={[
              styles.photosGrid,
              {
                paddingTop: topHeaderTop + 88 + (isConfirmingDeleteAlbum ? 88 : 0),
                paddingBottom: Math.max(insets.bottom + 40, 60),
              },
            ]}
            ListHeaderComponent={
              <View style={[styles.albumMetaPill, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, { color: colors.subtle }]}>{countText}</Text>
                  <Text style={[styles.metaDot, { color: colors.subtle }]}>•</Text>
                  <Text style={[styles.metaText, { color: colors.subtle }]}>{creatorText}</Text>
                </View>
              </View>
            }
            renderItem={({ item, index }) => {
              const isSelected = selectedPhotoIds.has(item.id);
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isSelectionMode) {
                      handleToggleSelectPhoto(item.id);
                    } else {
                      setSelectedPhotoIndex(index);
                    }
                  }}
                  style={[styles.photoThumbWrapper, isSelected && { borderWidth: 2, borderColor: colors.primary }]}
                >
                  <Image source={{ uri: item.fileUrl }} style={styles.photoThumb} />
                  {isSelectionMode && (
                    <View
                      style={[
                        styles.selectCheckbox,
                        isSelected
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: 'rgba(0,0,0,0.4)', borderColor: '#FFFFFF' },
                      ]}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ImageIcon size={48} color={colors.subtle} />
                <Text style={styles.emptyTitle}>{t.collab.albumEmptyPhotosTitle}</Text>
                <Text style={styles.emptySub}>{t.collab.albumEmptyPhotosDesc}</Text>
                <TouchableOpacity
                  style={[styles.createEmptyBtn, { backgroundColor: colors.primary }]}
                  onPress={handlePickAndUploadPhotos}
                >
                  <Plus size={16} color={colors.onPrimary} />
                  <Text style={[styles.createEmptyText, { color: colors.onPrimary }]}>
                    {t.collab.albumUploadNow}
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Bottom Floating Batch Delete Action Bar in Album Detail */}
        {isSelectionMode && selectedPhotoIds.size > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: bottomDockBottom,
              left: 20,
              right: 20,
              zIndex: 45,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: 999,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: colors.hairline,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.4 : 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              {(t.collab.batchDeletePhotosAction || 'Xóa ({count})').replace(
                '{count}',
                String(selectedPhotoIds.size),
              )}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleBatchDeletePhotos}
              disabled={isBatchDeleting}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#DC2626',
                paddingVertical: 7,
                paddingHorizontal: 14,
                borderRadius: 999,
              }}
            >
              {isBatchDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={14} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                    {t.common.delete}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Sender Filter Modal in Album */}
        {renderSenderFilterModal(
          isAlbumSenderModalOpen,
          () => setIsAlbumSenderModalOpen(false),
          albumSenders,
          selectedAlbumSenderId,
          (sId) => setSelectedAlbumSenderId(sId),
          albumSenderSearchQuery,
          setAlbumSenderSearchQuery,
        )}

        {/* Date Range Filter Modal in Album */}
        {renderCalendarPickerModal(
          isAlbumDateModalOpen,
          () => setIsAlbumDateModalOpen(false),
          albumDraftFrom,
          setAlbumDraftFrom,
          albumDraftTo,
          setAlbumDraftTo,
          albumActiveDateField,
          setAlbumActiveDateField,
          albumPickerMonth,
          setAlbumPickerMonth,
          (f, to) => {
            setAlbumDateFrom(f);
            setAlbumDateTo(to);
            setIsAlbumDateModalOpen(false);
          },
        )}

        {/* Photo Lightbox */}
        {selectedPhoto && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
            <View style={styles.lightboxBackdrop}>
              <View style={styles.lightboxHeader}>
                <View style={styles.lightboxCounterBadge}>
                  <Text style={styles.lightboxCounterText}>
                    {(selectedPhotoIndex ?? 0) + 1} / {photos.length}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.lightboxCloseBtn}
                  onPress={() => {
                    setIsConfirmingDeletePhoto(false);
                    setSelectedPhoto(null);
                  }}
                  accessibilityLabel={t.common.close}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Image source={{ uri: selectedPhoto.fileUrl }} style={styles.lightboxImage} resizeMode="contain" />

              <View style={[styles.lightboxFooter, { bottom: Math.max(insets.bottom + 20, 30) }]}>
                {isConfirmingDeletePhoto ? (
                  <View style={styles.lightboxConfirmRow}>
                    <Text style={styles.lightboxConfirmText}>{t.collab.deletePhotoConfirm}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        disabled={isDeletingPhoto}
                        onPress={() => setIsConfirmingDeletePhoto(false)}
                        style={styles.lightboxCancelBtn}
                      >
                        <Text style={styles.lightboxCancelText}>{t.common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={isDeletingPhoto}
                        onPress={handleConfirmDeletePhoto}
                        style={styles.deletePhotoBtn}
                      >
                        {isDeletingPhoto ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.deletePhotoText}>{t.common.delete}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.lightboxCaption}>
                      {selectedPhoto.caption ||
                        t.collab.albumUploadedBy.replace(
                          '{name}',
                          selectedPhoto.uploader?.user?.profile?.displayName || t.collab.memberDefault,
                        )}
                    </Text>
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => setIsConfirmingDeletePhoto(true)}
                      accessibilityLabel={t.collab.albumDeletePhoto}
                    >
                      <Trash2 size={14} color="#FFFFFF" />
                      <Text style={styles.deletePhotoText}>{t.common.delete}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // =========================================================================
  // VIEW: ALBUMS & MEDIA HUB LIST
  // =========================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {renderNoticeBanner()}

      {/* Pinned Top Header Row in Media Hub: Back + Search + Camera + Sender + Date */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topHeaderTop,
          left: 14,
          right: 14,
          zIndex: 40,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Clean Back Button (< icon only, NO "Tiện ích nhóm" text!) */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onBack?.()}
            style={[
              styles.headerIconBtn,
              { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
            ]}
            accessibilityLabel={t.common.back}
          >
            <ArrowLeft size={16} color={colors.text} />
          </TouchableOpacity>

          {/* Search Input Bar (flex: 1) */}
          <View
            style={{
              flex: 1,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              gap: 6,
            }}
          >
            <Search size={14} color={colors.subtle} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activeTab === 'media'
                  ? t.collab.searchMediaPlaceholder
                  : activeTab === 'links'
                  ? t.collab.searchLinksPlaceholder
                  : t.collab.searchFilesPlaceholder
              }
              placeholderTextColor={colors.subtle}
              style={{
                flex: 1,
                fontSize: 12,
                color: colors.text,
                paddingVertical: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={13} color={colors.subtle} />
              </TouchableOpacity>
            )}
          </View>

          {/* Camera Button (Visual Search) in media tab */}
          {activeTab === 'media' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleImageSearch}
              style={[
                styles.headerIconBtn,
                { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
              ]}
              accessibilityLabel={t.collab.imageSearchBtn}
            >
              <Camera size={15} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Sender Filter Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFilterModalOpen(true)}
            style={[
              styles.headerIconBtn,
              selectedSenderId !== 'ALL'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
            ]}
            accessibilityLabel={t.collab.filterBySender}
          >
            <Filter size={14} color={selectedSenderId !== 'ALL' ? colors.onPrimary : colors.subtle} />
          </TouchableOpacity>

          {/* Date Range Filter Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setDraftFrom(dateFrom);
              setDraftTo(dateTo);
              setActiveDateField('from');
              setIsDateModalOpen(true);
            }}
            style={[
              styles.headerIconBtn,
              (dateFrom || dateTo)
                ? { backgroundColor: colors.primary }
                : { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
            ]}
            accessibilityLabel={t.collab.filterDateBtn}
          >
            <Calendar size={14} color={(dateFrom || dateTo) ? colors.onPrimary : colors.subtle} />
          </TouchableOpacity>
        </View>

        {/* Row 2 for Files Tab: File Type Filter Chips */}
        {activeTab === 'files' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
            {[
              { key: 'ALL', label: t.collab.filterAllTypes },
              { key: 'PDF', label: t.collab.fileTypePdf },
              { key: 'WORD', label: t.collab.fileTypeWord },
              { key: 'EXCEL', label: t.collab.fileTypeExcel },
              { key: 'CANVA', label: t.collab.fileTypeCanva },
              { key: 'ARCHIVES', label: t.collab.fileTypeArchives },
              { key: 'OTHER', label: t.collab.fileTypeOther },
            ].map((ft) => (
              <TouchableOpacity
                key={ft.key}
                activeOpacity={0.8}
                onPress={() => setSelectedFileType(ft.key as any)}
                style={[
                  styles.chipBtn,
                  selectedFileType === ft.key
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.hairline },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedFileType === ft.key ? colors.onPrimary : colors.text },
                  ]}
                >
                  {ft.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Main Content Area: Scroll-under Top Header and Bottom Tab Dock */}
      <View style={{ flex: 1 }}>
        {/* ===================================================================== */}
        {/* TAB 1: FILE PHƯƠNG TIỆN (ALBUM CUỘN NGANG + TẤT CẢ FILE CỘT DỌC)      */}
        {/* ===================================================================== */}
        {activeTab === 'media' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: topHeaderTop + 48,
                paddingBottom: bottomDockBottom + 56,
              },
            ]}
          >
            {/* Section 1: Album (Cuộn ngang - Horizontal Carousel) */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FolderOpen size={16} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    {t.collab.subtabAlbums}
                  </Text>
                  <View style={{ backgroundColor: colors.wash, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.subtle }}>
                      {filteredAlbums.length}
                    </Text>
                  </View>
                  {/* Dấu cộng bên cạnh album */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setFormError(null);
                      setIsCreateModalOpen(true);
                    }}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 4,
                    }}
                    accessibilityLabel={t.collab.createAlbum}
                  >
                    <Plus size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Scroll for Albums */}
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.sage} style={{ marginVertical: 20 }} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                >
                  {/* Quick Add Card (when 0 albums) */}
                  {filteredAlbums.length === 0 && (
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        setFormError(null);
                        setIsCreateModalOpen(true);
                      }}
                      style={{
                        width: 110,
                        height: 120,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderStyle: 'dashed',
                        borderColor: colors.hairline,
                        backgroundColor: colors.wash,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={16} color={colors.primary} />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                        {t.collab.createAlbum}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Album Cards */}
                  {filteredAlbums.map((album) => {
                    const coverUrl = album.photos?.[0]?.fileUrl;
                    const photoCount = album._count?.photos || album.photos?.length || 0;
                    return (
                      <TouchableOpacity
                        key={album.id}
                        activeOpacity={0.85}
                        onPress={() => loadAlbumDetail(album.id)}
                        style={{
                          width: 140,
                          height: 120,
                          borderRadius: 14,
                          overflow: 'hidden',
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.hairline,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDark ? 0.25 : 0.08,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <View style={{ flex: 1, backgroundColor: colors.wash }}>
                          {coverUrl ? (
                            <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              <FolderOpen size={28} color={colors.subtle} />
                            </View>
                          )}
                          <View
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
                              {photoCount}
                            </Text>
                          </View>
                        </View>
                        <View style={{ padding: 8, backgroundColor: colors.surface }}>
                          <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                            {album.albumTitle}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Section 2: Tất cả file phương tiện (Lưới cột dọc trải dài) */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <ImageIcon size={16} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {t.collab.subtabAllMedia}
                </Text>
                <View style={{ backgroundColor: colors.wash, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.subtle }}>
                    {filteredMediaItems.length}
                  </Text>
                </View>
              </View>

              {isLoadingHub ? (
                <ActivityIndicator size="small" color={colors.sage} style={{ marginVertical: 30 }} />
              ) : filteredMediaItems.length === 0 ? (
                <View style={[styles.emptyContainer, { paddingVertical: 40 }]}>
                  <ImageIcon size={44} color={colors.subtle} />
                  <Text style={styles.emptyTitle}>{t.collab.emptyAllMediaTitle}</Text>
                  <Text style={styles.emptySub}>{t.collab.emptyAllMediaDesc}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {filteredMediaItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedHubPhoto(item)}
                      style={{
                        width: photoSize,
                        height: photoSize,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: colors.wash,
                      }}
                    >
                      <Image source={{ uri: item.fileUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                        }}
                      >
                        <Text numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '600' }}>
                          {item.uploader?.user?.profile?.displayName || t.collab.memberDefault}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: FILE LIÊN KẾT                                                  */}
        {/* ===================================================================== */}
        {activeTab === 'links' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: topHeaderTop + 48,
                paddingBottom: bottomDockBottom + 56,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Link2 size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                {t.collab.tabLinks}
              </Text>
              <View style={{ backgroundColor: colors.wash, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.subtle }}>
                  {filteredLinkItems.length}
                </Text>
              </View>
            </View>

            {isLoadingHub ? (
              <ActivityIndicator size="small" color={colors.sage} style={{ marginVertical: 40 }} />
            ) : filteredLinkItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Link2 size={44} color={colors.subtle} />
                <Text style={styles.emptyTitle}>{t.collab.emptyLinksTitle}</Text>
                <Text style={styles.emptySub}>{t.collab.emptyLinksDesc}</Text>
              </View>
            ) : (
              filteredLinkItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.linkCard,
                    { backgroundColor: colors.surface, borderColor: colors.hairline },
                  ]}
                >
                  <View style={[styles.linkIconCircle, { backgroundColor: colors.wash }]}>
                    <Globe size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={[styles.linkDomain, { color: colors.text }]}>
                      {item.domain}
                    </Text>
                    <Text numberOfLines={1} style={[styles.linkUrl, { color: colors.subtle }]}>
                      {item.url}
                    </Text>
                    <Text style={[styles.linkSender, { color: colors.subtle, marginTop: 2 }]}>
                      {item.sender?.user?.profile?.displayName || t.collab.memberDefault} •{' '}
                      {new Date(item.sentAt).toLocaleDateString(dateLocale)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleCopyLink(item.id, item.url)}
                      style={[styles.linkActionBtn, { backgroundColor: colors.wash }]}
                      accessibilityLabel={t.collab.copyLinkAction}
                    >
                      {copiedLinkId === item.id ? (
                        <Check size={14} color={colors.primary} />
                      ) : (
                        <Copy size={14} color={colors.subtle} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(item.url)}
                      style={[styles.linkActionBtn, { backgroundColor: colors.wash }]}
                      accessibilityLabel={t.collab.openLinkAction}
                    >
                      <ExternalLink size={14} color={colors.subtle} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: FILE TÀI LIỆU                                                  */}
        {/* ===================================================================== */}
        {activeTab === 'files' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: topHeaderTop + 84,
                paddingBottom: bottomDockBottom + 56,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <FileText size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                {t.collab.tabFiles}
              </Text>
              <View style={{ backgroundColor: colors.wash, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.subtle }}>
                  {filteredFileItems.length}
                </Text>
              </View>
            </View>

            {isLoadingHub ? (
              <ActivityIndicator size="small" color={colors.sage} style={{ marginVertical: 40 }} />
            ) : filteredFileItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FileText size={44} color={colors.subtle} />
                <Text style={styles.emptyTitle}>{t.collab.emptyFilesTitle}</Text>
                <Text style={styles.emptySub}>{t.collab.emptyFilesDesc}</Text>
              </View>
            ) : (
              filteredFileItems.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.linkCard,
                    { backgroundColor: colors.surface, borderColor: colors.hairline },
                  ]}
                >
                  <View style={[styles.fileExtBadge, { backgroundColor: colors.wash }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                      {(item.extension || 'FILE').toUpperCase().slice(0, 4)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={[styles.linkDomain, { color: colors.text }]}>
                      {item.fileName}
                    </Text>
                    <Text style={[styles.linkUrl, { color: colors.subtle }]}>
                      {formatFileSize(item.fileSize ?? undefined)} • {new Date(item.sentAt).toLocaleDateString(dateLocale)}
                    </Text>
                    <Text style={[styles.linkSender, { color: colors.subtle, marginTop: 2 }]}>
                      {item.sender?.user?.profile?.displayName || t.collab.memberDefault}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDownloadFile(item.fileUrl)}
                    style={[styles.linkActionBtn, { backgroundColor: colors.wash }]}
                    accessibilityLabel={t.collab.downloadFileAction}
                  >
                    <Download size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* ======================================================================= */}
      {/* BOTTOM TAB DOCK: 3 TABS (File phương tiện, File liên kết, File)         */}
      {/* ======================================================================= */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: bottomDockBottom,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 40,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            borderRadius: 999,
            backgroundColor: isDark ? 'rgba(29, 29, 33, 0.94)' : 'rgba(255, 255, 255, 0.95)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('media')}
            style={[
              styles.bottomTabBtn,
              activeTab === 'media' && { backgroundColor: colors.primary },
            ]}
          >
            <ImageIcon size={14} color={activeTab === 'media' ? colors.onPrimary : colors.subtle} />
            <Text
              style={[
                styles.bottomTabText,
                { color: activeTab === 'media' ? colors.onPrimary : colors.text },
              ]}
            >
              {t.collab.tabMedia}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('links')}
            style={[
              styles.bottomTabBtn,
              activeTab === 'links' && { backgroundColor: colors.primary },
            ]}
          >
            <Link2 size={14} color={activeTab === 'links' ? colors.onPrimary : colors.subtle} />
            <Text
              style={[
                styles.bottomTabText,
                { color: activeTab === 'links' ? colors.onPrimary : colors.text },
              ]}
            >
              {t.collab.tabLinks}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('files')}
            style={[
              styles.bottomTabBtn,
              activeTab === 'files' && { backgroundColor: colors.primary },
            ]}
          >
            <FileText size={14} color={activeTab === 'files' ? colors.onPrimary : colors.subtle} />
            <Text
              style={[
                styles.bottomTabText,
                { color: activeTab === 'files' ? colors.onPrimary : colors.text },
              ]}
            >
              {t.collab.tabFiles}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Sender Filter Modal */}
      {renderSenderFilterModal(
        isFilterModalOpen,
        () => setIsFilterModalOpen(false),
        uniqueSenders,
        selectedSenderId,
        (sId) => setSelectedSenderId(sId),
        senderSearchQuery,
        setSenderSearchQuery,
      )}

      {/* Global Date Range Filter Modal */}
      {renderCalendarPickerModal(
        isDateModalOpen,
        () => setIsDateModalOpen(false),
        draftFrom,
        setDraftFrom,
        draftTo,
        setDraftTo,
        activeDateField,
        setActiveDateField,
        pickerMonth,
        setPickerMonth,
        (f, to) => {
          setDateFrom(f);
          setDateTo(to);
          setIsDateModalOpen(false);
        },
      )}

      {/* Create Album Modal (Name only, description removed) */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
                paddingBottom: Math.max(insets.bottom + 16, 20),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.collab.albumCreateModalTitle}</Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setIsCreateModalOpen(false)}
                accessibilityLabel={t.common.close}
              >
                <X size={20} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {formError && (
              <View style={styles.formErrorBox}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.collab.albumNameRequiredLabel}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.canvas, borderColor: colors.hairline, color: colors.text }]}
                placeholder={t.collab.albumNameExample}
                placeholderTextColor={colors.subtle}
                value={albumTitle}
                onChangeText={(txt) => {
                  setAlbumTitle(txt);
                  if (formError) setFormError(null);
                }}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={isCreating}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                disabled={isCreating}
                onPress={handleCreateAlbum}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                    {t.collab.albumCreateSubmit}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Lightbox for Media Hub Photos */}
      {selectedHubPhoto && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedHubPhoto(null)}>
          <View style={styles.lightboxBackdrop}>
            <TouchableOpacity
              style={styles.lightboxCloseBtn}
              onPress={() => setSelectedHubPhoto(null)}
              accessibilityLabel={t.common.close}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Image source={{ uri: selectedHubPhoto.fileUrl }} style={styles.lightboxImage} resizeMode="contain" />

            <View style={[styles.lightboxFooter, { bottom: Math.max(insets.bottom + 20, 30) }]}>
              <Text style={styles.lightboxCaption}>
                {selectedHubPhoto.caption ||
                  t.collab.albumUploadedBy.replace(
                    '{name}',
                    selectedHubPhoto.uploader?.user?.profile?.displayName || t.collab.memberDefault,
                  )}
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean, photoSize: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 14,
    },
    headerIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    headerSmallBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
    },
    bottomTabBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    bottomTabText: {
      fontSize: 12,
      fontWeight: '700',
    },
    chipBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '600',
    },
    actionPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    actionPillText: {
      fontSize: 12,
      fontWeight: '700',
    },
    selectCheckbox: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateModalCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    dateFieldBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    albumMetaPill: {
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      fontWeight: '500',
    },
    metaDot: {
      fontSize: 12,
    },
    photosGrid: {
      paddingHorizontal: 12,
      gap: 6,
    },
    photoThumbWrapper: {
      width: photoSize,
      height: photoSize,
      margin: 3,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: colors.wash,
    },
    photoThumb: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 12,
      color: colors.subtle,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 18,
    },
    createEmptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginTop: 16,
    },
    createEmptyText: {
      fontSize: 13,
      fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: 1,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    formErrorBox: {
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.14)' : 'rgba(220, 38, 38, 0.08)',
      borderWidth: 1,
      borderColor: '#DC2626',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    formErrorText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '600',
    },
    formGroup: {
      marginBottom: 14,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtle,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 10,
    },
    cancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    cancelText: {
      fontSize: 13,
      color: colors.subtle,
      fontWeight: '600',
    },
    submitBtn: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
      minWidth: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitText: {
      fontSize: 13,
      fontWeight: '700',
    },
    lightboxBackdrop: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    lightboxHeader: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    lightboxCounterBadge: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    lightboxCounterText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    lightboxCloseBtn: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      padding: 8,
      borderRadius: 20,
    },
    lightboxImage: {
      width: '100%',
      height: '72%',
    },
    lightboxFooter: {
      position: 'absolute',
      left: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    lightboxCaption: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
    lightboxConfirmRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(24,24,27,0.9)',
      borderColor: '#DC2626',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    lightboxConfirmText: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    lightboxCancelBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    lightboxCancelText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    deletePhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#DC2626',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    deletePhotoText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    noticeWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 45,
      alignItems: 'center',
    },
    noticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 14,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 6,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
    },
    inlineConfirmCard: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 28,
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 5,
    },
    inlineConfirmText: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 17,
    },
    inlineConfirmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    inlineCancelBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
    },
    inlineCancelText: {
      fontSize: 12,
      fontWeight: '600',
    },
    inlineDangerBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: '#DC2626',
      minWidth: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inlineDangerText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    linkCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 10,
    },
    linkIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileExtBadge: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkDomain: {
      fontSize: 13,
      fontWeight: '700',
    },
    linkUrl: {
      fontSize: 11,
    },
    linkSender: {
      fontSize: 10,
    },
    linkActionBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
