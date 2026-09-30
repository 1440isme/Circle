import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Users,
  Plus,
  KeyRound,
  Settings,
  Globe,
  Lock,
  Crown,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useCircleStore } from '../../src/stores/circle.store';
import { useMyCirclesQuery, CircleListItem } from '../../src/hooks/use-circle-queries';
import { HeaderControls } from '../../src/components/common/HeaderControls';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CirclesTab() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const isDark = resolvedTheme === 'dark';

  const setCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);
  const setJoinModalVisible = useCircleStore((s) => s.setJoinModalVisible);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalVisible = useCircleStore((s) => s.setManageModalVisible);
  const activeCircleId = useCircleStore((s) => s.activeCircleId);

  const {
    data: circles = [],
    isLoading,
    isRefetching,
    refetch,
  } = useMyCirclesQuery();

  const handleOpenManage = (circle: CircleListItem, e?: any) => {
    e?.stopPropagation?.();
    setActiveCircle(circle);
    setManageModalVisible(true, 'info');
  };

  const handleSelectCircle = (circle: CircleListItem) => {
    setActiveCircle(circle);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Top Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t.nav.yourCircles}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.subtle }]}>
            {circles.length > 0
              ? `${circles.length} ${t.home.circleLabel}`
              : t.home.emptyCirclesTitle}
          </Text>
        </View>
        <HeaderControls />
      </View>

      {/* Quick Action Pills */}
      <View style={styles.actionPillsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setCreateModalVisible(true)}
          style={[styles.actionPill, { backgroundColor: colors.primary }]}
        >
          <Plus size={16} color={colors.onPrimary} strokeWidth={2.4} />
          <Text style={[styles.actionPillText, { color: colors.onPrimary }]}>
            {t.home.createCircleBtn}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setJoinModalVisible(true)}
          style={[
            styles.actionPill,
            { backgroundColor: colors.wash, borderColor: colors.hairline, borderWidth: 1 },
          ]}
        >
          <KeyRound size={15} color={colors.text} />
          <Text style={[styles.actionPillText, { color: colors.text }]}>
            {t.home.joinWithCodeBtn}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : circles.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.wash }]}>
              <Users size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {t.home.emptyCirclesTitle}
            </Text>
            <Text style={[styles.desc, { color: colors.subtle }]}>
              {t.home.emptyCirclesDesc}
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(true)}
                style={[styles.btn, { backgroundColor: colors.primary }]}
              >
                <Plus size={16} color={colors.onPrimary} />
                <Text style={[styles.btnText, { color: colors.onPrimary }]}>
                  {t.home.createCircleBtn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setJoinModalVisible(true)}
                style={[
                  styles.btn,
                  { backgroundColor: colors.wash, borderColor: colors.hairline, borderWidth: 1 },
                ]}
              >
                <KeyRound size={15} color={colors.text} />
                <Text style={[styles.btnText, { color: colors.text }]}>
                  {t.home.joinWithCodeBtn}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {circles.map((item) => {
            const isSelected = item.id === activeCircleId;
            const isOwner = item.role === 'OWNER';
            const isAdmin = item.role === 'ADMIN';

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => handleSelectCircle(item)}
                style={[
                  styles.circleCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.hairline,
                    borderWidth: isSelected ? 1.8 : 1,
                  },
                ]}
              >
                {/* Circle Avatar */}
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                    {getInitials(item.name)}
                  </Text>
                </View>

                {/* Info Block */}
                <View style={styles.infoBlock}>
                  <View style={styles.titleRow}>
                    <Text numberOfLines={1} style={[styles.circleName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    {isOwner ? (
                      <View style={[styles.badge, { backgroundColor: `${colors.warning}20` }]}>
                        <Crown size={11} color={colors.warning} />
                        <Text style={[styles.badgeText, { color: colors.warning }]}>
                          {t.circle.memberRoleOwner || 'Trưởng nhóm'}
                        </Text>
                      </View>
                    ) : isAdmin ? (
                      <View style={[styles.badge, { backgroundColor: `${colors.primary}20` }]}>
                        <ShieldCheck size={11} color={colors.primary} />
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                          {t.circle.memberRoleAdmin || 'Quản trị viên'}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text numberOfLines={1} style={[styles.handleText, { color: colors.subtle }]}>
                    @{item.handle} {item.nickname ? `· (${item.nickname})` : ''}
                  </Text>

                  {/* Badges row */}
                  <View style={styles.metaRow}>
                    <View style={[styles.metaPill, { backgroundColor: colors.wash }]}>
                      {item.isPrivate ? (
                        <Lock size={12} color={colors.subtle} />
                      ) : (
                        <Globe size={12} color={colors.subtle} />
                      )}
                      <Text style={[styles.metaText, { color: colors.subtle }]}>
                        {item.isPrivate ? t.circle.privacyPrivate : t.circle.privacyPublic}
                      </Text>
                    </View>

                    <View style={[styles.metaPill, { backgroundColor: colors.wash }]}>
                      <Users size={12} color={colors.subtle} />
                      <Text style={[styles.metaText, { color: colors.subtle }]}>
                        {t.circle.membersCount.replace('{count}', String(item.memberCount || 1))}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Manage Settings Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => handleOpenManage(item, e)}
                  style={[styles.manageBtn, { backgroundColor: colors.wash }]}
                >
                  <Settings size={18} color={colors.subtle} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
  headerSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  actionPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 20,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 90,
    justifyContent: 'center',
  },
  emptyBox: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  desc: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  btnRow: { width: '100%', gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 22,
  },
  btnText: { fontSize: 13, fontWeight: '700' },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoBlock: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleName: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  handleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  manageBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
