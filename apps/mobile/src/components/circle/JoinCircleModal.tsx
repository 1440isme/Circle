import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { KeyRound, X, AlertCircle } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useJoinCircleMutation } from '../../hooks/use-circle-queries';
import { createCircleSchemas } from '@circle/shared';

export function JoinCircleModal() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isDark = resolvedTheme === 'dark';

  const visible = useCircleStore((s) => s.joinModalVisible);
  const setVisible = useCircleStore((s) => s.setJoinModalVisible);

  const [inviteCode, setInviteCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const joinCircleMutation = useJoinCircleMutation();

  const handleClose = () => {
    setInviteCode('');
    setFieldError(null);
    setServerError(null);
    setVisible(false);
  };

  const handleCodeChange = (text: string) => {
    const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(formatted);
    if (fieldError) setFieldError(null);
    if (serverError) setServerError(null);
  };

  const handleSubmit = async () => {
    setFieldError(null);
    setServerError(null);

    const schemas = createCircleSchemas(locale);
    const parsed = schemas.joinCircleSchema.safeParse({ inviteCode });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFieldError(issue?.message || t.validation.circleInviteCodeRequired);
      return;
    }

    try {
      await joinCircleMutation.mutateAsync({
        inviteCode: parsed.data.inviteCode,
      });
      handleClose();
    } catch (err: any) {
      setServerError(err?.message || t.circle.inviteCodeNotFound);
    }
  };

  const canSubmit = inviteCode.trim().length >= 4;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
            styles.dialogContainer,
            {
              backgroundColor: colors.sheetBg,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
                <KeyRound size={22} color={colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t.circle.joinModalTitle}
                </Text>
                <Text style={[styles.subtitle, { color: colors.subtle }]}>
                  {t.circle.joinModalSubtitle}
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

          {/* Server Error Banner */}
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

          {/* Input field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.circle.inviteCodeLabel}
            </Text>
            <TextInput
              value={inviteCode}
              onChangeText={handleCodeChange}
              maxLength={8}
              autoCapitalize="characters"
              placeholder={t.circle.inviteCodePlaceholder}
              placeholderTextColor={colors.subtle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: fieldError ? colors.danger : colors.hairline,
                  color: colors.text,
                },
              ]}
            />
            {fieldError ? (
              <Text style={[styles.fieldErrorText, { color: colors.danger }]}>
                {fieldError}
              </Text>
            ) : null}
          </View>

          {/* Action buttons */}
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
              disabled={!canSubmit || joinCircleMutation.isPending}
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    canSubmit && !joinCircleMutation.isPending
                      ? colors.primary
                      : `${colors.primary}50`,
                },
              ]}
            >
              {joinCircleMutation.isPending ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.onPrimary }]}>
                  {t.circle.joinCircleBtn}
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    borderWidth: 1.2,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  fieldErrorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
