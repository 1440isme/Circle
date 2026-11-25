'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  Plus,
  Trash2,
  X,
  Trophy,
  Loader2,
  RotateCw,
  Volume2,
  VolumeX,
  Shuffle,
  RotateCcw,
  Edit2,
  Check,
  ArrowDownAZ,
  PanelRightClose,
  PanelRightOpen,
  BookmarkCheck,
  Share2,
  Sparkles,
  Users,
  Lock,
  LockOpen,
  LogOut,
  ShieldCheck,
  MoreHorizontal,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { getSocket } from '../../lib/socket';
import {
  useWheelsQuery,
  useCreateWheelMutation,
  useUpdateWheelMutation,
  useSpinWheelMutation,
  useSpinAllWheelsMutation,
  useDeleteWheelMutation,
  useDeleteAllWheelsMutation,
  useShareWheelResultsToChatMutation,
  useActiveLiveWheelQuery,
  useCloseLiveWheelMutation,
  useDismissLiveCelebrationMutation,
  useUpdateLiveWheelSettingsMutation,
  useLiveSpinWheelMutation,
  useLiveRemoveResultMutation,
  useLeaveLiveWheelMutation,
} from '../../hooks/use-circle-tools';
import { DecisionWheelEntity, SpinWheelResult, LiveWheelSession, LiveWheelItem } from '@circle/types';

interface LiveWheelOverlayProps {
  circleId: string;
}

const PASTEL_WHEEL_COLORS = [
  '#FFD6A5', // Pastel Warm Apricot
  '#CAFFBF', // Pastel Mint Green
  '#9BF6FF', // Pastel Sky Cyan
  '#FFADAD', // Pastel Coral Pink
  '#BDB2FF', // Pastel Soft Lavender
  '#FDFFB6', // Pastel Cream Butter
  '#A0C4FF', // Pastel Powder Blue
  '#FFC6FF', // Pastel Light Orchid
  '#B8E0D2', // Pastel Celadon Sage
  '#FED1BA', // Pastel Peach
  '#D7E3FC', // Pastel Periwinkle
  '#FDE2E4', // Pastel Rose Blossom
];

// Web Audio API Synthesizer (Zero external dependencies)
class WheelAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  }

  playFanfare() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch {}
  }
}

const audio = new WheelAudioEngine();

// Canvas Wheel Component y hệt CircleWheelView
const WheelCanvas: React.FC<{
  options: { label: string; color: string }[];
  rotation: number;
  size?: number;
  onClick?: () => void;
}> = ({ options, rotation, size = 260, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 1;
    const count = Math.max(options.length, 1);
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate context
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw slices
    if (options.length === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#94A3B8';
      const emptyFontSize = size > 420 ? 14 : size > 300 ? 12 : 11;
      ctx.font = `600 ${emptyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText('Hết phương án', 0, 0);
    } else {
      options.forEach((opt, idx) => {
        const startAngle = idx * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!;
        ctx.fill();

        // Label text: Centered radially in the slice so it never sinks into hub or spills off rim
        ctx.save();
        const midAngle = startAngle + sliceAngle / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1E293B';

        const hubRadius = size > 500 ? 32 : size > 420 ? 28 : size > 300 ? 22 : 18;
        const outerMargin = size > 500 ? 26 : size > 420 ? 24 : size > 300 ? 20 : 14;
        const trackLength = radius - outerMargin - hubRadius;
        const textRadius = hubRadius + trackLength / 2;

        const baseFontSize = size > 500 ? 16 : size > 420 ? 15 : size > 300 ? 13 : size > 250 ? 12 : 11;
        ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 2;

        let label = opt.label;
        let measured = ctx.measureText(label).width;
        if (measured > trackLength - 6) {
          const smallerFont = Math.max(baseFontSize - 2, 9);
          ctx.font = `600 ${smallerFont}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          measured = ctx.measureText(label).width;
          if (measured > trackLength - 6) {
            const charWidth = smallerFont * 0.6;
            const maxLen = Math.max(Math.floor((trackLength - 8) / charWidth), 3);
            label = label.substring(0, maxLen - 1) + '…';
          }
        }

        ctx.fillText(label, textRadius, 0);
        ctx.restore();
      });
    }

    ctx.restore();

    // Center circular hub
    const hubRadius = size > 500 ? 32 : size > 420 ? 28 : size > 300 ? 22 : 18;
    ctx.beginPath();
    ctx.arc(center, center, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Center small circle (brand teal)
    ctx.beginPath();
    ctx.arc(center, center, size > 500 ? 12 : size > 420 ? 10 : size > 300 ? 8 : 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#0D9488';
    ctx.fill();
  }, [options, rotation, size]);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full shadow-lg"
      />
      {/* Sleek needle pointer anchored on the RIGHT OUTSIDE, pointing into the wheel */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-md flex items-center"
        style={{ right: size > 500 ? -32 : size > 420 ? -30 : -26 }}
      >
        <svg
          width={size > 500 ? '44' : size > 420 ? '40' : '34'}
          height={size > 500 ? '30' : size > 420 ? '28' : '24'}
          viewBox="0 0 34 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 2 12 L 20 3 C 22 2 24 3 24 5.5 V 18.5 C 24 21 22 22 20 21 L 2 12 Z"
            fill="#0D9488"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="22" y="5" width="10" height="14" rx="3.5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="27" cy="12" r="3" fill="#FFFFFF" />
          <circle cx="27" cy="12" r="1.5" fill="#0D9488" />
        </svg>
      </div>
    </div>
  );
};

