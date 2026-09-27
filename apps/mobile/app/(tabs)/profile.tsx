import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Shield, LogOut, CheckCircle2 } from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileTab() {
  const router = useRouter();
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const { user, logout } = useAuthStore();

  const isDark = resolvedTheme === 'dark';
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const initials = getInitials(displayName);
  const roleLabel = user?.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member;

  const handleLogout = () => {
    Alert.alert(
      t.auth.logout,
      'Bạn có chắc chắn muốn đăng xuất khỏi CIRCLE?',
      [
        { text: 'Hủy', style: 'cancel' },
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

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderBottomColor: colors.hairline,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.auth.profile}
        </Text>
        <HeaderControls />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={[styles.nameText, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.emailText, { color: colors.subtle }]}>
            {user?.email}
          </Text>

          <View style={[styles.roleBadge, { backgroundColor: colors.wash }]}>
            <Shield size={13} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {/* Security & Token Info */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.hairline,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
            {t.common.dualTokenSecurity}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                {t.home.dualTokenSecured}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.hairline }]}>
            <View style={styles.infoLeft}>
              <Mail size={16} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                {t.auth.email}: {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.logoutBtn,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20, gap: 16 },
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
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  nameText: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  emailText: { fontSize: 13, marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  infoCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: { fontSize: 13, fontWeight: '500' },
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
