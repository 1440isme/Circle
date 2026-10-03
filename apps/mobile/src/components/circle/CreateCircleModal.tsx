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
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Users,
  X,
  Globe,
  Lock,
  Search,
  Check,
  AlertCircle,
  UserPlus,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import {
  useCreateCircleMutation,
  useSelectableFriendsQuery,
} from '../../hooks/use-circle-queries';
import { createCircleSchemas } from '@circle/shared';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CreateCircleModal() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isDark = resolvedTheme === 'dark';

  const visible = useCircleStore((s) => s.createModalVisible);
  const setVisible = useCircleStore((s) => s.setCreateModalVisible);

  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const createCircleMutation = useCreateCircleMutation();
  const { data: selectableFriends = [], isLoading: isLoadingFriends } =
    useSelectableFriendsQuery();

  const handleClose = () => {
    setName('');
    setIsPrivate(false);
    setSelectedFriendIds([]);
    setFriendSearch('');
    setFieldErrors({});
    setServerError(null);
    setVisible(false);
  };

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const filteredFriends = selectableFriends.filter((f) => {
    const q = friendSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      f.displayName.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async () => {
    setServerError(null);
    setFieldErrors({});

    const { createCircleSchema } = createCircleSchemas(locale);
    const payload = {
      ...(name.trim() ? { name: name.trim() } : {}),
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

  const canSubmit = name.trim().length >= 2 || selectedFriendIds.length > 0;

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
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
                <Users size={22} color={colors.primary} />
              </View>
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
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
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
                  {t.circle.nameLabel}
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
                  borderColor: isPrivate ? colors.primary : colors.hairline,
                },
              ]}
            >
              <View style={styles.approvalLeft}>
                <View style={[styles.approvalIconBox, { backgroundColor: `${colors.primary}18` }]}>
                  {isPrivate ? (
                    <Lock size={18} color={colors.primary} />
                  ) : (
                    <Globe size={18} color={colors.primary} />
                  )}
                </View>
                <View style={styles.approvalTextGroup}>
                  <Text style={[styles.approvalTitle, { color: colors.text }]}>
                    {t.circle.requireApprovalTitle}
                  </Text>
                  <Text style={[styles.approvalDesc, { color: colors.subtle }]}>
                    {t.circle.requireApprovalDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: colors.hairline, true: colors.primary }}
              />
            </View>

            {/* Field: Friend Selector */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <View style={styles.friendSectionHeader}>
                  <UserPlus size={16} color={colors.primary} />
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t.circle.selectFriendsLabel}
                  </Text>
                </View>
                {selectedFriendIds.length > 0 && (
                  <View style={[styles.counterBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.counterText, { color: colors.onPrimary }]}>
                      {selectedFriendIds.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Friend Search Input */}
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
              </View>

              {/* Friend List */}
              {isLoadingFriends ? (
                <ActivityIndicator
                  style={{ marginVertical: 16 }}
                  color={colors.primary}
                />
              ) : filteredFriends.length === 0 ? (
                <View style={[styles.emptyFriendsBox, { backgroundColor: colors.wash }]}>
                  <Text style={[styles.emptyFriendsText, { color: colors.subtle }]}>
                    {friendSearch
                      ? t.circle.noFriendsFound
                      : t.circle.noSelectableFriends}
                  </Text>
                </View>
              ) : (
                <View style={styles.friendListContainer}>
                  {filteredFriends.map((f) => {
                    const isSelected = selectedFriendIds.includes(f.id);
                    return (
                      <TouchableOpacity
                        key={f.id}
                        activeOpacity={0.75}
                        onPress={() => handleToggleFriend(f.id)}
                        style={[
                          styles.friendItem,
                          {
                            backgroundColor: isSelected
                              ? `${colors.primary}12`
                              : colors.surface,
                            borderColor: isSelected
                              ? colors.primary
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
                                { color: colors.primary },
                              ]}
                            >
                              {getInitials(f.displayName || f.email)}
                            </Text>
                          </View>
                          <View style={styles.friendInfo}>
                            <Text
                              numberOfLines={1}
                              style={[styles.friendName, { color: colors.text }]}
                            >
                              {f.displayName}
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
                      : `${colors.primary}50`,
                },
              ]}
            >
              {createCircleMutation.isPending ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.onPrimary }]}>
                  {t.circle.createCircleSubmitBtn}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
});
