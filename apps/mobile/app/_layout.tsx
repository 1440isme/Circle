import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shield, Lock, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../src/stores/auth.store';
import { useThemeStore } from '../src/stores/theme.store';
import { useLanguageStore } from '../src/stores/language.store';
import {
  isBiometricUnlockEnabled,
  authenticateWithBiometrics,
} from '../src/services/biometric.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, initAuth, logout } = useAuthStore();
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);

  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [hasCheckedBiometrics, setHasCheckedBiometrics] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Check biometric unlock state upon authentication
  useEffect(() => {
    if (isLoading) return;

    async function evaluateBiometrics() {
      if (isAuthenticated && !hasCheckedBiometrics && Platform.OS !== 'web') {
        const enabled = await isBiometricUnlockEnabled();
        if (enabled) {
          setIsBiometricLocked(true);
          const success = await authenticateWithBiometrics(t.auth.biometricPrompt);
          if (success) {
            setIsBiometricLocked(false);
          }
        }
        setHasCheckedBiometrics(true);
      }
    }

    evaluateBiometrics();
  }, [isAuthenticated, isLoading, hasCheckedBiometrics, t.auth.biometricPrompt]);

  useEffect(() => {
    if (isLoading || isBiometricLocked) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if user is not authenticated and not in auth screens
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main tabs if authenticated and currently in auth screens
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isBiometricLocked, segments, router]);

  const handleRetryBiometrics = async () => {
    const success = await authenticateWithBiometrics(t.auth.biometricPrompt);
    if (success) {
      setIsBiometricLocked(false);
    }
  };

  const handleLogoutFromLock = async () => {
    await logout();
    setIsBiometricLocked(false);
    setHasCheckedBiometrics(false);
    router.replace('/(auth)/login');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.canvas }]}>
        <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoBadgeText, { color: colors.onPrimary }]}>C</Text>
        </View>
        <View style={styles.loadingInfo}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtle }]}>
            {t.home.connectingCircle}
          </Text>
        </View>
      </View>
    );
  }

  // Biometric Unlock Screen
  if (isBiometricLocked) {
    return (
      <View style={[styles.lockContainer, { backgroundColor: colors.canvas }]}>
        <View style={[styles.lockCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          <View style={[styles.lockIconWrap, { backgroundColor: `${colors.primary}20` }]}>
            <Lock size={32} color={colors.primary} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.text }]}>
            {t.auth.biometricTitle}
          </Text>
          <Text style={[styles.lockDesc, { color: colors.subtle }]}>
            {t.auth.biometricPrompt}
          </Text>

          <TouchableOpacity
            onPress={handleRetryBiometrics}
            style={[styles.unlockBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Shield size={18} color={colors.onPrimary} />
            <Text style={[styles.unlockBtnText, { color: colors.onPrimary }]}>
              {t.auth.biometricTitle}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogoutFromLock}
            style={[styles.lockLogoutBtn, { borderColor: colors.hairline }]}
            activeOpacity={0.7}
          >
            <LogOut size={16} color={colors.coral} />
            <Text style={[styles.lockLogoutText, { color: colors.coral }]}>
              {t.auth.logout}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoBadgeText: {
    fontSize: 28,
    fontWeight: '800',
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  lockIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  unlockBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  lockLogoutBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockLogoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
