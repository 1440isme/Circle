import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
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
  Info,
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
  const { colors, theme, resolvedTheme, setTheme, uiStyle, setUiStyle } = useThemeStore();
  const { locale, setLocale, t } = useLanguageStore();
  const { user, logout } = useAuthStore();

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

  const edgePan = useEdgeSwipeDismiss({
    onDismiss: () => {
      if (currentView !== 'root') {
        setCurrentView('root');
      } else {
        onClose();
      }
    },
  });

  const { data: sessions = [], isLoading, isRefetching, refetch } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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

  const handleRevokeSingle = (sessionId: string) => {
    Alert.alert(
      t.auth.revokeSession,
      t.auth.revokeSessionConfirm || 'Bạn có chắc chắn muốn đăng xuất thiết bị này không?',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.revokeSession,
          style: 'destructive',
          onPress: async () => {
            setRevokingId(sessionId);
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
          },
        },
      ],
    );
  };

  const handleRevokeAllOther = () => {
    Alert.alert(
      t.auth.revokeAllOtherSessions,
      t.auth.revokeAllOtherSessionsConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.revokeAllOtherSessions,
          style: 'destructive',
          onPress: async () => {
            setErrorNotice(null);
            try {
              await revokeOtherSessionsMutation.mutateAsync();
              setSuccessNotice(t.auth.revokeAllOtherSuccess);
              setTimeout(() => setSuccessNotice(null), 3000);
            } catch (err: any) {
              setErrorNotice(err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t.auth.logout,
      t.auth.logoutConfirm || 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.logout,
          style: 'destructive',
          onPress: async () => {
            onClose();
            await logout();
          },
        },
      ],
    );
  };

  const getSubHeaderTitle = () => {
    switch (currentView) {
      case 'appearance':
        return locale === 'vi' ? 'Giao diện' : 'Appearance';
      case 'sessions':
        return locale === 'vi' ? 'Phiên đăng nhập' : 'Sessions';
      case 'language':
        return locale === 'vi' ? 'Ngôn ngữ' : 'Language';
      case 'help':
        return locale === 'vi' ? 'Trợ giúp' : 'Help';
      default:
        return t.common.systemSettings || 'Cài đặt';
    }
  };

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
      <View style={styles.modalOverlay}>
        <View
          {...edgePan.panHandlers}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            {currentView !== 'root' ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCurrentView('root')}
                style={[styles.headerIconBtn, { backgroundColor: colors.wash }]}
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
              style={[styles.headerIconBtn, { backgroundColor: colors.wash }]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Notices */}
          {successNotice && (
            <View style={[styles.noticeBox, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` }]}>
              <CheckCircle2 size={16} color={colors.success} />
              <Text style={[styles.noticeText, { color: colors.success }]}>
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

          {/* ========================================================= */}
          {/* LEVEL 1: ROOT SETTINGS MENU (Matching Web Left Column)   */}
          {/* ========================================================= */}
          {currentView === 'root' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.rootMenuContent}
            >
              {/* Settings Menu Cards */}
              <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {/* 1. Giao diện */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentView('appearance')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
                >
                  <Palette size={20} color={colors.text} />
                  <View style={styles.menuRowInfo}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {locale === 'vi' ? 'Giao diện' : 'Appearance'}
                    </Text>
                    <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {uiStyle === 'flat' ? 'Flat Design' : 'Liquid Glass'} • {theme === 'dark' ? 'Tối' : theme === 'light' ? 'Sáng' : 'Hệ thống'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>

                {/* 2. Mật khẩu & Bảo mật */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentView('security')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
                >
                  <Key size={20} color={colors.text} />
                  <View style={styles.menuRowInfo}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {locale === 'vi' ? 'Mật khẩu & Bảo mật' : 'Password & Security'}
                    </Text>
                    <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {t.auth.changePassword}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>

                {/* 3. Phiên đăng nhập */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentView('sessions')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
                >
                  <Laptop size={20} color={colors.text} />
                  <View style={styles.menuRowInfo}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {locale === 'vi' ? 'Phiên đăng nhập' : 'Sessions'}
                    </Text>
                    <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {sessions.length > 0 ? `${sessions.length} thiết bị hoạt động` : 'Quản lý thiết bị'}
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

                {/* 3. Ngôn ngữ */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentView('language')}
                  style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
                >
                  <Globe size={20} color={colors.text} />
                  <View style={styles.menuRowInfo}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {locale === 'vi' ? 'Ngôn ngữ' : 'Language'}
                    </Text>
                    <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {locale === 'vi' ? 'Tiếng Việt' : 'English'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>

                {/* 4. Trợ giúp */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentView('help')}
                  style={styles.menuRowItem}
                >
                  <HelpCircle size={20} color={colors.text} />
                  <View style={styles.menuRowInfo}>
                    <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                      {locale === 'vi' ? 'Trợ giúp' : 'Help & Support'}
                    </Text>
                    <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                      {locale === 'vi' ? 'Thông tin ứng dụng & Hỗ trợ' : 'About CIRCLE & Support'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              {/* Log Out Button */}
              <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: `${colors.danger}40`, marginTop: 14 }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleLogout}
                  style={styles.menuRowItem}
                >
                  <View style={[styles.rowIconContainer, { backgroundColor: `${colors.danger}15` }]}>
                    <LogOut size={18} color={colors.danger} />
                  </View>
                  <View style={styles.menuRowInfo}>
                    <Text style={[styles.menuRowTitle, { color: colors.danger, fontWeight: '700' }]}>
                      {t.auth.logout || 'Đăng xuất'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ========================================================= */}
          {/* LEVEL 2: SUBVIEWS (GIAO DIỆN, SESSIONS, NGÔN NGỮ, HELP)   */}
          {/* ========================================================= */}
          {currentView !== 'root' && (
            <SystemSettingsSubViewContent subView={currentView} />
          )}
        </View>
      </View>
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

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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

  const handleRevokeSingle = (sessionId: string) => {
    Alert.alert(
      t.auth.revokeSession,
      t.auth.revokeSessionConfirm || 'Bạn có chắc chắn muốn đăng xuất thiết bị này không?',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.revokeSession,
          style: 'destructive',
          onPress: async () => {
            setRevokingId(sessionId);
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
          },
        },
      ],
    );
  };

  const handleRevokeAllOther = () => {
    Alert.alert(
      t.auth.revokeAllOtherSessions,
      t.auth.revokeAllOtherSessionsConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.revokeAllOtherSessions,
          style: 'destructive',
          onPress: async () => {
            setErrorNotice(null);
            try {
              await revokeOtherSessionsMutation.mutateAsync();
              setSuccessNotice(t.auth.revokeAllOtherSuccess);
              setTimeout(() => setSuccessNotice(null), 3000);
            } catch (err: any) {
              setErrorNotice(err?.message || t.common.unknownError);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Notices */}
      {successNotice && (
        <View style={[styles.noticeBox, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` }]}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={[styles.noticeText, { color: colors.success }]}>
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

      {/* ========================================================= */}
      {/* LEVEL 2: SUBVIEW - GIAO DIỆN (APPEARANCE)                */}
      {/* ========================================================= */}
      {subView === 'appearance' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.subViewContent}
        >
          {/* Phong cách thiết kế */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              PHONG CÁCH THIẾT KẾ
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {/* Flat Design */}
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
                    Flat Design
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Mặc định • Phẳng tối giản, viền mảnh tinh tế
                  </Text>
                </View>
                {uiStyle === 'flat' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>

              {/* Liquid Glass */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setUiStyle('glass')}
                style={styles.optionRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Liquid Glass
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Kính mờ Apple HIG, chiều sâu đa tầng
                  </Text>
                </View>
                {uiStyle === 'glass' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Chế độ hiển thị */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              CHẾ ĐỘ HIỂN THỊ
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {/* Sáng */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTheme('light')}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Sun size={18} color={colors.text} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.themeLight || 'Giao diện sáng'}
                  </Text>
                </View>
                {theme === 'light' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>

              {/* Tối */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTheme('dark')}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <Moon size={18} color={colors.text} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.themeDark || 'Giao diện tối'}
                  </Text>
                </View>
                {theme === 'dark' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>

              {/* Theo hệ thống */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTheme('system')}
                style={styles.optionRow}
              >
                <Laptop size={18} color={colors.text} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.common.themeSystem || 'Theo hệ thống'}
                  </Text>
                </View>
                {theme === 'system' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: SUBVIEW - MẬT KHẨU & BẢO MẬT (SECURITY)        */}
      {/* ========================================================= */}
      {subView === 'security' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.subViewContent}
        >
          {/* Security Advisory Card */}
          <View
            style={[
              styles.securityNoticeCard,
              {
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.25)',
              },
            ]}
          >
            <Shield size={20} color="#f59e0b" style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.securityNoticeTitle, { color: '#b45309' }]}>
                {t.auth.changePasswordTitle}
              </Text>
              <Text style={[styles.securityNoticeDesc, { color: '#b45309' }]}>
                {t.auth.securityPasswordNotice}
              </Text>
            </View>
          </View>

          {passwordSuccessNotice && (
            <View style={[styles.noticeBanner, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
              <CheckCircle2 size={16} color="#10b981" />
              <Text style={{ fontSize: 13, color: '#059669', flex: 1, fontWeight: '500' }}>
                {passwordSuccessNotice}
              </Text>
            </View>
          )}

          {passwordErrorNotice && (
            <View style={[styles.noticeBanner, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <AlertTriangle size={16} color="#ef4444" />
              <Text style={{ fontSize: 13, color: '#dc2626', flex: 1, fontWeight: '500' }}>
                {passwordErrorNotice}
              </Text>
            </View>
          )}

          <View style={[styles.sectionBlock, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showNewPassword ? (
                    <EyeOff size={18} color={colors.subtle} />
                  ) : (
                    <Eye size={18} color={colors.subtle} />
                  )}
                </TouchableOpacity>
              </View>

              {/* ACC-05 Real-time requirement chips */}
              {newPassword.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <View style={[styles.reqChip, { backgroundColor: passwordReqs.minLength ? 'rgba(16,185,129,0.12)' : colors.wash }]}>
                    <Check size={12} color={passwordReqs.minLength ? '#10b981' : colors.subtle} />
                    <Text style={{ fontSize: 11, color: passwordReqs.minLength ? '#059669' : colors.subtle }}>
                      {t.auth.min8Chars}
                    </Text>
                  </View>
                  <View style={[styles.reqChip, { backgroundColor: passwordReqs.hasUpper ? 'rgba(16,185,129,0.12)' : colors.wash }]}>
                    <Check size={12} color={passwordReqs.hasUpper ? '#10b981' : colors.subtle} />
                    <Text style={{ fontSize: 11, color: passwordReqs.hasUpper ? '#059669' : colors.subtle }}>
                      {t.validation.passwordUppercase}
                    </Text>
                  </View>
                  <View style={[styles.reqChip, { backgroundColor: passwordReqs.hasLower ? 'rgba(16,185,129,0.12)' : colors.wash }]}>
                    <Check size={12} color={passwordReqs.hasLower ? '#10b981' : colors.subtle} />
                    <Text style={{ fontSize: 11, color: passwordReqs.hasLower ? '#059669' : colors.subtle }}>
                      {t.validation.passwordLowercase}
                    </Text>
                  </View>
                  <View style={[styles.reqChip, { backgroundColor: passwordReqs.hasNumber ? 'rgba(16,185,129,0.12)' : colors.wash }]}>
                    <Check size={12} color={passwordReqs.hasNumber ? '#10b981' : colors.subtle} />
                    <Text style={{ fontSize: 11, color: passwordReqs.hasNumber ? '#059669' : colors.subtle }}>
                      {t.validation.passwordNumber}
                    </Text>
                  </View>
                  <View style={[styles.reqChip, { backgroundColor: passwordReqs.hasSpecial ? 'rgba(16,185,129,0.12)' : colors.wash }]}>
                    <Check size={12} color={passwordReqs.hasSpecial ? '#10b981' : colors.subtle} />
                    <Text style={{ fontSize: 11, color: passwordReqs.hasSpecial ? '#059669' : colors.subtle }}>
                      {t.validation.passwordSpecialChar}
                    </Text>
                  </View>
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={colors.subtle} />
                  ) : (
                    <Eye size={18} color={colors.subtle} />
                  )}
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && (
                <Text style={{ fontSize: 11, marginTop: 6, color: newPassword === confirmPassword ? '#10b981' : '#ef4444' }}>
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
                backgroundColor: colors.primary,
                opacity: !isPasswordFormValid || changePasswordMutation.isPending ? 0.5 : 1,
              },
            ]}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Lock size={18} color={colors.onPrimary} />
            )}
            <Text style={[styles.actionSubmitBtnText, { color: colors.onPrimary }]}>
              {changePasswordMutation.isPending ? t.auth.updatingPassword : t.auth.updatePasswordButton}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: SUBVIEW - PHIÊN ĐĂNG NHẬP (SESSIONS)           */}
      {/* ========================================================= */}
      {subView === 'sessions' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.subViewContent}
        >
          <View style={styles.sessionsHeaderRow}>
            <Text style={[styles.sessionsSubtitle, { color: colors.subtle }]}>
              {t.auth.sessionsSubtitle || 'Quản lý các thiết bị đang đăng nhập tài khoản của bạn'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => refetch()}
              disabled={isRefetching}
              style={styles.refreshRow}
            >
              <RefreshCw size={13} color={colors.subtle} />
              <Text style={[styles.refreshText, { color: colors.subtle }]}>
                {isRefetching ? t.common.loading : 'Làm mới'}
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
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

                return (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionRow,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.sessionLeft}>
                      {getDeviceIcon(session.deviceType)}
                      <View style={styles.sessionInfo}>
                        <View style={styles.sessionTitleRow}>
                          <Text
                            numberOfLines={1}
                            style={[styles.deviceName, { color: colors.text }]}
                          >
                            {session.browser || session.deviceType || 'Device'} • {session.os || ''}
                          </Text>
                          {isCurrent && (
                            <View style={[styles.currentBadge, { backgroundColor: `${colors.primary}20` }]}>
                              <Text style={[styles.currentBadgeText, { color: colors.primary }]}>
                                {t.auth.currentSession}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.sessionMeta, { color: colors.subtle }]}>
                          {formatSessionTime((session as any).lastActiveAt || session.createdAt)} • {session.ipAddress || 'Unknown IP'}
                        </Text>
                      </View>
                    </View>

                    {!isCurrent && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRevokeSingle(session.id)}
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
                );
              })}
            </View>
          )}

          {/* Revoke All Other Sessions */}
          {otherSessions.length > 0 && (
            <View style={styles.revokeAllBox}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRevokeAllOther}
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
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: SUBVIEW - NGÔN NGỮ (LANGUAGE)                   */}
      {/* ========================================================= */}
      {subView === 'language' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.subViewContent}
        >
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              NGÔN NGỮ HỆ THỐNG
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {/* Tiếng Việt */}
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
                    Tiếng Việt
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Việt Nam
                  </Text>
                </View>
                {locale === 'vi' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>

              {/* English */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLocale('en')}
                style={styles.optionRow}
              >
                <Text style={styles.flagEmoji}>🇬🇧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    English
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    United States
                  </Text>
                </View>
                {locale === 'en' && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: SUBVIEW - TRỢ GIÚP (HELP & ABOUT)               */}
      {/* ========================================================= */}
      {subView === 'help' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.subViewContent}
        >
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              VỀ ỨNG DỤNG CIRCLE
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline, padding: 16, gap: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.aboutLogoBox, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.aboutLogoText, { color: colors.onPrimary }]}>C</Text>
                </View>
                <View>
                  <Text style={[styles.optionTitle, { color: colors.text, fontSize: 16, fontWeight: '700' }]}>
                    CIRCLE Platform
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Phiên bản 1.0.0 • Flat & Glass
                  </Text>
                </View>
              </View>
              <Text style={[styles.aboutBodyText, { color: colors.subtle }]}>
                Nền tảng kết nối nhóm và tương tác thời gian thực với công nghệ WebRTC, Socket.IO, NestJS và kiến trúc bảo mật kép Dual-Token.
              </Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
              BẢO MẬT & ĐIỀU KHOẢN
            </Text>
            <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <View style={[styles.optionRow, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Shield size={16} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Bảo mật Dual-Token JWT
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Quản lý phiên với Redis Whitelist
                  </Text>
                </View>
              </View>
              <View style={styles.optionRow}>
                <Sparkles size={16} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Tối ưu hóa đa nền tảng
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Đồng bộ dữ liệu thời gian thực
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
});
