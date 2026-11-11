'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  X,
  Trophy,
  Loader2,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import {
  useWheelsQuery,
  useCreateWheelMutation,
  useSpinWheelMutation,
  useDeleteWheelMutation,
} from '../../hooks/use-circle-tools';
import { DecisionWheelEntity } from '@circle/types';

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
  const t = useLanguageStore((s) => s.t);
  const defaultOptions = [
    t.collab.wheelDefaultOption1,
    t.collab.wheelDefaultOption2,
    t.collab.wheelDefaultOption3,
  ];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<number>(0);
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [wheelTitle, setWheelTitle] = useState('');
  const [optionsList, setOptionsList] = useState<string[]>(defaultOptions);

  // Animation & UI feedback states
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [wheelError, setWheelError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmDeleteWheelId, setConfirmDeleteWheelId] = useState<string | null>(null);

  const { data: wheels = [], isLoading } = useWheelsQuery(circleId);
  const createMutation = useCreateWheelMutation(circleId);
  const spinMutation = useSpinWheelMutation(circleId);
  const deleteMutation = useDeleteWheelMutation(circleId);

  const activeWheel: DecisionWheelEntity | undefined =
    wheels.find((w) => w.id === selectedWheelId) || wheels[0];

  useEffect(() => {
    if (!selectedWheelId && wheels.length > 0) {
      setSelectedWheelId(wheels[0]?.id || null);
    }
  }, [wheels, selectedWheelId]);

  useEffect(() => {
    rotationRef.current = currentRotation;
  }, [currentRotation]);

  useEffect(() => {
    if (!isCreateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCreateModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen]);

  // Draw the wheel onto HTML5 Canvas with always-upright radial labels
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
    const maxLabelWidth = Math.max(52, radius - 52);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(centerX, centerY);

    options.forEach((opt, idx) => {
      const startAngle = currentRotation + idx * arcAngle;
      const endAngle = startAngle + arcAngle;
      const color = opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]!;

      // Draw slice
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Border line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Normalize slice mid-angle to [0, 2*PI) so text stays upright
      const rawMid = startAngle + arcAngle / 2;
      const midAngle = ((rawMid % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const isLeftHalf = midAngle > Math.PI / 2 && midAngle < 1.5 * Math.PI;

      ctx.save();
      ctx.rotate(isLeftHalf ? midAngle + Math.PI : midAngle);
      ctx.textAlign = isLeftHalf ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 4;

      let label = opt.optionLabel || '';
      if (ctx.measureText(label).width > maxLabelWidth) {
        while (label.length > 1 && ctx.measureText(`${label}…`).width > maxLabelWidth) {
          label = label.slice(0, -1);
        }
        label = `${label}…`;
      }

      ctx.fillText(label, isLeftHalf ? -(radius - 18) : radius - 18, 0);
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

    setWheelError(null);
    setIsSpinning(true);
    setWinner(null);

    try {
      const result = await spinMutation.mutateAsync(activeWheel.id);
      const targetLabel = result.selectedOption.optionLabel;

      const numOptions = activeWheel.options.length;
      const arcAngle = (2 * Math.PI) / numOptions;
      const targetIndex = Math.max(
        0,
        activeWheel.options.findIndex((o) => o.optionLabel === targetLabel),
      );

      // Pointer is at TOP (1.5 * PI rad). Compute cumulative forward delta from current rotation.
      const startRot = rotationRef.current;
      const twoPi = 2 * Math.PI;
      const currentMod = ((startRot % twoPi) + twoPi) % twoPi;
      const targetSliceCenter = targetIndex * arcAngle + arcAngle / 2;
      const jitter = (Math.random() - 0.5) * arcAngle * 0.4;
      const desiredMod = ((1.5 * Math.PI - targetSliceCenter + jitter) % twoPi + twoPi) % twoPi;
      const forwardDelta = (desiredMod - currentMod + twoPi) % twoPi;
      const totalDelta = 6 * twoPi + forwardDelta;

      const startTime = performance.now();
      const spinDuration = 4000;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newRotation = startRot + totalDelta * easeOut;
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
      setWheelError(err?.message || t.collab.spinWheelError);
    }
  };

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setWheelTitle('');
    setOptionsList([
      t.collab.wheelDefaultOption1,
      t.collab.wheelDefaultOption2,
      t.collab.wheelDefaultOption3,
    ]);
    setIsCreateModalOpen(true);
  };

  const handleAddOptionInput = () => {
    if (optionsList.length < 16) {
      setOptionsList([
        ...optionsList,
        t.collab.wheelItemPlaceholder.replace('{index}', String(optionsList.length + 1)),
      ]);
    }
  };

  const handleRemoveOptionInput = (idx: number) => {
    if (optionsList.length > 2) {
      setOptionsList(optionsList.filter((_, i) => i !== idx));
    }
  };

  const handleCreateWheel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const trimmedOptions = optionsList.map((o) => o.trim()).filter(Boolean);
    if (!wheelTitle.trim() || trimmedOptions.length < 2) {
      setCreateError(t.collab.wheelValidationMin);
      return;
    }

    try {
      const validOptions = trimmedOptions.map((label, idx) => ({
        optionLabel: label,
        color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      }));

      const res = await createMutation.mutateAsync({
        title: wheelTitle.trim(),
        options: validOptions,
      });

      setSelectedWheelId(res.id);
      setWheelTitle('');
      setOptionsList([
        t.collab.wheelDefaultOption1,
        t.collab.wheelDefaultOption2,
        t.collab.wheelDefaultOption3,
      ]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err?.message || t.collab.createWheelError);
    }
  };

  const handleDeleteWheel = async (wheelId: string) => {
    setWheelError(null);
    try {
      await deleteMutation.mutateAsync(wheelId);
      setConfirmDeleteWheelId(null);
      if (selectedWheelId === wheelId) {
        setSelectedWheelId(null);
        setWinner(null);
      }
    } catch (err: any) {
      setWheelError(err?.message || t.collab.deleteWheelError);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
      {/* Floating Glass Toolbar */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center justify-between px-5 py-2.5 rounded-full glass shadow-sm max-w-4xl w-full transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <Compass className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
            <h1 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
              {t.nav.luckyWheel}
            </h1>
            {wheels.length > 0 && (
              <span className="text-xs text-circle-slate dark:text-circle-dark-muted hidden sm:inline">
                • {t.collab.wheelCountLabel.replace('{count}', String(wheels.length))}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-full bg-circle-primary hover:bg-circle-sage px-4 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white transition-all shadow-xs active:scale-98"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.collab.createWheel}</span>
          </button>
        </div>
      </div>

      {/* Scroll-under Content Layer */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-12">
        {wheelError && (
          <div className="mb-4 max-w-5xl mx-auto flex items-center justify-between gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{wheelError}</span>
            </div>
            <button
              type="button"
              onClick={() => setWheelError(null)}
              className="p-1 hover:opacity-75"
              aria-label={t.common.close}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
          </div>
        ) : activeWheel ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Wheel Stage (2 cols) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-6 shadow-2xs relative">
              <h2 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text mb-4 text-center">
                {activeWheel.title}
              </h2>

              {/* Pointer marker */}
              <div className="relative flex flex-col items-center">
                <div className="z-10 -mb-3 text-circle-charcoal dark:text-circle-dark-primary filter drop-shadow-md">
                  ▼
                </div>

                {/* Canvas Wheel */}
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={340}
                  className="rounded-full shadow-lg max-w-full h-auto"
                />
              </div>

              {/* Winner Announcement Banner */}
              {winner && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-amber-700 dark:text-amber-400 font-bold text-sm animate-bounce shadow-2xs">
                  <Trophy className="h-4 w-4 shrink-0" />
                  <span>{t.collab.wheelResultLabel.replace('{winner}', winner)}</span>
                </div>
              )}

              {/* Spin button */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={handleSpin}
                  className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-6 py-2.5 text-xs font-bold text-white dark:text-circle-dark-canvas hover:bg-circle-sage hover:text-white dark:hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <RotateCw className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>{isSpinning ? t.collab.spinning : t.collab.spinAction}</span>
                </button>
              </div>
            </div>

            {/* Wheel Selector & Options List (1 col) */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs">
                <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider mb-3">
                  {t.collab.wheelListTitle.replace('{count}', String(wheels.length))}
                </h3>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {wheels.map((w) => {
                    const isConfirming = confirmDeleteWheelId === w.id;
                    return (
                      <div key={w.id} className="space-y-1">
                        <div
                          onClick={() => {
                            setSelectedWheelId(w.id);
                            setWinner(null);
                            setConfirmDeleteWheelId(null);
                          }}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                            activeWheel.id === w.id
                              ? 'bg-circle-sage/10 text-circle-sage dark:bg-circle-dark-primary/15 dark:text-circle-dark-primary font-bold'
                              : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text'
                          }`}
                        >
                          <span className="truncate">{w.title}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteWheelId(isConfirming ? null : w.id);
                            }}
                            className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-colors"
                            title={t.collab.deleteWheelConfirm}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {isConfirming && (
                          <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 text-[11px]">
                            <span className="text-rose-600 dark:text-rose-400 font-medium truncate">
                              {t.collab.deleteWheelConfirm}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteWheelId(null)}
                                className="px-2 py-0.5 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash"
                              >
                                {t.common.cancel}
                              </button>
                              <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => handleDeleteWheel(w.id)}
                                className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50"
                              >
                                {t.common.delete}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas p-4 shadow-2xs">
                <h3 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider mb-3">
                  {t.collab.wheelOptionsTitle.replace('{count}', String(activeWheel.options.length))}
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40 max-w-3xl mx-auto">
            <Compass className="h-10 w-10 text-circle-sage dark:text-circle-dark-primary opacity-75 mb-3" />
            <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
              {t.collab.wheelEmptyTitle}
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
              {t.collab.wheelEmptyDesc}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-circle-primary hover:bg-circle-sage px-4 py-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.collab.createWheel}</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Wheel Modal */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl glass-sheet p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.wheelCreateModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text"
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWheel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  {t.collab.wheelTopicLabel}
                </label>
                <input
                  type="text"
                  required
                  value={wheelTitle}
                  onChange={(e) => setWheelTitle(e.target.value)}
                  placeholder={t.collab.wheelTopicPlaceholder}
                  autoFocus
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                    {t.collab.wheelMinOptionsLabel}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOptionInput}
                    className="text-xs font-semibold text-circle-sage dark:text-circle-dark-primary hover:underline"
                  >
                    + {t.collab.addItem}
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
                        placeholder={t.collab.wheelItemPlaceholder.replace('{index}', String(idx + 1))}
                        className="flex-1 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-1.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-sage"
                      />
                      {optionsList.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionInput(idx)}
                          className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500"
                          title={t.collab.removeOption}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !wheelTitle.trim()}
                  className="rounded-lg bg-circle-primary hover:bg-circle-sage px-4 py-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? t.collab.wheelCreating : t.collab.wheelCreateSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
