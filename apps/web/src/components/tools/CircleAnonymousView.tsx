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
  AlertCircle,
} from 'lucide-react';
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

export const CircleAnonymousView: React.FC<CircleAnonymousViewProps> = ({ circleId }) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');

  const [postError, setPostError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useAnonymousPostsQuery(circleId);
  const createMutation = useCreateAnonymousPostMutation(circleId);
  const deleteMutation = useDeleteAnonymousPostMutation(circleId);

  const themes: ThemeConfig[] = useMemo(
    () => [
      {
        id: 'sunset',
        name: t.collab.anonymousThemeSunset,
        bgGradient:
          'bg-gradient-to-br from-amber-100 via-rose-100 to-orange-100 dark:from-amber-950/50 dark:via-rose-950/50 dark:to-orange-950/50 border-amber-200/80 dark:border-amber-800/40',
        textColor: 'text-amber-950 dark:text-amber-100',
        tagColor: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
      },
      {
        id: 'ocean',
        name: t.collab.anonymousThemeOcean,
        bgGradient:
          'bg-gradient-to-br from-sky-100 via-cyan-100 to-blue-100 dark:from-sky-950/50 dark:via-cyan-950/50 dark:to-blue-950/50 border-sky-200/80 dark:border-sky-800/40',
        textColor: 'text-sky-950 dark:text-sky-100',
        tagColor: 'bg-sky-500/20 text-sky-800 dark:text-sky-300',
      },
      {
        id: 'lavender',
        name: t.collab.anonymousThemeLavender,
        bgGradient:
          'bg-gradient-to-br from-purple-100 via-fuchsia-100 to-indigo-100 dark:from-purple-950/50 dark:via-fuchsia-950/50 dark:to-indigo-950/50 border-purple-200/80 dark:border-purple-800/40',
        textColor: 'text-purple-950 dark:text-purple-100',
        tagColor: 'bg-purple-500/20 text-purple-800 dark:text-purple-300',
      },
      {
        id: 'rose',
        name: t.collab.anonymousThemeRose,
        bgGradient:
          'bg-gradient-to-br from-pink-100 via-rose-100 to-red-100 dark:from-pink-950/50 dark:via-rose-950/50 dark:to-red-950/50 border-pink-200/80 dark:border-pink-800/40',
        textColor: 'text-pink-950 dark:text-pink-100',
        tagColor: 'bg-pink-500/20 text-pink-800 dark:text-pink-300',
      },
      {
        id: 'mint',
        name: t.collab.anonymousThemeMint,
        bgGradient:
          'bg-gradient-to-br from-emerald-100 via-teal-100 to-green-100 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-green-950/50 border-emerald-200/80 dark:border-emerald-800/40',
        textColor: 'text-emerald-950 dark:text-emerald-100',
        tagColor: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300',
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!isComposeModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsComposeModalOpen(false);
        setCreateError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComposeModalOpen]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setCreateError(t.collab.enterNoteContentError);
      return;
    }

    setCreateError(null);
    try {
      await createMutation.mutateAsync({
        content: content.trim(),
        cardTheme: selectedTheme,
      });

      setContent('');
      setIsComposeModalOpen(false);
    } catch (err: any) {
      setCreateError(err?.message || t.collab.sendNoteError);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPostError(null);
    try {
      await deleteMutation.mutateAsync(postId);
      setConfirmDeletePostId(null);
    } catch (err: any) {
      setPostError(err?.message || t.collab.deleteNoteError);
      setConfirmDeletePostId(null);
    }
  };

  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
      {/* Floating Glass Toolbar */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4">
        <div className="pointer-events-auto flex items-center justify-between gap-2 px-5 py-2.5 rounded-full glass shadow-sm max-w-4xl w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <Heart className="h-4 w-4 text-rose-500 shrink-0" />
            <h1 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
              {t.nav.reflectionMailbox}
            </h1>
            {posts.length > 0 && (
              <span className="text-xs text-circle-slate dark:text-circle-dark-muted hidden sm:inline shrink-0">
                • {t.collab.anonymousCountLabel.replace('{count}', String(posts.length))}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setIsComposeModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-circle-primary hover:bg-circle-sage px-4 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white transition-all shadow-xs active:scale-98 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.collab.createAnonymousNote}</span>
          </button>
        </div>

        {postError && (
          <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-rose-700 dark:text-rose-400 max-w-4xl w-full backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{postError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPostError(null)}
              className="p-0.5 rounded-full hover:bg-rose-500/20"
              title={t.common.dismiss}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Scroll-under Content Layer */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Security / Anonymity Banner */}
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 dark:bg-emerald-500/12 p-3.5">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
              <span className="font-bold">{t.collab.anonymousSecurityTitle}</span>{' '}
              {t.collab.anonymousPrivacyNotice}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {posts.map((post) => {
                const theme = themes.find((th) => th.id === post.cardTheme) || themes[0]!;
                const isConfirmingDelete = confirmDeletePostId === post.id;
                return (
                  <div
                    key={post.id}
                    className={`relative rounded-2xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${theme.bgGradient}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${theme.tagColor}`}
                        >
                          {t.nav.anonymousSender}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDeletePostId((prev) => (prev === post.id ? null : post.id))
                          }
                          className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-colors opacity-70 hover:opacity-100"
                          title={t.collab.anonymousRemoveTooltip}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {isConfirmingDelete && (
                        <div className="mb-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-white/85 dark:bg-circle-dark-surface/90 border border-rose-500/30">
                          <span className="text-[11px] font-semibold text-circle-charcoal dark:text-circle-dark-text">
                            {t.collab.deleteNoteConfirm}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePostId(null)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash"
                            >
                              {t.common.cancel}
                            </button>
                            <button
                              type="button"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDeletePost(post.id)}
                              className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-[10px] font-semibold text-white disabled:opacity-50"
                            >
                              {deleteMutation.isPending ? '...' : t.common.delete}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Quote className={`h-4 w-4 opacity-40 shrink-0 mt-0.5 ${theme.textColor}`} />
                        <p
                          className={`text-xs font-medium leading-relaxed whitespace-pre-wrap ${theme.textColor}`}
                        >
                          {post.content}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] opacity-75 ${theme.textColor}`}
                    >
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>{t.collab.anonymousCardTag}</span>
                      </div>
                      <span>
                        {new Date(post.postedAt).toLocaleDateString(dateLocale, {
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
                {t.collab.notesEmptyTitle}
              </h4>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
                {t.collab.notesEmptyDesc}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setIsComposeModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-dark-canvas hover:bg-circle-sage hover:text-white dark:hover:text-white transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.collab.createAnonymousNote}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsComposeModalOpen(false);
              setCreateError(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl glass-sheet p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.anonymousComposeTitle}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsComposeModalOpen(false);
                  setCreateError(null);
                }}
                className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text"
                title={t.common.close}
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
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all border truncate ${
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
                  {t.collab.anonymousContentLabel}
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.collab.anonymousContentExample}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas p-3 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-sage"
                />
                <div className="text-right text-[10px] text-circle-slate dark:text-circle-dark-muted mt-1">
                  {t.collab.anonymousCharCount.replace('{count}', String(content.length))}
                </div>
              </div>

              {createError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsComposeModalOpen(false);
                    setCreateError(null);
                  }}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !content.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-dark-canvas hover:bg-circle-sage hover:text-white dark:hover:text-white transition-all disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {createMutation.isPending
                      ? t.collab.anonymousSending
                      : t.collab.anonymousComposeSubmit}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
