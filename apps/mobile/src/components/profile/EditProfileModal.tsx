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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { useEdgeSwipeDismiss } from '../../hooks/use-edge-swipe';

interface EditProfileModalProps {
  visible: boolean;
  initialMode?: 'edit' | 'avatar';
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

export function EditProfileModal({ visible, initialMode = 'edit', onClose }: EditProfileModalProps) {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const insets = useSafeAreaInsets();
  const t = useLanguageStore((s) => s.t);
  const { user, updateProfile } = useAuthStore();

  const [mode, setMode] = useState<'edit' | 'avatar'>(initialMode);
  const edgePan = useEdgeSwipeDismiss({ onDismiss: onClose });
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && visible) {
      setDisplayName(user.profile?.displayName || user.email?.split('@')[0] || '');
      setHandle(user.profile?.handle || '');
      setBio(user.profile?.bio || '');
      setAvatarUrl(user.profile?.avatarUrl || '');
      setFormError(null);
      setSaveSuccess(null);
      const rawDob = user.profile?.dateOfBirth;
      if (rawDob) {
        try {
          const d = new Date(rawDob);
          setDateOfBirth(d.toISOString().split('T')[0]);
        } catch {
          setDateOfBirth('');
        }
      } else {
        setDateOfBirth('');
      }
      setShowCustomUrlInput(false);
      setMode(initialMode);
    }
  }, [user, visible, initialMode]);

  const initials = getInitials(displayName || user?.email || t.auth.guest);

  const handleSaveProfile = async () => {
    setFormError(null);
    setSaveSuccess(null);
    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError(t.validation.displayNameMinLength);
      return;
    }

    const cleanHandle = handle.trim().toLowerCase().replace(/^@+/, '');
    if (cleanHandle) {
      if (cleanHandle.length < 3) {
        setFormError(t.validation.userHandleMinLength);
        return;
      }
      if (cleanHandle.length > 30) {
        setFormError(t.validation.userHandleMaxLength);
        return;
      }
      if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
        setFormError(t.validation.userHandleInvalid);
        return;
      }
    }

    let parsedDobIso: string | null = null;
    if (dateOfBirth.trim()) {
      const parsed = new Date(dateOfBirth.trim());
      if (Number.isNaN(parsed.getTime())) {
        setFormError(t.validation.circleAvatarInvalid ? t.common.unknownError : t.common.unknownError);
        return;
      }
      parsedDobIso = parsed.toISOString();
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        displayName: trimmedName,
        handle: cleanHandle || undefined,
        bio: bio.trim() || null,
        dateOfBirth: parsedDobIso,
      });
      setSaveSuccess(t.auth.profileUpdatedSuccess);
      setTimeout(() => {
        setSaveSuccess(null);
        onClose();
      }, 650);
    } catch (err: any) {
      setFormError(err?.message || t.common.unknownError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAvatar = async () => {
    setFormError(null);
    setSaveSuccess(null);
    try {
      setIsSubmitting(true);
      await updateProfile({
        avatarUrl: avatarUrl.trim() || null,
      });
      setSaveSuccess(t.auth.avatarUpdatedSuccess);
      setTimeout(() => {
        setSaveSuccess(null);
        onClose();
      }, 650);
    } catch (err: any) {
      setFormError(err?.message || t.common.unknownError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sheetContent = (
    <>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mode === 'avatar' ? t.auth.changeAvatarTitle : t.auth.editProfile}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.closeBtn, { backgroundColor: colors.wash }]}
          activeOpacity={0.7}
          accessibilityLabel={t.common.close}
        >
          <X size={16} color={colors.subtle} />
        </TouchableOpacity>
      </View>

      {/* Inline Feedback Banners */}
      {formError && (
        <View
          style={[
            styles.feedbackBanner,
            { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` },
          ]}
        >
          <AlertCircle size={15} color={colors.danger} />
          <Text style={[styles.feedbackText, { color: colors.danger }]}>{formError}</Text>
        </View>
      )}
      {saveSuccess && (
        <View
          style={[
            styles.feedbackBanner,
            { backgroundColor: `${colors.sage}18`, borderColor: `${colors.sage}40` },
          ]}
        >
          <CheckCircle2 size={15} color={colors.sage} />
          <Text style={[styles.feedbackText, { color: colors.sage }]}>{saveSuccess}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* AVATAR MODE */}
        {mode === 'avatar' ? (
          <View style={styles.avatarSection}>
            <View style={[styles.avatarBox, { borderColor: colors.sage, backgroundColor: colors.wash }]}>
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
              {t.auth.quickAvatarChoose}
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
                      { borderColor: isSelected ? colors.sage : colors.hairline },
                      isSelected && { borderWidth: 2.5 },
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
                    backgroundColor: showCustomUrlInput ? `${colors.sage}22` : colors.wash,
                    borderColor: showCustomUrlInput ? colors.sage : colors.hairline,
                  },
                ]}
              >
                <ImageIcon size={14} color={showCustomUrlInput ? colors.sage : colors.subtle} />
              </TouchableOpacity>
            </View>

            {showCustomUrlInput && (
              <View style={styles.customUrlBox}>
                <TextInput
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  placeholder={t.circle.avatarUrlPlaceholder}
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
        ) : (
          /* EDIT PROFILE MODE */
          <View style={{ gap: 14 }}>
            {/* Display Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t.auth.displayName} <Text style={{ color: colors.coral }}>*</Text>
              </Text>
              <TextInput
                value={displayName}
                onChangeText={(val) => {
                  if (formError) setFormError(null);
                  setDisplayName(val);
                }}
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

            {/* Nickname / Handle Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t.auth.handle}
                </Text>
                <Text style={[styles.counterText, { color: colors.subtle }]}>
                  {handle.replace(/^@+/, '').length}/30
                </Text>
              </View>
              <View
                style={[
                  styles.handleInputContainer,
                  {
                    backgroundColor: colors.wash,
                    borderColor: colors.hairline,
                  },
                ]}
              >
                <Text style={[styles.atPrefix, { color: colors.sage }]}>@</Text>
                <TextInput
                  value={handle.replace(/^@+/, '')}
                  onChangeText={(val) => {
                    if (formError) setFormError(null);
                    setHandle(val.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  }}
                  placeholder={t.auth.handlePlaceholder.replace(/^.*:\s*/, '')}
                  placeholderTextColor={colors.subtle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                  style={[styles.handleTextInput, { color: colors.text }]}
                />
              </View>
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

            {/* Date of Birth Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t.auth.dateOfBirth} (YYYY-MM-DD)
              </Text>
              <TextInput
                value={dateOfBirth}
                onChangeText={(val) => {
                  if (formError) setFormError(null);
                  setDateOfBirth(val);
                }}
                placeholder="2002-08-15"
                placeholderTextColor={colors.subtle}
                maxLength={10}
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
          </View>
        )}
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
          onPress={mode === 'avatar' ? handleSaveAvatar : handleSaveProfile}
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
    </>
  );

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
        {uiStyle === 'glass' ? (
          <BlurView
            intensity={glassTheme.blur.intensity}
            tint={glassTheme.blur.tint}
            {...edgePan.panHandlers}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: glassTheme.colors.glassBorder,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            {sheetContent}
          </BlurView>
        ) : (
          <View
            {...edgePan.panHandlers}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: colors.hairline,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            {sheetContent}
          </View>
        )}
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
    gap: 12,
  },
  avatarBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    fontSize: 28,
    fontWeight: '800',
  },
  avatarSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackText: {
    flex: 1,
    fontSize: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 13,
    fontWeight: '700',
  },
  customUrlBox: {
    width: '100%',
    marginTop: 6,
  },
  customUrlInput: {
    height: 40,
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
  handleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 4,
  },
  atPrefix: {
    fontSize: 15,
    fontWeight: '700',
  },
  handleTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  helperText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
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
