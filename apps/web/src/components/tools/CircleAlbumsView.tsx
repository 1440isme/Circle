'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Download,
  X,
  ChevronLeft,
  ChevronDown,
  Calendar,
  FolderOpen,
  UploadCloud,
  Loader2,
  AlertCircle,
  Link2,
  FileText,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  Camera,
  User,
  Pencil,
  CheckSquare,
  ChevronRight,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import {
  useAlbumsQuery,
  useAlbumDetailQuery,
  useCreateAlbumMutation,
  useUpdateAlbumMutation,
  useDeleteAlbumMutation,
  useAddPhotosMutation,
  useDeletePhotoMutation,
  useMediaHubQuery,
} from '../../hooks/use-circle-tools';
import { useUploadMedia } from '../../hooks/use-upload-media';
import { PhotoEntity } from '@circle/types';

interface CircleAlbumsViewProps {
  circleId: string;
}

type HubTab = 'media' | 'links' | 'files';

export type FileTypeFilter =
  | 'ALL'
  | 'PDF'
  | 'WORD'
  | 'EXCEL'
  | 'CANVA'
  | 'ARCHIVES'
  | 'OTHER';

// =========================================================================
// SUBCOMPONENT: FILE TYPE FILTER POPOVER
// =========================================================================
interface FileTypeFilterPopoverProps {
  selectedFileType: FileTypeFilter;
  onSelectFileType: (type: FileTypeFilter) => void;
  label: string;
  labels: Record<FileTypeFilter, string>;
  clearTitle?: string;
}

