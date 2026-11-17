import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Compass,
  X,
  Plus,
  Play,
  RotateCw,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { DecisionWheelEntity } from '@circle/types';
import { getWheelsApi, liveSpinWheelApi } from '../../services/circle-tools.service';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';

interface MobileLiveWheelPickerModalProps {
  visible: boolean;
  onClose: () => void;
  circleId: string;
  channelId?: string | null;
}

const PRESET_QUICK_OPTIONS = [
  {
    title: 'Trưa nay ăn gì?',
    options: ['Cơm tấm', 'Bún bò Huế', 'Phở bò', 'Bánh mì chảo', 'Gà rán', 'Bún chả'],
  },
  {
    title: 'Ai trả tiền hôm nay?',
    options: ['Bình', 'Hạnh', 'Chia đều (Campuchia)', 'Người nhỏ tuổi nhất', 'Quay lại lần nữa'],
  },
  {
    title: 'Ai dọn dẹp nhóm?',
    options: ['Trưởng nhóm', 'Người thua kèo', 'Bốc thăm ngẫu nhiên', 'Cả nhóm cùng làm'],
  },
  {
    title: 'Có hoặc Không?',
    options: ['CÓ, TRIỂN LUÔN!', 'KHÔNG, ĐỂ DỊP KHÁC', 'SUY NGHĨ THÊM 5 PHÚT'],
  },
];

