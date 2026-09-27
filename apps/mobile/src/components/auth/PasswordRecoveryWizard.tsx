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
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import { createAuthSchemas, getFirstZodError } from '@circle/shared';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { mobileApiRequest } from '../../services/api';
import { Button } from '../common/Button';
import { HeaderControls } from '../common/HeaderControls';

interface PasswordRecoveryWizardProps {
  initialEmail?: string;
  initialStep?: 1 | 2 | 3;
}

export function PasswordRecoveryWizard({
  initialEmail = '',
  initialStep = 1,
}: PasswordRecoveryWizardProps) {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { t, locale } = useLanguageStore();

  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pinInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (step !== 2 || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Validation helpers
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isOtpValid = otp.trim().length === 6 && /^\d{6}$/.test(otp.trim());
  const isPasswordLongEnough = newPassword.length >= 8;
  const isPasswordMatching = newPassword.length >= 8 && newPassword === confirmPassword;
  const isStep3Valid = isPasswordLongEnough && isPasswordMatching;

  const handlePrevStep = () => {
    setApiError(null);
    setSuccessMsg(null);
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      router.push('/(auth)/login');
    }
  };

  // Step 1: Send OTP for password recovery
  const handleRequestOtp = async () => {
    setApiError(null);
    setSuccessMsg(null);

    const { forgotPasswordSchema } = createAuthSchemas(locale);
    const validation = forgotPasswordSchema.safeParse({ email: email.trim().toLowerCase() });
    if (!validation.success) {
      const errorMsg = getFirstZodError(validation.error);
      setApiError(errorMsg || t.validation.emailInvalid);
      return;
    }

    setLoading(true);
    try {
      const res = await mobileApiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(validation.data),
        skipAuth: true,
      });

      setSuccessMsg(res.data?.message || t.auth.resetOtpSentSuccess);
      setCooldown(60);
      setStep(2);
    } catch (err: any) {
      setApiError(err?.message || t.auth.failedToSendResetOtp);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setApiError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const res = await mobileApiRequest<{ message: string; cooldownSeconds?: number }>(
        '/auth/resend-otp',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            type: 'PASSWORD_RESET',
          }),
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

  // Step 2: Advance to Step 3
  const handleOtpNext = () => {
    setApiError(null);
    setSuccessMsg(null);
    if (isOtpValid) {
      setStep(3);
    } else {
      setApiError(t.auth.otpSixDigits);
    }
  };

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
    if (cleaned.length === 6) {
      setApiError(null);
      setStep(3);
    }
  };

  // Step 3: Final Reset Password Submit
  const handleFinalReset = async () => {
    setApiError(null);
    setSuccessMsg(null);

    const { resetPasswordSchema } = createAuthSchemas(locale);
    const validation = resetPasswordSchema.safeParse({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const errorMsg = getFirstZodError(validation.error);
      setApiError(errorMsg || t.auth.invalidInfo);
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
          confirmPassword: validation.data.confirmPassword,
        }),
        skipAuth: true,
      });

      setSuccessMsg(res.data?.message || t.auth.resetPasswordSuccess);
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1000);
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
      {/* Top Header & 3-Segment Progress Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handlePrevStep}
          activeOpacity={0.7}
          style={[styles.backBtn, { backgroundColor: colors.wash }]}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>

        {/* 3-Segment Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressSegment,
              { backgroundColor: colors.primary },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              {
                backgroundColor: step >= 2 ? colors.primary : colors.hairline,
              },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              {
                backgroundColor: step >= 3 ? colors.primary : colors.hairline,
              },
            ]}
          />
        </View>

        <HeaderControls />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step Badge */}
        <View style={[styles.stepBadge, { backgroundColor: colors.wash }]}>
          <Sparkles size={12} color={colors.primary} />
          <Text style={[styles.stepBadgeText, { color: colors.primary }]}>
            {step === 1
              ? t.auth.recoveryStep1Badge
              : step === 2
              ? t.auth.recoveryStep2Badge
              : t.auth.recoveryStep3Badge}
          </Text>
        </View>

        {/* Error Notification */}
        {apiError ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${colors.coral}15`, borderColor: `${colors.coral}30` },
            ]}
          >
            <AlertCircle size={16} color={colors.coral} />
            <Text style={[styles.bannerText, { color: colors.coral }]}>
              {apiError}
            </Text>
          </View>
        ) : null}

        {/* Success Notification */}
        {successMsg ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` },
            ]}
          >
            <CheckCircle2 size={16} color={colors.primary} />
            <Text style={[styles.bannerText, { color: colors.primary }]}>
              {successMsg}
            </Text>
          </View>
        ) : null}

        {/* ---------------- STEP 1: EMAIL ---------------- */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.mainPrompt, { color: colors.text }]}>
              {t.auth.recoveryEmailPrompt}
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              {t.auth.recoveryEmailSubPrompt}
            </Text>

            <View
              style={[
                styles.nativeInputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: isEmailValid ? colors.primary : colors.hairline,
                },
              ]}
            >
              <Mail size={20} color={isEmailValid ? colors.primary : colors.subtle} />
              <View style={styles.inputInner}>
                {!email ? (
                  <Text
                    pointerEvents="none"
                    style={[styles.placeholderOverlay, { color: colors.subtle }]}
                  >
                    {t.auth.emailPlaceholder}
                  </Text>
                ) : null}
                <TextInput
                  style={[styles.nativeTextInput, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={isEmailValid ? handleRequestOtp : undefined}
                />
              </View>
              {isEmailValid ? (
                <CheckCircle2 size={18} color={colors.primary} />
              ) : null}
            </View>
          </View>
        )}

        {/* ---------------- STEP 2: OTP (6 discrete cells, 0 stretched text) ---------------- */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.mainPrompt, { color: colors.text }]}>
              {t.auth.recoveryOtpPrompt}
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              {t.auth.recoveryOtpSubPrompt}
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

            <View style={styles.pinSection}>
              {/* 6 Native Rounded Cells */}
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
                          {
                            color: digit ? colors.text : colors.subtle,
                          },
                        ]}
                      >
                        {digit || '·'}
                      </Text>
                    </View>
                  );
                })}
              </TouchableOpacity>

              {/* Hidden Input capturing keyboard strokes & autofill */}
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
                  onPress={handleResendOtp}
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
          </View>
        )}

        {/* ---------------- STEP 3: NEW PASSWORD ---------------- */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.mainPrompt, { color: colors.text }]}>
              {t.auth.recoveryPasswordPrompt}
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              {t.auth.recoveryPasswordSubPrompt}
            </Text>

            {/* New Password input */}
            <View
              style={[
                styles.nativeInputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: isPasswordLongEnough ? colors.primary : colors.hairline,
                },
              ]}
            >
              <Lock size={20} color={isPasswordLongEnough ? colors.primary : colors.subtle} />
              <View style={styles.inputInner}>
                {!newPassword ? (
                  <Text
                    pointerEvents="none"
                    style={[styles.placeholderOverlay, { color: colors.subtle }]}
                  >
                    {t.auth.newPasswordPlaceholder}
                  </Text>
                ) : null}
                <TextInput
                  style={[styles.nativeTextInput, { color: colors.text }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showNewPassword ? (
                  <EyeOff size={18} color={colors.subtle} />
                ) : (
                  <Eye size={18} color={colors.subtle} />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm New Password input */}
            <View
              style={[
                styles.nativeInputWrapper,
                {
                  marginTop: 12,
                  backgroundColor: colors.surface,
                  borderColor: isPasswordMatching ? colors.primary : colors.hairline,
                },
              ]}
            >
              <Lock size={20} color={isPasswordMatching ? colors.primary : colors.subtle} />
              <View style={styles.inputInner}>
                {!confirmPassword ? (
                  <Text
                    pointerEvents="none"
                    style={[styles.placeholderOverlay, { color: colors.subtle }]}
                  >
                    {t.auth.confirmNewPasswordPlaceholder}
                  </Text>
                ) : null}
                <TextInput
                  style={[styles.nativeTextInput, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={isStep3Valid ? handleFinalReset : undefined}
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color={colors.subtle} />
                ) : (
                  <Eye size={18} color={colors.subtle} />
                )}
              </TouchableOpacity>
            </View>

            {/* Checklist */}
            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <CheckCircle2
                  size={15}
                  color={isPasswordLongEnough ? colors.primary : colors.subtle}
                />
                <Text
                  style={[
                    styles.checkText,
                    { color: isPasswordLongEnough ? colors.text : colors.subtle },
                  ]}
                >
                  {t.auth.min8Chars}
                </Text>
              </View>

              <View style={styles.checkItem}>
                <CheckCircle2
                  size={15}
                  color={isPasswordMatching ? colors.primary : colors.subtle}
                />
                <Text
                  style={[
                    styles.checkText,
                    { color: isPasswordMatching ? colors.text : colors.subtle },
                  ]}
                >
                  {t.auth.passwordMatch}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Navigation CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.canvas }]}>
        {step === 1 ? (
          <TouchableOpacity
            onPress={handleRequestOtp}
            disabled={!isEmailValid || loading}
            activeOpacity={0.8}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: isEmailValid ? colors.primary : colors.wash,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                  {t.auth.continueBtn}
                </Text>
                <ArrowRight size={18} color={colors.onPrimary} />
              </>
            )}
          </TouchableOpacity>
        ) : step === 2 ? (
          <TouchableOpacity
            onPress={handleOtpNext}
            disabled={!isOtpValid}
            activeOpacity={0.8}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: isOtpValid ? colors.primary : colors.wash,
              },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
              {t.auth.continueBtn}
            </Text>
            <ArrowRight size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <Button
            title={t.auth.resetPasswordButton}
            onPress={handleFinalReset}
            loading={loading}
            disabled={!isStep3Valid}
          />
        )}

        {/* Back to Login Link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginLinkRow}
          activeOpacity={0.7}
        >
          <Text style={[styles.linkSubText, { color: colors.subtle }]}>
            {t.auth.hasAccount}{' '}
          </Text>
          <Text style={[styles.linkHighlight, { color: colors.primary }]}>
            {t.auth.signInHere}
          </Text>
        </TouchableOpacity>
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
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressSegment: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  stepContent: {
    gap: 8,
  },
  mainPrompt: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  subPrompt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  emailBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nativeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputInner: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  placeholderOverlay: {
    position: 'absolute',
    left: 0,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
  },
  nativeTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    padding: 0,
  },
  pinSection: {
    alignItems: 'center',
    marginVertical: 12,
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
    marginTop: 8,
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
  checklist: {
    marginTop: 14,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkSubText: {
    fontSize: 13,
  },
  linkHighlight: {
    fontSize: 13,
    fontWeight: '700',
  },
});