const FileTypeFilterPopover: React.FC<FileTypeFilterPopoverProps> = ({
  selectedFileType,
  onSelectFileType,
  label,
  labels,
  clearTitle = 'Xóa bộ lọc',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fileTypeOptions: { value: FileTypeFilter; label: string }[] = [
    { value: 'PDF', label: labels.PDF },
    { value: 'WORD', label: labels.WORD },
    { value: 'EXCEL', label: labels.EXCEL },
    { value: 'CANVA', label: labels.CANVA },
    { value: 'ARCHIVES', label: labels.ARCHIVES },
    { value: 'OTHER', label: labels.OTHER },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 w-[100px] px-2.5 rounded-full inline-flex items-center justify-between gap-1 text-xs font-semibold backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-charcoal dark:text-circle-dark-text hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-95 cursor-pointer shrink-0 ${
          selectedFileType !== 'ALL'
            ? 'ring-1.5 ring-circle-primary text-circle-primary'
            : ''
        }`}
        title={label}
      >
        <span className="whitespace-nowrap">
          {selectedFileType !== 'ALL' ? labels[selectedFileType] : label}
        </span>

        {selectedFileType !== 'ALL' ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectFileType('ALL');
            }}
            className="p-0.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-rose-500"
            title={clearTitle}
          >
            <X className="h-3.5 w-3.5 shrink-0" />
          </span>
        ) : (
          <ChevronDown
            className={`h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-circle-primary' : ''
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="pointer-events-auto absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="space-y-0.5">
            {fileTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelectFileType(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  selectedFileType === opt.value
                    ? 'bg-circle-primary/10 text-circle-primary font-bold'
                    : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                }`}
              >
                <span>{opt.label}</span>
                {selectedFileType === opt.value && (
                  <Check className="h-3.5 w-3.5 text-circle-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SUBCOMPONENT: SENDER FILTER POPOVER
// =========================================================================
interface SenderFilterPopoverProps {
  senders: { id: string; name: string; avatarUrl?: string | null }[];
  selectedSenderId: string;
  onSelectSenderId: (id: string) => void;
  label: string;
  searchPlaceholder?: string;
  noMemberText?: string;
  clearTitle?: string;
}

const SenderFilterPopover: React.FC<SenderFilterPopoverProps> = ({
  senders,
  selectedSenderId,
  onSelectSenderId,
  label,
  searchPlaceholder = 'Tìm kiếm người gửi...',
  noMemberText = 'Không tìm thấy người gửi',
  clearTitle = 'Xóa bộ lọc',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedSender = senders.find((s) => s.id === selectedSenderId);

  const filtered = senders.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 w-[110px] px-2.5 rounded-full inline-flex items-center justify-between gap-1 text-xs font-semibold backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-charcoal dark:text-circle-dark-text hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-95 cursor-pointer shrink-0 ${
          selectedSenderId !== 'ALL'
            ? 'ring-1.5 ring-circle-primary text-circle-primary'
            : ''
        }`}
        title={label}
      >
        <span className="truncate max-w-[76px] font-semibold">
          {selectedSender ? selectedSender.name : label}
        </span>

        {selectedSenderId !== 'ALL' ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSenderId('ALL');
            }}
            className="p-0.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-rose-500"
            title={clearTitle}
          >
            <X className="h-3.5 w-3.5 shrink-0" />
          </span>
        ) : (
          <ChevronDown
            className={`h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-circle-primary' : ''
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="pointer-events-auto absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="relative flex items-center mb-2 px-1">
            <Search className="absolute left-3 h-3 w-3 text-circle-slate pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-7 pr-7 rounded-xl text-xs bg-circle-wash dark:bg-circle-dark-wash border border-transparent focus:border-circle-primary/40 text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 text-circle-slate hover:text-circle-charcoal"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelectSenderId(s.id);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  selectedSenderId === s.id
                    ? 'bg-circle-primary/10 text-circle-primary font-bold'
                    : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {s.avatarUrl ? (
                    <img
                      src={s.avatarUrl}
                      alt={s.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-circle-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate">{s.name}</span>
                </div>
                {selectedSenderId === s.id && (
                  <Check className="h-3.5 w-3.5 text-circle-primary shrink-0" />
                )}
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                {noMemberText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SUBCOMPONENT: DATE RANGE PICKER POPOVER (INLINE ACCORDION CALENDAR)
// =========================================================================
interface DateRangePickerPopoverProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  label: string;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  locale?: string;
  clearTitle?: string;
}

const DateRangePickerPopover: React.FC<DateRangePickerPopoverProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  label,
  fromPlaceholder = 'Từ ngày',
  toPlaceholder = 'Đến ngày',
  locale = 'vi',
  clearTitle = 'Xóa bộ lọc',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to'>('from');
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);
  const containerRef = useRef<HTMLDivElement>(null);

  // Month navigation view date
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (dateFrom) {
      const parts = dateFrom.split('-').map(Number);
      if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  });

  const handleOpenToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setDraftFrom(dateFrom);
        setDraftTo(dateTo);
        setActiveField('from');
        const activeDate = dateFrom || dateTo;
        if (activeDate) {
          const parts = activeDate.split('-').map(Number);
          if (parts.length === 3) setViewDate(new Date(parts[0], parts[1] - 1, parts[2]));
        } else {
          setViewDate(new Date());
        }
      }
      return next;
    });
  };

  const handleSwitchTab = (tab: 'from' | 'to') => {
    setActiveField(tab);
    const targetDate = tab === 'from' ? draftFrom : draftTo;
    if (targetDate) {
      const parts = targetDate.split('-').map(Number);
      if (parts.length === 3) setViewDate(new Date(parts[0], parts[1] - 1, parts[2]));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDisplay = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  };

  const formatShort = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return d;
  };

  const hasRange = Boolean(dateFrom || dateTo);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month, 1));
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  const handleSelectDay = (day: number) => {
    const dayKey = `${year}-${pad(month)}-${pad(day)}`;

    if (activeField === 'from') {
      setDraftFrom(dayKey);
      if (draftTo && dayKey > draftTo) {
        setDraftTo('');
      }
      // Note: stays on 'from', does not jump to 'to'
    } else if (activeField === 'to') {
      if (draftFrom && dayKey < draftFrom) {
        setDraftFrom(dayKey);
        setDraftTo('');
      } else {
        setDraftTo(dayKey);
      }
    }
  };

  const handleDone = () => {
    onDateFromChange(draftFrom);
    onDateToChange(draftTo);
    setIsOpen(false);
  };

  const handleClearDraft = () => {
    setDraftFrom('');
    setDraftTo('');
  };

  const weekdays =
    locale === 'vi'
      ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const displayText = useMemo(() => {
    if (dateFrom && dateTo) {
      return `${formatShort(dateFrom)} - ${formatShort(dateTo)}`;
    }
    if (dateFrom) {
      return `${locale === 'vi' ? 'Từ' : 'From'} ${formatShort(dateFrom)}`;
    }
    if (dateTo) {
      return `${locale === 'vi' ? 'Đến' : 'To'} ${formatShort(dateTo)}`;
    }
    return label;
  }, [dateFrom, dateTo, locale, label]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpenToggle}
        className={`h-9 w-[118px] px-2.5 rounded-full inline-flex items-center justify-between gap-1 text-xs font-semibold backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-charcoal dark:text-circle-dark-text hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-95 cursor-pointer shrink-0 ${
          hasRange || isOpen
            ? 'ring-1.5 ring-circle-primary text-circle-primary'
            : ''
        }`}
        title={label}
      >
        <span className="whitespace-nowrap">{displayText}</span>

        {hasRange ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onDateFromChange('');
              onDateToChange('');
              setDraftFrom('');
              setDraftTo('');
            }}
            className="p-0.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-rose-500"
            title={clearTitle}
          >
            <X className="h-3.5 w-3.5 shrink-0" />
          </span>
        ) : (
          <ChevronDown
            className={`h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-circle-primary' : ''
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="pointer-events-auto absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSwitchTab('from')}
              className={`flex-1 h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeField === 'from'
                  ? 'border-circle-primary ring-1.5 ring-circle-primary bg-circle-primary/5 text-circle-primary'
                  : draftFrom
                  ? 'border-circle-hairline dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text bg-circle-wash/50 dark:bg-circle-dark-wash/50'
                  : 'border-circle-hairline dark:border-white/12 text-circle-slate dark:text-circle-dark-muted bg-circle-wash/30 dark:bg-circle-dark-wash/30'
              }`}
            >
              <span className="truncate">{draftFrom ? formatDisplay(draftFrom) : fromPlaceholder}</span>
              <Calendar className="h-3 w-3 text-circle-slate dark:text-circle-dark-muted shrink-0 ml-1" />
            </button>

            <span className="text-xs text-circle-slate font-medium shrink-0">—</span>

            <button
              type="button"
              onClick={() => handleSwitchTab('to')}
              className={`flex-1 h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                activeField === 'to'
                  ? 'border-circle-primary ring-1.5 ring-circle-primary bg-circle-primary/5 text-circle-primary'
                  : draftTo
                  ? 'border-circle-hairline dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text bg-circle-wash/50 dark:bg-circle-dark-wash/50'
                  : 'border-circle-hairline dark:border-white/12 text-circle-slate dark:text-circle-dark-muted bg-circle-wash/30 dark:bg-circle-dark-wash/30'
              }`}
            >
              <span className="truncate">{draftTo ? formatDisplay(draftTo) : toPlaceholder}</span>
              <Calendar className="h-3 w-3 text-circle-slate dark:text-circle-dark-muted shrink-0 ml-1" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                {locale === 'vi' ? `Tháng ${pad(month)}, ${year}` : `Month ${pad(month)}, ${year}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate hover:text-circle-charcoal transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {weekdays.map((w) => (
                <div key={w} className="text-[10px] font-bold text-circle-slate dark:text-circle-dark-muted py-0.5">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="h-7 w-7" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayKey = `${year}-${pad(month)}-${pad(day)}`;

                const isFrom = dayKey === draftFrom;
                const isTo = dayKey === draftTo;
                const isSelected = isFrom || isTo;
                const isInRange = Boolean(
                  draftFrom && draftTo && dayKey > draftFrom && dayKey < draftTo,
                );

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 mx-auto rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-circle-primary text-white font-bold shadow-xs'
                        : isInRange
                        ? 'bg-circle-primary/15 text-circle-primary font-medium'
                        : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Bottom Footer with Xoá & Xong buttons */}
            <div className="mt-3 pt-2.5 border-t border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-xs font-semibold text-circle-slate hover:text-rose-500 cursor-pointer transition-colors"
              >
                {locale === 'vi' ? 'Xóa' : 'Clear'}
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="px-4 py-1.5 rounded-full bg-circle-primary hover:bg-circle-sage text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {locale === 'vi' ? 'Xong' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CircleAlbumsView: React.FC<CircleAlbumsViewProps> = ({ circleId }) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  const [activeTab, setActiveTab] = useState<HubTab>('media');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState('ALL');
  const [selectedFileType, setSelectedFileType] = useState<FileTypeFilter>('ALL');
  const [imageSearchNotice, setImageSearchNotice] = useState<string | null>(null);

  // Date range filter state (Main view)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Multi-select for "Tất cả file phương tiện"
  const [isMediaSelectMode, setIsMediaSelectMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  // Multi-select for Album Detail
  const [isAlbumSelectMode, setIsAlbumSelectMode] = useState(false);
  const [selectedAlbumPhotoIds, setSelectedAlbumPhotoIds] = useState<Set<string>>(new Set());
  const [isDeletingPhotos, setIsDeletingPhotos] = useState(false);

  // Album Detail filter states
  const [selectedAlbumSenderId, setSelectedAlbumSenderId] = useState('ALL');
  const [albumDateFrom, setAlbumDateFrom] = useState('');
  const [albumDateTo, setAlbumDateTo] = useState('');
  const [isConfirmDeleteAlbumOpen, setIsConfirmDeleteAlbumOpen] = useState(false);

  // Inline rename album
  const [isEditingAlbumTitle, setIsEditingAlbumTitle] = useState(false);
  const [editingAlbumTitleValue, setEditingAlbumTitleValue] = useState('');
  const albumTitleInputRef = useRef<HTMLInputElement>(null);

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | any | null>(null);

  const [albumError, setAlbumError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmDeleteAlbumId, setConfirmDeleteAlbumId] = useState<string | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [brokenCovers, setBrokenCovers] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: albums = [], isLoading: isLoadingAlbums } = useAlbumsQuery(circleId);
  const { data: albumDetail, isLoading: isLoadingDetail } = useAlbumDetailQuery(
    circleId,
    selectedAlbumId,
  );
  const { data: mediaHub, isLoading: isLoadingHub } = useMediaHubQuery(circleId);
  const mediaItems = mediaHub?.media || [];
  const linkItems = mediaHub?.links || [];
  const fileItems = mediaHub?.files || [];

  // Helper: check if a date string/Date falls within [dateFrom, dateTo]
  const isWithinDateRange = (dateInput?: string | Date | null) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateInput) return false;
    const itemDate = new Date(dateInput).getTime();
    if (isNaN(itemDate)) return false;

    if (dateFrom) {
      const fromT = new Date(`${dateFrom}T00:00:00`).getTime();
      if (itemDate < fromT) return false;
    }
    if (dateTo) {
      const toT = new Date(`${dateTo}T23:59:59.999`).getTime();
      if (itemDate > toT) return false;
    }
    return true;
  };

  const formatDisplayDate = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Compute unique senders / uploaders across all resources for the filter dropdown
  const uniqueSenders = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; avatarUrl?: string | null }
    >();
    albums.forEach((alb) => {
      const u = alb.creator?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || alb.creator?.nickname || t.collab.memberDefault,
          avatarUrl: u.profile?.avatarUrl,
        });
      }
    });
    mediaItems.forEach((m) => {
      const u = m.uploader?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || m.uploader?.nickname || t.collab.memberDefault,
          avatarUrl: u.profile?.avatarUrl,
        });
      }
    });
    linkItems.forEach((l) => {
      const u = l.sender?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || l.sender?.nickname || t.collab.memberDefault,
          avatarUrl: u.profile?.avatarUrl,
        });
      }
    });
    fileItems.forEach((f) => {
      const u = f.sender?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || f.sender?.nickname || t.collab.memberDefault,
          avatarUrl: u.profile?.avatarUrl,
        });
      }
    });
    return Array.from(map.values());
  }, [albums, mediaItems, linkItems, fileItems, t]);

  // Unique senders for photos inside current Album
  const albumSenders = useMemo(() => {
    if (!albumDetail?.photos) return [];
    const map = new Map<string, { id: string; name: string; avatarUrl?: string | null }>();
    albumDetail.photos.forEach((photo) => {
      const u = photo.uploader?.user;
      const name =
        u?.profile?.displayName ||
        photo.uploader?.nickname ||
        t.collab.memberDefault;
      const id = photo.uploaderId || photo.uploader?.id;
      if (id && !map.has(id)) {
        map.set(id, { id, name, avatarUrl: u?.profile?.avatarUrl });
      }
    });
    return Array.from(map.values());
  }, [albumDetail?.photos, t.collab.memberDefault]);

  // Filtered photos inside current Album
  const filteredAlbumPhotos = useMemo(() => {
    if (!albumDetail?.photos) return [];
    return albumDetail.photos.filter((photo) => {
      if (
        selectedAlbumSenderId !== 'ALL' &&
        photo.uploaderId !== selectedAlbumSenderId
      ) {
        return false;
      }
      const photoDate = photo.createdAt ? photo.createdAt.slice(0, 10) : '';
      if (albumDateFrom && photoDate < albumDateFrom) {
        return false;
      }
      if (albumDateTo && photoDate > albumDateTo) {
        return false;
      }
      return true;
    });
  }, [albumDetail?.photos, selectedAlbumSenderId, albumDateFrom, albumDateTo]);

  // Filtered collections (newest first by default)
  // Media tab has NO search input per user requirement, but respects sender and date filters
  const filteredAlbums = useMemo(() => {
    const result = albums.filter((alb) => {
      if (selectedSenderId !== 'ALL' && alb.creator?.user?.id !== selectedSenderId) {
        return false;
      }
      if (!isWithinDateRange(alb.createdAt || alb.updatedAt)) {
        return false;
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
  }, [albums, selectedSenderId, dateFrom, dateTo]);

  const filteredMediaItems = useMemo(() => {
    const result = mediaItems.filter((item) => {
      if (selectedSenderId !== 'ALL' && item.uploader?.user?.id !== selectedSenderId) {
        return false;
      }
      if (!isWithinDateRange(item.createdAt)) {
        return false;
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt || '').getTime();
      const timeB = new Date(b.createdAt || '').getTime();
      return timeB - timeA;
    });
  }, [mediaItems, selectedSenderId, dateFrom, dateTo]);

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
        return (
          item.url.toLowerCase().includes(q) ||
          item.domain.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return timeB - timeA;
    });
  }, [linkItems, selectedSenderId, searchQuery, dateFrom, dateTo]);

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
        const fnUpper = (item.fileName || '').toUpperCase();
        const isCanva =
          ext === 'CANVA' ||
          fnUpper.includes('CANVA') ||
          Boolean(item.fileUrl && item.fileUrl.toLowerCase().includes('canva'));

        if (selectedFileType === 'PDF' && ext !== 'PDF') {
          return false;
        }
        if (selectedFileType === 'WORD' && !['DOC', 'DOCX'].includes(ext)) {
          return false;
        }
        if (selectedFileType === 'EXCEL' && !['XLS', 'XLSX', 'CSV'].includes(ext)) {
          return false;
        }
        if (selectedFileType === 'CANVA' && !isCanva) {
          return false;
        }
        if (
          selectedFileType === 'ARCHIVES' &&
          !['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)
        ) {
          return false;
        }
        if (selectedFileType === 'OTHER') {
          const standardExts = [
            'PDF',
            'DOC',
            'DOCX',
            'XLS',
            'XLSX',
            'CSV',
            'ZIP',
            'RAR',
            '7Z',
            'TAR',
            'GZ',
          ];
          if (standardExts.includes(ext) || isCanva) {
            return false;
          }
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
  }, [fileItems, selectedSenderId, selectedFileType, searchQuery, dateFrom, dateTo]);

  const createAlbumMutation = useCreateAlbumMutation(circleId);
  const updateAlbumMutation = useUpdateAlbumMutation(circleId);
  const deleteAlbumMutation = useDeleteAlbumMutation(circleId);
  const addPhotosMutation = useAddPhotosMutation(circleId, selectedAlbumId || '');
  const deletePhotoMutation = useDeletePhotoMutation(circleId, selectedAlbumId || undefined);

  const { uploadMedia, isUploading } = useUploadMedia();

  useEffect(() => {
    if (
      !isCreateModalOpen &&
      !isConfirmDeleteAlbumOpen &&
      !isEditingAlbumTitle &&
      !selectedPhoto &&
      !isMediaSelectMode &&
      !isAlbumSelectMode
    )
      return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) {
          setSelectedPhoto(null);
          setConfirmDeletePhotoId(null);
        } else if (isConfirmDeleteAlbumOpen) {
          setIsConfirmDeleteAlbumOpen(false);
        } else if (isEditingAlbumTitle) {
          setIsEditingAlbumTitle(false);
        } else if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
          setCreateError(null);
        } else if (isMediaSelectMode) {
          setIsMediaSelectMode(false);
          setSelectedMediaIds(new Set());
        } else if (isAlbumSelectMode) {
          setIsAlbumSelectMode(false);
          setSelectedAlbumPhotoIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCreateModalOpen,
    isConfirmDeleteAlbumOpen,
    isEditingAlbumTitle,
    selectedPhoto,
    isMediaSelectMode,
    isAlbumSelectMode,
  ]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError(t.collab.enterAlbumNameError);
      return;
    }

    setCreateError(null);
    try {
      await createAlbumMutation.mutateAsync({
        albumTitle: newTitle.trim(),
      });

      setNewTitle('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err?.message || t.collab.createAlbumError);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedAlbumId) return;

    setAlbumError(null);
    try {
      const uploadedPhotos: { fileUrl: string; caption?: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          const res = await uploadMedia({
            folder: 'albums',
            file,
          });
          if (res?.publicUrl) {
            uploadedPhotos.push({
              fileUrl: res.publicUrl,
              caption: file.name.replace(/\.[^/.]+$/, ''),
            });
          }
        }
      }

      if (uploadedPhotos.length > 0) {
        await addPhotosMutation.mutateAsync({ photos: uploadedPhotos });
      }
    } catch (err: any) {
      setAlbumError(err?.message || t.collab.uploadPhotoAlbumError);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    setAlbumError(null);
    try {
      await deleteAlbumMutation.mutateAsync(albumId);
      setConfirmDeleteAlbumId(null);
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId(null);
      }
    } catch (err: any) {
      setAlbumError(err?.message || t.collab.deleteAlbumError);
      setConfirmDeleteAlbumId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    setAlbumError(null);
    try {
      await deletePhotoMutation.mutateAsync(photoId);
      setConfirmDeletePhotoId(null);
      setSelectedPhoto(null);
    } catch (err: any) {
      setAlbumError(err?.message || t.collab.deletePhotoError);
      setConfirmDeletePhotoId(null);
    }
  };

  // Multi-download photos helper
  const handleDownloadPhotos = async (
    photos: { fileUrl: string; fileName?: string | null }[],
  ) => {
    if (photos.length === 0) return;
    setIsDownloading(true);
    try {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        try {
          const res = await fetch(p.fileUrl);
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = p.fileName || `photo-${Date.now()}-${i + 1}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        } catch {
          window.open(p.fileUrl, '_blank');
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSelectedMedia = () => {
    const selected = filteredMediaItems.filter((m) => selectedMediaIds.has(m.id));
    handleDownloadPhotos(selected);
  };

  const handleExitMediaSelect = () => {
    setIsMediaSelectMode(false);
    setSelectedMediaIds(new Set());
  };

  const toggleMediaSelect = (id: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownloadSelectedAlbumPhotos = () => {
    if (!albumDetail?.photos) return;
    const selected = albumDetail.photos.filter((p) =>
      selectedAlbumPhotoIds.has(p.id),
    );
    handleDownloadPhotos(selected);
  };

  const handleSelectAllAlbumPhotos = () => {
    if (!albumDetail?.photos) return;
    if (selectedAlbumPhotoIds.size === albumDetail.photos.length) {
      setSelectedAlbumPhotoIds(new Set());
    } else {
      setSelectedAlbumPhotoIds(new Set(albumDetail.photos.map((p) => p.id)));
    }
  };

  const toggleAlbumPhotoSelect = (id: string) => {
    setSelectedAlbumPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchDeleteAlbumPhotos = async () => {
    if (selectedAlbumPhotoIds.size === 0) return;
    if (
      !window.confirm(
        locale === 'vi'
          ? `Bạn có chắc chắn muốn xóa ${selectedAlbumPhotoIds.size} ảnh đã chọn khỏi album này?`
          : `Are you sure you want to delete ${selectedAlbumPhotoIds.size} selected photos from this album?`,
      )
    ) {
      return;
    }
    setIsDeletingPhotos(true);
    try {
      await Promise.all(
        Array.from(selectedAlbumPhotoIds).map((photoId) =>
          deletePhotoMutation.mutateAsync(photoId),
        ),
      );
      setSelectedAlbumPhotoIds(new Set());
      setIsAlbumSelectMode(false);
    } catch (err: any) {
      setAlbumError(err?.message || t.collab.deletePhotoError);
    } finally {
      setIsDeletingPhotos(false);
    }
  };

  const handleStartEditAlbumTitle = () => {
    if (!albumDetail) return;
    setEditingAlbumTitleValue(albumDetail.albumTitle);
    setIsEditingAlbumTitle(true);
    setTimeout(() => {
      albumTitleInputRef.current?.focus();
      albumTitleInputRef.current?.select();
    }, 50);
  };

  const handleSaveInlineAlbumTitle = async () => {
    if (!albumDetail || !selectedAlbumId) {
      setIsEditingAlbumTitle(false);
      return;
    }
    const trimmed = editingAlbumTitleValue.trim();
    if (!trimmed || trimmed === albumDetail.albumTitle) {
      setIsEditingAlbumTitle(false);
      return;
    }
    try {
      await updateAlbumMutation.mutateAsync({
        albumId: selectedAlbumId,
        input: {
          albumTitle: trimmed,
          description: albumDetail.description || undefined,
        },
      });
    } catch (err: any) {
      setAlbumError(
        err?.message ||
          (locale === 'vi' ? 'Không thể đổi tên album' : 'Failed to rename album'),
      );
    } finally {
      setIsEditingAlbumTitle(false);
    }
  };

  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

  const handleCopyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileExtColor = (ext?: string, fileName?: string) => {
    const upper = (ext || '').toUpperCase();
    const fnUpper = (fileName || '').toUpperCase();
    if (['PDF'].includes(upper))
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (['DOC', 'DOCX', 'TXT', 'MD'].includes(upper))
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (['XLS', 'XLSX', 'CSV'].includes(upper))
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (['PPT', 'PPTX'].includes(upper))
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    if (upper === 'CANVA' || fnUpper.includes('CANVA'))
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(upper))
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  };

  // =========================================================================
  // VIEW: ALBUM DETAIL
  // =========================================================================
  if (selectedAlbumId) {
    return (
      <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
        {/* Floating Pill Controls */}
        <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-30 flex flex-col items-center gap-2 px-4 md:px-6">
          <div className="w-full flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedAlbumId(null);
                setConfirmDeleteAlbumId(null);
                setAlbumError(null);
                setIsAlbumSelectMode(false);
                setSelectedAlbumPhotoIds(new Set());
              }}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-circle-primary" />
              <span>{locale === 'vi' ? 'Album' : 'Albums'}</span>
            </button>

            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />

              {/* 1. Nút Tìm kiếm theo ảnh trong album */}
              <button
                type="button"
                onClick={() => {
                  setImageSearchNotice(t.collab.imageSearchComingSoon);
                  setTimeout(() => setImageSearchNotice(null), 3000);
                }}
                className="h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-charcoal dark:text-circle-dark-text hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-95 cursor-pointer"
                title={t.collab.imageSearchBtn}
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.collab.imageSearchBtn}</span>
              </button>

              {/* 2. Bộ lọc Người gửi trong album (luôn hiển thị) */}
              <SenderFilterPopover
                senders={albumSenders}
                selectedSenderId={selectedAlbumSenderId}
                onSelectSenderId={setSelectedAlbumSenderId}
                label={t.collab.filterBySender}
                searchPlaceholder={t.collab.searchSendersPlaceholder}
                noMemberText={t.circle.noMemberFound}
                clearTitle={t.collab.clearFilter}
              />

              {/* 3. Bộ lọc Ngày gửi trong album (luôn hiển thị) */}
              <DateRangePickerPopover
                dateFrom={albumDateFrom}
                dateTo={albumDateTo}
                onDateFromChange={setAlbumDateFrom}
                onDateToChange={setAlbumDateTo}
                label={t.collab.filterDateBtn}
                fromPlaceholder={t.collab.filterDateFrom || 'Từ ngày'}
                toPlaceholder={t.collab.filterDateTo || 'Đến ngày'}
                locale={locale}
                clearTitle={t.collab.clearFilter}
              />

              {/* 4. Nút Chọn ảnh trong Album (luôn hiển thị ngay từ đầu, giữ nguyên text để tránh co dãn) */}
              <button
                type="button"
                onClick={() => {
                  setIsAlbumSelectMode((prev) => !prev);
                  setSelectedAlbumPhotoIds(new Set());
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer shrink-0 ${
                  isAlbumSelectMode
                    ? 'bg-circle-primary text-white border-circle-primary shadow-xs'
                    : 'bg-white/92 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:text-circle-primary'
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>{t.collab.selectAction}</span>
              </button>

              {/* 5. Nút Tải ảnh lên */}
              <button
                type="button"
                disabled={isUploading || addPhotosMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm border border-white/20 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isUploading || addPhotosMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t.common.uploading}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t.collab.uploadPhotos}</span>
                  </>
                )}
              </button>

              {/* 6. Nút Xoá album (Trash2 - luôn hiển thị) */}
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAlbumOpen(true)}
                className="flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
                title={t.collab.deleteThisAlbum}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {albumError && (
            <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-rose-700 dark:text-rose-400 max-w-4xl w-full backdrop-blur-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{albumError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAlbumError(null)}
                className="p-0.5 rounded-full hover:bg-rose-500/20"
                title={t.common.dismiss}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Scroll-under Content Layer */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-16">
          {isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
            </div>
          ) : albumDetail ? (
            <div className="space-y-6 w-full">
              <div>
                <div className="flex items-center gap-2">
                  {isEditingAlbumTitle ? (
                    <input
                      ref={albumTitleInputRef}
                      type="text"
                      value={editingAlbumTitleValue}
                      onChange={(e) => setEditingAlbumTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveInlineAlbumTitle();
                        } else if (e.key === 'Escape') {
                          setIsEditingAlbumTitle(false);
                        }
                      }}
                      onBlur={handleSaveInlineAlbumTitle}
                      className="text-xl font-bold bg-white dark:bg-circle-dark-surface border-2 border-circle-primary rounded-xl px-2.5 py-0.5 text-circle-charcoal dark:text-circle-dark-text focus:outline-none shadow-sm max-w-md w-full"
                    />
                  ) : (
                    <>
                      <h2
                        onClick={handleStartEditAlbumTitle}
                        className="text-xl font-bold text-circle-charcoal dark:text-circle-dark-text cursor-pointer hover:text-circle-primary transition-colors"
                        title={t.collab.editAlbumTitle}
                      >
                        {albumDetail.albumTitle}
                      </h2>
                      <button
                        type="button"
                        onClick={handleStartEditAlbumTitle}
                        className="p-1.5 rounded-full text-circle-slate hover:text-circle-primary hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
                        title={t.collab.editAlbumTitle}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                {albumDetail.description && (
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                    {albumDetail.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-circle-slate dark:text-circle-dark-muted mt-2">
                  <span>
                    {t.collab.albumPhotoUnit.replace(
                      '{count}',
                      String(filteredAlbumPhotos?.length || 0),
                    )}
                  </span>
                  <span>•</span>
                  <span>
                    {t.collab.pollCreatedBy.replace(
                      '{name}',
                      albumDetail.creator?.user?.profile?.displayName || t.collab.memberDefault,
                    )}
                  </span>
                </div>
              </div>

              {/* Photos Grid */}
              {filteredAlbumPhotos && filteredAlbumPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full">
                  {filteredAlbumPhotos.map((photo) => {
                    const senderUser = photo.uploader?.user;
                    const senderName =
                      senderUser?.profile?.displayName ||
                      photo.uploader?.nickname ||
                      t.collab.memberDefault;
                    const senderAvatar = senderUser?.profile?.avatarUrl;

                    return (
                      <div
                        key={photo.id}
                        onClick={() => {
                          if (isAlbumSelectMode) {
                            toggleAlbumPhotoSelect(photo.id);
                          } else {
                            setConfirmDeletePhotoId(null);
                            setSelectedPhoto(photo);
                          }
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-circle-wash dark:bg-circle-dark-wash cursor-pointer border border-circle-hairline/80 dark:border-circle-dark-hairline/80 shadow-2xs hover:shadow-md transition-all hover:border-circle-primary/50"
                      >
                        <img
                          src={photo.fileUrl}
                          alt={photo.caption || t.collab.albumPhotoFallback}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Top-left: Sender avatar */}
                        <div className="absolute top-2 left-2 z-10 flex items-center pointer-events-none">
                          {senderAvatar ? (
                            <img
                              src={senderAvatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover border-2 border-white/90 dark:border-circle-dark-surface/90 shadow-xs"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-circle-primary text-white flex items-center justify-center text-[10px] font-bold border-2 border-white/90 dark:border-circle-dark-surface/90 shadow-xs">
                              {senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Top-right: Selection indicator when in select mode */}
                        {isAlbumSelectMode && (
                          <div className="absolute top-2 right-2 z-20 pointer-events-none">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                selectedAlbumPhotoIds.has(photo.id)
                                  ? 'bg-circle-primary text-white shadow-md'
                                  : 'bg-black/40 backdrop-blur-sm border-2 border-white/80'
                              }`}
                            >
                              {selectedAlbumPhotoIds.has(photo.id) && (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bottom: Hover/Hold strip */}
                        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center justify-between text-[10px] text-white/90">
                          <span className="truncate max-w-[62%] font-medium drop-shadow-xs">
                            {t.collab.pollCreatedBy.replace('{name}', senderName)}
                          </span>
                          <span className="shrink-0 text-white/75 drop-shadow-xs">
                            {new Date(photo.createdAt).toLocaleDateString(dateLocale)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/50 dark:bg-circle-dark-surface/50">
                  <ImageIcon className="h-10 w-10 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
                  <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    {albumDetail.photos && albumDetail.photos.length > 0
                      ? (locale === 'vi' ? 'Không tìm thấy ảnh phù hợp bộ lọc' : 'No photos match the filter')
                      : t.collab.albumEmptyPhotosTitle}
                  </h4>
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 mb-4">
                    {albumDetail.photos && albumDetail.photos.length > 0
                      ? (locale === 'vi' ? 'Thử chọn người gửi khác hoặc khoảng ngày khác' : 'Try selecting another sender or date range')
                      : t.collab.albumEmptyPhotosDesc}
                  </p>
                  {(!albumDetail.photos || albumDetail.photos.length === 0) && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-dark-canvas hover:bg-circle-sage hover:text-white dark:hover:text-white transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t.collab.albumUploadNow}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Lightbox Modal */}
          {selectedPhoto && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedPhoto(null);
                  setConfirmDeletePhotoId(null);
                }
              }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            >
              <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
                <img
                  src={selectedPhoto.fileUrl}
                  alt={selectedPhoto.caption || t.collab.albumPhotoFallback}
                  className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
                />
                {confirmDeletePhotoId === selectedPhoto.id && (
                  <div className="mt-3 w-full max-w-xl flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl glass shadow-lg">
                    <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                      {t.collab.deletePhotoConfirm}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePhotoId(null)}
                        className="px-3 py-1 rounded-full text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={deletePhotoMutation.isPending}
                        onClick={() => handleDeletePhoto(selectedPhoto.id)}
                        className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {deletePhotoMutation.isPending ? t.common.loading : t.common.delete}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full mt-3 px-2 text-white">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {selectedPhoto.caption || t.collab.albumPhotoFallback}
                    </p>
                    <p className="text-[10px] text-white/70">
                      {t.collab.albumUploadedBy.replace(
                        '{name}',
                        selectedPhoto.uploader?.user?.profile?.displayName || t.collab.memberDefault,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={selectedPhoto.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.collab.albumDownload}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePhotoId(selectedPhoto.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600/85 hover:bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t.collab.albumDeletePhoto}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setConfirmDeletePhotoId(null);
                      }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                      title={t.common.close}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Action Bar cho Album Multi-select */}
        {isAlbumSelectMode && (
          <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-2xl bg-white/95 dark:bg-circle-dark-surface/95 border border-circle-hairline/90 dark:border-white/15 shadow-2xl">
              <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.common.selectedCount.replace(
                  '{count}',
                  String(selectedAlbumPhotoIds.size),
                )}
              </span>
              <div className="h-4 w-px bg-circle-hairline dark:bg-circle-dark-hairline" />
              <button
                type="button"
                onClick={handleSelectAllAlbumPhotos}
                className="text-xs font-semibold text-circle-slate hover:text-circle-charcoal dark:hover:text-white transition-colors cursor-pointer"
              >
                {selectedAlbumPhotoIds.size === (filteredAlbumPhotos.length || 0)
                  ? t.common.deselectAll
                  : t.common.selectAll}
              </button>
              <button
                type="button"
                disabled={selectedAlbumPhotoIds.size === 0 || isDownloading}
                onClick={handleDownloadSelectedAlbumPhotos}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-circle-primary hover:bg-circle-sage text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>{t.collab.savePhotosAction}</span>
              </button>
              <button
                type="button"
                disabled={selectedAlbumPhotoIds.size === 0 || isDeletingPhotos}
                onClick={handleBatchDeleteAlbumPhotos}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
              >
                {isDeletingPhotos ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{t.collab.deletePhotosAction}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAlbumSelectMode(false);
                  setSelectedAlbumPhotoIds(new Set());
                }}
                className="p-1 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate"
                title={t.common.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal: Xác nhận Xóa Album */}
        {isConfirmDeleteAlbumOpen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsConfirmDeleteAlbumOpen(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-circle-dark-surface p-5 shadow-2xl border border-circle-hairline dark:border-circle-dark-hairline space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {t.collab.deleteThisAlbum}
                  </h3>
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5 font-medium truncate max-w-[200px]">
                    {albumDetail?.albumTitle}
                  </p>
                </div>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {t.collab.deleteThisAlbumDesc}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteAlbumOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-circle-slate hover:bg-circle-wash dark:hover:bg-circle-dark-wash cursor-pointer transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  disabled={deleteAlbumMutation.isPending}
                  onClick={async () => {
                    if (selectedAlbumId) {
                      await handleDeleteAlbum(selectedAlbumId);
                      setIsConfirmDeleteAlbumOpen(false);
                    }
                  }}
                  className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white transition-all disabled:opacity-50 active:scale-95 cursor-pointer shadow-sm"
                >
                  {deleteAlbumMutation.isPending ? t.common.loading : t.common.delete}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: ALBUMS & MEDIA HUB LIST
  // =========================================================================
  return (
    <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
      {/* Floating Pill Controls Bar */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-30 flex flex-col items-center gap-2 px-4 md:px-6">
        <div className="w-full flex items-center justify-between gap-2">
          {/* Left: 3 Tab Buttons (File phương tiện, File liên kết, File) */}
          <div className="pointer-events-auto inline-flex items-center p-1 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('media');
                setSearchQuery('');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-circle-primary text-white shadow-xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>{t.collab.tabMedia}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('links');
                setSearchQuery('');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-circle-primary text-white shadow-xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>{t.collab.tabLinks}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('files');
                setSearchQuery('');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-circle-primary text-white shadow-xs'
                  : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{t.collab.tabFiles}</span>
            </button>
          </div>

          {/* Right: Contextual Controls per active tab */}
          <div className="pointer-events-auto flex items-center gap-2 shrink-0">
            {/* Search Input (Hidden on media tab per requirement) */}
            {activeTab !== 'media' && (
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'links'
                      ? t.collab.searchLinksPlaceholder
                      : t.collab.searchFilesPlaceholder
                  }
                  className="h-9 w-48 sm:w-64 md:w-72 lg:w-80 pl-7 pr-7 rounded-full text-xs backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:outline-none focus:ring-1.5 focus:ring-circle-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-0.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate"
                    title={t.common.close}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* TAB MEDIA: Button Tìm kiếm theo ảnh */}
            {activeTab === 'media' && (
              <button
                type="button"
                onClick={() => {
                  setImageSearchNotice(t.collab.imageSearchComingSoon);
                  setTimeout(() => setImageSearchNotice(null), 3000);
                }}
                className="h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-circle-charcoal dark:text-circle-dark-text hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-95 cursor-pointer"
                title={t.collab.imageSearchBtn}
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.collab.imageSearchBtn}</span>
              </button>
            )}

            {/* TAB FILES: Lọc loại file (Custom Popover không có dòng 'Loại file', có nút X trên nút để reset) */}
            {activeTab === 'files' && (
              <FileTypeFilterPopover
                selectedFileType={selectedFileType}
                onSelectFileType={setSelectedFileType}
                label={t.collab.filterFileType}
                labels={{
                  ALL: t.collab.filterFileType,
                  PDF: t.collab.fileTypePdf,
                  WORD: t.collab.fileTypeWord,
                  EXCEL: t.collab.fileTypeExcel,
                  CANVA: t.collab.fileTypeCanva,
                  ARCHIVES: t.collab.fileTypeArchives,
                  OTHER: t.collab.fileTypeOther,
                }}
                clearTitle={t.collab.clearFilter}
              />
            )}

            {/* Bộ lọc theo người gửi (luôn hiển thị) */}
            <SenderFilterPopover
              senders={uniqueSenders}
              selectedSenderId={selectedSenderId}
              onSelectSenderId={setSelectedSenderId}
              label={t.collab.filterBySender}
              searchPlaceholder={t.collab.searchSendersPlaceholder}
              noMemberText={t.circle.noMemberFound}
              clearTitle={t.collab.clearFilter}
            />

            {/* Bộ lọc Ngày gửi: Popover cố định kích thước nút, mở rộng kéo dài xuống là lịch */}
            <DateRangePickerPopover
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              label={t.collab.filterDateBtn}
              fromPlaceholder={t.collab.filterDateFrom || 'Từ ngày'}
              toPlaceholder={t.collab.filterDateTo || 'Đến ngày'}
              locale={locale}
              clearTitle={t.collab.clearFilter}
            />
          </div>
        </div>

        {imageSearchNotice && (
          <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-circle-primary/10 border border-circle-primary/20 text-xs font-medium text-circle-primary max-w-4xl w-full backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 shrink-0" />
              <span>{imageSearchNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setImageSearchNotice(null)}
              className="p-0.5 rounded-full hover:bg-circle-primary/20"
              title={t.common.close}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {albumError && (
          <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-rose-700 dark:text-rose-400 max-w-4xl w-full backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{albumError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlbumError(null)}
              className="p-0.5 rounded-full hover:bg-rose-500/20"
              title={t.common.dismiss}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Scroll-under Content Layer */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-12">
        {/* =================================================================== */}
        {/* TAB 1: FILE PHƯƠNG TIỆN (ALBUM CUỘN NGANG + TẤT CẢ FILE CỘT DỌC)   */}
        {/* =================================================================== */}
        {activeTab === 'media' && (
          <div className="w-full space-y-7">
            {/* ------------------------------------------------------------- */}
            {/* SECTION 1: ALBUM (Cuộn ngang - Horizontal Carousel)           */}
            {/* ------------------------------------------------------------- */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-circle-primary shrink-0" />
                  <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {t.collab.subtabAlbums}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-circle-wash dark:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted">
                    {filteredAlbums.length}
                  </span>
                  {/* Dấu cộng tạo album bên cạnh chữ Album */}
                  <button
                    type="button"
                    onClick={() => {
                      setCreateError(null);
                      setIsCreateModalOpen(true);
                    }}
                    title={t.collab.createAlbum}
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-circle-primary/10 hover:bg-circle-primary text-circle-primary hover:text-white transition-all active:scale-95 cursor-pointer ml-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Album Horizontal Scroll Container */}
              {isLoadingAlbums ? (
                <div className="h-36 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
                </div>
              ) : (
                <div className="relative w-full">
                  <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth">
                    {/* First card: Quick Create Album card (only shown when 0 albums) */}
                    {filteredAlbums.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCreateError(null);
                          setIsCreateModalOpen(true);
                        }}
                        className="group shrink-0 w-36 sm:w-44 h-36 rounded-2xl border-2 border-dashed border-circle-hairline dark:border-circle-dark-hairline hover:border-circle-primary/60 bg-white/40 dark:bg-circle-dark-surface/40 hover:bg-circle-primary/5 flex flex-col items-center justify-center gap-2 p-3 text-center transition-all cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-full bg-circle-primary/10 group-hover:bg-circle-primary text-circle-primary group-hover:text-white flex items-center justify-center transition-all">
                          <Plus className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text group-hover:text-circle-primary">
                          {t.collab.createAlbum}
                        </span>
                      </button>
                    )}

                    {/* Album cards */}
                    {filteredAlbums.map((album) => {
                      const coverPhoto = album.photos?.[0]?.fileUrl;
                      const isCoverBroken = Boolean(brokenCovers[album.id]);
                      const photoCount = album._count?.photos || album.photos?.length || 0;
                      const creatorUser = album.creator?.user;
                      const creatorName =
                        creatorUser?.profile?.displayName ||
                        album.creator?.nickname ||
                        t.collab.memberDefault;
                      const creatorAvatar = creatorUser?.profile?.avatarUrl;

                      return (
                        <div
                          key={album.id}
                          onClick={() => {
                            setConfirmDeleteAlbumId(null);
                            setAlbumError(null);
                            setSelectedAlbumId(album.id);
                          }}
                          className="group shrink-0 w-44 sm:w-52 h-36 rounded-2xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-white dark:bg-circle-dark-canvas overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-circle-sage/50 relative flex flex-col justify-end p-3"
                        >
                          {coverPhoto && !isCoverBroken ? (
                            <img
                              src={coverPhoto}
                              alt={album.albumTitle}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={() =>
                                setBrokenCovers((prev) => ({ ...prev, [album.id]: true }))
                              }
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full bg-circle-wash dark:bg-circle-dark-wash flex items-center justify-center text-circle-slate dark:text-circle-dark-muted opacity-40">
                              <FolderOpen className="h-8 w-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                          <div className="absolute top-2 right-2 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                            {t.collab.photosCount.replace('{count}', String(photoCount))}
                          </div>
                          <div className="relative z-10">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-xs">
                              {album.albumTitle}
                            </h4>
                            {album.description && (
                              <p className="text-[10px] text-white/70 line-clamp-1 mt-0.5">
                                {album.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-white/70 mt-1 pt-0.5">
                              <span className="truncate max-w-[60%] drop-shadow-xs">
                                {t.collab.pollCreatedBy.replace('{name}', creatorName)}
                              </span>
                              <span className="shrink-0 drop-shadow-xs">
                                {new Date(album.updatedAt).toLocaleDateString(dateLocale)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 2: TẤT CẢ FILE PHƯƠNG TIỆN (Lưới cột dọc trải dài)     */}
            {/* ------------------------------------------------------------- */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-3 pt-4 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-circle-primary shrink-0" />
                  <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {t.collab.subtabAllMedia}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-circle-wash dark:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted">
                    {filteredMediaItems.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isMediaSelectMode) {
                        handleExitMediaSelect();
                      } else {
                        setIsMediaSelectMode(true);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                      isMediaSelectMode
                        ? 'bg-circle-primary text-white hover:bg-circle-sage shadow-xs'
                        : 'bg-circle-wash dark:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text hover:text-circle-primary dark:hover:text-circle-primary hover:bg-circle-primary/10'
                    }`}
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>{t.collab.selectAction}</span>
                  </button>
                </div>
              </div>

              {isLoadingHub ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
                </div>
              ) : filteredMediaItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full">
                  {filteredMediaItems.map((item) => {
                    const senderUser = item.uploader?.user;
                    const senderName =
                      senderUser?.profile?.displayName ||
                      item.uploader?.nickname ||
                      t.collab.memberDefault;
                    const senderAvatar = senderUser?.profile?.avatarUrl;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isMediaSelectMode) {
                            toggleMediaSelect(item.id);
                          } else {
                            setSelectedPhoto(item as any);
                          }
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-circle-wash dark:bg-circle-dark-wash cursor-pointer border border-circle-hairline/80 dark:border-circle-dark-hairline/80 shadow-2xs hover:shadow-md transition-all hover:border-circle-primary/50"
                      >
                        <img
                          src={item.fileUrl}
                          alt="Media"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Top-left: Default state - only sender round avatar */}
                        <div className="absolute top-2 left-2 z-10 flex items-center pointer-events-none">
                          {senderAvatar ? (
                            <img
                              src={senderAvatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover border-2 border-white/90 dark:border-circle-dark-surface/90 shadow-xs"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-circle-primary text-white flex items-center justify-center text-[10px] font-bold border-2 border-white/90 dark:border-circle-dark-surface/90 shadow-xs">
                              {senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Top-right: Select checkbox when in select mode */}
                        {isMediaSelectMode && (
                          <div className="absolute top-2 right-2 z-20 pointer-events-none">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                selectedMediaIds.has(item.id)
                                  ? 'bg-circle-primary text-white shadow-md'
                                  : 'bg-black/40 backdrop-blur-sm border-2 border-white/80'
                              }`}
                            >
                              {selectedMediaIds.has(item.id) && (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Hover/Hold bottom strip: "Tạo bởi [Tên]" on left, date on right, same font */}
                        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center justify-between text-[10px] text-white/90">
                          <span className="truncate max-w-[62%] font-medium drop-shadow-xs">
                            {t.collab.pollCreatedBy.replace('{name}', senderName)}
                          </span>
                          <span className="shrink-0 text-white/75 drop-shadow-xs">
                            {new Date(item.createdAt).toLocaleDateString(dateLocale)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40 max-w-2xl mx-auto">
                  <ImageIcon className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
                  <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    {t.collab.emptyAllMediaTitle}
                  </h4>
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm">
                    {t.collab.emptyAllMediaDesc}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: FILE LIÊN KẾT */}
        {/* =================================================================== */}
        {activeTab === 'links' && (
          <div className="w-full">
            {isLoadingHub ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
              </div>
            ) : filteredLinkItems.length > 0 ? (
              <div className="w-full divide-y divide-circle-hairline/70 dark:divide-circle-dark-hairline/70">
                {filteredLinkItems.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                    className="group flex items-center justify-between gap-4 py-3.5 px-3 hover:bg-circle-wash/60 dark:hover:bg-circle-dark-wash/50 transition-colors cursor-pointer rounded-lg"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-circle-primary/10 text-circle-primary shrink-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate sm:w-44 shrink-0">
                          {link.domain}
                        </span>
                        <span className="text-xs text-circle-slate dark:text-circle-dark-muted truncate flex-1 hover:text-circle-primary">
                          {link.url}
                        </span>
                      </div>
                      <div className="hidden md:flex items-center gap-3 text-[11px] text-circle-slate dark:text-circle-dark-muted shrink-0">
                        <span className="truncate max-w-[120px]">
                          {link.sender?.user?.profile?.displayName || t.collab.memberDefault}
                        </span>
                        <span>•</span>
                        <span>{new Date(link.sentAt).toLocaleDateString(dateLocale)}</span>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopyLink(link.id, link.url)}
                        className="p-1.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors cursor-pointer"
                        title={copiedLinkId === link.id ? t.collab.copyLinkSuccess : t.collab.copyLinkAction}
                      >
                        {copiedLinkId === link.id ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-primary transition-colors cursor-pointer"
                        title={t.collab.openLinkAction}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40 max-w-2xl mx-auto">
                <Link2 className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
                <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
                  {t.collab.emptyLinksTitle}
                </h4>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm">
                  {t.collab.emptyLinksDesc}
                </p>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: FILE TÀI LIỆU */}
        {/* =================================================================== */}
        {activeTab === 'files' && (
          <div className="w-full">
            {isLoadingHub ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
              </div>
            ) : filteredFileItems.length > 0 ? (
              <div className="w-full divide-y divide-circle-hairline/70 dark:divide-circle-dark-hairline/70">
                {filteredFileItems.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => window.open(file.fileUrl, '_blank')}
                    className="group flex items-center justify-between gap-4 py-3.5 px-3 hover:bg-circle-wash/60 dark:hover:bg-circle-dark-wash/50 transition-colors cursor-pointer rounded-lg"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-[11px] shrink-0 ${getFileExtColor(
                          file.extension,
                          file.fileName,
                        )}`}
                      >
                        {file.extension || 'FILE'}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate sm:w-60 shrink-0">
                          {file.fileName}
                        </span>
                        <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted shrink-0">
                          {formatFileSize(file.fileSize)}
                        </span>
                      </div>
                      <div className="hidden md:flex items-center gap-3 text-[11px] text-circle-slate dark:text-circle-dark-muted shrink-0">
                        <span className="truncate max-w-[120px]">
                          {file.sender?.user?.profile?.displayName || t.collab.memberDefault}
                        </span>
                        <span>•</span>
                        <span>{new Date(file.sentAt).toLocaleDateString(dateLocale)}</span>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={file.fileUrl}
                        download={file.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-full hover:bg-circle-primary hover:text-white text-circle-slate dark:text-circle-dark-muted transition-all cursor-pointer"
                        title={t.collab.downloadFileAction}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40 max-w-2xl mx-auto">
                <FileText className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
                <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
                  {t.collab.emptyFilesTitle}
                </h4>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm">
                  {t.collab.emptyFilesDesc}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar cho Media Multi-select */}
      {isMediaSelectMode && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-2xl bg-white/95 dark:bg-circle-dark-surface/95 border border-circle-hairline/90 dark:border-white/15 shadow-2xl">
            <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
              {t.common.selectedCount.replace(
                '{count}',
                String(selectedMediaIds.size),
              )}
            </span>
            <div className="h-4 w-px bg-circle-hairline dark:bg-circle-dark-hairline" />
            <button
              type="button"
              disabled={selectedMediaIds.size === 0 || isDownloading}
              onClick={handleDownloadSelectedMedia}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-circle-primary hover:bg-circle-sage text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{t.collab.savePhotosAction}</span>
            </button>
            <button
              type="button"
              onClick={handleExitMediaSelect}
              className="p-1 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate"
              title={t.common.cancel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false);
              setCreateError(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl glass-sheet p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.albumCreateModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError(null);
                }}
                className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text"
                title={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  {t.collab.albumNameRequiredLabel}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.collab.albumNameExample}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              {createError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError(null);
                  }}
                  className="rounded-full px-4 h-9 text-xs sm:text-sm font-bold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createAlbumMutation.isPending || !newTitle.trim()}
                  className="rounded-full bg-circle-primary hover:bg-circle-sage px-5 h-9 text-xs sm:text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {createAlbumMutation.isPending
                    ? t.collab.albumCreating
                    : t.collab.albumCreateSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
