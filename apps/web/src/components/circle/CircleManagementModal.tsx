'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Users,
  UserX,
  LogOut,
  Crown,
  Copy,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Save,
  Link as LinkIcon,
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
  UserCheck,
  Camera,
  Upload,
  Loader2,
  Phone,
  Video,
  Shield,
  Bot,
  Keyboard,
  UserMinus,
  VolumeX,
  Volume2,
  ChevronDown,
  Trash2,
  Palette,
  History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguageStore } from '@/stores/language.store';
import { useCircleStore } from '@/stores/circle.store';
import { useSoundStore } from '@/stores/sound.store';
import { sendCircleThemeUpdate } from '@/lib/socket';
import { searchPublicUsersApi } from '@/lib/auth';
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
  useDeleteCircleMutation,
  useCreateReportMutation,
} from '@/hooks/use-circle-queries';
import { useUploadMedia } from '@/hooks/use-upload-media';
import { apiRequest } from '@/lib/api';
import { getActiveCircleMute } from '@circle/shared';
import { CircleNotificationSettings, CircleMuteDuration, UpdateCircleNotificationSettingsInput, MemberRole, PublicUserEntity } from '@circle/types';
import { MessageBubbleThemes, MessageTheme } from '@circle/shared';
import { ConfirmModal } from '../ui/ConfirmModal';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

type TabType = 'chatInfo' | 'members' | 'privacySupport' | 'circleSettings' | 'supportReports';
type MembersSubTab = 'roster' | 'requests';

