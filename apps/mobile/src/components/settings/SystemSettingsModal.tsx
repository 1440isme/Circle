import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ArrowLeft,
  ChevronRight,
  Palette,
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  Globe,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Key,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { SessionEntity } from '@circle/types';
import { checkPasswordRequirements } from '@circle/shared';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { getGlassTheme } from '../../constants/glass-theme';
import {
  useSessionsQuery,
  useRevokeSessionMutation,
  useRevokeOtherSessionsMutation,
  useChangePasswordMutation,
} from '../../hooks/use-session-queries';
import { useEdgeSwipeDismiss } from '../../hooks/use-edge-swipe';

export type SystemSettingsSubView = 'root' | 'appearance' | 'security' | 'sessions' | 'language' | 'help';

interface SystemSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  defaultTab?: 'general' | 'appearance' | 'security' | 'sessions' | 'language' | 'help';
}

export function SystemSettingsModal({
  visible,
  onClose,
  defaultTab = 'appearance',
}: SystemSettingsModalProps) {
  const { colors, theme, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const insets = useSafeAreaInsets();
  const { locale, t } = useLanguageStore();
  const { logout } = useAuthStore();

  const initialView: SystemSettingsSubView =
    defaultTab === 'security'
      ? 'security'
      : defaultTab === 'sessions'
      ? 'sessions'
      : defaultTab === 'language'
      ? 'language'
      : defaultTab === 'help'
      ? 'help'
      : 'root';

  const [currentView, setCurrentView] = useState<SystemSettingsSubView>(initialView);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const edgePan = useEdgeSwipeDismiss({
    onDismiss: () => {
      if (currentView !== 'root') {
        setCurrentView('root');
      } else {
        onClose();
      }
    },
  });

  const { data: sessions = [] } = useSessionsQuery();

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      setConfirmingLogout(false);
      onClose();
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const getSubHeaderTitle = () => {
    switch (currentView) {
      case 'appearance':
        return t.nav.appearance;
      case 'security':
        return t.nav.security;
      case 'sessions':
        return t.nav.sessions;
      case 'language':
        return t.common.language;
      case 'help':
        return t.common.help;
      default:
        return t.common.systemSettings;
    }
  };

  const modalSheetContent = (
    <>
      {/* Header Bar */}
      <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
        {currentView !== 'root' ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCurrentView('root')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.headerIconBtn, { backgroundColor: colors.wash }]}
            accessibilityLabel={t.common.back}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {getSubHeaderTitle()}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.headerIconBtn, { backgroundColor: colors.wash }]}
          accessibilityLabel={t.common.close}
        >
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* LEVEL 1: ROOT SETTINGS MENU */}
      {currentView === 'root' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.rootMenuContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            {/* 1. Appearance */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentView('appearance')}
              style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Palette size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.nav.appearance}
                </Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                  {uiStyle === 'flat' ? t.nav.flatDesignDefault : t.nav.liquidGlass} •{' '}
                  {theme === 'dark' ? t.common.themeDark : theme === 'light' ? t.common.themeLight : t.common.themeSystem}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>

            {/* 2. Password & Security */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentView('security')}
              style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Key size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.nav.security}
                </Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                  {t.auth.changePassword}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>

            {/* 3. Sessions */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentView('sessions')}
              style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Laptop size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.nav.sessions}
                </Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                  {sessions.length > 0
                    ? t.auth.activeDevicesCount.replace('{count}', String(sessions.length))
                    : t.auth.deviceManagement}
                </Text>
              </View>
              {sessions.length > 0 && (
                <View style={[styles.badgePill, { backgroundColor: colors.wash, marginRight: 6 }]}>
                  <Text style={[styles.badgePillText, { color: colors.text }]}>
                    {sessions.length}
                  </Text>
                </View>
              )}
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>

            {/* 4. Language */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentView('language')}
              style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Globe size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.common.language}
                </Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                  {locale === 'vi' ? t.common.vietnamese : t.common.english}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>

            {/* 5. Help */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setCurrentView('help')}
              style={styles.menuRowItem}
            >
              <HelpCircle size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.nav.helpSupport}
                </Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                  {t.nav.aboutAndSupport}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Log Out Inline Confirm Card (Bare Icon Invariant + Zero Alert) */}
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: `${colors.danger}40`, marginTop: 14 }]}>
            {!confirmingLogout ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setConfirmingLogout(true)}
                style={styles.menuRowItem}
              >
                <LogOut size={18} color={colors.danger} />
                <View style={styles.menuRowInfo}>
                  <Text style={[styles.menuRowTitle, { color: colors.danger, fontWeight: '700' }]}>
                    {t.auth.logout}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.danger} />
              </TouchableOpacity>
            ) : (
              <View style={styles.inlineConfirmCard}>
                <Text style={[styles.inlineConfirmMsg, { color: colors.text }]}>
                  {t.auth.logoutConfirm}
                </Text>
                <View style={styles.inlineConfirmBtns}>
                  <TouchableOpacity
                    onPress={() => setConfirmingLogout(false)}
                    disabled={loggingOut}
                    style={[styles.inlineCancelBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                  >
                    <Text style={[styles.inlineCancelText, { color: colors.text }]}>
                      {t.common.cancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmLogout}
                    disabled={loggingOut}
                    style={[styles.inlineDangerBtn, { backgroundColor: '#DC2626' }]}
                  >
                    {loggingOut ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.inlineDangerText}>{t.auth.logout}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* LEVEL 2: SUBVIEWS */}
      {currentView !== 'root' && (
        <SystemSettingsSubViewContent subView={currentView} />
      )}
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {
        if (currentView !== 'root') {
          setCurrentView('root');
        } else {
          onClose();
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {uiStyle === 'glass' ? (
          <BlurView
            intensity={glassTheme.blur.intensity}
            tint={glassTheme.blur.tint}
            {...edgePan.panHandlers}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: glassTheme.colors.glassBorder,
              },
            ]}
          >
            {modalSheetContent}
          </BlurView>
        ) : (
          <View
            {...edgePan.panHandlers}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: colors.hairline,
              },
            ]}
          >
            {modalSheetContent}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SystemSettingsSubViewContent({
  subView,
}: {
  subView: 'appearance' | 'security' | 'sessions' | 'language' | 'help';
}) {
  const { colors, theme, setTheme, uiStyle, setUiStyle } = useThemeStore();
  const { locale, setLocale, t } = useLanguageStore();
  const insets = useSafeAreaInsets();

  const { data: sessions = [], isLoading, isRefetching, refetch } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();

  // Password & Security state
  const changePasswordMutation = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccessNotice, setPasswordSuccessNotice] = useState<string | null>(null);
  const [passwordErrorNotice, setPasswordErrorNotice] = useState<string | null>(null);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const passwordReqs = checkPasswordRequirements(newPassword);
  const isPasswordFormValid =
    currentPassword.trim().length > 0 &&
    passwordReqs.isValid &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword;

  const handleChangePassword = async () => {
    setPasswordErrorNotice(null);
    setPasswordSuccessNotice(null);

    if (!currentPassword) {
      setPasswordErrorNotice(t.validation.currentPasswordRequired);
      return;
    }
    if (!passwordReqs.isValid) {
      setPasswordErrorNotice(t.validation.passwordComplexity);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorNotice(t.validation.passwordMismatch);
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordErrorNotice(t.validation.newPasswordSameAsCurrent);
      return;
    }

    try {
      const res = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccessNotice(res.message || t.auth.changePasswordSuccess);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t.auth.currentPasswordIncorrect;
      setPasswordErrorNotice(msg);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const getDeviceIcon = (deviceType: SessionEntity['deviceType']) => {
    switch (deviceType) {
      case 'DESKTOP':
        return <Laptop size={18} color={colors.text} />;
      case 'MOBILE':
        return <Smartphone size={18} color={colors.text} />;
      case 'TABLET':
        return <Tablet size={18} color={colors.text} />;
      default:
        return <Shield size={18} color={colors.text} />;
    }
  };

  const formatSessionTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const executeRevokeSingle = async (sessionId: string) => {
    setRevokingId(sessionId);
    setConfirmRevokeId(null);
    setErrorNotice(null);
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      setSuccessNotice(t.auth.revokeSessionSuccess);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err?.message || t.auth.sessionNotFound);
    } finally {
      setRevokingId(null);
    }
  };

  const executeRevokeAllOther = async () => {
    setConfirmRevokeAll(false);
    setErrorNotice(null);
    try {
      await revokeOtherSessionsMutation.mutateAsync();
      setSuccessNotice(t.auth.revokeAllOtherSuccess);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err?.message || t.common.unknownError);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Notices */}
      {successNotice && (
        <View style={[styles.noticeBox, { backgroundColor: `${colors.sage}18`, borderColor: `${colors.sage}40` }]}>
          <CheckCircle2 size={16} color={colors.sage} />
          <Text style={[styles.noticeText, { color: colors.sage }]}>
            {successNotice}
          </Text>
        </View>
      )}
      {errorNotice && (
        <View style={[styles.noticeBox, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` }]}>
          <AlertTriangle size={16} color={colors.danger} />
          <Text style={[styles.noticeText, { color: colors.danger }]}>
            {errorNotice}
          </Text>
        </View>
      )}

      {/* SUBVIEW - APPEARANCE */}
      {subView === 'appearance' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.subViewContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              {t.nav.designStyle}
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUiStyle('flat')}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.nav.flatDesignDefault}
                  </Text>
                </View>
                {uiStyle === 'flat' && <Check size={18} color={colors.sage} />}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUiStyle('glass')}
                style={styles.optionRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.nav.liquidGlass}
                  </Text>
                </View>
                {uiStyle === 'glass' && <Check size={18} color={colors.sage} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              {t.nav.displayMode}
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTheme('light')}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Sun size={18} color={colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.themeLight}
                  </Text>
                </View>
                {theme === 'light' && <Check size={18} color={colors.sage} />}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTheme('dark')}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Moon size={18} color={colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.themeDark}
                  </Text>
                </View>
                {theme === 'dark' && <Check size={18} color={colors.sage} />}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTheme('system')}
                style={styles.optionRow}
              >
                <Laptop size={18} color={colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.themeSystem}
                  </Text>
                </View>
                {theme === 'system' && <Check size={18} color={colors.sage} />}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* SUBVIEW - SECURITY */}
      {subView === 'security' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.subViewContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          {passwordSuccessNotice && (
            <View style={[styles.noticeBanner, { backgroundColor: `${colors.sage}18`, borderColor: `${colors.sage}40` }]}>
              <CheckCircle2 size={16} color={colors.sage} />
              <Text style={{ fontSize: 13, color: colors.sage, flex: 1, fontWeight: '600' }}>
                {passwordSuccessNotice}
              </Text>
            </View>
          )}

          {passwordErrorNotice && (
            <View style={[styles.noticeBanner, { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` }]}>
              <AlertTriangle size={16} color={colors.danger} />
              <Text style={{ fontSize: 13, color: colors.danger, flex: 1, fontWeight: '600' }}>
                {passwordErrorNotice}
              </Text>
            </View>
          )}

          <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            {/* Current Password Field */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t.auth.currentPassword}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.subtle}
                  style={[styles.textInputField, { color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} color={colors.subtle} />
                  ) : (
                    <Eye size={18} color={colors.subtle} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline }} />

            {/* New Password Field */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t.auth.newPassword}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.subtle}
                  style={[styles.textInputField, { color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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

              {newPassword.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {[
                    { ok: passwordReqs.minLength, label: t.auth.min8Chars },
                    { ok: passwordReqs.hasUpper, label: t.validation.passwordUppercase },
                    { ok: passwordReqs.hasLower, label: t.validation.passwordLowercase },
                    { ok: passwordReqs.hasNumber, label: t.validation.passwordNumber },
                    { ok: passwordReqs.hasSpecial, label: t.validation.passwordSpecialChar },
                  ].map((req, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.reqChip,
                        { backgroundColor: req.ok ? `${colors.sage}18` : colors.wash },
                      ]}
                    >
                      <Check size={12} color={req.ok ? colors.sage : colors.subtle} />
                      <Text style={{ fontSize: 11, color: req.ok ? colors.sage : colors.subtle }}>
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline }} />

            {/* Confirm New Password Field */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t.auth.confirmNewPassword}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.subtle}
                  style={[styles.textInputField, { color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
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
              {confirmPassword.length > 0 && (
                <Text
                  style={{
                    fontSize: 11,
                    marginTop: 6,
                    color: newPassword === confirmPassword ? colors.sage : colors.danger,
                  }}
                >
                  {newPassword === confirmPassword ? t.auth.passwordMatch : t.auth.passwordMismatch}
                </Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!isPasswordFormValid || changePasswordMutation.isPending}
            onPress={handleChangePassword}
            style={[
              styles.actionSubmitBtn,
              {
                backgroundColor: isPasswordFormValid ? colors.primary : colors.border,
              },
            ]}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator size="small" color={isPasswordFormValid ? colors.onPrimary : colors.subtle} />
            ) : (
              <Lock size={18} color={isPasswordFormValid ? colors.onPrimary : colors.subtle} />
            )}
            <Text
              style={[
                styles.actionSubmitBtnText,
                { color: isPasswordFormValid ? colors.onPrimary : colors.subtle },
              ]}
            >
              {changePasswordMutation.isPending ? t.auth.updatingPassword : t.auth.updatePasswordButton}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SUBVIEW - SESSIONS */}
      {subView === 'sessions' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.subViewContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={styles.sessionsHeaderRow}>
            <Text style={[styles.sessionsSubtitle, { color: colors.subtle }]}>
              {t.auth.sessionsSubtitle}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => refetch()}
              disabled={isRefetching}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.refreshRow}
            >
              <RefreshCw size={13} color={colors.subtle} />
              <Text style={[styles.refreshText, { color: colors.subtle }]}>
                {isRefetching ? t.common.loading : t.common.refresh}
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.sage} />
              <Text style={[styles.loadingText, { color: colors.subtle }]}>
                {t.common.loading}
              </Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Shield size={28} color={colors.subtle} />
              <Text style={[styles.emptyText, { color: colors.subtle }]}>
                {t.auth.noOtherSessions}
              </Text>
            </View>
          ) : (
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {sessions.map((session, index) => {
                const isCurrent = Boolean(session.isCurrent);
                const isRevokingThis = revokingId === session.id;
                const isConfirmingThis = confirmRevokeId === session.id;

                return (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionRowWrap,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.sessionRow}>
                      <View style={styles.sessionLeft}>
                        {getDeviceIcon(session.deviceType)}
                        <View style={styles.sessionInfo}>
                          <View style={styles.sessionTitleRow}>
                            <Text
                              numberOfLines={1}
                              style={[styles.deviceName, { color: colors.text }]}
                            >
                              {session.browser || session.deviceType || t.auth.unknownDevice}
                              {session.os ? ` • ${session.os}` : ''}
                            </Text>
                            {isCurrent && (
                              <View style={[styles.currentBadge, { backgroundColor: `${colors.sage}20` }]}>
                                <Text style={[styles.currentBadgeText, { color: colors.sage }]}>
                                  {t.auth.currentSession}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.sessionMeta, { color: colors.subtle }]}>
                            {formatSessionTime((session as any).lastActiveAt || session.createdAt)}
                            {session.ipAddress ? ` • ${session.ipAddress}` : ''}
                          </Text>
                        </View>
                      </View>

                      {!isCurrent && !isConfirmingThis && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setConfirmRevokeId(session.id)}
                          disabled={isRevokingThis}
                          style={[
                            styles.revokeBtn,
                            {
                              borderColor: `${colors.danger}40`,
                              backgroundColor: `${colors.danger}10`,
                            },
                          ]}
                        >
                          {isRevokingThis ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                          ) : (
                            <Text style={[styles.revokeBtnText, { color: colors.danger }]}>
                              {t.auth.revokeSession}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {isConfirmingThis && (
                      <View style={[styles.inlineSessionConfirm, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
                        <Text style={[styles.inlineSessionConfirmText, { color: colors.text }]}>
                          {t.auth.revokeSessionConfirm}
                        </Text>
                        <View style={styles.inlineConfirmBtns}>
                          <TouchableOpacity
                            onPress={() => setConfirmRevokeId(null)}
                            style={[styles.inlineCancelBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                          >
                            <Text style={[styles.inlineCancelText, { color: colors.text }]}>
                              {t.common.cancel}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => executeRevokeSingle(session.id)}
                            style={[styles.inlineDangerBtn, { backgroundColor: '#DC2626' }]}
                          >
                            <Text style={styles.inlineDangerText}>{t.auth.revokeSession}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Revoke All Other Sessions */}
          {otherSessions.length > 0 && (
            <View style={styles.revokeAllBox}>
              {!confirmRevokeAll ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setConfirmRevokeAll(true)}
                  disabled={revokeOtherSessionsMutation.isPending}
                  style={[
                    styles.revokeAllBtn,
                    {
                      backgroundColor: `${colors.danger}15`,
                      borderColor: `${colors.danger}30`,
                    },
                  ]}
                >
                  <LogOut size={16} color={colors.danger} />
                  <Text style={[styles.revokeAllBtnText, { color: colors.danger }]}>
                    {t.auth.revokeAllOtherSessions} ({otherSessions.length})
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.inlineConfirmCard, { backgroundColor: colors.surface, borderColor: `${colors.danger}40`, borderWidth: 1, borderRadius: 14 }]}>
                  <Text style={[styles.inlineConfirmMsg, { color: colors.text }]}>
                    {t.auth.revokeAllOtherSessionsConfirm}
                  </Text>
                  <View style={styles.inlineConfirmBtns}>
                    <TouchableOpacity
                      onPress={() => setConfirmRevokeAll(false)}
                      style={[styles.inlineCancelBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                    >
                      <Text style={[styles.inlineCancelText, { color: colors.text }]}>
                        {t.common.cancel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={executeRevokeAllOther}
                      disabled={revokeOtherSessionsMutation.isPending}
                      style={[styles.inlineDangerBtn, { backgroundColor: '#DC2626' }]}
                    >
                      {revokeOtherSessionsMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.inlineDangerText}>{t.common.confirm}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* SUBVIEW - LANGUAGE */}
      {subView === 'language' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.subViewContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              {t.common.languageSection}
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLocale('vi')}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Text style={styles.flagEmoji}>🇻🇳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.vietnamese}
                  </Text>
                </View>
                {locale === 'vi' && <Check size={18} color={colors.sage} />}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLocale('en')}
                style={styles.optionRow}
              >
                <Text style={styles.flagEmoji}>🇬🇧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.english}
                  </Text>
                </View>
                {locale === 'en' && <Check size={18} color={colors.sage} />}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* SUBVIEW - HELP & ABOUT */}
      {subView === 'help' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.subViewContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              {t.nav.aboutAndSupport}
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline, padding: 16, gap: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.aboutLogoBox, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.aboutLogoText, { color: colors.onPrimary }]}>C</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text, fontSize: 16, fontWeight: '700' }]}>
                    {t.common.appName}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {t.auth.trustBadgeTitle}
                  </Text>
                </View>
              </View>
              <Text style={[styles.aboutBodyText, { color: colors.subtle }]}>
                {t.common.slogan}
              </Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              {t.auth.privacyPolicyTitle}
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <View style={[styles.optionRow, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Shield size={16} color={colors.sage} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.dualTokenSecurity}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {t.auth.privacyPolicyBullet1}
                  </Text>
                </View>
              </View>
              <View style={styles.optionRow}>
                <Sparkles size={16} color={colors.sage} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.auth.trustBadgeDesc}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {t.auth.privacyPolicyBullet3}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootMenuContent: {
    padding: 16,
    gap: 12,
  },
  subViewContent: {
    padding: 16,
    gap: 16,
  },
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowInfo: {
    flex: 1,
    gap: 2,
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuRowSubtitle: {
    fontSize: 11,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  flagEmoji: {
    fontSize: 18,
  },
  aboutLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogoText: {
    fontSize: 18,
    fontWeight: '800',
  },
  aboutBodyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  sessionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sessionsSubtitle: {
    fontSize: 12,
    flex: 1,
    paddingRight: 8,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sessionMeta: {
    fontSize: 11,
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  revokeAllBox: {
    paddingTop: 8,
  },
  revokeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  revokeAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  securityNoticeCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  securityNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityNoticeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  reqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  actionSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionRowWrap: {
    flexDirection: 'column',
  },
  inlineConfirmCard: {
    padding: 14,
    gap: 10,
  },
  inlineConfirmMsg: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inlineSessionConfirm: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  inlineSessionConfirmText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  inlineConfirmBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineCancelBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inlineCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inlineDangerBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inlineDangerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
