import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldCheck, CheckSquare, Square } from 'lucide-react-native';
import { loginSchema } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { mobileApiRequest } from '../../src/services/api';
import { AuthResponseData } from '@circle/types';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string[]; password?: string[] }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleLogin = async () => {
    setApiError(null);
    setFieldErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
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
        err?.message?.toLowerCase().includes('not activated') ||
        err?.message?.includes('kích hoạt')
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.brandBadgeText}>C</Text>
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: colors.text }]}>CIRCLE</Text>
              <Text style={[styles.brandSubtitle, { color: colors.subtle }]}>
                {t.auth.brandTagline}
              </Text>
            </View>
          </View>
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
          <Text style={[styles.title, { color: colors.text }]}>
            {t.auth.welcomeBack}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            {t.auth.loginSubtitle}
          </Text>

          {apiError ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: `${colors.coral}15`, borderColor: `${colors.coral}30` },
              ]}
            >
              <Text style={[styles.errorBoxText, { color: colors.coral }]}>
                {apiError}
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

          {/* Password input */}
          <Input
            label={t.auth.password}
            placeholder={t.auth.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            isPassword
            icon={<Lock size={18} color={colors.subtle} />}
            error={fieldErrors.password?.[0]}
          />

          {/* Remember me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              {rememberMe ? (
                <CheckSquare size={17} color={colors.primary} />
              ) : (
                <Square size={17} color={colors.subtle} />
              )}
              <Text style={[styles.rememberText, { color: colors.subtle }]}>
                {t.auth.rememberMe}
              </Text>
            </TouchableOpacity>

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

          {/* Register Link */}
          <View style={styles.switchAuthRow}>
            <Text style={[styles.switchAuthText, { color: colors.subtle }]}>
              {t.auth.noAccount}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchAuthLink, { color: colors.primary }]}>
                {t.auth.signUpNow}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Badge */}
        <View style={styles.securityRow}>
          <ShieldCheck size={14} color={colors.primary} />
          <Text style={[styles.securityText, { color: colors.subtle }]}>
            {t.common.dualTokenSecurity}
          </Text>
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
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 12,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchAuthText: {
    fontSize: 13,
  },
  switchAuthLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
