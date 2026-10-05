import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Share,
  Image as RNImage,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  X,
  MessageSquare,
  Users,
  ShieldCheck,
  UserX,
  LogOut,
  Trash2,
  Crown,
  Check,
  Search,
  UserPlus,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Sliders,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Flag,
  HelpCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Pencil,
  Save,
  Share2,
  Camera,
  Bot,
  UserMinus,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { useCircleStore, CircleManageTab } from '../../stores/circle.store';
import {
  useCircleDetailQuery,
  useCircleMembersQuery,
  useCircleJoinRequestsQuery,
  useUpdateNicknameMutation,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
  useLeaveCircleMutation,
  useDeleteCircleMutation,
  useAddMembersMutation,
  useSelectableFriendsQuery,
  useReviewJoinRequestMutation,
  useUpdateCircleMutation,
  useCreateReportMutation,
} from '../../hooks/use-circle-queries';
import { getStorageItem, setStorageItem } from '../../services/storage';
import { MemberRole } from '@circle/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export function CircleManagementModal() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';

  const visible = useCircleStore((s) => s.manageModalVisible);
  const setVisible = useCircleStore((s) => s.setManageModalVisible);
  const activeTab = useCircleStore((s) => s.manageActiveTab);
  const setActiveTab = useCircleStore((s) => s.setManageActiveTab);
  const activeCircle = useCircleStore((s) => s.activeCircle);

  // Queries
  const circleId = activeCircle?.id || null;
  const { data: detailData } = useCircleDetailQuery(circleId);
  const circle = detailData || activeCircle;

  const { data: members = [], isLoading: isLoadingMembers } = useCircleMembersQuery(circleId);
  const currentMember = members.find((m) => m.userId === user?.id);
  const userRole = (circle as any)?.role || currentMember?.role;
  const isOwner = userRole === MemberRole.OWNER || userRole === 'OWNER';
  const isOwnerOrAdmin = isOwner || userRole === MemberRole.ADMIN || userRole === 'ADMIN';

  const { data: joinRequests = [], isLoading: isLoadingRequests } =
    useCircleJoinRequestsQuery(circleId, isOwnerOrAdmin);
  const { data: selectableFriends = [], isLoading: isLoadingFriends } = useSelectableFriendsQuery();

  // Mutations
  const updateNicknameMutation = useUpdateNicknameMutation(circleId || '');
  const removeMemberMutation = useRemoveMemberMutation(circleId || '');
  const transferOwnershipMutation = useTransferOwnershipMutation(circleId || '');
  const leaveCircleMutation = useLeaveCircleMutation(circleId || '');
  const deleteCircleMutation = useDeleteCircleMutation(circleId || '');
  const addMembersMutation = useAddMembersMutation(circleId || '');
  const reviewJoinRequestMutation = useReviewJoinRequestMutation(circleId || '');
  const updateCircleMutation = useUpdateCircleMutation(circleId || '');
  const createReportMutation = useCreateReportMutation(circleId || '');

  // Tab 1: Chat Info States (Pencil Edit Mode & Avatar Picker)
  const [isEditingChatInfo, setIsEditingChatInfo] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  // Tab 4: Circle Settings States (Auto-Save, Capacity Popup)
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formMaxMembers, setFormMaxMembers] = useState<number | null>(null);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [tempCapacityInput, setTempCapacityInput] = useState('');

  // Tab 2: Members Subtab ('roster' | 'requests')
  const [membersSubTab, setMembersSubTab] = useState<'roster' | 'requests'>('roster');

  // Member Action Dialogs
  const [editingMember, setEditingMember] = useState<{ id: string; nickname: string; name: string } | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  // Tab 3: Notifications & Privacy States & Popups
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [muteDuration, setMuteDuration] = useState('forever');
  const [isMuteDurationModalOpen, setIsMuteDurationModalOpen] = useState(false);
  const [messageNotificationLevel, setMessageNotificationLevel] = useState<'all' | 'mentions' | 'none'>('all');
  const [isMsgLevelModalOpen, setIsMsgLevelModalOpen] = useState(false);
  const [isCallsMuted, setIsCallsMuted] = useState(false);
  const [mutedMemberIds, setMutedMemberIds] = useState<string[]>([]);
  const [isManageMutedMembersOpen, setIsManageMutedMembersOpen] = useState(false);
  const [memberMuteSearch, setMemberMuteSearch] = useState('');

  const [readReceipts, setReadReceipts] = useState<boolean>(true);
  const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(true);
  const [allowAiProcessing, setAllowAiProcessing] = useState<boolean>(true);

  // Tab 5: Reports & Help
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState('');
  const [reportUserReason, setReportUserReason] = useState('harassment');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Feedback Banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state when modal opens or circle changes
  useEffect(() => {
    if (visible && circle) {
      setIsEditingChatInfo(false);
      setFormName(circle.name || '');
      setFormAvatar(circle.avatarUrl || '');
      setFormIsPrivate(Boolean(circle.isPrivate));
      setFormMaxMembers(circle.maxMembers ?? null);
      setTempCapacityInput(circle.maxMembers ? String(circle.maxMembers) : '');
      setMembersSubTab('roster');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsAddFriendsOpen(false);
      setSelectedFriendIds([]);
      setFriendSearch('');
      setMemberSearch('');
      setIsReportOpen(false);
      setIsReportUserOpen(false);
      setIsHelpOpen(false);
      setIsManageMutedMembersOpen(false);
      setIsAvatarPickerOpen(false);
      setIsMuteDurationModalOpen(false);
      setIsMsgLevelModalOpen(false);
      setIsCapacityModalOpen(false);
      setEditingMember(null);

      if (circle?.id) {
        getStorageItem(`circle_${circle.id}_read_receipts`).then((v) => {
          if (v !== null) setReadReceipts(v === 'true');
        });
        getStorageItem(`circle_${circle.id}_typing_indicator`).then((v) => {
          if (v !== null) setShowTypingIndicator(v === 'true');
        });
        getStorageItem(`circle_${circle.id}_ai_processing`).then((v) => {
          if (v !== null) setAllowAiProcessing(v === 'true');
        });
      }
    }
  }, [visible, circle]);

  const handleClose = () => {
    setVisible(false);
    setActiveTab('menu');
    setMembersSubTab('roster');
    setIsEditingChatInfo(false);
    setEditingMember(null);
    setIsAddFriendsOpen(false);
    setIsManageMutedMembersOpen(false);
    setIsAvatarPickerOpen(false);
    setIsMuteDurationModalOpen(false);
    setIsMsgLevelModalOpen(false);
    setIsCapacityModalOpen(false);
    setIsReportOpen(false);
    setIsReportUserOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const inviteCode = circle?.inviteCode || '';
  const inviteLink = `https://circle.app/join?code=${inviteCode}`;

  const handleShareInvite = async () => {
    if (!circle) return;
    try {
      await Share.share({
        title: `CIRCLE - ${circle.name}`,
        message: `${(t.circle.sharedContentText || 'Tham gia Vòng tròn {name} trên CIRCLE').replace('{name}', circle.name)}: ${inviteLink}`,
        url: inviteLink,
      });
    } catch {
      // User cancelled
    }
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setSuccessMessage(t.circle.copiedInviteLink || 'Đã sao chép liên kết');
    setTimeout(() => {
      setCopiedLink(false);
      setSuccessMessage(null);
    }, 2500);
  };

  const handleCopyCode = () => {
    setCopiedCode(true);
    setSuccessMessage(t.circle.copiedInviteCode || 'Đã sao chép mã');
    setTimeout(() => {
      setCopiedCode(false);
      setSuccessMessage(null);
    }, 2500);
  };

  // Tab 1: Save Chat Information (Name, Avatar)
  const handleSaveChatInfo = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetName = formName.trim() || circle?.name || '';
    if (!targetName || targetName.length < 2) {
      setErrorMessage(t.validation.circleNameMinLength || 'Tên Vòng tròn tối thiểu 2 ký tự');
      return;
    }

    try {
      await updateCircleMutation.mutateAsync({
        name: targetName,
        avatarUrl: formAvatar.trim() || undefined,
      });
      setIsEditingChatInfo(false);
      setSuccessMessage(t.circle.savedSuccess || 'Đã lưu thay đổi thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || t.circle.createError || 'Có lỗi xảy ra');
    }
  };

  // Tab 3: Chat Mute Toggle (Opens duration popup when turning ON)
  const handleToggleChatMute = (willMute: boolean) => {
    if (willMute) {
      setIsMuteDurationModalOpen(true);
    } else {
      setIsChatMuted(false);
      setSuccessMessage('Đã bật lại thông báo đoạn chat');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleSelectMuteDuration = (dur: string) => {
    setMuteDuration(dur);
    setIsChatMuted(true);
    setIsMuteDurationModalOpen(false);
    setSuccessMessage('Đã tắt thông báo đoạn chat');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const getMuteDurationLabel = (dur: string) => {
    switch (dur) {
      case '15m': return t.circle.notificationMute15m || '15 phút';
      case '1h': return t.circle.notificationMute1h || '1 giờ';
      case '8h': return t.circle.notificationMute8h || '8 giờ';
      case '24h': return t.circle.notificationMute24h || '24 giờ';
      case 'forever': return t.circle.muteUntilTurnOn || 'Đến khi bật lại';
      default: return dur;
    }
  };

  const getMsgLevelLabel = (lvl: 'all' | 'mentions' | 'none') => {
    switch (lvl) {
      case 'all': return t.circle.msgNotifyAll || 'Tất cả';
      case 'mentions': return t.circle.msgNotifyMentions || 'Lượt nhắc & phản hồi';
      case 'none': return t.circle.msgNotifyNone || 'Không thông báo';
    }
  };

  // Tab 4: Toggle Require Approval (Auto-Save)
  const handleToggleApproval = async () => {
    if (!isOwner) return;
    const nextPrivate = !formIsPrivate;
    setFormIsPrivate(nextPrivate);
    try {
      await updateCircleMutation.mutateAsync({
        isPrivate: nextPrivate,
        maxMembers: formMaxMembers,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || t.circle.createError);
    }
  };

  // Tab 4: Capacity Change (Auto-Save via Popup)
  const handleApplyCapacity = async (max: number | null) => {
    if (!isOwner) return;
    setFormMaxMembers(max);
    setIsCapacityModalOpen(false);
    try {
      await updateCircleMutation.mutateAsync({
        isPrivate: formIsPrivate,
        maxMembers: max,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || t.circle.createError);
    }
  };

  // Tab 2: Nicknames
  const handleOpenNicknameDialog = (memberId: string, currentNickname: string | null, displayName: string) => {
    setEditingMember({ id: memberId, nickname: currentNickname || '', name: displayName });
    setNicknameInput(currentNickname || '');
  };

  const handleSaveNickname = async () => {
    if (!editingMember || !circleId) return;
    try {
      await updateNicknameMutation.mutateAsync({
        memberId: editingMember.id,
        nickname: nicknameInput.trim() || null,
      });
      setEditingMember(null);
      setSuccessMessage(t.circle.nicknameUpdated || 'Đã cập nhật biệt danh');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      Alert.alert(t.common.appName || 'CIRCLE', err?.message || t.common.unknownError || 'Có lỗi xảy ra');
    }
  };

  // Tab 2: Add Members Flow
  const handleToggleSelectFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId],
    );
  };

  const handleSelectAllFriends = () => {
    if (selectedFriendIds.length === availableFriends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(availableFriends.map((f) => f.id));
    }
  };

  const handleConfirmAddMembers = async () => {
    if (selectedFriendIds.length === 0 || !circleId) return;
    try {
      await addMembersMutation.mutateAsync({ memberIds: selectedFriendIds });
      setIsAddFriendsOpen(false);
      setSelectedFriendIds([]);
      setFriendSearch('');
      setSuccessMessage(t.circle.addMembersSuccess || 'Đã thêm thành viên vào Vòng tròn');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      Alert.alert(t.common.appName || 'CIRCLE', err?.message || t.common.unknownError || 'Có lỗi xảy ra');
    }
  };

  const handleKickMember = (memberId: string, name: string) => {
    Alert.alert(
      t.circle.kickMember || 'Xóa khỏi Vòng tròn',
      (t.circle.kickMemberConfirm || 'Bạn có chắc chắn muốn xóa {name} khỏi Vòng tròn?').replace('{name}', name),
      [
        { text: t.common.cancel || 'Hủy', style: 'cancel' },
        {
          text: t.circle.kickMember || 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberMutation.mutateAsync(memberId);
            } catch (err: any) {
              Alert.alert(t.common.appName || 'CIRCLE', err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleTransferOwnership = (newOwnerId: string, name: string) => {
    Alert.alert(
      t.circle.transferOwnership || 'Chuyển quyền Trưởng nhóm',
      (t.circle.transferOwnershipConfirm || 'Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm cho {name}?').replace('{name}', name),
      [
        { text: t.common.cancel || 'Hủy', style: 'cancel' },
        {
          text: t.circle.transferOwnership || 'Chuyển quyền',
          style: 'destructive',
          onPress: async () => {
            try {
              await transferOwnershipMutation.mutateAsync(newOwnerId);
            } catch (err: any) {
              Alert.alert(t.common.appName || 'CIRCLE', err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleLeaveCircle = () => {
    if (isOwner && members.length > 1) {
      Alert.alert(t.circle.leaveCircle || 'Rời Vòng tròn', t.circle.ownerCannotLeaveMustTransfer || 'Bạn là Trưởng nhóm. Vui lòng chuyển quyền trước khi rời nhóm.');
      return;
    }
    Alert.alert(
      t.circle.leaveCircle || 'Rời Vòng tròn',
      t.circle.leaveCircleConfirm || 'Bạn có chắc muốn rời khỏi Vòng tròn này?',
      [
        { text: t.common.cancel || 'Hủy', style: 'cancel' },
        {
          text: t.circle.leaveCircle || 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCircleMutation.mutateAsync();
            } catch (err: any) {
              Alert.alert(t.common.appName || 'CIRCLE', err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleDeleteCircle = () => {
    Alert.alert(
      t.circle.deleteCircle || 'Giải tán Vòng tròn',
      t.circle.deleteCircleConfirm || 'Hành động này không thể hoàn tác. Mọi tin nhắn và dữ liệu sẽ bị xóa vĩnh viễn.',
      [
        { text: t.common.cancel || 'Hủy', style: 'cancel' },
        {
          text: t.circle.deleteCircle || 'Giải tán',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCircleMutation.mutateAsync();
            } catch (err: any) {
              Alert.alert(t.common.appName || 'CIRCLE', err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleReviewRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewJoinRequestMutation.mutateAsync({
        requestId,
        input: { status },
      });
      setSuccessMessage(status === 'APPROVED' ? (t.circle.joinRequestApproved || 'Đã duyệt yêu cầu') : (t.circle.joinRequestRejected || 'Đã từ chối'));
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      Alert.alert(t.common.appName || 'CIRCLE', err?.message || t.common.unknownError);
    }
  };

  const handleToggleMuteMember = (memberUserId: string) => {
    setMutedMemberIds((prev) =>
      prev.includes(memberUserId) ? prev.filter((id) => id !== memberUserId) : [...prev, memberUserId]
    );
  };

  const handleToggleReadReceipts = (val: boolean) => {
    setReadReceipts(val);
    if (circleId) {
      setStorageItem(`circle_${circleId}_read_receipts`, String(val));
    }
  };

  const handleToggleTypingIndicator = (val: boolean) => {
    setShowTypingIndicator(val);
    if (circleId) {
      setStorageItem(`circle_${circleId}_typing_indicator`, String(val));
    }
  };

  const handleToggleAiProcessing = (val: boolean) => {
    setAllowAiProcessing(val);
    if (circleId) {
      setStorageItem(`circle_${circleId}_ai_processing`, String(val));
    }
  };

  const handleSubmitReportCircle = async () => {
    if (!circleId) return;
    try {
      await createReportMutation.mutateAsync({
        targetType: 'CIRCLE',
        reason: reportReason,
      });
      setIsReportOpen(false);
      setSuccessMessage(t.circle.reportSubmittedSuccess || 'Đã gửi báo cáo vi phạm');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      Alert.alert(t.common.appName || 'CIRCLE', err?.message || 'Không thể gửi báo cáo');
    }
  };

  const handleSubmitReportUser = async () => {
    if (!reportedUserId || !circleId) {
      Alert.alert('CIRCLE', 'Vui lòng chọn thành viên cần báo cáo');
      return;
    }
    try {
      await createReportMutation.mutateAsync({
        targetType: 'USER',
        targetUserId: reportedUserId,
        reason: reportUserReason,
      });
      setIsReportUserOpen(false);
      setReportedUserId('');
      setSuccessMessage('Đã gửi báo cáo người dùng vi phạm');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      Alert.alert(t.common.appName || 'CIRCLE', err?.message || 'Không thể gửi báo cáo');
    }
  };

  if (!circle) return null;

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return true;
    const name = m.user?.profile?.displayName || m.user?.email || '';
    const nick = m.nickname || '';
    return name.toLowerCase().includes(q) || nick.toLowerCase().includes(q);
  });

  const availableFriends = selectableFriends.filter((f) => {
    const isAlreadyMember = members.some((m) => m.userId === f.id);
    if (isAlreadyMember) return false;
    const q = friendSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      f.displayName.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    );
  });

  const getSubHeaderTitle = () => {
    switch (activeTab) {
      case 'chatInfo':
      case 'info':
        return t.circle.chatInfoTab || 'Thông tin đoạn chat';
      case 'members':
        return t.circle.settingsTabMembers || 'Thành viên';
      case 'privacySupport':
        return t.circle.notificationsAndPrivacyTab || 'Thông báo & Quyền riêng tư';
      case 'circleSettings':
      case 'settings':
        return t.circle.circleSettingsTab || 'Thiết lập Vòng tròn';
      case 'supportReports':
        return t.circle.supportAndReportsTab || 'Trợ giúp & Báo cáo';
      case 'requests':
        return `${t.circle.joinRequestsTitle || 'Yêu cầu tham gia'} (${joinRequests.length})`;
      default:
        return t.nav.circleSettings || 'Cài đặt Vòng tròn';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 45 : 85}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.sheetBg,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {/* Sheet Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: colors.hairline }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.circleBadge, { backgroundColor: `${colors.primary}20` }]}>
                {circle.avatarUrl ? (
                  <RNImage source={{ uri: circle.avatarUrl }} style={styles.badgeImage} />
                ) : (
                  <Text style={[styles.circleBadgeText, { color: colors.primary }]}>
                    {getInitials(circle.name)}
                  </Text>
                )}
              </View>
              <View style={styles.headerTitleGroup}>
                <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
                  {circle.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
            >
              <X size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* SUB-HEADER WITH BACK BUTTON WHEN IN SUB-VIEWS */}
          {activeTab !== 'menu' && (
            <View style={[styles.subHeaderBar, { borderBottomColor: colors.hairline }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveTab('menu')}
                style={[styles.backToMenuBtn, { backgroundColor: colors.wash }]}
              >
                <ArrowLeft size={18} color={colors.text} />
              </TouchableOpacity>
              <Text numberOfLines={1} style={[styles.subHeaderTitle, { color: colors.text }]}>
                {getSubHeaderTitle()}
              </Text>
              <View style={styles.subHeaderPlaceholder} />
            </View>
          )}

          {/* Feedback Banners */}
          {errorMessage && (
            <View style={[styles.bannerBox, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` }]}>
              <AlertTriangle size={16} color={colors.danger} />
              <Text style={[styles.bannerText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          )}
          {successMessage && (
            <View style={[styles.bannerBox, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` }]}>
              <Check size={16} color={colors.success} />
              <Text style={[styles.bannerText, { color: colors.success }]}>{successMessage}</Text>
            </View>
          )}

          {/* =========================================================================
              ROOT MENU: CLEAN LIST WITHOUT SUBTITLES (5 DISTINCT SECTIONS)
             ========================================================================= */}
          {activeTab === 'menu' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Group 1: 5 Main Settings Rows (Clean Titles Only) */}
              <View style={[styles.menuSectionCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {/* 1. Thông tin đoạn chat */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('chatInfo')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.primary}18` }]}>
                    <MessageSquare size={18} color={colors.primary} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.chatInfoTab || 'Thông tin đoạn chat'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>

                {/* 2. Thành viên */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('members')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.info || colors.primary}18` }]}>
                    <Users size={18} color={colors.info || colors.primary} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.settingsTabMembers || 'Thành viên'}
                    </Text>
                  </View>
                  <View style={styles.menuRowRight}>
                    <View style={[styles.countBadge, { backgroundColor: colors.wash }]}>
                      <Text style={[styles.countBadgeText, { color: colors.text }]}>{members.length}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.subtle} />
                  </View>
                </TouchableOpacity>

                {/* 3. Thông báo & Quyền riêng tư */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('privacySupport')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.success || '#10B981'}18` }]}>
                    <Bell size={18} color={colors.success || '#10B981'} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.notificationsAndPrivacyTab || 'Thông báo & Quyền riêng tư'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>

                {/* 4. Thiết lập Vòng tròn (Owner Settings) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('circleSettings')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.warning || '#F59E0B'}18` }]}>
                    <Sliders size={18} color={colors.warning || '#F59E0B'} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.circleSettingsTab || 'Thiết lập Vòng tròn'}
                    </Text>
                  </View>
                  <View style={styles.menuRowRight}>
                    {joinRequests.length > 0 && isOwner && (
                      <View style={[styles.requestCountBadge, { backgroundColor: colors.danger }]}>
                        <Text style={styles.requestCountText}>{joinRequests.length}</Text>
                      </View>
                    )}
                    <ChevronRight size={18} color={colors.subtle} />
                  </View>
                </TouchableOpacity>

                {/* 5. Trợ giúp & Báo cáo */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('supportReports')}
                  style={styles.menuRowItem}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.danger || '#EF4444'}18` }]}>
                    <HelpCircle size={18} color={colors.danger || '#EF4444'} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.supportAndReportsTab || 'Trợ giúp & Báo cáo'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              {/* Group 2: Quick Invite Sharing */}
              <View style={[styles.menuSectionCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleShareInvite}
                  style={styles.menuRowItem}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.primary}18` }]}>
                    <Share2 size={18} color={colors.primary} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.inviteCodeLabel || 'Mã mời'}: {inviteCode || '------'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* =========================================================================
              SUB-VIEW 1: CHAT INFO (Profile Card with Camera Icon on Avatar & Edit Mode)
             ========================================================================= */}
          {(activeTab === 'chatInfo' || activeTab === 'info') && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Profile Card */}
              <View style={[styles.profileHeaderBox, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {/* Avatar with Camera Icon Overlay */}
                <View style={styles.avatarWithCameraContainer}>
                  <View style={[styles.bigAvatarBox, { backgroundColor: `${colors.primary}20` }]}>
                    {formAvatar || circle.avatarUrl ? (
                      <RNImage
                        source={{ uri: (formAvatar || circle.avatarUrl) as string }}
                        style={styles.bigAvatarImg}
                      />
                    ) : (
                      <Text style={[styles.bigAvatarText, { color: colors.primary }]}>
                        {getInitials(formName || circle.name)}
                      </Text>
                    )}
                  </View>

                  {/* Camera Icon Overlay button */}
                  {isOwner && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setIsAvatarPickerOpen(true)}
                      style={[styles.cameraBadgeBtn, { backgroundColor: colors.primary }]}
                    >
                      <Camera size={14} color={colors.onPrimary} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.profileCircleName, { color: colors.text }]}>{formName || circle.name}</Text>
                {circle.handle ? (
                  <Text style={[styles.profileCircleHandle, { color: colors.subtle }]}>@{circle.handle}</Text>
                ) : null}

                {/* Pencil Button to toggle Edit Mode */}
                {isOwner && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsEditingChatInfo(!isEditingChatInfo)}
                    style={[
                      styles.pencilToggleBtn,
                      { backgroundColor: isEditingChatInfo ? colors.primary : colors.wash },
                    ]}
                  >
                    <Pencil size={14} color={isEditingChatInfo ? colors.onPrimary : colors.text} />
                    <Text
                      style={[
                        styles.pencilToggleBtnText,
                        { color: isEditingChatInfo ? colors.onPrimary : colors.text },
                      ]}
                    >
                      {isEditingChatInfo ? 'Hủy' : 'Chỉnh sửa'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Edit Form (Only visible when isEditingChatInfo is true) */}
              {isEditingChatInfo && isOwner && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Chỉnh sửa thông tin Vòng tròn
                  </Text>

                  {/* Name Input */}
                  <View style={styles.formField}>
                    <Text style={[styles.label, { color: colors.text }]}>{t.circle.nameLabel || 'Tên Vòng tròn'}</Text>
                    <TextInput
                      value={formName}
                      onChangeText={setFormName}
                      placeholder={circle.name || (t.circle.namePlaceholder || 'Nhập tên Vòng tròn...')}
                      placeholderTextColor={colors.subtle}
                      style={[
                        styles.input,
                        { backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text },
                      ]}
                    />
                  </View>

                  {/* Quick Avatar Presets Grid */}
                  <View style={styles.formField}>
                    <Text style={[styles.label, { color: colors.text }]}>Chọn ảnh đại diện mẫu</Text>
                    <View style={styles.avatarPresetsGrid}>
                      {AVATAR_PRESETS.map((presetUrl, idx) => {
                        const isSelected = formAvatar === presetUrl;
                        return (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.8}
                            onPress={() => setFormAvatar(presetUrl)}
                            style={[
                              styles.presetAvatarBtn,
                              { borderColor: isSelected ? colors.primary : colors.hairline },
                              isSelected && { borderWidth: 2.5 },
                            ]}
                          >
                            <RNImage source={{ uri: presetUrl }} style={styles.presetAvatarImg} />
                            {isSelected && (
                              <View style={[styles.presetCheckBadge, { backgroundColor: colors.primary }]}>
                                <Check size={11} color={colors.onPrimary} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={updateCircleMutation.isPending}
                    onPress={handleSaveChatInfo}
                    style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                  >
                    {updateCircleMutation.isPending ? (
                      <ActivityIndicator color={colors.onPrimary} size="small" />
                    ) : (
                      <>
                        <Save size={16} color={colors.onPrimary} />
                        <Text style={[styles.primaryActionBtnText, { color: colors.onPrimary }]}>
                          {t.circle.saveChanges || 'Lưu thay đổi'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* =========================================================================
              SUB-VIEW 2: MEMBERS & JOIN REQUESTS (Thành viên)
             ========================================================================= */}
          {activeTab === 'members' && (
            <View style={styles.membersContainer}>
              {/* Segmented Subtabs: Thành viên (X) | Yêu cầu tham gia (Y) */}
              <View style={[styles.segmentedSubTabs, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setMembersSubTab('roster')}
                  style={[
                    styles.segmentBtn,
                    membersSubTab === 'roster' && [styles.segmentBtnActive, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      { color: membersSubTab === 'roster' ? colors.primary : colors.subtle },
                      membersSubTab === 'roster' && { fontWeight: '700' },
                    ]}
                  >
                    {t.circle.settingsTabMembers || 'Thành viên'}
                  </Text>
                </TouchableOpacity>

                {isOwnerOrAdmin && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setMembersSubTab('requests')}
                    style={[
                      styles.segmentBtn,
                      membersSubTab === 'requests' && [styles.segmentBtnActive, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        { color: membersSubTab === 'requests' ? colors.primary : colors.subtle },
                        membersSubTab === 'requests' && { fontWeight: '700' },
                      ]}
                    >
                      {t.circle.joinRequestsTitle || 'Yêu cầu tham gia'} ({joinRequests.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Toolbar: + Thêm thành viên is ALWAYS visible */}
              <View style={styles.memberControlsRow}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.hairline, flex: 1 }]}>
                  <Search size={15} color={colors.subtle} />
                  <TextInput
                    value={memberSearch}
                    onChangeText={setMemberSearch}
                    placeholder={t.circle.friendsSearchPlaceholder || 'Tìm kiếm thành viên...'}
                    placeholderTextColor={colors.subtle}
                    style={[styles.searchInput, { color: colors.text }]}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsAddFriendsOpen(true)}
                  style={[styles.addMemberBtn, { backgroundColor: colors.primary }]}
                >
                  <UserPlus size={15} color={colors.onPrimary} />
                  <Text style={[styles.addMemberBtnText, { color: colors.onPrimary }]}>
                    {t.circle.addMemberBtn || 'Thêm'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Subtab 1: Roster */}
              {membersSubTab === 'roster' && (
                isLoadingMembers ? (
                  <ActivityIndicator style={{ marginVertical: 30 }} color={colors.primary} />
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.memberList}>
                    {filteredMembers.map((m) => {
                      const realDisplayName = m.user?.profile?.displayName || m.user?.email?.split('@')[0] || (t.auth?.member || 'Thành viên');
                      const hasNickname = Boolean(m.nickname && m.nickname.trim().length > 0);
                      const displayTitle = hasNickname ? m.nickname : realDisplayName;
                      const isSelf = user?.id === m.userId;
                      const isMemberOwner = m.role === MemberRole.OWNER;
                      const isMemberAdmin = m.role === MemberRole.ADMIN;

                      return (
                        <View
                          key={m.id}
                          style={[
                            styles.memberItem,
                            { backgroundColor: colors.surface, borderColor: colors.hairline },
                          ]}
                        >
                          <View style={styles.memberLeft}>
                            <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}20` }]}>
                              {m.user?.profile?.avatarUrl ? (
                                <RNImage source={{ uri: m.user.profile.avatarUrl }} style={styles.memberAvatarImg} />
                              ) : (
                                <Text style={[styles.avatarText, { color: colors.primary }]}>
                                  {getInitials(displayTitle || realDisplayName)}
                                </Text>
                              )}
                            </View>
                            <View style={styles.memberDetails}>
                              <View style={styles.nameRow}>
                                <Text numberOfLines={1} style={[styles.memberName, { color: colors.text }]}>
                                  {displayTitle}
                                </Text>
                                {isSelf && (
                                  <View style={[styles.selfBadge, { backgroundColor: colors.wash }]}>
                                    <Text style={[styles.selfBadgeText, { color: colors.subtle }]}>Bạn</Text>
                                  </View>
                                )}
                                {/* Pencil Icon to change nickname */}
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => handleOpenNicknameDialog(m.id, m.nickname ?? null, realDisplayName)}
                                  style={[styles.pencilBtn, { backgroundColor: colors.wash }]}
                                >
                                  <Pencil size={12} color={colors.subtle} />
                                </TouchableOpacity>
                              </View>

                              {hasNickname ? (
                                <Text numberOfLines={1} style={[styles.subtleText, { color: colors.subtle }]}>
                                  {realDisplayName}
                                </Text>
                              ) : null}
                            </View>
                          </View>

                          {/* Right: Role & Actions */}
                          <View style={styles.memberRight}>
                            {isMemberOwner ? (
                              <View style={[styles.roleBadge, { backgroundColor: `${colors.warning || '#F59E0B'}20` }]}>
                                <Crown size={12} color={colors.warning || '#F59E0B'} />
                                <Text style={[styles.roleText, { color: colors.warning || '#F59E0B' }]}>
                                  {t.circle.memberRoleOwner || 'Trưởng nhóm'}
                                </Text>
                              </View>
                            ) : isMemberAdmin ? (
                              <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}20` }]}>
                                <ShieldCheck size={12} color={colors.primary} />
                                <Text style={[styles.roleText, { color: colors.primary }]}>
                                  {t.circle.memberRoleAdmin || 'Quản trị viên'}
                                </Text>
                              </View>
                            ) : (
                              <View style={[styles.roleBadge, { backgroundColor: colors.wash }]}>
                                <Text style={[styles.roleText, { color: colors.subtle }]}>
                                  {t.circle.memberRoleMember || 'Thành viên'}
                                </Text>
                              </View>
                            )}

                            {/* Owner Controls (Transfer & Kick) */}
                            {isOwner && !isMemberOwner && !isSelf && (
                              <View style={styles.memberActions}>
                                <TouchableOpacity
                                  onPress={() => handleTransferOwnership(m.id, realDisplayName)}
                                  style={[styles.iconActionBtn, { backgroundColor: `${colors.warning || '#F59E0B'}15` }]}
                                >
                                  <Crown size={14} color={colors.warning || '#F59E0B'} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => handleKickMember(m.id, realDisplayName)}
                                  style={[styles.iconActionBtn, { backgroundColor: `${colors.danger}15` }]}
                                >
                                  <UserX size={14} color={colors.danger} />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                )
              )}

              {/* Subtab 2: Join Requests */}
              {membersSubTab === 'requests' && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.memberList}>
                  {isLoadingRequests ? (
                    <ActivityIndicator style={{ marginVertical: 30 }} color={colors.primary} />
                  ) : joinRequests.length === 0 ? (
                    <View style={[styles.emptyBox, { backgroundColor: colors.wash, marginVertical: 20 }]}>
                      <Text style={[styles.emptyText, { color: colors.subtle }]}>
                        {t.circle.noPendingJoinRequests || 'Không có yêu cầu tham gia nào đang chờ'}
                      </Text>
                    </View>
                  ) : (
                    joinRequests.map((req) => {
                      const reqName = req.user?.profile?.displayName || req.user?.email || 'User';
                      return (
                        <View
                          key={req.id}
                          style={[styles.requestItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                        >
                          <View style={styles.memberLeft}>
                            <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}20` }]}>
                              <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {getInitials(reqName)}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.memberName, { color: colors.text }]}>{reqName}</Text>
                              {req.message ? (
                                <Text style={[styles.requestMsg, { color: colors.text }]}>"{req.message}"</Text>
                              ) : null}
                            </View>
                          </View>

                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              onPress={() => handleReviewRequest(req.id, 'APPROVED')}
                              style={[styles.acceptBtn, { backgroundColor: colors.success || '#10B981' }]}
                            >
                              <Check size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleReviewRequest(req.id, 'REJECTED')}
                              style={[styles.rejectBtn, { backgroundColor: `${colors.danger}20` }]}
                            >
                              <X size={16} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              )}
            </View>
          )}

          {/* =========================================================================
              SUB-VIEW 3: NOTIFICATIONS & PRIVACY (Thông báo & Quyền riêng tư)
             ========================================================================= */}
          {activeTab === 'privacySupport' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Section 1: Thông báo */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.sectionHeaderRow}>
                  <Bell size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.notificationsTitle || 'Thông báo'}
                  </Text>
                </View>

                {/* 1. Tắt thông báo về đoạn chat (Opens duration popup on toggle) */}
                <View style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.muteChat || 'Tắt thông báo về đoạn chat'}
                    </Text>
                    {isChatMuted && (
                      <Text style={[styles.prefDesc, { color: colors.danger, fontWeight: '600' }]}>
                        Đang tắt: {getMuteDurationLabel(muteDuration)}
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={isChatMuted}
                    onValueChange={handleToggleChatMute}
                    trackColor={{ false: colors.hairline, true: colors.primary }}
                  />
                </View>

                {/* When NOT muted: Message level (Popup selector) & Calls Mute */}
                {!isChatMuted && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setIsMsgLevelModalOpen(true)}
                      style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.prefTitle, { color: colors.text }]}>
                          {t.circle.messageNotifications || 'Thông báo về tin nhắn'}
                        </Text>
                        <Text style={[styles.prefDesc, { color: colors.primary, fontWeight: '600' }]}>
                          {getMsgLevelLabel(messageNotificationLevel)}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.subtle} />
                    </TouchableOpacity>

                    {/* Tắt thông báo cuộc gọi */}
                    <View style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.prefTitle, { color: colors.text }]}>
                          {t.circle.muteCalls || 'Tắt thông báo về cuộc gọi'}
                        </Text>
                      </View>
                      <Switch
                        value={isCallsMuted}
                        onValueChange={(val) => setIsCallsMuted(val)}
                        trackColor={{ false: colors.hairline, true: colors.primary }}
                      />
                    </View>
                  </>
                )}

                {/* 2. Tắt thông báo từ thành viên (Popup) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsManageMutedMembersOpen(true)}
                  style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.muteMemberNotificationsTitle || 'Tắt thông báo từ thành viên'}
                    </Text>
                    <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                      {mutedMemberIds.length > 0 ? `Đã tắt tiếng ${mutedMemberIds.length} thành viên` : 'Chưa tắt tiếng thành viên nào'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              {/* Section 2: Quyền riêng tư */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.sectionHeaderRow}>
                  <ShieldCheck size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.privacySection || 'Quyền riêng tư'}
                  </Text>
                </View>

                {/* Read Receipts */}
                <View style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.readReceiptsTitle || 'Thông báo đã đọc (Đã xem)'}
                    </Text>
                  </View>
                  <Switch
                    value={readReceipts}
                    onValueChange={handleToggleReadReceipts}
                    trackColor={{ false: colors.hairline, true: colors.primary }}
                  />
                </View>

                {/* Typing Indicator */}
                <View style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.typingIndicatorTitle || 'Chỉ báo đang nhập'}
                    </Text>
                  </View>
                  <Switch
                    value={showTypingIndicator}
                    onValueChange={handleToggleTypingIndicator}
                    trackColor={{ false: colors.hairline, true: colors.primary }}
                  />
                </View>

                {/* AI Assistance */}
                <View style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.aiAssistanceTitle || 'Cho phép AI xử lý nội dung tin nhắn'}
                    </Text>
                  </View>
                  <Switch
                    value={allowAiProcessing}
                    onValueChange={handleToggleAiProcessing}
                    trackColor={{ false: colors.hairline, true: colors.primary }}
                  />
                </View>
              </View>
            </ScrollView>
          )}

          {/* =========================================================================
              SUB-VIEW 4: CIRCLE GROUP SETTINGS (Thiết lập Vòng tròn - Owner Only)
             ========================================================================= */}
          {(activeTab === 'circleSettings' || activeTab === 'settings') && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Section 1: Cần trưởng nhóm phê duyệt & Số lượng thành viên tối đa */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {/* Switch Cần trưởng nhóm phê duyệt (Instant Auto-Save) */}
                <View
                  style={[
                    styles.preferenceRow,
                    {
                      backgroundColor: colors.wash,
                      borderColor: formIsPrivate ? colors.primary : colors.hairline,
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.requireApprovalTitle || 'Cần trưởng nhóm phê duyệt'}
                    </Text>
                    <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                      {t.circle.requireApprovalDesc || 'Trưởng nhóm cần phê duyệt tất cả yêu cầu tham gia'}
                    </Text>
                  </View>
                  <Switch
                    value={formIsPrivate}
                    disabled={!isOwner}
                    onValueChange={handleToggleApproval}
                    trackColor={{ false: colors.hairline, true: colors.primary }}
                  />
                </View>

                {/* Số lượng thành viên tối đa (Opens Capacity Popup) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={!isOwner}
                  onPress={() => {
                    setTempCapacityInput(formMaxMembers ? String(formMaxMembers) : '');
                    setIsCapacityModalOpen(true);
                  }}
                  style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.maxMembersLabel || 'Số lượng thành viên tối đa'}
                    </Text>
                    <Text style={[styles.prefDesc, { color: colors.primary, fontWeight: '600' }]}>
                      {formMaxMembers ? `${formMaxMembers} thành viên` : 'Không giới hạn (Mặc định)'}
                    </Text>
                  </View>
                  {isOwner && <ChevronRight size={16} color={colors.subtle} />}
                </TouchableOpacity>
              </View>

              {/* Section 2: Mã mời & Liên kết tham gia */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.sectionHeaderRow}>
                  <LinkIcon size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.inviteCodeAndLink || 'Mã mời & Liên kết tham gia'}
                  </Text>
                </View>

                {/* 1. Mã mời tham gia */}
                <View style={[styles.codeRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.codeLabel, { color: colors.subtle }]}>
                      {t.circle.inviteCodeLabel || 'Mã mời'}:
                    </Text>
                    <Text style={[styles.codeText, { color: colors.text }]}>{inviteCode || '------'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopyCode}
                    style={[styles.smallPrimaryBtn, { backgroundColor: colors.primary }]}
                  >
                    {copiedCode ? <Check size={14} color={colors.onPrimary} /> : <Copy size={14} color={colors.onPrimary} />}
                    <Text style={[styles.smallPrimaryBtnText, { color: colors.onPrimary }]}>
                      {copiedCode ? (t.circle.copiedInviteCode || 'Đã sao chép') : (t.circle.copyCodeBtn || 'Sao chép mã')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 2. Liên kết tham gia */}
                <View style={[styles.codeRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.codeLabel, { color: colors.subtle }]}>
                      {t.circle.linkTitle || 'Liên kết'}:
                    </Text>
                    <Text numberOfLines={1} style={[styles.inviteLinkTextClean, { color: colors.text }]}>
                      {inviteLink}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={handleCopyLink}
                      style={[styles.smallOutlineBtn, { borderColor: colors.hairline, backgroundColor: colors.surface }]}
                    >
                      {copiedLink ? <Check size={14} color={colors.success || '#10B981'} /> : <Copy size={14} color={colors.text} />}
                      <Text style={[styles.smallOutlineBtnText, { color: colors.text }]}>
                        {copiedLink ? 'Đã sao chép' : 'Sao chép'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleShareInvite}
                      style={[styles.smallOutlineBtn, { borderColor: colors.hairline, backgroundColor: colors.surface }]}
                    >
                      <Share2 size={14} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Section 3: Giải tán Vòng tròn */}
              {isOwner && (
                <View style={[styles.card, { backgroundColor: `${colors.danger}08`, borderColor: `${colors.danger}30` }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDeleteCircle}
                    style={[styles.dangerFullBtn, { backgroundColor: colors.danger }]}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                    <Text style={styles.dangerFullBtnText}>{t.circle.deleteCircle || 'Giải tán Vòng tròn'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* =========================================================================
              SUB-VIEW 5: TRỢ GIÚP & BÁO CÁO (Trợ giúp & Báo cáo)
             ========================================================================= */}
          {activeTab === 'supportReports' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {/* 1. Báo cáo người dùng vi phạm (Opens popup) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsReportUserOpen(true)}
                  style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.reportUserTitle || 'Báo cáo người dùng'}
                    </Text>
                    <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                      Báo cáo thành viên có hành vi quấy rối, vi phạm
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.subtle} />
                </TouchableOpacity>

                {/* 2. Báo cáo Vòng tròn (Opens popup) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsReportOpen(true)}
                  style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.reportCircleTitle || 'Báo cáo Vòng tròn'}
                    </Text>
                    <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                      Báo cáo nội dung không phù hợp trong nhóm
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.subtle} />
                </TouchableOpacity>

                {/* 3. Quy tắc cộng đồng Accordion */}
                <View style={[styles.preferenceRowColumn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={styles.labelRowBetween}>
                    <Text style={[styles.prefTitle, { color: colors.text }]}>
                      {t.circle.helpCenterTitle || 'Quy tắc cộng đồng'}
                    </Text>
                    <TouchableOpacity onPress={() => setIsHelpOpen(!isHelpOpen)}>
                      <Text style={[styles.linkText, { color: colors.primary }]}>
                        {isHelpOpen ? 'Thu gọn' : 'Xem hướng dẫn'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isHelpOpen && (
                    <View style={[styles.guidelinesBox, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                      <Text style={[styles.guidelineItem, { color: colors.subtle }]}>
                        • Tôn trọng quyền riêng tư và thông tin cá nhân của các thành viên.
                      </Text>
                      <Text style={[styles.guidelineItem, { color: colors.subtle }]}>
                        • Không phát tán liên kết mời ra ngoài mà không có sự đồng ý của nhóm.
                      </Text>
                      <Text style={[styles.guidelineItem, { color: colors.subtle }]}>
                        • Giữ môi trường giao lưu văn minh, tích cực và tương trợ lẫn nhau.
                      </Text>
                    </View>
                  )}
                </View>

                {/* 4. Rời Vòng tròn */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleLeaveCircle}
                  style={[styles.dangerFullBtn, { backgroundColor: colors.danger, marginTop: 4 }]}
                >
                  <LogOut size={16} color="#FFFFFF" />
                  <Text style={styles.dangerFullBtnText}>{t.circle.leaveCircle || 'Rời Vòng tròn'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* =========================================================================
              POPUP MODAL 1: MUTE DURATION SELECTOR
             ========================================================================= */}
          {isMuteDurationModalOpen && (
            <Modal transparent animationType="fade" visible={isMuteDurationModalOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Tắt thông báo trong bao lâu?
                  </Text>
                  <View style={{ gap: 8 }}>
                    {[
                      { key: '15m', label: '15 phút' },
                      { key: '1h', label: '1 giờ' },
                      { key: '8h', label: '8 giờ' },
                      { key: '24h', label: '24 giờ' },
                      { key: 'forever', label: 'Cho đến khi tôi bật lại' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => handleSelectMuteDuration(item.key)}
                        style={[
                          styles.popupOptionItem,
                          { backgroundColor: muteDuration === item.key ? `${colors.primary}15` : colors.wash },
                        ]}
                      >
                        <Text style={[styles.popupOptionText, { color: colors.text }]}>{item.label}</Text>
                        {muteDuration === item.key && <Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsMuteDurationModalOpen(false)}
                    style={[styles.actionBtn, { backgroundColor: colors.wash, marginTop: 4 }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Hủy'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              POPUP MODAL 2: MESSAGE NOTIFICATION LEVEL SELECTOR
             ========================================================================= */}
          {isMsgLevelModalOpen && (
            <Modal transparent animationType="fade" visible={isMsgLevelModalOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Thông báo về tin nhắn
                  </Text>
                  <View style={{ gap: 8 }}>
                    {[
                      { key: 'all', label: 'Tất cả tin nhắn' },
                      { key: 'mentions', label: 'Chỉ lượt nhắc (@) và phản hồi' },
                      { key: 'none', label: 'Không nhận thông báo' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => {
                          setMessageNotificationLevel(item.key as any);
                          setIsMsgLevelModalOpen(false);
                        }}
                        style={[
                          styles.popupOptionItem,
                          { backgroundColor: messageNotificationLevel === item.key ? `${colors.primary}15` : colors.wash },
                        ]}
                      >
                        <Text style={[styles.popupOptionText, { color: colors.text }]}>{item.label}</Text>
                        {messageNotificationLevel === item.key && <Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsMsgLevelModalOpen(false)}
                    style={[styles.actionBtn, { backgroundColor: colors.wash, marginTop: 4 }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Đóng'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              POPUP MODAL 3: CAPACITY SELECTOR (Không giới hạn / Nhập số lượng)
             ========================================================================= */}
          {isCapacityModalOpen && (
            <Modal transparent animationType="fade" visible={isCapacityModalOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Số lượng thành viên tối đa
                  </Text>

                  {/* Option 1: Không giới hạn */}
                  <TouchableOpacity
                    onPress={() => handleApplyCapacity(null)}
                    style={[
                      styles.popupOptionItem,
                      { backgroundColor: formMaxMembers === null ? `${colors.primary}15` : colors.wash },
                    ]}
                  >
                    <Text style={[styles.popupOptionText, { color: colors.text }]}>Không giới hạn (Mặc định)</Text>
                    {formMaxMembers === null && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>

                  {/* Option 2: Giới hạn số lượng */}
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <Text style={[styles.label, { color: colors.text }]}>Hoặc đặt giới hạn cụ thể:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput
                        keyboardType="number-pad"
                        value={tempCapacityInput}
                        onChangeText={setTempCapacityInput}
                        placeholder="Nhập số (2 - 10,000)..."
                        placeholderTextColor={colors.subtle}
                        style={[
                          styles.input,
                          { backgroundColor: colors.wash, borderColor: colors.primary, color: colors.text, flex: 1 },
                        ]}
                      />
                      <Text style={[styles.subtleText, { color: colors.subtle }]}>thành viên</Text>
                    </View>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => setIsCapacityModalOpen(false)}
                      style={[styles.actionBtn, { backgroundColor: colors.wash }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Hủy'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const parsed = parseInt(tempCapacityInput.trim(), 10);
                        if (!isNaN(parsed) && parsed >= 2) {
                          handleApplyCapacity(Math.min(10000, parsed));
                        } else {
                          handleApplyCapacity(null);
                        }
                      }}
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Áp dụng</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              POPUP MODAL 4: MANAGE MUTED MEMBERS
             ========================================================================= */}
          {isManageMutedMembersOpen && (
            <Modal transparent animationType="slide" visible={isManageMutedMembersOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.addFriendsCard, { backgroundColor: colors.sheetBg, borderColor: colors.glassBorder }]}>
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      Tắt thông báo từ thành viên
                    </Text>
                    <TouchableOpacity onPress={() => setIsManageMutedMembersOpen(false)} style={[styles.closeBtn, { backgroundColor: colors.wash }]}>
                      <X size={18} color={colors.subtle} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.hairline, marginBottom: 8 }]}>
                    <Search size={15} color={colors.subtle} />
                    <TextInput
                      value={memberMuteSearch}
                      onChangeText={setMemberMuteSearch}
                      placeholder="Tìm thành viên..."
                      placeholderTextColor={colors.subtle}
                      style={[styles.searchInput, { color: colors.text }]}
                    />
                  </View>

                  <ScrollView style={{ maxHeight: 280 }}>
                    {members
                      .filter((m) => m.userId !== user?.id)
                      .filter((m) => {
                        if (!memberMuteSearch.trim()) return true;
                        const name = m.nickname || m.user?.profile?.displayName || m.user?.email || '';
                        return name.toLowerCase().includes(memberMuteSearch.toLowerCase().trim());
                      })
                      .map((m) => {
                        const isMuted = mutedMemberIds.includes(m.userId);
                        const name = m.nickname || m.user?.profile?.displayName || m.user?.email?.split('@')[0] || 'Member';
                        return (
                          <View key={m.id} style={styles.memberMuteRow}>
                            <View style={styles.memberLeft}>
                              <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}20` }]}>
                                <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(name)}</Text>
                              </View>
                              <Text numberOfLines={1} style={[styles.memberName, { color: colors.text, flex: 1 }]}>
                                {name}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleToggleMuteMember(m.userId)}
                              style={[
                                styles.muteMemberToggleBtn,
                                { backgroundColor: isMuted ? `${colors.danger}20` : colors.wash },
                              ]}
                            >
                              {isMuted ? <BellOff size={13} color={colors.danger} /> : <Bell size={13} color={colors.subtle} />}
                              <Text style={[styles.muteMemberToggleText, { color: isMuted ? colors.danger : colors.subtle }]}>
                                {isMuted ? 'Đã tắt tiếng' : 'Bật tiếng'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                  </ScrollView>

                  <TouchableOpacity
                    onPress={() => setIsManageMutedMembersOpen(false)}
                    style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Hoàn tất</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              POPUP MODAL 5: AVATAR PICKER (Presets)
             ========================================================================= */}
          {isAvatarPickerOpen && (
            <Modal transparent animationType="fade" visible={isAvatarPickerOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Chọn ảnh đại diện nhóm
                  </Text>
                  <View style={styles.avatarPresetsGrid}>
                    {AVATAR_PRESETS.map((presetUrl, idx) => {
                      const isSelected = formAvatar === presetUrl;
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.8}
                          onPress={() => {
                            setFormAvatar(presetUrl);
                            setIsAvatarPickerOpen(false);
                          }}
                          style={[
                            styles.presetAvatarBtn,
                            { borderColor: isSelected ? colors.primary : colors.hairline },
                            isSelected && { borderWidth: 2.5 },
                          ]}
                        >
                          <RNImage source={{ uri: presetUrl }} style={styles.presetAvatarImg} />
                          {isSelected && (
                            <View style={[styles.presetCheckBadge, { backgroundColor: colors.primary }]}>
                              <Check size={11} color={colors.onPrimary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsAvatarPickerOpen(false)}
                    style={[styles.actionBtn, { backgroundColor: colors.wash, marginTop: 8 }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Đóng'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              POPUP MODAL 6: REPORT USER
             ========================================================================= */}
          {isReportUserOpen && (
            <Modal transparent animationType="slide" visible={isReportUserOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Báo cáo người dùng
                  </Text>
                  <Text style={[styles.label, { color: colors.text }]}>Chọn thành viên:</Text>
                  <ScrollView style={{ maxHeight: 120 }}>
                    {members.filter((m) => m.userId !== user?.id).map((m) => {
                      const mName = m.nickname || m.user?.profile?.displayName || m.user?.email || 'User';
                      const isSelected = reportedUserId === m.userId;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => setReportedUserId(m.userId)}
                          style={[
                            styles.radioRow,
                            isSelected && { backgroundColor: `${colors.primary}15`, borderRadius: 8, paddingHorizontal: 6 },
                          ]}
                        >
                          <View style={[styles.radioCircle, { borderColor: isSelected ? colors.primary : colors.subtle }]}>
                            {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                          </View>
                          <Text style={[styles.radioLabel, { color: colors.text }]}>{mName}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={[styles.label, { color: colors.text, marginTop: 6 }]}>Lý do vi phạm:</Text>
                  {[
                    { key: 'harassment', label: 'Quấy rối, công kích cá nhân' },
                    { key: 'spam', label: 'Spam, quảng cáo rác' },
                    { key: 'inappropriate', label: 'Nội dung phản cảm, thù ghét' },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => setReportUserReason(r.key)}
                      style={styles.radioRow}
                    >
                      <View style={[styles.radioCircle, { borderColor: reportUserReason === r.key ? colors.primary : colors.subtle }]}>
                        {reportUserReason === r.key && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                      </View>
                      <Text style={[styles.radioLabel, { color: colors.text }]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => setIsReportUserOpen(false)}
                      style={[styles.actionBtn, { backgroundColor: colors.wash }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Hủy'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSubmitReportUser}
                      style={[styles.actionBtn, { backgroundColor: colors.danger || '#EF4444' }]}
                    >
                      <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Gửi báo cáo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              POPUP MODAL 7: REPORT CIRCLE
             ========================================================================= */}
          {isReportOpen && (
            <Modal transparent animationType="slide" visible={isReportOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    Báo cáo Vòng tròn
                  </Text>
                  <Text style={[styles.label, { color: colors.text }]}>Chọn lý do báo cáo:</Text>
                  {[
                    { key: 'harassment', label: 'Quấy rối, đe dọa hoặc thù ghét' },
                    { key: 'spam', label: 'Spam, lừa đảo hoặc quảng cáo' },
                    { key: 'inappropriate', label: 'Nội dung vi phạm pháp luật' },
                    { key: 'impersonation', label: 'Mạo danh tổ chức, cá nhân khác' },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => setReportReason(r.key)}
                      style={styles.radioRow}
                    >
                      <View style={[styles.radioCircle, { borderColor: reportReason === r.key ? colors.primary : colors.subtle }]}>
                        {reportReason === r.key && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                      </View>
                      <Text style={[styles.radioLabel, { color: colors.text }]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => setIsReportOpen(false)}
                      style={[styles.actionBtn, { backgroundColor: colors.wash }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Hủy'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSubmitReportCircle}
                      style={[styles.actionBtn, { backgroundColor: colors.danger || '#EF4444' }]}
                    >
                      <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Gửi báo cáo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              SUBMODAL: EDIT NICKNAME
             ========================================================================= */}
          {editingMember && (
            <Modal transparent animationType="fade" visible={Boolean(editingMember)}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    {t.circle.editNickname || 'Đổi biệt danh'}
                  </Text>
                  <Text style={[styles.subModalDesc, { color: colors.subtle }]}>
                    {editingMember.name}
                  </Text>

                  <TextInput
                    value={nicknameInput}
                    onChangeText={setNicknameInput}
                    maxLength={30}
                    placeholder={t.circle.nicknamePlaceholder || 'Nhập biệt danh cho thành viên...'}
                    placeholderTextColor={colors.subtle}
                    style={[styles.input, { backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text }]}
                  />

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => setEditingMember(null)}
                      style={[styles.actionBtn, { backgroundColor: colors.wash }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Hủy'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveNickname}
                      disabled={updateNicknameMutation.isPending}
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    >
                      {updateNicknameMutation.isPending ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>{t.common.save || 'Lưu'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* =========================================================================
              SUBMODAL: ADD FRIENDS
             ========================================================================= */}
          {isAddFriendsOpen && (
            <Modal transparent animationType="slide" visible={isAddFriendsOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.addFriendsCard, { backgroundColor: colors.sheetBg, borderColor: colors.glassBorder }]}>
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {t.circle.addMembersTitle || 'Thêm bạn bè vào Vòng tròn'}
                    </Text>
                    <TouchableOpacity onPress={() => setIsAddFriendsOpen(false)} style={[styles.closeBtn, { backgroundColor: colors.wash }]}>
                      <X size={18} color={colors.subtle} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.hairline, marginBottom: 8 }]}>
                    <Search size={15} color={colors.subtle} />
                    <TextInput
                      value={friendSearch}
                      onChangeText={setFriendSearch}
                      placeholder={t.circle.friendsSearchPlaceholder || 'Tìm kiếm bạn bè...'}
                      placeholderTextColor={colors.subtle}
                      style={[styles.searchInput, { color: colors.text }]}
                    />
                  </View>

                  <View style={styles.selectAllRow}>
                    <TouchableOpacity onPress={handleSelectAllFriends}>
                      <Text style={[styles.linkText, { color: colors.primary }]}>
                        {selectedFriendIds.length === availableFriends.length && availableFriends.length > 0
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 240 }}>
                    {isLoadingFriends ? (
                      <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
                    ) : availableFriends.length === 0 ? (
                      <View style={[styles.emptyBox, { backgroundColor: colors.wash }]}>
                        <Text style={[styles.emptyText, { color: colors.subtle }]}>
                          {t.circle.noSelectableFriends || 'Không có bạn bè khả dụng'}
                        </Text>
                      </View>
                    ) : (
                      availableFriends.map((f) => {
                        const isSelected = selectedFriendIds.includes(f.id);
                        return (
                          <TouchableOpacity
                            key={f.id}
                            onPress={() => handleToggleSelectFriend(f.id)}
                            style={[
                              styles.friendSelectItem,
                              { backgroundColor: isSelected ? `${colors.primary}12` : colors.surface, borderColor: colors.hairline },
                            ]}
                          >
                            <View style={styles.memberLeft}>
                              <View style={[styles.avatarBox, { backgroundColor: colors.wash }]}>
                                <Text style={[styles.avatarText, { color: colors.primary }]}>
                                  {getInitials(f.displayName || f.email)}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.memberName, { color: colors.text }]}>{f.displayName}</Text>
                                <Text style={[styles.subtleText, { color: colors.subtle }]}>{f.email}</Text>
                              </View>
                            </View>
                            <View
                              style={[
                                styles.checkbox,
                                {
                                  borderColor: isSelected ? colors.primary : colors.subtle,
                                  backgroundColor: isSelected ? colors.primary : 'transparent',
                                },
                              ]}
                            >
                              {isSelected && <Check size={14} color={colors.onPrimary} />}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => setIsAddFriendsOpen(false)}
                      style={[styles.actionBtn, { backgroundColor: colors.wash }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel || 'Hủy'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleConfirmAddMembers}
                      disabled={selectedFriendIds.length === 0 || addMembersMutation.isPending}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor:
                            selectedFriendIds.length > 0 && !addMembersMutation.isPending
                              ? colors.primary
                              : `${colors.primary}50`,
                        },
                      ]}
                    >
                      {addMembersMutation.isPending ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>
                          {t.circle.addMembersSubmit || 'Thêm vào Vòng tròn'} ({selectedFriendIds.length})
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  circleBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  circleBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerTitleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  backToMenuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  subHeaderPlaceholder: {
    width: 34,
    height: 34,
  },
  bannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tabContent: {
    gap: 14,
    paddingBottom: 24,
  },
  menuSectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowContent: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requestCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  formField: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    marginTop: 4,
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileHeaderBox: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  avatarWithCameraContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  bigAvatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bigAvatarImg: {
    width: '100%',
    height: '100%',
  },
  bigAvatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  profileCircleName: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  profileCircleHandle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  pencilToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 6,
  },
  pencilToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avatarPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetAvatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  presetCheckBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedSubTabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
  },
  membersContainer: {
    flex: 1,
    gap: 12,
  },
  memberControlsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  addMemberBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberList: {
    gap: 10,
    paddingBottom: 24,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  memberAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
  },
  selfBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selfBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pencilBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtleText: {
    fontSize: 11,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  preferenceRowColumn: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  prefDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  smallOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallOutlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  smallPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallPrimaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberMuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#8882',
  },
  muteMemberToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  muteMemberToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioLabel: {
    fontSize: 12,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  guidelinesBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  guidelineItem: {
    fontSize: 11,
    lineHeight: 16,
  },
  inviteLinkTextClean: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  codeText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  requestMsg: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 14,
  },
  dangerFullBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  subModalDesc: {
    fontSize: 13,
  },
  popupOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  popupOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addFriendsCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    borderWidth: 1.2,
    padding: 20,
    gap: 10,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  friendSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
