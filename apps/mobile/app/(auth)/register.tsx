import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { createAuthSchemas, getFirstZodError, checkPasswordRequirements } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { mobileApiRequest } from '../../src/services/api';
import { AuthResponseData } from '@circle/types';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';
import { PasswordComplexityChecklist } from '../../src/components/auth/PasswordComplexityChecklist';
import { TrustBanner } from '../../src/components/auth/TrustBanner';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, resolvedTheme } = useThemeStore();
  const { t, locale } = useLanguageStore();

  const isDark = resolvedTheme === 'dark';

  // 3-Step Wizard: 1 = Name, 2 = Email, 3 = Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Validation helpers
  const isNameValid = displayName.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordReqs = checkPasswordRequirements(password);
  const isPasswordMatching = password.length > 0 && password === confirmPassword;
  const isStep3Valid = passwordReqs.isValid && isPasswordMatching;

  const handleNextStep = () => {
    setApiError(null);
    if (step === 1 && isNameValid) {
      setStep(2);
    } else if (step === 2 && isEmailValid) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setApiError(null);
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.push('/(auth)/login');
  };

  const handleFinalSubmit = async () => {
    setApiError(null);

    const { registerSchema } = createAuthSchemas(locale);
    const validation = registerSchema.safeParse({
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const errorMsg = getFirstZodError(validation.error);
      setApiError(errorMsg || t.auth.invalidInfo);
      return;
    }

    setLoading(true);
    try {
      await mobileApiRequest<AuthResponseData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName: validation.data.displayName,
          email: validation.data.email,
          password: validation.data.password,
        }),
        skipAuth: true,
      });

      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: validation.data.email, from: 'register' },
      });
    } catch (err: any) {
      setApiError(err?.message || t.auth.registerFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.canvas }]}
    >
      {/* Top Header & Step Progress Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handlePrevStep}
          activeOpacity={0.7}
          style={[
            styles.backBtn,
            { backgroundColor: colors.wash },
          ]}
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
                backgroundColor:
                  step >= 2
                    ? colors.primary
                    : colors.hairline,
              },
            ]}
          />
          <View
            style={[
              styles.progressSegment,
              {
                backgroundColor:
                  step >= 3
                    ? colors.primary
                    : colors.hairline,
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
        {/* Step Counter Badge */}
        <View
          style={[
            styles.stepBadge,
            { backgroundColor: colors.wash },
          ]}
        >
          <Sparkles size={12} color={colors.primary} />
          <Text style={[styles.stepBadgeText, { color: colors.primary }]}>
            {step === 1
              ? t.auth.wizardStep1Badge
              : step === 2
              ? t.auth.wizardStep2Badge
              : t.auth.wizardStep3Badge}
          </Text>
        </View>

        {/* API Error Notification */}
        {apiError ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: `${colors.coral}15`, borderColor: `${colors.coral}30` },
            ]}
          >
            <AlertCircle size={16} color={colors.coral} />
            <Text style={[styles.errorBannerText, { color: colors.coral }]}>
              {apiError}
            </Text>
          </View>
        ) : null}

        {/* ---------------- STEP 1: DISPLAY NAME ---------------- */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.mainPrompt, { color: colors.text }]}>
              {t.auth.wizardStep1Prompt}
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              {t.auth.wizardStep1SubPrompt}
            </Text>

            <View
              style={[
                styles.nativeInputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: isNameValid ? colors.primary : colors.hairline,
                },
              ]}
            >
              <User size={20} color={isNameValid ? colors.primary : colors.subtle} />
              <View style={styles.inputInner}>
                {!displayName ? (
                  <Text
                    pointerEvents="none"
                    style={[styles.placeholderOverlay, { color: colors.subtle }]}
                  >
                    {t.auth.displayNamePlaceholder}
                  </Text>
                ) : null}
                <TextInput
                  style={[styles.nativeTextInput, { color: colors.text }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={isNameValid ? handleNextStep : undefined}
                />
              </View>
              {isNameValid ? (
                <CheckCircle2 size={18} color={colors.primary} />
              ) : null}
            </View>
          </View>
        )}

        {/* ---------------- STEP 2: EMAIL ---------------- */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.mainPrompt, { color: colors.text }]}>
              {t.auth.wizardStep2Prompt}
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              {t.auth.wizardStep2SubPrompt}
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
                  onSubmitEditing={isEmailValid ? handleNextStep : undefined}
                />
              </View>
              {isEmailValid ? (
                <CheckCircle2 size={18} color={colors.primary} />
              ) : null}
            </View>
          </View>
        )}

        {/* ---------------- STEP 3: PASSWORD ---------------- */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.mainPrompt, { color: colors.text }]}>
              {t.auth.wizardStep3Prompt}
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              {t.auth.wizardStep3SubPrompt}
            </Text>

            {/* Password input */}
            <View
              style={[
                styles.nativeInputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: passwordReqs.minLength ? colors.primary : colors.hairline,
                },
              ]}
            >
              <Lock size={20} color={passwordReqs.minLength ? colors.primary : colors.subtle} />
              <View style={styles.inputInner}>
                {!password ? (
                  <Text
                    pointerEvents="none"
                    style={[styles.placeholderOverlay, { color: colors.subtle }]}
                  >
                    {t.auth.passwordPlaceholder}
                  </Text>
                ) : null}
                <TextInput
                  style={[styles.nativeTextInput, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.subtle} />
                ) : (
                  <Eye size={18} color={colors.subtle} />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Password input */}
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
                    {t.auth.confirmPasswordPlaceholder}
                  </Text>
                ) : null}
                <TextInput
                  style={[styles.nativeTextInput, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={isStep3Valid ? handleFinalSubmit : undefined}
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

            {/* Realtime Password Complexity Checklist */}
            <PasswordComplexityChecklist
              password={password}
              confirmPassword={confirmPassword}
              showMatch={true}
            />

            {/* Terms notice */}
            <Text style={[styles.termsText, { color: colors.subtle }]}>
              {t.auth.termsAgreement}
            </Text>

            {/* Privacy Trust Banner */}
            <TrustBanner />
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Navigation CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.canvas,
          },
        ]}
      >
        {step < 3 ? (
          <TouchableOpacity
            onPress={handleNextStep}
            disabled={step === 1 ? !isNameValid : !isEmailValid}
            activeOpacity={0.8}
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  (step === 1 && isNameValid) || (step === 2 && isEmailValid)
                    ? colors.primary
                    : colors.wash,
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
            title={t.auth.registerAndVerifyOtp}
            onPress={handleFinalSubmit}
            loading={loading}
            disabled={!isStep3Valid}
          />
        )}

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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
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
    marginBottom: 20,
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
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
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
