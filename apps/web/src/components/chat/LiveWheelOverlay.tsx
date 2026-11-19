'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Compass,
  X,
  Trophy,
  Sparkles,
  Volume2,
  VolumeX,
  Users,
  ArrowRight,
  User,
  Play,
  Loader2,
  RotateCw,
  Trash2,
  Check,
  Maximize2,
  Minimize2,
  Edit2,
  Shuffle,
  ArrowDownAZ,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { LiveWheelSession, LiveWheelItem, LiveWheelParticipant } from '@circle/types';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { getSocket } from '../../lib/socket';
import {
  useActiveLiveWheelQuery,
  useLiveSpinWheelMutation,
  useLiveRemoveResultMutation,
  useCloseLiveWheelMutation,
  useUpdateWheelMutation,
  useShareWheelResultsToChatMutation,
} from '../../hooks/use-circle-tools';

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

// Web Audio API tick & fanfare
class LiveWheelAudioEngine {
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
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);
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
        gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {}
  }
}

const liveAudio = new LiveWheelAudioEngine();

// Component vẽ 1 bánh xe độc lập giống CircleWheelView
const SingleLiveWheelCanvas: React.FC<{
  options: { optionLabel: string; color: string }[];
  rotation: number;
  size?: number;
}> = ({ options, rotation, size = 175 }) => {
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
    const radius = center - 2;
    const count = Math.max(options.length, 1);
    const sliceAngle = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    options.forEach((opt, idx) => {
      const startAngle = idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!;
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1E293B';
      ctx.font = `600 ${size > 200 ? 11.5 : 10}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 2;

      const maxLabelLen = size > 200 ? 12 : 9;
      let label = opt.optionLabel;
      if (label.length > maxLabelLen) {
        label = label.substring(0, maxLabelLen - 1) + '…';
      }
      ctx.fillText(label, radius - 12, 3.5);
      ctx.restore();
    });

    ctx.restore();

    // Vành viền ngoài
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Center circular hub
    ctx.beginPath();
    ctx.arc(center, center, size > 200 ? 18 : 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Center small circle (brand primary teal)
    ctx.beginPath();
    ctx.arc(center, center, size > 200 ? 7 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#0D9488';
    ctx.fill();
  }, [options, rotation, size]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full shadow-lg"
      />
      {/* Kim chỉ bên phải */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-md flex items-center"
        style={{ right: -12 }}
      >
        <svg width="26" height="18" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  const [session, setSession] = useState<LiveWheelSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);
  const [wheelRotations, setWheelRotations] = useState<number[]>([0, 0, 0, 0]);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('results');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showResultsPopup, setShowResultsPopup] = useState(false);

  // Lịch sử kết quả ghi theo từng dòng (Read-only)
  const [resultsText, setResultsText] = useState<string>('');
  const resultLines = useMemo(() => (resultsText.trim() ? resultsText.trim().split('\n') : []), [resultsText]);

  // State chỉnh sửa các lựa chọn của từng vòng (chỉ người tạo mới sửa được)
  const [editingOptionsText, setEditingOptionsText] = useState<Record<string, string>>({});
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');
  const [saveSuccessWheelId, setSaveSuccessWheelId] = useState<string | null>(null);
  const [isSharingResults, setIsSharingResults] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Xác định người tạo (chỉ người tạo mới thấy và sửa thiết lập)
  const isCreator = Boolean(
    user?.id && (user.id === session?.creatorId || user.id === session?.spunBy?.userId)
  );

  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const confettiFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef<number>(0);
  const fanfarePlayedRef = useRef<boolean>(false);
  const lastRecordedStartedAtRef = useRef<number>(0);

  // Mutations
  const liveSpinMutation = useLiveSpinWheelMutation(circleId);
  const liveRemoveMutation = useLiveRemoveResultMutation(circleId);
  const closeLiveMutation = useCloseLiveWheelMutation(circleId);
  const updateWheelMutation = useUpdateWheelMutation(circleId);
  const shareResultsMutation = useShareWheelResultsToChatMutation(circleId);

  // 1. Fetch active session on mount or circle switch
  const { data: initialActiveSession, refetch: refetchActiveSession } = useActiveLiveWheelQuery(circleId);

  useEffect(() => {
    if (initialActiveSession && initialActiveSession.id !== dismissedSessionId) {
      const elapsed = Date.now() - initialActiveSession.startedAt;
      if (elapsed < 4 * 60 * 60 * 1000) {
        setSession(initialActiveSession);
        if (initialActiveSession.stageStatus === 'idle') {
          setIsFinished(false);
        } else if (elapsed >= (initialActiveSession.durationMs || 6000)) {
          setIsFinished(true);
        }
      }
    }
  }, [initialActiveSession, dismissedSessionId]);

  // 2. Lắng nghe socket sự kiện realtime
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStageCreated = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        fanfarePlayedRef.current = false;
        lastTickAngleRef.current = 0;
        setDismissedSessionId(null);
        setSession(incoming);
        setIsVisible(true);
        setIsFinished(false);
        setWheelRotations([0, 0, 0, 0]);
      }
    };

    const handleLiveWheelStarted = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        fanfarePlayedRef.current = false;
        lastTickAngleRef.current = 0;
        setDismissedSessionId(null);
        setSession(incoming);
        setIsVisible(true);
        setIsFinished(false);
      }
    };

    const handleParticipantsUpdated = (data: { sessionId: string; participants: LiveWheelParticipant[] }) => {
      setSession((prev) => {
        if (prev && prev.id === data.sessionId) {
          return {
            ...prev,
            participants: data.participants,
          };
        }
        return prev;
      });
    };

    const handleWheelUpdated = (incoming: LiveWheelSession) => {
      if (incoming.circleId === circleId) {
        setSession(incoming);
      }
    };

    // Khi người tạo đóng phòng quay -> tất cả người xem tự động đóng overlay
    const handleStageClosed = (data: { circleId: string }) => {
      if (data.circleId === circleId) {
        setIsVisible(false);
        setSession(null);
      }
    };

    // Lắng nghe sự kiện custom từ tin nhắn chat khi người dùng bấm "Tham gia vòng quay"
    const handleOpenFromChat = (e: any) => {
      if (e.detail?.circleId === circleId) {
        setDismissedSessionId(null);
        setIsVisible(true);
        if (e.detail?.session) {
          setSession(e.detail.session);
        } else {
          refetchActiveSession();
        }
      }
    };

    socket.on('circle:live-wheel:stage-created', handleStageCreated);
    socket.on('circle:live-wheel:started', handleLiveWheelStarted);
    socket.on('circle:live-wheel:participants-updated', handleParticipantsUpdated);
    socket.on('circle:live-wheel:updated', handleWheelUpdated);
    socket.on('circle:live-wheel:closed', handleStageClosed);
    window.addEventListener('circle:open-live-wheel', handleOpenFromChat);

    return () => {
      socket.off('circle:live-wheel:stage-created', handleStageCreated);
      socket.off('circle:live-wheel:started', handleLiveWheelStarted);
      socket.off('circle:live-wheel:participants-updated', handleParticipantsUpdated);
      socket.off('circle:live-wheel:updated', handleWheelUpdated);
      socket.off('circle:live-wheel:closed', handleStageClosed);
      window.removeEventListener('circle:open-live-wheel', handleOpenFromChat);
    };
  }, [circleId, refetchActiveSession]);

  // Nếu là người xem, đảm bảo tab không bị kẹt ở tab thiết lập vòng (chỉ xem results hoặc participants)
  useEffect(() => {
    if (!isCreator && activeTab !== 'results' && activeTab !== 'participants') {
      setActiveTab('results');
    }
  }, [isCreator, activeTab]);

  // Danh sách 4 vòng xoay trong session
  const wheelsList: LiveWheelItem[] = useMemo(() => {
    if (session?.wheels && session.wheels.length > 0) {
      return session.wheels.slice(0, 4);
    }
    if (session?.options && session.options.length > 0) {
      return [
        {
          wheelId: session.wheelId || 'single-wheel',
          wheelTitle: session.wheelTitle || 'Vòng 1',
          options: session.options,
          winningIndex: session.winningIndex,
          winningOption: session.winningOption,
        },
      ];
    }
    return [];
  }, [session]);

  // 3. Chuẩn bị góc quay đích cho từng vòng
  const finalRotations = useMemo(() => {
    return wheelsList.map((w, idx) => {
      const count = Math.max(w.options.length, 1);
      const sliceDeg = 360 / count;
      const winIdx = w.winningIndex >= 0 ? w.winningIndex : 0;
      const targetCenterDeg = winIdx * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;
      const extraSpins = (6 + idx) * 360;
      return extraSpins + stopAngle;
    });
  }, [wheelsList]);

  // 4. Confetti Animation
  const startConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      vx: number;
      vy: number;
      rotation: number;
      vRot: number;
      life: number;
    }> = [];

    const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444'];
    for (let i = 0; i < 110; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 120,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 15,
        life: 1,
      });
    }

    const animateConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.vx *= 0.98;
        p.rotation += p.vRot;
        p.life -= 0.009;

        if (p.life > 0 && p.y < canvas.height + 50) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        confettiFrameRef.current = requestAnimationFrame(animateConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (confettiFrameRef.current) cancelAnimationFrame(confettiFrameRef.current);
    confettiFrameRef.current = requestAnimationFrame(animateConfetti);
  }, []);

  // 5. Ghi nhận kết quả theo từng dòng khi hoàn tất lượt quay
  const recordResultLine = useCallback(() => {
    if (
      session &&
      session.stageStatus === 'spinning' &&
      session.startedAt &&
      lastRecordedStartedAtRef.current !== session.startedAt
    ) {
      lastRecordedStartedAtRef.current = session.startedAt;
      setResultsText((prev) => {
        const lines = prev.trim() ? prev.trim().split('\n') : [];
        const roundNum = lines.length + 1;
        let line = '';
        if (wheelsList.length > 1) {
          const parts = wheelsList
            .map((w, i) => `${w.wheelTitle || `Vòng ${i + 1}`}: ${w.winningOption?.optionLabel || '--'}`)
            .join(' | ');
          line = `Lần ${roundNum}: ${parts}`;
        } else {
          line = `Lần ${roundNum}: ${session.winningOption?.optionLabel || '--'}`;
        }
        return prev.trim() ? `${prev}\n${line}` : line;
      });
    }
  }, [session, wheelsList]);

  // 6. Đồng bộ Animation vòng quay theo startedAt & durationMs
  useEffect(() => {
    if (!isVisible || !session || wheelsList.length === 0) return;

    if (session.stageStatus === 'idle') {
      setIsFinished(false);
      setWheelRotations(wheelsList.map(() => 0));
      return;
    }

    const duration = session.durationMs || 6000;
    const startedAt = session.startedAt;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startedAt;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);

      const nextRots = finalRotations.map((fRot) => fRot * easeOut);
      setWheelRotations(nextRots);

      if (soundEnabled && nextRots[0] !== undefined) {
        const sliceDeg = 360 / Math.max(wheelsList[0]?.options.length || 6, 1);
        if (Math.abs(nextRots[0] - lastTickAngleRef.current) >= sliceDeg) {
          liveAudio.playTick();
          lastTickAngleRef.current = nextRots[0];
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setIsFinished(true);
        setActiveTab('results');
        setWheelRotations(finalRotations);
        if (soundEnabled && !fanfarePlayedRef.current) {
          liveAudio.playFanfare();
          fanfarePlayedRef.current = true;
        }
        startConfetti();
        recordResultLine();
      }
    };

    const currentElapsed = Date.now() - startedAt;
    if (currentElapsed >= duration) {
      setIsFinished(true);
      setActiveTab('results');
      setWheelRotations(finalRotations);
      recordResultLine();
    } else {
      setIsFinished(false);
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible, session, finalRotations, wheelsList, soundEnabled, startConfetti, recordResultLine]);

  // 7. XỬ LÝ KHI BẤM NÚT "QUAY" / "QUAY TẤT CẢ" / "QUAY TIẾP" (AI BẤM CŨNG ĐƯỢC)
  const handleSpinClick = async () => {
    if (liveSpinMutation.isPending || (!isFinished && session?.stageStatus === 'spinning')) {
      return;
    }

    try {
      await liveSpinMutation.mutateAsync({
        isAll: true,
        channelId: session?.channelId,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể bắt đầu quay');
    }
  };

  // 8. XỬ LÝ LOẠI BỎ KẾT QUẢ TRÚNG THƯỞNG (ĐỒNG BỘ MỌI THÀNH VIÊN)
  const handleRemoveLiveResult = async (wheelId?: string, optionLabel?: string, removeAll?: boolean) => {
    if (liveRemoveMutation.isPending) return;
    try {
      const updated = await liveRemoveMutation.mutateAsync({
        wheelId,
        optionLabel,
        removeAll,
      });
      if (updated) {
        setSession(updated);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể loại bỏ kết quả');
    }
  };

  // 9. CÁC TÁC VỤ THIẾT LẬP VÒNG DÀNH CHO NGƯỜI TẠO (CREATOR)
  const handleShuffleCurrentWheel = (wheelId: string, currentText: string) => {
    const lines = currentText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j]!, lines[i]!];
    }
    setEditingOptionsText((prev) => ({ ...prev, [wheelId]: lines.join('\n') }));
  };

  const handleSortAZCurrentWheel = (wheelId: string, currentText: string) => {
    const lines = currentText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    lines.sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' }));
    setEditingOptionsText((prev) => ({ ...prev, [wheelId]: lines.join('\n') }));
  };

  const handleResetCurrentWheel = (wheelId: string) => {
    if (window.confirm(locale === 'vi' ? 'Đặt lại các lựa chọn mặc định ban đầu?' : 'Reset options to default?')) {
      const defaultOptions = ['Phở bò', 'Bún chả', 'Cơm tấm', 'Bánh mì', 'Bún bò Huế', 'Gà rán'];
      setEditingOptionsText((prev) => ({ ...prev, [wheelId]: defaultOptions.join('\n') }));
    }
  };

  const handleClearCurrentWheel = (wheelId: string) => {
    setEditingOptionsText((prev) => ({ ...prev, [wheelId]: '' }));
  };

  const handleSaveWheelOptions = async (wheelId: string, currentTitle: string) => {
    const raw = editingOptionsText[wheelId];
    const wheel = wheelsList.find((w) => w.wheelId === wheelId);
    const textToSave = raw !== undefined ? raw : (wheel?.options.map((o) => o.optionLabel).join('\n') || '');

    const lines = textToSave
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert(locale === 'vi' ? 'Vòng quay phải có ít nhất 1 lựa chọn' : 'At least 1 option required');
      return;
    }

    try {
      await updateWheelMutation.mutateAsync({
        wheelId,
        input: {
          title: currentTitle,
          options: lines.map((label, idx) => ({
            optionLabel: label,
            color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
          })),
        },
      });
      setSaveSuccessWheelId(wheelId);
      setTimeout(() => setSaveSuccessWheelId(null), 2500);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể lưu vòng quay');
    }
  };

  const handleStartEditTitle = (wheelId: string, currentTitle: string) => {
    setEditingTitleId(wheelId);
    setEditingTitleText(currentTitle);
  };

  const handleSaveTitle = async (wheelId: string) => {
    const trimmed = editingTitleText.trim();
    if (trimmed) {
      try {
        await updateWheelMutation.mutateAsync({
          wheelId,
          input: { title: trimmed },
        });
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Không thể đổi tên vòng');
      }
    }
    setEditingTitleId(null);
  };

  // 10. CÁC TÁC VỤ Ở BẢNG KẾT QUẢ
  const handleSortResults = () => {
    if (resultLines.length < 2) return;
    const sorted = [...resultLines].sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' }));
    setResultsText(sorted.join('\n'));
  };

  const handleClearResults = () => {
    if (window.confirm(locale === 'vi' ? 'Xoá tất cả lịch sử kết quả quay?' : 'Clear all result history?')) {
      setResultsText('');
    }
  };

  const handleShareResultsManually = async () => {
    if (resultLines.length === 0 || shareResultsMutation.isPending) return;
    setIsSharingResults(true);
    try {
      const resultsToShare = wheelsList
        .filter((w) => w.winningOption?.optionLabel)
        .map((w, idx) => ({
          wheelTitle: w.wheelTitle || `Vòng ${idx + 1}`,
          winner: w.winningOption!.optionLabel,
        }));
      await shareResultsMutation.mutateAsync(
        resultsToShare.length > 0
          ? resultsToShare
          : [{ wheelTitle: session?.wheelTitle || 'Vòng quay', winner: session?.winningOption?.optionLabel || 'Kết quả' }]
      );
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể chia sẻ kết quả');
    } finally {
      setIsSharingResults(false);
    }
  };

  // 11. XỬ LÝ ĐÓNG PHÒNG QUAY (NGƯỜI TẠO TỰ ĐỘNG GỬI KẾT QUẢ VÀO TIN NHẮN CHAT)
  const handleClose = async () => {
    if (isCreator) {
      const confirmMsg =
        resultLines.length > 0
          ? (locale === 'vi'
              ? 'Đóng phòng quay và tự động gửi toàn bộ kết quả vào tin nhắn nhóm?'
              : 'Close live stage and auto-share results to group chat?')
          : (locale === 'vi'
              ? 'Bạn có chắc chắn muốn kết thúc phòng quay trực tiếp?'
              : 'Are you sure you want to end this live wheel stage?');

      if (!window.confirm(confirmMsg)) return;

      try {
        let formattedResults: { wheelTitle: string; winner: string }[] = [];
        if (wheelsList.some((w) => w.winningOption?.optionLabel)) {
          formattedResults = wheelsList
            .filter((w) => w.winningOption?.optionLabel)
            .map((w, idx) => ({
              wheelTitle: w.wheelTitle || `Vòng ${idx + 1}`,
              winner: w.winningOption!.optionLabel,
            }));
        }

        await closeLiveMutation.mutateAsync({
          results: formattedResults.length > 0 ? formattedResults : undefined,
        });
        setIsVisible(false);
        setSession(null);
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Không thể đóng phòng');
      }
    } else {
      // Người xem thông thường chỉ rời phòng quay cục bộ
      if (session) {
        setDismissedSessionId(session.id);
      }
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white dark:bg-circle-dark-surface p-6 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline shadow-2xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-circle-primary animate-spin" />
          <p className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
            {locale === 'vi' ? 'Đang kết nối vòng quay...' : 'Connecting to wheel...'}
          </p>
        </div>
      </div>
    );
  }

  const isSpinning = !isFinished && session.stageStatus === 'spinning';
  const spunByName = session.spunBy?.displayName || (locale === 'vi' ? 'Thành viên' : 'Member');
  const participants = session.participants || [];

  const wheelCanvasSize = isFullscreen ? 205 : 175;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'p-0 bg-black/90' : 'p-3 sm:p-5 bg-black/75'
      } backdrop-blur-md animate-in fade-in duration-200`}
    >
      {/* Canvas Confetti Layer */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 pointer-events-none z-40 w-full h-full"
      />

      <div
        className={`relative w-full ${
          isFullscreen
            ? 'h-full rounded-none border-0 p-5 sm:p-8 max-w-none max-h-none'
            : 'max-w-5xl rounded-3xl border border-white/20 dark:border-circle-dark-hairline p-5 sm:p-6 max-h-[92vh]'
        } bg-white/98 dark:bg-circle-dark-card/98 shadow-2xl flex flex-col backdrop-blur-xl z-50 overflow-hidden transition-all duration-300`}
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* ============================================================== */}
        {/* HEADER: "Vòng quay may mắn" + QUAY TẤT CẢ + ÂM THANH + PHÓNG TO + ĐÓNG */}
        {/* ============================================================== */}
        <div className="w-full flex items-center justify-between pb-3.5 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-circle-primary/15 text-circle-primary flex items-center justify-center">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-circle-charcoal dark:text-circle-dark-text tracking-tight">
              {locale === 'vi' ? 'Vòng quay may mắn' : 'Lucky Wheel'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Quay tất cả dạng Pill Button trên Header như CircleWheelView */}
            <button
              type="button"
              onClick={handleSpinClick}
              disabled={isSpinning || liveSpinMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSpinning || liveSpinMutation.isPending ? 'animate-spin' : ''}`} />
              <span>
                {isSpinning || liveSpinMutation.isPending
                  ? t.luckyWheel.spinning
                  : isFinished
                  ? t.luckyWheel.spinAgain
                  : t.luckyWheel.spinAll}
              </span>
            </button>

            {/* Bật / Tắt âm thanh */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors cursor-pointer"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Nút Toàn màn hình / Thu nhỏ (Phương án B) */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors cursor-pointer"
              title={
                isFullscreen
                  ? locale === 'vi'
                    ? 'Thu nhỏ cửa sổ'
                    : 'Exit fullscreen'
                  : locale === 'vi'
                  ? 'Toàn màn hình'
                  : 'Fullscreen'
              }
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Nút Đóng / Rời phòng */}
            <button
              type="button"
              onClick={handleClose}
              disabled={closeLiveMutation.isPending}
              className="p-1.5 rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
              title={isCreator ? (locale === 'vi' ? 'Đóng phòng quay' : 'Close live stage') : t.luckyWheel.backToChat}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BODY: 2 CỘT (BÊN TRÁI: 4 VÒNG XOAY | BÊN PHẢI: BẢNG KẾT QUẢ / THIẾT LẬP)*/}
        {/* ============================================================== */}
        <div className="w-full flex-1 flex flex-col lg:flex-row items-stretch gap-5 pt-4 overflow-y-auto min-h-0">
          {/* CỘT BÊN TRÁI: HIỂN THỊ 4 VÒNG XOAY (LƯỚI 2x2 CÓ NHÃN TÊN VÒNG) */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0 relative">
            {/* 1. NÚT FLOATING Ở TRÊN CÙNG: NÚT KẾT QUẢ */}
            <div className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('results');
                  setShowResultsPopup(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 border border-amber-300/40 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
                title={locale === 'vi' ? 'Xem bảng kết quả các lượt quay' : 'View spin results history'}
              >
                <Trophy className="w-4 h-4 text-amber-200 fill-amber-300/20 shrink-0" />
                <span>{locale === 'vi' ? 'Kết quả' : 'Results'}</span>
                {resultLines.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/25 text-[10px] sm:text-[11px] font-mono font-bold">
                    {resultLines.length}
                  </span>
                )}
              </button>
            </div>

            {/* 2. BẢNG NHỎ Ở GÓC DƯỚI BÊN PHẢI CÓ MẶT NGƯỜI ĐANG XEM */}
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-30 pointer-events-auto max-w-[240px]">
              <div className="bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline shadow-xl p-2 sm:p-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between gap-2 border-b border-circle-hairline/60 dark:border-circle-dark-hairline pb-1">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-circle-charcoal dark:text-circle-dark-text">
                    <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{locale === 'vi' ? 'Người đang xem' : 'Watching'}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[9px] sm:text-[10px] font-bold">
                      {participants.length}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Hàng khuôn mặt avatar người đang xem */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[210px]">
                  {participants.length > 0 ? (
                    participants.slice(0, 6).map((p) => (
                      <div
                        key={p.userId}
                        className="relative group shrink-0"
                        title={p.displayName}
                      >
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt={p.displayName}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-emerald-500/60 shadow-xs transition-transform group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-circle-primary/20 text-circle-primary font-bold text-xs flex items-center justify-center border-2 border-emerald-500/60 shadow-xs transition-transform group-hover:scale-110">
                            {p.displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-circle-dark-surface" />
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-circle-slate dark:text-circle-dark-muted italic py-0.5">
                      <User className="w-3 h-3 text-circle-primary" />
                      <span className="truncate max-w-[120px]">{spunByName}</span>
                    </div>
                  )}
                  {participants.length > 6 && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-circle-wash dark:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted font-bold text-[10px] flex items-center justify-center border border-circle-hairline shrink-0">
                      +{participants.length - 6}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`grid grid-cols-2 gap-4 ${
                isFullscreen ? 'sm:gap-8 max-w-2xl' : 'sm:gap-6 max-w-lg'
              } justify-items-center w-full mx-auto pt-6 sm:pt-4`}
            >
              {wheelsList.map((wheel, idx) => {
                const rot = wheelRotations[idx] || 0;
                return (
                  <div key={wheel.wheelId || `wheel-${idx}`} className="flex flex-col items-center gap-2">
                    {/* Nhãn tên vòng quay: Chỉ Người tạo mới bấm vào để mở tab sửa, Người xem là nhãn tĩnh */}
                    {isCreator ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab(wheel.wheelId || String(idx))}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border ${
                          isFullscreen ? 'w-44 text-xs sm:text-sm font-bold' : 'w-36 text-xs font-bold'
                        } shadow-2xs transition-all cursor-pointer ${
                          activeTab === (wheel.wheelId || String(idx))
                            ? 'bg-circle-primary border-circle-primary text-white shadow-xs'
                            : 'bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                        }`}
                        title={locale === 'vi' ? 'Bấm để sửa thiết lập vòng' : 'Click to edit wheel setup'}
                      >
                        <Compass
                          className={`w-3.5 h-3.5 shrink-0 ${
                            activeTab === (wheel.wheelId || String(idx)) ? 'text-white' : 'text-circle-primary'
                          }`}
                        />
                        <span className="truncate">{wheel.wheelTitle || `Vòng ${idx + 1}`}</span>
                        <Edit2 className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
                      </button>
                    ) : (
                      <div
                        className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border ${
                          isFullscreen ? 'w-44 text-xs sm:text-sm font-bold' : 'w-36 text-xs font-bold'
                        } bg-white/90 dark:bg-circle-dark-surface/90 border-circle-hairline dark:border-circle-dark-hairline text-circle-charcoal dark:text-circle-dark-text shadow-2xs select-none`}
                        title={wheel.wheelTitle || `Vòng ${idx + 1}`}
                      >
                        <Compass className="w-3.5 h-3.5 shrink-0 text-circle-primary" />
                        <span className="truncate">{wheel.wheelTitle || `Vòng ${idx + 1}`}</span>
                      </div>
                    )}

                    <SingleLiveWheelCanvas
                      options={wheel.options}
                      rotation={rot}
                      size={wheelCanvasSize}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT BÊN PHẢI: "CÁI BẢNG" (TABBED BOARD: RESULTS, PARTICIPANTS, SETUP) */}
          <div
            className={`w-full ${
              isFullscreen ? 'lg:w-96 xl:w-[420px]' : 'lg:w-84 xl:w-96'
            } flex flex-col justify-between bg-white dark:bg-circle-dark-surface rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline p-4 shrink-0 gap-3 shadow-sm`}
          >
            {/* Thanh Tab Bar: 
                - Người xem (!isCreator): Chỉ có 2 tab: [🏆 Kết quả] và [👥 Người xem (N)]
                - Người tạo (isCreator): [Vòng 1] [Vòng 2] [Vòng 3] [Vòng 4] [🏆 Kết quả] [👥 Người xem (N)] 
            */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 border-b border-circle-hairline dark:border-circle-dark-hairline no-scrollbar shrink-0">
              {/* 1. Các tab vòng (CHỈ HIỂN THỊ NẾU LÀ CREATOR) */}
              {isCreator &&
                wheelsList.map((wheel, idx) => {
                  const tabKey = wheel.wheelId || String(idx);
                  const isSelected = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={`flex items-center justify-center px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-circle-primary text-white shadow-xs font-bold'
                          : 'bg-circle-wash/70 dark:bg-circle-dark-wash/50 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                      }`}
                      title={wheel.wheelTitle || `Vòng ${idx + 1}`}
                    >
                      <span className="truncate max-w-[70px]">{wheel.wheelTitle || `Vòng ${idx + 1}`}</span>
                    </button>
                  );
                })}

              {/* 2. Tab Kết Quả (Ai cũng thấy) */}
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'results'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'bg-circle-wash/70 dark:bg-circle-dark-wash/50 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span>{t.luckyWheel.resultsTab}</span>
                {resultLines.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                    {resultLines.length}
                  </span>
                )}
              </button>

              {/* 3. Tab Người Tham Gia (Ai cũng thấy) */}
              <button
                type="button"
                onClick={() => setActiveTab('participants')}
                className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'participants'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'bg-circle-wash/70 dark:bg-circle-dark-wash/50 text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{participants.length}</span>
              </button>
            </div>

            {/* PHẦN NỘI DUNG TƯƠNG ỨNG THEO TAB */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {/* TAB 1: KẾT QUẢ CÁC LƯỢT QUAY (GHI THEO TỪNG DÒNG, READ-ONLY, KHÔNG ĐƯỢC SỬA) */}
              {activeTab === 'results' ? (
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-2.5 flex-1 min-h-0">
                    <div className="flex items-center justify-between pb-1.5 border-b border-circle-hairline dark:border-circle-dark-hairline">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t.luckyWheel.resultsHistoryTitle || 'Lịch sử kết quả'}</span>
                        <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-normal lowercase">
                          ({resultLines.length} {locale === 'vi' ? 'lần quay' : 'spins'})
                        </span>
                      </div>
                      {isSpinning && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 animate-pulse">
                          <RotateCw className="w-3 h-3 animate-spin" />
                          <span>{t.luckyWheel.spinningLive}</span>
                        </span>
                      )}
                    </div>

                    {/* Textarea hiển thị kết quả theo từng dòng (Read-only, không được sửa tay) */}
                    <div className="flex-1 flex flex-col gap-1 min-h-0">
                      <textarea
                        value={resultsText}
                        readOnly
                        placeholder={
                          locale === 'vi'
                            ? 'Chưa có kết quả nào. Hãy bấm "Quay tất cả" để bắt đầu lượt quay đầu tiên!'
                            : 'No results yet. Press "Spin All" to start the first spin!'
                        }
                        className="w-full flex-1 min-h-[140px] p-2.5 text-xs sm:text-sm rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text focus:outline-none resize-none font-mono leading-relaxed select-text cursor-default"
                      />
                      <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                        {locale === 'vi'
                          ? 'Kết quả tự động ghi theo từng dòng và không thể sửa.'
                          : 'Results are recorded line-by-line and are read-only.'}
                      </p>
                    </div>

                    {/* Dải nút tác vụ nhỏ của bảng kết quả: Sắp xếp A-Z, Gửi tin nhắn, Xoá tất cả */}
                    <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-circle-hairline dark:border-circle-dark-hairline">
                      {/* Sắp xếp A-Z */}
                      <button
                        type="button"
                        onClick={handleSortResults}
                        disabled={resultLines.length < 2}
                        className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                        title={t.luckyWheel.sortResults || 'Sắp xếp A-Z'}
                      >
                        <ArrowDownAZ className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </button>

                      {/* Gửi bảng kết quả vào tin nhắn chat */}
                      <button
                        type="button"
                        onClick={handleShareResultsManually}
                        disabled={resultLines.length === 0 || isSharingResults}
                        className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                        title={shareSuccess ? 'Đã gửi vào chat!' : 'Gửi kết quả vào chat'}
                      >
                        {shareSuccess ? (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </button>

                      {/* Xoá tất cả dòng kết quả */}
                      <button
                        type="button"
                        onClick={handleClearResults}
                        disabled={resultLines.length === 0}
                        className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-900/40 text-circle-charcoal dark:text-circle-dark-text disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                        title={t.luckyWheel.clearResults || 'Xoá lịch sử'}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* Khung kết quả Cúp vàng của lượt quay gần nhất */}
                  {isFinished && session.winningOption ? (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border border-amber-500/40 text-center animate-in zoom-in-95 duration-200 shrink-0">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-300 mb-0.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{t.luckyWheel.winnerAnnounce}</span>
                      </div>
                      <div className="text-base font-black text-amber-600 dark:text-amber-400 tracking-wide break-words">
                        {session.winningOption.optionLabel}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-[10px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                        <User className="w-3 h-3 text-circle-primary" />
                        <span>{t.luckyWheel.spunBy.replace('{name}', spunByName)}</span>
                      </div>

                      {/* Nút Loại bỏ kết quả vừa quay */}
                      <div className="mt-1.5 pt-1.5 border-t border-amber-500/20 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLiveResult(undefined, undefined, true)}
                          disabled={liveRemoveMutation.isPending}
                          className="py-1 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                          title={t.luckyWheel.removeResult}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.luckyWheel.removeResult}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : activeTab === 'participants' ? (
                /* TAB 2: NGƯỜI THAM GIA / NGƯỜI XEM PHÒNG */
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-circle-hairline dark:border-circle-dark-hairline">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                      <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>
                        {locale === 'vi' ? 'Người đang xem' : 'Watching'} ({participants.length})
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {locale === 'vi' ? 'Trực tiếp' : 'Live'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-64 pr-1">
                    {participants.map((p) => (
                      <div
                        key={p.userId}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-circle-wash/60 dark:bg-circle-dark-wash/40 border border-circle-hairline/60 dark:border-circle-dark-hairline text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt={p.displayName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-circle-primary/20 text-circle-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {p.displayName?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {p.displayName}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          {locale === 'vi' ? 'Đang xem' : 'Watching'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* TAB 3: THIẾT LẬP VÒNG QUAY (CHỈ DÀNH CHO NGƯỜI TẠO CREATOR) */
                (() => {
                  const currentWheel =
                    wheelsList.find((w, i) => (w.wheelId || String(i)) === activeTab) || wheelsList[0];
                  if (!currentWheel) return null;

                  const wheelId = currentWheel.wheelId;
                  const currentRawText =
                    editingOptionsText[wheelId] !== undefined
                      ? editingOptionsText[wheelId]!
                      : currentWheel.options.map((o) => o.optionLabel).join('\n');

                  const parsedLines = currentRawText
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean);

                  const isEditingThisTitle = editingTitleId === wheelId;

                  return (
                    <div className="flex-1 flex flex-col gap-2.5 min-h-0">
                      {/* Tiêu đề vòng quay: Đổi tên inline */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-circle-hairline dark:border-circle-dark-hairline">
                        {isEditingThisTitle ? (
                          <div className="flex items-center gap-1.5 flex-1 mr-2">
                            <input
                              type="text"
                              maxLength={50}
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(wheelId)}
                              autoFocus
                              className="flex-1 px-2 py-0.5 text-xs font-bold rounded-lg border border-circle-primary bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTitle(wheelId)}
                              className="p-1 rounded-md bg-circle-primary hover:bg-circle-sage text-white cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 group">
                            <Compass className="w-3.5 h-3.5 text-circle-primary shrink-0" />
                            <span className="font-bold text-xs text-circle-charcoal dark:text-circle-dark-text truncate">
                              {currentWheel.wheelTitle || 'Vòng quay'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartEditTitle(wheelId, currentWheel.wheelTitle || '')}
                              className="p-1 rounded opacity-70 group-hover:opacity-100 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted cursor-pointer"
                              title="Đổi tên vòng quay"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <span className="text-xs text-circle-slate dark:text-circle-dark-muted font-semibold shrink-0">
                          ({parsedLines.length} {locale === 'vi' ? 'lựa chọn' : 'options'})
                        </span>
                      </div>

                      {/* Textarea chỉnh sửa các lựa chọn (mỗi dòng 1 lựa chọn) */}
                      <div className="flex-1 flex flex-col gap-1 min-h-0">
                        <textarea
                          value={currentRawText}
                          onChange={(e) =>
                            setEditingOptionsText((prev) => ({
                              ...prev,
                              [wheelId]: e.target.value,
                            }))
                          }
                          placeholder={
                            locale === 'vi'
                              ? 'Nhập các lựa chọn, mỗi dòng một lựa chọn...'
                              : 'Enter options, one per line...'
                          }
                          className="w-full flex-1 min-h-[140px] p-2.5 text-xs sm:text-sm rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text focus:bg-white dark:focus:bg-circle-dark-surface focus:outline-none resize-none leading-relaxed font-mono"
                        />
                        <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                          {locale === 'vi'
                            ? 'Mỗi dòng là một ô trên vòng xoay.'
                            : 'Each line is a slice on the wheel.'}
                        </p>
                      </div>

                      {/* Dải 4 nút công cụ: Shuffle, Sort A-Z, Reset, Clear (y hệt CircleWheelView) */}
                      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                        {/* Xáo trộn (Shuffle) */}
                        <button
                          type="button"
                          onClick={() => handleShuffleCurrentWheel(wheelId, currentRawText)}
                          className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
                          title={t.luckyWheel.shuffleOptions || 'Xáo trộn'}
                        >
                          <Shuffle className="w-4 h-4 text-circle-sage dark:text-circle-dark-primary" />
                        </button>

                        {/* Sắp xếp A-Z (Sort A-Z) */}
                        <button
                          type="button"
                          onClick={() => handleSortAZCurrentWheel(wheelId, currentRawText)}
                          className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
                          title={t.luckyWheel.sortAZ || 'Sắp xếp A-Z'}
                        >
                          <ArrowDownAZ className="w-4 h-4 text-indigo-500" />
                        </button>

                        {/* Đặt lại mặc định (Reset) */}
                        <button
                          type="button"
                          onClick={() => handleResetCurrentWheel(wheelId)}
                          className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
                          title={t.luckyWheel.resetOptions || 'Đặt lại'}
                        >
                          <RotateCcw className="w-4 h-4 text-amber-500" />
                        </button>

                        {/* Xóa sạch (Clear) */}
                        <button
                          type="button"
                          onClick={() => handleClearCurrentWheel(wheelId)}
                          className="flex items-center justify-center py-1.5 px-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-rose-500/10 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-900/40 text-circle-charcoal dark:text-circle-dark-text transition-all active:scale-95 cursor-pointer"
                          title="Xóa tất cả các lựa chọn"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>

                      {/* Nút to nổi bật: Lưu & Áp dụng lên vòng quay */}
                      <button
                        type="button"
                        onClick={() => handleSaveWheelOptions(wheelId, currentWheel.wheelTitle || 'Vòng quay')}
                        disabled={updateWheelMutation.isPending}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                          saveSuccessWheelId === wheelId
                            ? 'bg-emerald-600 text-white'
                            : 'bg-circle-primary hover:bg-circle-sage text-white'
                        }`}
                      >
                        {updateWheelMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saveSuccessWheelId === wheelId ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {saveSuccessWheelId === wheelId
                            ? locale === 'vi'
                              ? 'Đã lưu & áp dụng thành công!'
                              : 'Saved & applied!'
                            : locale === 'vi'
                            ? 'Lưu & Áp dụng lên vòng quay'
                            : 'Save & Apply to Wheel'}
                        </span>
                      </button>
                    </div>
                  );
                })()
              )}
            </div>

            {/* CỤM NÚT ĐIỀU KHIỂN DƯỚI ĐÁY CỦA CÁI BẢNG */}
            <div className="flex flex-col gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
              {/* Nút Quay tất cả / Quay tiếp */}
              <button
                type="button"
                onClick={handleSpinClick}
                disabled={isSpinning || liveSpinMutation.isPending}
                className="w-full py-2.5 px-4 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal dark:text-circle-dark-canvas font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-circle-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isSpinning || liveSpinMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>
                  {isSpinning || liveSpinMutation.isPending
                    ? t.luckyWheel.spinning
                    : isFinished
                    ? t.luckyWheel.spinAgain
                    : t.luckyWheel.spinAll}
                </span>
              </button>

              {/* Nút Đóng phòng quay (Nếu là Người tạo) hoặc Rời phòng (Nếu là Người xem) */}
              {isCreator ? (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={closeLiveMutation.isPending}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-rose-500/20"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>
                    {locale === 'vi'
                      ? 'Đóng phòng & Gửi kết quả vào chat'
                      : 'Close stage & share results to chat'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2 px-3 rounded-xl bg-circle-wash/80 dark:bg-circle-dark-wash/80 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{locale === 'vi' ? 'Rời phòng quay' : t.luckyWheel.backToChat}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL POPUP KẾT QUẢ KHI BẤM NÚT FLOATING "KẾT QUẢ" */}
      {showResultsPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-circle-dark-surface rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline shadow-2xl p-5 flex flex-col gap-3.5 animate-in zoom-in-95 duration-200 max-h-[85vh]">
            {/* Header modal kết quả */}
            <div className="flex items-center justify-between pb-2.5 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {locale === 'vi' ? 'Bảng kết quả các lượt quay' : 'Spin Results'}
                  </h4>
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                    {resultLines.length} {locale === 'vi' ? 'lượt quay đã ghi nhận' : 'recorded spins'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResultsPopup(false)}
                className="p-1.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted cursor-pointer"
                title={locale === 'vi' ? 'Đóng' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea kết quả chỉ đọc */}
            <div className="flex-1 flex flex-col gap-1 min-h-[160px]">
              <textarea
                value={resultsText}
                readOnly
                placeholder={
                  locale === 'vi'
                    ? 'Chưa có kết quả quay nào. Hãy bấm "Quay tất cả" để bắt đầu!'
                    : 'No results recorded yet. Press "Spin All" to start!'
                }
                className="w-full flex-1 p-3 text-xs sm:text-sm rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text focus:outline-none resize-none font-mono leading-relaxed select-text"
              />
              <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
                {locale === 'vi' ? 'Kết quả ghi theo từng dòng và không thể sửa.' : 'Recorded line-by-line and read-only.'}
              </p>
            </div>

            {/* Cúp vàng lượt quay gần nhất nếu có */}
            {isFinished && session.winningOption && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-500/30 text-center">
                <div className="text-[10px] font-extrabold text-amber-600 uppercase mb-0.5">
                  {t.luckyWheel.winnerAnnounce}
                </div>
                <div className="text-sm font-black text-amber-700 dark:text-amber-400 break-words">
                  {session.winningOption.optionLabel}
                </div>
                <div className="text-[10px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                  {t.luckyWheel.spunBy.replace('{name}', spunByName)}
                </div>
              </div>
            )}

            {/* Dải nút tác vụ dưới modal */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSortResults}
                  disabled={resultLines.length < 2}
                  className="p-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash dark:hover:bg-circle-dark-wash disabled:opacity-40 cursor-pointer"
                  title="Sắp xếp A-Z"
                >
                  <ArrowDownAZ className="w-4 h-4 text-indigo-500" />
                </button>
                <button
                  type="button"
                  onClick={handleShareResultsManually}
                  disabled={resultLines.length === 0 || isSharingResults}
                  className="p-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-wash dark:hover:bg-circle-dark-wash disabled:opacity-40 cursor-pointer"
                  title="Gửi vào chat"
                >
                  {shareSuccess ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Share2 className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClearResults}
                  disabled={resultLines.length === 0}
                  className="p-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-rose-500/10 text-rose-500 disabled:opacity-40 cursor-pointer"
                  title="Xoá lịch sử"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowResultsPopup(false)}
                className="px-4 py-2 rounded-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs cursor-pointer"
              >
                {locale === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
