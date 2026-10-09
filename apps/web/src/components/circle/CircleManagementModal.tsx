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
  PhoneCall,
  PhoneOff,
  Shield,
  Bot,
  Keyboard,
  UserMinus,
  VolumeX,
  Volume2,
  ChevronDown,
  Trash2,
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
  useDeleteCircleMutation,
  useCreateReportMutation,
} from '@/hooks/use-circle-queries';
import { useUploadMedia } from '@/hooks/use-upload-media';
import { MemberRole } from '@circle/types';

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

  // Sync tab & form values when opened or activeCircle changes
  useEffect(() => {
    if (isManageModalOpen && activeCircle) {
      setActiveTab(getInitialTab());
      if (manageActiveTab === 'requests') {
        setMembersSubTab('requests');
      } else {
        setMembersSubTab('roster');
      }
      setErrorMessage(null);
      setSuccessMessage(null);
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

      // Load personal preferences from localStorage if available
      try {
        const storedReceipts = localStorage.getItem(`circle_${activeCircle.id}_read_receipts`);
        if (storedReceipts !== null) setReadReceipts(storedReceipts === 'true');

        const storedTyping = localStorage.getItem(`circle_${activeCircle.id}_typing_indicator`);
        if (storedTyping !== null) setShowTypingIndicator(storedTyping === 'true');

        const storedAi = localStorage.getItem(`circle_${activeCircle.id}_ai_processing`);
        if (storedAi !== null) setAllowAiProcessing(storedAi === 'true');

        const storedChatMute = localStorage.getItem(`circle_${activeCircle.id}_chat_muted`);
        if (storedChatMute !== null) {
          setIsChatMuted(storedChatMute === 'true');
        } else {
          const legacyMute = localStorage.getItem(`circle_${activeCircle.id}_notification_mute`);
          setIsChatMuted(legacyMute !== null && legacyMute !== 'all');
        }

        const storedDuration = localStorage.getItem(`circle_${activeCircle.id}_mute_duration`);
        if (storedDuration) setMuteDuration(storedDuration);

        const storedMsgLevel = localStorage.getItem(`circle_${activeCircle.id}_msg_level`);
        if (storedMsgLevel === 'all' || storedMsgLevel === 'mentions' || storedMsgLevel === 'none') {
          setMessageNotificationLevel(storedMsgLevel);
        }

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
    const cleanTerm = term.replace(/^@/, '');
    return (
      f.displayName.toLowerCase().includes(term) ||
      (f.handle && f.handle.toLowerCase().includes(cleanTerm)) ||
      f.email.toLowerCase().includes(term)
    );
  });

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
      setErrorMessage(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
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
    } else if (target > 10000) {
      target = 10000;
      setFormMaxMembers(10000);
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

  const handleToggleChatMute = () => {
    const next = !isChatMuted;
    setIsChatMuted(next);
    try {
      localStorage.setItem(`circle_${circleId}_chat_muted`, String(next));
      if (!next) {
        localStorage.setItem(`circle_${circleId}_notification_mute`, 'all');
      } else {
        localStorage.setItem(`circle_${circleId}_notification_mute`, muteDuration);
      }
    } catch {}
  };

  const handleSelectMuteDuration = (duration: string) => {
    setMuteDuration(duration);
    try {
      localStorage.setItem(`circle_${circleId}_mute_duration`, duration);
      localStorage.setItem(`circle_${circleId}_notification_mute`, duration);
    } catch {}
  };

  const handleChangeMessageNotificationLevel = (level: 'all' | 'mentions' | 'none') => {
    setMessageNotificationLevel(level);
    try {
      localStorage.setItem(`circle_${circleId}_msg_level`, level);
    } catch {}
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
      setReportFieldError(err?.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.');
    }
  };

  const handleSubmitReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportUserFieldError(null);
    if (!reportedUserId) {
      setReportUserFieldError('Vui lòng chọn thành viên cần báo cáo');
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
      setSuccessMessage('Đã gửi báo cáo người dùng. Ban quản trị sẽ xác minh vi phạm trong thời gian sớm nhất!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setReportUserFieldError(err?.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.');
    }
  };

  if (!isManageModalOpen || !activeCircle) return null;

  const getDurationLabel = (dur: string) => {
    switch (dur) {
      case '15m': return t.circle.notificationMute15m || '15 phút';
      case '1h': return t.circle.notificationMute1h || '1 giờ';
      case '8h': return t.circle.notificationMute8h || '8 giờ';
      case '24h': return t.circle.notificationMute24h || '24 giờ';
      case 'forever': return t.circle.muteUntilTurnOn || 'Cho đến khi tôi bật lại';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-circle-charcoal/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Khung cố định (Fixed Dimensions Window) */}
      <div className="relative w-full max-w-4xl h-[640px] max-h-[92vh] bg-white dark:bg-circle-dark-surface rounded-3xl shadow-circle-card border border-circle-hairline dark:border-circle-dark-hairline flex flex-col md:flex-row overflow-hidden">
        
        {/* =========================================================================
            CỘT TRÁI CỐ ĐỊNH (FIXED LEFT NAVIGATION FRAME)
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-full px-2 py-0.5 text-[10px] bg-circle-canvas dark:bg-circle-dark-canvas">
                    {members.length}
                  </span>
                  {joinRequests.length > 0 && isOwner && (
                    <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-red-500 text-white font-bold animate-pulse">
                      {joinRequests.length}
                    </span>
                  )}
                </div>
              </button>

              {/* Tab 3: Thông báo & Quyền riêng tư */}
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
                <Bell className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.circle.notificationsAndPrivacyTab || 'Thông báo & Quyền riêng tư'}</span>
              </button>

              {/* Tab 4: Thiết lập Vòng tròn */}
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
                  <span className="truncate">{t.circle.circleSettingsTab || 'Thiết lập Vòng tròn'}</span>
                </div>
              </button>

              {/* Tab 5: Trợ giúp & Báo cáo */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('supportReports');
                  setIsAddMemberOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 md:w-full text-left ${
                  activeTab === 'supportReports'
                    ? 'bg-circle-primary text-circle-charcoal shadow-sm'
                    : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text'
                }`}
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.circle.supportAndReportsTab || 'Trợ giúp & Báo cáo'}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* =========================================================================
            KHUNG NỘI DUNG BÊN PHẢI (RIGHT CONTENT PANE)
           ========================================================================= */}
        <main className="flex-1 h-full flex flex-col overflow-hidden bg-white dark:bg-circle-dark-surface">
          {/* Header Bar with Tab Title & Close Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
              {activeTab === 'chatInfo' && t.circle.chatInfoTitle}
              {activeTab === 'members' && t.circle.settingsTabMembers}
              {activeTab === 'privacySupport' && (t.circle.notificationsAndPrivacyTab || 'Thông báo & Quyền riêng tư')}
              {activeTab === 'circleSettings' && t.circle.circleSettingsTab}
              {activeTab === 'supportReports' && (t.circle.supportAndReportsTab || 'Trợ giúp & Báo cáo')}
            </h3>
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

          {/* Hidden File Input for Avatar Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileUpload}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* =========================================================================
                TAB 1: THÔNG TIN ĐOẠN CHAT (VIEW MODE VS EDIT MODE WITH PENCIL & AVATAR)
               ========================================================================= */}
            {activeTab === 'chatInfo' && (
              <div className="space-y-6">
                {!isEditingChatInfo ? (
                  /* VIEW MODE: Clean Profile Header Card with Pencil Button */
                  <div className="space-y-5">
                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-3xl bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 border border-circle-hairline dark:border-circle-dark-hairline shadow-sm">
                      {/* Avatar Display */}
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal font-bold text-2xl uppercase overflow-hidden shadow-md ring-4 ring-white dark:ring-circle-dark-surface">
                        {formAvatar ? (
                          <img src={formAvatar} alt={activeCircle.name} className="h-full w-full object-cover" />
                        ) : (
                          activeCircle.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      {/* Info & Pencil Action */}
                      <div className="min-w-0 flex-1 text-center sm:text-left space-y-1.5">
                        <div className="flex items-center justify-center sm:justify-between gap-3">
                          <h4 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {activeCircle.name}
                          </h4>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setIsEditingChatInfo(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text shadow-xs transition-all hover:scale-105"
                              title={t.circle.editChatInfo || 'Chỉnh sửa thông tin'}
                            >
                              <Pencil className="h-3.5 w-3.5 text-circle-primary" />
                              <span>{t.circle.editChatInfo || 'Chỉnh sửa'}</span>
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-circle-slate dark:text-circle-dark-muted font-mono truncate">
                          @{activeCircle.handle}
                        </p>

                        <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 text-xs text-circle-slate dark:text-circle-dark-muted">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Users className="h-3.5 w-3.5 text-circle-primary" />
                            {members.length} {t.circle.settingsTabMembers.toLowerCase()}
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            {activeCircle.isPrivate
                              ? (t.circle.requireApprovalTitle || 'Cần phê duyệt')
                              : (t.circle.privacyPublic || 'Tham gia tự do')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Metadata Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-xs space-y-1">
                        <span className="text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted uppercase">
                          {t.circle.inviteCodeLabel || 'Mã nhóm'}
                        </span>
                        <p className="font-mono text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {currentInviteCode}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface shadow-xs space-y-1">
                        <span className="text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted uppercase">
                          {t.circle.maxMembersLabel || 'Quy mô thành viên'}
                        </span>
                        <p className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {activeCircle.maxMembers
                            ? `${activeCircle.maxMembers} thành viên tối đa`
                            : (t.circle.maxMembersUnlimited || 'Không giới hạn')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE: Form to update name and visual avatar */
                  <form onSubmit={handleSaveChatInfo} className="space-y-6 animate-fade-in">
                    {/* Visual Avatar Editor */}
                    <div className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 border border-circle-hairline dark:border-circle-dark-hairline">
                      <div className="relative group">
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-circle-primary/40 bg-circle-wash dark:bg-circle-dark-surface shadow-md overflow-hidden">
                          {formAvatar ? (
                            <img
                              src={formAvatar}
                              alt={formName || activeCircle.name}
                              className="h-full w-full object-cover"
                              onError={() => setFormAvatar('')}
                            />
                          ) : (
                            <span className="text-2xl font-bold text-circle-charcoal dark:text-circle-dark-text">
                              {getInitials(formName || activeCircle.name)}
                            </span>
                          )}

                          {/* Overlay spinner when uploading */}
                          {isUploadingMedia && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                          )}
                        </div>

                        {/* Camera trigger icon */}
                        <button
                          type="button"
                          disabled={isUploadingMedia}
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-2 rounded-full bg-circle-primary text-circle-charcoal shadow-md hover:scale-110 active:scale-95 transition-all"
                          title={t.circle.uploadFromDevice || 'Tải ảnh từ thiết bị'}
                        >
                          <Camera className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Quick Avatar Presets & Actions */}
                      <div className="w-full space-y-2 text-center pt-2">
                        <p className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                          {t.circle.changeAvatar || 'Đổi ảnh đại diện Vòng tròn'}
                        </p>

                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {/* Default Initials Option */}
                          <button
                            type="button"
                            onClick={() => setFormAvatar('')}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                              !formAvatar
                                ? 'border-circle-primary ring-2 ring-circle-primary/30 bg-circle-primary text-circle-charcoal'
                                : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate'
                            }`}
                            title="Mặc định viết tắt"
                          >
                            {getInitials(formName || activeCircle.name)}
                          </button>

                          {/* Quick Photo Presets */}
                          {AVATAR_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormAvatar(preset)}
                              className={`relative h-9 w-9 rounded-full overflow-hidden border transition-all ${
                                formAvatar === preset
                                  ? 'border-circle-primary ring-2 ring-circle-primary/40 scale-105'
                                  : 'border-circle-hairline dark:border-circle-dark-hairline opacity-75 hover:opacity-100'
                              }`}
                            >
                              <img src={preset} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                            </button>
                          ))}

                          {/* Upload from device button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingMedia}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate hover:text-circle-charcoal hover:bg-circle-canvas transition-all"
                            title={t.circle.uploadFromDevice || 'Tải ảnh từ thiết bị lên Cloud'}
                          >
                            {isUploadingMedia ? (
                              <Loader2 className="h-4 w-4 animate-spin text-circle-primary" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Circle Name Field */}
                    <div>
                      <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                        {t.circle.nameLabel}
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder={t.circle.namePlaceholder}
                        maxLength={50}
                        required
                        className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary shadow-xs"
                      />
                    </div>

                    {/* Action buttons (Save & Cancel) */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelEditChatInfo}
                        className="px-4 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline text-xs font-semibold text-circle-slate hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-all"
                      >
                        {t.circle.cancelEdit || 'Hủy'}
                      </button>
                      <button
                        type="submit"
                        disabled={updateCircleMutation.isPending || isUploadingMedia}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{updateCircleMutation.isPending ? t.circle.savingChanges : t.circle.saveChanges}</span>
                      </button>
                    </div>
                  </form>
                )}
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
                          : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                      }`}
                    >
                      {t.circle.membersSubTab || 'Thành viên'}
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setMembersSubTab('requests')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          membersSubTab === 'requests'
                            ? 'bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text shadow-xs'
                            : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                        }`}
                      >
                        <span>{t.circle.joinRequestsSubTab || 'Yêu cầu tham gia'} ({joinRequests.length})</span>
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
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal text-xs font-bold transition-all shadow-sm shrink-0"
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
                        <UserPlus className="h-3.5 w-3.5 text-circle-primary" />
                        <span>{t.circle.addMembersTitle}</span>
                      </h4>
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
                        placeholder="Tìm bạn bè..."
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
                                  <p className="text-[10px] font-mono text-circle-primary truncate">
                                    @{f.handle || f.email.split('@')[0]}
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
                                      {hasNickname && (
                                        <span className="text-xs text-circle-slate dark:text-circle-dark-muted truncate">
                                          ({realDisplayName})
                                        </span>
                                      )}
                                      {isSelf && (
                                        <span className="rounded-full px-2 py-0.2 text-[10px] font-medium bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate">
                                          Bạn
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
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                    <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
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
                  )
                )}

                {/* SubTab 2: Join Requests List */}
                {membersSubTab === 'requests' && isOwner && (
                  <div className="space-y-3 pt-1">
                    {joinRequests.length === 0 ? (
                      <p className="py-8 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                        {t.circle.noPendingJoinRequests || 'Chưa có yêu cầu tham gia nào đang chờ duyệt'}
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
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-circle-charcoal text-white text-xs font-bold overflow-hidden">
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
                                  <span>Duyệt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReviewRequest(req.id, 'REJECTED')}
                                  disabled={reviewRequestMutation.isPending}
                                  className="px-2.5 py-1 rounded-xl border border-circle-hairline text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-all"
                                >
                                  Từ chối
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
                TAB 3: THÔNG BÁO & QUYỀN RIÊNG TƯ (RESTRUCTURED ACCORDING TO USER REQUIREMENTS)
               ========================================================================= */}
            {activeTab === 'privacySupport' && (
              <div className="space-y-6">
                {/* -------------------------------------------------------------
                    PHẦN 1: 🔔 THÔNG BÁO (NOTIFICATIONS)
                   ------------------------------------------------------------- */}
                <div className="p-5 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.notificationsTitle || 'Thông báo'}</span>
                  </h4>

                  {/* 1.1 Tắt thông báo về đoạn chat (Mute Chat Toggle) */}
                  <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isChatMuted ? (
                            <BellOff className="h-4 w-4 text-red-500 shrink-0" />
                          ) : (
                            <Bell className="h-4 w-4 text-circle-primary shrink-0" />
                          )}
                          <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                            {t.circle.muteChat || 'Tắt thông báo về đoạn chat'}
                          </h5>
                        </div>
                        <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                          {isChatMuted
                            ? `Đang tắt thông báo (${getDurationLabel(muteDuration)})`
                            : (t.circle.chatNotificationsDesc || 'Tắt tiếng hoặc dừng nhận thông báo cho đoạn chat này')}
                        </p>
                      </div>

                      {/* Switch Toggle (Gạt bật = Đang tắt thông báo) */}
                      <button
                        type="button"
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

                    {/* Chọn thời gian tắt thông báo (Hiện khi gạt BẬT Tắt thông báo) */}
                    {isChatMuted && (
                      <div className="pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-2 animate-fade-in">
                        <span className="text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted">
                          {t.circle.muteChatUntil || 'Chọn thời gian tắt thông báo:'}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {[
                            { key: '15m', label: '15 phút' },
                            { key: '1h', label: '1 giờ' },
                            { key: '8h', label: '8 giờ' },
                            { key: '24h', label: '24 giờ' },
                            { key: 'forever', label: 'Đến khi bật lại' },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => handleSelectMuteDuration(item.key)}
                              className={`px-2 py-1.5 rounded-xl text-[11px] font-medium transition-all text-center truncate ${
                                muteDuration === item.key
                                  ? 'bg-red-500 text-white font-bold shadow-xs'
                                  : 'bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate hover:bg-circle-canvas'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 1.2 & 1.3: Khi KHÔNG mute toàn bộ đoạn chat (isChatMuted === false), hiển thị cấu hình tin nhắn & cuộc gọi */}
                  {!isChatMuted && (
                    <>
                      {/* 1.2 Thông báo về tin nhắn */}
                      <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 space-y-2.5 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-circle-primary shrink-0" />
                          <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                            {t.circle.messageNotifications || 'Thông báo về tin nhắn'}
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {[
                            { key: 'all' as const, label: t.circle.msgNotifyAll || 'Tất cả tin nhắn' },
                            { key: 'mentions' as const, label: t.circle.msgNotifyMentions || 'Lượt nhắc & phản hồi' },
                            { key: 'none' as const, label: t.circle.msgNotifyNone || 'Không thông báo' },
                          ].map((lvl) => (
                            <button
                              key={lvl.key}
                              type="button"
                              onClick={() => handleChangeMessageNotificationLevel(lvl.key)}
                              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-center ${
                                messageNotificationLevel === lvl.key
                                  ? 'bg-circle-primary text-circle-charcoal font-bold shadow-xs'
                                  : 'bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-circle-slate hover:bg-circle-canvas'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 1.3 Tắt thông báo về cuộc gọi */}
                      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 animate-fade-in">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {isCallsMuted ? (
                              <PhoneOff className="h-4 w-4 text-red-500 shrink-0" />
                            ) : (
                              <PhoneCall className="h-4 w-4 text-circle-primary shrink-0" />
                            )}
                            <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                              {t.circle.muteCalls || 'Tắt thông báo về cuộc gọi'}
                            </h5>
                          </div>
                          <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                            {isCallsMuted ? 'Đang tắt chuông cuộc gọi từ nhóm này' : 'Nhận chuông và thông báo khi có cuộc gọi nhóm'}
                          </p>
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
                    </>
                  )}

                  {/* 1.4 Tắt thông báo từ thành viên (Mute Member Notifications) */}
                  <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <VolumeX className="h-4 w-4 text-amber-500 shrink-0" />
                          <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                            {t.circle.muteMemberNotificationsTitle || 'Tắt thông báo từ thành viên'}
                          </h5>
                        </div>
                        <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                          {t.circle.muteMemberNotificationsDesc || 'Cho phép người dùng tắt thông báo tin nhắn từ một thành viên cụ thể trong Circle mà không ảnh hưởng đến thông báo từ các thành viên khác.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsManageMutedMembersOpen(!isManageMutedMembersOpen)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-canvas text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text shadow-xs transition-all shrink-0"
                      >
                        <span>{isManageMutedMembersOpen ? 'Thu gọn' : (t.circle.manageMutedMembers || 'Quản lý')}</span>
                        {mutedMemberIds.length > 0 && (
                          <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-amber-500 text-white font-bold">
                            {mutedMemberIds.length}
                          </span>
                        )}
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isManageMutedMembersOpen ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {/* Member Mute Selector Panel */}
                    {isManageMutedMembersOpen && (
                      <div className="pt-3 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60 space-y-3 animate-fade-in">
                        {/* Search input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-circle-slate" />
                          <input
                            type="text"
                            value={memberMuteSearch}
                            onChange={(e) => setMemberMuteSearch(e.target.value)}
                            placeholder="Tìm thành viên để tắt thông báo..."
                            className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface pl-8 pr-3 py-1.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary"
                          />
                        </div>

                        {/* Members list */}
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 divide-y divide-circle-hairline/40 dark:divide-circle-dark-hairline/40">
                          {filteredMuteMembers.length === 0 ? (
                            <p className="text-center py-4 text-xs text-circle-slate dark:text-circle-dark-muted">
                              {memberMuteSearch ? 'Không tìm thấy thành viên phù hợp' : 'Không có thành viên khác trong nhóm'}
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
                                    <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                                      {memberName}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleMuteMember(m.userId)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs ${
                                      isMuted
                                        ? 'bg-red-500 text-white'
                                        : 'border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate hover:text-circle-charcoal'
                                    }`}
                                  >
                                    {isMuted ? (
                                      <>
                                        <VolumeX className="h-3 w-3" />
                                        <span>{t.circle.unmute || 'Bật lại'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Volume2 className="h-3 w-3" />
                                        <span>{t.circle.mute || 'Tắt tiếng'}</span>
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

                {/* -------------------------------------------------------------
                    PHẦN 2: 🔒 QUYỀN RIÊNG TƯ (PRIVACY)
                   ------------------------------------------------------------- */}
                <div className="p-5 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.privacySection || 'Quyền riêng tư'}</span>
                  </h4>

                  {/* 2.1 Thông báo đã đọc (Read receipts) */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {readReceipts ? (
                          <Eye className="h-4 w-4 text-circle-primary shrink-0" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-circle-slate shrink-0" />
                        )}
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.readReceiptsTitle || 'Thông báo đã đọc (Read receipts / "Đã xem")'}
                        </h5>
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.readReceiptsDesc || 'Cho phép các thành viên khác biết khi nào bạn đã đọc tin nhắn trong Vòng tròn'}
                      </p>
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

                  {/* 2.2 Chỉ báo đang nhập (Typing indicator) */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Keyboard className="h-4 w-4 text-circle-primary shrink-0" />
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.typingIndicatorTitle || 'Chỉ báo đang nhập'}
                        </h5>
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.typingIndicatorDesc || 'Hiển thị để các thành viên khác biết khi bạn đang soạn tin nhắn'}
                      </p>
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

                  {/* 2.3 Cho phép AI xử lý nội dung tin nhắn (AI Assistant) */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-circle-primary shrink-0" />
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.aiAssistanceTitle || 'Cho phép AI xử lý nội dung tin nhắn'}
                        </h5>
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.aiAssistanceDesc || 'Kích hoạt trợ lý AI tóm tắt nội dung, dịch thuật và gợi ý câu trả lời thông minh trong Circle'}
                      </p>
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
            )}

            {/* =========================================================================
                TAB 4: THIẾT LẬP VÒNG TRÒN (REFINED APPROVAL, COMPACT CAPACITY & TITLED INVITES)
               ========================================================================= */}
            {activeTab === 'circleSettings' && (
              <div className="space-y-6">
                {/* Section 1: Approval toggle & Clean Capacity Selector */}
                <div className="p-5 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-5 shadow-sm">
                  {/* Cần trưởng nhóm phê duyệt Toggle Switch */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                        {t.circle.requireApprovalTitle || 'Cần trưởng nhóm phê duyệt'}
                      </h4>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.requireApprovalDesc || 'Trưởng nhóm cần phê duyệt tất cả yêu cầu tham gia nhóm chat'}
                      </p>
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

                  {/* Số lượng thành viên tối đa (Dropdown List nằm bên phải gọn gàng) */}
                  <div className="p-4 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-circle-primary" />
                          <span>{t.circle.maxMembersLabel || 'Số lượng thành viên tối đa'}</span>
                        </h4>
                        <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                          Giới hạn quy mô thành viên được phép vào nhóm
                        </p>
                      </div>

                      {/* Dropdown Select nằm bên phải */}
                      <div className="relative shrink-0 w-full sm:w-52">
                        <select
                          disabled={!isOwner}
                          value={isCustomCapacity || formMaxMembers !== null ? 'limited' : 'unlimited'}
                          onChange={(e) => handleCapacityChange(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3 py-2 pr-8 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary shadow-xs cursor-pointer disabled:opacity-60"
                        >
                          <option value="unlimited">Không giới hạn (Mặc định)</option>
                          <option value="limited">Giới hạn số lượng</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-circle-slate">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Input nhập số lượng (Chỉ hiện khi chọn "Giới hạn số lượng") */}
                    {(isCustomCapacity || formMaxMembers !== null) && (
                      <div className="pt-2 animate-fade-in flex items-center gap-2">
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
                          placeholder="Nhập số lượng thành viên tối đa (2 - 10,000)..."
                          className="flex-1 rounded-xl border border-circle-primary bg-white dark:bg-circle-dark-surface px-3 py-1.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary shadow-xs"
                        />
                        <span className="text-[11px] text-circle-slate shrink-0">thành viên</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Invite Link & Code (Rõ ràng tiêu đề & Tinh gọn) */}
                <div className="p-5 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-4 shadow-sm">
                  {/* Clear Section Header */}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.inviteCodeAndLink || 'Mã mời & Liên kết tham gia'}</span>
                  </h4>

                  {/* 1. Mã mời tham gia & Nút sao chép mã */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted">
                        {t.circle.inviteCodeLabel || 'Mã mời'}:
                      </span>
                      <span className="font-mono text-sm font-bold tracking-widest text-circle-charcoal dark:text-circle-dark-text">
                        {currentInviteCode}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(currentInviteCode)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal text-xs font-bold transition-all shadow-xs shrink-0"
                    >
                      {copiedCode === currentInviteCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-circle-charcoal" />
                          <span>{t.circle.copiedInviteCode || 'Đã sao chép'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t.circle.copyCodeBtn || 'Sao chép mã'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 2. Liên kết tham gia & Nút sao chép / chia sẻ */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted shrink-0">
                        {t.circle.linkTitle || 'Liên kết'}:
                      </span>
                      <span className="text-xs font-mono text-circle-charcoal dark:text-circle-dark-text truncate">
                        {inviteLink}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:bg-circle-canvas text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text transition-all shadow-xs"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedLink ? (t.circle.copiedInviteLink || 'Đã sao chép') : (t.circle.copyLinkBtn || 'Sao chép liên kết')}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        title={t.circle.shareInvite}
                        className="p-1.5 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-slate hover:text-circle-charcoal transition-all"
                      >
                        {sharedDone ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 3: Vùng nguy hiểm - Giải tán Vòng tròn (Owner Only) */}
                {isOwner && (
                  <div className="p-5 rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 space-y-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{t.circle.dangerZone || 'Vùng nguy hiểm'}</span>
                        </h4>
                        <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                          {t.circle.deleteCircleWarning || 'Xóa hoàn toàn Vòng tròn này và loại bỏ tất cả các thành viên. Hành động này không thể hoàn tác.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCircle(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t.circle.deleteCircle || 'Giải tán Vòng tròn'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 5: TRỢ GIÚP & BÁO CÁO (SUPPORT & REPORTS)
               ========================================================================= */}
            {activeTab === 'supportReports' && (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface space-y-3.5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-circle-charcoal dark:text-circle-dark-text flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-circle-primary" />
                    <span>{t.circle.supportAndReportsTab || 'Trợ giúp & Báo cáo'}</span>
                  </h4>

                  {/* 1. Báo cáo vi phạm Vòng tròn */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-amber-500 shrink-0" />
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.reportCircleTitle || 'Báo cáo vi phạm Vòng tròn'}
                        </h5>
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.reportCircleDesc || 'Báo cáo nội dung không phù hợp, quấy rối hoặc vi phạm tiêu chuẩn cộng đồng'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReportOpen(!isReportOpen);
                        setIsReportUserOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-all shrink-0"
                    >
                      Báo cáo Vòng tròn
                    </button>
                  </div>

                  {/* Sub-form Báo cáo vi phạm Vòng tròn */}
                  {isReportOpen && (
                    <form
                      onSubmit={handleSubmitReport}
                      className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 animate-fade-in"
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
                              onChange={(e) => setReportReason(e.target.value)}
                              className="text-circle-primary focus:ring-circle-primary"
                            />
                            <span>{reason.label}</span>
                          </label>
                        ))}
                      </div>

                      {reportReason === 'other' && (
                        <div>
                          <textarea
                            value={customReportText}
                            onChange={(e) => setCustomReportText(e.target.value)}
                            placeholder={t.circle.reportReasonOtherPlaceholder}
                            rows={2}
                            className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary"
                          />
                          {reportFieldError && (
                            <p className="text-[11px] text-red-500 mt-1">{reportFieldError}</p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsReportOpen(false)}
                          className="px-3 py-1 rounded-xl border border-circle-hairline text-xs font-semibold text-circle-slate"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                        >
                          Gửi báo cáo
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2. Báo cáo người dùng vi phạm */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <UserMinus className="h-4 w-4 text-amber-600 shrink-0" />
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.reportUserTitle || 'Báo cáo người dùng'}
                        </h5>
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-1 leading-snug">
                        {t.circle.reportUserDesc || 'Báo cáo thành viên có hành vi quấy rối, xúc phạm hoặc vi phạm tiêu chuẩn cộng đồng'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReportUserOpen(!isReportUserOpen);
                        setIsReportOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-all shrink-0"
                    >
                      Báo cáo thành viên
                    </button>
                  </div>

                  {/* Sub-form Báo cáo người dùng */}
                  {isReportUserOpen && (
                    <form
                      onSubmit={handleSubmitReportUser}
                      className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 animate-fade-in"
                    >
                      <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        {t.circle.selectReportUser || 'Chọn thành viên muốn báo cáo:'}
                      </h5>

                      <select
                        value={reportedUserId}
                        onChange={(e) => setReportedUserId(e.target.value)}
                        className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary"
                      >
                        <option value="">-- Chọn thành viên --</option>
                        {members
                          .filter((m) => m.userId !== user?.id)
                          .map((m) => (
                            <option key={m.id} value={m.userId}>
                              {m.nickname || m.user?.profile?.displayName || m.user?.email || 'Member'}
                            </option>
                          ))}
                      </select>

                      <div className="space-y-2 pt-1">
                        {[
                          { key: 'harassment', label: 'Quấy rối hoặc đe dọa' },
                          { key: 'hate_speech', label: 'Ngôn từ thù ghét, xúc phạm' },
                          { key: 'spam', label: 'Spam, quảng cáo lừa đảo' },
                          { key: 'impersonation', label: 'Mạo danh người khác' },
                          { key: 'other', label: 'Lý do khác' },
                        ].map((reason) => (
                          <label key={reason.key} className="flex items-center gap-2 text-xs text-circle-charcoal dark:text-circle-dark-text cursor-pointer">
                            <input
                              type="radio"
                              name="reportUserReason"
                              value={reason.key}
                              checked={reportUserReason === reason.key}
                              onChange={(e) => setReportUserReason(e.target.value)}
                              className="text-circle-primary focus:ring-circle-primary"
                            />
                            <span>{reason.label}</span>
                          </label>
                        ))}
                      </div>

                      {reportUserReason === 'other' && (
                        <div>
                          <textarea
                            value={customReportUserText}
                            onChange={(e) => setCustomReportUserText(e.target.value)}
                            placeholder="Mô tả cụ thể hành vi vi phạm..."
                            rows={2}
                            className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-primary"
                          />
                        </div>
                      )}

                      {reportUserFieldError && (
                        <p className="text-[11px] text-red-500">{reportUserFieldError}</p>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsReportUserOpen(false)}
                          className="px-3 py-1 rounded-xl border border-circle-hairline text-xs font-semibold text-circle-slate"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                        >
                          Gửi báo cáo người dùng
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 3. Trung tâm trợ giúp / Hướng dẫn cộng đồng */}
                  <div className="p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-circle-primary shrink-0" />
                        <h5 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                          {t.circle.helpCenterTitle || 'Trung tâm trợ giúp / Hướng dẫn cộng đồng'}
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

                    {isHelpOpen && (
                      <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline text-xs space-y-2 text-circle-slate dark:text-circle-dark-muted animate-fade-in">
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

                  {/* 4. Rời Vòng tròn */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                        <h5 className="text-xs font-bold text-red-700 dark:text-red-400">
                          {t.circle.leaveCirclePersonalTitle || 'Rời Vòng tròn'}
                        </h5>
                      </div>
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
          </div>
        </main>
      </div>

      {/* Confirmation Modals */}
      {confirmKickMemberId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-circle-card space-y-4">
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{t.circle.confirmKickTitle}</span>
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.circle.confirmKickWarning}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmKickMemberId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-circle-hairline text-xs font-semibold text-circle-slate"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={removeMemberMutation.isPending}
                onClick={() => handleKickMember(confirmKickMemberId)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {t.circle.kickMember}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTransferMemberId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-circle-card space-y-4">
            <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span>{t.circle.confirmTransferTitle}</span>
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.circle.confirmTransferWarning}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmTransferMemberId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-circle-hairline text-xs font-semibold text-circle-slate"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={transferOwnershipMutation.isPending}
                onClick={() => handleTransferOwnership(confirmTransferMemberId)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {t.circle.transferOwnership}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLeave && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-circle-card space-y-4">
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>{t.circle.confirmLeaveTitle}</span>
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.circle.confirmLeaveWarning}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="px-3.5 py-1.5 rounded-xl border border-circle-hairline text-xs font-semibold text-circle-slate"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={leaveCircleMutation.isPending}
                onClick={handleLeaveCircle}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {t.circle.leaveCircle}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteCircle && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-white dark:bg-circle-dark-surface border border-red-200 dark:border-red-900/50 shadow-circle-card space-y-4">
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{t.circle.deleteCircle || 'Giải tán Vòng tròn'}</span>
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.circle.deleteCircleConfirm || 'Bạn có chắc chắn muốn giải tán Vòng tròn này? Toàn bộ tin nhắn và dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.'}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteCircle(false)}
                className="px-3.5 py-1.5 rounded-xl border border-circle-hairline text-xs font-semibold text-circle-slate"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={deleteCircleMutation.isPending}
                onClick={handleDeleteCircle}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {deleteCircleMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{t.circle.deleteCircle || 'Giải tán'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
