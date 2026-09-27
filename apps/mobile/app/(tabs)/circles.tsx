import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Users, Plus, KeyRound } from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { HeaderControls } from '../../src/components/common/HeaderControls';

export default function CirclesTab() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const isDark = resolvedTheme === 'dark';

  const handleNotice = (msg: string) => {
    Alert.alert(t.common.appName || 'CIRCLE', msg);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={[styles.headerBar, { backgroundColor: colors.canvas }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.nav.yourCircles}
        </Text>
        <HeaderControls />
      </View>

      <View style={styles.content}>
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
              onPress={() => handleNotice(t.home.createCirclePrompt)}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color={colors.onPrimary} />
              <Text
                style={[
                  styles.btnText,
                  { color: colors.onPrimary },
                ]}
              >
                {t.home.createCircleBtn}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNotice(t.home.inviteCodePrompt)}
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
});
