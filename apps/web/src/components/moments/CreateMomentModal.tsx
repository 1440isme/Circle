'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Send, AlertTriangle, Check, CheckSquare, Square, Sparkles } from 'lucide-react';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import { useMyCirclesQuery } from '@/hooks/use-circle-queries';
import { useCreateMomentMutation } from '@/hooks/use-moment-queries';

interface CreateMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PHOTOS = [
  {
    name: 'Cà phê sáng',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Góc học tập',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Hoàng hôn',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bữa cơm ấm cúng',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  },
];

export const CreateMomentModal: React.FC<CreateMomentModalProps> = ({ isOpen, onClose }) => {
  const t = useLanguageStore((s) => s.t);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const { data: myCircles = [] } = useMyCirclesQuery();

  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedCircleIds, setSelectedCircleIds] = useState<string[]>(() => {
    return activeCircle ? [activeCircle.id] : [];
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createMomentMutation = useCreateMomentMutation();

  if (!isOpen) return null;

  const handleToggleCircle = (circleId: string) => {
    setSelectedCircleIds((prev) =>
      prev.includes(circleId) ? prev.filter((id) => id !== circleId) : [...prev, circleId],
    );
  };

  const handleSelectAllCircles = () => {
    if (selectedCircleIds.length === myCircles.length) {
      setSelectedCircleIds([]);
    } else {
      setSelectedCircleIds(myCircles.map((c) => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!photoUrl.trim()) {
      setErrorMessage(t.validation.momentPhotoUrlRequired);
      return;
    }

    if (selectedCircleIds.length === 0) {
      setErrorMessage(t.validation.momentCirclesRequired);
      return;
    }

    try {
      await createMomentMutation.mutateAsync({
        photoUrl: photoUrl.trim(),
        caption: caption.trim() || undefined,
        circleIds: selectedCircleIds,
      });

      setSuccessMessage(t.moments.shareSuccess);
      setTimeout(() => {
        setPhotoUrl('');
        setCaption('');
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || t.common.unknownError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-circle-charcoal/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-circle-dark-surface rounded-3xl shadow-circle-card border border-circle-hairline dark:border-circle-dark-hairline flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div>
            <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
              {t.moments.createTitle}
            </h3>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
              {t.moments.createSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-canvas transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Photo URL Input & Preview */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-circle-primary" />
              <span>{t.moments.photoUrlLabel}</span>
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder={t.moments.photoUrlPlaceholder}
              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary"
            />

            {/* Quick Preset Samples */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Gợi ý ảnh:</span>
              </span>
              {PRESET_PHOTOS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setPhotoUrl(preset.url)}
                  className="px-2 py-0.5 rounded-lg text-[10px] border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-primary/10 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Image Preview Box */}
            {photoUrl && (
              <div className="mt-3 relative h-48 w-full rounded-2xl overflow-hidden border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas">
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => setErrorMessage(t.validation.momentPhotoUrlInvalid)}
                />
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5 flex items-center justify-between">
              <span>{t.moments.captionLabel}</span>
              <span className="text-[10px] text-circle-slate font-normal">
                {caption.length}/280
              </span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder={t.moments.captionPlaceholder}
              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary resize-none"
            />
          </div>

          {/* Circle Visibility Selector (Circle-based Privacy) */}
          <div className="space-y-2 p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.moments.selectCirclesLabel}
                </h4>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                  {t.moments.selectCirclesDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllCircles}
                className="text-[11px] font-semibold text-circle-primary hover:underline"
              >
                {selectedCircleIds.length === myCircles.length ? t.common.cancel : 'Chọn tất cả'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {myCircles.map((circle) => {
                const isSelected = selectedCircleIds.includes(circle.id);
                return (
                  <div
                    key={circle.id}
                    onClick={() => handleToggleCircle(circle.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-circle-primary bg-circle-primary/10'
                        : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-circle-primary/20 text-circle-charcoal dark:text-circle-primary font-bold text-xs">
                        {circle.avatarUrl ? (
                          <img src={circle.avatarUrl} alt={circle.name} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          circle.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                        {circle.name}
                      </span>
                    </div>

                    <div className="text-circle-primary shrink-0 pl-2">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 text-circle-slate/50" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={createMomentMutation.isPending || selectedCircleIds.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal py-3 px-4 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>
                {createMomentMutation.isPending
                  ? t.moments.submitting
                  : `${t.moments.submitShare} (${selectedCircleIds.length} Vòng tròn)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
