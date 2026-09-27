import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Mail, KeyRound } from 'lucide-react-native';
import { createAuthSchemas, getFirstZodError } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { mobileApiRequest } from '../../src/services/api';
import { AuthResponseData } from '@circle/types';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string; from?: string }>();
  const { colors, resolvedTheme } = useThemeStore();
  const { t, locale } = useLanguageStore();
  const setAuth = useAuthStore((s) => s.setAuth);

  const isDark = resolvedTheme === 'dark';

  const [email, setEmail] = useState(emailParam || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const pinInputRef = useRef<TextInput>(null);
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

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length < 6) return;

    setApiError(null);
    setSuccessMsg(null);

    const { verifyOtpSchema } = createAuthSchemas(locale);
    const validation = verifyOtpSchema.safeParse({ email: email.trim().toLowerCase(), otp: code });
    if (!validation.success) {
      const errorMsg = getFirstZodError(validation.error);
      setApiError(errorMsg || t.auth.otpSixDigits);
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

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
    if (cleaned.length === 6) {
      handleVerify(cleaned);
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
          body: JSON.stringify({ email: email.trim().toLowerCase(), type: 'VERIFICATION' }),
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
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={[
            styles.backBtn,
            { backgroundColor: colors.wash },
          ]}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <HeaderControls />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Prompt Section */}
        <View style={styles.promptSection}>
          <Text style={[styles.mainPrompt, { color: colors.text }]}>
            {t.auth.verifyOtpTitle}
          </Text>
          <Text style={[styles.subPrompt, { color: colors.subtle }]}>
            {t.auth.verifyOtpSubtitle}
          </Text>
          <View
            style={[
              styles.emailBadge,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            <Mail size={16} color={colors.primary} />
            <Text style={[styles.emailBadgeText, { color: colors.text }]}>
              {email}
            </Text>
          </View>
        </View>

        {/* Notifications */}
        {apiError ? (
          <View
            style={[
              styles.alertBanner,
              { backgroundColor: `${colors.coral}15`, borderColor: `${colors.coral}30` },
            ]}
          >
            <AlertCircle size={16} color={colors.coral} />
            <Text style={[styles.alertText, { color: colors.coral }]}>
              {apiError}
            </Text>
          </View>
        ) : null}

        {successMsg ? (
          <View
            style={[
              styles.alertBanner,
              { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` },
            ]}
          >
            <CheckCircle2 size={16} color={colors.primary} />
            <Text style={[styles.alertText, { color: colors.primary }]}>
              {successMsg}
            </Text>
          </View>
        ) : null}

        {/* 6 Native Rounded Cells */}
        <View style={styles.pinSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => pinInputRef.current?.focus()}
            style={styles.pinCellsRow}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const digit = otp[index] || '';
              const isCurrent = otp.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.pinCell,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isCurrent
                        ? colors.primary
                        : digit
                        ? colors.primary
                        : colors.hairline,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pinCellText,
                      { color: digit ? colors.text : colors.subtle },
                    ]}
                  >
                    {digit || '·'}
                  </Text>
                </View>
              );
            })}
          </TouchableOpacity>

          <TextInput
            ref={pinInputRef}
            style={styles.hiddenPinInput}
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textContentType="oneTimeCode"
            caretHidden
          />

          <Text style={[styles.hintText, { color: colors.subtle }]}>
            {t.auth.checkYourInbox}
          </Text>
        </View>

        {/* Resend OTP Row */}
        <View style={styles.resendSection}>
          {cooldown > 0 ? (
            <Text style={[styles.countdownText, { color: colors.subtle }]}>
              {t.auth.resendCountdown} ({cooldown}s)
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={resending}
              style={styles.resendBtn}
              activeOpacity={0.7}
            >
              {resending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={14} color={colors.primary} />
              )}
              <Text style={[styles.resendText, { color: colors.primary }]}>
                {t.auth.resendCode}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.canvas,
          },
        ]}
      >
        <Button
          title={t.auth.verifyButton}
          onPress={() => handleVerify()}
          loading={loading}
          disabled={otp.length !== 6}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  promptSection: {
    marginBottom: 20,
  },
  mainPrompt: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: 6,
  },
  subPrompt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  emailBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  pinSection: {
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  pinCellsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 4,
  },
  pinCell: {
    width: 46,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCellText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0,
  },
  hiddenPinInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
});