export const MobileLiveWheelPickerModal: React.FC<MobileLiveWheelPickerModalProps> = ({
  visible,
  onClose,
  circleId,
  channelId,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { locale, t } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<'existing' | 'custom'>('existing');
  const [existingWheels, setExistingWheels] = useState<DecisionWheelEntity[]>([]);
  const [isLoadingWheels, setIsLoadingWheels] = useState(false);
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);

  // Custom wheel inputs
  const [customTitle, setCustomTitle] = useState('');
  const [customOptionsText, setCustomOptionsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible && circleId) {
      setIsLoadingWheels(true);
      getWheelsApi(circleId)
        .then((data) => {
          setExistingWheels(data || []);
          if (data && data.length > 0 && !selectedWheelId) {
            setSelectedWheelId(data[0]!.id);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingWheels(false));
    }
  }, [visible, circleId]);

  const parsedCustomOptions = useMemo(() => {
    return customOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [customOptionsText]);

  const handleApplyPreset = (preset: { title: string; options: string[] }) => {
    setCustomTitle(preset.title);
    setCustomOptionsText(preset.options.join('\n'));
    setErrorMessage(null);
  };

  const handleStartSpin = async () => {
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      if (activeTab === 'existing') {
        if (!selectedWheelId) {
          setErrorMessage(locale === 'vi' ? 'Vui lòng chọn 1 vòng quay' : 'Please select a wheel');
          setIsSubmitting(false);
          return;
        }
        await liveSpinWheelApi(circleId, {
          wheelId: selectedWheelId,
          channelId: channelId || undefined,
        });
      } else {
        if (parsedCustomOptions.length < 2) {
          setErrorMessage(
            locale === 'vi' ? 'Vui lòng nhập tối thiểu 2 lựa chọn' : 'Please enter at least 2 options',
          );
          setIsSubmitting(false);
          return;
        }
        await liveSpinWheelApi(circleId, {
          title: customTitle.trim() || t.luckyWheel.liveWheelTitle,
          options: parsedCustomOptions,
          channelId: channelId || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Không thể bắt đầu quay');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? colors.elevated : '#FFFFFF',
              borderColor: colors.hairline,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Top Sheet Header */}
          <View style={[styles.header, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
                <Compass size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {t.luckyWheel.title}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.subtle }]}>
                  {t.luckyWheel.liveWheelTitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Segment Tabs */}
          <View style={[styles.tabBar, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActiveTab('existing');
                setErrorMessage(null);
              }}
              style={[
                styles.tabBtn,
                activeTab === 'existing' && [
                  styles.tabBtnActive,
                  { backgroundColor: isDark ? colors.elevated : '#FFFFFF' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'existing' ? colors.primary : colors.subtle },
                  activeTab === 'existing' && styles.tabTextBold,
                ]}
              >
                {t.luckyWheel.selectExistingWheel.replace('{count}', String(existingWheels.length))}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActiveTab('custom');
                setErrorMessage(null);
              }}
              style={[
                styles.tabBtn,
                activeTab === 'custom' && [
                  styles.tabBtnActive,
                  { backgroundColor: isDark ? colors.elevated : '#FFFFFF' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'custom' ? colors.primary : colors.subtle },
                  activeTab === 'custom' && styles.tabTextBold,
                ]}
              >
                {t.luckyWheel.createCustomWheel}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                <AlertCircle size={15} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {activeTab === 'existing' ? (
              isLoadingWheels ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.subtle }]}>
                    {locale === 'vi' ? 'Đang tải danh sách...' : 'Loading wheels...'}
                  </Text>
                </View>
              ) : existingWheels.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Compass size={36} color={colors.subtle} opacity={0.4} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {locale === 'vi' ? 'Chưa có Vòng quay nào' : 'No wheels found'}
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.subtle }]}>
                    {locale === 'vi'
                      ? 'Nhóm chưa có vòng quay lưu sẵn. Hãy chuyển sang tab Thiết lập mới để quay ngay!'
                      : 'No saved wheels yet. Switch to custom tab to set up a new one.'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.switchTabBtn, { backgroundColor: `${colors.primary}20` }]}
                    onPress={() => setActiveTab('custom')}
                  >
                    <Plus size={15} color={colors.primary} />
                    <Text style={[styles.switchTabText, { color: colors.primary }]}>
                      {t.luckyWheel.createCustomWheel}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.wheelList}>
                  {existingWheels.map((wheel) => {
                    const isSelected = selectedWheelId === wheel.id;
                    const optCount = wheel.options?.length || 0;
                    return (
                      <TouchableOpacity
                        key={wheel.id}
                        activeOpacity={0.75}
                        onPress={() => setSelectedWheelId(wheel.id)}
                        style={[
                          styles.wheelCard,
                          {
                            backgroundColor: isDark ? colors.surface : '#F8FAFC',
                            borderColor: isSelected ? colors.primary : colors.hairline,
                          },
                        ]}
                      >
                        <View style={styles.wheelCardLeft}>
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSelected ? colors.primary : colors.subtle,
                                backgroundColor: isSelected ? colors.primary : 'transparent',
                              },
                            ]}
                          >
                            {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                          <View style={styles.wheelCardInfo}>
                            <Text
                              style={[styles.wheelCardTitle, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {wheel.title}
                            </Text>
                            <Text style={[styles.wheelCardMeta, { color: colors.subtle }]}>
                              {optCount} {locale === 'vi' ? 'lựa chọn' : 'options'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            ) : (
              <View style={styles.customSection}>
                {/* Presets Horizontal Scroll */}
                <View style={styles.presetSection}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {locale === 'vi' ? '⚡ Mẫu thiết lập nhanh:' : '⚡ Quick presets:'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
                    {PRESET_QUICK_OPTIONS.map((preset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => handleApplyPreset(preset)}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: isDark ? colors.surface : '#F1F5F9',
                            borderColor: colors.hairline,
                          },
                        ]}
                      >
                        <Sparkles size={12} color={colors.primary} />
                        <Text style={[styles.presetChipText, { color: colors.text }]}>
                          {preset.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Wheel Title Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {t.luckyWheel.customWheelTitle}
                  </Text>
                  <TextInput
                    value={customTitle}
                    onChangeText={setCustomTitle}
                    maxLength={50}
                    placeholder={
                      locale === 'vi'
                        ? 'Ví dụ: Trưa nay ăn gì? Đi chơi ở đâu?...'
                        : 'E.g., What to eat for lunch?'
                    }
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? colors.surface : '#F8FAFC',
                        borderColor: colors.hairline,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>

                {/* Options Multiline Text Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {locale === 'vi'
                        ? `Các phương án (${parsedCustomOptions.length})`
                        : `Options (${parsedCustomOptions.length})`}
                    </Text>
                    {parsedCustomOptions.length < 2 && (
                      <Text style={styles.warnText}>
                        {t.luckyWheel.minOptionsWarning}
                      </Text>
                    )}
                  </View>
                  <TextInput
                    value={customOptionsText}
                    onChangeText={setCustomOptionsText}
                    multiline
                    numberOfLines={5}
                    placeholder={t.luckyWheel.customOptionsPlaceholder}
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: isDark ? colors.surface : '#F8FAFC',
                        borderColor: colors.hairline,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Button */}
          <View style={[styles.footer, { borderTopColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={
                isSubmitting ||
                (activeTab === 'existing' && (!selectedWheelId || existingWheels.length === 0)) ||
                (activeTab === 'custom' && parsedCustomOptions.length < 2)
              }
              onPress={handleStartSpin}
              style={[
                styles.actionBtn,
                { backgroundColor: colors.primary },
                (isSubmitting ||
                  (activeTab === 'existing' && (!selectedWheelId || existingWheels.length === 0)) ||
                  (activeTab === 'custom' && parsedCustomOptions.length < 2)) && {
                  opacity: 0.5,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.actionBtnText}>{t.luckyWheel.startLiveSpin}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  tabTextBold: {
    fontWeight: '700',
  },
  scrollBody: {
    maxHeight: 380,
  },
  scrollContent: {
    padding: 16,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  switchTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 6,
  },
  switchTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  wheelList: {
    gap: 10,
  },
  wheelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  wheelCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelCardInfo: {
    flex: 1,
  },
  wheelCardTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  wheelCardMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  customSection: {
    gap: 14,
  },
  presetSection: {
    gap: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  warnText: {
    fontSize: 10.5,
    color: '#D97706',
    fontWeight: '500',
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11.5,
    color: '#DC2626',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
