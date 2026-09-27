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
import { Mail, ArrowLeft, KeyRound } from 'lucide-react-native';
import { forgotPasswordSchema } from '@circle/shared';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { mobileApiRequest } from '../../src/services/api';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const t = useLanguageStore((s) => s.t);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string[] }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setApiError(null);
    setFieldErrors({});

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await mobileApiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(validation.data),
        skipAuth: true,
      });

      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: validation.data.email },
      });
    } catch (err: any) {
      setApiError(err?.message || t.auth.failedToSendResetOtp);
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
            <KeyRound size={28} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t.auth.forgotPasswordTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            {t.auth.forgotPasswordSubtitle}
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

          {/* Send Button */}
          <Button
            title={t.auth.sendResetOtp}
            onPress={handleSendOtp}
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
