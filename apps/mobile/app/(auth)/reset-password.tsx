import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Mail, KeyRound, ArrowLeft } from 'lucide-react-native';
import { resetPasswordSchema } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { mobileApiRequest } from '../../src/services/api';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { colors } = useThemeStore();
  const t = useLanguageStore((s) => s.t);

  const [email, setEmail] = useState(emailParam || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string[];
    otp?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleResetPassword = async () => {
    setApiError(null);
    setSuccessMsg(null);
    setFieldErrors({});

    const validation = resetPasswordSchema.safeParse({
      email,
      otp,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await mobileApiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: validation.data.email,
          otp: validation.data.otp,
          newPassword: validation.data.newPassword,
        }),
        skipAuth: true,
      });

      setSuccessMsg(res.data?.message || t.auth.resetPasswordSuccess);
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1200);
    } catch (err: any) {
      setApiError(err?.message || t.auth.failedToResetPassword);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.canvas }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <HeaderControls />
        </View>

        {/* Card Form */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.wash }]}>
            <Lock size={28} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t.auth.resetPasswordTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            {t.auth.resetPasswordSubtitle}
          </Text>

          {apiError ? (
            <View
              style={[
                styles.alertBox,
                { backgroundColor: `${colors.coral}15`, borderColor: `${colors.coral}30` },
              ]}
            >
              <Text style={[styles.alertText, { color: colors.coral }]}>
                {apiError}
              </Text>
            </View>
          ) : null}

          {successMsg ? (
            <View
              style={[
                styles.alertBox,
                { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` },
              ]}
            >
              <Text style={[styles.alertText, { color: colors.primary }]}>
                {successMsg}
              </Text>
            </View>
          ) : null}

          {/* Email input */}
          <Input
            label={t.auth.email}
            placeholder={t.auth.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail size={18} color={colors.subtle} />}
            error={fieldErrors.email?.[0]}
          />

          {/* OTP input */}
          <Input
            label={t.auth.otpLabel}
            placeholder={t.auth.otpPlaceholder}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            icon={<KeyRound size={18} color={colors.subtle} />}
            error={fieldErrors.otp?.[0]}
          />

          {/* New Password input */}
          <Input
            label={t.auth.newPassword}
            placeholder={t.auth.newPasswordPlaceholder}
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            icon={<Lock size={18} color={colors.subtle} />}
            error={fieldErrors.newPassword?.[0]}
          />

          {/* Confirm Password input */}
          <Input
            label={t.auth.confirmNewPassword}
            placeholder={t.auth.confirmNewPasswordPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            icon={<Lock size={18} color={colors.subtle} />}
            error={fieldErrors.confirmPassword?.[0]}
          />

          {/* Reset Button */}
          <Button
            title={t.auth.resetPasswordButton}
            onPress={handleResetPassword}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          {/* Back to Login */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.backToLoginBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.backToLoginText, { color: colors.subtle }]}>
              {t.auth.backToLogin}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  alertBox: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  backToLoginBtn: {
    marginTop: 20,
    padding: 6,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
