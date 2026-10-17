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
  Smile,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import { PROMINENT_QUICK_EMOJIS } from '@circle/shared';
import {
  useMomentsFeedQuery,
  useCircleMomentsQuery,
  useReactMomentMutation,
  useDeleteMomentMutation,
  useReplyMomentMutation,
} from '@/hooks/use-moment-queries';
import { CreateMomentModal } from './CreateMomentModal';
import { Emoji } from '@/components/ui/Emoji';
import { FullEmojiPickerModal } from '@/components/ui/FullEmojiPickerModal';

interface DailyMomentsFeedProps {
  circleId?: string;
}

const EMOJI_OPTIONS = PROMINENT_QUICK_EMOJIS;

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
  const [fullEmojiTargetMomentId, setFullEmojiTargetMomentId] = useState<string | null>(null);

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
    <div className="flex-1 w-full h-full overflow-y-auto snap-y snap-mandatory custom-scrollbar scroll-smooth flex flex-col relative bg-white dark:bg-circle-dark-surface">
      {/* Loading Skeleton */}
      {isLoading && moments.length === 0 && (
        <div className="w-full max-w-4xl px-4 sm:px-6 mx-auto flex flex-col gap-6 py-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-full animate-pulse space-y-3 py-4 border-b border-circle-hairline dark:border-circle-dark-hairline"
            >
              <div className="flex items-center gap-3 px-4 sm:px-6">
                <div className="h-9 w-9 rounded-full bg-circle-canvas dark:bg-circle-dark-canvas" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-28 bg-circle-canvas dark:bg-circle-dark-canvas rounded" />
                  <div className="h-2.5 w-16 bg-circle-canvas dark:bg-circle-dark-canvas rounded" />
                </div>
              </div>
              <div className="aspect-square w-full bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 rounded-3xl" />
            </div>
          ))}
        </div>
      )}

      {/* Vertical Feed Stream: Snaps to 1 photo per view, responsive balanced width */}
      {moments.length > 0 ? (
        <div className="flex flex-col w-full pb-20">
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
                className="snap-start snap-always w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors border-b border-circle-hairline/40 dark:border-circle-dark-hairline/40"
              >
                <div className="w-full max-w-4xl flex flex-col gap-3 justify-center">
                  {/* Author Info Bar (Padded) */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-circle-primary text-circle-charcoal font-bold text-xs flex items-center justify-center overflow-hidden shadow-sm">
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

                  {/* Media Container: Guaranteed 1:1 square aspect ratio matching card width */}
                  <div className="w-full">
                    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-stone-900 select-none shadow-md">
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
                </div>

                {/* Bottom Reactions & Reply Dock (Padded) */}
                <div className="space-y-2 pt-1 px-4 sm:px-6">
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
                            <Emoji emoji={emoji} size={18} />
                            {count > 0 && (
                              <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setFullEmojiTargetMomentId(moment.id)}
                        className="flex items-center justify-center h-7 w-7 rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-white transition-colors"
                        title="Thêm biểu cảm khác"
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </button>
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
                </div>
              </article>
            );
          })}
        </div>
      ) : !isLoading ? (
        /* Empty Feed State - Clean Minimal Title without redundant explanation */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
          <div className="h-14 w-14 rounded-full bg-circle-primary/10 text-circle-sage dark:text-circle-primary flex items-center justify-center shadow-xs">
            <Camera className="h-7 w-7 stroke-[1.5]" />
          </div>
          <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
            {t.moments.emptyMomentTitle}
          </h4>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal hover:bg-circle-sage px-5 py-2 text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span>{t.moments.sendMomentBtn}</span>
          </button>
        </div>
      ) : null}

      {/* Sticky Floating Round Camera Shutter Button in Horizontal Center of Column 2 */}
      <div className="sticky bottom-6 inset-x-0 flex justify-center z-30 pointer-events-none pb-2 mt-auto">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-2xl hover:scale-110 active:scale-95 transition-transform"
          title={t.moments.sendMomentBtn}
        >
          <Camera className="h-6 w-6 stroke-[2]" />
        </button>
      </div>

      {/* Realtime Camera & Short Video Capture Modal */}
      <CreateMomentModal
        isOpen={isCreateOpen}
        circleId={targetCircleId || undefined}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Full Comprehensive Emoji Picker Modal */}
      <FullEmojiPickerModal
        isOpen={Boolean(fullEmojiTargetMomentId)}
        onClose={() => setFullEmojiTargetMomentId(null)}
        onSelectEmoji={(emoji) => {
          if (fullEmojiTargetMomentId) {
            handleReact(fullEmojiTargetMomentId, emoji);
          }
        }}
      />
    </div>
  );
};
