import React, { useState } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  X,
  Info,
  Users,
  UserCheck,
  Settings,
  Share2,
  Crown,
  ShieldCheck,
  UserX,
  LogOut,
  Trash2,
  Edit2,
  Check,
  Search,
  UserPlus,
  Globe,
  Lock,
  ChevronRight,
  AlertTriangle,
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
  const { data: detailData, isLoading: isLoadingDetail } = useCircleDetailQuery(circleId);
  const circle = detailData || activeCircle;

  const { data: members = [], isLoading: isLoadingMembers } = useCircleMembersQuery(circleId);
  const currentMember = members.find((m) => m.userId === user?.id);
  const userRole = (circle as any)?.role || currentMember?.role;
  const isOwner = userRole === 'OWNER';
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';

  const { data: joinRequests = [], isLoading: isLoadingRequests } =
    useCircleJoinRequestsQuery(circleId, isOwnerOrAdmin);
  const { data: selectableFriends = [] } = useSelectableFriendsQuery();

  // Mutations
  const updateNicknameMutation = useUpdateNicknameMutation(circleId || '');
  const removeMemberMutation = useRemoveMemberMutation(circleId || '');
  const transferOwnershipMutation = useTransferOwnershipMutation(circleId || '');
  const leaveCircleMutation = useLeaveCircleMutation(circleId || '');
  const deleteCircleMutation = useDeleteCircleMutation(circleId || '');
  const addMembersMutation = useAddMembersMutation(circleId || '');
  const reviewJoinRequestMutation = useReviewJoinRequestMutation(circleId || '');
  const updateCircleMutation = useUpdateCircleMutation(circleId || '');

  // Sub-dialog states
  const [editingMember, setEditingMember] = useState<{ id: string; nickname: string; name: string } | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  // Info editing state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleClose = () => {
    setVisible(false);
    setEditingMember(null);
    setIsAddFriendsOpen(false);
    setIsEditingInfo(false);
  };

  const handleShareInviteCode = async () => {
    if (!circle?.inviteCode) return;
    try {
      await Share.share({
        message: `${t.circle.inviteLinkCardDesc}: ${circle.inviteCode}`,
      });
    } catch {
      // User cancelled
    }
  };

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

  const handleTransferOwnership = (memberId: string, name: string) => {
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
              await transferOwnershipMutation.mutateAsync(memberId);
              Alert.alert(t.common.appName, t.circle.transferOwnership);
            } catch (err: any) {
              Alert.alert(t.common.appName, err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleLeaveCircle = () => {
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

  const handleAddMembers = async () => {
    if (selectedFriendIds.length === 0 || !circleId) return;
    try {
      await addMembersMutation.mutateAsync({ memberIds: selectedFriendIds });
      setIsAddFriendsOpen(false);
      setSelectedFriendIds([]);
      setFriendSearch('');
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleReviewRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewJoinRequestMutation.mutateAsync({
        requestId,
        input: { status },
      });
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleSaveInfo = async () => {
    if (!editName.trim() || !circleId) return;
    try {
      await updateCircleMutation.mutateAsync({
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditingInfo(false);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleStartEditInfo = () => {
    if (!circle) return;
    setEditName(circle.name);
    setEditDescription(circle.description || '');
    setIsEditingInfo(true);
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
              <View style={[styles.circleBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.circleBadgeText, { color: colors.onPrimary }]}>
                  {getInitials(circle.name)}
                </Text>
              </View>
              <View style={styles.headerTitleGroup}>
                <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
                  {circle.name}
                </Text>
                <Text style={[styles.subtitle, { color: colors.subtle }]}>
                  @{circle.handle} · {circle.isPrivate ? t.circle.privacyPrivate : t.circle.privacyPublic}
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

          {/* Tab Navigation */}
          <View style={[styles.tabBar, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('info')}
              style={[
                styles.tabItem,
                activeTab === 'info' && [styles.activeTabItem, { backgroundColor: colors.surface }],
              ]}
            >
              <Info
                size={16}
                color={activeTab === 'info' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'info' ? colors.primary : colors.subtle,
                    fontWeight: activeTab === 'info' ? '700' : '500',
                  },
                ]}
              >
                {t.circle.chatInfoTab || 'Thông tin'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('members')}
              style={[
                styles.tabItem,
                activeTab === 'members' && [styles.activeTabItem, { backgroundColor: colors.surface }],
              ]}
            >
              <Users
                size={16}
                color={activeTab === 'members' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'members' ? colors.primary : colors.subtle,
                    fontWeight: activeTab === 'members' ? '700' : '500',
                  },
                ]}
              >
                {t.circle.membersTitle} ({members.length})
              </Text>
            </TouchableOpacity>

            {isOwnerOrAdmin && circle.isPrivate && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('requests')}
                style={[
                  styles.tabItem,
                  activeTab === 'requests' && [styles.activeTabItem, { backgroundColor: colors.surface }],
                ]}
              >
                <UserCheck
                  size={16}
                  color={activeTab === 'requests' ? colors.primary : colors.subtle}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === 'requests' ? colors.primary : colors.subtle,
                      fontWeight: activeTab === 'requests' ? '700' : '500',
                    },
                  ]}
                >
                  {t.circle.joinRequestsTitle || 'Yêu cầu'}
                  {joinRequests.length > 0 ? ` (${joinRequests.length})` : ''}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('settings')}
              style={[
                styles.tabItem,
                activeTab === 'settings' && [styles.activeTabItem, { backgroundColor: colors.surface }],
              ]}
            >
              <Settings
                size={16}
                color={activeTab === 'settings' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'settings' ? colors.primary : colors.subtle,
                    fontWeight: activeTab === 'settings' ? '700' : '500',
                  },
                ]}
              >
                {t.nav.circleSettings || 'Cài đặt'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {isEditingInfo ? (
                <View style={styles.editSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t.circle.circleGeneralSettings || 'Chỉnh sửa Vòng tròn'}
                  </Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t.circle.nameLabel}
                    placeholderTextColor={colors.subtle}
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.hairline, color: colors.text }]}
                  />
                  <TextInput
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder={t.circle.descLabel}
                    placeholderTextColor={colors.subtle}
                    multiline
                    style={[
                      styles.input,
                      styles.textArea,
                      { backgroundColor: colors.surface, borderColor: colors.hairline, color: colors.text },
                    ]}
                  />
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => setIsEditingInfo(false)}
                      style={[styles.actionBtn, { backgroundColor: colors.wash, borderColor: colors.hairline, borderWidth: 1 }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.common.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveInfo}
                      disabled={updateCircleMutation.isPending}
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    >
                      {updateCircleMutation.isPending ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>{t.common.save}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Circle Stats & Description */}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{circle.name}</Text>
                      {isOwnerOrAdmin && (
                        <TouchableOpacity onPress={handleStartEditInfo} style={[styles.smallIconBtn, { backgroundColor: colors.wash }]}>
                          <Edit2 size={14} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[styles.cardDesc, { color: colors.subtle }]}>
                      {circle.description || 'Chưa có mô tả cho Vòng tròn này.'}
                    </Text>

                    <View style={styles.statsRow}>
                      <View style={[styles.statPill, { backgroundColor: colors.wash }]}>
                        {circle.isPrivate ? (
                          <Lock size={14} color={colors.primary} />
                        ) : (
                          <Globe size={14} color={colors.primary} />
                        )}
                        <Text style={[styles.statPillText, { color: colors.text }]}>
                          {circle.isPrivate ? t.circle.privacyPrivate : t.circle.privacyPublic}
                        </Text>
                      </View>

                      <View style={[styles.statPill, { backgroundColor: colors.wash }]}>
                        <Users size={14} color={colors.primary} />
                        <Text style={[styles.statPillText, { color: colors.text }]}>
                          {t.circle.membersCount.replace('{count}', String(members.length))}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Invite Code Box */}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {t.circle.inviteCodeLabel}
                    </Text>
                    <View style={styles.inviteRow}>
                      <View style={[styles.codeBox, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                        <Text style={[styles.codeText, { color: colors.primary }]}>
                          {circle.inviteCode || '------'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleShareInviteCode}
                        style={[styles.shareBtn, { backgroundColor: colors.primary }]}
                      >
                        <Share2 size={16} color={colors.onPrimary} />
                        <Text style={[styles.shareBtnText, { color: colors.onPrimary }]}>
                          {t.circle.shareInvite}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.hintText, { color: colors.subtle }]}>
                      {t.circle.inviteLinkCardDesc}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <View style={styles.membersContainer}>
              {/* Member Controls: Search & Add */}
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

                {isOwnerOrAdmin && (
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
                )}
              </View>

              {/* Members List */}
              {isLoadingMembers ? (
                <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.memberList}>
                  {filteredMembers.map((m) => {
                    const memberName = m.user?.profile?.displayName || m.user?.email || 'User';
                    const isSelf = user?.id === m.userId;
                    const isMemberOwner = m.role === 'OWNER';
                    const isMemberAdmin = m.role === 'ADMIN';

                    return (
                      <View
                        key={m.id}
                        style={[
                          styles.memberItem,
                          { backgroundColor: colors.surface, borderColor: colors.hairline },
                        ]}
                      >
                        <View style={styles.memberLeft}>
                          <View style={[styles.avatarBox, { backgroundColor: colors.wash }]}>
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                              {getInitials(memberName)}
                            </Text>
                          </View>
                          <View style={styles.memberDetails}>
                            <View style={styles.nameRow}>
                              <Text numberOfLines={1} style={[styles.memberName, { color: colors.text }]}>
                                {memberName}
                              </Text>
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
                              ) : null}
                            </View>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleOpenNicknameDialog(m.id, m.nickname ?? null, memberName)}
                              style={styles.nicknameRow}
                            >
                              <Text style={[styles.nicknameText, { color: colors.subtle }]}>
                                {m.nickname
                                  ? `${t.circle.nicknameLabel}: ${m.nickname}`
                                  : t.circle.setNickname}
                              </Text>
                              <Edit2 size={12} color={colors.subtle} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Action buttons (Kick & Transfer for Owner) */}
                        {isOwner && !isMemberOwner && !isSelf && (
                          <View style={styles.memberActions}>
                            <TouchableOpacity
                              onPress={() => handleTransferOwnership(m.userId, memberName)}
                              style={[styles.iconActionBtn, { backgroundColor: `${colors.warning}15` }]}
                            >
                              <Crown size={15} color={colors.warning} />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleKickMember(m.id, memberName)}
                              style={[styles.iconActionBtn, { backgroundColor: `${colors.danger}15` }]}
                            >
                              <UserX size={15} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* TAB 3: JOIN REQUESTS */}
          {activeTab === 'requests' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {isLoadingRequests ? (
                <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
              ) : joinRequests.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.wash }]}>
                  <Text style={[styles.emptyText, { color: colors.subtle }]}>
                    {t.circle.noPendingJoinRequests}
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
                        <View style={[styles.avatarBox, { backgroundColor: colors.wash }]}>
                          <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {getInitials(reqName)}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.memberName, { color: colors.text }]}>{reqName}</Text>
                          <Text style={[styles.subtleText, { color: colors.subtle }]}>{req.user?.email}</Text>
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
            </ScrollView>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              {/* Member Action: Leave Circle */}
              {!isOwner && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t.circle.leaveCircle}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.subtle }]}>
                    {t.circle.leaveCircleConfirm}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleLeaveCircle}
                    style={[styles.dangerBtn, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}30` }]}
                  >
                    <LogOut size={16} color={colors.danger} />
                    <Text style={[styles.dangerBtnText, { color: colors.danger }]}>
                      {t.circle.leaveCircle}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Owner Action: Delete / Disband Circle */}
              {isOwner && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, { color: colors.danger }]}>
                      {t.circle.deleteCircle}
                    </Text>
                    <AlertTriangle size={18} color={colors.danger} />
                  </View>
                  <Text style={[styles.cardDesc, { color: colors.subtle }]}>
                    {t.circle.deleteCircleWarning}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDeleteCircle}
                    style={[styles.dangerBtn, { backgroundColor: colors.danger }]}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                    <Text style={[styles.dangerBtnText, { color: '#FFFFFF' }]}>
                      {t.circle.deleteCircle}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* Submodal: Edit Nickname */}
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

          {/* Submodal: Add Friends */}
          {isAddFriendsOpen && (
            <Modal transparent animationType="slide" visible={isAddFriendsOpen}>
              <View style={styles.subModalOverlay}>
                <View style={[styles.addFriendsCard, { backgroundColor: colors.sheetBg, borderColor: colors.glassBorder }]}>
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {t.circle.addMembersTitle || 'Thêm thành viên'}
                    </Text>
                    <TouchableOpacity onPress={() => setIsAddFriendsOpen(false)} style={[styles.closeBtn, { backgroundColor: colors.wash }]}>
                      <X size={18} color={colors.subtle} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.hairline, marginBottom: 12 }]}>
                    <Search size={15} color={colors.subtle} />
                    <TextInput
                      value={friendSearch}
                      onChangeText={setFriendSearch}
                      placeholder={t.circle.friendsSearchPlaceholder}
                      placeholderTextColor={colors.subtle}
                      style={[styles.searchInput, { color: colors.text }]}
                    />
                  </View>

                  <ScrollView style={{ maxHeight: 220 }}>
                    {availableFriends.length === 0 ? (
                      <View style={[styles.emptyBox, { backgroundColor: colors.wash }]}>
                        <Text style={[styles.emptyText, { color: colors.subtle }]}>
                          {t.circle.noSelectableFriends || 'Không có bạn bè khả dụng để thêm.'}
                        </Text>
                      </View>
                    ) : (
                      availableFriends.map((f) => {
                        const isSelected = selectedFriendIds.includes(f.id);
                        return (
                          <TouchableOpacity
                            key={f.id}
                            onPress={() => {
                              setSelectedFriendIds((prev) =>
                                isSelected ? prev.filter((id) => id !== f.id) : [...prev, f.id],
                              );
                            }}
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
                              <View>
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
                      onPress={handleAddMembers}
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
                          {t.circle.addMembersSubmit || `Thêm (${selectedFriendIds.length})`}
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
    height: '86%',
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
    paddingBottom: 14,
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
  tabBar: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 15,
  },
  activeTabItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
  tabContent: {
    gap: 14,
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  inviteRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  codeBox: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
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
    paddingBottom: 20,
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
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nicknameText: {
    fontSize: 11,
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  subtleText: {
    fontSize: 11,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 16,
    marginTop: 6,
  },
  dangerBtnText: {
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
  input: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  textArea: {
    height: 80,
    paddingVertical: 10,
    textAlignVertical: 'top',
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
    gap: 12,
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
  editSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  smallIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
