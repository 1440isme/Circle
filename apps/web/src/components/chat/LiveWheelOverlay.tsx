'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Compass,
  X,
  Trophy,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  ArrowRight,
  User,
} from 'lucide-react';
import { LiveWheelSession } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { getSocket } from '../../lib/socket';
import { useActiveLiveWheelQuery } from '../../hooks/use-circle-tools';

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

export const LiveWheelOverlay: React.FC<LiveWheelOverlayProps> = ({ circleId }) => {
  const { t, locale } = useLanguageStore();
  const [session, setSession] = useState<LiveWheelSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const confettiFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef<number>(0);
  const fanfarePlayedRef = useRef<boolean>(false);

  // 1. Fetch active session on mount or circle switch (hỗ trợ vào sau / reconnect)
  const { data: initialActiveSession } = useActiveLiveWheelQuery(circleId);

  useEffect(() => {
    if (initialActiveSession && initialActiveSession.id !== dismissedSessionId) {
      const elapsed = Date.now() - initialActiveSession.startedAt;
      // Nếu session bắt đầu cách đây dưới 30 giây thì vẫn mở
      if (elapsed < 30000) {
        setSession(initialActiveSession);
        setIsVisible(true);
      }
    }
  }, [initialActiveSession, dismissedSessionId]);

  // 2. Lắng nghe socket sự kiện realtime
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

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

    socket.on('circle:live-wheel:started', handleLiveWheelStarted);

    return () => {
      socket.off('circle:live-wheel:started', handleLiveWheelStarted);
    };
  }, [circleId]);

  // 3. Chuẩn bị thông số tính toán vòng quay
  const totalOptions = session?.options?.length || 0;
  const sliceDeg = useMemo(() => (totalOptions > 0 ? 360 / totalOptions : 360), [totalOptions]);

  const finalRotation = useMemo(() => {
    if (!session || totalOptions === 0) return 0;
    const targetCenterDeg = session.winningIndex * sliceDeg + sliceDeg / 2;
    const stopAngle = (360 - (targetCenterDeg % 360)) % 360;
    const extraSpins = 6 * 360; // 6 vòng quay
    return extraSpins + stopAngle;
  }, [session, sliceDeg, totalOptions]);

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
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.45 + (Math.random() - 0.5) * 80,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 10 - 4,
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

  // 5. Đồng bộ Animation vòng quay theo mốc startedAt & durationMs của server
  useEffect(() => {
    if (!isVisible || !session || totalOptions === 0) return;

    const duration = session.durationMs || 6000;
    const startedAt = session.startedAt;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startedAt;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentRot = finalRotation * easeOut;

      setRotation(currentRot);

      // Âm thanh tick khi chạm cạnh mỗi múi quay
      if (soundEnabled && Math.abs(currentRot - lastTickAngleRef.current) >= sliceDeg) {
        liveAudio.playTick();
        lastTickAngleRef.current = currentRot;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setIsFinished(true);
        setRotation(finalRotation);
        if (soundEnabled && !fanfarePlayedRef.current) {
          liveAudio.playFanfare();
          fanfarePlayedRef.current = true;
        }
        startConfetti();
      }
    };

    // Kiểm tra nếu đã quá thời lượng từ trước (late joiner)
    const currentElapsed = Date.now() - startedAt;
    if (currentElapsed >= duration) {
      setIsFinished(true);
      setRotation(finalRotation);
    } else {
      setIsFinished(false);
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible, session, finalRotation, totalOptions, sliceDeg, soundEnabled, startConfetti]);

  // 6. Vẽ đĩa quay Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !session || totalOptions === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 2;
    const sliceAngle = (2 * Math.PI) / totalOptions;

    ctx.clearRect(0, 0, size, size);

    // Xoay canvas theo góc hiện tại
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    // Vẽ từng múi bánh xe
    session.options.forEach((opt, idx) => {
      const startAngle = idx * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!;
      ctx.fill();

      // Viền nhẹ giữa các múi
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Label text
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1E293B';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 3;

      let label = opt.optionLabel;
      if (label.length > 15) {
        label = label.substring(0, 14) + '…';
      }
      ctx.fillText(label, radius - 20, 5);
      ctx.restore();
    });

    ctx.restore();

    // Vành viền ngoài sang trọng
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Center circular hub
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Center small circle (brand primary teal)
    ctx.beginPath();
    ctx.arc(center, center, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#0D9488';
    ctx.fill();
  }, [rotation, session, totalOptions]);

  const handleClose = () => {
    if (session) {
      setDismissedSessionId(session.id);
    }
    setIsVisible(false);
  };

  if (!isVisible || !session) return null;

  const spunByName = session.spunBy?.displayName || (locale === 'vi' ? 'Thành viên' : 'Member');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* Canvas Confetti Layer */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 pointer-events-none z-40 w-full h-full"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 dark:bg-circle-dark-card/95 border border-white/20 dark:border-circle-dark-hairline shadow-2xl p-6 sm:p-7 flex flex-col items-center backdrop-blur-xl z-50 overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar: LIVE Badge + Title + Close Button */}
        <div className="w-full flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs tracking-wider uppercase border border-rose-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <Radio className="w-3.5 h-3.5" />
              {isFinished ? 'LIVE RESULT' : 'LIVE'}
            </span>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted transition-colors"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            title={t.luckyWheel.backToChat}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wheel Title */}
        <div className="text-center mb-3">
          <h3 className="text-xl font-bold text-circle-charcoal dark:text-circle-dark-text truncate max-w-sm">
            {session.wheelTitle || t.luckyWheel.liveWheelTitle}
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
            <User className="w-3.5 h-3.5 text-circle-primary" />
            <span>
              {t.luckyWheel.spunBy.replace('{name}', spunByName)}
            </span>
          </div>
        </div>

        {/* Wheel Display Container */}
        <div className="relative my-2 flex items-center justify-center p-2">
          {/* Canvas Wheel */}
          <canvas
            ref={canvasRef}
            style={{ width: 320, height: 320 }}
            className="rounded-full shadow-xl transition-transform"
          />

          {/* Needle Pointer Anchored on the RIGHT OUTSIDE */}
          <div
            className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none drop-shadow-lg flex items-center"
            style={{ right: -16 }}
          >
            <svg width="40" height="28" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        {/* Status / Winner Announce Card */}
        <div className="w-full mt-4 min-h-[76px] flex flex-col items-center justify-center">
          {!isFinished ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-sm font-medium border border-teal-200 dark:border-teal-800 animate-pulse">
              <Compass className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
              <span>{t.luckyWheel.spinningLive}</span>
            </div>
          ) : (
            <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-2 border-amber-500/40 text-center animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {t.luckyWheel.winnerAnnounce}
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-wide break-words drop-shadow-sm">
                {session.winningOption?.optionLabel}
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Quay lại đoạn chat */}
        <button
          type="button"
          onClick={handleClose}
          className="mt-5 w-full py-3 px-5 rounded-2xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-circle-primary/20 transition-all active:scale-[0.98]"
        >
          <span>{t.luckyWheel.backToChat}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
