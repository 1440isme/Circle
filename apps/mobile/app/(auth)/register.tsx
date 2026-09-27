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
import { registerSchema } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { mobileApiRequest } from '../../src/services/api';
import { AuthResponseData } from '@circle/types';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);

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
  const isPasswordLongEnough = password.length >= 8;
  const isPasswordMatching = password.length >= 8 && password === confirmPassword;
  const isStep3Valid = isPasswordLongEnough && isPasswordMatching;

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

    const validation = registerSchema.safeParse({
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const firstError = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
      setApiError(firstError || 'Thông tin không hợp lệ');
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
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
            },
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
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
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
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
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
            { backgroundColor: `${colors.primary}15` },
          ]}
        >
          <Sparkles size={12} color={colors.primary} />
          <Text style={[styles.stepBadgeText, { color: colors.primary }]}>
            {step === 1 ? 'BƯỚC 1 / 3 · DANH TÍNH' : step === 2 ? 'BƯỚC 2 / 3 · LIÊN HỆ' : 'BƯỚC 3 / 3 · BẢO MẬT'}
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
              Bạn muốn bạn bè gọi mình là gì?
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              Tên hiển thị này sẽ xuất hiện trong các Vòng tròn thân mật của bạn và có thể thay đổi bất cứ lúc nào.
            </Text>

            <View
              style={[
                styles.nativeInputWrapper,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isNameValid
                    ? colors.primary
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <User size={20} color={isNameValid ? colors.primary : colors.subtle} />
              <TextInput
                style={[styles.nativeTextInput, { color: colors.text }]}
                placeholder={t.auth.displayNamePlaceholder || 'VD: Trương Công Bình'}
                placeholderTextColor={colors.subtle}
                value={displayName}
                onChangeText={setDisplayName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={isNameValid ? handleNextStep : undefined}
              />
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
              Địa chỉ email của bạn là gì?
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              Chúng tôi sẽ gửi một mã xác thực 6 số tới địa chỉ này để kích hoạt và bảo vệ không gian riêng tư của bạn.
            </Text>

            <View
              style={[
                styles.nativeInputWrapper,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isEmailValid
                    ? colors.primary
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Mail size={20} color={isEmailValid ? colors.primary : colors.subtle} />
              <TextInput
                style={[styles.nativeTextInput, { color: colors.text }]}
                placeholder={t.auth.emailPlaceholder || 'tenban@domain.com'}
                placeholderTextColor={colors.subtle}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={isEmailValid ? handleNextStep : undefined}
              />
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
              Tạo mật khẩu an toàn
            </Text>
            <Text style={[styles.subPrompt, { color: colors.subtle }]}>
              Mật khẩu giúp bảo vệ tài khoản của bạn và các dữ liệu chia sẻ trong Vòng tròn.
            </Text>

            {/* Password input */}
            <View
              style={[
                styles.nativeInputWrapper,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isPasswordLongEnough
                    ? colors.primary
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Lock size={20} color={isPasswordLongEnough ? colors.primary : colors.subtle} />
              <TextInput
                style={[styles.nativeTextInput, { color: colors.text }]}
                placeholder={t.auth.passwordPlaceholder || 'Mật khẩu an toàn'}
                placeholderTextColor={colors.subtle}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoFocus
              />
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
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isPasswordMatching
                    ? colors.primary
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <Lock size={20} color={isPasswordMatching ? colors.primary : colors.subtle} />
              <TextInput
                style={[styles.nativeTextInput, { color: colors.text }]}
                placeholder={t.auth.confirmPasswordPlaceholder || 'Nhập lại mật khẩu'}
                placeholderTextColor={colors.subtle}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={isStep3Valid ? handleFinalSubmit : undefined}
              />
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
                  {t.auth.min8Chars || 'Tối thiểu 8 ký tự'}
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
                  {t.auth.passwordMatch || 'Mật khẩu xác nhận trùng khớp'}
                </Text>
              </View>
            </View>

            {/* Terms notice */}
            <Text style={[styles.termsText, { color: colors.subtle }]}>
              {t.auth.termsAgreement}
            </Text>
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
                    : isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.12)',
              },
            ]}
          >
            <Text style={styles.primaryBtnText}>Tiếp tục</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <Button
            title="Đăng ký & Nhận mã OTP"
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
  nativeTextInput: {
    flex: 1,
    fontSize: 16,
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
    color: '#FFFFFF',
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