export const LiveWheelOverlay: React.FC<LiveWheelOverlayProps> = ({ circleId }) => {
  const { user } = useAuth();
  const { t, locale } = useLanguageStore();
  const queryClient = useQueryClient();

  const [isVisible, setIsVisible] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveWheelSession | null>(null);

  const { data: rawWheels = [], isLoading: isLoadingWheels } = useWheelsQuery(circleId);

  // Sắp xếp vòng 1, 2, 3, 4 theo thứ tự thời gian tạo tăng dần
  const wheels = useMemo(() => {
    return [...rawWheels].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.title.localeCompare(b.title, 'vi', { numeric: true });
    });
  }, [rawWheels]);

  // Ref lưu tạm danh sách ban đầu để phản hồi tức thì và không bị mất khi DB chưa invalidate xong
  const savedInitialOptionsRef = useRef<Record<string, string[]>>({});

  // Helper tìm danh sách options hợp lệ đầu tiên có ít nhất 1 phần tử
  const getValidOptionsList = (candidates: (string[] | undefined | null)[]): string[] => {
    for (const c of candidates) {
      if (Array.isArray(c) && c.length > 0) {
        return c;
      }
    }
    return [];
  };

  // Nguồn chân lý duy nhất cho danh sách các vòng: Ưu tiên liveSession.wheels để đồng bộ 100% giữa các máy
  const liveWheels: LiveWheelItem[] = useMemo(() => {
    if (liveSession?.wheels && liveSession.wheels.length > 0) {
      return liveSession.wheels.slice(0, 4).map((lw) => {
        const dbW = wheels.find((w) => w.id === lw.wheelId);
        const initialOptions = getValidOptionsList([
          savedInitialOptionsRef.current[lw.wheelId],
          lw.initialOptions,
          dbW?.initialOptions,
          dbW?.options?.map((o: any) => o.optionLabel),
          lw.options?.map((o: any) => o.optionLabel),
        ]);
        return {
          ...lw,
          initialOptions,
        };
      });
    }
    if (liveSession?.options && liveSession.options.length > 0) {
      const dbW = wheels[0];
      const initialOptions = getValidOptionsList([
        savedInitialOptionsRef.current[liveSession.wheelId || 'single-wheel'],
        dbW?.initialOptions,
        dbW?.options?.map((o: any) => o.optionLabel),
        liveSession.options?.map((o: any) => o.optionLabel),
      ]);
      return [
        {
          wheelId: liveSession.wheelId || 'single-wheel',
          wheelTitle: liveSession.wheelTitle || (locale === 'vi' ? 'Vòng 1' : 'Wheel 1'),
          options: liveSession.options,
          initialOptions,
          winningIndex: liveSession.winningIndex ?? -1,
          winningOption: liveSession.winningOption ?? null,
        },
      ];
    }
    return wheels.map((w, idx) => ({
      wheelId: w.id,
      wheelTitle: w.title || `Vòng ${idx + 1}`,
      initialOptions: getValidOptionsList([
        savedInitialOptionsRef.current[w.id],
        w.initialOptions,
        w.options?.map((o: any) => o.optionLabel),
      ]),
      options: (w.options || []).map((o, oIdx) => ({
        optionLabel: o.optionLabel,
        color: o.color || PASTEL_WHEEL_COLORS[oIdx % PASTEL_WHEEL_COLORS.length]!,
      })),
      winningIndex: -1,
      winningOption: null,
    }));
  }, [liveSession, wheels, locale]);

  // Mutations
  const createWheelMutation = useCreateWheelMutation(circleId);
  const updateWheelMutation = useUpdateWheelMutation(circleId);
  const deleteWheelMutation = useDeleteWheelMutation(circleId);
  const deleteAllMutation = useDeleteAllWheelsMutation(circleId);
  const liveSpinMutation = useLiveSpinWheelMutation(circleId);
  const liveRemoveResultMutation = useLiveRemoveResultMutation(circleId);
  const shareResultsMutation = useShareWheelResultsToChatMutation(circleId);
  const closeLiveMutation = useCloseLiveWheelMutation(circleId);
  const dismissCelebrationMutation = useDismissLiveCelebrationMutation(circleId);
  const updateSettingsMutation = useUpdateLiveWheelSettingsMutation(circleId);
  const leaveLiveMutation = useLeaveLiveWheelMutation(circleId);

  // Modal xác nhận rời phòng khi bấm nút mũi tên ở góc trái
  const [confirmLeaveModalOpen, setConfirmLeaveModalOpen] = useState(false);

  // Phân quyền: Chủ phòng vs Người xem & Quyền chỉnh sửa
  const isHost = Boolean(!liveSession?.creatorId || liveSession.creatorId === user?.id);
  const allowMembersToEdit = Boolean(liveSession?.allowMembersToEdit);
  const isParticipant = Boolean(
    liveSession?.participants?.some((p) => p.userId === user?.id) || isHost
  );
  const canEdit = isHost || allowMembersToEdit;

  // Xử lý nút mũi tên góc trái rời phòng
  const handleArrowLeaveStage = () => {
    setConfirmLeaveModalOpen(true);
  };

  const handleConfirmLeaveAsSpectator = async () => {
    try {
      await leaveLiveMutation.mutateAsync();
      setIsVisible(false);
      setConfirmLeaveModalOpen(false);
    } catch {
      setIsVisible(false);
      setConfirmLeaveModalOpen(false);
    }
  };

  const handleTransferHostAndLeave = async () => {
    const otherParticipant = (liveSession?.participants || []).find((p) => p.userId !== user?.id);
    if (!otherParticipant) {
      alert(
        locale === 'vi'
          ? 'Phòng hiện không có thành viên khác tham gia để chuyển quyền. Bạn có thể chọn Đóng phòng.'
          : 'No other participant available to transfer host. You can choose Close stage.'
      );
      return;
    }
    try {
      await updateSettingsMutation.mutateAsync({
        newHostUserId: otherParticipant.userId,
      });
      await leaveLiveMutation.mutateAsync();
      setIsVisible(false);
      setConfirmLeaveModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể chuyển quyền chủ phòng');
    }
  };

  const handleToggleAllowEdit = async () => {
    if (!isHost) return;
    try {
      await updateSettingsMutation.mutateAsync({
        allowMembersToEdit: !allowMembersToEdit,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể thay đổi thiết lập');
    }
  };

  const [shareSuccess, setShareSuccess] = useState(false);

  // Menu 3 chấm (Cài đặt phòng quay: Quyền sửa & Âm thanh)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Active Tab: Selected Wheel ID or 'results'
  const [activeTab, setActiveTab] = useState<string>('wheel');
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  // Results Text: Mỗi dòng là kết quả của 1 lần quay (các vòng cách nhau bởi dấu " - ")
  const [resultsText, setResultsText] = useState<string>('');
  const resultLines = useMemo(() => {
    return resultsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [resultsText]);
  const resultLinesCount = resultLines.length;

  // Panel Collapsed State (Nút kéo mở / thu gọn setup y hệt CircleWheelView)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Auto-seed: Khởi tạo 1 vòng mặc định ngay khi tải trang nếu Circle chưa có vòng nào
  const autoSeedRef = useRef(false);
  useEffect(() => {
    if (!isLoadingWheels && wheels.length === 0 && !autoSeedRef.current && !createWheelMutation.isPending) {
      autoSeedRef.current = true;
      const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
      const sampleOptions = [
        { optionLabel: 'Phở bò' },
        { optionLabel: 'Bún chả' },
        { optionLabel: 'Cơm tấm' },
        { optionLabel: 'Bánh mì' },
      ];

      createWheelMutation.mutate(
        {
          title: defaultTitle,
          options: sampleOptions,
          initialOptions: sampleOptions.map((o) => o.optionLabel),
          soundEnabled: true,
          confettiEnabled: false,
        },
        {
          onSuccess: (newWheel) => {
            if (newWheel?.id) {
              setActiveWheelId(newWheel.id);
            }
          },
        }
      );
    }
  }, [isLoadingWheels, wheels.length, createWheelMutation, t.luckyWheel.wheelNumber]);

  // Local state per wheel (textarea, rotation, isSpinning)
  interface WheelLocalState {
    optionsText: string;
    rotation: number;
    isSpinning: boolean;
    lastResult: string | null;
  }
  const [wheelsState, setWheelsState] = useState<Record<string, WheelLocalState>>({});

  // Submitting ref per wheel để không khóa các vòng khác khi quay 1 vòng
  const submittingWheelRef = useRef<Set<string>>(new Set());

  // Batch Spinning Accumulator
  const activeSpinningBatchRef = useRef<Set<string>>(new Set());
  const batchResultsAccumulatorRef = useRef<
    { wheelId: string; wheelTitle: string; result: string; resultIndex: number }[]
  >([]);

  // Batch Results Modal (Cúp vàng chúc mừng chiến thắng)
  const [combinedResultsModal, setCombinedResultsModal] = useState<
    { wheelId: string; wheelTitle: string; result: string; resultIndex: number }[] | null
  >(null);

  // Synchronize wheels into local state
  useEffect(() => {
    if (liveWheels.length === 0) return;

    setWheelsState((prev) => {
      const next = { ...prev };
      liveWheels.forEach((w) => {
        const text = (w.options || []).map((o) => o.optionLabel).join('\n');
        if (!next[w.wheelId]) {
          next[w.wheelId] = {
            optionsText: text,
            rotation: 0,
            isSpinning: false,
            lastResult: w.winningOption?.optionLabel || null,
          };
        } else {
          next[w.wheelId] = {
            ...next[w.wheelId]!,
            optionsText: text,
            lastResult: w.winningOption?.optionLabel ?? next[w.wheelId]!.lastResult,
          };
        }
      });
      return next;
    });

    if (!activeWheelId || !liveWheels.some((w) => w.wheelId === activeWheelId)) {
      const fallbackId = liveWheels[0]?.wheelId || null;
      setActiveWheelId(fallbackId);
      if (activeTab !== 'results' && activeTab !== 'viewers' && fallbackId) {
        setActiveTab(fallbackId);
      }
    }
  }, [liveWheels, activeWheelId, activeTab]);

  // Active Wheel entity
  const activeWheel = useMemo(
    () => liveWheels.find((w) => w.wheelId === activeWheelId) || liveWheels[0] || null,
    [liveWheels, activeWheelId]
  );

  const activeLocalState = useMemo(() => {
    if (!activeWheel) return null;
    return (
      wheelsState[activeWheel.wheelId] || {
        optionsText: (activeWheel.options || []).map((o) => o.optionLabel).join('\n'),
        rotation: 0,
        isSpinning: false,
        lastResult: activeWheel.winningOption?.optionLabel || null,
      }
    );
  }, [activeWheel, wheelsState]);

  // Is any wheel spinning currently?
  const isAnySpinning = useMemo(
    () => Object.values(wheelsState).some((s) => s.isSpinning),
    [wheelsState]
  );

  // Parse lines to options helper
  const parseOptions = useCallback((text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines.map((label, idx) => ({
      label,
      color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!,
    }));
  }, []);

  // Debounced auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = useCallback(
    (wheelId: string, text: string) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        if (lines.length >= 1) {
          updateWheelMutation.mutate({
            wheelId,
            input: {
              options: lines.map((opt, idx) => ({
                optionLabel: opt,
                color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
              })),
            },
          });
        }
      }, 900);
    },
    [updateWheelMutation]
  );

  // Add default wheel without popup
  const handleAddDefaultWheel = () => {
    if (wheels.length >= 4 || isAnySpinning) return;
    const nextNumber = wheels.length + 1;
    const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', String(nextNumber));
    const sampleOptions = [
      { optionLabel: 'Phở bò' },
      { optionLabel: 'Bún chả' },
      { optionLabel: 'Cơm tấm' },
      { optionLabel: 'Bánh mì' },
    ];

    createWheelMutation.mutate(
      {
        title: defaultTitle,
        options: sampleOptions,
        initialOptions: sampleOptions.map((o) => o.optionLabel),
        soundEnabled: true,
        confettiEnabled: true,
      },
      {
        onSuccess: (newWheel) => {
          if (newWheel?.id) {
            setActiveWheelId(newWheel.id);
          }
        },
      }
    );
  };

  // Textarea change handler for active wheel
  const handleOptionsChange = (newText: string) => {
    if (!activeWheel || isAnySpinning) return;
    setWheelsState((prev) => ({
      ...prev,
      [activeWheel.wheelId]: {
        ...(prev[activeWheel.wheelId] || { rotation: 0, isSpinning: false, lastResult: null }),
        optionsText: newText,
      },
    }));
    triggerAutoSave(activeWheel.wheelId, newText);
  };

  // Shuffle options for active wheel
  const handleShuffle = () => {
    if (!activeWheel || !activeLocalState || isAnySpinning) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return;

    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j]!, lines[i]!];
    }
    const shuffledText = lines.join('\n');
    handleOptionsChange(shuffledText);
  };

  // Sort options A-Z (Alphabetical)
  const handleSortAZ = () => {
    if (!activeWheel || !activeLocalState || isAnySpinning) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return;

    lines.sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' }));
    const sortedText = lines.join('\n');
    handleOptionsChange(sortedText);
  };

  // Save current options as initial baseline
  const [saveInitialFeedback, setSaveInitialFeedback] = useState(false);
  const handleSaveAsInitial = () => {
    if (!activeWheel || !activeLocalState || isAnySpinning) return;
    const lines = activeLocalState.optionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 1) return;

    savedInitialOptionsRef.current[activeWheel.wheelId] = lines;
    setLiveSession((prev) => {
      if (!prev || !prev.wheels) return prev;
      return {
        ...prev,
        wheels: prev.wheels.map((w) =>
          w.wheelId === activeWheel.wheelId ? { ...w, initialOptions: lines } : w
        ),
      };
    });

    updateWheelMutation.mutate(
      {
        wheelId: activeWheel.wheelId,
        input: {
          initialOptions: lines,
        },
      },
      {
        onSuccess: () => {
          setSaveInitialFeedback(true);
          setTimeout(() => setSaveInitialFeedback(false), 2000);
        },
      }
    );
  };

  // Reset options to initial
  const handleReset = () => {
    if (!activeWheel || isAnySpinning) return;
    const dbWheel = wheels.find((w) => w.id === activeWheel.wheelId);
    const initial = getValidOptionsList([
      savedInitialOptionsRef.current[activeWheel.wheelId],
      activeWheel.initialOptions,
      (activeWheel as any).initialOptions,
      dbWheel?.initialOptions,
      activeWheel.options?.map((o) => o.optionLabel),
      (dbWheel?.options || []).map((o: any) => o.optionLabel),
    ]);
    if (initial.length >= 1) {
      if (window.confirm(t.luckyWheel.confirmReset || 'Bạn có chắc chắn muốn đặt lại danh sách ban đầu?')) {
        handleOptionsChange(initial.join('\n'));
      }
    } else {
      alert(t.luckyWheel.resetEmptyWarning || 'Chưa có danh sách mặc định nào được lưu');
    }
  };

  // Delete All Wheels (leaves 1 default wheel)
  const handleDeleteAllWheels = () => {
    if (isAnySpinning || liveWheels.length === 0 || !canEdit) return;
    if (window.confirm(t.luckyWheel.confirmDeleteAllWheels)) {
      const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
      deleteAllMutation.mutate(defaultTitle, {
        onSuccess: (res: any) => {
          if (res?.defaultWheel?.id) {
            setActiveWheelId(res.defaultWheel.id);
          }
        },
      });
    }
  };

  // Settings toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const currentSoundEnabled = soundEnabled;

  const handleToggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  // Inline rename title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');

  const startEditTitle = () => {
    if (!activeWheel || isAnySpinning || !canEdit) return;
    setEditingTitleText(activeWheel.wheelTitle);
    setIsEditingTitle(true);
  };

  const saveEditTitle = () => {
    if (!activeWheel || isAnySpinning || !canEdit) return;
    const trimmed = editingTitleText.trim();
    if (trimmed && trimmed !== activeWheel.wheelTitle) {
      updateWheelMutation.mutate({
        wheelId: activeWheel.wheelId,
        input: { title: trimmed },
      });
    }
    setIsEditingTitle(false);
  };

  // Animate a single wheel rotation
  const animateWheelRotation = useCallback(
    (
      wheelId: string,
      targetIndex: number,
      totalCount: number,
      soundEnabled: boolean,
      wheelTitle: string,
      resultLabel: string
    ) => {
      const sliceDeg = 360 / totalCount;
      const targetCenterDeg = targetIndex * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;

      const currentRotation = wheelsState[wheelId]?.rotation || 0;
      const currentNorm = currentRotation % 360;
      const extraSpins = 6 * 360;
      let delta = stopAngle - currentNorm;
      if (delta < 0) delta += 360;
      const finalRotation = currentRotation + extraSpins + delta;

      const duration = liveSession?.durationMs || 6000;
      const startTime = performance.now();
      let lastTickAngle = currentRotation;

      setWheelsState((prev) => ({
        ...prev,
        [wheelId]: {
          ...(prev[wheelId] || { optionsText: '', lastResult: null }),
          isSpinning: true,
          rotation: currentRotation,
        },
      }));

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const currRot = currentRotation + (finalRotation - currentRotation) * easeOut;

        if (soundEnabled && Math.abs(currRot - lastTickAngle) >= sliceDeg) {
          audio.playTick();
          lastTickAngle = currRot;
        }

        setWheelsState((prev) => ({
          ...prev,
          [wheelId]: {
            ...(prev[wheelId] || { optionsText: '', lastResult: null }),
            isSpinning: true,
            rotation: currRot,
          },
        }));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setWheelsState((prev) => ({
            ...prev,
            [wheelId]: {
              ...(prev[wheelId] || { optionsText: '' }),
              isSpinning: false,
              rotation: finalRotation,
              lastResult: resultLabel,
            },
          }));

          if (soundEnabled) audio.playFanfare();

          // Add this result to the batch accumulator
          batchResultsAccumulatorRef.current.push({
            wheelId,
            wheelTitle,
            result: resultLabel,
            resultIndex: targetIndex,
          });

          // Remove from active batch
          activeSpinningBatchRef.current.delete(wheelId);

          // If ALL spinning wheels in this active batch have completed, display combined modal!
          if (activeSpinningBatchRef.current.size === 0) {
            const rawBatch = [...batchResultsAccumulatorRef.current];

            const sortedBatch = [...rawBatch].sort((a, b) => {
              const idxA = liveWheels.findIndex((w) => w.wheelId === a.wheelId);
              const idxB = liveWheels.findIndex((w) => w.wheelId === b.wheelId);
              return idxA - idxB;
            });

            setCombinedResultsModal(sortedBatch);

            // Ghi kết quả theo từng dòng (các vòng cách nhau bởi dấu " - ")
            const roundLine = sortedBatch.map((b) => b.result).join(' - ');
            setResultsText((prev) => (prev ? `${prev}\n${roundLine}` : roundLine));

            batchResultsAccumulatorRef.current = [];
          }
        }
      };

      requestAnimationFrame(step);
    },
    [wheelsState, liveWheels]
  );

  // Spin a single wheel (cho phép quay độc lập từng vòng mà không khóa vòng khác)
  const handleSpinSingle = async (wheel: LiveWheelItem) => {
    const localState = wheelsState[wheel.wheelId];
    if (localState?.isSpinning || submittingWheelRef.current.has(wheel.wheelId)) return;

    if (!wheel.options || wheel.options.length === 0) {
      alert(locale === 'vi' ? 'Vòng quay này đã hết phương án lựa chọn' : 'This wheel has no options left');
      return;
    }

    try {
      submittingWheelRef.current.add(wheel.wheelId);
      await liveSpinMutation.mutateAsync({
        isAll: false,
        wheelId: wheel.wheelId,
        channelId: liveSession?.channelId,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể quay vòng này');
    } finally {
      submittingWheelRef.current.delete(wheel.wheelId);
    }
  };

  // Spin ALL wheels simultaneously
  const handleSpinAll = async () => {
    if (liveWheels.length === 0 || isAnySpinning || liveSpinMutation.isPending) return;

    const hasAnyOption = liveWheels.some((w) => w.options && w.options.length > 0);
    if (!hasAnyOption) {
      alert(locale === 'vi' ? 'Tất cả vòng quay đã hết phương án lựa chọn' : 'All wheels have no options left');
      return;
    }

    try {
      await liveSpinMutation.mutateAsync({
        isAll: true,
        channelId: liveSession?.channelId,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể bắt đầu quay');
    }
  };

  // Remove result from a wheel
  const handleRemoveResult = async (wheelId: string, resultLabel: string, resultIndex?: number) => {
    try {
      const updated = await liveRemoveResultMutation.mutateAsync({
        wheelId,
        optionLabel: resultLabel,
      });
      if (updated) {
        setLiveSession(updated);
      }
      setCombinedResultsModal((prev) => {
        if (!prev) return null;
        const remaining = prev.filter(
          (p) => !(p.wheelId === wheelId && p.result === resultLabel)
        );
        return remaining.length > 0 ? remaining : null;
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể loại bỏ kết quả');
    }
  };

  // Loại bỏ tất cả kết quả trúng thưởng vừa quay và đóng modal
  const handleRemoveAllBatchResults = async () => {
    if (!combinedResultsModal) return;
    try {
      const updated = await liveRemoveResultMutation.mutateAsync({
        removeAll: true,
      });
      if (updated) {
        setLiveSession(updated);
      }
      setCombinedResultsModal(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể loại bỏ tất cả kết quả');
    }
  };

  // Đóng modal chúc mừng kết quả đồng bộ cho cả 2 bên (Web & Mobile)
  const handleDismissCombinedResultsModal = () => {
    setCombinedResultsModal(null);
    dismissCelebrationMutation.mutateAsync().catch(() => {});
  };

  // Sort results A-Z
  const handleSortResults = () => {
    if (resultLines.length < 2) return;
    const isSortedAZ = resultLines.every(
      (line, idx, arr) => idx === 0 || line.localeCompare(arr[idx - 1]!, 'vi') >= 0
    );
    const sorted = isSortedAZ
      ? [...resultLines].reverse()
      : [...resultLines].sort((a, b) => a.localeCompare(b, 'vi'));
    setResultsText(sorted.join('\n'));
  };

  // Share results to chat
  const handleShareResultsToChat = () => {
    if (resultLines.length === 0 || shareResultsMutation.isPending) return;
    shareResultsMutation.mutate(
      resultLines.map((line, idx) => ({
        wheelTitle: (t.luckyWheel.turnNumber || 'Lần {number}').replace('{number}', String(idx + 1)),
        winner: line,
      })),
      {
        onSuccess: () => {
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2500);
        },
      }
    );
  };

  // Clear all results
  const handleClearResults = () => {
    if (resultLines.length === 0) return;
    if (window.confirm(t.luckyWheel.confirmClearResultsDesc)) {
      setResultsText('');
    }
  };

  // ĐÓNG PHÒNG QUAY & TỰ ĐỘNG GỬI KẾT QUẢ VÀO TIN NHẮN CHAT
  const handleCloseStage = async () => {
    const confirmMsg =
      resultLines.length > 0
        ? (locale === 'vi'
            ? 'Đóng phòng quay và tự động gửi kết quả vào tin nhắn nhóm?'
            : 'Close wheel stage and auto-share results to group chat?')
        : (locale === 'vi'
            ? 'Bạn có chắc chắn muốn đóng phòng quay trực tiếp?'
            : 'Are you sure you want to end this live wheel stage?');

    if (!window.confirm(confirmMsg)) return;

    try {
      const formattedResults =
        resultLines.length > 0
          ? resultLines.map((line, idx) => ({
              wheelTitle: `Lần ${idx + 1}`,
              winner: line,
            }))
          : undefined;

      setIsVisible(false);
      setLiveSession(null);
      setResultsText('');
      setCombinedResultsModal(null);
      queryClient.setQueryData(['tools', 'wheels', 'live-active', circleId], null);

      await closeLiveMutation.mutateAsync({
        results: formattedResults,
      });
      queryClient.invalidateQueries({ queryKey: ['tools', 'wheels', circleId] });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể đóng phòng quay');
    }
  };

  // 1. Fetch active session on mount (KHÔNG tự ý bật setIsVisible(true))
  const { data: initialActiveSession } = useActiveLiveWheelQuery(circleId);

  useEffect(() => {
    if (initialActiveSession) {
      const elapsed = Date.now() - initialActiveSession.startedAt;
      if (elapsed < 4 * 60 * 60 * 1000) {
        setLiveSession(initialActiveSession);
        // KHÔNG gọi setIsVisible(true) ở đây để không tự ý đẩy người dùng vào vòng quay
      }
    }
  }, [initialActiveSession]);

  // 2. Realtime Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStageCreated = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        setLiveSession(incoming);
        // CHỈ tự mở nếu chính mình là người tạo
        if (incoming.creatorId === user?.id) {
          setIsVisible(true);
        }
      }
    };

    const handleStageClosed = (data: { circleId: string }) => {
      if (data.circleId === circleId) {
        setIsVisible(false);
        setLiveSession(null);
        setResultsText('');
        setCombinedResultsModal(null);
        queryClient.invalidateQueries({ queryKey: ['wheels', circleId] });
      }
    };

    const handleLiveWheelUpdated = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        setLiveSession(incoming);

        // Đồng bộ loại bỏ kết quả khỏi Celebration Modal của tất cả mọi người trong phòng
        setCombinedResultsModal((prev) => {
          if (!prev) return null;
          const remaining = prev.filter((item) => {
            const targetWheel = incoming.wheels?.find((w) => w.wheelId === item.wheelId);
            if (!targetWheel) return false;
            return targetWheel.options.some((o) => o.optionLabel === item.result);
          });
          return remaining.length > 0 ? remaining : null;
        });
      }
    };

    const handleLiveWheelStarted = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        setLiveSession(incoming);

        // Tự động đóng popup kết quả cũ trên cả 2 máy khi có lượt quay mới bắt đầu
        setCombinedResultsModal(null);

        const isSingle = Boolean(incoming.wheelId);
        const wheelsToSpin =
          incoming.wheels && incoming.wheels.length > 0
            ? incoming.wheels.filter((w) => {
                if (isSingle) return w.wheelId === incoming.wheelId;
                return w.winningIndex >= 0 && w.winningOption;
              })
            : [];

        if (wheelsToSpin.length > 0) {
          wheelsToSpin.forEach((w) => activeSpinningBatchRef.current.add(w.wheelId));

          wheelsToSpin.forEach((w) => {
            const count = Math.max(w.options.length, 1);
            const winIdx = w.winningIndex;
            const winLabel = w.winningOption?.optionLabel || w.options[winIdx]?.optionLabel || '';
            animateWheelRotation(
              w.wheelId,
              winIdx,
              count,
              soundEnabled,
              w.wheelTitle || 'Vòng quay',
              winLabel
            );
          });
        }
      }
    };

    const handleOpenFromChat = (e: any) => {
      if (e.detail?.circleId === circleId) {
        setIsVisible(true);
        if (e.detail?.session) {
          setLiveSession(e.detail.session);
        }
        setResultsText('');
        setCombinedResultsModal(null);
      }
    };

    const handleParticipantsUpdated = (data: { sessionId: string; participants: any[] }) => {
      setLiveSession((prev) => {
        if (prev && (prev.id === data.sessionId || !data.sessionId)) {
          return {
            ...prev,
            participants: data.participants,
          };
        }
        return prev;
      });
    };

    const handleCelebrationDismissed = (data: { circleId: string }) => {
      if (data.circleId === circleId) {
        setCombinedResultsModal(null);
      }
    };

    socket.on('circle:live-wheel:stage-created', handleStageCreated);
    socket.on('circle:live-wheel:stage-closed', handleStageClosed);
    socket.on('circle:live-wheel:closed', handleStageClosed);
    socket.on('circle:live-wheel:updated', handleLiveWheelUpdated);
    socket.on('circle:live-wheel:started', handleLiveWheelStarted);
    socket.on('circle:live-wheel:participants-updated', handleParticipantsUpdated);
    socket.on('circle:live-wheel:celebration-dismissed', handleCelebrationDismissed);
    window.addEventListener('circle:open-live-wheel', handleOpenFromChat);

    return () => {
      socket.off('circle:live-wheel:stage-created', handleStageCreated);
      socket.off('circle:live-wheel:stage-closed', handleStageClosed);
      socket.off('circle:live-wheel:closed', handleStageClosed);
      socket.off('circle:live-wheel:updated', handleLiveWheelUpdated);
      socket.off('circle:live-wheel:started', handleLiveWheelStarted);
      socket.off('circle:live-wheel:participants-updated', handleParticipantsUpdated);
      socket.off('circle:live-wheel:celebration-dismissed', handleCelebrationDismissed);
      window.removeEventListener('circle:open-live-wheel', handleOpenFromChat);
    };
  }, [circleId, user?.id, soundEnabled, animateWheelRotation, queryClient]);

  const participants = useMemo(() => {
    const list = liveSession?.participants || [];
    if (user && !list.some((p) => p.userId === user.id)) {
      return [
        ...list,
        {
          userId: user.id,
          displayName: user.profile?.displayName || user.email?.split('@')[0] || 'Bạn',
          avatarUrl: user.profile?.avatarUrl || null,
          joinedAt: new Date().toISOString(),
        },
      ];
    }
    return list;
  }, [liveSession?.participants, user]);

  if (!isVisible) return null;

  // Active wheel parsed options
  const activeParsedOptions = parseOptions(activeLocalState?.optionsText || '');

  // Dynamic wheel sizes by count & panel collapsed state (optimized for true full-screen experience)
  const getWheelSize = (count: number, isCollapsed: boolean) => {
    if (isCollapsed) {
      if (count === 1) return 560; // 1 vòng to chiếm trọn tâm điểm màn hình
      if (count === 2) return 380; // 2 vòng to 380px mỗi vòng
      return 280; // 3 hoặc 4 vòng: 280px
    } else {
      if (count === 1) return 440; // 1 vòng khi mở bảng: 440px
      if (count === 2) return 300; // 2 vòng: 300px
      return 230; // 3 hoặc 4 vòng: 230px
    }
  };

  const wheelSize = getWheelSize(wheels.length, isPanelCollapsed);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors animate-fadeIn">
      {/* ============================================================== */}
      {/* TOP HEADER / BAR (FULL WIDTH EDGE-TO-EDGE) */}
      {/* ============================================================== */}
      <header className="w-full z-20 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 bg-white/90 dark:bg-circle-dark-surface/90 backdrop-blur-xl border-b border-circle-hairline/80 dark:border-white/10 shrink-0">
        {/* Nhãn Tiêu đề Vòng quay ngẫu nhiên & Nút mũi tên rời phòng */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleArrowLeaveStage}
            className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-xs hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer shrink-0"
            title={locale === 'vi' ? 'Rời phòng quay' : 'Leave stage'}
            aria-label={locale === 'vi' ? 'Rời phòng quay' : 'Leave stage'}
          >
            <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-circle-primary/15 text-circle-primary flex items-center justify-center">
            <Compass className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-circle-charcoal dark:text-circle-dark-text leading-tight">
              {locale === 'vi' ? 'Vòng quay ngẫu nhiên' : 'Random Wheel'}
            </h2>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted hidden sm:block">
              {locale === 'vi' ? 'Sân khấu trực tiếp trong nhóm chat' : 'Live stage in group chat'}
            </p>
          </div>
        </div>

        {/* Cụm công cụ bên phải (Gồm dải cuộn Pills + Action Buttons cố định) */}
        <div className="flex items-center gap-2 overflow-visible min-w-0">
          {/* Thanh công cụ Floating Pills (Có thể cuộn ngang nếu nhiều vòng hoặc màn hình nhỏ) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100vw-360px)] sm:max-w-none">
            {/* Floating Pill: KẾT QUẢ */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('results');
                setIsPanelCollapsed(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl border shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
                activeTab === 'results' && !isPanelCollapsed
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                  : 'bg-white/92 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
              }`}
              title={t.luckyWheel.resultsTab}
            >
              <Trophy className={`w-4 h-4 ${activeTab === 'results' && !isPanelCollapsed ? 'text-white' : 'text-amber-500'}`} />
              <span>{t.luckyWheel.resultsTab}</span>
              {resultLinesCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'results' && !isPanelCollapsed
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {resultLinesCount}
                </span>
              )}
            </button>

            {/* Floating Pill: NGƯỜI XEM */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('viewers');
                setIsPanelCollapsed(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl border shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
                activeTab === 'viewers' && !isPanelCollapsed
                  ? 'bg-circle-primary text-white border-circle-primary shadow-md'
                  : 'bg-white/92 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
              }`}
              title={locale === 'vi' ? 'Người xem trực tiếp' : 'Live viewers'}
            >
              <Users className={`w-4 h-4 ${activeTab === 'viewers' && !isPanelCollapsed ? 'text-white' : 'text-circle-primary'}`} />
              <span>{locale === 'vi' ? 'Người xem' : 'Viewers'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'viewers' && !isPanelCollapsed
                    ? 'bg-white/20 text-white'
                    : 'bg-circle-primary/15 text-circle-primary'
                }`}
              >
                {participants.length}
              </span>
            </button>

            {/* Add Wheel Pill Button */}
            <button
              type="button"
              onClick={handleAddDefaultWheel}
              disabled={wheels.length >= 4 || isAnySpinning || createWheelMutation.isPending || !canEdit}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title={
                !canEdit
                  ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thêm vòng quay')
                  : wheels.length >= 4
                  ? t.luckyWheel.maxWheelsBadge
                  : undefined
              }
            >
              <Plus className="w-4 h-4 text-circle-sage dark:text-circle-dark-primary" />
              <span>{t.luckyWheel.addWheel}</span>
            </button>

            {/* Spin All Pill Button (Tất cả thành viên đều có thể sử dụng chức năng quay) */}
            {liveWheels.length > 0 && (
              <button
                type="button"
                onClick={handleSpinAll}
                disabled={isAnySpinning || liveSpinMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <RotateCw className={`w-4 h-4 ${isAnySpinning ? 'animate-spin' : ''}`} />
                <span>{t.luckyWheel.spinAll}</span>
              </button>
            )}
          </div>

          {/* Cụm Action Buttons Cố định (Chỉ hiển thị cho Chủ phòng: Menu 3 chấm & Đóng phòng X) */}
          {isHost && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Menu 3 Chấm: Gom Quyền chỉnh sửa & Âm thanh */}
              <div className="relative shrink-0" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreMenuOpen((prev) => !prev);
                  }}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-xl border shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
                    isMoreMenuOpen
                      ? 'bg-circle-primary text-white border-circle-primary shadow-md'
                      : 'bg-white/92 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
                  }`}
                  title={locale === 'vi' ? 'Cài đặt phòng quay (Âm thanh & Quyền sửa)' : 'Stage settings'}
                  aria-label={locale === 'vi' ? 'Cài đặt phòng quay' : 'Stage settings'}
                >
                  <MoreHorizontal className="w-4.5 h-4.5" />
                </button>

                {/* Dropdown Menu kính mờ */}
                {isMoreMenuOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-11 z-50 w-72 rounded-2xl bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-2xl border border-circle-hairline/80 dark:border-white/15 shadow-2xl p-2.5 flex flex-col gap-1.5 animate-scaleUp"
                  >
                    {/* Header Menu */}
                    <div className="px-2.5 py-1 text-[11px] font-bold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider">
                      {locale === 'vi' ? 'Cài đặt phòng quay' : 'Stage settings'}
                    </div>

                    {/* 1. ÂM THANH */}
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      disabled={isAnySpinning}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer group text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            currentSoundEnabled
                              ? 'bg-circle-primary/10 text-circle-primary dark:text-circle-dark-primary'
                              : 'bg-slate-100 dark:bg-white/5 text-circle-slate dark:text-circle-dark-muted'
                          }`}
                        >
                          {currentSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {t.luckyWheel.soundSetting}
                          </p>
                          <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                            {currentSoundEnabled
                              ? (locale === 'vi' ? 'Bật âm thanh quay & chúc mừng' : 'Sound enabled')
                              : (locale === 'vi' ? 'Đang tắt âm thanh' : 'Muted')}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                          currentSoundEnabled ? 'bg-circle-primary' : 'bg-slate-300 dark:bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                            currentSoundEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>

                    <div className="h-px bg-circle-hairline/80 dark:bg-white/10 my-0.5" />

                    {/* 2. QUYỀN CHỈNH SỬA */}
                    <button
                      type="button"
                      onClick={handleToggleAllowEdit}
                      disabled={updateSettingsMutation.isPending}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer group text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            allowMembersToEdit
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {allowMembersToEdit ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {t.luckyWheel.allowEdit || (locale === 'vi' ? 'Cho phép sửa' : 'Allow edit')}
                          </p>
                          <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                            {allowMembersToEdit
                              ? (locale === 'vi' ? 'Tất cả thành viên đều được sửa' : 'All members can edit')
                              : (locale === 'vi' ? 'Chỉ chủ phòng mới được sửa' : 'Host only')}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                          allowMembersToEdit ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                            allowMembersToEdit ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Nút Đóng phòng (Chủ phòng) */}
              <button
                type="button"
                onClick={handleCloseStage}
                disabled={closeLiveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0"
                title={locale === 'vi' ? 'Đóng phòng quay và gửi kết quả vào chat' : 'Close stage & share results'}
              >
                <X className="w-4 h-4" />
                <span>{t.luckyWheel.closeStage || (locale === 'vi' ? 'Đóng phòng' : 'Close')}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================== */}
      {/* FULL-SCREEN WORKSPACE (VISUAL ARENA + SETUP PANEL) */}
      {/* ============================================================== */}
      <div className="flex-1 w-full min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {/* CỘT BÊN TRÁI: SÂN KHẤU VÒNG QUAY (VISUAL ARENA) */}
        <div className="flex-1 h-full min-w-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto relative">
            {wheels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Compass className="w-16 h-16 text-circle-slate/30 dark:text-circle-dark-muted/30 mb-3" />
                <h3 className="text-base font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1">
                  {t.luckyWheel.emptyWheelsTitle}
                </h3>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted max-w-sm mb-4">
                  {t.luckyWheel.emptyWheelsDesc}
                </p>
                <button
                  type="button"
                  onClick={handleAddDefaultWheel}
                  className="inline-flex items-center gap-1.5 px-5 h-9 text-xs sm:text-sm font-bold rounded-full bg-circle-primary hover:bg-circle-sage text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.luckyWheel.createWheel}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0 overflow-y-auto py-2">
                {/* 1 VÒNG: Hiển thị 1 vòng to chính giữa */}
                {liveWheels.length === 1 && (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveWheelId(liveWheels[0]!.wheelId);
                        setActiveTab(liveWheels[0]!.wheelId);
                        setIsPanelCollapsed(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                        activeWheelId === liveWheels[0]!.wheelId
                          ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                          : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                      }`}
                      title={liveWheels[0]!.wheelTitle}
                    >
                      <Compass
                        className={`w-3.5 h-3.5 shrink-0 ${
                          activeWheelId === liveWheels[0]!.wheelId
                            ? 'text-white'
                            : 'text-circle-sage dark:text-circle-dark-primary'
                        }`}
                      />
                      <span className="truncate">{liveWheels[0]!.wheelTitle}</span>
                    </button>

                    <WheelCanvas
                      options={parseOptions(wheelsState[liveWheels[0]!.wheelId]?.optionsText || '')}
                      rotation={wheelsState[liveWheels[0]!.wheelId]?.rotation || 0}
                      size={wheelSize}
                      onClick={() => {
                        handleSpinSingle(liveWheels[0]!);
                      }}
                    />
                  </div>
                )}

                {/* 2 VÒNG: Hàng trên 2 vòng đặt cạnh nhau */}
                {liveWheels.length === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl justify-items-center">
                    {liveWheels.map((wheel) => {
                      const local = wheelsState[wheel.wheelId];
                      const parsed = parseOptions(local?.optionsText || '');
                      return (
                        <div
                          key={wheel.wheelId}
                          className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWheelId(wheel.wheelId);
                              setActiveTab(wheel.wheelId);
                              setIsPanelCollapsed(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                              activeWheelId === wheel.wheelId
                                ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                                : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                            }`}
                            title={wheel.wheelTitle}
                          >
                            <Compass
                              className={`w-3.5 h-3.5 shrink-0 ${
                                activeWheelId === wheel.wheelId
                                  ? 'text-white'
                                  : 'text-circle-sage dark:text-circle-dark-primary'
                              }`}
                            />
                            <span className="truncate">{wheel.wheelTitle}</span>
                          </button>

                          <WheelCanvas
                            options={parsed}
                            rotation={local?.rotation || 0}
                            size={wheelSize}
                            onClick={() => {
                              handleSpinSingle(wheel);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3 VÒNG: Hàng trên 2 vòng, Hàng dưới 1 vòng ở giữa */}
                {liveWheels.length === 3 && (
                  <div className="flex flex-col items-center gap-8 w-full max-w-5xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full justify-items-center">
                      {liveWheels.slice(0, 2).map((wheel) => {
                        const local = wheelsState[wheel.wheelId];
                        const parsed = parseOptions(local?.optionsText || '');
                        return (
                          <div
                            key={wheel.wheelId}
                            className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveWheelId(wheel.wheelId);
                                setActiveTab(wheel.wheelId);
                                setIsPanelCollapsed(false);
                              }}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                                activeWheelId === wheel.wheelId
                                  ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                                  : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                              }`}
                              title={wheel.wheelTitle}
                            >
                              <Compass
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  activeWheelId === wheel.wheelId
                                    ? 'text-white'
                                    : 'text-circle-sage dark:text-circle-dark-primary'
                                }`}
                              />
                              <span className="truncate">{wheel.wheelTitle}</span>
                            </button>

                            <WheelCanvas
                              options={parsed}
                              rotation={local?.rotation || 0}
                              size={wheelSize}
                              onClick={() => {
                                handleSpinSingle(wheel);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {liveWheels[2] && (
                      <div className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWheelId(liveWheels[2]!.wheelId);
                            setActiveTab(liveWheels[2]!.wheelId);
                            setIsPanelCollapsed(false);
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                            activeWheelId === liveWheels[2]!.wheelId
                              ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                              : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                          }`}
                          title={liveWheels[2]!.wheelTitle}
                        >
                          <Compass
                            className={`w-3.5 h-3.5 shrink-0 ${
                              activeWheelId === liveWheels[2]!.wheelId
                                ? 'text-white'
                                : 'text-circle-sage dark:text-circle-dark-primary'
                            }`}
                          />
                          <span className="truncate">{liveWheels[2]!.wheelTitle}</span>
                        </button>

                        <WheelCanvas
                          options={parseOptions(wheelsState[liveWheels[2]!.wheelId]?.optionsText || '')}
                          rotation={wheelsState[liveWheels[2]!.wheelId]?.rotation || 0}
                          size={wheelSize}
                          onClick={() => {
                            handleSpinSingle(liveWheels[2]!);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 4 VÒNG: LƯỚI 2x2 (2 vòng hàng trên, 2 vòng hàng dưới) */}
                {liveWheels.length === 4 && (
                  <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-5xl justify-items-center">
                    {liveWheels.map((wheel) => {
                      const local = wheelsState[wheel.wheelId];
                      const parsed = parseOptions(local?.optionsText || '');
                      return (
                        <div
                          key={wheel.wheelId}
                          className="flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWheelId(wheel.wheelId);
                              setActiveTab(wheel.wheelId);
                              setIsPanelCollapsed(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs w-36 ${
                              activeWheelId === wheel.wheelId
                                ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                                : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline/80 dark:border-white/12 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                            }`}
                            title={wheel.wheelTitle}
                          >
                            <Compass
                              className={`w-3.5 h-3.5 shrink-0 ${
                                activeWheelId === wheel.wheelId
                                  ? 'text-white'
                                  : 'text-circle-sage dark:text-circle-dark-primary'
                              }`}
                            />
                            <span className="truncate">{wheel.wheelTitle}</span>
                          </button>

                          <WheelCanvas
                            options={parsed}
                            rotation={local?.rotation || 0}
                            size={wheelSize}
                            onClick={() => {
                              handleSpinSingle(wheel);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* CỘT BÊN PHẢI: "CÁI BẢNG" (TABBED OPTIONS BOARD & RESULTS) */}
          {/* ============================================================== */}
          {!isPanelCollapsed && (
            <div className="relative w-full lg:w-[420px] xl:w-[460px] h-full shrink-0 flex flex-col bg-white dark:bg-circle-dark-surface border-l border-circle-hairline/80 dark:border-white/10 shadow-xl p-4 sm:p-6 transition-all">
              {/* Nút thu gọn bảng: Nằm giữa cái viền luôn nửa trong nửa ngoài, to, z-40 và không bị cắt */}
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(true)}
                className="absolute top-6 -left-4 z-40 w-8 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-circle-dark-surface border border-circle-hairline/80 dark:border-white/12 shadow-lg hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-90 group cursor-pointer"
                title={t.luckyWheel.collapsePanel}
                aria-label={t.luckyWheel.collapsePanel}
              >
                <PanelRightClose className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Tabs Header: Tên của từng vòng + TAB KẾT QUẢ */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline no-scrollbar shrink-0">
                {liveWheels.map((wheel) => {
                  const isSelected = activeTab === wheel.wheelId;
                  return (
                    <button
                      key={wheel.wheelId}
                      type="button"
                      onClick={() => {
                        setActiveTab(wheel.wheelId);
                        setActiveWheelId(wheel.wheelId);
                      }}
                      className={`flex items-center justify-center w-28 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-circle-primary text-white shadow-xs font-bold'
                          : 'bg-circle-wash/60 dark:bg-circle-dark-wash/40 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                      }`}
                      title={wheel.wheelTitle}
                    >
                      <span className="truncate">{wheel.wheelTitle}</span>
                    </button>
                  );
                })}

                {/* Tab Kết Quả */}
                <button
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className={`flex items-center justify-center gap-1.5 min-w-24 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'results'
                      ? 'bg-amber-500 text-white shadow-xs font-bold'
                      : 'bg-circle-wash/60 dark:bg-circle-dark-wash/40 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.luckyWheel.resultsTab}</span>
                  {resultLinesCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeTab === 'results'
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {resultLinesCount}
                    </span>
                  )}
                </button>

                {/* Tab: NGƯỜI XEM */}
                <button
                  type="button"
                  onClick={() => setActiveTab('viewers')}
                  className={`flex items-center justify-center gap-1.5 min-w-24 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'viewers'
                      ? 'bg-circle-primary text-white shadow-xs font-bold'
                      : 'bg-circle-wash/60 dark:bg-circle-dark-wash/40 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{locale === 'vi' ? 'Người xem' : 'Viewers'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'viewers'
                        ? 'bg-white/20 text-white'
                        : 'bg-circle-primary/15 text-circle-primary'
                    }`}
                  >
                    {participants.length}
                  </span>
                </button>
              </div>

              {/* TAB CONTENT: KẾT QUẢ (DẠNG TEXT CHỈ ĐỌC, GHI THEO LẦN) */}
              {activeTab === 'results' ? (
                <div className="flex-1 min-h-0 flex flex-col pt-4 gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-sm text-circle-charcoal dark:text-circle-dark-text truncate">
                        {t.luckyWheel.resultsHistoryTitle}
                      </span>
                      <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-semibold">
                        ({resultLinesCount})
                      </span>
                    </div>
                  </div>

                  {/* Textarea lớn chỉ đọc hiển thị kết quả */}
                  <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                    <textarea
                      value={resultsText}
                      readOnly
                      placeholder={t.luckyWheel.resultsPlaceholder}
                      className="w-full flex-1 min-h-0 p-3 text-sm rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:outline-none resize-none leading-relaxed transition-all font-mono select-text cursor-default"
                    />
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate shrink-0">
                      {t.luckyWheel.resultsHint}
                    </p>
                  </div>

                  {/* Thanh tác vụ dưới cùng: Sắp xếp, Gửi tin nhắn, Xoá tất cả (Icons only) */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                    {/* Nút Sắp xếp */}
                    <button
                      type="button"
                      onClick={handleSortResults}
                      disabled={resultLinesCount < 2}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                      title={t.luckyWheel.sortResults}
                      aria-label={t.luckyWheel.sortResults}
                    >
                      <ArrowDownAZ className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </button>

                    {/* Nút Gửi bảng kết quả vào tin nhắn */}
                    <button
                      type="button"
                      onClick={handleShareResultsToChat}
                      disabled={resultLinesCount === 0 || shareResultsMutation.isPending}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                      title={shareSuccess ? t.luckyWheel.shareResultsSuccess : t.luckyWheel.shareResultsToChat}
                      aria-label={t.luckyWheel.shareResultsToChat}
                    >
                      {shareSuccess ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>

                    {/* Nút Xoá tất cả kết quả */}
                    <button
                      type="button"
                      onClick={handleClearResults}
                      disabled={resultLinesCount === 0}
                      className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-900/40 text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                      title={t.luckyWheel.clearResults}
                      aria-label={t.luckyWheel.clearResults}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </button>
                  </div>

                  {/* Hàng thiết lập ở đáy: Xoá tất cả vòng quay */}
                  <div className="flex items-center justify-end pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteAllWheels}
                      disabled={isAnySpinning || wheels.length === 0 || !canEdit}
                      className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền xóa') : t.luckyWheel.deleteAllWheels}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.deleteAllWheels}</span>
                    </button>
                  </div>
                </div>
              ) : activeTab === 'viewers' ? (
                /* TAB CONTENT: NGƯỜI XEM (VIEWERS LIST) */
                <div className="flex-1 min-h-0 flex flex-col pt-4 gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-circle-primary" />
                      <span className="font-bold text-sm text-circle-charcoal dark:text-circle-dark-text truncate">
                        {locale === 'vi' ? 'Người đang xem trực tiếp' : 'Live Viewers'}
                      </span>
                      <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-semibold">
                        ({participants.length})
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {participants.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-circle-slate dark:text-circle-dark-muted text-xs">
                        <Users className="w-8 h-8 mb-2 opacity-30" />
                        <p>{locale === 'vi' ? 'Chưa có người xem nào' : 'No viewers yet'}</p>
                      </div>
                    ) : (
                      participants.map((p) => {
                        const isCreator = p.userId === liveSession?.creatorId;
                        const isMe = p.userId === user?.id;
                        return (
                          <div
                            key={p.userId}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 hover:bg-circle-wash/50 dark:hover:bg-circle-dark-wash/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                {p.avatarUrl ? (
                                  <img
                                    src={p.avatarUrl}
                                    alt={p.displayName}
                                    className="w-8 h-8 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-circle-primary/10 text-circle-primary font-bold text-xs flex items-center justify-center border border-circle-primary/20">
                                    {(p.displayName || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-circle-dark-surface" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                                    {p.displayName}
                                  </p>
                                  {isMe && (
                                    <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-normal">
                                      ({locale === 'vi' ? 'Bạn' : 'You'})
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  {locale === 'vi' ? 'Đang theo dõi' : 'Watching'}
                                </p>
                              </div>
                            </div>

                            {isCreator && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                {locale === 'vi' ? 'Chủ phòng' : 'Host'}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Hàng thiết lập ở đáy: Xoá tất cả vòng quay */}
                  <div className="flex items-center justify-end pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteAllWheels}
                      disabled={isAnySpinning || wheels.length === 0 || !canEdit}
                      className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền xóa') : t.luckyWheel.deleteAllWheels}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.deleteAllWheels}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB CONTENT: ACTIVE WHEEL (OPTIONS & SETTINGS) */
                activeWheel && (
                  <div className="flex-1 min-h-0 flex flex-col pt-4 gap-3.5">
                    {/* Wheel Title Row */}
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            maxLength={50}
                            value={editingTitleText}
                            onChange={(e) => setEditingTitleText(e.target.value)}
                            onBlur={saveEditTitle}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditTitle()}
                            autoFocus
                            disabled={isAnySpinning || !canEdit}
                            className="flex-1 px-2.5 py-1 text-sm font-semibold rounded-lg border border-circle-primary bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text focus:outline-none disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={saveEditTitle}
                            disabled={isAnySpinning || !canEdit}
                            className="p-1 rounded-md bg-circle-primary hover:bg-circle-sage text-white disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 group">
                          <span className="font-bold text-sm text-circle-charcoal dark:text-circle-dark-text truncate max-w-[240px]">
                            {activeWheel.wheelTitle}
                          </span>
                          {!isAnySpinning && canEdit && (
                            <button
                              type="button"
                              onClick={startEditTitle}
                              className="opacity-70 group-hover:opacity-100 p-1 rounded hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-opacity cursor-pointer shrink-0"
                              title={t.luckyWheel.renameWheel}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Delete wheel if more than 1 wheel */}
                      {liveWheels.length > 1 && canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isAnySpinning) return;
                            if (window.confirm(t.luckyWheel.confirmDeleteDesc)) {
                              deleteWheelMutation.mutate(activeWheel.wheelId);
                            }
                          }}
                          disabled={isAnySpinning}
                          className="p-1.5 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                          title={t.luckyWheel.confirmDeleteTitle}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Banner hiển thị quyền chỉnh sửa */}
                    {!canEdit ? (
                      <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium shrink-0 animate-fadeIn">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">{t.luckyWheel.viewOnlyDesc || 'Chế độ chỉ xem — Chỉ chủ phòng mới có quyền chỉnh sửa'}</span>
                      </div>
                    ) : !isHost ? (
                      <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-fadeIn">
                        <LockOpen className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate">{t.luckyWheel.collabEditDesc || 'Chế độ cùng sửa — Chủ phòng đã cho phép bạn chỉnh sửa'}</span>
                      </div>
                    ) : null}

                    {/* Textarea: Large, 1 line = 1 option */}
                    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-circle-slate dark:text-circle-dark-muted shrink-0">
                        <span className="font-medium">{t.luckyWheel.optionsListTitle}</span>
                        <span
                          className={`font-semibold ${
                            activeParsedOptions.length < 1 ? 'text-amber-500' : 'text-circle-primary dark:text-circle-dark-primary'
                          }`}
                        >
                          {t.luckyWheel.optionsCount.replace(
                            '{count}',
                            String(activeParsedOptions.length)
                          )}
                        </span>
                      </div>

                      <textarea
                        value={activeLocalState?.optionsText || ''}
                        onChange={(e) => handleOptionsChange(e.target.value)}
                        readOnly={isAnySpinning || !canEdit}
                        placeholder={
                          !canEdit
                            ? (t.luckyWheel.viewOnlyDesc || 'Chế độ chỉ xem. Chỉ chủ phòng mới có quyền chỉnh sửa nội dung.')
                            : t.luckyWheel.optionsPlaceholder
                        }
                        className={`w-full flex-1 min-h-0 p-3 text-sm rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:bg-white dark:focus:bg-circle-dark-canvas focus:ring-2 focus:ring-circle-primary/40 focus:outline-none resize-none leading-relaxed transition-all font-mono disabled:opacity-50 ${
                          !canEdit ? 'cursor-default select-text' : ''
                        }`}
                      />

                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted shrink-0">
                        {!canEdit
                          ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền chỉnh sửa nội dung')
                          : t.luckyWheel.optionsHint}
                      </p>
                    </div>

                    {/* Action Buttons: Shuffle, Sort A-Z, Save Initial & Reset (Icons only, no text) */}
                    <div className="grid grid-cols-4 gap-2 pt-1 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                      {/* Shuffle Button */}
                      <button
                        type="button"
                        onClick={handleShuffle}
                        disabled={isAnySpinning || !canEdit}
                        className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.shuffleOptions}
                        aria-label={t.luckyWheel.shuffleOptions}
                      >
                        <Shuffle className="w-4 h-4 text-circle-sage dark:text-circle-dark-primary" />
                      </button>

                      {/* Sort A-Z Button */}
                      <button
                        type="button"
                        onClick={handleSortAZ}
                        disabled={isAnySpinning || !canEdit}
                        className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.sortAZ}
                        aria-label={t.luckyWheel.sortAZ}
                      >
                        <ArrowDownAZ className="w-4 h-4 text-indigo-500" />
                      </button>

                      {/* Save as Initial Button */}
                      <button
                        type="button"
                        onClick={handleSaveAsInitial}
                        disabled={isAnySpinning || updateWheelMutation.isPending || !canEdit}
                        className={`flex items-center justify-center py-2 px-2 rounded-xl border transition-all active:scale-95 ${
                          saveInitialFeedback
                            ? 'border-circle-primary bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-dark-primary'
                            : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
                        }`}
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.saveAsInitial}
                        aria-label={t.luckyWheel.saveAsInitial}
                      >
                        <BookmarkCheck
                          className={`w-4 h-4 ${
                            saveInitialFeedback ? 'text-circle-primary' : 'text-circle-sage dark:text-circle-dark-primary'
                          }`}
                        />
                      </button>

                      {/* Reset Button */}
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={isAnySpinning || !canEdit}
                        className="flex items-center justify-center py-2 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền thao tác') : t.luckyWheel.resetOptions}
                        aria-label={t.luckyWheel.resetOptions}
                      >
                        <RotateCcw className="w-4 h-4 text-amber-500" />
                      </button>
                    </div>

                    {/* Wheel Settings: Delete All */}
                    <div className="flex items-center justify-end pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline text-xs shrink-0">
                      {/* Delete All Wheels Button */}
                      <button
                        type="button"
                        onClick={handleDeleteAllWheels}
                        disabled={isAnySpinning || wheels.length === 0 || !canEdit}
                        className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title={!canEdit ? (t.luckyWheel.viewOnlyDesc || 'Chỉ chủ phòng mới có quyền xóa') : t.luckyWheel.deleteAllWheels}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.luckyWheel.deleteAllWheels}</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Nút mở lại bảng: Ghim ở mép bên phải màn hình khi thu gọn */}
          {isPanelCollapsed && (
            <button
              type="button"
              onClick={() => setIsPanelCollapsed(false)}
              className="absolute right-0 top-6 z-30 flex items-center justify-center w-8 h-12 rounded-l-2xl bg-white dark:bg-circle-dark-surface border-y border-l border-circle-hairline/80 dark:border-white/12 shadow-md text-circle-slate dark:text-circle-dark-muted hover:text-circle-primary dark:hover:text-circle-primary transition-all active:scale-90 group cursor-pointer"
              title={t.luckyWheel.expandPanel}
              aria-label={t.luckyWheel.expandPanel}
            >
              <PanelRightOpen className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>
          )}
      </div>

      {/* ============================================================== */}
      {/* COMBINED / BATCH RESULTS MODAL - CELEBRATION WINNER SHOWCASE */}
      {/* ============================================================== */}
      {combinedResultsModal && combinedResultsModal.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleDismissCombinedResultsModal}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/60 dark:border-amber-500/30 bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-white shadow-2xl animate-scaleUp flex flex-col"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration Header Background Glow */}
            <div className="relative pt-7 pb-3 px-6 flex flex-col items-center text-center bg-gradient-to-b from-amber-400/15 via-circle-wash to-transparent">
              <button
                type="button"
                onClick={handleDismissCombinedResultsModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={t.luckyWheel.close}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Glowing Golden Trophy Icon */}
              <div className="relative mb-2.5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 blur-lg opacity-40 animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/30 text-white">
                  <Trophy className="w-7 h-7" />
                </div>
              </div>

              {/* Header Title */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>🎉</span>
                <span>{t.luckyWheel.winnerTitle}</span>
              </h3>
            </div>

            {/* Single Winner Showcase */}
            {combinedResultsModal.length === 1 && (
              <div className="p-6 pt-2 pb-6 flex flex-col items-center">
                <div className="w-full relative overflow-hidden rounded-2xl border-2 border-amber-300/80 dark:border-amber-500/40 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-circle-dark-surface dark:to-amber-950/20 p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[220px]">{combinedResultsModal[0]!.wheelTitle}</span>
                  </div>

                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight select-all leading-tight drop-shadow-xs my-1">
                    {combinedResultsModal[0]!.result}
                  </span>

                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium mt-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.luckyWheel.luckyChoiceBadge}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </p>
                </div>

                <div className="w-full flex flex-col gap-2 mt-5">
                  <button
                    type="button"
                    onClick={handleDismissCombinedResultsModal}
                    className="w-full py-3 px-6 rounded-2xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.luckyWheel.close}</span>
                  </button>

                  {(canEdit || isParticipant) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveResult(
                          combinedResultsModal[0]!.wheelId,
                          combinedResultsModal[0]!.result,
                          combinedResultsModal[0]!.resultIndex,
                        )
                      }
                      className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.removeResult}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Multiple Winners Showcase (Spin All) */}
            {combinedResultsModal.length > 1 && (
              <div className="p-6 pt-2 pb-6 flex flex-col">
                <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {combinedResultsModal.map((item) => (
                    <div
                      key={item.wheelId}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/70 to-circle-wash dark:from-amber-950/20 dark:to-circle-dark-wash border border-amber-200/60 dark:border-white/10 transition-all"
                    >
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider truncate mb-0.5">
                          {item.wheelTitle}
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                          {item.result}
                        </span>
                      </div>
                      {(canEdit || isParticipant) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveResult(item.wheelId, item.result, item.resultIndex)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-all shrink-0 active:scale-95 cursor-pointer"
                          title={t.luckyWheel.removeResult}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-5">
                  <button
                    type="button"
                    onClick={handleDismissCombinedResultsModal}
                    className="w-full py-3 px-6 rounded-2xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.luckyWheel.close}</span>
                  </button>
                  {(canEdit || isParticipant) && (
                    <button
                      type="button"
                      onClick={handleRemoveAllBatchResults}
                      className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.luckyWheel.removeAllResults}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Xác nhận Rời phòng / Đóng phòng khi bấm Mũi tên góc trái */}
      {confirmLeaveModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setConfirmLeaveModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-white/10 shadow-2xl p-6 flex flex-col gap-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {locale === 'vi' ? 'Rời phòng quay' : 'Leave stage'}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-circle-charcoal dark:text-circle-dark-text/90 leading-relaxed">
              {isHost
                ? (locale === 'vi'
                    ? 'Bạn muốn đóng phòng quay hay vẫn mở và chuyển chủ phòng cho người khác?'
                    : 'Do you want to close the wheel stage or keep it open and transfer host?')
                : (locale === 'vi'
                    ? 'Bạn có chắc chắn muốn rời khỏi phòng quay không?'
                    : 'Are you sure you want to leave the live stage?')}
            </p>

            <div className="flex flex-col sm:flex-row-reverse items-stretch sm:items-center gap-2.5 pt-2">
              {isHost ? (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      setConfirmLeaveModalOpen(false);
                      await handleCloseStage();
                    }}
                    disabled={closeLiveMutation.isPending}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-center"
                  >
                    {locale === 'vi' ? 'Đóng phòng' : 'Close stage'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTransferHostAndLeave}
                    disabled={leaveLiveMutation.isPending}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-center"
                  >
                    {locale === 'vi' ? 'Vẫn mở (Chuyển chủ)' : 'Keep open (Transfer)'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmLeaveAsSpectator}
                  disabled={leaveLiveMutation.isPending}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-center"
                >
                  {locale === 'vi' ? 'Rời phòng' : 'Leave'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmLeaveModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-circle-hairline dark:border-white/10 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer text-center"
              >
                {locale === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
