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
  Globe,
  Lock,
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
  CheckSquare,
  Square,
  Pencil,
  Save,
  Share2,
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
} from '../../hooks/use-circle-queries';
import { MemberRole } from '@circle/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

  // Form States (matching web CircleManagementModal)
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formCover, setFormCover] = useState('');
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formMaxMembers, setFormMaxMembers] = useState<number | null>(null);

  // Sub-dialog & Action States
  const [editingMember, setEditingMember] = useState<{ id: string; nickname: string; name: string } | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  // Personal Privacy & Support State
  const [readReceipts, setReadReceipts] = useState<boolean>(true);
  const [notificationMute, setNotificationMute] = useState<string>('all');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Feedback Banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state when modal opens or activeCircle changes
  useEffect(() => {
    if (visible && circle) {
      setFormName('');
      setFormDesc(circle.description || '');
      setFormAvatar(circle.avatarUrl || '');
      setFormCover(circle.coverUrl || '');
      setFormIsPrivate(Boolean(circle.isPrivate));
      setFormMaxMembers(circle.maxMembers ?? null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsAddFriendsOpen(false);
      setSelectedFriendIds([]);
      setFriendSearch('');
      setMemberSearch('');
      setIsReportOpen(false);
      setIsHelpOpen(false);
      setEditingMember(null);
    }
  }, [visible, circle]);

  const handleClose = () => {
    setVisible(false);
    setActiveTab('menu');
    setEditingMember(null);
    setIsAddFriendsOpen(false);
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
        message: `${t.circle.sharedContentText.replace('{name}', circle.name)}: ${inviteLink}`,
        url: inviteLink,
      });
    } catch {
      // User cancelled
    }
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setSuccessMessage(t.circle.copiedInviteLink);
    setTimeout(() => {
      setCopiedLink(false);
      setSuccessMessage(null);
    }, 2500);
  };

  const handleCopyCode = () => {
    setCopiedCode(true);
    setSuccessMessage(t.circle.copiedInviteCode);
    setTimeout(() => {
      setCopiedCode(false);
      setSuccessMessage(null);
    }, 2500);
  };

  // Tab 1: Save Chat Information (Name, Avatar, Cover, Description)
  const handleSaveChatInfo = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetName = formName.trim() || circle?.name || '';
    if (!targetName || targetName.length < 2) {
      setErrorMessage(t.validation.circleNameMinLength);
      return;
    }

    try {
      await updateCircleMutation.mutateAsync({
        name: targetName,
        description: formDesc.trim() || undefined,
        avatarUrl: formAvatar.trim() || undefined,
        coverUrl: formCover.trim() || undefined,
      });
      setFormName('');
      setSuccessMessage(t.circle.savedSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || t.circle.createError);
    }
  };

  // Tab 4: Save Circle Group Settings (isPrivate, maxMembers)
  const handleSaveCircleSettings = async () => {
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
      setSuccessMessage(t.circle.nicknameUpdated);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
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
      setSuccessMessage(t.circle.addMembersSuccess);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleKickMember = (memberId: string, name: string) => {
    Alert.alert(
      t.circle.kickMember,
      t.circle.kickMemberConfirm.replace('{name}', name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.circle.kickMember,
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberMutation.mutateAsync(memberId);
            } catch (err: any) {
              Alert.alert(t.common.appName, err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleTransferOwnership = (newOwnerId: string, name: string) => {
    Alert.alert(
      t.circle.transferOwnership,
      t.circle.transferOwnershipConfirm.replace('{name}', name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.circle.transferOwnership,
          style: 'destructive',
          onPress: async () => {
            try {
              await transferOwnershipMutation.mutateAsync(newOwnerId);
            } catch (err: any) {
              Alert.alert(t.common.appName, err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleLeaveCircle = () => {
    if (isOwner && members.length > 1) {
      Alert.alert(t.circle.leaveCircle, t.circle.ownerCannotLeaveMustTransfer);
      return;
    }
    Alert.alert(
      t.circle.leaveCircle,
      t.circle.leaveCircleConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.circle.leaveCircle,
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCircleMutation.mutateAsync();
            } catch (err: any) {
              Alert.alert(t.common.appName, err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleDeleteCircle = () => {
    Alert.alert(
      t.circle.deleteCircle,
      t.circle.deleteCircleConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.circle.deleteCircle,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCircleMutation.mutateAsync();
            } catch (err: any) {
              Alert.alert(t.common.appName, err?.message || t.common.unknownError);
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
      setSuccessMessage(status === 'APPROVED' ? t.circle.joinRequestApproved : t.circle.joinRequestRejected);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleSubmitReport = () => {
    setIsReportOpen(false);
    setSuccessMessage(t.circle.reportSubmittedSuccess);
    setTimeout(() => setSuccessMessage(null), 3500);
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
        return t.circle.chatInfoTab;
      case 'members':
        return `${t.circle.settingsTabMembers} (${members.length})`;
      case 'privacySupport':
        return t.circle.privacyAndSupportTab;
      case 'circleSettings':
      case 'settings':
        return t.circle.circleSettingsTab;
      case 'requests':
        return t.circle.joinRequestsTitle;
      default:
        return t.nav.circleSettings;
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
              ROOT MENU: VERTICAL LIST-STYLE GROUPED ROWS (Apple Settings Style)
             ========================================================================= */}
          {activeTab === 'menu' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Group 1: 4 Main Settings Rows matching Web Tabs */}
              <View style={[styles.menuSectionCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {/* 1. Chat Info */}
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
                      {t.circle.chatInfoTab}
                    </Text>
                    <Text numberOfLines={1} style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {circle.name} · {circle.description || t.circle.descLabel}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>

                {/* 2. Members */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('members')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.info}18` }]}>
                    <Users size={18} color={colors.info} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.settingsTabMembers}
                    </Text>
                    <Text numberOfLines={1} style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {members.length} {t.circle.settingsTabMembers.toLowerCase()} · {t.circle.setNickname}
                    </Text>
                  </View>
                  <View style={styles.menuRowRight}>
                    <View style={[styles.countBadge, { backgroundColor: colors.wash }]}>
                      <Text style={[styles.countBadgeText, { color: colors.text }]}>{members.length}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.subtle} />
                  </View>
                </TouchableOpacity>

                {/* 3. Personal Privacy & Support */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('privacySupport')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: 1 }]}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.success}18` }]}>
                    <ShieldCheck size={18} color={colors.success} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.privacyAndSupportTab}
                    </Text>
                    <Text numberOfLines={1} style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {t.circle.personalPrivacySubtitle}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>

                {/* 4. Circle Group Setup */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveTab('circleSettings')}
                  style={styles.menuRowItem}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: `${colors.warning}18` }]}>
                    <Sliders size={18} color={colors.warning} />
                  </View>
                  <View style={styles.menuRowContent}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {t.circle.circleSettingsTab}
                    </Text>
                    <Text numberOfLines={1} style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {circle.isPrivate ? t.circle.privacyPrivate : t.circle.privacyPublic} · {t.circle.inviteLinkCardTitle}
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
                      {t.circle.inviteCodeLabel}: {inviteCode || '------'}
                    </Text>
                    <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {t.circle.shareInvite}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              {/* Group 3: Danger Zone (Leave / Delete) */}
              <View style={[styles.menuSectionCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {!isOwner && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleLeaveCircle}
                    style={styles.menuRowItem}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: `${colors.danger}18` }]}>
                      <LogOut size={18} color={colors.danger} />
                    </View>
                    <View style={styles.menuRowContent}>
                      <Text style={[styles.menuRowTitle, { color: colors.danger }]}>
                        {t.circle.leaveCircle}
                      </Text>
                      <Text numberOfLines={1} style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                        {t.circle.leaveCirclePersonalDesc}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.danger} />
                  </TouchableOpacity>
                )}

                {isOwner && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleDeleteCircle}
                    style={styles.menuRowItem}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: `${colors.danger}18` }]}>
                      <Trash2 size={18} color={colors.danger} />
                    </View>
                    <View style={styles.menuRowContent}>
                      <Text style={[styles.menuRowTitle, { color: colors.danger }]}>
                        {t.circle.deleteCircle}
                      </Text>
                      <Text numberOfLines={1} style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                        {t.circle.deleteCircleWarning}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {/* =========================================================================
              SUB-VIEW 1: CHAT INFO (Thông tin đoạn chat)
             ========================================================================= */}
          {(activeTab === 'chatInfo' || activeTab === 'info') && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {t.circle.chatInfoTitle}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.subtle }]}>
                  {t.circle.chatInfoSubtitle}
                </Text>

                {/* Name */}
                <View style={styles.formField}>
                  <Text style={[styles.label, { color: colors.text }]}>{t.circle.nameLabel}</Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    editable={isOwner}
                    placeholder={circle.name || t.circle.namePlaceholder}
                    placeholderTextColor={colors.subtle}
                    style={[
                      styles.input,
                      { backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text },
                      !isOwner && { opacity: 0.6 },
                    ]}
                  />
                </View>

                {/* Avatar URL + Preview */}
                <View style={styles.formField}>
                  <View style={styles.labelRow}>
                    <ImageIcon size={14} color={colors.primary} />
                    <Text style={[styles.label, { color: colors.text }]}>{t.circle.avatarUrlLabel}</Text>
                  </View>
                  <View style={styles.avatarInputRow}>
                    <View style={[styles.avatarPreviewBox, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                      {formAvatar ? (
                        <RNImage source={{ uri: formAvatar }} style={styles.avatarPreviewImg} />
                      ) : (
                        <Text style={[styles.avatarPreviewText, { color: colors.primary }]}>
                          {formName ? getInitials(formName) : 'AV'}
                        </Text>
                      )}
                    </View>
                    <TextInput
                      value={formAvatar}
                      onChangeText={setFormAvatar}
                      editable={isOwner}
                      placeholder={t.circle.avatarUrlPlaceholder}
                      placeholderTextColor={colors.subtle}
                      style={[
                        styles.input,
                        { flex: 1, backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text },
                        !isOwner && { opacity: 0.6 },
                      ]}
                    />
                  </View>
                </View>

                {/* Cover URL */}
                <View style={styles.formField}>
                  <View style={styles.labelRow}>
                    <ImageIcon size={14} color={colors.primary} />
                    <Text style={[styles.label, { color: colors.text }]}>{t.circle.coverUrlLabel}</Text>
                  </View>
                  <TextInput
                    value={formCover}
                    onChangeText={setFormCover}
                    editable={isOwner}
                    placeholder={t.circle.coverUrlPlaceholder}
                    placeholderTextColor={colors.subtle}
                    style={[
                      styles.input,
                      { backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text },
                      !isOwner && { opacity: 0.6 },
                    ]}
                  />
                </View>

                {/* Description */}
                <View style={styles.formField}>
                  <Text style={[styles.label, { color: colors.text }]}>{t.circle.descLabel}</Text>
                  <TextInput
                    value={formDesc}
                    onChangeText={setFormDesc}
                    editable={isOwner}
                    multiline
                    numberOfLines={3}
                    placeholder={t.circle.descPlaceholder}
                    placeholderTextColor={colors.subtle}
                    style={[
                      styles.input,
                      styles.textArea,
                      { backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text },
                      !isOwner && { opacity: 0.6 },
                    ]}
                  />
                </View>

                {/* Save Button (Owner Only) */}
                {isOwner && (
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
                          {t.circle.saveChanges}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {/* =========================================================================
              SUB-VIEW 2: MEMBERS & NICKNAMES (Thành viên)
             ========================================================================= */}
          {activeTab === 'members' && (
            <View style={styles.membersContainer}>
              {/* Member Controls: Count & Add Member button */}
              <View style={styles.memberControlsRow}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.hairline, flex: 1 }]}>
                  <Search size={15} color={colors.subtle} />
                  <TextInput
                    value={memberSearch}
                    onChangeText={setMemberSearch}
                    placeholder={t.circle.friendsSearchPlaceholder}
                    placeholderTextColor={colors.subtle}
                    style={[styles.searchInput, { color: colors.text }]}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsAddFriendsOpen(true)}
                  style={[styles.addMemberBtn, { backgroundColor: colors.primary }]}
                >
                  <UserPlus size={16} color={colors.onPrimary} />
                  <Text style={[styles.addMemberBtnText, { color: colors.onPrimary }]}>
                    {t.circle.addMemberBtn}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Members List */}
              {isLoadingMembers ? (
                <ActivityIndicator style={{ marginVertical: 30 }} color={colors.primary} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.memberList}>
                  {filteredMembers.map((m) => {
                    const realDisplayName = m.user?.profile?.displayName || m.user?.email?.split('@')[0] || t.auth.member;
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
                              {/* Inline Pencil Icon to change nickname */}
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => handleOpenNicknameDialog(m.id, m.nickname ?? null, realDisplayName)}
                                style={[styles.pencilBtn, { backgroundColor: colors.wash }]}
                              >
                                <Pencil size={12} color={colors.subtle} />
                              </TouchableOpacity>
                            </View>

                            <Text numberOfLines={1} style={[styles.subtleText, { color: colors.subtle }]}>
                              {hasNickname ? `${realDisplayName} · ${m.user?.email}` : m.user?.email}
                            </Text>
                          </View>
                        </View>

                        {/* Right: Role & Actions */}
                        <View style={styles.memberRight}>
                          {isMemberOwner ? (
                            <View style={[styles.roleBadge, { backgroundColor: `${colors.warning}20` }]}>
                              <Crown size={12} color={colors.warning} />
                              <Text style={[styles.roleText, { color: colors.warning }]}>
                                {t.circle.memberRoleOwner}
                              </Text>
                            </View>
                          ) : isMemberAdmin ? (
                            <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}20` }]}>
                              <ShieldCheck size={12} color={colors.primary} />
                              <Text style={[styles.roleText, { color: colors.primary }]}>
                                {t.circle.memberRoleAdmin}
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.roleBadge, { backgroundColor: colors.wash }]}>
                              <Text style={[styles.roleText, { color: colors.subtle }]}>
                                {t.circle.memberRoleMember}
                              </Text>
                            </View>
                          )}

                          {/* Owner Controls (Transfer & Kick) */}
                          {isOwner && !isMemberOwner && !isSelf && (
                            <View style={styles.memberActions}>
                              <TouchableOpacity
                                onPress={() => handleTransferOwnership(m.userId, realDisplayName)}
                                style={[styles.iconActionBtn, { backgroundColor: `${colors.warning}15` }]}
                              >
                                <Crown size={14} color={colors.warning} />
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
              )}
            </View>
          )}

          {/* =========================================================================
              SUB-VIEW 3: PERSONAL PRIVACY & SUPPORT (Quyền riêng tư & Hỗ trợ)
             ========================================================================= */}
          {activeTab === 'privacySupport' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Notice Box */}
              <View style={[styles.noticeCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}>
                <ShieldCheck size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.noticeTitle, { color: colors.text }]}>
                    {t.circle.personalPrivacyTitle}
                  </Text>
                  <Text style={[styles.noticeDesc, { color: colors.subtle }]}>
                    {t.circle.personalPrivacySubtitle}
                  </Text>
                </View>
              </View>

              {/* Section 1: Privacy & Messaging */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.sectionHeaderRow}>
                  <Eye size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.privacyAndMessaging}
                  </Text>
                </View>

                {/* Read Receipts Toggle */}
                <View style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={styles.labelRow}>
                      {readReceipts ? <Eye size={16} color={colors.primary} /> : <EyeOff size={16} color={colors.subtle} />}
                      <Text style={[styles.prefTitle, { color: colors.text }]}>
                        {t.circle.readReceiptsTitle}
                      </Text>
                    </View>
                    <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                      {t.circle.readReceiptsDesc}
                    </Text>
                  </View>
                  <Switch
                    value={readReceipts}
                    onValueChange={(val) => {
                      setReadReceipts(val);
                      setSuccessMessage(t.circle.savedSuccess);
                      setTimeout(() => setSuccessMessage(null), 2000);
                    }}
                    trackColor={{ false: colors.hairline, true: colors.primary }}
                  />
                </View>

                {/* Chat Notifications Mute Selector */}
                <View style={[styles.preferenceRowColumn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={styles.labelRow}>
                    {notificationMute === 'off' ? (
                      <BellOff size={16} color={colors.danger} />
                    ) : (
                      <Bell size={16} color={colors.primary} />
                    )}
                    <View>
                      <Text style={[styles.prefTitle, { color: colors.text }]}>
                        {t.circle.chatNotificationsTitle}
                      </Text>
                      <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                        {t.circle.chatNotificationsDesc}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pillsGrid}>
                    {[
                      { key: 'all', label: t.circle.notificationAll },
                      { key: '15m', label: t.circle.notificationMute15m },
                      { key: '1h', label: t.circle.notificationMute1h },
                      { key: '8h', label: t.circle.notificationMute8h },
                      { key: '24h', label: t.circle.notificationMute24h },
                      { key: 'off', label: t.circle.notificationOff },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.7}
                        onPress={() => {
                          setNotificationMute(item.key);
                          setSuccessMessage(t.circle.savedSuccess);
                          setTimeout(() => setSuccessMessage(null), 2000);
                        }}
                        style={[
                          styles.mutePill,
                          notificationMute === item.key
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.surface, borderColor: colors.hairline },
                        ]}
                      >
                        <Text
                          style={[
                            styles.mutePillText,
                            notificationMute === item.key
                              ? { color: colors.onPrimary, fontWeight: '700' }
                              : { color: colors.text },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Section 2: Support & Reports */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.sectionHeaderRow}>
                  <HelpCircle size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.supportAndReports}
                  </Text>
                </View>

                {/* 1. Report Circle */}
                <View style={[styles.preferenceRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={styles.labelRow}>
                      <Flag size={16} color={colors.warning} />
                      <Text style={[styles.prefTitle, { color: colors.text }]}>
                        {t.circle.reportCircleTitle}
                      </Text>
                    </View>
                    <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                      {t.circle.reportCircleDesc}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsReportOpen(!isReportOpen)}
                    style={[styles.smallOutlineBtn, { borderColor: colors.warning }]}
                  >
                    <Text style={[styles.smallOutlineBtnText, { color: colors.warning }]}>
                      {isReportOpen ? t.common.cancel : 'Báo cáo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sub-form Report */}
                {isReportOpen && (
                  <View style={[styles.reportFormCard, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}30` }]}>
                    <Text style={[styles.reportTitle, { color: colors.text }]}>
                      Chọn lý do báo cáo Vòng tròn này:
                    </Text>
                    {[
                      { key: 'harassment', label: 'Nội dung quấy rối, công kích cá nhân' },
                      { key: 'spam', label: 'Tin nhắn rác, quảng cáo không mong muốn' },
                      { key: 'inappropriate', label: 'Nội dung người lớn hoặc vi phạm pháp luật' },
                      { key: 'impersonation', label: 'Mạo danh cá nhân, tổ chức khác' },
                    ].map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        activeOpacity={0.7}
                        onPress={() => setReportReason(r.key)}
                        style={styles.radioRow}
                      >
                        <View style={[styles.radioCircle, { borderColor: reportReason === r.key ? colors.primary : colors.subtle }]}>
                          {reportReason === r.key && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                        </View>
                        <Text style={[styles.radioLabel, { color: colors.text }]}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleSubmitReport}
                      style={[styles.submitReportBtn, { backgroundColor: colors.warning }]}
                    >
                      <Text style={styles.submitReportBtnText}>Gửi báo cáo</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 2. Help Center Accordion */}
                <View style={[styles.preferenceRowColumn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View style={styles.labelRowBetween}>
                    <View style={styles.labelRow}>
                      <HelpCircle size={16} color={colors.primary} />
                      <Text style={[styles.prefTitle, { color: colors.text }]}>
                        {t.circle.helpCenterTitle}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsHelpOpen(!isHelpOpen)}>
                      <Text style={[styles.linkText, { color: colors.primary }]}>
                        {isHelpOpen ? 'Thu gọn' : 'Xem hướng dẫn'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                    {t.circle.helpCenterDesc}
                  </Text>

                  {isHelpOpen && (
                    <View style={[styles.guidelinesBox, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                      <Text style={[styles.guidelinesHeader, { color: colors.text }]}>
                        Quy tắc cộng đồng CIRCLE:
                      </Text>
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

                {/* 3. Leave Circle Button */}
                <View style={[styles.preferenceRow, { backgroundColor: `${colors.danger}10`, borderColor: `${colors.danger}30` }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={styles.labelRow}>
                      <LogOut size={16} color={colors.danger} />
                      <Text style={[styles.prefTitle, { color: colors.danger }]}>
                        {t.circle.leaveCirclePersonalTitle}
                      </Text>
                    </View>
                    <Text style={[styles.prefDesc, { color: colors.subtle }]}>
                      {t.circle.leaveCirclePersonalDesc}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleLeaveCircle}
                    style={[styles.smallDangerBtn, { backgroundColor: colors.danger }]}
                  >
                    <Text style={styles.smallDangerBtnText}>{t.circle.leaveCircle}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          {/* =========================================================================
              SUB-VIEW 4: CIRCLE GROUP SETTINGS (Thiết lập Vòng tròn)
             ========================================================================= */}
          {(activeTab === 'circleSettings' || activeTab === 'settings') && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Section 1: Joining Mode & Capacity */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.sectionHeaderRow}>
                  <Sliders size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.circleSettingsTitle}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: colors.subtle }]}>
                  {t.circle.circleSettingsSubtitle}
                </Text>

                {/* Mode Selector Cards */}
                <View style={styles.modeCardsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!isOwner}
                    onPress={() => setFormIsPrivate(false)}
                    style={[
                      styles.modeCard,
                      !formIsPrivate
                        ? { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }
                        : { backgroundColor: colors.wash, borderColor: colors.hairline },
                      !isOwner && { opacity: 0.6 },
                    ]}
                  >
                    <Globe size={18} color={colors.primary} />
                    <Text style={[styles.modeCardTitle, { color: colors.text }]}>
                      {t.circle.privacyPublic}
                    </Text>
                    <Text style={[styles.modeCardDesc, { color: colors.subtle }]}>
                      {t.circle.circleModePublicDesc}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!isOwner}
                    onPress={() => setFormIsPrivate(true)}
                    style={[
                      styles.modeCard,
                      formIsPrivate
                        ? { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }
                        : { backgroundColor: colors.wash, borderColor: colors.hairline },
                      !isOwner && { opacity: 0.6 },
                    ]}
                  >
                    <Lock size={18} color={colors.primary} />
                    <Text style={[styles.modeCardTitle, { color: colors.text }]}>
                      {t.circle.privacyPrivate}
                    </Text>
                    <Text style={[styles.modeCardDesc, { color: colors.subtle }]}>
                      {t.circle.circleModePrivateDesc}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Capacity Selector */}
                <View style={styles.formField}>
                  <View style={styles.labelRowBetween}>
                    <Text style={[styles.label, { color: colors.text }]}>{t.circle.maxMembersLabel}</Text>
                    <Text style={[styles.subtleText, { color: colors.subtle }]}>
                      {t.circle.circleCapacityCount
                        .replace('{count}', String(members.length))
                        .replace('{max}', formMaxMembers ? String(formMaxMembers) : t.circle.maxMembersUnlimited)}
                    </Text>
                  </View>

                  <View style={styles.capacityPillsRow}>
                    {[
                      { val: null, label: t.circle.maxMembersUnlimited },
                      { val: 5, label: '5' },
                      { val: 10, label: '10' },
                      { val: 20, label: '20' },
                      { val: 50, label: '50' },
                      { val: 100, label: '100' },
                    ].map((cap, idx) => (
                      <TouchableOpacity
                        key={idx}
                        disabled={!isOwner}
                        onPress={() => setFormMaxMembers(cap.val)}
                        style={[
                          styles.capPill,
                          formMaxMembers === cap.val
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.wash, borderColor: colors.hairline },
                          !isOwner && { opacity: 0.6 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.capPillText,
                            formMaxMembers === cap.val
                              ? { color: colors.onPrimary, fontWeight: '700' }
                              : { color: colors.text },
                          ]}
                        >
                          {cap.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Save Group Settings Button (Owner Only) */}
                {isOwner && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={updateCircleMutation.isPending}
                    onPress={handleSaveCircleSettings}
                    style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                  >
                    {updateCircleMutation.isPending ? (
                      <ActivityIndicator color={colors.onPrimary} size="small" />
                    ) : (
                      <>
                        <Save size={16} color={colors.onPrimary} />
                        <Text style={[styles.primaryActionBtnText, { color: colors.onPrimary }]}>
                          {t.circle.saveCircleSettings}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Section 2: Invite Link & Code */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <View style={styles.sectionHeaderRow}>
                  <LinkIcon size={16} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.inviteLinkCardTitle}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: colors.subtle }]}>
                  {t.circle.inviteLinkCardDesc}
                </Text>

                {/* Link Box with Copy & Share */}
                <View style={[styles.inviteLinkContainer, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <LinkIcon size={14} color={colors.primary} />
                  <Text numberOfLines={1} style={[styles.inviteLinkText, { color: colors.text }]}>
                    {inviteLink}
                  </Text>
                  <View style={styles.inviteLinkBtns}>
                    <TouchableOpacity onPress={handleCopyLink} style={[styles.smallIconBtn, { backgroundColor: colors.surface }]}>
                      {copiedLink ? <Check size={14} color={colors.success} /> : <Copy size={14} color={colors.primary} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShareInvite} style={[styles.smallIconBtn, { backgroundColor: colors.primary }]}>
                      <Share2 size={14} color={colors.onPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Code Box */}
                <View style={[styles.codeRow, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                  <View>
                    <Text style={[styles.codeLabel, { color: colors.subtle }]}>{t.circle.inviteCodeLabel}</Text>
                    <Text style={[styles.codeText, { color: colors.primary }]}>{inviteCode || '------'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopyCode}
                    style={[styles.smallOutlineBtn, { borderColor: colors.hairline, backgroundColor: colors.surface }]}
                  >
                    <Copy size={14} color={colors.text} />
                    <Text style={[styles.smallOutlineBtnText, { color: colors.text }]}>
                      {copiedCode ? t.circle.copiedInviteCode : t.circle.copyInviteCode}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 3: Join Requests (Owner Only) */}
              {isOwner && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Users size={16} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {t.circle.joinRequestsTitle} ({joinRequests.length})
                    </Text>
                  </View>

                  {isLoadingRequests ? (
                    <ActivityIndicator style={{ marginVertical: 14 }} color={colors.primary} />
                  ) : joinRequests.length === 0 ? (
                    <Text style={[styles.emptyHintText, { color: colors.subtle }]}>
                      {t.circle.noPendingJoinRequests}
                    </Text>
                  ) : (
                    joinRequests.map((req) => {
                      const reqName = req.user?.profile?.displayName || req.user?.email || 'User';
                      return (
                        <View
                          key={req.id}
                          style={[styles.requestItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                        >
                          <View style={styles.memberLeft}>
                            <View style={[styles.avatarBox, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {getInitials(reqName)}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.memberName, { color: colors.text }]}>{reqName}</Text>
                              <Text style={[styles.subtleText, { color: colors.subtle }]}>{req.user?.email}</Text>
                              {req.message && (
                                <Text style={[styles.requestMsg, { color: colors.text }]}>"{req.message}"</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              onPress={() => handleReviewRequest(req.id, 'APPROVED')}
                              style={[styles.acceptBtn, { backgroundColor: colors.success }]}
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
                </View>
              )}

              {/* Section 4: Danger Zone */}
              {isOwner && (
                <View style={[styles.card, { backgroundColor: `${colors.danger}08`, borderColor: `${colors.danger}30` }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Trash2 size={16} color={colors.danger} />
                    <Text style={[styles.cardTitle, { color: colors.danger }]}>
                      {t.circle.deleteCircle}
                    </Text>
                  </View>
                  <Text style={[styles.cardDesc, { color: colors.subtle }]}>
                    {t.circle.deleteCircleWarning}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDeleteCircle}
                    style={[styles.dangerFullBtn, { backgroundColor: colors.danger }]}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                    <Text style={styles.dangerFullBtnText}>{t.circle.deleteCircle}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* =========================================================================
              SUBMODAL: EDIT NICKNAME
             ========================================================================= */}
          {editingMember && (
            <Modal transparent animationType="fade" visible={Boolean(editingMember)}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.subModalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.subModalTitle, { color: colors.text }]}>
                    {t.circle.editNickname}
                  </Text>
                  <Text style={[styles.subModalDesc, { color: colors.subtle }]}>
                    {editingMember.name}
                  </Text>

                  <TextInput
                    value={nicknameInput}
                    onChangeText={setNicknameInput}
                    maxLength={30}
                    placeholder={t.circle.nicknamePlaceholder}
                    placeholderTextColor={colors.subtle}
                    style={[styles.input, { backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text }]}
                  />

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => setEditingMember(null)}
                      style={[styles.actionBtn, { backgroundColor: colors.wash }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveNickname}
                      disabled={updateNicknameMutation.isPending}
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    >
                      {updateNicknameMutation.isPending ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>{t.common.save}</Text>
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
                      {t.circle.addMembersTitle}
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
                      placeholder={t.circle.friendsSearchPlaceholder}
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
                          {t.circle.noSelectableFriends}
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
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel}</Text>
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
                          {t.circle.addMembersSubmit} ({selectedFriendIds.length})
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
    height: '88%',
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
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
    gap: 2,
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuRowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
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
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  formField: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  textArea: {
    height: 76,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  avatarInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPreviewBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPreviewImg: {
    width: '100%',
    height: '100%',
  },
  avatarPreviewText: {
    fontSize: 14,
    fontWeight: '800',
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeDesc: {
    fontSize: 11,
    marginTop: 2,
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
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  mutePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  mutePillText: {
    fontSize: 11,
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
  reportFormCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
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
  submitReportBtn: {
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitReportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  guidelinesHeader: {
    fontSize: 12,
    fontWeight: '700',
  },
  guidelineItem: {
    fontSize: 11,
    lineHeight: 16,
  },
  smallDangerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  smallDangerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  modeCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  modeCardDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  capacityPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  capPillText: {
    fontSize: 12,
  },
  inviteLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  inviteLinkText: {
    flex: 1,
    fontSize: 12,
  },
  inviteLinkBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  smallIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  emptyHintText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
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
