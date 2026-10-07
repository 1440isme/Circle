import React, { useState } from 'react';
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
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react-native';
import { createAuthSchemas, getFirstZodError } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { mobileApiRequest } from '../../src/services/api';
import { AuthResponseData } from '@circle/types';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, resolvedTheme } = useThemeStore();
  const { t, locale } = useLanguageStore();
  const setAuth = useAuthStore((s) => s.setAuth);

  const isDark = resolvedTheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleLogin = async () => {
    setApiError(null);

    const { loginSchema } = createAuthSchemas(locale);
    const validation = loginSchema.safeParse({ email: email.trim().toLowerCase(), password });
    if (!validation.success) {
      const errorMsg = getFirstZodError(validation.error);
      setApiError(errorMsg || t.auth.invalidInfo);
      return;
    }

    setLoading(true);
    try {
      const res = await mobileApiRequest<AuthResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(validation.data),
        skipAuth: true,
      });

      if (res.data?.tokens && res.data?.user) {
        await setAuth(res.data.user, res.data.tokens);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      if (
        err?.details?.code === 'ACCOUNT_NOT_ACTIVATED' ||
        err?.code === 'ACCOUNT_NOT_ACTIVATED' ||
        err?.message === t.auth.accountNotActivated ||
        err?.message?.toLowerCase().includes('not activated') ||
        err?.message?.toLowerCase().includes('kích hoạt')
      ) {
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { email: validation.data.email, from: 'login' },
        });
        return;
      }
      setApiError(err?.message || t.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.canvas }]}
    >
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.brandBadgeText, { color: colors.onPrimary }]}>C</Text>
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>{t.common.appName}</Text>
        </View>
        <HeaderControls />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Prompt */}
        <View style={styles.promptSection}>
          <Text style={[styles.mainPrompt, { color: colors.text }]}>
            {t.auth.welcomeBack}
          </Text>
          <Text style={[styles.subPrompt, { color: colors.subtle }]}>
            {t.auth.loginSubtitle}
          </Text>
        </View>

        {/* API Error Banner */}
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

        {/* Form Fields - Seamless Native Inputs */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View
            style={[
              styles.nativeInputWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            <Mail size={20} color={colors.subtle} />
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
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password Input */}
          <View
            style={[
              styles.nativeInputWrapper,
              {
                marginTop: 12,
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            <Lock size={20} color={colors.subtle} />
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

          {/* Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              activeOpacity={0.7}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                {t.auth.forgotPassword}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Button
            title={t.auth.login}
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>

      {/* Bottom Footer - Link to Register */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.canvas,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={styles.registerLinkRow}
          activeOpacity={0.7}
        >
          <Text style={[styles.linkSubText, { color: colors.subtle }]}>
            {t.auth.noAccount}{' '}
          </Text>
          <Text style={[styles.linkHighlight, { color: colors.primary }]}>
            {t.auth.signUpNow}
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  promptSection: {
    marginBottom: 24,
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
  formContainer: {
    gap: 4,
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: 12,
    paddingHorizontal: 2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  registerLinkRow: {
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
