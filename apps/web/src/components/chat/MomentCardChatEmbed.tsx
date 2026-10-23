'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, RefreshCw, X } from 'lucide-react';

export interface MomentReplyMetadata {
  type: 'MOMENT_REPLY';
  momentId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  caption?: string | null;
  createdAt?: string;
  fallbackTitle?: string;
}

export function parseMomentReplyMetadata(fileName?: string | null): MomentReplyMetadata | null {
  if (!fileName) return null;
  if (fileName.startsWith('{') && fileName.includes('"MOMENT_REPLY"')) {
    try {
      const parsed = JSON.parse(fileName);
      if (parsed.type === 'MOMENT_REPLY') {
        return parsed;
      }
    } catch {}
  }
  if (fileName.startsWith('Khoảnh khắc: ') || fileName.startsWith('Khoảnh khắc của ')) {
    let caption: string | null = null;
    let authorName: string | null = null;
    if (fileName.startsWith('Khoảnh khắc: "')) {
      const match = fileName.match(/Khoảnh khắc: "(.*)"/);
      caption = match ? match[1] : null;
    } else {
      authorName = fileName.replace('Khoảnh khắc của ', '').trim();
    }
    return {
      type: 'MOMENT_REPLY',
      authorName: authorName || 'Thành viên',
      caption,
      fallbackTitle: fileName,
    };
  }
  return null;
}

export function parseMomentPhotos(rawUrl?: string | null): {
  mainUrl: string;
  pipUrl: string | null;
  cornerIndex: number;
} {
  if (!rawUrl) return { mainUrl: '', pipUrl: null, cornerIndex: 0 };
  if (rawUrl.includes('#pip=')) {
    const parts = rawUrl.split('#pip=');
    const main = parts[0] || '';
    const pipPart = decodeURIComponent(parts[1] || '');
    let pip = pipPart;
    let cornerIndex = 0;
    if (pipPart.includes('#corner=')) {
      const pipSplit = pipPart.split('#corner=');
      pip = pipSplit[0] || '';
      cornerIndex = parseInt(pipSplit[1] || '0', 10) || 0;
    }
    return {
      mainUrl: main,
      pipUrl: pip || null,
      cornerIndex,
    };
  }
  return { mainUrl: rawUrl, pipUrl: null, cornerIndex: 0 };
}

