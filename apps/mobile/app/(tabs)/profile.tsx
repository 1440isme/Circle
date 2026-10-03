import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image as RNImage,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Shield, LogOut, CheckCircle2, Edit3, Camera, Quote } from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { Button } from '../../src/components/common/Button';
import { HeaderControls } from '../../src/components/common/HeaderControls';
import { EditProfileModal } from '../../src/components/profile/EditProfileModal';

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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const avatarUrl = user?.profile?.avatarUrl;
  const bio = user?.profile?.bio;
  const dateOfBirth = user?.profile?.dateOfBirth;
  const initials = getInitials(displayName);
  const [modalMode, setModalMode] = useState<'edit' | 'avatar'>('edit');

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

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
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

        {/* Security & Token Info */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.subtle }]}>
            {t.common.dualTokenSecurity}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <CheckCircle2 size={16} color={colors.success} />
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
  nameText: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
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
