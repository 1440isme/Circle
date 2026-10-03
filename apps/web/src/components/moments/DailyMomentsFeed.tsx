'use client';

import React, { useState } from 'react';
import {
  Camera,
  Heart,
  Volume2,
  VolumeX,
  Trash2,
  Plus,
  Sparkles,
  MessageCircle,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import {
  useMomentsFeedQuery,
  useCircleMomentsQuery,
  useReactMomentMutation,
  useDeleteMomentMutation,
  useReplyMomentMutation,
} from '@/hooks/use-moment-queries';
import { CreateMomentModal } from './CreateMomentModal';

interface DailyMomentsFeedProps {
  circleId?: string;
}

const EMOJI_OPTIONS = ['❤️', '🔥', '😂', '👏', '😍'];

export const DailyMomentsFeed: React.FC<DailyMomentsFeedProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const activeCircleStore = useCircleStore((s) => s.activeCircle);
  const targetCircleId = circleId || activeCircleStore?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [unmutedVideoIds, setUnmutedVideoIds] = useState<Record<string, boolean>>({});

  // Queries
  const { data: feedMoments = [], isLoading: isLoadingFeed } = useMomentsFeedQuery();
  const { data: circleMoments = [], isLoading: isLoadingCircle } = useCircleMomentsQuery(
    targetCircleId || null,
  );

  const moments = targetCircleId ? circleMoments : feedMoments;
  const isLoading = targetCircleId ? isLoadingCircle : isLoadingFeed;

  const reactMutation = useReactMomentMutation();
  const deleteMutation = useDeleteMomentMutation();
  const replyMutation = useReplyMomentMutation();

  const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replySuccessMap, setReplySuccessMap] = useState<Record<string, boolean>>({});

  const handleToggleSound = (momentId: string) => {
    setUnmutedVideoIds((prev) => ({
      ...prev,
      [momentId]: !prev[momentId],
    }));
  };

  const handleSendFeedReply = async (momentId: string, circleId: string) => {
    const text = (replyTexts[momentId] || '').trim();
    if (!text || !circleId || replyMutation.isPending) return;

    try {
      await replyMutation.mutateAsync({
        momentId,
        message: text,
        circleId,
      });
      setReplyTexts((prev) => ({ ...prev, [momentId]: '' }));
      setReplySuccessMap((prev) => ({ ...prev, [momentId]: true }));
      setTimeout(() => {
        setReplySuccessMap((prev) => ({ ...prev, [momentId]: false }));
        setExpandedReplyId((prev) => (prev === momentId ? null : prev));
      }, 2500);
    } catch {
      // Handled by mutation
    }
  };

  const handleReact = async (momentId: string, emoji: string) => {
    try {
      await reactMutation.mutateAsync({ momentId, emoji });
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (momentId: string) => {
    if (window.confirm(t.moments.deleteConfirm)) {
      try {
        await deleteMutation.mutateAsync(momentId);
      } catch {
        // Ignore
      }
    }
  };

  const formatMomentTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return t.moments.justNow;
      if (diffMins < 60) return `${diffMins}p trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h trước`;
      return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 w-full max-w-xl mx-auto flex flex-col gap-6 py-2">
      {/* Feed Top Header & Quick Capture CTA (Only shown when moments exist) */}
      {moments.length > 0 && (
        <div className="rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 p-4 shadow-circle-card backdrop-blur-md transition-colors flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold shadow-sm">
              <Camera className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.moments.locketWidgetTitle}
              </h3>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {moments.length} {locale === 'vi' ? 'khoảnh khắc được chia sẻ' : 'moments shared'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal hover:bg-circle-sage px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span>{t.moments.sendLocketBtn}</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && moments.length === 0 && (
        <div className="flex flex-col gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 shadow-circle-card animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-circle-canvas dark:bg-circle-dark-canvas" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-28 bg-circle-canvas dark:bg-circle-dark-canvas rounded" />
                  <div className="h-2.5 w-16 bg-circle-canvas dark:bg-circle-dark-canvas rounded" />
                </div>
              </div>
              <div className="aspect-[4/5] w-full rounded-2xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60" />
            </div>
          ))}
        </div>
      )}

      {/* Vertical Feed Stream ("Bản tin lướt dọc") */}
      {moments.length > 0 ? (
        <div className="flex flex-col gap-6 pb-12">
          {moments.map((moment) => {
            const authorName = moment.author?.profile?.displayName || 'Bạn bè';
            const authorAvatar = moment.author?.profile?.avatarUrl;
            const authorInitial = authorName.slice(0, 2).toUpperCase();
            const isAuthor = moment.authorId === user?.id;
            const isVideo =
              moment.mediaType === 'VIDEO' || Boolean(moment.photoUrl?.startsWith('data:video/'));
            const isSoundOn = Boolean(unmutedVideoIds[moment.id]);

            return (
              <article
                key={moment.id}
                className="rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-4 sm:p-5 shadow-circle-card transition-colors flex flex-col gap-3.5"
              >
                {/* Author Info Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-circle-primary text-circle-charcoal font-bold text-xs flex items-center justify-center overflow-hidden shadow-sm">
                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        authorInitial
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                        {authorName}
                      </h4>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
                        {formatMomentTime(moment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Delete button (Author only) */}
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => handleDelete(moment.id)}
                        className="p-2 rounded-full hover:bg-rose-500/10 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-colors"
                        title={t.moments.deleteTitle}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Container (Large rounded card for vertical newsfeed) */}
                <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 dark:border-stone-700/60 shadow-inner group select-none">
                  {isVideo ? (
                    <video
                      src={moment.photoUrl}
                      autoPlay
                      loop
                      playsInline
                      muted={!isSoundOn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={moment.photoUrl}
                      alt={moment.caption || 'Khoảnh khắc thường ngày'}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Gradient Overlay for Caption readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Sound Toggle (if video) */}
                  {isVideo && (
                    <button
                      type="button"
                      onClick={() => handleToggleSound(moment.id)}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md z-10"
                      title={isSoundOn ? 'Tắt âm' : 'Bật âm'}
                    >
                      {isSoundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                  )}

                  {/* Caption Overlay */}
                  {moment.caption && (
                    <div className="absolute bottom-3 inset-x-3 flex justify-center pointer-events-none z-10">
                      <div className="bg-black/70 backdrop-blur-md text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-2xl max-w-[92%] text-center border border-white/15 shadow-md">
                        {moment.caption}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Reactions & Reply Dock */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline">
                      {EMOJI_OPTIONS.map((emoji) => {
                        const isSelected = moment.userReaction === emoji;
                        const count = moment.reactionCounts?.[emoji] || 0;

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReact(moment.id, emoji)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all active:scale-125 ${
                              isSelected
                                ? 'bg-circle-primary/20 border border-circle-primary/50 text-circle-sage dark:text-circle-primary scale-105 shadow-sm'
                                : 'hover:bg-circle-wash dark:hover:bg-circle-dark-wash opacity-80 hover:opacity-100'
                            }`}
                            title={emoji}
                          >
                            <span>{emoji}</span>
                            {count > 0 && (
                              <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReplyId((prev) => (prev === moment.id ? null : moment.id))
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          expandedReplyId === moment.id
                            ? 'bg-circle-primary text-circle-charcoal'
                            : 'bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-wash border border-circle-hairline dark:border-circle-dark-hairline'
                        }`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{t.moments.replyButton || 'Phản hồi'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Quick Reply Form */}
                  {expandedReplyId === moment.id && (
                    <div className="pt-2 animate-fade-in">
                      {replySuccessMap[moment.id] ? (
                        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{t.moments.replySuccess || 'Đã gửi phản hồi vào khung chat của Vòng tròn!'}</span>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const primaryCircleId =
                              moment.visibilities?.[0]?.circleId || targetCircleId || '';
                            handleSendFeedReply(moment.id, primaryCircleId);
                          }}
                          className="flex items-center gap-2 bg-circle-canvas/90 dark:bg-circle-dark-canvas/90 rounded-2xl p-1.5 border border-circle-hairline dark:border-circle-dark-hairline focus-within:border-circle-primary transition-colors"
                        >
                          <input
                            type="text"
                            value={replyTexts[moment.id] || ''}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({ ...prev, [moment.id]: e.target.value }))
                            }
                            placeholder={t.moments.replyPlaceholder || 'Gửi tin nhắn phản hồi vào nhóm chat...'}
                            maxLength={2000}
                            className="flex-1 bg-transparent px-3 py-1 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:outline-none min-w-0"
                          />
                          <button
                            type="submit"
                            disabled={!replyTexts[moment.id]?.trim() || replyMutation.isPending}
                            className="p-2 rounded-xl bg-circle-primary text-circle-charcoal disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-sm"
                            title={t.moments.replyButton || 'Gửi'}
                          >
                            <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : !isLoading ? (
        /* Empty Feed State - Single Clean Prompt Card */
        <div className="rounded-3xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/60 dark:bg-circle-dark-surface/60 p-10 text-center shadow-circle-card flex flex-col items-center justify-center gap-4 transition-colors">
          <div className="h-16 w-16 rounded-3xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary flex items-center justify-center shadow-sm">
            <Camera className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
              {t.moments.emptyLocketTitle}
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
              {t.moments.emptyLocketDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal hover:bg-circle-sage px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span>{t.moments.sendLocketBtn}</span>
          </button>
        </div>
      ) : null}

      {/* Realtime Camera & Short Video Capture Modal */}
      <CreateMomentModal
        isOpen={isCreateOpen}
        circleId={targetCircleId || undefined}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
