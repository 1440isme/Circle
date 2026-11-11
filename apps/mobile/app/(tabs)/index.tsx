import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Plus,
  KeyRound,
  Radio,
  UserCheck,
  Camera,
  MessageSquare,
  X,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/stores/theme.store';
import { getGlassTheme } from '../../src/constants/glass-theme';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { useCircleStore } from '../../src/stores/circle.store';
import { useMyCirclesQuery } from '../../src/hooks/use-circle-queries';
import { useRouter } from 'expo-router';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const { user } = useAuthStore();

  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const roleLabel = user?.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member;

  const { data: myCircles = [], isLoading: isLoadingCircles } = useMyCirclesQuery();
  const setCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);
  const setJoinModalVisible = useCircleStore((s) => s.setJoinModalVisible);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);

  const currentCircle = activeCircle || (myCircles.length > 0 ? myCircles[0] : null);
  const hasCircles = myCircles.length > 0;

  const handleOpenCircleWorkspace = (circle: any) => {
    setActiveCircle(circle);
    router.push({
      pathname: '/circle/[id]' as any,
      params: { id: circle.id },
    });
  };

  const [circleSwitcherVisible, setCircleSwitcherVisible] = React.useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Floating Glass Header (Floating glass controls with scroll-under content) */}
      <View
        style={[styles.headerBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.brandCapsule,
            {
              backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
              borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
            },
          ]}
          pointerEvents="auto"
        >
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

        {/* Header Right: Floating Button for Active Circle Avatar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setCircleSwitcherVisible(true)}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={[
            styles.headerCircleAvatarBtn,
            {
              backgroundColor: colors.primary,
              borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
            },
          ]}
          accessibilityLabel={t.nav.yourCircles}
        >
          {currentCircle ? (
            <Text style={[styles.headerCircleAvatarText, { color: colors.onPrimary }]}>
              {getInitials(currentCircle.name)}
            </Text>
          ) : (
            <Plus size={18} color={colors.onPrimary} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 68 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading Indicator while fetching circles */}
        {isLoadingCircles && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.sage} />
          </View>
        )}

        {/* When user has circles, show active circle quick card */}
        {hasCircles && currentCircle && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleOpenCircleWorkspace(currentCircle)}
            style={[
              styles.activeCircleSpotlightCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            <View style={styles.spotlightHeader}>
              <View style={[styles.spotlightAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.spotlightAvatarText, { color: colors.onPrimary }]}>
                  {getInitials(currentCircle.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.spotlightTitle, { color: colors.text }]}>
                  {currentCircle.name}
                </Text>
                <Text style={[styles.spotlightSubtitle, { color: colors.subtle }]}>
                  {t.home.circleFeedSubtitle}
                </Text>
              </View>
            </View>

            <View style={[styles.spotlightDivider, { backgroundColor: colors.hairline }]} />

            <View style={styles.spotlightActions}>
              <View style={styles.spotlightActionItem}>
                <MessageSquare size={14} color={colors.sage} />
                <Text style={[styles.spotlightActionText, { color: colors.text }]}>
                  {t.chat.title}
                </Text>
              </View>
              <View style={styles.spotlightActionItem}>
                <Camera size={14} color={colors.sage} />
                <Text style={[styles.spotlightActionText, { color: colors.text }]}>
                  {t.composer.momentTitle}
                </Text>
              </View>
              <View style={styles.spotlightActionItem}>
                <Radio size={14} color={colors.sage} />
                <Text style={[styles.spotlightActionText, { color: colors.text }]}>
                  {t.nav.groupCall}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Circle Switcher Modal (Gated Glass vs Flat) */}
        <Modal
          visible={circleSwitcherVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCircleSwitcherVisible(false)}
        >
          <TouchableOpacity
            style={[
              styles.modalBackdrop,
              { paddingBottom: Math.max(insets.bottom + 12, 24) },
            ]}
            activeOpacity={1}
            onPress={() => setCircleSwitcherVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.switcherSheet,
                {
                  backgroundColor: isGlass
                    ? glassTheme.colors.glassBgSheet
                    : colors.surface,
                  borderColor: isGlass
                    ? glassTheme.colors.glassBorder
                    : colors.hairline,
                },
              ]}
            >
              {isGlass ? (
                <BlurView
                  intensity={glassTheme.blur.intensity}
                  tint={glassTheme.blur.tint}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}

              <View style={[styles.sheetHandle, { backgroundColor: colors.hairline }]} />
              <View style={styles.switcherHeader}>
                <Text style={[styles.switcherTitle, { color: colors.text }]}>
                  {t.nav.yourCircles}
                </Text>
                <TouchableOpacity
                  onPress={() => setCircleSwitcherVisible(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.closeBtn, { backgroundColor: colors.wash }]}
                  accessibilityLabel={t.common.close}
                >
                  <X size={16} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {myCircles.map((circle) => {
                  const isSelected = currentCircle?.id === circle.id;
                  return (
                    <TouchableOpacity
                      key={circle.id}
                      activeOpacity={0.75}
                      onPress={() => {
                        setActiveCircle(circle);
                        setCircleSwitcherVisible(false);
                      }}
                      style={[
                        styles.circleSwitcherItem,
                        {
                          backgroundColor: isSelected ? `${colors.primary}15` : colors.wash,
                          borderColor: isSelected ? colors.primary : colors.hairline,
                        },
                      ]}
                    >
                      <View style={[styles.switcherAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.switcherAvatarText, { color: colors.onPrimary }]}>
                          {getInitials(circle.name)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.switcherCircleName, { color: colors.text }]}>
                          {circle.name}
                        </Text>
                        <Text style={[styles.switcherCircleHandle, { color: colors.subtle }]}>
                          @{circle.handle}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkDot, { backgroundColor: colors.primary }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.switcherActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setCircleSwitcherVisible(false);
                    setCreateModalVisible(true);
                  }}
                  style={[styles.switcherActionBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={16} color={colors.onPrimary} strokeWidth={2.4} />
                  <Text style={[styles.switcherActionBtnText, { color: colors.onPrimary }]}>
                    {t.home.createCircleBtn}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setCircleSwitcherVisible(false);
                    setJoinModalVisible(true);
                  }}
                  style={[styles.switcherActionBtnSecondary, { borderColor: colors.hairline, backgroundColor: colors.wash }]}
                >
                  <KeyRound size={15} color={colors.text} />
                  <Text style={[styles.switcherActionBtnSecondaryText, { color: colors.text }]}>
                    {t.home.joinWithCodeBtn}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

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
            <Radio size={14} color={colors.sage} />
            <Text style={[styles.stageHeaderText, { color: colors.sage }]}>
              {t.home.realtimeVoiceStage}
            </Text>
          </View>
          <Text style={[styles.stageTitle, { color: colors.text }]}>
            {t.home.noVoiceStageOpen}
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
            <UserCheck size={16} color={colors.sage} />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandText: {
    fontSize: 15,
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
    fontSize: 11,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 104 : 88,
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
  activeCircleHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    maxWidth: 160,
  },
  activeCircleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircleInitials: {
    fontSize: 10,
    fontWeight: '800',
  },
  activeCircleHeaderName: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeCircleSpotlightCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spotlightAvatar: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  spotlightTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  spotlightSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  spotlightDivider: {
    height: 1,
    width: '100%',
  },
  spotlightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  spotlightActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spotlightActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerCircleAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCircleAvatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  switcherSheet: {
    borderRadius: 32,
    padding: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    gap: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  switcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  switcherTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSwitcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  switcherAvatar: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherAvatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  switcherCircleName: {
    fontSize: 14,
    fontWeight: '700',
  },
  switcherCircleHandle: {
    fontSize: 11,
    marginTop: 1,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  switcherActions: {
    gap: 8,
    marginTop: 4,
  },
  switcherActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    gap: 8,
  },
  switcherActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  switcherActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    gap: 8,
  },
  switcherActionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
