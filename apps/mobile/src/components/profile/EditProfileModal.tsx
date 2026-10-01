import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image as RNImage,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, User, Image as ImageIcon, Check, Sparkles } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const { user, updateProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (user && visible) {
      setDisplayName(user.profile?.displayName || user.email?.split('@')[0] || '');
      setBio(user.profile?.bio || '');
      setAvatarUrl(user.profile?.avatarUrl || '');
      setShowCustomUrlInput(false);
    }
  }, [user, visible]);

  const initials = getInitials(displayName || user?.email || 'User');

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert(t.common.appName, t.validation.displayNameMinLength);
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        displayName: trimmedName,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      Alert.alert(t.common.appName, t.auth.profileUpdatedSuccess);
      onClose();
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: `${colors.primary}20` }]}>
                <User size={18} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t.auth.editProfile}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
              activeOpacity={0.7}
            >
              <X size={16} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Preview */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatarBox, { borderColor: colors.primary, backgroundColor: colors.wash }]}>
                {avatarUrl ? (
                  <RNImage
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={[styles.avatarInitials, { color: colors.text }]}>{initials}</Text>
                )}
              </View>
              <Text style={[styles.avatarSectionTitle, { color: colors.subtle }]}>
                {t.auth.changeAvatar}
              </Text>

              {/* Avatar Presets Bar */}
              <View style={styles.presetsRow}>
                {/* Default Initials Option */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAvatarUrl('')}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: !avatarUrl ? colors.primary : colors.wash,
                      borderColor: !avatarUrl ? colors.primary : colors.hairline,
                    },
                  ]}
                >
                  <Text style={[styles.presetInitials, { color: !avatarUrl ? colors.onPrimary : colors.subtle }]}>
                    {initials}
                  </Text>
                </TouchableOpacity>

                {AVATAR_PRESETS.map((preset, idx) => {
                  const isSelected = avatarUrl === preset;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setAvatarUrl(preset)}
                      style={[
                        styles.presetBtn,
                        isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                      ]}
                    >
                      <RNImage source={{ uri: preset }} style={styles.presetThumb} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}

                {/* Custom URL Toggle Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: showCustomUrlInput ? `${colors.primary}25` : colors.wash,
                      borderColor: showCustomUrlInput ? colors.primary : colors.hairline,
                    },
                  ]}
                >
                  <ImageIcon size={14} color={showCustomUrlInput ? colors.primary : colors.subtle} />
                </TouchableOpacity>
              </View>

              {showCustomUrlInput && (
                <View style={styles.customUrlBox}>
                  <TextInput
                    value={avatarUrl}
                    onChangeText={setAvatarUrl}
                    placeholder="https://example.com/avatar.jpg"
                    placeholderTextColor={colors.subtle}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.customUrlInput,
                      {
                        backgroundColor: colors.wash,
                        borderColor: colors.hairline,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Display Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t.auth.displayName} <Text style={{ color: colors.coral }}>*</Text>
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t.auth.displayNamePlaceholder}
                placeholderTextColor={colors.subtle}
                maxLength={50}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.wash,
                    borderColor: colors.hairline,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Bio Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t.auth.bio}
                </Text>
                <Text style={[styles.counterText, { color: colors.subtle }]}>
                  {bio.length}/300
                </Text>
              </View>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder={t.auth.bioPlaceholder}
                placeholderTextColor={colors.subtle}
                maxLength={300}
                multiline
                numberOfLines={3}
                style={[
                  styles.textAreaInput,
                  {
                    backgroundColor: colors.wash,
                    borderColor: colors.hairline,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Account Info Readonly */}
            <View style={[styles.readonlyCard, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
              <Text style={[styles.readonlyItemText, { color: colors.subtle }]}>
                Email: <Text style={{ color: colors.text, fontWeight: '700' }}>{user?.email}</Text>
              </Text>
              <Text style={[styles.readonlyItemText, { color: colors.subtle, marginTop: 4 }]}>
                Vai trò: <Text style={{ color: colors.primary, fontWeight: '700' }}>{user?.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member}</Text>
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footerRow, { borderTopColor: colors.hairline }]}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={[styles.cancelBtn, { borderColor: colors.hairline }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                {t.common.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                  {t.auth.saveProfile}
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.2,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
  },
  avatarSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetThumb: {
    width: '100%',
    height: '100%',
  },
  presetInitials: {
    fontSize: 12,
    fontWeight: '700',
  },
  customUrlBox: {
    width: '100%',
    marginTop: 4,
  },
  customUrlInput: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  textInput: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaInput: {
    height: 80,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  readonlyCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  readonlyItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.6,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
