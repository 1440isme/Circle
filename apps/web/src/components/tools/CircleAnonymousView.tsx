'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Plus,
  Trash2,
  X,
  ShieldCheck,
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

const THEMES: ThemeConfig[] = [
  {
    id: 'sunset',
    name: 'Hoàng hôn',
    bgGradient:
      'bg-gradient-to-br from-amber-100 via-rose-100 to-orange-100 dark:from-amber-950/40 dark:via-rose-950/40 dark:to-orange-950/40 border-amber-200/80 dark:border-amber-800/40',
    textColor: 'text-amber-950 dark:text-amber-100',
    tagColor: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
  },
  {
    id: 'ocean',
    name: 'Đại dương',
    bgGradient:
      'bg-gradient-to-br from-sky-100 via-cyan-100 to-blue-100 dark:from-sky-950/40 dark:via-cyan-950/40 dark:to-blue-950/40 border-sky-200/80 dark:border-sky-800/40',
    textColor: 'text-sky-950 dark:text-sky-100',
    tagColor: 'bg-sky-500/20 text-sky-800 dark:text-sky-300',
  },
  {
    id: 'lavender',
    name: 'Oải hương',
    bgGradient:
      'bg-gradient-to-br from-purple-100 via-fuchsia-100 to-indigo-100 dark:from-purple-950/40 dark:via-fuchsia-950/40 dark:to-indigo-950/40 border-purple-200/80 dark:border-purple-800/40',
    textColor: 'text-purple-950 dark:text-purple-100',
    tagColor: 'bg-purple-500/20 text-purple-800 dark:text-purple-300',
  },
  {
    id: 'rose',
    name: 'Hoa hồng',
    bgGradient:
      'bg-gradient-to-br from-pink-100 via-rose-100 to-red-100 dark:from-pink-950/40 dark:via-rose-950/40 dark:to-red-950/40 border-pink-200/80 dark:border-pink-800/40',
    textColor: 'text-pink-950 dark:text-pink-100',
    tagColor: 'bg-pink-500/20 text-pink-800 dark:text-pink-300',
  },
  {
    id: 'mint',
    name: 'Bạc hà',
    bgGradient:
      'bg-gradient-to-br from-emerald-100 via-teal-100 to-green-100 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-green-950/40 border-emerald-200/80 dark:border-emerald-800/40',
    textColor: 'text-emerald-950 dark:text-emerald-100',
    tagColor: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300',
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
  // Base chrome: card padding + sender tag + reaction bar + footer ~ 130px
  const baseHeight = 130;
  // Estimated ~42 chars per line in a 3-column layout ~ 20px per line
  const lines = Math.max(1, Math.ceil(content.length / 42));
  const textHeight = lines * 20;
  // Extra reaction wrap
  const extraReactions = reactionCount > 3 ? 28 : 0;
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
      } else {
        setColumns(3);
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
  const t = useLanguageStore((s) => s.t);

  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');
  const [fullEmojiTargetPostId, setFullEmojiTargetPostId] = useState<string | null>(null);

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

  const handleDeletePost = async (postId: string) => {
    if (confirm('Gỡ bỏ lời nhắn ẩn danh này khỏi vòng tròn?')) {
      await deleteMutation.mutateAsync(postId);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
      {/* Floating Pill Controls Bar (Không text heading, controls dạng Floating Pill Button) */}
      <div className="pointer-events-none absolute top-3 left-0 right-0 z-20 flex items-center justify-between px-4 md:px-6">
        <div className="pointer-events-auto flex items-center gap-2">
          {posts.length > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-xs text-xs font-semibold text-circle-slate dark:text-circle-dark-muted select-none">
              <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span>{posts.length} lời nhắn</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsComposeModalOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Gửi tâm sự ẩn danh</span>
        </button>
      </div>

      {/* Scroll-under Content Layer */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-16 pb-12">

      {/* Security / Anonymity Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
          <span className="font-bold">Bảo Mật Danh Tính Tuyệt Đối:</span> Lời nhắn của bạn được hệ
          thống bóc tách hoàn toàn và không lưu bất kỳ thông tin nhận dạng nào ở cơ sở dữ liệu. Cả
          thành viên và Trưởng nhóm đều không biết ai là người gửi.
        </div>
      </div>

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
                    className={`w-full relative rounded-2xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${theme.bgGradient}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${theme.tagColor}`}
                        >
                          {t.nav.anonymousSender}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 text-circle-slate hover:text-red-500 transition-colors opacity-60 hover:opacity-100"
                          title="Gỡ lời nhắn (Chủ vòng tròn)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <Quote className="h-4 w-4 opacity-30 shrink-0 mt-0.5" />
                        <p
                          className={`text-xs font-medium leading-relaxed whitespace-pre-wrap ${theme.textColor}`}
                        >
                          {post.content}
                        </p>
                      </div>
                    </div>

                    {/* Reactions Bar (Chat-style Floating Pill Reactions & Apple Color Emojis) */}
                    <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(post.reactions || []).map((rx) => (
                          <button
                            key={rx.emoji}
                            type="button"
                            onClick={() => reactMutation.mutate({ postId: post.id, emoji: rx.emoji })}
                            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              rx.userReacted
                                ? 'bg-circle-primary/15 dark:bg-circle-primary/25 border-circle-primary/40 text-circle-primary dark:text-circle-primary shadow-2xs scale-105'
                                : 'bg-white/80 dark:bg-circle-dark-surface/80 border-black/10 dark:border-white/10 text-circle-slate dark:text-circle-dark-muted hover:border-black/25 dark:hover:border-white/25'
                            }`}
                          >
                            <Emoji emoji={rx.emoji} size={14} />
                            <span className="text-[10px] font-bold">{rx.count}</span>
                          </button>
                        ))}

                        {/* Quick emoji reaction pickers (Chat-like Floating Pill Toolbar) */}
                        <div className="flex items-center gap-0.5 p-0.5 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-circle-dark-surface/70 backdrop-blur-xs">
                          {PROMINENT_QUICK_EMOJIS.map((em) => {
                            const isAlreadyReacted = post.reactions?.some((r) => r.emoji === em && r.userReacted);
                            return (
                              <button
                                key={em}
                                type="button"
                                onClick={() => reactMutation.mutate({ postId: post.id, emoji: em })}
                                className={`flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-transform hover:scale-125 active:scale-95 cursor-pointer ${
                                  isAlreadyReacted ? 'opacity-40' : 'opacity-85 hover:opacity-100'
                                }`}
                                title={`Thả ${em}`}
                              >
                                <Emoji emoji={em} size={15} />
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setFullEmojiTargetPostId(post.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-circle-charcoal dark:hover:text-white transition-colors cursor-pointer"
                            title="Thêm biểu cảm khác"
                          >
                            <Smile className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] opacity-70">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Điều muốn nói</span>
                      </div>
                      <span className="font-medium tracking-tight">
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
            Hộp thư đang trống
          </h4>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
            Gửi gắm lời cảm ơn, động viên hoặc một lời chúc tốt lành ẩn danh đến các thành viên trong nhóm!
          </p>
          <button
            type="button"
            onClick={() => setIsComposeModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-circle-primary hover:bg-circle-sage px-5 py-2 text-xs font-bold text-white transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Viết lời tâm sự ngay</span>
          </button>
        </div>
      )}
      </div>

      {/* Compose Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Gửi Lời Nhắn Ẩn Danh Đến Vòng Tròn
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
                  Chọn màu thiệp trang trí
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
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  Nội dung tâm sự *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết điều bạn muốn chia sẻ một cách chân thành..."
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas p-3 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
                <div className="text-right text-[10px] text-circle-slate dark:text-circle-dark-muted mt-1">
                  {content.length}/1000 ký tự
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !content.trim()}
                  className="flex items-center gap-1.5 rounded-full bg-circle-primary hover:bg-circle-sage px-5 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{createMutation.isPending ? 'Đang gửi...' : 'Gửi lời nhắn'}</span>
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
            reactMutation.mutate({ postId: fullEmojiTargetPostId, emoji });
            setFullEmojiTargetPostId(null);
          }
        }}
      />
    </div>
  );
};
