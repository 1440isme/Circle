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
} from 'lucide-react';
import { LiveWheelSession, LiveWheelItem, LiveWheelParticipant } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { getSocket } from '../../lib/socket';
import {
  useActiveLiveWheelQuery,
  useLiveSpinWheelMutation,
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
  const { t, locale } = useLanguageStore();
  const [session, setSession] = useState<LiveWheelSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);
  const [wheelRotations, setWheelRotations] = useState<number[]>([0, 0, 0, 0]);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const confettiFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef<number>(0);
  const fanfarePlayedRef = useRef<boolean>(false);

  // Hook quay trực tiếp (bất kỳ ai ấn cũng được)
  const liveSpinMutation = useLiveSpinWheelMutation(circleId);

  // 1. Fetch active session on mount or circle switch
  const { data: initialActiveSession } = useActiveLiveWheelQuery(circleId);

  useEffect(() => {
    if (initialActiveSession && initialActiveSession.id !== dismissedSessionId) {
      const elapsed = Date.now() - initialActiveSession.startedAt;
      if (elapsed < 60000) {
        setSession(initialActiveSession);
        setIsVisible(true);
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

    // Lắng nghe sự kiện custom từ tin nhắn chat khi người dùng bấm "Tham gia vòng quay"
    const handleOpenFromChat = (e: any) => {
      if (e.detail?.circleId === circleId) {
        setIsVisible(true);
        setDismissedSessionId(null);
      }
    };

    socket.on('circle:live-wheel:stage-created', handleStageCreated);
    socket.on('circle:live-wheel:started', handleLiveWheelStarted);
    socket.on('circle:live-wheel:participants-updated', handleParticipantsUpdated);
    window.addEventListener('circle:open-live-wheel', handleOpenFromChat);

    return () => {
      socket.off('circle:live-wheel:stage-created', handleStageCreated);
      socket.off('circle:live-wheel:started', handleLiveWheelStarted);
      socket.off('circle:live-wheel:participants-updated', handleParticipantsUpdated);
      window.removeEventListener('circle:open-live-wheel', handleOpenFromChat);
    };
  }, [circleId]);

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

  // 5. Đồng bộ Animation vòng quay theo startedAt & durationMs
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
        setWheelRotations(finalRotations);
        if (soundEnabled && !fanfarePlayedRef.current) {
          liveAudio.playFanfare();
          fanfarePlayedRef.current = true;
        }
        startConfetti();
      }
    };

    const currentElapsed = Date.now() - startedAt;
    if (currentElapsed >= duration) {
      setIsFinished(true);
      setWheelRotations(finalRotations);
    } else {
      setIsFinished(false);
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible, session, finalRotations, wheelsList, soundEnabled, startConfetti]);

  // 6. XỬ LÝ KHI BẤM NÚT "QUAY" / "QUAY TẤT CẢ" / "QUAY TIẾP" (AI BẤM CŨNG ĐƯỢC)
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

  const handleClose = () => {
    if (session) {
      setDismissedSessionId(session.id);
    }
    setIsVisible(false);
  };

  if (!isVisible || !session) return null;

  const isSpinning = !isFinished && session.stageStatus === 'spinning';
  const spunByName = session.spunBy?.displayName || (locale === 'vi' ? 'Thành viên' : 'Member');
  const participants = session.participants || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Canvas Confetti Layer */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 pointer-events-none z-40 w-full h-full"
      />

      <div className="relative w-full max-w-4xl rounded-3xl bg-white/95 dark:bg-circle-dark-card/95 border border-white/20 dark:border-circle-dark-hairline shadow-2xl p-5 sm:p-6 flex flex-col backdrop-blur-xl z-50 overflow-hidden max-h-[92vh]">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* ============================================================== */}
        {/* HEADER: CHỈ ĐỂ "Vòng quay may mắn" + ÂM THANH + NÚT ĐÓNG       */}
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
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors cursor-pointer"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
              title={t.luckyWheel.backToChat}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BODY: 2 CỘT (BÊN TRÁI: 4 VÒNG XOAY | BÊN PHẢI: KẾT QUẢ & USERS)*/}
        {/* ============================================================== */}
        <div className="w-full flex-1 flex flex-col lg:flex-row items-stretch gap-5 pt-4 overflow-y-auto min-h-0">
          {/* CỘT BÊN TRÁI: HIỂN THỊ 4 VÒNG XOAY (LƯỚI 2x2 CÓ NHÃN NÚT TÊN VÒNG) */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 justify-items-center w-full max-w-lg mx-auto">
              {wheelsList.map((wheel, idx) => {
                const rot = wheelRotations[idx] || 0;
                return (
                  <div key={wheel.wheelId || `wheel-${idx}`} className="flex flex-col items-center gap-2">
                    {/* Nhãn nút tên vòng quay phía trên đĩa (như CircleWheelView) */}
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/90 dark:bg-circle-dark-surface/90 text-circle-charcoal dark:text-circle-dark-text text-xs font-bold shadow-2xs w-36">
                      <Compass className="w-3.5 h-3.5 text-circle-primary shrink-0" />
                      <span className="truncate">{wheel.wheelTitle || `Vòng ${idx + 1}`}</span>
                    </div>

                    <SingleLiveWheelCanvas
                      options={wheel.options}
                      rotation={rot}
                      size={175}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT BÊN PHẢI: "CÁI BẢNG" HIỂN THỊ KẾT QUẢ VÀ NGƯỜI THAM GIA (CALL-LIKE) */}
          <div className="w-full lg:w-80 xl:w-88 flex flex-col justify-between bg-circle-canvas/60 dark:bg-circle-dark-surface/70 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline p-4 sm:p-4.5 shrink-0 gap-3">
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
              {/* 1. MỤC NGƯỜI THAM GIA (CALL-LIKE PARTICIPANTS LIST) */}
              <div className="bg-white dark:bg-circle-dark-card rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline p-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-circle-hairline/80 dark:border-circle-dark-hairline mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                    <Users className="w-3.5 h-3.5 text-circle-primary" />
                    <span>
                      {locale === 'vi' ? 'Người tham gia' : 'Participants'} ({participants.length})
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {locale === 'vi' ? 'Trực tiếp' : 'Live'}
                  </span>
                </div>

                {/* Danh sách avatar & tên người tham gia */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {participants.map((p) => (
                    <div
                      key={p.userId}
                      className="inline-flex items-center gap-1.5 py-1 px-2 rounded-xl bg-circle-wash/80 dark:bg-circle-dark-wash/60 border border-circle-hairline/60 dark:border-circle-dark-hairline text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text"
                      title={p.displayName}
                    >
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.displayName} className="w-4.5 h-4.5 rounded-full object-cover" />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-circle-primary/20 text-circle-primary flex items-center justify-center text-[10px] font-bold">
                          {p.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className="truncate max-w-[85px] text-[11px]">{p.displayName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. MỤC BẢNG KẾT QUẢ CÁC VÒNG (RESULTS PANEL) */}
              <div className="flex-1 bg-white dark:bg-circle-dark-card rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline p-3 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-circle-hairline/80 dark:border-circle-dark-hairline mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.luckyWheel.resultsTab}</span>
                    </div>
                    {isSpinning && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 animate-pulse">
                        <RotateCw className="w-3 h-3 animate-spin" />
                        <span>{t.luckyWheel.spinningLive}</span>
                      </span>
                    )}
                  </div>

                  {/* Chi tiết kết quả của 4 vòng */}
                  <div className="flex flex-col gap-1.5">
                    {wheelsList.map((w, idx) => (
                      <div
                        key={w.wheelId || idx}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-circle-wash/50 dark:bg-circle-dark-wash/40 text-xs"
                      >
                        <span className="font-semibold text-circle-slate dark:text-circle-dark-muted truncate max-w-[110px]">
                          {w.wheelTitle || `Vòng ${idx + 1}`}
                        </span>
                        <span className="font-bold text-circle-charcoal dark:text-circle-dark-text truncate max-w-[110px] text-right">
                          {isFinished && w.winningOption ? w.winningOption.optionLabel : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Khung kết quả tổng hợp nổi bật Cúp vàng khi quay xong */}
                {isFinished && session.winningOption && (
                  <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-2 border-amber-500/40 text-center animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-300 mb-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{t.luckyWheel.winnerAnnounce}</span>
                    </div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-wide break-words">
                      {session.winningOption.optionLabel}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-circle-slate dark:text-circle-dark-muted mt-1">
                      <User className="w-3 h-3 text-circle-primary" />
                      <span>{t.luckyWheel.spunBy.replace('{name}', spunByName)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. CỤM NÚT ĐIỀU KHIỂN Ở GÓC DƯỚI BÊN PHẢI */}
            <div className="flex flex-col gap-2 pt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
              {/* Nút Quay tất cả / Quay tiếp (Ai ấn quay cũng được) */}
              <button
                type="button"
                onClick={handleSpinClick}
                disabled={isSpinning || liveSpinMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal dark:text-circle-dark-canvas font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-circle-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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

              {/* Nút Quay lại đoạn chat */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 px-3 rounded-xl bg-circle-wash/80 dark:bg-circle-dark-wash/80 hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{t.luckyWheel.backToChat}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
