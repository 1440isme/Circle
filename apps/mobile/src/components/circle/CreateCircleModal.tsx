import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users,
  X,
  Globe,
  Lock,
  Search,
  Check,
  AlertCircle,
  UserPlus,
  History,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { useCreateCircleMutation } from '../../hooks/use-circle-queries';
import { useEdgeSwipeDismiss } from '../../hooks/use-edge-swipe';
import { createCircleSchemas } from '@circle/shared';
import { PublicUserEntity } from '@circle/types';
import { getStorageItem, setStorageItem } from '../../services/storage';
import { searchPublicUsersApi } from '../../services/api';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CreateCircleModal() {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isDark = resolvedTheme === 'dark';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const insets = useSafeAreaInsets();

  const visible = useCircleStore((s) => s.createModalVisible);
  const setVisible = useCircleStore((s) => s.setCreateModalVisible);

  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<PublicUserEntity[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentUsers, setRecentUsers] = useState<PublicUserEntity[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const createCircleMutation = useCreateCircleMutation();

  const handleClose = () => {
    setName('');
    setIsPrivate(false);
    setSelectedUsers([]);
    setFriendSearch('');
    setSearchResults([]);
    setIsSearching(false);
    setFieldErrors({});
    setServerError(null);
    setVisible(false);
  };

  const edgePan = useEdgeSwipeDismiss({ onDismiss: handleClose });

  useEffect(() => {
    if (visible) {
      getStorageItem('circle_recent_user_searches').then((raw) => {
        if (raw) {
          try {
            setRecentUsers(JSON.parse(raw));
          } catch {}
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    const q = friendSearch.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchPublicUsersApi(q);
        setSearchResults(res || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [friendSearch]);

  const handleToggleUser = (user: PublicUserEntity) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        if (prev.length >= 99) {
          setServerError(locale === 'vi' ? 'Bạn chỉ có thể chọn tối đa 99 thành viên' : 'You can select up to 99 members');
          return prev;
        }
        getStorageItem('circle_recent_user_searches').then((raw) => {
          let list: PublicUserEntity[] = [];
          if (raw) {
            try {
              list = JSON.parse(raw);
            } catch {}
          }
          const updated = [user, ...list.filter((u) => u.id !== user.id)].slice(0, 8);
          setStorageItem('circle_recent_user_searches', JSON.stringify(updated));
          setRecentUsers(updated);
        });
        return [...prev, user];
      }
    });
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleRemoveSelected = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRemoveRecent = (userId: string) => {
    const updated = recentUsers.filter((u) => u.id !== userId);
    setRecentUsers(updated);
    setStorageItem('circle_recent_user_searches', JSON.stringify(updated));
  };

  const handleClearAllRecent = () => {
    setRecentUsers([]);
    setStorageItem('circle_recent_user_searches', JSON.stringify([]));
  };

  const selectedFriendIds = selectedUsers.map((u) => u.id);

  const handleSubmit = async () => {
    setServerError(null);
    setFieldErrors({});

    const { createCircleSchema } = createCircleSchemas(locale);
    const payload = {
      name: name.trim(),
      ...(selectedFriendIds.length > 0 ? { memberIds: selectedFriendIds } : {}),
      isPrivate,
    };

    const validationResult = createCircleSchema.safeParse(payload);
    if (!validationResult.success) {
      const errMap: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const fieldName = err.path[0] as string;
        if (fieldName && !errMap[fieldName]) {
          errMap[fieldName] = err.message;
        }
      });
      setFieldErrors(errMap);
      return;
    }

    try {
      await createCircleMutation.mutateAsync(validationResult.data);
      handleClose();
    } catch (err: any) {
      setServerError(err?.message || t.circle.createError);
    }
  };

  const canSubmit = name.trim().length >= 2 && selectedFriendIds.length <= 99;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {uiStyle === 'glass' && (
          <BlurView
            intensity={glassTheme.blur.intensity}
            tint={glassTheme.blur.tint}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View
          {...edgePan.panHandlers}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: glassTheme.colors.glassBgSheet,
              borderColor:
                uiStyle === 'glass' ? glassTheme.colors.glassBorder : colors.hairline,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          {/* Sheet Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: colors.hairline }]} />

          {/* Header (Bare Icon Invariant) */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Users size={22} color={colors.sage} />
              <View style={styles.headerTextGroup}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t.circle.createTitle}
                </Text>
                <Text style={[styles.subtitle, { color: colors.subtle }]}>
                  {t.circle.createSubtitle}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
              accessibilityLabel={t.common.close}
            >
              <X size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {serverError && (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: `${colors.danger}15`,
                  borderColor: `${colors.danger}35`,
                },
              ]}
            >
              <AlertCircle size={16} color={colors.danger} />
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>
                {serverError}
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Field: Name */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t.circle.nameLabel} <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <Text style={[styles.hintText, { color: colors.subtle }]}>
                  {name.length}/40
                </Text>
              </View>
              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }
                }}
                maxLength={40}
                placeholder={t.circle.namePlaceholder}
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: fieldErrors.name ? colors.danger : colors.hairline,
                    color: colors.text,
                  },
                ]}
              />
              {fieldErrors.name ? (
                <Text style={[styles.fieldErrorText, { color: colors.danger }]}>
                  {fieldErrors.name}
                </Text>
              ) : null}
            </View>

            {/* Field: Require Approval Toggle */}
            <View
              style={[
                styles.approvalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isPrivate ? colors.sage : colors.hairline,
                },
              ]}
            >
              <View style={styles.approvalLeft}>
                {isPrivate ? (
                  <Lock size={20} color={colors.sage} />
                ) : (
                  <Globe size={20} color={colors.sage} />
                )}
                <View style={styles.approvalTextGroup}>
                  <Text style={[styles.approvalTitle, { color: colors.text }]}>
                    {t.circle.requireApprovalTitle}
                  </Text>
                </View>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: colors.hairline, true: colors.primary }}
              />
            </View>

            {/* Field: Member Selector */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <View style={styles.friendSectionHeader}>
                  <UserPlus size={16} color={colors.sage} />
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t.circle.selectFriendsLabel}
                  </Text>
                </View>
                {selectedUsers.length > 0 && (
                  <View style={[styles.counterBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.counterText, { color: colors.onPrimary }]}>
                      {selectedUsers.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Selected Members Chips */}
              {selectedUsers.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedChipsScroll}
                >
                  {selectedUsers.map((u) => (
                    <View
                      key={u.id}
                      style={[
                        styles.selectedChip,
                        { backgroundColor: colors.surface, borderColor: colors.hairline },
                      ]}
                    >
                      <Text style={[styles.selectedChipText, { color: colors.text }]}>
                        {u.displayName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveSelected(u.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X size={12} color={colors.subtle} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Member Search Input */}
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.hairline,
                  },
                ]}
              >
                <Search size={16} color={colors.subtle} />
                <TextInput
                  value={friendSearch}
                  onChangeText={setFriendSearch}
                  placeholder={t.circle.friendsSearchPlaceholder}
                  placeholderTextColor={colors.subtle}
                  style={[styles.searchInput, { color: colors.text }]}
                />
                {friendSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setFriendSearch('')}>
                    <X size={16} color={colors.subtle} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Member List / Recent Searches */}
              {friendSearch.trim().length > 0 ? (
                isSearching ? (
                  <ActivityIndicator
                    style={{ marginVertical: 16 }}
                    color={colors.sage}
                  />
                ) : searchResults.length === 0 ? (
                  <View style={[styles.emptyFriendsBox, { backgroundColor: colors.wash }]}>
                    <Text style={[styles.emptyFriendsText, { color: colors.subtle }]}>
                      {t.circle.noFriendsFound}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.friendListContainer}>
                    {searchResults.map((f) => {
                      const isSelected = selectedUsers.some((u) => u.id === f.id);
                      return (
                        <TouchableOpacity
                          key={f.id}
                          activeOpacity={0.75}
                          onPress={() => handleToggleUser(f)}
                          style={[
                            styles.friendItem,
                            {
                              backgroundColor: isSelected
                                ? `${colors.sage}12`
                                : colors.surface,
                              borderColor: isSelected
                                ? colors.sage
                                : colors.hairline,
                            },
                          ]}
                        >
                          <View style={styles.friendLeft}>
                            <View
                              style={[
                                styles.avatarPlaceholder,
                                { backgroundColor: colors.wash },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.avatarText,
                                  { color: colors.sage },
                                ]}
                              >
                                {getInitials(f.displayName)}
                              </Text>
                            </View>
                            <View style={styles.friendInfo}>
                              <Text
                                numberOfLines={1}
                                style={[styles.friendName, { color: colors.text }]}
                              >
                                {f.displayName}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={[styles.friendHandle, { color: colors.sage }]}
                              >
                                @{f.handle}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.checkbox,
                              {
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.subtle,
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : 'transparent',
                              },
                            ]}
                          >
                            {isSelected && <Check size={14} color={colors.onPrimary} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )
              ) : recentUsers.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <View style={styles.recentHeader}>
                    <View style={styles.recentHeaderLeft}>
                      <History size={13} color={colors.subtle} />
                      <Text style={[styles.recentHeaderText, { color: colors.subtle }]}>
                        {t.circle.recentSearches}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={handleClearAllRecent}>
                      <Text style={[styles.recentClearText, { color: colors.sage }]}>
                        {t.circle.clearRecentSearches}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.friendListContainer}>
                    {recentUsers.map((f) => {
                      const isSelected = selectedUsers.some((u) => u.id === f.id);
                      return (
                        <TouchableOpacity
                          key={f.id}
                          activeOpacity={0.75}
                          onPress={() => handleToggleUser(f)}
                          style={[
                            styles.friendItem,
                            {
                              backgroundColor: isSelected
                                ? `${colors.sage}12`
                                : colors.surface,
                              borderColor: isSelected
                                ? colors.sage
                                : colors.hairline,
                            },
                          ]}
                        >
                          <View style={styles.friendLeft}>
                            <View
                              style={[
                                styles.avatarPlaceholder,
                                { backgroundColor: colors.wash },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.avatarText,
                                  { color: colors.sage },
                                ]}
                              >
                                {getInitials(f.displayName)}
                              </Text>
                            </View>
                            <View style={styles.friendInfo}>
                              <Text
                                numberOfLines={1}
                                style={[styles.friendName, { color: colors.text }]}
                              >
                                {f.displayName}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={[styles.friendHandle, { color: colors.sage }]}
                              >
                                @{f.handle}
                              </Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TouchableOpacity
                              onPress={() => handleRemoveRecent(f.id)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              style={styles.removeRecentBtn}
                            >
                              <X size={14} color={colors.subtle} />
                            </TouchableOpacity>

                            <View
                              style={[
                                styles.checkbox,
                                {
                                  borderColor: isSelected
                                    ? colors.primary
                                    : colors.subtle,
                                  backgroundColor: isSelected
                                    ? colors.primary
                                    : 'transparent',
                                },
                              ]}
                            >
                              {isSelected && <Check size={14} color={colors.onPrimary} />}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={[styles.emptyFriendsBox, { backgroundColor: colors.wash }]}>
                  <Search size={18} color={colors.subtle} style={{ opacity: 0.5, marginBottom: 4 }} />
                  <Text style={[styles.emptyFriendsText, { color: colors.subtle }]}>
                    {t.circle.searchPrompt}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleClose}
              style={[
                styles.cancelBtn,
                { backgroundColor: colors.wash, borderColor: colors.hairline },
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                {t.common.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canSubmit || createCircleMutation.isPending}
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    canSubmit && !createCircleMutation.isPending
                      ? colors.primary
                      : colors.border,
                },
              ]}
            >
              {createCircleMutation.isPending ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitBtnText,
                    { color: canSubmit ? colors.onPrimary : colors.subtle },
                  ]}
                >
                  {t.circle.createCircleSubmitBtn}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '88%',
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
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 18,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 10,
  },
  formGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  fieldErrorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  approvalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.2,
    gap: 12,
  },
  approvalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  approvalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalTextGroup: {
    flex: 1,
    gap: 2,
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  approvalDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  friendSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
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
  emptyFriendsBox: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyFriendsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  friendListContainer: {
    maxHeight: 160,
    gap: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 13,
    fontWeight: '600',
  },
  friendHandle: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  friendEmail: {
    fontSize: 11,
    fontWeight: '400',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  recentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentHeaderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentClearText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeRecentBtn: {
    padding: 4,
  },
});
