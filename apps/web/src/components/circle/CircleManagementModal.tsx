'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Users,
  ShieldCheck,
  UserX,
  LogOut,
  Crown,
  Copy,
  Check,
  AlertTriangle,
  Image,
  Lock,
  Globe,
  Save,
  Link,
  Share2,
  Pencil,
  Sliders,
  UserPlus,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Flag,
  HelpCircle,
  Search,
  CheckSquare,
  Square,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import {
  useCircleMembersQuery,
  useCircleJoinRequestsQuery,
  useUpdateCircleMutation,
  useRemoveMemberMutation,
  useLeaveCircleMutation,
  useTransferOwnershipMutation,
  useReviewJoinRequestMutation,
  useUpdateMemberNicknameMutation,
  useAddCircleMembersMutation,
  useSelectableFriendsQuery,
} from '@/hooks/use-circle-queries';
import { MemberRole } from '@circle/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type TabType = 'chatInfo' | 'members' | 'privacySupport' | 'circleSettings';

export const CircleManagementModal: React.FC = () => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const isManageModalOpen = useCircleStore((s) => s.isManageModalOpen);
  const manageActiveTab = useCircleStore((s) => s.manageActiveTab);
  const setManageModalOpen = useCircleStore((s) => s.setManageModalOpen);

  // Normalize initial tab
  const getInitialTab = (): TabType => {
    if (manageActiveTab === 'members') return 'members';
    if (manageActiveTab === 'privacySupport') return 'privacySupport';
    if (
      manageActiveTab === 'circleSettings' ||
      manageActiveTab === 'settings' ||
      manageActiveTab === 'invites' ||
      manageActiveTab === 'requests'
    ) {
      return 'circleSettings';
    }
    return 'chatInfo';
  };

  const [activeTab, setActiveTab] = useState<TabType>('chatInfo');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [sharedDone, setSharedDone] = useState<boolean>(false);
  const [confirmKickMemberId, setConfirmKickMemberId] = useState<string | null>(null);
  const [confirmTransferMemberId, setConfirmTransferMemberId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Nickname Editing State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState<string>('');

  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // Personal Privacy & Support State
  const [readReceipts, setReadReceipts] = useState<boolean>(true);
  const [notificationMute, setNotificationMute] = useState<string>('all');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [customReportText, setCustomReportText] = useState('');
  const [reportFieldError, setReportFieldError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Group Settings Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formCover, setFormCover] = useState('');
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formMaxMembers, setFormMaxMembers] = useState<number | null>(null);

  // Sync tab & form values when opened or activeCircle changes
  useEffect(() => {
    if (isManageModalOpen && activeCircle) {
      setActiveTab(getInitialTab());
      setErrorMessage(null);
      setSuccessMessage(null);
      setEditingMemberId(null);
      setIsAddMemberOpen(false);
      setSelectedFriendIds([]);
      setFriendSearch('');
      setIsReportOpen(false);
      setCustomReportText('');
      setReportFieldError(null);
      setIsHelpOpen(false);
      setFormName(activeCircle.name || '');
      setFormDesc(activeCircle.description || '');
      setFormAvatar(activeCircle.avatarUrl || '');
      setFormCover(activeCircle.coverUrl || '');
      setFormIsPrivate(Boolean(activeCircle.isPrivate));
      setFormMaxMembers(activeCircle.maxMembers ?? null);

      // Load personal preference from local storage if available
      try {
        const storedReceipts = localStorage.getItem(`circle_${activeCircle.id}_read_receipts`);
        if (storedReceipts !== null) setReadReceipts(storedReceipts === 'true');
        const storedMute = localStorage.getItem(`circle_${activeCircle.id}_notification_mute`);
        if (storedMute) setNotificationMute(storedMute);
      } catch {
        // Ignore localStorage error
      }
    }
  }, [isManageModalOpen, manageActiveTab, activeCircle]);

  const circleId = activeCircle?.id || '';

  const { data: members = [], isLoading: isLoadingMembers } = useCircleMembersQuery(circleId);
  const { data: selectableFriends = [], isLoading: isLoadingFriends } = useSelectableFriendsQuery();

  // Check caller role in active circle (2-role hierarchy: OWNER and MEMBER)
  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === MemberRole.OWNER;

  const { data: joinRequests = [] } = useCircleJoinRequestsQuery(circleId, isOwner);

  // Filter friends who are NOT already in the circle
  const availableFriends = selectableFriends.filter(
    (f) => !members.some((m) => m.userId === f.id)
  );

  const filteredFriends = availableFriends.filter((f) => {
    const term = friendSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      f.displayName.toLowerCase().includes(term) ||
      f.email.toLowerCase().includes(term)
    );
  });

  // Active Invite Code & Link
  const currentInviteCode = activeCircle?.inviteCode || '';
  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${currentInviteCode}`
      : `https://circle.app/join?code=${currentInviteCode}`;

  const updateCircleMutation = useUpdateCircleMutation(circleId);
  const removeMemberMutation = useRemoveMemberMutation(circleId);
  const leaveMutation = useLeaveCircleMutation(circleId);
  const transferOwnershipMutation = useTransferOwnershipMutation(circleId);
  const reviewRequestMutation = useReviewJoinRequestMutation(circleId);
  const updateNicknameMutation = useUpdateMemberNicknameMutation(circleId);
  const addMembersMutation = useAddCircleMembersMutation(circleId);

  const kickingMember = members.find((m) => m.id === confirmKickMemberId);
  const transferringMember = members.find((m) => m.id === confirmTransferMemberId);

  if (!isManageModalOpen || !activeCircle) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `CIRCLE - ${activeCircle.name}`,
          text: t.circle.sharedContentText.replace('{name}', activeCircle.name),
          url: inviteLink,
        });
        setSharedDone(true);
        setTimeout(() => setSharedDone(false), 2000);
        return;
      } catch {
        // User cancelled native share dialog, fallback to copy link
      }
    }
    handleCopyLink();
  };

  // Tab 1: Save Chat Information (Name, Avatar, Cover, Description) — NO privacy or max members!
  const handleSaveChatInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setErrorMessage(t.validation.circleNameMinLength);
      return;
    }

    try {
      await updateCircleMutation.mutateAsync({
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        avatarUrl: formAvatar.trim() || undefined,
        coverUrl: formCover.trim() || undefined,
      });
      setSuccessMessage(t.circle.savedSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  // Tab 4: Save Circle-Level Settings (isPrivate, maxMembers)
  const handleSaveCircleSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateCircleMutation.mutateAsync({
        isPrivate: formIsPrivate,
        maxMembers: formMaxMembers,
      });
      setSuccessMessage(t.circle.savedCircleSettingsSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  // Tab 2: Nickname handling
  const handleStartEditNickname = (memberId: string, currentNickname?: string | null) => {
    setEditingMemberId(memberId);
    setNicknameInput(currentNickname || '');
  };

  const handleSaveNickname = async (memberId: string) => {
    setErrorMessage(null);
    try {
      await updateNicknameMutation.mutateAsync({
        memberId,
        nickname: nicknameInput.trim() || null,
      });
      setEditingMemberId(null);
      setSuccessMessage(t.circle.nicknameUpdated);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  // Tab 2: Add Members Flow
  const handleToggleSelectFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSelectAllFriends = () => {
    if (selectedFriendIds.length === filteredFriends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(filteredFriends.map((f) => f.id));
    }
  };

  const handleConfirmAddMembers = async () => {
    if (selectedFriendIds.length === 0) return;
    setErrorMessage(null);
    try {
      await addMembersMutation.mutateAsync(selectedFriendIds);
      setSelectedFriendIds([]);
      setIsAddMemberOpen(false);
      setSuccessMessage(t.circle.addMembersSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  const handleKickMember = async (memberId: string) => {
    setErrorMessage(null);
    try {
      await removeMemberMutation.mutateAsync(memberId);
      setConfirmKickMemberId(null);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  const handleLeaveCircle = async () => {
    setErrorMessage(null);
    try {
      await leaveMutation.mutateAsync();
      setConfirmLeave(false);
      setManageModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  const handleTransferOwnership = async (newOwnerMemberId: string) => {
    setErrorMessage(null);
    try {
      await transferOwnershipMutation.mutateAsync(newOwnerMemberId);
      setConfirmTransferMemberId(null);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  const handleReviewRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setErrorMessage(null);
    try {
      await reviewRequestMutation.mutateAsync({ requestId, status });
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  // Tab 3: Personal Settings Handlers
  const handleToggleReadReceipts = () => {
    const next = !readReceipts;
    setReadReceipts(next);
    try {
      localStorage.setItem(`circle_${activeCircle.id}_read_receipts`, String(next));
    } catch {
      // Ignore
    }
    setSuccessMessage(t.circle.savedSuccess);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleChangeNotificationMute = (value: string) => {
    setNotificationMute(value);
    try {
      localStorage.setItem(`circle_${activeCircle.id}_notification_mute`, value);
    } catch {
      // Ignore
    }
    setSuccessMessage(t.circle.savedSuccess);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportFieldError(null);
    if (reportReason === 'other' && !customReportText.trim()) {
      setReportFieldError(t.circle.reportReasonOtherRequired);
      return;
    }
    setIsReportOpen(false);
    setCustomReportText('');
    setSuccessMessage(t.circle.reportSubmittedSuccess);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-circle-charcoal/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Khung cố định (Fixed Dimensions Window) */}
      <div className="relative w-full max-w-4xl h-[640px] max-h-[92vh] bg-white dark:bg-circle-dark-surface rounded-3xl shadow-circle-card border border-circle-hairline dark:border-circle-dark-hairline flex flex-col md:flex-row overflow-hidden">
        
        {/* =========================================================================
            CỘT TRÁI CỐ ĐỊNH (FIXED LEFT NAVIGATION FRAME)
            Giữ nguyên vị trí cố định khi chuyển qua các tab khác
           ========================================================================= */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-5">
          <div className="space-y-5">
            {/* Circle Identity Card */}
            <div className="flex items-center gap-3 pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-circle-primary/10 text-circle-charcoal dark:text-circle-primary font-bold text-sm uppercase overflow-hidden shadow-sm">
                {formAvatar ? (
                  <img src={formAvatar} alt={activeCircle.name} className="h-full w-full object-cover" />
                ) : (
                  activeCircle.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                  {activeCircle.name}
                </h3>
                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-mono truncate">
                  @{activeCircle.handle}
                </p>
              </div>
            </div>

            {/* Navigation Tabs (Fixed Rail - 4 distinct tabs) */}
            <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
              {/* Tab 1: Thông tin đoạn chat */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('chatInfo');
                  setIsAddMemberOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 md:w-full text-left ${
                  activeTab === 'chatInfo'
                    ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.circle.chatInfoTab}</span>
              </button>

              {/* Tab 2: Thành viên */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('members');
                  setIsAddMemberOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 md:w-full text-left ${
                  activeTab === 'members'
                    ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.circle.settingsTabMembers}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    activeTab === 'members'
                      ? 'bg-circle-charcoal text-white'
                      : 'bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate'
                  }`}
                >
                  {members.length}
                </span>
              </button>

              {/* Tab 3: Quyền riêng tư & Hỗ trợ (Dành cho cá nhân) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('privacySupport');
                  setIsAddMemberOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 md:w-full text-left ${
                  activeTab === 'privacySupport'
                    ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.circle.privacyAndSupportTab}</span>
              </button>

              {/* Tab 4: Thiết lập Vòng tròn (Dành cho nhóm) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('circleSettings');
                  setIsAddMemberOpen(false);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 md:w-full text-left ${
                  activeTab === 'circleSettings'
                    ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Sliders className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.circle.circleSettingsTab}</span>
                </div>
                {joinRequests.length > 0 && isOwner && (
                  <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-red-500 text-white font-bold animate-pulse">
                    {joinRequests.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </aside>

        {/* =========================================================================
            KHUNG NỘI DUNG BÊN PHẢI (RIGHT CONTENT PANE)
            Chuyển đổi mượt mà giữa các tab mà không làm thay đổi kích thước khung cố định
           ========================================================================= */}
        <main className="flex-1 h-full flex flex-col overflow-hidden bg-white dark:bg-circle-dark-surface">
          {/* Header Bar with Tab Title & Close Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 backdrop-blur-sm">
            <div>
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {activeTab === 'chatInfo' && t.circle.chatInfoTitle}
                {activeTab === 'members' && t.circle.settingsTabMembers}
                {activeTab === 'privacySupport' && t.circle.privacyAndSupportTitle}
                {activeTab === 'circleSettings' && t.circle.circleSettingsTab}
              </h3>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {activeTab === 'chatInfo' && t.circle.chatInfoSubtitle}
                {activeTab === 'members' && `${members.length} ${t.circle.settingsTabMembers.toLowerCase()}`}
                {activeTab === 'privacySupport' && t.circle.personalPrivacyTitle}
                {activeTab === 'circleSettings' && t.circle.circleSettingsSubtitle}
              </p>
            </div>
            <button
              onClick={() => setManageModalOpen(false)}
              className="p-2 rounded-full text-circle-slate hover:text-circle-charcoal dark:text-circle-dark-muted dark:hover:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* =========================================================================
                TAB 1: THÔNG TIN ĐOẠN CHAT (CHAT INFORMATION)
                Đã loại bỏ hoàn toàn chế độ và số lượng thành viên ra khỏi tab này!
               ========================================================================= */}
            {activeTab === 'chatInfo' && (
              <form onSubmit={handleSaveChatInfo} className="space-y-5">
                {/* Circle Name */}
                <div>
                  <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                    {t.circle.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={!isOwner}
                    placeholder={t.circle.namePlaceholder}
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary disabled:opacity-60"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5 flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.avatarUrlLabel}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-circle-canvas dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline overflow-hidden">
                      {formAvatar ? (
                        <img src={formAvatar} alt="Avatar Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-circle-slate dark:text-circle-dark-muted">
                          {formName ? formName.slice(0, 2).toUpperCase() : 'AV'}
                        </span>
                      )}
                    </div>
                    <input
                      type="url"
                      value={formAvatar}
                      onChange={(e) => setFormAvatar(e.target.value)}
                      disabled={!isOwner}
                      placeholder={t.circle.avatarUrlPlaceholder}
                      className="flex-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Cover URL */}
                <div>
                  <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5 flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.coverUrlLabel}</span>
                  </label>
                  <input
                    type="url"
                    value={formCover}
                    onChange={(e) => setFormCover(e.target.value)}
                    disabled={!isOwner}
                    placeholder={t.circle.coverUrlPlaceholder}
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary disabled:opacity-60"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                    {t.circle.descLabel}
                  </label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    disabled={!isOwner}
                    rows={3}
                    placeholder={t.circle.descPlaceholder}
                    className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary disabled:opacity-60 resize-none"
                  />
                </div>

                {/* Submit Button (Owner only) */}
                {isOwner && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={updateCircleMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal py-3 px-4 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{updateCircleMutation.isPending ? t.circle.savingChanges : t.circle.saveChanges}</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* =========================================================================
                TAB 2: THÀNH VIÊN (MEMBERS & NICKNAMES)
                Có nút "Thêm thành viên" và nút đặt biệt danh (cây bút bên cạnh tên)
               ========================================================================= */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Members Action Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
                  <div className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {members.length} {t.circle.settingsTabMembers.toLowerCase()}
                  </div>

                  {/* Nút Thêm thành viên */}
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal text-xs font-bold transition-all shadow-sm"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{t.circle.addMemberBtn}</span>
                  </button>
                </div>

                {/* Sub-panel: Thêm bạn bè vào Vòng tròn */}
                {isAddMemberOpen && (
                  <div className="p-4 rounded-2xl border border-circle-primary/30 bg-circle-primary/5 dark:bg-circle-primary/10 space-y-3.5 animate-fade-in shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                          <UserPlus className="h-3.5 w-3.5 text-circle-primary" />
                          <span>{t.circle.addMembersTitle}</span>
                        </h4>
                        <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                          {t.circle.addMembersSubtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddMemberOpen(false)}
                        className="p-1 rounded-lg text-circle-slate hover:text-circle-charcoal hover:bg-white dark:hover:bg-circle-dark-surface"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Friend Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-circle-slate" />
                      <input
                        type="text"
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        placeholder="Tìm bạn bè theo tên hoặc email..."
                        className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface pl-8 pr-3 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary"
                      />
                    </div>

                    {/* Selectable Friends List */}
                    {isLoadingFriends ? (
                      <div className="p-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                        {t.circle.loadingFriends}
                      </div>
                    ) : filteredFriends.length === 0 ? (
                      <div className="p-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                        {t.circle.noSelectableFriends}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        <div className="flex justify-end pb-1">
                          <button
                            type="button"
                            onClick={handleSelectAllFriends}
                            className="text-[11px] font-semibold text-circle-primary hover:underline"
                          >
                            {selectedFriendIds.length === filteredFriends.length
                              ? t.common.cancel
                              : 'Chọn tất cả'}
                          </button>
                        </div>
                        {filteredFriends.map((f) => {
                          const isSelected = selectedFriendIds.includes(f.id);
                          const initials = getInitials(f.displayName);
                          return (
                            <div
                              key={f.id}
                              onClick={() => handleToggleSelectFriend(f.id)}
                              className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-circle-primary bg-circle-primary/10'
                                  : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-canvas/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-charcoal text-white text-xs font-bold overflow-hidden">
                                  {f.avatarUrl ? (
                                    <img src={f.avatarUrl} alt={f.displayName} className="h-full w-full object-cover" />
                                  ) : (
                                    initials
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                                    {f.displayName}
                                  </p>
                                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">
                                    {f.email}
                                  </p>
                                </div>
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
                    )}

                    {/* Submit Add Members Button */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddMemberOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline text-xs font-semibold text-circle-slate hover:bg-white dark:hover:bg-circle-dark-surface"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={selectedFriendIds.length === 0 || addMembersMutation.isPending}
                        onClick={handleConfirmAddMembers}
                        className="px-4 py-1.5 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                      >
                        {addMembersMutation.isPending
                          ? t.common.loading
                          : `${t.circle.addMembersSubmit} (${selectedFriendIds.length})`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Member Roster List */}
                {isLoadingMembers ? (
                  <div className="p-8 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                    {t.circle.loadingFriends}
                  </div>
                ) : (
                  <div className="divide-y divide-circle-hairline dark:divide-circle-dark-hairline">
                    {members.map((m) => {
                      const isSelf = m.userId === user?.id;
                      const realDisplayName = m.user?.profile?.displayName || m.user?.email?.split('@')[0] || t.auth.member;
                      const hasNickname = Boolean(m.nickname && m.nickname.trim().length > 0);
                      const displayTitle = hasNickname ? m.nickname : realDisplayName;
                      const initials = getInitials(displayTitle || realDisplayName);
                      const isEditingThis = editingMemberId === m.id;

                      return (
                        <div key={m.id} className="py-3.5 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-xs font-bold shadow-sm flex-shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                {isEditingThis ? (
                                  <div className="flex items-center gap-1.5 flex-wrap py-0.5">
                                    <input
                                      type="text"
                                      value={nicknameInput}
                                      onChange={(e) => setNicknameInput(e.target.value)}
                                      placeholder={realDisplayName}
                                      maxLength={50}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveNickname(m.id);
                                        if (e.key === 'Escape') setEditingMemberId(null);
                                      }}
                                      className="rounded-lg border border-circle-primary bg-white dark:bg-circle-dark-canvas px-2.5 py-1 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary w-40 sm:w-52 shadow-sm"
                                    />
                                    <button
                                      type="button"
                                      disabled={updateNicknameMutation.isPending}
                                      onClick={() => handleSaveNickname(m.id)}
                                      title={t.circle.saveNickname}
                                      className="p-1 rounded-md bg-circle-primary text-circle-charcoal hover:bg-circle-primary/90 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMemberId(null)}
                                      title={t.common.cancel}
                                      className="p-1 rounded-md border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate hover:bg-circle-canvas transition-colors"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                                      {displayTitle}
                                    </h4>
                                    {isSelf && (
                                      <span className="rounded-full px-2 py-0.2 text-[10px] font-medium bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate">
                                        Bạn
                                      </span>
                                    )}
                                    {/* Icon cây bút nhỏ (~14px, màu xám nhạt) đặt ngay cạnh tên hiển thị */}
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditNickname(m.id, m.nickname)}
                                      title={t.circle.setNickname}
                                      className="p-1 rounded-md text-circle-slate/60 hover:text-circle-charcoal dark:text-circle-dark-muted/60 dark:hover:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors shrink-0"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                                {hasNickname ? (
                                  <>
                                    <p className="text-xs text-circle-slate dark:text-circle-dark-muted truncate mt-0.5">
                                      {realDisplayName}
                                    </p>
                                    <p className="text-[11px] text-circle-slate/70 dark:text-circle-dark-muted/70 truncate">
                                      {m.user?.email}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted truncate mt-0.5">
                                    {m.user?.email}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Role Badge & Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Role Badge */}
                              {m.role === MemberRole.OWNER ? (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                  <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  <span>{t.circle.memberRoleOwner}</span>
                                </span>
                              ) : (
                                <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted border border-circle-hairline dark:border-circle-dark-hairline">
                                  {t.circle.memberRoleMember}
                                </span>
                              )}

                              {/* OWNER Controls */}
                              {isOwner && !isSelf && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setConfirmTransferMemberId(m.id)}
                                    title={t.circle.transferOwnership}
                                    className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-amber-600 dark:text-amber-400 transition-colors"
                                  >
                                    <Crown className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={() => setConfirmKickMemberId(m.id)}
                                    title={t.circle.kickMember}
                                    className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 3: QUYỀN RIÊNG TƯ & HỖ TRỢ (DÀNH CHO CÁ NHÂN MỖI NGƯỜI DÙNG)
                - Quyền riêng tư & Tin nhắn:
                  + Bật/Tắt hiển thị thông báo đã đọc (Read receipts / "Đã xem")
                  + Thông báo đoạn chat (Bật / Tắt / Tắt tiếng tạm thời)
                - Hỗ trợ & Báo cáo:
                  + Báo cáo vi phạm Vòng tròn
                  + Trung tâm trợ giúp / Hướng dẫn cộng đồng
                  + Rời Vòng tròn (Dành cho cá nhân muốn thoát nhóm)
               ========================================================================= */}
            {activeTab === 'privacySupport' && (
              <div className="space-y-6">
                {/* Section Header Notice */}
                <div className="p-3.5 rounded-2xl bg-circle-primary/10 border border-circle-primary/20 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-circle-primary shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                      {t.circle.personalPrivacyTitle}
                    </h4>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      {t.circle.personalPrivacySubtitle}
                    </p>
                  </div>
                </div>

                {/* Phần 1: Quyền riêng tư & Tin nhắn */}
                <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.privacyAndMessaging}</span>
                  </h4>

                  {/* 1. Read receipts toggle */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {readReceipts ? (
                          <Eye className="h-4 w-4 text-circle-primary shrink-0" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-circle-slate shrink-0" />
                        )}
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.readReceiptsTitle}
                        </h5>
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.readReceiptsDesc}
                      </p>
                    </div>

                    {/* Modern Toggle Switch */}
                    <button
                      type="button"
                      onClick={handleToggleReadReceipts}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        readReceipts ? 'bg-circle-primary' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          readReceipts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. Chat Notifications selector */}
                  <div className="p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 space-y-2.5">
                    <div className="flex items-center gap-2">
                      {notificationMute === 'off' ? (
                        <BellOff className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        <Bell className="h-4 w-4 text-circle-primary shrink-0" />
                      )}
                      <div>
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.chatNotificationsTitle}
                        </h5>
                        <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                          {t.circle.chatNotificationsDesc}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {[
                        { key: 'all', label: t.circle.notificationAll },
                        { key: '15m', label: t.circle.notificationMute15m },
                        { key: '1h', label: t.circle.notificationMute1h },
                        { key: '8h', label: t.circle.notificationMute8h },
                        { key: '24h', label: t.circle.notificationMute24h },
                        { key: 'off', label: t.circle.notificationOff },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleChangeNotificationMute(item.key)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all text-left truncate ${
                            notificationMute === item.key
                              ? 'bg-circle-primary text-circle-charcoal font-bold shadow-sm'
                              : 'bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phần 2: Hỗ trợ & Báo cáo */}
                <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-3.5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.supportAndReports}</span>
                  </h4>

                  {/* 1. Báo cáo vi phạm Vòng tròn */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-amber-500 shrink-0" />
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.reportCircleTitle}
                        </h5>
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.reportCircleDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(!isReportOpen)}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-all shrink-0"
                    >
                      Báo cáo
                    </button>
                  </div>

                  {/* Sub-form Báo cáo vi phạm */}
                  {isReportOpen && (
                    <form
                      onSubmit={handleSubmitReport}
                      className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 animate-fade-in"
                    >
                      <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Chọn lý do báo cáo Vòng tròn này:
                      </h5>
                      <div className="space-y-2">
                        {[
                          { key: 'harassment', label: t.circle.reportReasonHarassment },
                          { key: 'spam', label: t.circle.reportReasonSpam },
                          { key: 'inappropriate', label: t.circle.reportReasonInappropriate },
                          { key: 'impersonation', label: t.circle.reportReasonImpersonation },
                          { key: 'other', label: t.circle.reportReasonOther },
                        ].map((reason) => (
                          <label key={reason.key} className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text cursor-pointer">
                            <input
                              type="radio"
                              name="reportReason"
                              value={reason.key}
                              checked={reportReason === reason.key}
                              onChange={(e) => {
                                setReportReason(e.target.value);
                                if (reportFieldError) setReportFieldError(null);
                              }}
                              className="text-circle-primary focus:ring-circle-primary"
                            />
                            <span>{reason.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Textarea for "Khác" option */}
                      {reportReason === 'other' && (
                        <div className="space-y-1 pt-1">
                          <textarea
                            value={customReportText}
                            onChange={(e) => {
                              setCustomReportText(e.target.value);
                              if (reportFieldError) setReportFieldError(null);
                            }}
                            rows={3}
                            placeholder={t.circle.reportReasonOtherPlaceholder}
                            className="w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-circle-dark-surface p-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                          />
                          {reportFieldError && (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                              {reportFieldError}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReportOpen(false);
                            setCustomReportText('');
                            setReportFieldError(null);
                          }}
                          className="px-3 py-1 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline text-xs font-medium text-circle-slate hover:bg-white dark:hover:bg-circle-dark-surface"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          Gửi báo cáo
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2. Trung tâm trợ giúp / Hướng dẫn cộng đồng */}
                  <div className="p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-circle-primary shrink-0" />
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.helpCenterTitle}
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsHelpOpen(!isHelpOpen)}
                        className="text-xs font-semibold text-circle-primary hover:underline flex items-center gap-1"
                      >
                        <span>{isHelpOpen ? 'Thu gọn' : 'Xem hướng dẫn'}</span>
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isHelpOpen ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted leading-snug">
                      {t.circle.helpCenterDesc}
                    </p>

                    {isHelpOpen && (
                      <div className="mt-3 p-3 rounded-lg bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-xs space-y-2 text-circle-slate dark:text-circle-dark-muted animate-fade-in">
                        <p className="font-semibold text-circle-charcoal dark:text-circle-dark-text">
                          Quy tắc cộng đồng CIRCLE:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Tôn trọng quyền riêng tư và thông tin cá nhân của các thành viên.</li>
                          <li>Không phát tán liên kết mời ra ngoài mà không có sự đồng ý của nhóm.</li>
                          <li>Giữ môi trường giao lưu văn minh, tích cực và tương trợ lẫn nhau.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* 3. Rời Vòng tròn (Dành cho cá nhân muốn thoát nhóm) */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                        <h5 className="text-xs font-bold text-red-700 dark:text-red-400">
                          {t.circle.leaveCirclePersonalTitle}
                        </h5>
                      </div>
                      <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1 leading-snug">
                        {t.circle.leaveCirclePersonalDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmLeave(true)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shrink-0 shadow-sm"
                    >
                      {t.circle.leaveCircle}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: THIẾT LẬP VÒNG TRÒN (CIRCLE SETTINGS - DÀNH CHO NHÓM)
                Chứa cấu hình chế độ riêng tư (Public/Private), số lượng tối đa (maxMembers),
                mã mời, chia sẻ và danh sách duyệt yêu cầu tham gia
               ========================================================================= */}
            {activeTab === 'circleSettings' && (
              <div className="space-y-6">
                {/* Section 1: Circle Mode & Max Capacity Settings */}
                <form
                  onSubmit={handleSaveCircleSettings}
                  className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-canvas/30 space-y-4 shadow-sm"
                >
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-circle-primary" />
                      <span>{t.circle.circleSettingsTitle}</span>
                    </h4>
                    <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      {t.circle.circleSettingsSubtitle}
                    </p>
                  </div>

                  {/* Mode: Public vs Private */}
                  <div>
                    <label className="block text-xs font-medium text-circle-slate dark:text-circle-dark-muted mb-1.5">
                      {t.circle.circleModeLabel}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={!isOwner}
                        onClick={() => setFormIsPrivate(false)}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                          !formIsPrivate
                            ? 'border-circle-primary bg-circle-primary/10'
                            : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface'
                        }`}
                      >
                        <Globe className="h-4 w-4 text-circle-primary shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                            {t.circle.privacyPublic}
                          </h5>
                          <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted mt-0.5 leading-snug">
                            {t.circle.circleModePublicDesc}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={!isOwner}
                        onClick={() => setFormIsPrivate(true)}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                          formIsPrivate
                            ? 'border-circle-primary bg-circle-primary/10'
                            : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface'
                        }`}
                      >
                        <Lock className="h-4 w-4 text-circle-primary shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                            {t.circle.privacyPrivate}
                          </h5>
                          <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted mt-0.5 leading-snug">
                            {t.circle.circleModePrivateDesc}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Maximum Members */}
                  <div>
                    <label className="block text-xs font-medium text-circle-slate dark:text-circle-dark-muted mb-1.5 flex items-center justify-between">
                      <span>{t.circle.maxMembersLabel}</span>
                      <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-normal">
                        {t.circle.circleCapacityCount
                          .replace('{count}', String(members.length))
                          .replace('{max}', formMaxMembers ? String(formMaxMembers) : t.circle.maxMembersUnlimited)}
                      </span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        min={2}
                        max={10000}
                        value={formMaxMembers ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setFormMaxMembers(val ? Math.max(2, parseInt(val, 10)) : null);
                        }}
                        disabled={!isOwner}
                        placeholder={t.circle.maxMembersPlaceholder}
                        className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary disabled:opacity-60"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {[
                          { label: t.circle.maxMembersUnlimited, value: null },
                          { label: '5', value: 5 },
                          { label: '10', value: 10 },
                          { label: '20', value: 20 },
                          { label: '50', value: 50 },
                          { label: '100', value: 100 },
                          { label: '500', value: 500 },
                        ].map((preset) => (
                          <button
                            key={String(preset.value)}
                            type="button"
                            disabled={!isOwner}
                            onClick={() => setFormMaxMembers(preset.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                              formMaxMembers === preset.value
                                ? 'border-circle-primary bg-circle-primary/15 text-circle-charcoal dark:text-circle-primary font-bold shadow-xs'
                                : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
                        {t.circle.maxMembersCustomHint}
                      </p>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      type="submit"
                      disabled={updateCircleMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal py-2.5 px-4 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{updateCircleMutation.isPending ? t.circle.savingCircleSettings : t.circle.saveCircleSettings}</span>
                    </button>
                  )}
                </form>

                {/* Section 2: Invite Link & Sharing */}
                <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-3.5 shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                      <Link className="h-3.5 w-3.5 text-circle-primary" />
                      <span>{t.circle.inviteLinkCardTitle}</span>
                    </h4>
                    <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
                      {t.circle.inviteLinkCardDesc}
                    </p>
                  </div>

                  {/* Invite Link with Copy & Share */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas text-xs font-mono text-circle-charcoal dark:text-circle-dark-text overflow-hidden">
                      <Link className="h-3.5 w-3.5 text-circle-primary shrink-0" />
                      <span className="truncate">{inviteLink}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyLink}
                        title={t.circle.copyInviteLink}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal text-xs font-bold transition-all shadow-sm"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedLink ? t.circle.copiedInviteLink : t.circle.copyInviteLink}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        title={t.circle.shareInvite}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text text-xs font-bold transition-all"
                      >
                        {sharedDone ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-circle-primary" />}
                        <span>{sharedDone ? t.circle.copiedInviteLink : t.circle.shareInvite}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code box */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/50">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted">
                        {t.circle.inviteCodeLabel}:
                      </span>
                      <span className="font-mono text-base font-bold tracking-widest text-circle-charcoal dark:text-circle-dark-text">
                        {currentInviteCode}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(currentInviteCode)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-primary/10 transition-colors"
                    >
                      {copiedCode === currentInviteCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">{t.circle.copiedInviteCode}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t.circle.copyInviteCode}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section 3: Join Requests (Owner only, for Private Circles) */}
                {isOwner && (
                  <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-circle-primary" />
                        <span>{t.circle.joinRequestsTitle}</span>
                      </h4>
                      <span className="rounded-full px-2 py-0.5 text-[10px] bg-circle-canvas dark:bg-circle-dark-canvas font-semibold">
                        {joinRequests.length}
                      </span>
                    </div>

                    {joinRequests.length === 0 ? (
                      <p className="py-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                        {t.circle.noPendingJoinRequests}
                      </p>
                    ) : (
                      <div className="divide-y divide-circle-hairline dark:divide-circle-dark-hairline">
                        {joinRequests.map((req) => {
                          const requesterName =
                            req.user?.profile?.displayName || req.user?.email?.split('@')[0] || t.auth.member;
                          const reqInitials = getInitials(requesterName);

                          return (
                            <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-xs font-bold flex-shrink-0">
                                  {reqInitials}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                                    {requesterName}
                                  </h5>
                                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">
                                    {req.user?.email}
                                  </p>
                                  {req.message && (
                                    <p className="text-[11px] italic text-circle-charcoal dark:text-circle-dark-text mt-0.5">
                                      "{req.message}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => handleReviewRequest(req.id, 'APPROVED')}
                                  disabled={reviewRequestMutation.isPending}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>{t.circle.approveJoinRequest}</span>
                                </button>
                                <button
                                  onClick={() => handleReviewRequest(req.id, 'REJECTED')}
                                  disabled={reviewRequestMutation.isPending}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate text-[11px] hover:bg-circle-canvas transition-colors disabled:opacity-50"
                                >
                                  <X className="h-3 w-3" />
                                  <span>{t.circle.rejectJoinRequest}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODAL XÁC NHẬN RỜI VÒNG TRÒN (LEAVE CIRCLE POPUP DIALOG)
         ========================================================================= */}
      {confirmLeave && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-2xl space-y-4 animate-scale-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto">
              <LogOut className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.confirmLeaveTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {isOwner && members.length > 1
                  ? t.circle.ownerCannotLeaveMustTransfer
                  : t.circle.confirmLeaveWarning}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="flex-1 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline py-2.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors"
              >
                {t.common.cancel}
              </button>
              {(!isOwner || members.length <= 1) && (
                <button
                  type="button"
                  onClick={handleLeaveCircle}
                  disabled={leaveMutation.isPending}
                  className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {leaveMutation.isPending ? t.circle.savingChanges : t.circle.leaveCircle}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL XÁC NHẬN XÓA THÀNH VIÊN (KICK MEMBER POPUP DIALOG)
         ========================================================================= */}
      {confirmKickMemberId && kickingMember && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-2xl space-y-4 animate-scale-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto">
              <UserX className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.confirmKickTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {t.circle.confirmKickWarning}
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 border border-circle-hairline dark:border-circle-dark-hairline flex items-center gap-2.5 text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-circle-charcoal text-white text-xs font-bold overflow-hidden">
                  {kickingMember.user?.profile?.avatarUrl ? (
                    <img src={kickingMember.user.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(kickingMember.nickname || kickingMember.user?.profile?.displayName || kickingMember.user?.email || 'M')
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                    {kickingMember.nickname || kickingMember.user?.profile?.displayName || kickingMember.user?.email}
                  </p>
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">
                    {kickingMember.user?.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmKickMemberId(null)}
                className="flex-1 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline py-2.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleKickMember(confirmKickMemberId)}
                disabled={removeMemberMutation.isPending}
                className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {removeMemberMutation.isPending ? t.circle.savingChanges : t.circle.kickMember}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL XÁC NHẬN CHUYỂN QUYỀN SỞ HỮU (TRANSFER OWNERSHIP POPUP DIALOG)
         ========================================================================= */}
      {confirmTransferMemberId && transferringMember && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-circle-dark-surface p-6 shadow-2xl space-y-4 animate-scale-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto">
              <Crown className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.confirmTransferTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {t.circle.confirmTransferWarning}
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 border border-circle-hairline dark:border-circle-dark-hairline flex items-center gap-2.5 text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white text-xs font-bold overflow-hidden">
                  {transferringMember.user?.profile?.avatarUrl ? (
                    <img src={transferringMember.user.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(transferringMember.nickname || transferringMember.user?.profile?.displayName || transferringMember.user?.email || 'M')
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                    {transferringMember.nickname || transferringMember.user?.profile?.displayName || transferringMember.user?.email}
                  </p>
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">
                    {transferringMember.user?.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTransferMemberId(null)}
                className="flex-1 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline py-2.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleTransferOwnership(confirmTransferMemberId)}
                disabled={transferOwnershipMutation.isPending}
                className="flex-1 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white py-2.5 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {transferOwnershipMutation.isPending ? t.circle.savingChanges : t.circle.transferOwnership}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