export const CircleManagementModal: React.FC = () => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const isManageModalOpen = useCircleStore((s) => s.isManageModalOpen);
  const manageActiveTab = useCircleStore((s) => s.manageActiveTab);
  const setManageModalOpen = useCircleStore((s) => s.setManageModalOpen);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const soundEnabled = useSoundStore((s) => s.soundEnabled);
  const toggleSound = useSoundStore((s) => s.toggleSound);

  const { uploadMedia, isUploading: isUploadingMedia } = useUploadMedia();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize initial tab
  const getInitialTab = (): TabType => {
    if (manageActiveTab === 'members' || manageActiveTab === 'requests') return 'members';
    if (manageActiveTab === 'privacySupport') return 'privacySupport';
    if (manageActiveTab === 'supportReports') return 'supportReports';
    if (
      manageActiveTab === 'circleSettings' ||
      manageActiveTab === 'settings' ||
      manageActiveTab === 'invites'
    ) {
      return 'circleSettings';
    }
    return 'chatInfo';
  };

  const [activeTab, setActiveTab] = useState<TabType>('chatInfo');
  const [membersSubTab, setMembersSubTab] = useState<MembersSubTab>('roster');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [sharedDone, setSharedDone] = useState<boolean>(false);
  const [confirmKickMemberId, setConfirmKickMemberId] = useState<string | null>(null);
  const [confirmTransferMemberId, setConfirmTransferMemberId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<boolean>(false);
  const [confirmDeleteCircle, setConfirmDeleteCircle] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [themeSuccessNotice, setThemeSuccessNotice] = useState<boolean>(false);

  // Tab 1: Chat Info view / edit state
  const [isEditingChatInfo, setIsEditingChatInfo] = useState<boolean>(false);
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);

  // Nickname Editing State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState<string>('');

  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // Tab 3: Section 1 - Thông báo (Notifications)
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [isChatMuted, setIsChatMuted] = useState<boolean>(false);
  const [muteDuration, setMuteDuration] = useState<string>('8h');
  const [messageNotificationLevel, setMessageNotificationLevel] = useState<'all' | 'mentions' | 'none'>('all');
  const [isCallsMuted, setIsCallsMuted] = useState<boolean>(false);
  const [mutedMemberIds, setMutedMemberIds] = useState<string[]>([]);
  const [isManageMutedMembersOpen, setIsManageMutedMembersOpen] = useState<boolean>(false);
  const [memberMuteSearch, setMemberMuteSearch] = useState<string>('');

  // Tab 3: Section 2 - Quyền riêng tư (Privacy)
  const [readReceipts, setReadReceipts] = useState<boolean>(true);
  const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(true);
  const [allowAiProcessing, setAllowAiProcessing] = useState<boolean>(true);

  // Tab 3: Section 3 - Hỗ trợ & Báo cáo (Support & Reports)
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [customReportText, setCustomReportText] = useState('');
  const [reportFieldError, setReportFieldError] = useState<string | null>(null);

  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState('');
  const [reportUserReason, setReportUserReason] = useState('harassment');
  const [customReportUserText, setCustomReportUserText] = useState('');
  const [reportUserFieldError, setReportUserFieldError] = useState<string | null>(null);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Tab 4: Circle-level settings
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formMaxMembers, setFormMaxMembers] = useState<number | null>(null);
  const [isCustomCapacity, setIsCustomCapacity] = useState<boolean>(false);
  const [formThemeColor, setFormThemeColor] = useState<MessageTheme>('sage');

  const prevModalOpenRef = useRef(false);
  const prevCircleIdRef = useRef<string | null>(null);

  // Sync tab & form values when opened or activeCircle changes
  useEffect(() => {
    if (isManageModalOpen && activeCircle) {
      const isOpening = !prevModalOpenRef.current || prevCircleIdRef.current !== activeCircle.id;
      prevModalOpenRef.current = isManageModalOpen;
      prevCircleIdRef.current = activeCircle.id;

      if (isOpening) {
        setActiveTab(getInitialTab());
        if (manageActiveTab === 'requests') {
          setMembersSubTab('requests');
        } else {
          setMembersSubTab('roster');
        }
        setErrorMessage(null);
        setSuccessMessage(null);
        setThemeSuccessNotice(false);
        setIsEditingChatInfo(false);
        setEditingMemberId(null);
        setIsAddMemberOpen(false);
        setSelectedFriendIds([]);
        setFriendSearch('');
        setIsReportOpen(false);
        setCustomReportText('');
        setReportFieldError(null);
        setIsReportUserOpen(false);
        setReportedUserId('');
        setCustomReportUserText('');
        setReportUserFieldError(null);
        setIsHelpOpen(false);
        setShowAvatarPresets(false);
        setIsManageMutedMembersOpen(false);
        setMemberMuteSearch('');
        setFormName(activeCircle.name || '');
        setFormAvatar(activeCircle.avatarUrl || '');
        setFormIsPrivate(Boolean(activeCircle.isPrivate));
        setFormMaxMembers(activeCircle.maxMembers ?? null);
        setIsCustomCapacity(activeCircle.maxMembers !== null);
        setFormThemeColor(((activeCircle as any).themeColor as MessageTheme) || 'sage');

        // Load personal preferences from localStorage if available
        try {
          const storedReceipts = localStorage.getItem(`circle_${activeCircle.id}_read_receipts`);
          if (storedReceipts !== null) setReadReceipts(storedReceipts === 'true');

          const storedTyping = localStorage.getItem(`circle_${activeCircle.id}_typing_indicator`);
          if (storedTyping !== null) setShowTypingIndicator(storedTyping === 'true');

          const storedAi = localStorage.getItem(`circle_${activeCircle.id}_ai_processing`);
          if (storedAi !== null) setAllowAiProcessing(storedAi === 'true');

          const storedCallsMuted = localStorage.getItem(`circle_${activeCircle.id}_calls_muted`);
          if (storedCallsMuted !== null) setIsCallsMuted(storedCallsMuted === 'true');

          const storedMutedMembers = localStorage.getItem(`circle_${activeCircle.id}_muted_members`);
          if (storedMutedMembers) {
            try {
              setMutedMemberIds(JSON.parse(storedMutedMembers));
            } catch {}
          }
        } catch {
          // Ignore localStorage error
        }
      }
    } else {
      prevModalOpenRef.current = false;
    }
  }, [isManageModalOpen, manageActiveTab, activeCircle]);

  const circleId = activeCircle?.id || '';

  const { data: members = [], isLoading: isLoadingMembers } = useCircleMembersQuery(circleId);
  const [addMemberSearchResults, setAddMemberSearchResults] = useState<PublicUserEntity[]>([]);
  const [isSearchingAddMembers, setIsSearchingAddMembers] = useState(false);
  const [addMemberRecentUsers, setAddMemberRecentUsers] = useState<PublicUserEntity[]>([]);
  const addMemberSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAddMemberOpen && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('circle_recent_user_searches');
        setAddMemberRecentUsers(raw ? JSON.parse(raw) : []);
      } catch {}
    }
  }, [isAddMemberOpen]);

  useEffect(() => {
    const q = friendSearch.trim();
    if (!q) {
      setAddMemberSearchResults([]);
      setIsSearchingAddMembers(false);
      return;
    }
    setIsSearchingAddMembers(true);
    if (addMemberSearchTimerRef.current) clearTimeout(addMemberSearchTimerRef.current);
    addMemberSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchPublicUsersApi(q);
        setAddMemberSearchResults(res || []);
      } catch {
        setAddMemberSearchResults([]);
      } finally {
        setIsSearchingAddMembers(false);
      }
    }, 250);
    return () => {
      if (addMemberSearchTimerRef.current) clearTimeout(addMemberSearchTimerRef.current);
    };
  }, [friendSearch]);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner =
    currentMember?.role === MemberRole.OWNER ||
    (activeCircle as any)?.role === 'OWNER' ||
    (activeCircle as any)?.role === MemberRole.OWNER ||
    (activeCircle as any)?.creatorId === user?.id ||
    (activeCircle as any)?.ownerId === user?.id;
  const isOwnerOrAdmin =
    isOwner ||
    currentMember?.role === MemberRole.ADMIN ||
    (activeCircle as any)?.role === 'ADMIN' ||
    (activeCircle as any)?.role === MemberRole.ADMIN;

  const { data: joinRequests = [] } = useCircleJoinRequestsQuery(circleId, isOwnerOrAdmin);

  // Filter users who are NOT already in the circle
  const availableSearchResults = addMemberSearchResults.filter(
    (u) => !members.some((m) => m.userId === u.id)
  );
  const availableRecentUsers = addMemberRecentUsers.filter(
    (u) => !members.some((m) => m.userId === u.id)
  );
  const displayedUsers = friendSearch.trim().length > 0 ? availableSearchResults : availableRecentUsers;

  // Active Invite Code & Link
  const currentInviteCode = activeCircle?.inviteCode || '';
  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${currentInviteCode}`
      : `https://circle.app/join/${currentInviteCode}`;

  // Mutations
  const updateCircleMutation = useUpdateCircleMutation(circleId);
  const removeMemberMutation = useRemoveMemberMutation(circleId);
  const leaveCircleMutation = useLeaveCircleMutation(circleId);
  const transferOwnershipMutation = useTransferOwnershipMutation(circleId);
  const reviewRequestMutation = useReviewJoinRequestMutation(circleId);
  const updateNicknameMutation = useUpdateMemberNicknameMutation(circleId);
  const addMembersMutation = useAddCircleMembersMutation(circleId);
  const deleteCircleMutation = useDeleteCircleMutation(circleId);
  const createReportMutation = useCreateReportMutation(circleId);

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
    if (typeof navigator !== 'undefined' && navigator.share && activeCircle) {
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

  // Tab 1: Upload avatar from device via R2 Presigned URL
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      const res = await uploadMedia({
        file,
        folder: 'avatars',
      });
      if (res?.publicUrl) {
        setFormAvatar(res.publicUrl);
        setShowAvatarPresets(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.avatarUploadError);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Tab 1: Save Chat Information (Name, Avatar)
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
        avatarUrl: formAvatar.trim() || undefined,
      });
      setIsEditingChatInfo(false);
      setSuccessMessage(t.circle.savedSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  const handleCancelEditChatInfo = () => {
    setFormName(activeCircle?.name || '');
    setFormAvatar(activeCircle?.avatarUrl || '');
    setShowAvatarPresets(false);
    setIsEditingChatInfo(false);
    setErrorMessage(null);
  };

  // Tab 4: Instant Auto-Save Circle-Level Settings (isPrivate, maxMembers)
  const handleToggleApproval = async () => {
    if (!isOwner) return;
    const next = !formIsPrivate;
    setFormIsPrivate(next);
    setErrorMessage(null);
    try {
      await updateCircleMutation.mutateAsync({
        isPrivate: next,
        maxMembers: formMaxMembers,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || t.circle.createError);
    }
  };

  const handleCapacityChange = async (val: string) => {
    if (!isOwner) return;
    setErrorMessage(null);
    if (val === 'limited') {
      setIsCustomCapacity(true);
      const initialCapacity = formMaxMembers || 50;
      setFormMaxMembers(initialCapacity);
      try {
        await updateCircleMutation.mutateAsync({
          isPrivate: formIsPrivate,
          maxMembers: initialCapacity,
        });
      } catch (err: any) {
        setErrorMessage(err?.message || t.circle.createError);
      }
    } else {
      setIsCustomCapacity(false);
      setFormMaxMembers(null);
      try {
        await updateCircleMutation.mutateAsync({
          isPrivate: formIsPrivate,
          maxMembers: null,
        });
      } catch (err: any) {
        setErrorMessage(err?.message || t.circle.createError);
      }
    }
  };

  const handleCustomCapacityChange = (val: string) => {
    if (val === '') {
      setFormMaxMembers(null);
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setFormMaxMembers(parsed);
    }
  };

  const handleCustomCapacityBlur = async () => {
    if (!isOwner) return;
    let target = formMaxMembers;
    if (target === null || target < 2) {
      target = 2;
      setFormMaxMembers(2);
    } else if (target > 100) {
      target = 100;
      setFormMaxMembers(100);
    }
    try {
      await updateCircleMutation.mutateAsync({
        isPrivate: formIsPrivate,
        maxMembers: target,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || t.circle.createError);
    }
  };

  const handleThemeColorChange = async (color: MessageTheme) => {
    setFormThemeColor(color);
    if (activeCircle) {
      setActiveCircle({ ...activeCircle, themeColor: color });
    }
    if (circleId) {
      sendCircleThemeUpdate(circleId, color);
    }
    try {
      await updateCircleMutation.mutateAsync({
        themeColor: color,
      });
      setThemeSuccessNotice(true);
      setTimeout(() => setThemeSuccessNotice(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || t.circle.themeUpdateError);
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
  const handleToggleSelectFriend = (friendId: string, userObj?: PublicUserEntity) => {
    setSelectedFriendIds((prev) => {
      const exists = prev.includes(friendId);
      if (exists) {
        return prev.filter((id) => id !== friendId);
      } else {
        if (userObj && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('circle_recent_user_searches');
            const current: PublicUserEntity[] = raw ? JSON.parse(raw) : [];
            const updated = [userObj, ...current.filter((u) => u.id !== userObj.id)].slice(0, 8);
            localStorage.setItem('circle_recent_user_searches', JSON.stringify(updated));
            setAddMemberRecentUsers(updated);
          } catch {}
        }
        return [...prev, friendId];
      }
    });
  };

  const handleSelectAllFriends = () => {
    if (selectedFriendIds.length === displayedUsers.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(displayedUsers.map((f) => f.id));
    }
  };

  const handleConfirmAddMembers = async () => {
    if (selectedFriendIds.length === 0) return;
    setErrorMessage(null);
    try {
      await addMembersMutation.mutateAsync(selectedFriendIds);
      setIsAddMemberOpen(false);
      setSelectedFriendIds([]);
      setFriendSearch('');
      setSuccessMessage(t.circle.addMembersSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  // Tab 2: Member Management Actions
  const handleKickMember = async (memberId: string) => {
    setErrorMessage(null);
    try {
      await removeMemberMutation.mutateAsync(memberId);
      setConfirmKickMemberId(null);
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

  const handleLeaveCircle = async () => {
    setErrorMessage(null);
    try {
      await leaveCircleMutation.mutateAsync();
      setConfirmLeave(false);
      setManageModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || t.circle.createError);
    }
  };

  const handleDeleteCircle = async () => {
    setErrorMessage(null);
    try {
      await deleteCircleMutation.mutateAsync();
      setConfirmDeleteCircle(false);
      setManageModalOpen(false);
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

  // Tab 3: Personal Settings Handlers (Silent update)
  const handleToggleReadReceipts = () => {
    const next = !readReceipts;
    setReadReceipts(next);
    try {
      localStorage.setItem(`circle_${circleId}_read_receipts`, String(next));
    } catch {}
  };

  const handleToggleTypingIndicator = () => {
    const next = !showTypingIndicator;
    setShowTypingIndicator(next);
    try {
      localStorage.setItem(`circle_${circleId}_typing_indicator`, String(next));
    } catch {}
  };

  const handleToggleAiProcessing = () => {
    const next = !allowAiProcessing;
    setAllowAiProcessing(next);
    try {
      localStorage.setItem(`circle_${circleId}_ai_processing`, String(next));
    } catch {}
  };

  useEffect(() => {
    if (!isManageModalOpen || !circleId) return;
    let active = true;
    setNotificationBusy(true);
    apiRequest<CircleNotificationSettings>(`/notifications/circles/${circleId}/settings`)
      .then(({ data }) => {
        if (!active || !data) return;
        const duration = getActiveCircleMute(data.mutedUntil);
        setIsChatMuted(Boolean(duration));
        setMuteDuration(duration ?? '8h');
        setMessageNotificationLevel(data.notificationLevel === 'MENTIONS' ? 'mentions' : data.notificationLevel === 'NONE' ? 'none' : 'all');
      })
      .catch(() => { if (active) setErrorMessage(t.notificationsCenter.settingsError); })
      .finally(() => { if (active) setNotificationBusy(false); });
    return () => { active = false; };
  }, [isManageModalOpen, circleId, t.notificationsCenter.settingsError]);

  const saveNotificationSettings = async (input: UpdateCircleNotificationSettingsInput) => {
    if (!circleId || notificationBusy) return false;
    setNotificationBusy(true);
    setErrorMessage(null);
    try {
      const { data } = await apiRequest<CircleNotificationSettings>(`/notifications/circles/${circleId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      const duration = getActiveCircleMute(data.mutedUntil);
      setIsChatMuted(Boolean(duration));
      if (duration) setMuteDuration(duration);
      setMessageNotificationLevel(data.notificationLevel === 'MENTIONS' ? 'mentions' : data.notificationLevel === 'NONE' ? 'none' : 'all');
      return true;
    } catch {
      setErrorMessage(t.notificationsCenter.settingsError);
      return false;
    } finally {
      setNotificationBusy(false);
    }
  };

  const handleToggleChatMute = () => {
    void saveNotificationSettings({ mute: isChatMuted ? null : muteDuration as CircleMuteDuration });
  };

  const handleSelectMuteDuration = (duration: string) => {
    void saveNotificationSettings({ mute: duration as CircleMuteDuration });
  };

  const handleChangeMessageNotificationLevel = (level: 'all' | 'mentions' | 'none') => {
    void saveNotificationSettings({ notificationLevel: level === 'mentions' ? 'MENTIONS' : level === 'none' ? 'NONE' : 'ALL' });
  };

  const handleToggleCallsMute = () => {
    const next = !isCallsMuted;
    setIsCallsMuted(next);
    try {
      localStorage.setItem(`circle_${circleId}_calls_muted`, String(next));
    } catch {}
  };

  const handleToggleMuteMember = (memberUserId: string) => {
    const next = mutedMemberIds.includes(memberUserId)
      ? mutedMemberIds.filter((id) => id !== memberUserId)
      : [...mutedMemberIds, memberUserId];
    setMutedMemberIds(next);
    try {
      localStorage.setItem(`circle_${circleId}_muted_members`, JSON.stringify(next));
    } catch {}
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportFieldError(null);
    if (reportReason === 'other' && !customReportText.trim()) {
      setReportFieldError(t.circle.reportReasonOtherRequired);
      return;
    }
    try {
      await createReportMutation.mutateAsync({
        targetType: 'CIRCLE',
        reason: reportReason,
        details: customReportText.trim() || undefined,
      });
      setIsReportOpen(false);
      setCustomReportText('');
      setSuccessMessage(t.circle.reportSubmittedSuccess);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setReportFieldError(err?.message || t.circle.reportSendError);
    }
  };

  const handleSubmitReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportUserFieldError(null);
    if (!reportedUserId) {
      setReportUserFieldError(t.circle.selectMemberError);
      return;
    }
    if (reportUserReason === 'other' && !customReportUserText.trim()) {
      setReportUserFieldError(t.circle.reportReasonOtherRequired);
      return;
    }
    try {
      await createReportMutation.mutateAsync({
        targetType: 'USER',
        targetUserId: reportedUserId,
        reason: reportUserReason,
        details: customReportUserText.trim() || undefined,
      });
      setIsReportUserOpen(false);
      setReportedUserId('');
      setCustomReportUserText('');
      setSuccessMessage(t.circle.userReportSuccess);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setReportUserFieldError(err?.message || t.circle.reportSendError);
    }
  };

  useEffect(() => {
    if (!isManageModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDeleteCircle) {
        setConfirmDeleteCircle(false);
      } else if (confirmLeave) {
        setConfirmLeave(false);
      } else if (confirmTransferMemberId) {
        setConfirmTransferMemberId(null);
      } else if (confirmKickMemberId) {
        setConfirmKickMemberId(null);
      } else if (editingMemberId) {
        setEditingMemberId(null);
      } else {
        setManageModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isManageModalOpen,
    confirmDeleteCircle,
    confirmLeave,
    confirmTransferMemberId,
    confirmKickMemberId,
    editingMemberId,
    setManageModalOpen,
  ]);

  if (!isManageModalOpen || !activeCircle) return null;

  const getDurationLabel = (dur: string) => {
    switch (dur) {
      case '15m': return t.circle.notificationMute15m;
      case '1h': return t.circle.notificationMute1h;
      case '8h': return t.circle.notificationMute8h;
      case '24h': return t.circle.notificationMute24h;
      case 'forever': return t.circle.muteUntilTurnOn;
      default: return dur;
    }
  };

  // Filtered members for member muting search
  const filteredMuteMembers = members.filter((m) => {
    if (m.userId === user?.id) return false;
    const term = memberMuteSearch.toLowerCase().trim();
    if (!term) return true;
    const name = m.nickname || m.user?.profile?.displayName || m.user?.email || '';
    return name.toLowerCase().includes(term);
  });

  // Nav items definition matching SystemSettingsModal layout
  const navItems = [
    { id: 'chatInfo', label: t.circle.chatInfoTab, icon: MessageSquare },
    {
      id: 'members',
      label: t.circle.settingsTabMembers,
      icon: Users,
      badge: joinRequests.length > 0 && isOwnerOrAdmin ? joinRequests.length : undefined,
    },
    { id: 'privacySupport', label: t.circle.notificationsAndPrivacyTab, icon: Bell },
    { id: 'circleSettings', label: t.circle.circleSettingsTab, icon: Sliders },
    { id: 'supportReports', label: t.circle.supportAndReportsTab, icon: HelpCircle },
  ];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && setManageModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      {/* 2-Column Desktop Settings Dialog matching SystemSettingsModal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-4xl h-[620px] max-h-[92vh] rounded-2xl md:rounded-[24px] bg-white dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline shadow-2xl flex flex-col md:flex-row overflow-hidden text-circle-charcoal dark:text-white"
      >
        
        {/* =========================================================================
            LEFT COLUMN: Sidebar Navigation matching SystemSettingsModal
           ========================================================================= */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas p-3 sm:p-4">
          <div className="px-2 py-1 mb-3">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-circle-charcoal dark:text-white">
              {t.nav.circleSettings}
            </h2>
            <div className="flex items-center gap-3 mt-3 p-2 rounded-xl bg-white/60 dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-circle-primary/10 text-circle-sage dark:text-circle-dark-primary font-bold text-xs uppercase overflow-hidden">
                {formAvatar ? (
                  <img src={formAvatar} alt={activeCircle.name} className="h-full w-full object-cover" />
                ) : (
                  activeCircle.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-circle-charcoal dark:text-white truncate">
                  {activeCircle.name}
                </h3>
                <p className="text-[10px] text-circle-slate dark:text-white/60 font-mono truncate">
                  @{activeCircle.handle}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Pill List */}
          <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setIsAddMemberOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-circle-wash dark:bg-circle-dark-elevated text-circle-sage dark:text-white border border-circle-hairline dark:border-circle-dark-hairline shadow-xs font-semibold'
                      : 'text-circle-slate dark:text-white/70 hover:bg-circle-canvas dark:hover:bg-white/5 hover:text-circle-charcoal dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-circle-sage dark:text-white' : 'text-circle-slate dark:text-white/60'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-circle-primary text-circle-charcoal">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* =========================================================================
            RIGHT COLUMN: Active Content Panel matching SystemSettingsModal
           ========================================================================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-circle-dark-canvas">
          {/* Panel Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
            <h3 className="text-base sm:text-lg font-bold text-circle-charcoal dark:text-white truncate">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h3>
            <button
              type="button"
              onClick={() => setManageModalOpen(false)}
              aria-label={t.common.close}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-white/70 hover:bg-circle-wash dark:hover:bg-circle-dark-elevated hover:text-circle-charcoal dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

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

          {/* Hidden File Input for Avatar Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileUpload}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          {/* Content Body with clean custom-scrollbar */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
            {/* =========================================================================
                TAB 1: THÔNG TIN ĐOẠN CHAT (CLUSTERED CARDS)
               ========================================================================= */}
            {activeTab === 'chatInfo' && (
              <div className="space-y-5">
                {/* Cụm 1: HỒ SƠ VÒNG TRÒN */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.circle.chatInfoTitle}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5">
                    {!isEditingChatInfo ? (
                      /* VIEW MODE: Clean Profile Header */
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar Display */}
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal font-bold text-xl uppercase overflow-hidden shadow-sm">
                          {formAvatar ? (
                            <img src={formAvatar} alt={activeCircle.name} className="h-full w-full object-cover" />
                          ) : (
                            activeCircle.name.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        {/* Info & Pencil Action */}
                        <div className="min-w-0 flex-1 text-center sm:text-left space-y-1">
                          <div className="flex items-center justify-center sm:justify-between gap-3">
                            <h4 className="text-lg font-bold text-circle-charcoal dark:text-white truncate">
                              {activeCircle.name}
                            </h4>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => setIsEditingChatInfo(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated text-xs font-semibold text-circle-charcoal dark:text-white transition-all"
                                title={t.circle.editChatInfo}
                              >
                                <Pencil className="h-3.5 w-3.5 text-circle-sage dark:text-circle-dark-primary" />
                                <span>{t.circle.editChatInfo}</span>
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-circle-slate dark:text-white/60 font-mono truncate">
                            @{activeCircle.handle}
                          </p>

                          <div className="pt-1 flex items-center justify-center sm:justify-start gap-3 text-xs text-circle-slate dark:text-white/60">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Users className="h-3.5 w-3.5 text-circle-sage dark:text-circle-dark-primary" />
                              {members.length} {t.circle.settingsTabMembers.toLowerCase()}
                            </span>
                            <span>•</span>
                            <span className="font-medium">
                              {activeCircle.isPrivate
                                ? t.circle.requireApprovalTitle
                                : t.circle.privacyPublic}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* EDIT MODE: Form to update name and visual avatar */
                      <form onSubmit={handleSaveChatInfo} className="space-y-4 animate-fade-in">
                        {/* Visual Avatar Editor */}
                        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-circle-dark-canvas/60 border border-circle-hairline dark:border-circle-dark-hairline">
                          <div className="relative group">
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-circle-primary/40 bg-circle-wash dark:bg-circle-dark-elevated shadow-md overflow-hidden">
                              {formAvatar ? (
                                <img
                                  src={formAvatar}
                                  alt={formName || activeCircle.name}
                                  className="h-full w-full object-cover"
                                  onError={() => setFormAvatar('')}
                                />
                              ) : (
                                <span className="text-xl font-bold text-circle-charcoal dark:text-circle-dark-text">
                                  {getInitials(formName || activeCircle.name)}
                                </span>
                              )}

                              {isUploadingMedia && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={isUploadingMedia}
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-circle-primary text-circle-charcoal shadow-md hover:scale-110 active:scale-95 transition-all"
                              title={t.circle.uploadFromDevice}
                            >
                              <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                          </div>

                          {/* Quick Avatar Presets */}
                          <div className="w-full space-y-2 text-center pt-1">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setFormAvatar('')}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                                  !formAvatar
                                    ? 'border-circle-primary ring-2 ring-circle-primary/30 bg-circle-primary text-circle-charcoal'
                                    : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate'
                                }`}
                                title={t.circle.defaultInitialsPreset}
                              >
                                {getInitials(formName || activeCircle.name)}
                              </button>

                              {AVATAR_PRESETS.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormAvatar(preset)}
                                  className={`relative h-8 w-8 rounded-full overflow-hidden border transition-all ${
                                    formAvatar === preset
                                      ? 'border-circle-primary ring-2 ring-circle-primary/40 scale-105'
                                      : 'border-circle-hairline dark:border-circle-dark-hairline opacity-75 hover:opacity-100'
                                  }`}
                                >
                                  <img src={preset} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                                </button>
                              ))}

                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingMedia}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white transition-all"
                                title={t.circle.uploadFromDevice}
                              >
                                {isUploadingMedia ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-circle-sage dark:text-circle-dark-primary" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Circle Name Field */}
                        <div>
                          <label className="block text-xs font-semibold text-circle-charcoal dark:text-white mb-1.5">
                            {t.circle.nameLabel}
                          </label>
                          <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder={t.circle.namePlaceholder}
                            maxLength={50}
                            required
                            className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-white focus:outline-none focus:ring-1 focus:ring-circle-primary shadow-xs"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEditChatInfo}
                            className="px-3.5 py-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline text-xs font-semibold text-circle-slate dark:text-white/70 hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-white transition-all"
                          >
                            {t.circle.cancelEdit}
                          </button>
                          <button
                            type="submit"
                            disabled={updateCircleMutation.isPending || isUploadingMedia}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>{updateCircleMutation.isPending ? t.circle.savingChanges : t.circle.saveChanges}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Cụm 2: MÃ MỜI & LIÊN KẾT */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.circle.inviteCodeAndLink}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5 divide-y divide-circle-hairline dark:divide-circle-dark-hairline">
                    <div className="flex items-center justify-between pb-3">
                      <div>
                        <p className="text-xs font-semibold text-circle-charcoal dark:text-white">
                          {t.circle.inviteCodeLabel}
                        </p>
                        <p className="font-mono text-sm font-bold text-circle-sage dark:text-circle-dark-primary mt-0.5">
                          {currentInviteCode}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(currentInviteCode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas hover:bg-circle-canvas dark:hover:bg-circle-dark-wash text-xs font-semibold text-circle-charcoal dark:text-white transition-all shadow-xs"
                      >
                        {copiedCode === currentInviteCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode === currentInviteCode ? t.circle.copiedInviteCode : t.circle.copyCodeBtn}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-semibold text-circle-charcoal dark:text-white">
                          {t.circle.linkTitle}
                        </p>
                        <p className="text-xs text-circle-slate dark:text-white/60 truncate font-mono mt-0.5">
                          {inviteLink}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas hover:bg-circle-canvas dark:hover:bg-circle-dark-wash text-xs font-semibold text-circle-charcoal dark:text-white transition-all shadow-xs"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedLink ? t.circle.copiedInviteLink : t.circle.copyLinkBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleShare}
                          title={t.circle.shareInvite}
                          className="p-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas hover:bg-circle-canvas dark:hover:bg-circle-dark-wash text-circle-slate dark:text-white/70 hover:text-circle-charcoal dark:hover:text-white transition-all"
                        >
                          {sharedDone ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cụm 3: MÀU CHỦ ĐỀ TIN NHẮN (BỎ GIẢI THÍCH TÊN MÀU) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60">
                      {t.circle.chatThemeTitle}
                    </span>
                    {themeSuccessNotice && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5 animate-fadeIn">
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>{t.circle.themeUpdatedToast}</span>
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      {(Object.keys(MessageBubbleThemes) as MessageTheme[]).map((key) => {
                        const item = MessageBubbleThemes[key];
                        const isSelected = formThemeColor === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleThemeColorChange(key)}
                            title={item.name}
                            className="relative p-1 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                          >
                            <span
                              className="h-8 w-8 rounded-full transition-all flex items-center justify-center shadow-xs"
                              style={{
                                backgroundColor: item.color,
                                outline: isSelected ? `2.5px solid ${item.color}` : 'none',
                                outlineOffset: '2.5px',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: THÀNH VIÊN & YÊU CẦU THAM GIA (SEGMENTED SLIDER & PERSISTENT ADD BUTTON)
               ========================================================================= */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Segmented SubTab Slider & Action Top Bar */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
                  {/* Segmented Toggle Pill */}
                  <div className="flex items-center p-1 rounded-xl bg-circle-canvas dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline">
                    <button
                      type="button"
                      onClick={() => setMembersSubTab('roster')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        membersSubTab === 'roster'
                          ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-xs'
                          : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
                      }`}
                    >
                      {t.circle.membersSubTab}
                    </button>
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setMembersSubTab('requests')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          membersSubTab === 'requests'
                            ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-xs'
                            : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white'
                        }`}
                      >
                        <span>{t.circle.joinRequestsSubTab} ({joinRequests.length})</span>
                        {joinRequests.length > 0 && (
                          <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-red-500 text-white font-bold">
                            {joinRequests.length}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Nút Thêm thành viên — Luôn hiển thị ở cả 2 subtab */}
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white text-xs font-bold transition-all shadow-sm shrink-0"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{t.circle.addMemberBtn}</span>
                  </button>
                </div>

                {/* Sub-panel: Thêm bạn bè vào Vòng tròn */}
                {isAddMemberOpen && (
                  <div className="p-4 rounded-2xl border border-circle-primary/30 bg-circle-primary/5 dark:bg-circle-primary/10 space-y-3.5 animate-fade-in shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                        <UserPlus className="h-3.5 w-3.5 text-circle-sage dark:text-circle-dark-primary" />
                        <span>{t.circle.addMembersTitle}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddMemberOpen(false)}
                        className="p-1 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-white dark:hover:bg-circle-dark-surface"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Friend Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                      <input
                        type="text"
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        placeholder={t.circle.friendsSearchPlaceholder}
                        className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface pl-8 pr-3 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary"
                      />
                    </div>

                    {/* Selectable Users List */}
                    {friendSearch.trim().length > 0 ? (
                      isSearchingAddMembers ? (
                        <div className="flex items-center justify-center p-4 text-xs text-circle-slate dark:text-circle-dark-muted gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-circle-sage dark:text-circle-primary" />
                          <span>{t.circle.loadingFriends}</span>
                        </div>
                      ) : availableSearchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                          {t.circle.noSelectableFriends}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          <div className="flex justify-end pb-1">
                            <button
                              type="button"
                              onClick={handleSelectAllFriends}
                              className="text-[11px] font-semibold text-circle-sage dark:text-circle-dark-primary hover:underline"
                            >
                              {selectedFriendIds.length === displayedUsers.length
                                ? t.common.deselectAll
                                : t.common.selectAll}
                            </button>
                          </div>
                          {availableSearchResults.map((f) => {
                            const isSelected = selectedFriendIds.includes(f.id);
                            const initials = getInitials(f.displayName);
                            return (
                              <div
                                key={f.id}
                                onClick={() => handleToggleSelectFriend(f.id, f)}
                                className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-circle-primary bg-circle-primary/10'
                                    : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-canvas/50 dark:hover:bg-circle-dark-elevated'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-charcoal dark:bg-circle-dark-elevated text-white text-xs font-bold overflow-hidden">
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
                                    <p className="text-[10px] font-mono text-circle-sage dark:text-circle-dark-primary truncate">
                                      @{f.handle}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-circle-sage dark:text-circle-dark-primary shrink-0 pl-2">
                                  {isSelected ? (
                                    <CheckSquare className="h-4 w-4" />
                                  ) : (
                                    <Square className="h-4 w-4 text-circle-slate/50 dark:text-circle-dark-muted/60" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : availableRecentUsers.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        <div className="flex items-center justify-between px-1 text-[11px] text-circle-slate dark:text-circle-dark-muted font-medium">
                          <span className="flex items-center gap-1.5">
                            <History className="h-3 w-3" />
                            {t.circle.recentSearches}
                          </span>
                          <button
                            type="button"
                            onClick={handleSelectAllFriends}
                            className="text-[11px] font-semibold text-circle-sage dark:text-circle-dark-primary hover:underline"
                          >
                            {selectedFriendIds.length === displayedUsers.length
                              ? t.common.deselectAll
                              : t.common.selectAll}
                          </button>
                        </div>
                        {availableRecentUsers.map((f) => {
                          const isSelected = selectedFriendIds.includes(f.id);
                          const initials = getInitials(f.displayName);
                          return (
                            <div
                              key={f.id}
                              onClick={() => handleToggleSelectFriend(f.id, f)}
                              className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-circle-primary bg-circle-primary/10'
                                  : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-canvas/50 dark:hover:bg-circle-dark-elevated'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-charcoal dark:bg-circle-dark-elevated text-white text-xs font-bold overflow-hidden">
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
                                  <p className="text-[10px] font-mono text-circle-sage dark:text-circle-dark-primary truncate">
                                    @{f.handle}
                                  </p>
                                </div>
                              </div>
                              <div className="text-circle-sage dark:text-circle-dark-primary shrink-0 pl-2">
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4" />
                                ) : (
                                  <Square className="h-4 w-4 text-circle-slate/50 dark:text-circle-dark-muted/60" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted flex flex-col items-center justify-center gap-1.5">
                        <Search className="h-4 w-4 opacity-40 text-circle-slate dark:text-circle-dark-muted" />
                        <span>{t.circle.searchPrompt}</span>
                      </div>
                    )}

                    {/* Submit Add Members Button */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddMemberOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-white dark:hover:bg-circle-dark-surface hover:text-circle-charcoal dark:hover:text-white transition-colors"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={selectedFriendIds.length === 0 || addMembersMutation.isPending}
                        onClick={handleConfirmAddMembers}
                        className="px-4 py-1.5 rounded-xl bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                      >
                        {addMembersMutation.isPending
                          ? t.common.loading
                          : `${t.circle.addMembersSubmit} (${selectedFriendIds.length})`}
                      </button>
                    </div>
                  </div>
                )}

                {/* SubTab 1: Member Roster List */}
                {membersSubTab === 'roster' && (
                  isLoadingMembers ? (
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
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-xs font-bold shadow-sm flex-shrink-0 overflow-hidden">
                                  {m.user?.profile?.avatarUrl ? (
                                    <img src={m.user.profile.avatarUrl} alt={displayTitle || 'Member'} className="h-full w-full object-cover" />
                                  ) : (
                                    initials
                                  )}
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
                                        className="p-1 rounded-md border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                                        {displayTitle}
                                      </h4>
                                      {hasNickname && (
                                        <span className="text-xs text-circle-slate dark:text-circle-dark-muted truncate">
                                          ({realDisplayName})
                                        </span>
                                      )}
                                      {isSelf && (
                                        <span className="rounded-full px-2 py-0.2 text-[10px] font-medium bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted">
                                          {t.circle.youBadge}
                                        </span>
                                      )}
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
                                </div>
                              </div>

                              {/* Role Badge & Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {m.role === MemberRole.OWNER ? (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text border border-circle-hairline dark:border-circle-dark-hairline">
                                    <Crown className="h-3 w-3 text-circle-slate dark:text-circle-dark-muted" />
                                    <span>{t.circle.memberRoleOwner}</span>
                                  </span>
                                ) : (
                                  <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted border border-circle-hairline dark:border-circle-dark-hairline">
                                    {t.circle.memberRoleMember}
                                  </span>
                                )}

                                {isOwner && !isSelf && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setConfirmTransferMemberId(m.id)}
                                      title={t.circle.transferOwnership}
                                      className="p-1.5 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted transition-colors"
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
                  )
                )}

                {/* SubTab 2: Join Requests List */}
                {membersSubTab === 'requests' && isOwnerOrAdmin && (
                  <div className="space-y-3 pt-1">
                    {joinRequests.length === 0 ? (
                      <p className="py-8 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
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
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-circle-charcoal dark:bg-circle-dark-elevated text-white text-xs font-bold overflow-hidden">
                                  {req.user?.profile?.avatarUrl ? (
                                    <img src={req.user.profile.avatarUrl} alt={requesterName || 'Requester'} className="h-full w-full object-cover" />
                                  ) : (
                                    reqInitials
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                                    {requesterName}
                                  </h5>
                                  {req.message && (
                                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted italic truncate">
                                      &ldquo;{req.message}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleReviewRequest(req.id, 'APPROVED')}
                                  disabled={reviewRequestMutation.isPending}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  <span>{t.circle.approveJoinRequest}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReviewRequest(req.id, 'REJECTED')}
                                  disabled={reviewRequestMutation.isPending}
                                  className="px-2.5 py-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-all"
                                >
                                  {t.circle.rejectJoinRequest}
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

            {/* =========================================================================
                TAB 3: THÔNG BÁO & QUYỀN RIÊNG TƯ (CLUSTERED CARDS)
               ========================================================================= */}
            {activeTab === 'privacySupport' && (
              <div className="space-y-5">
                {/* Cụm 1: CÀI ĐẶT THÔNG BÁO */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.circle.notificationsTitle}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5 divide-y divide-circle-hairline/60 dark:divide-circle-dark-hairline/60">
                    {/* 1.1 Tắt thông báo về đoạn chat */}
                    <div className="pb-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          {isChatMuted ? (
                            <BellOff className="h-4 w-4 text-red-500 shrink-0" />
                          ) : (
                            <Bell className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                          )}
                          <div>
                            <span className="text-xs font-semibold text-circle-charcoal dark:text-white block">
                              {t.circle.muteChat}
                            </span>
                          </div>
                        </div>

                        {/* Switch Toggle */}
                        <button
                          type="button"
                          disabled={notificationBusy}
                              onClick={handleToggleChatMute}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isChatMuted ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isChatMuted ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Chọn thời gian tắt thông báo */}
                      {isChatMuted && (
                        <div className="pt-2 space-y-2 animate-fade-in">
                          <span className="text-[11px] font-semibold text-circle-slate dark:text-white/60">
                            {t.circle.muteChatUntil}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                            {[
                              { key: '15m', label: t.circle.notificationMute15m },
                              { key: '1h', label: t.circle.notificationMute1h },
                              { key: '8h', label: t.circle.notificationMute8h },
                              { key: '24h', label: t.circle.notificationMute24h },
                              { key: 'forever', label: t.circle.muteUntilTurnOn },
                            ].map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                disabled={notificationBusy}
                              onClick={() => handleSelectMuteDuration(item.key)}
                                className={`px-2 py-1.5 rounded-xl text-[11px] font-medium transition-all text-center truncate ${
                                  muteDuration === item.key
                                    ? 'bg-red-500 text-white font-bold shadow-xs'
                                    : 'bg-white dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate dark:text-white/70 hover:bg-circle-canvas dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-white'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 1.2 Mức độ thông báo tin nhắn */}
                    {!isChatMuted && (
                      <div className="py-3.5 space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                          <span className="text-xs font-semibold text-circle-charcoal dark:text-white">
                            {t.circle.messageNotifications}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {[
                            { key: 'all' as const, label: t.circle.msgNotifyAll },
                            { key: 'mentions' as const, label: t.circle.msgNotifyMentions },
                            { key: 'none' as const, label: t.circle.msgNotifyNone },
                          ].map((lvl) => (
                            <button
                              key={lvl.key}
                              type="button"
                              onClick={() => handleChangeMessageNotificationLevel(lvl.key)}
                              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-center ${
                                messageNotificationLevel === lvl.key
                                  ? 'bg-circle-primary text-circle-charcoal dark:text-circle-dark-canvas font-bold shadow-xs'
                                  : 'bg-white dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate dark:text-white/70 hover:bg-circle-canvas dark:hover:bg-circle-dark-wash hover:text-circle-charcoal dark:hover:text-white'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 1.3 Tắt thông báo về cuộc gọi */}
                    {!isChatMuted && (
                      <div className="flex items-center justify-between gap-4 py-3.5 animate-fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1 text-circle-slate dark:text-white/60">
                            <Phone className="h-4 w-4 shrink-0" />
                            <Video className="h-4 w-4 shrink-0" />
                          </div>
                          <span className="text-xs font-semibold text-circle-charcoal dark:text-white">
                            {t.circle.muteCalls}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleToggleCallsMute}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isCallsMuted ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isCallsMuted ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* 1.4 Âm thanh thông báo & hiệu ứng */}
                    <div className="flex items-center justify-between gap-4 py-3.5 animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <Volume2 className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-circle-charcoal dark:text-white block">
                            {t.circle.soundEffectsTitle}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={toggleSound}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          soundEnabled ? 'bg-circle-primary' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            soundEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 1.5 Tắt thông báo từ thành viên cụ thể */}
                    <div className="pt-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <VolumeX className="h-4 w-4 text-circle-slate dark:text-white/60 shrink-0" />
                          <span className="text-xs font-semibold text-circle-charcoal dark:text-white">
                            {t.circle.muteMemberNotificationsTitle}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsManageMutedMembersOpen(!isManageMutedMembersOpen)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas hover:bg-circle-canvas dark:hover:bg-circle-dark-wash text-xs font-semibold text-circle-charcoal dark:text-white shadow-xs transition-all shrink-0"
                        >
                          <span>{isManageMutedMembersOpen ? t.common.collapse : t.circle.manageMutedMembers}</span>
                          {mutedMemberIds.length > 0 && (
                            <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-amber-500 text-white font-bold">
                              {mutedMemberIds.length}
                            </span>
                          )}
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isManageMutedMembersOpen ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {isManageMutedMembersOpen && (
                        <div className="pt-2 space-y-3 animate-fade-in">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-circle-slate" />
                            <input
                              type="text"
                              value={memberMuteSearch}
                              onChange={(e) => setMemberMuteSearch(e.target.value)}
                              placeholder={t.circle.muteMemberPlaceholder}
                              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas pl-8 pr-3 py-1.5 text-xs text-circle-charcoal dark:text-white focus:outline-none focus:ring-1 focus:ring-circle-primary"
                            />
                          </div>

                          <div className="space-y-1 max-h-44 overflow-y-auto pr-1 divide-y divide-circle-hairline/40 dark:divide-circle-dark-hairline/40">
                            {filteredMuteMembers.length === 0 ? (
                              <p className="text-center py-4 text-xs text-circle-slate dark:text-white/60">
                                {memberMuteSearch ? t.circle.noMemberFound : t.circle.noOtherMembersInGroup}
                              </p>
                            ) : (
                              filteredMuteMembers.map((m) => {
                                const isMuted = mutedMemberIds.includes(m.userId);
                                const memberName = m.nickname || m.user?.profile?.displayName || m.user?.email?.split('@')[0] || t.auth.member;
                                const initials = getInitials(memberName);

                                return (
                                  <div key={m.id} className="pt-2 pb-1.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-circle-charcoal text-white text-[11px] font-bold overflow-hidden">
                                        {m.user?.profile?.avatarUrl ? (
                                          <img src={m.user.profile.avatarUrl} alt={memberName} className="h-full w-full object-cover" />
                                        ) : (
                                          initials
                                        )}
                                      </div>
                                      <span className="text-xs font-semibold text-circle-charcoal dark:text-white truncate">
                                        {memberName}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleMuteMember(m.userId)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs ${
                                        isMuted
                                          ? 'bg-red-500 text-white'
                                          : 'border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas text-circle-slate dark:text-white/70 hover:text-circle-charcoal dark:hover:text-white'
                                      }`}
                                    >
                                      {isMuted ? (
                                        <>
                                          <VolumeX className="h-3 w-3" />
                                          <span>{t.circle.unmuteAction}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Volume2 className="h-3 w-3" />
                                          <span>{t.circle.muteAction}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cụm 2: QUYỀN RIÊNG TƯ TRONG NHÓM */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.circle.privacySection}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5 divide-y divide-circle-hairline/60 dark:divide-circle-dark-hairline/60">
                    {/* 2.1 Thông báo đã đọc */}
                    <div className="flex items-center justify-between gap-4 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        {readReceipts ? (
                          <Eye className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-circle-slate dark:text-white/60 shrink-0" />
                        )}
                        <div>
                          <span className="text-xs font-semibold text-circle-charcoal dark:text-white block">
                            {t.circle.readReceiptsTitle}
                          </span>
                          <span className="text-[11px] text-circle-slate dark:text-white/60 block">
                            {t.circle.readReceiptsDesc}
                          </span>
                        </div>
                      </div>

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

                    {/* 2.2 Chỉ báo đang soạn tin */}
                    <div className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Keyboard className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-circle-charcoal dark:text-white block">
                            {t.circle.typingIndicatorTitle}
                          </span>
                          <span className="text-[11px] text-circle-slate dark:text-white/60 block">
                            {t.circle.typingIndicatorDesc}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleTypingIndicator}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showTypingIndicator ? 'bg-circle-primary' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showTypingIndicator ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 2.3 Cho phép AI xử lý nội dung */}
                    <div className="flex items-center justify-between gap-4 pt-3.5">
                      <div className="flex items-center gap-2.5">
                        <Bot className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-circle-charcoal dark:text-white block">
                            {t.circle.aiAssistanceTitle}
                          </span>
                          <span className="text-[11px] text-circle-slate dark:text-white/60 block">
                            {t.circle.aiAssistanceDesc}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleAiProcessing}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          allowAiProcessing ? 'bg-circle-primary' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            allowAiProcessing ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: THIẾT LẬP VÒNG TRÒN & VÙNG NGUY HIỂM (CLUSTERED CARDS)
               ========================================================================= */}
            {activeTab === 'circleSettings' && (
              <div className="space-y-5">
                {/* Cụm 1: QUY MÔ & PHÊ DUYỆT THAM GIA */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.circle.joinScopeSection}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5 divide-y divide-circle-hairline/60 dark:divide-circle-dark-hairline/60">
                    {/* Cần trưởng nhóm phê duyệt */}
                    <div className="flex items-center justify-between gap-4 pb-3.5">
                      <div>
                        <span className="text-xs font-semibold text-circle-charcoal dark:text-white block">
                          {t.circle.requireApprovalTitle}
                        </span>
                        <span className="text-[11px] text-circle-slate dark:text-white/60 block">
                          {formIsPrivate ? t.circle.privacyPrivateDesc : t.circle.privacyPublicDesc}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!isOwner}
                        onClick={handleToggleApproval}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          formIsPrivate ? 'bg-circle-primary' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formIsPrivate ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Số lượng thành viên tối đa */}
                    <div className="pt-3.5 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-circle-charcoal dark:text-white flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary" />
                          <span>{t.circle.maxMembersLabel}</span>
                        </span>

                        <div className="relative shrink-0 w-full sm:w-52">
                          <select
                            disabled={!isOwner}
                            value={isCustomCapacity || formMaxMembers !== null ? 'limited' : 'unlimited'}
                            onChange={(e) => handleCapacityChange(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas px-3 py-2 pr-8 text-xs font-semibold text-circle-charcoal dark:text-white focus:outline-none focus:ring-1 focus:ring-circle-primary shadow-xs cursor-pointer disabled:opacity-60"
                          >
                            <option value="unlimited">{t.circle.unlimited}</option>
                            <option value="limited">{t.circle.limited}</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-circle-slate dark:text-white/60">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>

                      {(isCustomCapacity || formMaxMembers !== null) && (
                        <div className="pt-1 animate-fade-in flex items-center gap-2">
                          <input
                            type="number"
                            min={2}
                            max={10000}
                            value={formMaxMembers ?? ''}
                            onChange={(e) => handleCustomCapacityChange(e.target.value)}
                            onBlur={handleCustomCapacityBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            disabled={!isOwner}
                            placeholder={t.circle.maxMembersPlaceholder}
                            className="flex-1 rounded-xl border border-circle-primary bg-white dark:bg-circle-dark-canvas px-3 py-1.5 text-xs text-circle-charcoal dark:text-white focus:outline-none focus:ring-1 focus:ring-circle-primary shadow-xs"
                          />
                          <span className="text-[11px] text-circle-slate dark:text-white/60 shrink-0">
                            {t.circle.membersTitle.toLowerCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cụm 2: VÙNG NGUY HIỂM (DANGER ZONE) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 px-1">
                    {t.circle.dangerZone}
                  </span>
                  <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-circle-charcoal dark:text-white">
                          {isOwner ? t.circle.deleteCircle : t.circle.leaveCircle}
                        </p>
                        <p className="text-xs text-circle-slate dark:text-white/60 mt-0.5 leading-relaxed">
                          {isOwner ? t.circle.deleteCircleConfirm : t.circle.confirmLeaveWarning}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => isOwner ? setConfirmDeleteCircle(true) : setConfirmLeave(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        {isOwner ? <Trash2 className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                        <span>{isOwner ? t.circle.deleteCircle : t.circle.leaveCircle}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 5: TRỢ GIÚP & BÁO CÁO (CLUSTERED CARDS)
               ========================================================================= */}
            {activeTab === 'supportReports' && (
              <div className="space-y-5">
                {/* Cụm 1: BÁO CÁO VI PHẠM */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.circle.reportsViolationTitle || 'BÁO CÁO VI PHẠM'}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5 divide-y divide-circle-hairline/60 dark:divide-circle-dark-hairline/60">
                    {/* Báo cáo vi phạm Vòng tròn */}
                    <div className="py-2 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-xs font-bold text-circle-charcoal dark:text-white">
                              {t.circle.reportCircleTitle}
                            </h5>
                            <p className="text-xs text-circle-slate dark:text-white/60 mt-0.5">
                              {t.circle.reportCircleDesc}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsReportOpen(!isReportOpen);
                            setIsReportUserOpen(false);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            isReportOpen
                              ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas text-circle-charcoal dark:text-white hover:border-amber-500/40 hover:bg-amber-500/5'
                          }`}
                        >
                          {isReportOpen ? t.common.collapse : t.circle.reportCircleBtn}
                        </button>
                      </div>

                      {/* Sub-form Báo cáo vi phạm Vòng tròn */}
                      {isReportOpen && (
                        <form
                          onSubmit={handleSubmitReport}
                          className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 p-4 space-y-3.5 animate-fadeIn"
                        >
                          <h6 className="text-xs font-bold text-circle-charcoal dark:text-white">
                            {t.circle.reportReasonLabel}
                          </h6>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { key: 'harassment', label: t.circle.reportReasonHarassment },
                              { key: 'spam', label: t.circle.reportReasonSpam },
                              { key: 'inappropriate', label: t.circle.reportReasonInappropriate },
                              { key: 'impersonation', label: t.circle.reportReasonImpersonation },
                              { key: 'other', label: t.circle.reportReasonOther },
                            ].map((reason) => {
                              const isChecked = reportReason === reason.key;
                              return (
                                <label
                                  key={reason.key}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 text-xs font-medium ${
                                    isChecked
                                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                      : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="reportReason"
                                    value={reason.key}
                                    checked={isChecked}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="accent-amber-600"
                                  />
                                  <span>{reason.label}</span>
                                </label>
                              );
                            })}
                          </div>

                          {reportReason === 'other' && (
                            <div className="space-y-1">
                              <textarea
                                value={customReportText}
                                onChange={(e) => setCustomReportText(e.target.value)}
                                placeholder={t.circle.reportReasonOtherPlaceholder}
                                rows={2}
                                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-3 text-xs text-circle-charcoal dark:text-white placeholder:text-circle-slate focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                              {reportFieldError && (
                                <p className="text-xs text-red-500">{reportFieldError}</p>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsReportOpen(false)}
                              className="px-3.5 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline text-xs font-semibold text-circle-slate dark:text-white/70 hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                            >
                              {t.common.cancel}
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                            >
                              {t.circle.sendReportBtn}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Báo cáo người dùng vi phạm */}
                    <div className="py-2 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <UserX className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-xs font-bold text-circle-charcoal dark:text-white">
                              {t.circle.reportUserTitle}
                            </h5>
                            <p className="text-xs text-circle-slate dark:text-white/60 mt-0.5">
                              {t.circle.reportUserDesc}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsReportUserOpen(!isReportUserOpen);
                            setIsReportOpen(false);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            isReportUserOpen
                              ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas text-circle-charcoal dark:text-white hover:border-amber-500/40 hover:bg-amber-500/5'
                          }`}
                        >
                          {isReportUserOpen ? t.common.collapse : t.circle.reportUserBtn}
                        </button>
                      </div>

                      {/* Sub-form Báo cáo người dùng */}
                      {isReportUserOpen && (
                        <form
                          onSubmit={handleSubmitReportUser}
                          className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 p-4 space-y-3.5 animate-fadeIn"
                        >
                          <div className="space-y-1.5">
                            <h6 className="text-xs font-bold text-circle-charcoal dark:text-white">
                              {t.circle.selectReportUserPrompt}
                            </h6>
                            <select
                              value={reportedUserId}
                              onChange={(e) => setReportedUserId(e.target.value)}
                              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3 py-2 text-xs text-circle-charcoal dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">{t.circle.selectMemberDefaultOption}</option>
                              {members
                                .filter((m) => m.userId !== user?.id)
                                .map((m) => (
                                  <option key={m.id} value={m.userId}>
                                    {m.nickname || m.user?.profile?.displayName || m.user?.email || 'Member'}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <h6 className="text-xs font-bold text-circle-charcoal dark:text-white">
                              {t.circle.reportReasonLabel}
                            </h6>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { key: 'harassment', label: t.circle.reportReasonHarassment },
                                { key: 'spam', label: t.circle.reportReasonSpam },
                                { key: 'inappropriate', label: t.circle.reportReasonInappropriate },
                                { key: 'impersonation', label: t.circle.reportReasonImpersonation },
                                { key: 'other', label: t.circle.reportReasonOther },
                              ].map((reason) => {
                                const isChecked = reportUserReason === reason.key;
                                return (
                                  <label
                                    key={reason.key}
                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 text-xs font-medium ${
                                      isChecked
                                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                        : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-white hover:bg-circle-wash dark:hover:bg-circle-dark-wash'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="reportUserReason"
                                      value={reason.key}
                                      checked={isChecked}
                                      onChange={(e) => setReportUserReason(e.target.value)}
                                      className="accent-amber-600"
                                    />
                                    <span>{reason.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {reportUserReason === 'other' && (
                            <div className="space-y-1">
                              <textarea
                                value={customReportUserText}
                                onChange={(e) => setCustomReportUserText(e.target.value)}
                                placeholder={t.circle.reportDetailPlaceholder}
                                rows={2}
                                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-3 text-xs text-circle-charcoal dark:text-white placeholder:text-circle-slate focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          )}

                          {reportUserFieldError && (
                            <p className="text-xs text-red-500">{reportUserFieldError}</p>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsReportUserOpen(false)}
                              className="px-3.5 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline text-xs font-semibold text-circle-slate dark:text-white/70 hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                            >
                              {t.common.cancel}
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                            >
                              {t.circle.sendReportBtn}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cụm 2: HƯỚNG DẪN & TIÊU CHUẨN CỘNG ĐỒNG */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.circle.communityGuidelinesHeader || 'HỖ TRỢ & HƯỚNG DẪN CỘNG ĐỒNG'}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/30 dark:bg-circle-dark-surface p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <HelpCircle className="h-4 w-4 text-circle-sage dark:text-circle-dark-primary shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-circle-charcoal dark:text-white">
                            {t.circle.helpCenterTitle}
                          </h5>
                          <p className="text-xs text-circle-slate dark:text-white/60 mt-0.5">
                            {t.circle.safeGuideTitle}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsHelpOpen(!isHelpOpen)}
                        className="px-3.5 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas hover:bg-circle-canvas dark:hover:bg-circle-dark-wash text-xs font-semibold text-circle-charcoal dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <span>{isHelpOpen ? t.common.collapse : t.common.viewGuide}</span>
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isHelpOpen ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {isHelpOpen && (
                      <div className="pt-2 grid grid-cols-1 gap-2 animate-fadeIn">
                        {[t.circle.safeRule1, t.circle.safeRule2, t.circle.safeRule3].map((rule, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white dark:bg-circle-dark-canvas border border-circle-hairline dark:border-circle-dark-hairline text-xs text-circle-charcoal dark:text-white/80 flex items-start gap-2.5 leading-relaxed"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-circle-wash dark:bg-circle-dark-wash text-[11px] font-bold text-circle-sage dark:text-circle-dark-primary">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{rule}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Unified Confirmation Modals (Rule 9) */}
      <ConfirmModal
        isOpen={!!confirmKickMemberId}
        onClose={() => setConfirmKickMemberId(null)}
        onConfirm={() => {
          if (confirmKickMemberId) handleKickMember(confirmKickMemberId);
        }}
        title={t.circle.confirmKickTitle}
        description={t.circle.confirmKickWarning}
        confirmLabel={t.circle.kickMember}
        variant="danger"
        isLoading={removeMemberMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!confirmTransferMemberId}
        onClose={() => setConfirmTransferMemberId(null)}
        onConfirm={() => {
          if (confirmTransferMemberId) handleTransferOwnership(confirmTransferMemberId);
        }}
        title={t.circle.confirmTransferTitle}
        description={t.circle.confirmTransferWarning}
        confirmLabel={t.circle.transferOwnership}
        variant="warning"
        isLoading={transferOwnershipMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={handleLeaveCircle}
        title={t.circle.confirmLeaveTitle}
        description={t.circle.confirmLeaveWarning}
        confirmLabel={t.circle.leaveCircle}
        variant="danger"
        isLoading={leaveCircleMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmDeleteCircle}
        onClose={() => setConfirmDeleteCircle(false)}
        onConfirm={handleDeleteCircle}
        title={t.circle.deleteCircle}
        description={t.circle.deleteCircleConfirm}
        confirmLabel={t.circle.deleteCircle}
        variant="danger"
        isLoading={deleteCircleMutation.isPending}
      />
    </div>
  );
};
