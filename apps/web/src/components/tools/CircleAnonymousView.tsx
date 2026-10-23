'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import {
  useAnonymousPostsQuery,
  useCreateAnonymousPostMutation,
  useDeleteAnonymousPostMutation,
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

export const CircleAnonymousView: React.FC<CircleAnonymousViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);

  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');

  const { data: posts = [], isLoading } = useAnonymousPostsQuery(circleId);
  const createMutation = useCreateAnonymousPostMutation(circleId);
  const deleteMutation = useDeleteAnonymousPostMutation(circleId);

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
    <div className="flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-y-auto p-4 md:p-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline mb-6">
        <div>
          <h1 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
            {t.nav.reflectionMailbox}
          </h1>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
            Không gian gửi gắm tâm sự, lời cảm ơn và những điều khó nói một cách chân thành
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsComposeModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-3.5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-sm active:scale-98"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Gửi tâm sự ẩn danh</span>
        </button>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((post) => {
            const theme =
              THEMES.find((th) => th.id === post.cardTheme) || THEMES[0]!;
            return (
              <div
                key={post.id}
                className={`relative rounded-2xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${theme.bgGradient}`}
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

                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] opacity-70">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Điều muốn nói</span>
                  </div>
                  <span>
                    {new Date(post.postedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40">
          <Heart className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
          <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
            Hộp thư Điều muốn nói đang trống
          </h4>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
            Gửi gắm lời cảm ơn, động viên hoặc một lời chúc tốt lành ẩn danh đến các thành viên trong nhóm!
          </p>
          <button
            type="button"
            onClick={() => setIsComposeModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Viết lời tâm sự ngay</span>
          </button>
        </div>
      )}

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
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
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
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !content.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{createMutation.isPending ? 'Đang gửi...' : 'Gửi lời nhắn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
