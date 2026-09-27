import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Sparkles,
  Plus,
  KeyRound,
  ShieldCheck,
  Compass,
  Radio,
  Calendar,
  UserCheck,
  Camera,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { HeaderControls } from '../../src/components/common/HeaderControls';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HomeScreen() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const { user } = useAuthStore();

  const isDark = resolvedTheme === 'dark';
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const initials = getInitials(displayName);
  const roleLabel = user?.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member;

  const handleAction = (msg: string) => {
    Alert.alert(t.common.appName || 'CIRCLE', msg);
  };

  // Sample native social circles for horizontal rail
  const sampleCircles = [
    { id: 'new', name: t.home.createCircleBtn, isAdd: true },
    { id: '1', name: 'Gia đình nhỏ', initial: 'GĐ', color: '#10B981', members: 4 },
    { id: '2', name: 'Hội bạn thân', initial: 'BT', color: '#3B82F6', members: 6 },
    { id: '3', name: 'Đồ án Tốt nghiệp', initial: 'TN', color: '#8B5CF6', members: 2 },
    { id: '4', name: 'CLB Cầu lông', initial: 'CL', color: '#F59E0B', members: 12 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header - Seamless with Canvas (No Border) */}
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
        <View style={styles.brandGroup}>
          <View style={[styles.logoPill, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <View>
            <Text style={[styles.brandText, { color: colors.text }]}>CIRCLE</Text>
            <View style={styles.statusRow}>
              <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.subBrandText, { color: colors.subtle }]}>
                {displayName}
              </Text>
            </View>
          </View>
        </View>

        <HeaderControls />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Native Circles Rail (Stories-like Horizontal Strip) */}
        <View style={styles.circlesRailSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.circlesRailContent}
          >
            {sampleCircles.map((circle) => {
              if (circle.isAdd) {
                return (
                  <TouchableOpacity
                    key={circle.id}
                    activeOpacity={0.8}
                    onPress={() => handleAction(t.home.createCirclePrompt)}
                    style={styles.circleRailItem}
                  >
                    <View
                      style={[
                        styles.addCircleRing,
                        { borderColor: colors.primary, backgroundColor: colors.wash },
                      ]}
                    >
                      <Plus size={22} color={colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.circleRailName, { color: colors.text }]}
                    >
                      {circle.name}
                    </Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={circle.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    handleAction(`Vòng tròn ${circle.name} (${circle.members} thành viên)`)
                  }
                  style={styles.circleRailItem}
                >
                  <View
                    style={[
                      styles.circleAvatarRing,
                      { borderColor: isDark ? colors.hairline : 'rgba(0,0,0,0.08)' },
                    ]}
                  >
                    <View style={[styles.circleAvatarInner, { backgroundColor: circle.color }]}>
                      <Text style={styles.circleAvatarText}>{circle.initial}</Text>
                    </View>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.circleRailName, { color: colors.text }]}
                  >
                    {circle.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Quick Composer Bar */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleAction(t.home.composerPlaceholder)}
          style={[
            styles.composerBar,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <View style={[styles.composerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.composerAvatarText}>{initials}</Text>
          </View>
          <Text style={[styles.composerPlaceholder, { color: colors.subtle }]}>
            {t.home.composerPlaceholder}
          </Text>
          <View style={styles.composerIcons}>
            <Camera size={18} color={colors.subtle} />
            <ImageIcon size={18} color={colors.subtle} />
          </View>
        </TouchableOpacity>

        {/* Welcome Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <View style={[styles.tagPill, { backgroundColor: `${colors.primary}18` }]}>
                <Sparkles size={11} color={colors.primary} />
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {t.home.createFirstCirclePrompt}
                </Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                {t.home.welcomeTitle.replace('{name}', displayName)}
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.subtle }]}>
                {t.home.welcomeSubtitle}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAction(t.home.createCirclePrompt)}
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={15} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.primaryActionText}>
                {t.home.createCircleBtn}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAction(t.home.inviteCodePrompt)}
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: colors.wash,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <KeyRound size={14} color={colors.text} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                {t.home.joinWithCodeBtn}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty Feed State */}
        <View
          style={[
            styles.feedCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <View style={[styles.feedIconBox, { backgroundColor: colors.wash }]}>
            <Compass size={28} color={colors.primary} />
          </View>
          <Text style={[styles.feedTitle, { color: colors.text }]}>
            {t.home.feedEmptyTitle}
          </Text>
          <Text style={[styles.feedDesc, { color: colors.subtle }]}>
            {t.home.feedEmptyDesc}
          </Text>

          {/* Social Privacy Badge */}
          <View
            style={[
              styles.shieldBadge,
              {
                backgroundColor: `${colors.primary}12`,
                borderColor: `${colors.primary}25`,
              },
            ]}
          >
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={[styles.shieldText, { color: colors.primary }]}>
              {t.common.dualTokenSecurity}
            </Text>
          </View>
        </View>

        {/* Account Info Pill */}
        <View
          style={[
            styles.accountPill,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <View style={styles.accountLeft}>
            <UserCheck size={16} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.text }]}>
              {roleLabel} · {user?.email}
            </Text>
          </View>
        </View>

        {/* Voice Stage Status Card */}
        <View
          style={[
            styles.stageCard,
            {
              backgroundColor: colors.wash,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={styles.stageHeader}>
            <Radio size={14} color={colors.primary} />
            <Text style={[styles.stageHeaderText, { color: colors.primary }]}>
              {t.home.realtimeVoiceStage}
            </Text>
          </View>
          <Text style={[styles.stageTitle, { color: colors.text }]}>
            {t.home.noVoiceStageOpen}
          </Text>
          <Text style={[styles.stageSubtitle, { color: colors.subtle }]}>
            {t.home.voiceStageReadyHint}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Seamless with canvas: No border line
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPill: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subBrandText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 14,
  },
  circlesRailSection: {
    marginHorizontal: -18,
    paddingBottom: 4,
  },
  circlesRailContent: {
    paddingHorizontal: 18,
    gap: 14,
    alignItems: 'center',
  },
  circleRailItem: {
    alignItems: 'center',
    width: 64,
  },
  addCircleRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  circleRailName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  composerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 13,
  },
  composerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  feedIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  feedDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  shieldText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accountPill: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stageCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stageHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  stageSubtitle: {
    fontSize: 12,
  },
});
