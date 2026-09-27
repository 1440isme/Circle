import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react-native';
import { registerSchema } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { mobileApiRequest } from '../../src/services/api';
import { AuthResponseData } from '@circle/types';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const t = useLanguageStore((s) => s.t);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleRegister = async () => {
    setApiError(null);
    setFieldErrors({});

    const validation = registerSchema.safeParse({
      displayName,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
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
            {t.auth.createAccount}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            {t.auth.registerSubtitle}
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

          {/* Display Name */}
          <Input
            label={t.auth.displayName}
            placeholder={t.auth.displayNamePlaceholder}
            value={displayName}
            onChangeText={setDisplayName}
            icon={<User size={18} color={colors.subtle} />}
            error={fieldErrors.displayName?.[0]}
          />

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

          {/* Confirm Password input */}
          <Input
            label={t.auth.confirmPassword}
            placeholder={t.auth.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            icon={<Lock size={18} color={colors.subtle} />}
            error={fieldErrors.confirmPassword?.[0]}
          />

          {/* Register Button */}
          <Button
            title={t.auth.register}
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          {/* Login Link */}
          <View style={styles.switchAuthRow}>
            <Text style={[styles.switchAuthText, { color: colors.subtle }]}>
              {t.auth.hasAccount}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchAuthLink, { color: colors.primary }]}>
                {t.auth.signInHere}
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
