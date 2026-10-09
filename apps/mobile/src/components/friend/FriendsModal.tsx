import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image as RNImage,
} from 'react-native';
import {
  X,
  Users,
  UserPlus,
  UserCheck,
  Search,
  Check,
  UserX,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
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

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FriendsModal({ visible, onClose }: FriendsModalProps) {
  const { colors, resolvedTheme } = useThemeStore();
  const { t } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [requestsSubTab, setRequestsSubTab] = useState<'received' | 'sent'>('received');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  // Queries
  const { data: friends = [], isLoading: isLoadingFriends } = useFriendsQuery();
  const { data: receivedRequests = [], isLoading: isLoadingReceived } = useReceivedFriendRequestsQuery();
  const { data: sentRequests = [], isLoading: isLoadingSent } = useSentFriendRequestsQuery();
  const { data: searchResults = [], isFetching: isSearching } = useSearchFriendsQuery(submittedQuery);

  // Mutations
  const sendMutation = useSendFriendRequestMutation();
  const acceptMutation = useAcceptFriendRequestMutation();
  const rejectMutation = useRejectFriendRequestMutation();
  const cancelMutation = useCancelFriendRequestMutation();
  const unfriendMutation = useUnfriendMutation();

  const handleUnfriend = (friendId: string, name: string) => {
    Alert.alert(
      t.friend.unfriend,
      t.friend.unfriendConfirm.replace('{name}', name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.friend.unfriend,
          style: 'destructive',
          onPress: () => unfriendMutation.mutate(friendId),
        },
      ],
    );
  };

  const handleSearch = () => {
    setSubmittedQuery(searchQuery.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: colors.wash }]}>
                <Users size={18} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t.friend.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={[styles.tabBar, { borderBottomColor: colors.hairline, backgroundColor: colors.canvas }]}>
            <TouchableOpacity
              onPress={() => setActiveTab('friends')}
              style={[
                styles.tabItem,
                activeTab === 'friends' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Users size={15} color={activeTab === 'friends' ? colors.primary : colors.subtle} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'friends' ? colors.primary : colors.subtle },
                ]}
              >
                {t.friend.friendsTab.replace('{count}', friends.length.toString())}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('requests')}
              style={[
                styles.tabItem,
                activeTab === 'requests' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <UserCheck size={15} color={activeTab === 'requests' ? colors.primary : colors.subtle} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'requests' ? colors.primary : colors.subtle },
                ]}
              >
                {t.friend.requestsTab.replace('{count}', receivedRequests.length.toString())}
              </Text>
              {receivedRequests.length > 0 && (
                <View style={[styles.reqBadge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.reqBadgeText}>{receivedRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('search')}
              style={[
                styles.tabItem,
                activeTab === 'search' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <UserPlus size={15} color={activeTab === 'search' ? colors.primary : colors.subtle} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === 'search' ? colors.primary : colors.subtle },
                ]}
              >
                {t.friend.searchTab}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.content}>
            {/* Tab 1: Friends */}
            {activeTab === 'friends' && (
              <View style={styles.tabContent}>
                {isLoadingFriends ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : friends.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Users size={40} color={colors.subtle} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.friend.noFriends}</Text>
                    <Text style={[styles.emptyDesc, { color: colors.subtle }]}>{t.friend.noFriendsHint}</Text>
                  </View>
                ) : (
                  friends.map((friend) => (
                    <View
                      key={friend.id}
                      style={[styles.friendCard, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}
                    >
                      <View style={styles.cardLeft}>
                        {friend.avatarUrl ? (
                          <RNImage source={{ uri: friend.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatarFallback, { backgroundColor: colors.wash }]}>
                            <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                              {getInitials(friend.displayName)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.cardInfo}>
                          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                            {friend.displayName}
                          </Text>
                          <Text style={[styles.cardEmail, { color: colors.subtle }]} numberOfLines={1}>
                            {friend.email}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleUnfriend(friend.id, friend.displayName)}
                        style={styles.unfriendBtn}
                      >
                        <UserX size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Tab 2: Requests */}
            {activeTab === 'requests' && (
              <View style={styles.tabContent}>
                {/* Sub-tabs */}
                <View style={[styles.subToggleBox, { backgroundColor: colors.canvas }]}>
                  <TouchableOpacity
                    onPress={() => setRequestsSubTab('received')}
                    style={[
                      styles.subToggleBtn,
                      requestsSubTab === 'received' && { backgroundColor: colors.surface },
                    ]}
                  >
                    <ArrowDownLeft size={13} color={requestsSubTab === 'received' ? colors.primary : colors.subtle} />
                    <Text
                      style={[
                        styles.subToggleText,
                        { color: requestsSubTab === 'received' ? colors.primary : colors.subtle },
                      ]}
                    >
                      {t.friend.receivedRequestsTitle} ({receivedRequests.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRequestsSubTab('sent')}
                    style={[
                      styles.subToggleBtn,
                      requestsSubTab === 'sent' && { backgroundColor: colors.surface },
                    ]}
                  >
                    <ArrowUpRight size={13} color={requestsSubTab === 'sent' ? colors.primary : colors.subtle} />
                    <Text
                      style={[
                        styles.subToggleText,
                        { color: requestsSubTab === 'sent' ? colors.primary : colors.subtle },
                      ]}
                    >
                      {t.friend.sentRequestsTitle} ({sentRequests.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {requestsSubTab === 'received' ? (
                  isLoadingReceived ? (
                    <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                  ) : receivedRequests.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Clock size={36} color={colors.subtle} style={{ opacity: 0.5, marginBottom: 8 }} />
                      <Text style={[styles.emptyTitle, { color: colors.subtle }]}>{t.friend.noRequests}</Text>
                    </View>
                  ) : (
                    receivedRequests.map((req) => (
                      <View
                        key={req.id}
                        style={[styles.friendCard, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}
                      >
                        <View style={styles.cardLeft}>
                          {req.avatarUrl ? (
                            <RNImage source={{ uri: req.avatarUrl }} style={styles.avatar} />
                          ) : (
                            <View style={[styles.avatarFallback, { backgroundColor: colors.wash }]}>
                              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                                {getInitials(req.displayName)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.cardInfo}>
                            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                              {req.displayName}
                            </Text>
                            <Text style={[styles.cardEmail, { color: colors.subtle }]} numberOfLines={1}>
                              {req.email}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            onPress={() => acceptMutation.mutate(req.id)}
                            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                          >
                            <Check size={14} color={colors.onPrimary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => rejectMutation.mutate(req.id)}
                            style={[styles.rejectBtn, { borderColor: colors.hairline }]}
                          >
                            <X size={14} color={colors.subtle} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )
                ) : (
                  isLoadingSent ? (
                    <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                  ) : sentRequests.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Clock size={36} color={colors.subtle} style={{ opacity: 0.5, marginBottom: 8 }} />
                      <Text style={[styles.emptyTitle, { color: colors.subtle }]}>{t.friend.noSentRequests}</Text>
                    </View>
                  ) : (
                    sentRequests.map((req) => (
                      <View
                        key={req.id}
                        style={[styles.friendCard, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}
                      >
                        <View style={styles.cardLeft}>
                          {req.avatarUrl ? (
                            <RNImage source={{ uri: req.avatarUrl }} style={styles.avatar} />
                          ) : (
                            <View style={[styles.avatarFallback, { backgroundColor: colors.wash }]}>
                              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                                {getInitials(req.displayName)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.cardInfo}>
                            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                              {req.displayName}
                            </Text>
                            <Text style={[styles.cardEmail, { color: colors.subtle }]} numberOfLines={1}>
                              {req.email}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => cancelMutation.mutate(req.id)}
                          style={[styles.cancelBtn, { borderColor: colors.hairline }]}
                        >
                          <Text style={[styles.cancelBtnText, { color: colors.danger }]}>
                            {t.friend.cancelRequest}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )
                )}
              </View>
            )}

            {/* Tab 3: Search */}
            {activeTab === 'search' && (
              <View style={styles.tabContent}>
                <View style={styles.searchRow}>
                  <View style={[styles.searchInputWrapper, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}>
                    <Search size={16} color={colors.subtle} style={{ marginRight: 6 }} />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={t.friend.searchPlaceholder}
                      placeholderTextColor={colors.subtle}
                      style={[styles.searchInput, { color: colors.text }]}
                      onSubmitEditing={handleSearch}
                      returnKeyType="search"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleSearch}
                    style={[styles.searchSubmitBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.searchSubmitText, { color: colors.onPrimary }]}>
                      {t.friend.searchAction}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isSearching ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : submittedQuery && searchResults.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Search size={36} color={colors.subtle} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Text style={[styles.emptyTitle, { color: colors.subtle }]}>{t.friend.noSearchResults}</Text>
                  </View>
                ) : (
                  searchResults.map((user) => (
                    <View
                      key={user.id}
                      style={[styles.friendCard, { backgroundColor: colors.canvas, borderColor: colors.hairline }]}
                    >
                      <View style={styles.cardLeft}>
                        {user.avatarUrl ? (
                          <RNImage source={{ uri: user.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatarFallback, { backgroundColor: colors.wash }]}>
                            <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                              {getInitials(user.displayName)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.cardInfo}>
                          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                            {user.displayName}
                          </Text>
                          <Text style={[styles.cardEmail, { color: colors.subtle }]} numberOfLines={1}>
                            {user.email}
                          </Text>
                        </View>
                      </View>

                      {user.relationship === 'FRIEND' && (
                        <View style={[styles.statusBadge, { backgroundColor: colors.wash }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
                            {t.friend.alreadyFriends}
                          </Text>
                        </View>
                      )}

                      {user.relationship === 'PENDING_SENT' && (
                        <View style={[styles.statusBadge, { borderColor: colors.hairline, borderWidth: 1 }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.subtle }]}>
                            {t.friend.requestSent}
                          </Text>
                        </View>
                      )}

                      {user.relationship === 'PENDING_RECEIVED' && user.friendshipId && (
                        <TouchableOpacity
                          onPress={() => acceptMutation.mutate(user.friendshipId!)}
                          style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                        >
                          <Check size={14} color={colors.onPrimary} />
                        </TouchableOpacity>
                      )}

                      {user.relationship === 'NONE' && (
                        <TouchableOpacity
                          onPress={() => sendMutation.mutate(user.id)}
                          style={[styles.addFriendBtn, { backgroundColor: colors.primary }]}
                        >
                          <UserPlus size={14} color={colors.onPrimary} style={{ marginRight: 4 }} />
                          <Text style={[styles.addFriendText, { color: colors.onPrimary }]}>
                            {t.friend.addFriend}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  reqBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  reqBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  tabContent: {
    gap: 10,
  },
  loader: {
    marginVertical: 30,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  unfriendBtn: {
    padding: 8,
  },
  subToggleBox: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 6,
  },
  subToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 11,
    gap: 5,
  },
  subToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  searchSubmitBtn: {
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  searchSubmitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addFriendText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
