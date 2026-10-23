'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  X,
  Sparkles,
  Trophy,
  Loader2,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import {
  useWheelsQuery,
  useCreateWheelMutation,
  useSpinWheelMutation,
  useDeleteWheelMutation,
} from '../../hooks/use-circle-tools';
import { DecisionWheelEntity, WheelOptionEntity } from '@circle/types';

interface CircleWheelViewProps {
  circleId: string;
}

const DEFAULT_COLORS = [
  '#F87171', // red
  '#FB923C', // orange
  '#FBBF24', // amber
  '#34D399', // emerald
  '#60A5FA', // blue
  '#818CF8', // indigo
  '#A78BFA', // purple
  '#F472B6', // pink
];

export const CircleWheelView: React.FC<CircleWheelViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [wheelTitle, setWheelTitle] = useState('');
  const [optionsList, setOptionsList] = useState<string[]>(['Ăn phở', 'Cơm tấm', 'Bún chả']);

  // Animation states
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);

  const { data: wheels = [], isLoading } = useWheelsQuery(circleId);
  const createMutation = useCreateWheelMutation(circleId);
  const spinMutation = useSpinWheelMutation(circleId);
  const deleteMutation = useDeleteWheelMutation(circleId);

  // Active wheel
  const activeWheel: DecisionWheelEntity | undefined =
    wheels.find((w) => w.id === selectedWheelId) || wheels[0];

  useEffect(() => {
    if (!selectedWheelId && wheels.length > 0) {
      setSelectedWheelId(wheels[0]?.id || null);
    }
  }, [wheels, selectedWheelId]);

  // Draw the wheel onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeWheel || !activeWheel.options || activeWheel.options.length === 0)
      return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const options = activeWheel.options;
    const numOptions = options.length;
    const arcAngle = (2 * Math.PI) / numOptions;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);

    options.forEach((opt, idx) => {
      const angle = idx * arcAngle;
      const color = opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]!;

      // Draw slice
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arcAngle);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Border line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(angle + arcAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(opt.optionLabel, radius - 20, 4);
      ctx.restore();
    });

    // Draw center circle hub
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, [activeWheel, currentRotation]);

  const handleSpin = async () => {
    if (!activeWheel || isSpinning || activeWheel.options.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    try {
      const result = await spinMutation.mutateAsync(activeWheel.id);
      const targetLabel = result.selectedOption.optionLabel;

      const numOptions = activeWheel.options.length;
      const arcAngle = (2 * Math.PI) / numOptions;
      const targetIndex = activeWheel.options.findIndex(
        (o) => o.optionLabel === targetLabel,
      );

      // Pointer is located at TOP (-PI/2)
      // We want slice `targetIndex` center to align with -PI/2
      // slice center at resting position is `targetIndex * arcAngle + arcAngle / 2`
      // rotation angle needed = 3*PI/2 - (targetIndex * arcAngle + arcAngle / 2) + extra full spins
      const extraSpins = 6 * 2 * Math.PI; // 6 full rotations
      const targetSliceCenter = targetIndex * arcAngle + arcAngle / 2;
      const finalAngle =
        extraSpins + (1.5 * Math.PI - targetSliceCenter) + (Math.random() * 0.2 - 0.1);

      const startTime = performance.now();
      const spinDuration = 4000; // 4 seconds easing

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newRotation = finalAngle * easeOut;
        setCurrentRotation(newRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          setWinner(targetLabel);
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      setIsSpinning(false);
      alert(err.message || 'Lỗi khi quay vòng');
    }
  };

  const handleAddOptionInput = () => {
    if (optionsList.length < 16) {
      setOptionsList([...optionsList, `Lựa chọn ${optionsList.length + 1}`]);
    }
  };

  const handleRemoveOptionInput = (idx: number) => {
    if (optionsList.length > 2) {
      setOptionsList(optionsList.filter((_, i) => i !== idx));
    }
  };

  const handleCreateWheel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wheelTitle.trim() || optionsList.filter((o) => o.trim()).length < 2) return;

    const validOptions = optionsList
      .filter((o) => o.trim())
      .map((label, idx) => ({
        optionLabel: label.trim(),
        color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      }));

    const res = await createMutation.mutateAsync({
      title: wheelTitle.trim(),
      options: validOptions,
    });

    setSelectedWheelId(res.id);
    setWheelTitle('');
    setOptionsList(['Ăn phở', 'Cơm tấm', 'Bún chả']);
    setIsCreateModalOpen(false);
  };

  const handleDeleteWheel = async (wheelId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa vòng quay này?')) {
      await deleteMutation.mutateAsync(wheelId);
      if (selectedWheelId === wheelId) {
        setSelectedWheelId(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-y-auto p-4 md:p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline mb-6">
        <div>
          <h1 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
            {t.nav.luckyWheel}
          </h1>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
            Quyết định ngẫu nhiên công bằng và thú vị cho các kèo ăn uống, đi chơi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-3.5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-sm active:scale-98"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tạo Vòng quay mới</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
        </div>
      ) : activeWheel ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wheel Stage (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-6 shadow-2xs relative">
            <h2 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text mb-4">
              {activeWheel.title}
            </h2>

            {/* Pointer marker */}
            <div className="relative flex flex-col items-center">
              <div className="z-10 -mb-3 text-circle-charcoal dark:text-circle-primary filter drop-shadow-md">
                ▼
              </div>

              {/* Canvas Wheel */}
              <canvas
                ref={canvasRef}
                width={340}
                height={340}
                className="rounded-full shadow-lg"
              />
            </div>

            {/* Winner Announcement Banner */}
            {winner && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-amber-700 dark:text-amber-400 font-bold text-sm animate-bounce shadow-2xs">
                <Trophy className="h-4 w-4" />
                <span>Kết quả: {winner}</span>
              </div>
            )}

            {/* Spin button */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpin}
                className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-6 py-2.5 text-xs font-bold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <RotateCw className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Đang quay...' : 'QUAY NGAY'}</span>
              </button>
            </div>
          </div>

          {/* Wheel Selector & Options List (1 col) */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs">
              <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider mb-3">
                Danh sách Vòng quay ({wheels.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {wheels.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => {
                      setSelectedWheelId(w.id);
                      setWinner(null);
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      activeWheel.id === w.id
                        ? 'bg-circle-sage/10 text-circle-sage dark:bg-circle-primary/10 dark:text-circle-primary font-bold'
                        : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
                    }`}
                  >
                    <span className="truncate">{w.title}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWheel(w.id);
                      }}
                      className="p-1 text-circle-slate hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs">
              <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider mb-3">
                Các phương án lựa chọn ({activeWheel.options.length})
              </h3>
              <div className="space-y-2">
                {activeWheel.options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2.5 rounded-lg bg-circle-wash/50 dark:bg-circle-dark-wash/50 px-3 py-1.5 text-xs text-circle-charcoal dark:text-circle-dark-text"
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                      }}
                    />
                    <span className="truncate">{opt.optionLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40">
          <Compass className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
          <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
            Chưa có Vòng xoay nào
          </h4>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
            Tạo vòng xoay để cùng chọn quán ăn trưa, địa điểm du lịch hoặc chọn người may mắn!
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo Vòng quay ngay</span>
          </button>
        </div>
      )}

      {/* Create Wheel Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Tạo Vòng Quay May Mắn Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWheel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  Chủ đề / Tiêu đề vòng quay *
                </label>
                <input
                  type="text"
                  required
                  value={wheelTitle}
                  onChange={(e) => setWheelTitle(e.target.value)}
                  placeholder="Ví dụ: Trưa nay ăn gì? Đi chơi ở đâu?..."
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                    Các phương án (tối thiểu 2)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOptionInput}
                    className="text-xs font-semibold text-circle-sage dark:text-circle-primary hover:underline"
                  >
                    + Thêm phương án
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {optionsList.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                        }}
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...optionsList];
                          updated[idx] = e.target.value;
                          setOptionsList(updated);
                        }}
                        className="flex-1 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-1.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                      />
                      {optionsList.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionInput(idx)}
                          className="p-1 text-circle-slate hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !wheelTitle.trim()}
                  className="rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo Vòng quay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
