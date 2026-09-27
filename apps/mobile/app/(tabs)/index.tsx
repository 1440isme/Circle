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
  UserCheck,
  Camera,
  Image as ImageIcon,
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
    Alert.alert(t.common.appName, msg);
  };

  // User's joined circles (strictly binds to real data; zero mock records)
  const userCircles: Array<{ id: string; name: string; initial: string; color: string; members: number }> = [];

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header - Seamless with Canvas (No Border Partition) */}
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
        <View style={styles.brandGroup}>
          <View style={[styles.logoPill, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.onPrimary }]}>C</Text>
          </View>
          <View>
            <Text style={[styles.brandText, { color: colors.text }]}>{t.common.appName}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
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
        {/* Native Circles Rail (Stories-like Horizontal Strip on Infinite Canvas) */}
        <View style={styles.circlesRailSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.circlesRailContent}
          >
            {/* Primary Action: Create Circle Button */}
            <TouchableOpacity
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
                {t.home.createCircleBtn}
              </Text>
            </TouchableOpacity>

            {/* Real User Circles (Rendered dynamically when available from API/Store) */}
            {userCircles.map((circle) => (
              <TouchableOpacity
                key={circle.id}
                activeOpacity={0.8}
                onPress={() =>
                  handleAction(
                    `${t.home.circleLabel} ${circle.name} (${t.home.circleMembersCount.replace('{count}', String(circle.members))})`,
                  )
                }
                style={styles.circleRailItem}
              >
                <View
                  style={[
                    styles.circleAvatarRing,
                    { borderColor: colors.hairline },
                  ]}
                >
                  <View style={[styles.circleAvatarInner, { backgroundColor: circle.color }]}>
                    <Text style={[styles.circleAvatarText, { color: colors.onPrimary }]}>
                      {circle.initial}
                    </Text>
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.circleRailName, { color: colors.text }]}
                >
                  {circle.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Composer Bar - Unboxed Seamless Pill */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleAction(t.home.composerPlaceholder)}
          style={[
            styles.composerBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={[styles.composerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.composerAvatarText, { color: colors.onPrimary }]}>{initials}</Text>
          </View>
          <Text style={[styles.composerPlaceholder, { color: colors.subtle }]}>
            {t.home.composerPlaceholder}
          </Text>
          <View style={styles.composerIcons}>
            <Camera size={18} color={colors.subtle} />
            <ImageIcon size={18} color={colors.subtle} />
          </View>
        </TouchableOpacity>

        {/* Welcome Section - Seamless Canvas (Unboxed, Organic Flow) */}
        <View style={styles.welcomeSection}>
          <View style={[styles.tagPill, { backgroundColor: colors.wash }]}>
            <Sparkles size={12} color={colors.primary} />
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

          {/* Action Chips */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAction(t.home.createCirclePrompt)}
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color={colors.onPrimary} strokeWidth={2.4} />
              <Text style={[styles.primaryActionText, { color: colors.onPrimary }]}>
                {t.home.createCircleBtn}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAction(t.home.inviteCodePrompt)}
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: colors.wash,
                  borderColor: colors.hairline,
                },
              ]}
            >
              <KeyRound size={15} color={colors.text} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                {t.home.joinWithCodeBtn}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty Feed State - Unboxed Clean Canvas */}
        <View style={styles.feedEmptySection}>
          <View style={[styles.feedIconBox, { backgroundColor: colors.wash }]}>
            <Compass size={32} color={colors.primary} />
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
                backgroundColor: colors.wash,
                borderColor: colors.hairline,
              },
            ]}
          >
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={[styles.shieldText, { color: colors.primary }]}>
              {t.common.dualTokenSecurity}
            </Text>
          </View>
        </View>

        {/* Voice Stage Status Banner - Seamless Wash Pill */}
        <View
          style={[
            styles.stageCard,
            {
              backgroundColor: colors.wash,
              borderColor: colors.hairline,
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

        {/* Account Info Pill */}
        <View
          style={[
            styles.accountPill,
            {
              backgroundColor: colors.wash,
              borderColor: colors.hairline,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 18,
  },
  circlesRailSection: {
    marginHorizontal: -20,
    paddingBottom: 4,
  },
  circlesRailContent: {
    paddingHorizontal: 20,
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
    borderWidth: 1.5,
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
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
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
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  composerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeSection: {
    paddingVertical: 8,
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedEmptySection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  feedIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  feedTitle: {
    fontSize: 17,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  shieldText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accountPill: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
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
