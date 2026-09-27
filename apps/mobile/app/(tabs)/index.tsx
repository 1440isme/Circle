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

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderBottomColor: colors.hairline,
          },
        ]}
      >
        <View style={styles.brandGroup}>
          <View style={[styles.logoPill, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <View>
            <Text style={[styles.brandText, { color: colors.text }]}>CIRCLE</Text>
            <Text style={[styles.subBrandText, { color: colors.subtle }]}>
              {t.nav.noActiveCircle}
            </Text>
          </View>
        </View>
        <HeaderControls />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <View style={[styles.tagPill, { backgroundColor: `${colors.primary}20` }]}>
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

          {/* Quick Action Buttons */}
          <View style={[styles.actionsRow, { borderTopColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAction(t.home.createCirclePrompt)}
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={15} color={isDark ? '#121614' : '#FFFFFF'} />
              <Text
                style={[
                  styles.primaryActionText,
                  { color: isDark ? '#121614' : '#FFFFFF' },
                ]}
              >
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
                  borderColor: colors.hairline,
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

        {/* Clean Empty Feed State */}
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={[styles.emptyIconBox, { backgroundColor: colors.wash }]}>
            <Compass size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t.home.feedEmptyTitle}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.subtle }]}>
            {t.home.feedEmptyDesc}
          </Text>

          <View
            style={[
              styles.securityPill,
              {
                backgroundColor: colors.wash,
                borderColor: colors.hairline,
              },
            ]}
          >
            <ShieldCheck size={13} color={colors.primary} />
            <Text style={[styles.securityPillText, { color: colors.primary }]}>
              {t.home.dualTokenSecured}
            </Text>
          </View>
        </View>

        {/* User Identity & Security Summary Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.subtle }]}>
              {t.home.yourProfileCard}
            </Text>
            <View style={styles.onlineBadge}>
              <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.onlineText}>{t.home.onlineStatus}</Text>
            </View>
          </View>

          <View style={styles.profileRow}>
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subBrandText: {
    fontSize: 11,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 110,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 20,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  securityPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '500',
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
    marginBottom: 6,
  },
  stageHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  stageSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
});
