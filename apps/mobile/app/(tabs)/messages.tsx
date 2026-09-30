import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MessageSquare, ShieldCheck, ChevronRight, Hash, Users, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useCircleStore } from '../../src/stores/circle.store';
import { useMyCirclesQuery } from '../../src/hooks/use-circle-queries';
import { HeaderControls } from '../../src/components/common/HeaderControls';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MessagesTab() {
  const router = useRouter();
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const isDark = resolvedTheme === 'dark';

  const { data: circles = [], isLoading } = useMyCirclesQuery();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);

  const handleOpenCircle = (circle: any) => {
    setActiveCircle(circle);
    router.push({
      pathname: '/circle/[id]',
      params: { id: circle.id },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t.nav.chatChannels}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.subtle }]}>
            {t.home.circleFeedTitle}
          </Text>
        </View>
        <HeaderControls />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {circles.length === 0 ? (
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
              <MessageSquare size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {t.home.feedEmptyTitle}
            </Text>
            <Text style={[styles.desc, { color: colors.subtle }]}>
              {t.home.feedEmptyDesc}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.wash, borderColor: colors.hairline },
              ]}
            >
              <ShieldCheck size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {t.common.dualTokenSecurity}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.circlesList}>
            {circles.map((circle) => {
              const channels = circle.channels || [
                { id: '1', name: 'general', topic: t.circle.generalChannelTopic },
              ];

              return (
                <TouchableOpacity
                  key={circle.id}
                  activeOpacity={0.8}
                  onPress={() => handleOpenCircle(circle)}
                  style={[
                    styles.circleItemCard,
                    { backgroundColor: colors.surface, borderColor: colors.hairline },
                  ]}
                >
                  <View style={styles.circleHeaderRow}>
                    <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                        {getInitials(circle.name)}
                      </Text>
                    </View>
                    <View style={styles.circleInfo}>
                      <Text numberOfLines={1} style={[styles.circleName, { color: colors.text }]}>
                        {circle.name}
                      </Text>
                      <Text style={[styles.circleHandle, { color: colors.subtle }]}>
                        @{circle.handle} · {circle.memberCount || 1} {t.home.circleMembersCount.replace('{count}', '')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.subtle} />
                  </View>

                  {/* Channel previews */}
                  <View style={[styles.channelsList, { borderTopColor: colors.hairline }]}>
                    {channels.map((chan) => (
                      <View key={chan.id} style={styles.channelRow}>
                        <Hash size={14} color={colors.primary} />
                        <Text style={[styles.channelName, { color: colors.text }]}>
                          {chan.name}
                        </Text>
                        <Text numberOfLines={1} style={[styles.channelTopic, { color: colors.subtle }]}>
                          · {chan.topic || t.circle.generalChannelTopic}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  content: { padding: 20, paddingBottom: 100 },
  emptyBox: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 40,
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
  desc: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  circlesList: {
    gap: 14,
  },
  circleItemCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
  },
  circleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  circleInfo: {
    flex: 1,
    gap: 2,
  },
  circleName: {
    fontSize: 15,
    fontWeight: '700',
  },
  circleHandle: {
    fontSize: 11,
    fontWeight: '500',
  },
  channelsList: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelName: {
    fontSize: 13,
    fontWeight: '600',
  },
  channelTopic: {
    fontSize: 12,
    flex: 1,
  },
});