export function formatMomentRelativeTime(dateInput?: string | Date | null, locale: string = 'vi'): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60 && diffSec >= -10) {
    return locale === 'vi' ? 'vừa xong' : 'just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  // Cùng ngày hôm nay: ví dụ "29 p trước" hoặc "2 giờ trước"
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) {
    if (diffMin < 60) {
      return locale === 'vi' ? `${Math.max(1, diffMin)} p trước` : `${Math.max(1, diffMin)}m ago`;
    }
    return locale === 'vi' ? `${diffHour} giờ trước` : `${diffHour}h ago`;
  }

  // Khác ngày: "15 tháng 10"
  const isSameYear = date.getFullYear() === now.getFullYear();
  if (locale === 'vi') {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if (isSameYear) {
      return `${day} tháng ${month}`;
    }
    return `${day} thg ${month}, ${date.getFullYear()}`;
  }

  if (isSameYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface MomentCardChatEmbedProps {
  fileUrl: string;
  metadata: MomentReplyMetadata | null;
  fallbackCreatedAt?: string | null;
  onPreview?: (url: string) => void;
  locale?: string;
}

export const MomentCardChatEmbed: React.FC<MomentCardChatEmbedProps> = ({
  fileUrl,
  metadata,
  fallbackCreatedAt,
  onPreview,
  locale = 'vi',
}) => {
  const { mainUrl, pipUrl, cornerIndex } = parseMomentPhotos(fileUrl);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayMain = isSwapped ? (pipUrl || mainUrl) : mainUrl;
  const displayPip = isSwapped ? mainUrl : pipUrl;

  const authorName = metadata?.authorName || 'Thành viên';
  const authorAvatar = metadata?.authorAvatar;
  const caption = metadata?.caption;
  const targetDate = metadata?.createdAt || fallbackCreatedAt;
  const timeFormatted = targetDate ? formatMomentRelativeTime(targetDate, locale) : null;

  // PIP corner positions for 220px card:
  const pipCornerClasses = (() => {
    switch (cornerIndex % 4) {
      case 0:
        return 'top-2 left-2';
      case 1:
        return 'top-2 right-2';
      case 2:
        return 'bottom-2 right-2';
      case 3:
        return 'bottom-2 left-2';
      default:
        return 'top-2 left-2';
    }
  })();

  // PIP corner positions for 480px modal:
  const pipModalCornerClasses = (() => {
    switch (cornerIndex % 4) {
      case 0:
        return 'top-3.5 left-3.5';
      case 1:
        return 'top-3.5 right-3.5';
      case 2:
        return 'bottom-3.5 right-3.5';
      case 3:
        return 'bottom-3.5 left-3.5';
      default:
        return 'top-3.5 left-3.5';
    }
  })();

  const isVideo =
    displayMain.includes('.webm') ||
    displayMain.includes('.mp4') ||
    displayMain.startsWith('data:video/');

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
          onPreview?.(displayMain);
        }}
        className="group/moment relative w-[220px] h-[220px] aspect-square rounded-[18px] overflow-hidden cursor-pointer select-none border border-white/20 dark:border-black/30 shadow-md bg-stone-900 transition-transform active:scale-[0.99]"
        title="Bấm để xem ảnh vuông phóng to"
      >
        {/* Main Square Photo/Video */}
        {displayMain ? (
          isVideo ? (
            <video
              src={displayMain}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-[18px]"
            />
          ) : (
            <img
              src={displayMain}
              alt={caption || authorName}
              className="w-full h-full object-cover rounded-[18px]"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        {/* Top Overlay: Author Avatar + Name + Time (ở góc trên phải, cố định như app) */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl pointer-events-none shadow-sm max-w-[170px]">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-circle-primary text-circle-charcoal font-bold text-[9px] flex items-center justify-center shrink-0">
              {getInitials(authorName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white truncate leading-tight">
              {authorName}
            </p>
            {timeFormatted && (
              <p className="text-[8.5px] font-medium text-white/75 leading-tight">
                {timeFormatted}
              </p>
            )}
          </div>
        </div>

        {/* PIP Floating Mini Thumbnail (Dual Photo: vuông 60x60, bo góc 14px, viền primary) */}
        {displayPip && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSwapped((prev) => !prev);
            }}
            className={`absolute ${pipCornerClasses} z-20 w-[60px] h-[60px] rounded-[14px] border-2 border-circle-primary shadow-lg overflow-hidden bg-stone-900 transition-transform hover:scale-105 active:scale-95 group/pip`}
            title="Bấm để đổi góc trước / sau"
          >
            <img
              src={displayPip}
              alt="PiP"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/pip:opacity-100 transition-opacity flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 text-white drop-shadow" />
            </div>
          </button>
        )}

        {/* Caption Overlay at bottom (Giới hạn tối đa 2 dòng, co theo chữ như app) - z-30 nổi trên PiP */}
        {caption && (
          <div className="absolute bottom-2 left-2 right-2 z-30 flex justify-center pointer-events-none">
            <div className="bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-xl max-w-full shadow-sm">
              <p className="text-white text-xs font-semibold line-clamp-2 text-center leading-snug break-words">
                {caption}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Full-screen Square 1:1 Moment Lightbox (Giống mobile: chỉ còn ảnh vuông và PiP, không có tag/chữ) */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none cursor-default"
        >
          {/* Top Control Bar: Chỉ giữ nút xoay đổi góc và nút đóng X */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] flex items-center justify-end gap-2 mb-3 px-1"
          >
            {displayPip && (
              <button
                type="button"
                onClick={() => setIsSwapped((prev) => !prev)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20"
                title="Đổi camera trước / sau"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Square 1:1 Large Frame (Ảnh vuông chuẩn 1:1, chỉ còn ảnh, KHÔNG có tag hay chữ) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90vw] max-w-[480px] aspect-square rounded-[28px] overflow-hidden bg-stone-900 border border-white/20 shadow-2xl flex items-center justify-center"
          >
            {isVideo ? (
              <video
                src={displayMain}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-[28px]"
              />
            ) : (
              <img
                src={displayMain}
                alt="Moment Preview"
                className="w-full h-full object-cover rounded-[28px]"
              />
            )}

            {/* PIP Floating Mini Thumbnail (Dual Photo: vuông 96x96, bo góc 18px, viền primary) */}
            {displayPip && (
              <button
                type="button"
                onClick={() => setIsSwapped((prev) => !prev)}
                className={`absolute ${pipModalCornerClasses} z-20 w-[96px] h-[96px] rounded-[18px] border-2 border-circle-primary shadow-xl overflow-hidden bg-stone-900 transition-transform hover:scale-105 active:scale-95 group/pip`}
                title="Bấm để đổi góc trước / sau"
              >
                <img
                  src={displayPip}
                  alt="PiP"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/pip:opacity-100 transition-opacity flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white drop-shadow" />
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
