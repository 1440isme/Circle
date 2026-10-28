import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
  Image as RNImage,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  LogOut,
  Edit3,
  Camera,
  Laptop,
  Globe,
  Sliders,
  ChevronRight,
  Palette,
  HelpCircle,
  ArrowLeft,
  Key,
} from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { EditProfileModal } from '../../src/components/profile/EditProfileModal';
import { SystemSettingsSubViewContent } from '../../src/components/settings/SystemSettingsModal';
import { useSessionsQuery } from '../../src/hooks/use-session-queries';
import {
  checkBiometricStatus,
  isBiometricUnlockEnabled,
  setBiometricUnlockEnabled,
  authenticateWithBiometrics,
} from '../../src/services/biometric.service';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileTab() {
  const router = useRouter();
  const { colors, theme, resolvedTheme, setTheme, uiStyle } = useThemeStore();
  const { locale, setLocale, t } = useLanguageStore();
  const { user, logout } = useAuthStore();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const handle = user?.profile?.handle || user?.email?.split('@')[0];
  const avatarUrl = user?.profile?.avatarUrl;
  const bio = user?.profile?.bio;
  const dateOfBirth = user?.profile?.dateOfBirth;
  const initials = getInitials(displayName);
  const [modalMode, setModalMode] = useState<'edit' | 'avatar'>('edit');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [activeSettingsSubView, setActiveSettingsSubView] = useState<
    'appearance' | 'security' | 'sessions' | 'language' | 'help' | null
  >(null);
  const { data: sessions = [] } = useSessionsQuery();

  useEffect(() => {
    async function loadBiometrics() {
      const status = await checkBiometricStatus();
      setHasBiometrics(status.hasHardware);
      if (status.hasHardware) {
        const enabled = await isBiometricUnlockEnabled();
        setBiometricEnabled(enabled);
      }
    }
    loadBiometrics();
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      const success = await authenticateWithBiometrics(t.auth.biometricPrompt);
      if (success) {
        await setBiometricUnlockEnabled(true);
        setBiometricEnabled(true);
      } else {
        Alert.alert(t.auth.biometricTitle, t.auth.biometricFailed);
      }
    } else {
      await setBiometricUnlockEnabled(false);
      setBiometricEnabled(false);
    }
  };

  const handleOpenAvatar = () => {
    setModalMode('avatar');
    setIsEditModalVisible(true);
  };

  const handleOpenEdit = () => {
    setModalMode('edit');
    setIsEditModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      t.auth.logout,
      t.auth.logoutConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.logout,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const getSubHeaderTitle = (view: 'appearance' | 'security' | 'sessions' | 'language' | 'help') => {
    switch (view) {
      case 'appearance':
        return t.common.theme;
      case 'security':
        return t.auth.changePasswordTitle;
      case 'sessions':
        return t.common.sessionsTab;
      case 'language':
        return t.common.language;
      case 'help':
        return t.common.help;
    }
  };

  // If viewing a setting subview inline on the profile screen (NO POPUP MODAL)
  if (activeSettingsSubView !== null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveSettingsSubView(null)}
            style={[styles.headerBackBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 }]}>
            {getSubHeaderTitle(activeSettingsSubView)}
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <SystemSettingsSubViewContent subView={activeSettingsSubView} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.auth.profile}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          {/* Avatar with Edit Camera Overlay */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenAvatar}
            style={styles.avatarWrapper}
          >
            <View style={[styles.avatarBox, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {avatarUrl ? (
                <RNImage source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{initials}</Text>
              )}
            </View>
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Camera size={12} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.nameText, { color: colors.text }]}>
            {displayName}
          </Text>

          <View style={[styles.handleBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.handleText, { color: colors.primary }]}>
              @{handle}
            </Text>
          </View>

          {/* Bio Box */}
          <Text style={[styles.bioSubText, { color: colors.subtle }]}>
            {bio || t.auth.noBio}
          </Text>

          {/* Date of Birth Badge */}
          {dateOfBirth ? (
            <View style={[styles.dobBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.dobText, { color: colors.primary }]}>
                {t.auth.dateOfBirth}: {new Date(dateOfBirth).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          ) : null}

          {/* Edit Profile Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenEdit}
            style={[styles.editProfileBtn, { backgroundColor: colors.primary }]}
          >
            <Edit3 size={14} color={colors.onPrimary} />
            <Text style={[styles.editProfileBtnText, { color: colors.onPrimary }]}>
              {t.auth.editProfile}
            </Text>
          </TouchableOpacity>
        </View>

        {/* System Settings Section (Embedded directly on Profile page, single unified source) */}
        <View style={styles.settingsSectionWrapper}>
          <Text style={[styles.sectionGroupTitle, { color: colors.subtle }]}>
            {t.common.systemSettings || 'CÀI ĐẶT HỆ THỐNG'}
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            {/* 1. Giao diện */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveSettingsSubView('appearance')}
              style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Palette size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.common.theme}
                </Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                  {uiStyle === 'flat' ? 'Flat' : 'Glass'} • {theme === 'dark' ? t.common.themeDark : theme === 'light' ? t.common.themeLight : t.common.themeSystem}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>

            {/* 2. Đăng nhập vân tay / Face ID */}
            <View
              style={[
                styles.menuRowItem,
                {
                  borderBottomColor: colors.hairline,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  justifyContent: 'space-between',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Shield size={20} color={colors.text} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                    {t.auth.biometricTitle}
                  </Text>
                  <Text style={[styles.menuRowSubtitle, { color: colors.subtle }]}>
                    {hasBiometrics
                      ? biometricEnabled
                        ? t.auth.biometricActiveNotice
                        : t.auth.biometricInactiveNotice
                      : t.auth.biometricUnavailable}
                  </Text>
                </View>
              </View>
              <Switch
                disabled={!hasBiometrics}
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: colors.wash, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            {/* 3. Mật khẩu & Bảo mật */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveSettingsSubView('security')}
              style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Key size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.auth.changePasswordTitle}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>

            {/* 4. Phiên đăng nhập */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveSettingsSubView('sessions')}
              style={[styles.menuRowItem, { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Laptop size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.common.sessionsTab}
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

            {/* 5. Ngôn ngữ */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveSettingsSubView('language')}
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

            {/* 6. Trợ giúp & Giới thiệu */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveSettingsSubView('help')}
              style={styles.menuRowItem}
            >
              <HelpCircle size={20} color={colors.text} />
              <View style={styles.menuRowInfo}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>
                  {t.common.help}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.logoutBtn,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.coral}40`,
            },
          ]}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={colors.coral} />
          <Text style={[styles.logoutText, { color: colors.coral }]}>
            {t.auth.logout}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        initialMode={modalMode}
        onClose={() => setIsEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  scrollContent: { padding: 20, paddingBottom: 110, gap: 16 },
  card: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: { fontSize: 28, fontWeight: '800' },
  nameText: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  handleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  handleText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dobBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  dobText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bioSubText: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  settingsSectionWrapper: {
    width: '100%',
    gap: 8,
  },
  sectionGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  settingsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    marginLeft: 12,
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuRowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '700' },
});
