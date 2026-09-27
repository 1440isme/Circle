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
import { KeyRound, Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { verifyOtpSchema } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { mobileApiRequest } from '../../src/services/api';
import { AuthResponseData } from '@circle/types';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string; from?: string }>();
  const { colors } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState(emailParam || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    setApiError(null);
    setSuccessMsg(null);

    const validation = verifyOtpSchema.safeParse({ email, otp });
    if (!validation.success) {
      setApiError(validation.error.flatten().fieldErrors.otp?.[0] || 'Mã OTP không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const res = await mobileApiRequest<AuthResponseData>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(validation.data),
        skipAuth: true,
      });

      if (res.data?.tokens && res.data?.user) {
        setSuccessMsg(t.auth.accountActivatedSuccess);
        await setAuth(res.data.user, res.data.tokens);
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 800);
      }
    } catch (err: any) {
      setApiError(err?.message || t.auth.otpExpiredOrInvalid);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setApiError(null);
    setResending(true);

    try {
      const res = await mobileApiRequest<{ message: string; cooldownSeconds: number }>(
        '/auth/resend-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email, type: 'VERIFICATION' }),
          skipAuth: true,
        },
      );
      setSuccessMsg(res.data?.message || t.auth.resendSuccess);
      setCooldown(res.data?.cooldownSeconds || 60);
    } catch (err: any) {
      setApiError(err?.message || t.auth.failedToResendOtp);
    } finally {
      setResending(false);
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
            <KeyRound size={28} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t.auth.verifyOtpTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            {t.auth.verifyOtpSubtitle.replace('{email}', email || 'email của bạn')}
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

          {/* OTP Input */}
          <Input
            label={t.auth.otpLabel}
            placeholder={t.auth.otpPlaceholder}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
            icon={<KeyRound size={18} color={colors.subtle} />}
          />

          {/* Resend Cooldown Section */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendPrompt, { color: colors.subtle }]}>
              {t.auth.checkYourInbox}
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={cooldown > 0 || resending}
              style={styles.resendBtn}
            >
              <RefreshCw
                size={13}
                color={cooldown > 0 ? colors.subtle : colors.primary}
              />
              <Text
                style={[
                  styles.resendText,
                  { color: cooldown > 0 ? colors.subtle : colors.primary },
                ]}
              >
                {cooldown > 0
                  ? `${t.auth.resendCountdown} ${cooldown}s`
                  : t.auth.resendCode}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <Button
            title={t.auth.verifyButton}
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length !== 6}
            style={{ marginTop: 8 }}
          />
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
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    marginTop: 6,
  },
  resendPrompt: {
    fontSize: 12,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
