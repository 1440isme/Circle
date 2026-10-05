import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { ShieldCheck, Lock, EyeOff, Sparkles, X } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

export const TrustBanner: React.FC = () => {
  const { colors } = useThemeStore();
  const { t } = useLanguageStore();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        style={[
          styles.banner,
          { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}25` },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
          <ShieldCheck size={16} color={colors.onPrimary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t.auth.trustBadgeTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            {t.auth.trustBadgeDesc}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: `${colors.primary}20` }]}>
                <ShieldCheck size={20} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.auth.privacyPolicyTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.bulletCard, { backgroundColor: colors.wash }]}>
                <Lock size={16} color={colors.primary} />
                <Text style={[styles.bulletText, { color: colors.text }]}>
                  {t.auth.privacyPolicyBullet1}
                </Text>
              </View>

              <View style={[styles.bulletCard, { backgroundColor: colors.wash }]}>
                <EyeOff size={16} color={colors.primary} />
                <Text style={[styles.bulletText, { color: colors.text }]}>
                  {t.auth.privacyPolicyBullet2}
                </Text>
              </View>

              <View style={[styles.bulletCard, { backgroundColor: colors.wash }]}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={[styles.bulletText, { color: colors.text }]}>
                  {t.auth.privacyPolicyBullet3}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalActionBtnText, { color: colors.onPrimary }]}>
                {t.auth.privacyPolicyClose}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 14,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 10,
    paddingVertical: 12,
  },
  bulletCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  modalActionBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
