import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, AlertTriangle, Trash2, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

export interface MobileConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: any;
  isLoading?: boolean;
}

export const MobileConfirmModal: React.FC<MobileConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  icon,
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();

  if (!visible) return null;

  const handleConfirmPress = async () => {
    if (isLoading) return;
    if (variant === 'danger') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await onConfirm();
  };

  const renderIcon = () => {
    if (icon) return icon;
    if (variant === 'danger') {
      return (
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
          <Trash2 size={20} color="#EF4444" />
        </View>
      );
    }
    if (variant === 'warning') {
      return (
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
          <AlertTriangle size={20} color="#F59E0B" />
        </View>
      );
    }
    return (
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(84, 180, 166, 0.12)' }]}>
        <Info size={20} color={colors.primary} />
      </View>
    );
  };

  const getConfirmBg = () => {
    if (variant === 'danger') return '#DC2626';
    if (variant === 'warning') return '#D97706';
    return colors.primary;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isLoading ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.scrim}
          activeOpacity={1}
          onPress={isLoading ? undefined : onClose}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.elevated : colors.surface,
              borderColor: colors.hairline,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerTitleWrap}>
              {renderIcon()}
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              disabled={isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.closeBtn, { backgroundColor: colors.wash }]}
            >
              <X size={16} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          {description ? (
            <View style={styles.body}>
              <Text style={[styles.descriptionText, { color: colors.subtle }]}>
                {description}
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.hairline }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                {cancelLabel || t.common.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isLoading}
              onPress={handleConfirmPress}
              style={[styles.confirmBtn, { backgroundColor: getConfirmBg() }]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  {confirmLabel || t.common.confirm}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingVertical: 14,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
