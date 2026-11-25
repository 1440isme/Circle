'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Plus,
  Trash2,
  X,
  Send,
  Loader2,
  Quote,
  Sparkles,
  Smile,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { Emoji } from '../ui/Emoji';
import { FullEmojiPickerModal } from '../ui/FullEmojiPickerModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { PROMINENT_QUICK_EMOJIS } from '@circle/shared';
import {
  useAnonymousPostsQuery,
  useCreateAnonymousPostMutation,
  useDeleteAnonymousPostMutation,
  useReactAnonymousPostMutation,
  TOOLS_KEYS,
} from '../../hooks/use-circle-tools';

interface CircleAnonymousViewProps {
  circleId: string;
}

interface ThemeConfig {
  id: string;
  name: string;
  bgGradient: string;
  textColor: string;
  tagColor: string;
}

const getThemeName = (id: string, t: any) => {
  switch (id) {
    case 'sunset':
      return t.collab?.anonymousThemeSunset || 'Hoàng hôn';
    case 'ocean':
      return t.collab?.anonymousThemeOcean || 'Đại dương';
    case 'lavender':
      return t.collab?.anonymousThemeLavender || 'Oải hương';
    case 'rose':
      return t.collab?.anonymousThemeRose || 'Hoa hồng';
    case 'mint':
      return t.collab?.anonymousThemeMint || 'Bạc hà';
    default:
      return id;
  }
};

const THEMES: ThemeConfig[] = [
  {
    id: 'sunset',
    name: 'Hoàng hôn',
    bgGradient:
      'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/70 dark:from-[#2A1B12] dark:via-[#332014] dark:to-[#26160E] border-amber-200/80 dark:border-amber-500/35',
    textColor: 'text-amber-950 dark:text-amber-100',
    tagColor: 'bg-amber-500/15 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200',
  },
  {
    id: 'ocean',
    name: 'Đại dương',
    bgGradient:
      'bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-100/70 dark:from-[#0E2333] dark:via-[#132C3F] dark:to-[#0C1E2B] border-sky-200/80 dark:border-sky-500/35',
    textColor: 'text-sky-950 dark:text-sky-100',
    tagColor: 'bg-sky-500/15 text-sky-900 dark:bg-sky-400/20 dark:text-sky-200',
  },
  {
    id: 'lavender',
    name: 'Oải hương',
    bgGradient:
      'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-indigo-100/70 dark:from-[#231533] dark:via-[#2C1A3F] dark:to-[#1E112B] border-purple-200/80 dark:border-purple-500/35',
    textColor: 'text-purple-950 dark:text-purple-100',
    tagColor: 'bg-purple-500/15 text-purple-900 dark:bg-purple-400/20 dark:text-purple-200',
  },
  {
    id: 'rose',
    name: 'Hoa hồng',
    bgGradient:
      'bg-gradient-to-br from-pink-50 via-rose-50 to-red-100/70 dark:from-[#2E141E] dark:via-[#381824] dark:to-[#261018] border-pink-200/80 dark:border-pink-500/35',
    textColor: 'text-pink-950 dark:text-pink-100',
    tagColor: 'bg-pink-500/15 text-pink-900 dark:bg-pink-400/20 dark:text-pink-200',
  },
  {
    id: 'mint',
    name: 'Bạc hà',
    bgGradient:
      'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 dark:from-[#0E261E] dark:via-[#133026] dark:to-[#0B2019] border-emerald-200/80 dark:border-emerald-500/35',
    textColor: 'text-emerald-950 dark:text-emerald-100',
    tagColor: 'bg-emerald-500/15 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-200',
  },
];

