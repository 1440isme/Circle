import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, AlertTriangle } from 'lucide-react-native';

export interface MobileActionChoiceOption {
  id: string;
  title: string;
  description: string;
  icon?: any;
  isDefault?: boolean;
  variant?: 'default' | 'danger';
}

export interface MobileActionChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: any;
  options: MobileActionChoiceOption[];
  defaultSelectedId?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'danger';
  warningText?: string | ((selectedId: string) => string | null | undefined);
  errorText?: string | null;
  onConfirm: (selectedId: string) => void | Promise<void>;
  isLoading?: boolean;
  colors: any;
  isDark?: boolean;
  t?: any;
}

export const MobileActionChoiceModal: React.FC<MobileActionChoiceModalProps> = ({
  visible,
  onClose,
  title,
  description,
  icon,
  options,
  defaultSelectedId,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  warningText,
  errorText,
  onConfirm,
  isLoading = false,
  colors,
  isDark = false,
  t,
}) => {
  const insets = useSafeAreaInsets();
  const initialId = defaultSelectedId || options[0]?.id || '';
  const [selectedId, setSelectedId] = useState<string>(initialId);

  useEffect(() => {
    if (!visible) return;
    setSelectedId(defaultSelectedId || options[0]?.id || '');
  }, [visible, defaultSelectedId, options]);

  if (!visible) return null;

  const currentOption = options.find((o) => o.id === selectedId) || options[0];
  const activeWarning =
    typeof warningText === 'function' ? warningText(selectedId) : warningText;

  const handleConfirm = async () => {
    if (isLoading) return;
    await onConfirm(selectedId);
  };

  const isCurrentDanger = currentOption?.variant === 'danger';
  const effectiveConfirmVariant =
    confirmVariant === 'danger' || isCurrentDanger ? 'danger' : 'default';

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
              {icon}
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {title}
                </Text>
                {description ? (
                  <Text style={[styles.headerSubtitle, { color: colors.subtle }]}>
                    {description}
                  </Text>
                ) : null}
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

          {/* Body Options */}
          <View style={styles.body}>
            {options.map((option) => {
              const isSelected = selectedId === option.id;
              const isDanger = option.variant === 'danger';
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.8}
                  disabled={isLoading}
                  onPress={() => setSelectedId(option.id)}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDanger
                          ? isDark
                            ? 'rgba(239, 68, 68, 0.12)'
                            : '#FEE2E2'
                          : isDark
                          ? 'rgba(84, 180, 166, 0.12)'
                          : '#E6F4F1'
                        : colors.wash,
                      borderColor: isSelected
                        ? isDanger
                          ? '#EF4444'
                          : colors.primary
                        : colors.hairline,
                    },
                  ]}
                >
                  <View style={styles.optionHeader}>
                    {/* Radio indicator */}
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected
                            ? isDanger
                              ? '#EF4444'
                              : colors.primary
                            : colors.subtle,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInnerDot,
                            {
                              backgroundColor: isDanger
                                ? '#EF4444'
                                : colors.primary,
                            },
                          ]}
                        />
                      )}
                    </View>

                    {option.icon}
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color:
                            isSelected && isDanger
                              ? '#EF4444'
                              : colors.text,
                        },
                      ]}
                    >
                      {option.title}
                    </Text>

                    {option.isDefault && (
                      <View style={[styles.badge, { backgroundColor: colors.wash }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                          {t?.common?.default || 'Mặc định'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Warning Banner */}
            {activeWarning ? (
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                    borderColor: '#F59E0B',
                  },
                ]}
              >
                <AlertTriangle size={15} color="#F59E0B" />
                <Text style={styles.warningText}>{activeWarning}</Text>
              </View>
            ) : null}

            {/* Error Banner */}
            {errorText ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                    borderColor: '#EF4444',
                  },
                ]}
              >
                <AlertTriangle size={15} color="#EF4444" />
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onClose}
                disabled={isLoading}
                style={[
                  styles.cancelBtn,
                  { borderColor: colors.hairline, backgroundColor: colors.wash },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                  {cancelLabel || t?.common?.cancel || 'Hủy'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirm}
                disabled={isLoading}
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor:
                      effectiveConfirmVariant === 'danger'
                        ? '#DC2626'
                        : colors.primary,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                ) : null}
                <Text style={styles.confirmBtnText}>
                  {confirmLabel || t?.common?.confirm || 'Xác nhận'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
    gap: 12,
  },
  optionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    paddingLeft: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 11.5,
    color: '#D97706',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
