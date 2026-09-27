import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MessageSquare, ShieldCheck } from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function MessagesTab() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const isDark = resolvedTheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.nav.chatChannels}
        </Text>
        <HeaderControls />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.emptyBox,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
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
            {t.home.composerPlaceholder}
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
      </View>
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
  content: { flex: 1, padding: 20, paddingBottom: 80, justifyContent: 'center' },
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
});