const formatPostDate = (isoString: string) => {
  const d = new Date(isoString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

// Estimate card height for dynamic shortest-column waterfall balancing
const estimateCardHeight = (content: string, reactionCount: number) => {
  // Base chrome: card padding + sender tag + footer ~ 90px
  const baseHeight = 90;
  // Estimated ~42 chars per line in a 3-column layout ~ 20px per line
  const lines = Math.max(1, Math.ceil(content.length / 42));
  const textHeight = lines * 20;
  // Extra reaction wrap if many reactions
  const extraReactions = reactionCount > 2 ? 24 : 0;
  return baseHeight + textHeight + extraReactions;
};

function useColumnCount(): number {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else if (width < 1440) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}

export const CircleAnonymousView: React.FC<CircleAnonymousViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const { t, locale } = useLanguageStore();

  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');
  const [fullEmojiTargetPostId, setFullEmojiTargetPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useAnonymousPostsQuery(circleId);
  const createMutation = useCreateAnonymousPostMutation(circleId);
  const deleteMutation = useDeleteAnonymousPostMutation(circleId);
  const reactMutation = useReactAnonymousPostMutation(circleId);
  const queryClient = useQueryClient();

  const columnCount = useColumnCount();

  // Shortest-Column Waterfall: Distribute posts newest-first into the column with lowest accumulated height
  const columnsData = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const cols: { posts: typeof posts; height: number }[] = Array.from(
      { length: columnCount },
      () => ({ posts: [], height: 0 })
    );

    posts.forEach((post) => {
      const estHeight = estimateCardHeight(
        post.content,
        post.reactions?.length || 0
      );

      // Find the currently shortest column
      let shortestIdx = 0;
      let minHeight = cols[0]!.height;

      for (let i = 1; i < columnCount; i++) {
        if (cols[i]!.height < minHeight) {
          minHeight = cols[i]!.height;
          shortestIdx = i;
        }
      }

      cols[shortestIdx]!.posts.push(post);
      cols[shortestIdx]!.height += estHeight;
    });

    return cols.map((c) => c.posts);
  }, [posts, columnCount]);

  // Realtime Socket.IO sync for reactions
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReaction = () => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.anonymous(circleId) });
    };

    socket.on('circle:anonymous-post-reaction-updated', handleReaction);
    return () => {
      socket.off('circle:anonymous-post-reaction-updated', handleReaction);
    };
  }, [circleId, queryClient]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await createMutation.mutateAsync({
      content: content.trim(),
      cardTheme: selectedTheme,
    });

    setContent('');
    setIsComposeModalOpen(false);
  };

  const handleToggleReaction = (postId: string, emoji: string) => {
    // Optimistic UI update: Rule 1 reaction per user
    queryClient.setQueryData(TOOLS_KEYS.anonymous(circleId), (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((p) => {
        if (p.id !== postId) return p;
        const curReactions = p.reactions ? [...p.reactions] : [];
        const currentlyUserReacted = curReactions.find((r: any) => r.userReacted);

        let nextReactions: any[] = [];

        if (currentlyUserReacted && currentlyUserReacted.emoji === emoji) {
          // Unreact the current emoji
          nextReactions = curReactions
            .map((r: any) => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
            .filter((r: any) => r.count > 0);
        } else {
          // Remove old reaction if exists
          const cleaned = curReactions
            .map((r: any) => (r.userReacted ? { ...r, count: r.count - 1, userReacted: false } : r))
            .filter((r: any) => r.count > 0);

          // Add / increment the new emoji
          const existingTarget = cleaned.find((r: any) => r.emoji === emoji);
          if (existingTarget) {
            nextReactions = cleaned.map((r: any) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r,
            );
          } else {
            nextReactions = [...cleaned, { emoji, count: 1, userReacted: true }];
          }
        }

        return { ...p, reactions: nextReactions };
      });
    });

    reactMutation.mutate({ postId, emoji });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
      {/* Floating Pill Controls Bar (Full gần sát lề, cân đối với nội dung) */}
      <div className="pointer-events-none absolute top-14 lg:top-4 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="pointer-events-auto flex items-center gap-2">
            {posts.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm text-xs font-semibold text-circle-slate dark:text-circle-dark-muted select-none">
                <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>{t.collab.anonymousCountLabel.replace('{count}', String(posts.length))}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsComposeModalOpen(true)}
            className="pointer-events-auto inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm border border-circle-hairline/60 dark:border-white/12 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{t.collab.createAnonymousNote}</span>
          </button>
        </div>
      </div>

      {/* Scroll-under Content Layer */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-18 pb-16">
        <div className="max-w-6xl mx-auto w-full">

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
        </div>
      ) : posts.length > 0 ? (
        <div className="flex gap-4 items-start w-full">
          {columnsData.map((colPosts, colIndex) => (
            <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
              {colPosts.map((post) => {
                const theme =
                  THEMES.find((th) => th.id === post.cardTheme) || THEMES[0]!;
                return (
                  <div
                    key={post.id}
                    className={`w-full relative rounded-2xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden min-w-0 ${theme.bgGradient}`}
                  >
                    <div className="w-full min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${theme.tagColor}`}
                        >
                          {t.nav.anonymousSender}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeletePostId(post.id)}
                          className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-60 hover:opacity-100"
                          title={t.collab.anonymousRemoveTooltip}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-2 min-w-0">
                        <Quote className="h-4 w-4 opacity-30 shrink-0 mt-0.5" />
                        <p
                          className={`text-xs font-medium leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] min-w-0 flex-1 ${theme.textColor}`}
                        >
                          {post.content}
                        </p>
                      </div>
                    </div>

                    {/* Chân thiệp: Đẩy phần thả reaction xuống góc trái thay cho text "Điều muốn nói", góc phải là ngày giờ */}
                    <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {(post.reactions || []).map((rx) => (
                          <button
                            key={rx.emoji}
                            type="button"
                            onClick={() => handleToggleReaction(post.id, rx.emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              rx.userReacted
                                ? 'bg-circle-primary/15 dark:bg-circle-primary/25 border-circle-primary/40 text-circle-primary dark:text-circle-primary shadow-2xs scale-105'
                                : 'bg-white/80 dark:bg-circle-dark-surface/80 border-black/10 dark:border-white/10 text-circle-slate dark:text-circle-dark-muted hover:border-black/25 dark:hover:border-white/25'
                            }`}
                            title={locale === 'vi' ? `Biểu cảm ${rx.emoji}` : `React ${rx.emoji}`}
                          >
                            <Emoji emoji={rx.emoji} size={13} />
                            <span className="text-[10px] font-bold">{rx.count}</span>
                          </button>
                        ))}

                        {/* Nút phản hồi: Thay thế icon đã chọn vào vị trí trái tim, Hover ra floating quick reaction toolbar */}
                        <div className="relative group/react flex items-center">
                          {(() => {
                            const myReaction = post.reactions?.find((r) => r.userReacted);
                            return (
                              <button
                                type="button"
                                onClick={() => handleToggleReaction(post.id, myReaction ? myReaction.emoji : '❤️')}
                                className={`flex items-center justify-center h-6 w-6 rounded-full border transition-all cursor-pointer ${
                                  myReaction
                                    ? 'bg-circle-primary/15 dark:bg-circle-primary/25 border-circle-primary/50 text-circle-primary dark:text-circle-primary shadow-2xs scale-105'
                                    : 'bg-white/80 dark:bg-circle-dark-surface/80 border-black/10 dark:border-white/10 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 hover:border-rose-400/50 hover:scale-110 active:scale-95'
                                }`}
                                title={
                                  myReaction
                                    ? (locale === 'vi' ? `Đã thả ${myReaction.emoji} (Click để gỡ)` : `Reacted ${myReaction.emoji} (Click to remove)`)
                                    : (locale === 'vi' ? 'Thả tim (Click để thích, di chuột để chọn biểu cảm)' : 'Heart (Click to react, hover for more)')
                                }
                              >
                                {myReaction ? (
                                  <Emoji emoji={myReaction.emoji} size={14} />
                                ) : (
                                  <Heart className="h-3.5 w-3.5" />
                                )}
                              </button>
                            );
                          })()}

                          {/* Quick Emoji Toolbar khi hover (nổi trên nút tim) */}
                          <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/react:flex items-center gap-0.5 p-1 rounded-full border border-black/10 dark:border-white/10 bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md shadow-lg z-30 pointer-events-auto">
                            {PROMINENT_QUICK_EMOJIS.map((em) => {
                              const isSelected = post.reactions?.some((r) => r.emoji === em && r.userReacted);
                              return (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReaction(post.id, em);
                                  }}
                                  className={`flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-transform hover:scale-125 active:scale-95 cursor-pointer ${
                                    isSelected ? 'scale-110 bg-black/5 dark:bg-white/10' : ''
                                  }`}
                                  title={locale === 'vi' ? `Thả ${em}` : `React ${em}`}
                                >
                                  <Emoji emoji={em} size={15} />
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullEmojiTargetPostId(post.id);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-circle-charcoal dark:hover:text-white transition-colors cursor-pointer"
                              title={t.emoji.addOtherEmoji}
                            >
                              <Smile className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Góc phải: Thời gian đăng */}
                      <span className="text-[10px] opacity-70 font-medium tracking-tight shrink-0">
                        {formatPostDate(post.postedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40">
          <Heart className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
          <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
            {t.collab.notesEmptyTitle}
          </h4>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
            {t.collab.notesEmptyDesc}
          </p>
          <button
            type="button"
            onClick={() => setIsComposeModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 h-9 rounded-full bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{t.collab.createAnonymousNote}</span>
          </button>
        </div>
      )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.anonymousComposeTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsComposeModalOpen(false)}
                className="p-1 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Theme selector */}
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-2">
                  {t.collab.anonymousThemeLabel}
                </label>
                <div className="flex items-center gap-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition-all border cursor-pointer ${
                        selectedTheme === theme.id
                          ? 'border-circle-charcoal dark:border-white shadow-xs font-bold scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      } ${theme.bgGradient} ${theme.textColor}`}
                    >
                      {getThemeName(theme.id, t)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  {t.collab.anonymousContentLabel}
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.collab.anonymousContentExample}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas p-3 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
                <div className="text-right text-[10px] text-circle-slate dark:text-circle-dark-muted mt-1">
                  {t.collab.anonymousCharCount.replace('{count}', String(content.length))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-full px-4 h-9 text-xs sm:text-sm font-bold border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all active:scale-95 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !content.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-circle-primary hover:bg-circle-sage px-5 h-9 text-xs sm:text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{createMutation.isPending ? t.collab.anonymousSending : t.collab.anonymousComposeSubmit}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Comprehensive Emoji Picker Modal */}
      <FullEmojiPickerModal
        isOpen={Boolean(fullEmojiTargetPostId)}
        onClose={() => setFullEmojiTargetPostId(null)}
        onSelectEmoji={(emoji) => {
          if (fullEmojiTargetPostId) {
            handleToggleReaction(fullEmojiTargetPostId, emoji);
            setFullEmojiTargetPostId(null);
          }
        }}
      />

      {/* Unified Confirm Modal (Rule 9) */}
      <ConfirmModal
        isOpen={Boolean(deletePostId)}
        onClose={() => setDeletePostId(null)}
        onConfirm={async () => {
          if (deletePostId) {
            await deleteMutation.mutateAsync(deletePostId);
            setDeletePostId(null);
          }
        }}
        title={t.common.delete}
        description={locale === 'vi' ? 'Gỡ bỏ lời nhắn ẩn danh này khỏi vòng tròn?' : 'Remove this anonymous note from the circle?'}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
