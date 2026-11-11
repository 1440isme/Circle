import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shield, Lock, LogOut, Phone, PhoneOff, Video } from 'lucide-react-native';
import { CallType } from '@circle/types';
import { useAuthStore } from '../src/stores/auth.store';
import { useThemeStore } from '../src/stores/theme.store';
import { useLanguageStore } from '../src/stores/language.store';
import { useCircleStore } from '../src/stores/circle.store';
import { getGlassTheme } from '../src/constants/glass-theme';
import { getMobileSocket } from '../src/services/socket';
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

interface GlobalIncomingCallPayload {
  callSessionId: string;
  circleId: string;
  circleName?: string;
  callType: CallType;
  caller?: {
    userId: string;
    displayName?: string;
    avatarUrl?: string | null;
  };
}

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isLoading, initAuth, logout } = useAuthStore();
  const { colors, resolvedTheme, uiStyle, initTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const activeCircleId = useCircleStore((s) => s.activeCircleId);
  const setActiveCircleId = useCircleStore((s) => s.setActiveCircleId);

  const isDark = resolvedTheme === 'dark';
  const glassTheme = getGlassTheme(isDark, uiStyle);

  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [hasCheckedBiometrics, setHasCheckedBiometrics] = useState(false);
  const [globalIncomingCall, setGlobalIncomingCall] =
    useState<GlobalIncomingCallPayload | null>(null);

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  // Global incoming call listener so users receive call alerts from any tab
  useEffect(() => {
    if (!isAuthenticated || isLoading || isBiometricLocked || !user?.id) {
      setGlobalIncomingCall(null);
      return;
    }

    let isCancelled = false;
    let activeSocket: Awaited<ReturnType<typeof getMobileSocket>> = null;

    const handleIncomingCall = (payload: GlobalIncomingCallPayload) => {
      if (!payload?.circleId || payload.caller?.userId === user.id) return;
      const inCurrentCircle =
        segments[0] === 'circle' && useCircleStore.getState().activeCircleId === payload.circleId;
      if (!inCurrentCircle) {
        setGlobalIncomingCall(payload);
      }
    };

    const handleCallEnded = (payload: { callSessionId?: string; circleId?: string }) => {
      setGlobalIncomingCall((prev) => {
        if (!prev) return null;
        if (
          payload?.callSessionId === prev.callSessionId ||
          payload?.circleId === prev.circleId
        ) {
          return null;
        }
        return prev;
      });
    };

    getMobileSocket().then((socket) => {
      if (!socket || isCancelled) return;
      activeSocket = socket;
      socket.on('call:incoming', handleIncomingCall);
      socket.on('call:ended', handleCallEnded);
    });

    return () => {
      isCancelled = true;
      if (activeSocket) {
        activeSocket.off('call:incoming', handleIncomingCall);
        activeSocket.off('call:ended', handleCallEnded);
      }
    };
  }, [isAuthenticated, isLoading, isBiometricLocked, user?.id, segments]);

  // Clear global call banner if user navigated into that circle workspace
  useEffect(() => {
    if (
      globalIncomingCall &&
      segments[0] === 'circle' &&
      activeCircleId === globalIncomingCall.circleId
    ) {
      setGlobalIncomingCall(null);
    }
  }, [segments, activeCircleId, globalIncomingCall]);

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
    const isRoot = !segments[0] || (segments[0] as string) === 'index';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if user is not authenticated and not in auth screens
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuthGroup || isRoot)) {
      // Redirect to main tabs if authenticated and currently in auth screens or at root
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
          <ActivityIndicator size="small" color={colors.sage} />
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
            <Lock size={32} color={colors.sage} />
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

  const handleAcceptGlobalCall = () => {
    if (!globalIncomingCall) return;
    const targetCircleId = globalIncomingCall.circleId;
    setGlobalIncomingCall(null);
    setActiveCircleId(targetCircleId);
    router.push({
      pathname: '/circle/[id]' as any,
      params: { id: targetCircleId, openCall: '1' },
    });
  };

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="circle/[id]" />
      </Stack>

      {globalIncomingCall ? (
        <View
          style={[
            styles.globalCallBannerWrap,
            { top: insets.top + 8 },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.globalCallBanner,
              {
                backgroundColor:
                  uiStyle === 'glass' ? glassTheme.colors.glassBgSheet : colors.surface,
                borderColor:
                  uiStyle === 'glass' ? glassTheme.colors.glassBorder : colors.hairline,
              },
            ]}
          >
            {uiStyle === 'glass' ? (
              <BlurView
                intensity={glassTheme.blur.intensity}
                tint={glassTheme.blur.tint}
                style={StyleSheet.absoluteFill}
              />
            ) : null}

            <View style={styles.globalCallContent}>
              <View style={[styles.globalCallIconCircle, { backgroundColor: colors.primary }]}>
                {globalIncomingCall.callType === CallType.VIDEO ? (
                  <Video size={18} color={colors.onPrimary} />
                ) : (
                  <Phone size={18} color={colors.onPrimary} />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.globalCallTitle, { color: colors.text }]} numberOfLines={1}>
                  {globalIncomingCall.callType === CallType.VIDEO
                    ? t.calls.incomingVideoCall
                    : t.calls.incomingAudioCall}
                </Text>
                <Text style={[styles.globalCallSub, { color: colors.subtle }]} numberOfLines={1}>
                  {globalIncomingCall.caller?.displayName || t.calls.circleMemberDefault} ·{' '}
                  {globalIncomingCall.circleName || t.calls.defaultCircleName}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setGlobalIncomingCall(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.globalCallActionBtn, { backgroundColor: `${colors.coral}20` }]}
                accessibilityLabel={t.calls.ignoreCall}
              >
                <PhoneOff size={16} color={colors.coral} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAcceptGlobalCall}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.globalCallJoinBtn, { backgroundColor: colors.primary }]}
                accessibilityLabel={t.calls.joinCallAction}
              >
                <Phone size={14} color={colors.onPrimary} />
                <Text style={[styles.globalCallJoinText, { color: colors.onPrimary }]}>
                  {t.calls.joinCallAction}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
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
  globalCallBannerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  globalCallBanner: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  globalCallContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  globalCallIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalCallTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  globalCallSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  globalCallActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalCallJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
  },
  globalCallJoinText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
