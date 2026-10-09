'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  UserCheck,
  Search,
  Check,
  UserX,
  Loader2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { useFriendStore, FriendModalTab } from '../../stores/friend.store';
import {
  useFriendsQuery,
  useReceivedFriendRequestsQuery,
  useSentFriendRequestsQuery,
  useSearchFriendsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useUnfriendMutation,
} from '../../hooks/use-friend-queries';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const FriendsModal: React.FC = () => {
  const t = useLanguageStore((s) => s.t);
  const isOpen = useFriendStore((s) => s.isFriendsModalOpen);
  const activeTab = useFriendStore((s) => s.activeTab);
  const setOpen = useFriendStore((s) => s.setFriendsModalOpen);
  const setActiveTab = useFriendStore((s) => s.setActiveTab);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterFriendText, setFilterFriendText] = useState('');
  const [requestsSubTab, setRequestsSubTab] = useState<'received' | 'sent'>('received');

  // Queries
  const { data: friends = [], isLoading: isLoadingFriends } = useFriendsQuery();
  const { data: receivedRequests = [], isLoading: isLoadingReceived } = useReceivedFriendRequestsQuery();
  const { data: sentRequests = [], isLoading: isLoadingSent } = useSentFriendRequestsQuery();
  const { data: searchResults = [], isFetching: isSearching } = useSearchFriendsQuery(debouncedQuery);

  // Mutations
  const sendMutation = useSendFriendRequestMutation();
  const acceptMutation = useAcceptFriendRequestMutation();
  const rejectMutation = useRejectFriendRequestMutation();
  const cancelMutation = useCancelFriendRequestMutation();
  const unfriendMutation = useUnfriendMutation();

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery.trim());
  };

  const handleUnfriend = (friendId: string, name: string) => {
    const confirmMsg = t.friend.unfriendConfirm.replace('{name}', name);
    if (window.confirm(confirmMsg)) {
      unfriendMutation.mutate(friendId);
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!filterFriendText.trim()) return true;
    const term = filterFriendText.toLowerCase().trim();
    return (
      f.displayName.toLowerCase().includes(term) ||
      f.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-circle-hairline dark:border-circle-dark-hairline px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.friend.title}
              </h2>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.friend.friendsCount.replace('{count}', friends.length.toString())}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-circle-hairline dark:border-circle-dark-hairline px-6 pt-2 bg-circle-canvas/50 dark:bg-circle-dark-canvas/50">
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'friends'
                ? 'border-circle-sage dark:border-circle-primary text-circle-sage dark:text-circle-primary'
                : 'border-transparent text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>{t.friend.friendsTab.replace('{count}', friends.length.toString())}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'requests'
                ? 'border-circle-sage dark:border-circle-primary text-circle-sage dark:text-circle-primary'
                : 'border-transparent text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>{t.friend.requestsTab.replace('{count}', receivedRequests.length.toString())}</span>
            {receivedRequests.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-circle-coral px-1 text-[10px] font-bold text-white shadow-sm">
                {receivedRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'search'
                ? 'border-circle-sage dark:border-circle-primary text-circle-sage dark:text-circle-primary'
                : 'border-transparent text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>{t.friend.searchTab}</span>
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {friends.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
                <input
                  type="text"
                  value={filterFriendText}
                  onChange={(e) => setFilterFriendText(e.target.value)}
                  placeholder={t.friend.searchPlaceholder}
                  className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas py-2.5 pl-10 pr-4 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage dark:focus:border-circle-primary focus:outline-none transition-colors"
                />
              </div>
            )}

            {isLoadingFriends ? (
              <div className="flex flex-col items-center justify-center py-12 text-circle-slate dark:text-circle-dark-muted">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">{t.common.loading}</p>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted mb-3">
                  <Users className="h-8 w-8 opacity-60" />
                </div>
                <h3 className="text-base font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1">
                  {friends.length === 0 ? t.friend.noFriends : t.friend.noSearchResults}
                </h3>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted max-w-sm mb-4">
                  {friends.length === 0 ? t.friend.noFriendsHint : ''}
                </p>
                {friends.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className="inline-flex items-center gap-2 rounded-full bg-circle-sage px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-circle-sage/90 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{t.friend.searchTab}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:border-circle-sage/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.displayName}
                          className="h-10 w-10 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-bold text-sm shadow-inner">
                          {getInitials(friend.displayName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                          {friend.displayName}
                        </h4>
                        <p className="text-xs text-circle-slate dark:text-circle-dark-muted truncate">
                          {friend.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleUnfriend(friend.id, friend.displayName)}
                        disabled={unfriendMutation.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
                        title={t.friend.unfriend}
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Friend Requests */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Sub-tabs: Received vs Sent */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-circle-canvas dark:bg-circle-dark-canvas w-fit">
              <button
                type="button"
                onClick={() => setRequestsSubTab('received')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  requestsSubTab === 'received'
                    ? 'bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary shadow-sm'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span>
                  {t.friend.receivedRequestsTitle} ({receivedRequests.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestsSubTab('sent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  requestsSubTab === 'sent'
                    ? 'bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary shadow-sm'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>
                  {t.friend.sentRequestsTitle} ({sentRequests.length})
                </span>
              </button>
            </div>

            {/* Received requests */}
            {requestsSubTab === 'received' && (
              <>
                {isLoadingReceived ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
                  </div>
                ) : receivedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-circle-slate dark:text-circle-dark-muted">
                    <Clock className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">{t.friend.noRequests}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {receivedRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {req.avatarUrl ? (
                            <img
                              src={req.avatarUrl}
                              alt={req.displayName}
                              className="h-10 w-10 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-bold text-sm">
                              {getInitials(req.displayName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                              {req.displayName}
                            </h4>
                            <p className="text-xs text-circle-slate dark:text-circle-dark-muted truncate">
                              {req.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => acceptMutation.mutate(req.id)}
                            disabled={acceptMutation.isPending}
                            className="flex items-center gap-1.5 rounded-full bg-circle-sage px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-circle-sage/90 disabled:opacity-50 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{t.friend.accept}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => rejectMutation.mutate(req.id)}
                            disabled={rejectMutation.isPending}
                            className="flex items-center gap-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline px-3 py-1.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text disabled:opacity-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>{t.friend.reject}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Sent requests */}
            {requestsSubTab === 'sent' && (
              <>
                {isLoadingSent ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
                  </div>
                ) : sentRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-circle-slate dark:text-circle-dark-muted">
                    <Clock className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">{t.friend.noSentRequests}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sentRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {req.avatarUrl ? (
                            <img
                              src={req.avatarUrl}
                              alt={req.displayName}
                              className="h-10 w-10 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted font-bold text-sm">
                              {getInitials(req.displayName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                              {req.displayName}
                            </h4>
                            <p className="text-xs text-circle-slate dark:text-circle-dark-muted truncate">
                              {req.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(req.id)}
                            disabled={cancelMutation.isPending}
                            className="flex items-center gap-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>{t.friend.cancelRequest}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 3: Search & Add Friends */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.friend.searchPlaceholder}
                  className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas py-2.5 pl-10 pr-4 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage dark:focus:border-circle-primary focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="flex items-center gap-2 rounded-2xl bg-circle-sage px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-circle-sage/90 disabled:opacity-50 transition-colors shrink-0"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>{t.friend.searchAction}</span>
              </button>
            </form>

            {/* Results */}
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-circle-slate dark:text-circle-dark-muted">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">{t.friend.searching}</p>
              </div>
            ) : debouncedQuery && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-circle-slate dark:text-circle-dark-muted">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">{t.friend.noSearchResults}</p>
              </div>
            ) : !debouncedQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-circle-slate dark:text-circle-dark-muted">
                <UserPlus className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs max-w-sm">{t.friend.searchPrompt}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="h-10 w-10 rounded-full object-cover border border-circle-hairline dark:border-circle-dark-hairline"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-bold text-sm">
                          {getInitials(user.displayName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                          {user.displayName}
                        </h4>
                        <p className="text-xs text-circle-slate dark:text-circle-dark-muted truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {user.relationship === 'FRIEND' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-circle-wash dark:bg-circle-dark-wash px-3 py-1.5 text-xs font-semibold text-circle-sage dark:text-circle-primary">
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.friend.alreadyFriends}</span>
                        </span>
                      )}

                      {user.relationship === 'PENDING_SENT' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline px-3 py-1.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{t.friend.requestSent}</span>
                        </span>
                      )}

                      {user.relationship === 'PENDING_RECEIVED' && user.friendshipId && (
                        <button
                          type="button"
                          onClick={() => acceptMutation.mutate(user.friendshipId!)}
                          disabled={acceptMutation.isPending}
                          className="flex items-center gap-1.5 rounded-full bg-circle-sage px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-circle-sage/90 disabled:opacity-50 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.friend.accept}</span>
                        </button>
                      )}

                      {user.relationship === 'NONE' && (
                        <button
                          type="button"
                          onClick={() => sendMutation.mutate(user.id)}
                          disabled={sendMutation.isPending}
                          className="flex items-center gap-1.5 rounded-full bg-circle-primary px-3.5 py-1.5 text-xs font-semibold text-circle-charcoal shadow-sm hover:bg-circle-primary/90 disabled:opacity-50 transition-colors"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>{t.friend.addFriend}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
