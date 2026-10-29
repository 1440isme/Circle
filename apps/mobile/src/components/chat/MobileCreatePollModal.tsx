import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Vote, Plus, Trash2 } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { createPollApi } from '../../services/circle-tools.service';
import { GroupPollEntity } from '@circle/types';

interface MobileCreatePollModalProps {
  visible: boolean;
  onClose: () => void;
  circleId: string;
  onPollCreated: (poll: GroupPollEntity) => Promise<void>;
}

export const MobileCreatePollModal: React.FC<MobileCreatePollModalProps> = ({
  visible,
  onClose,
  circleId,
  onPollCreated,
}) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length < 8) {
      Haptics.selectionAsync();
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      Haptics.selectionAsync();
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleSubmit = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      Alert.alert(t.common?.appName || 'CIRCLE', t.collab?.pollValidationQuestion || 'Vui lòng nhập câu hỏi bình chọn');
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      Alert.alert(t.common?.appName || 'CIRCLE', t.collab?.pollValidationOptions || 'Vui lòng nhập ít nhất 2 lựa chọn');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createPollApi(circleId, {
        question: trimmedQuestion,
        options: validOptions,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onPollCreated(created);
      setQuestion('');
      setOptions(['', '']);
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo bình chọn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.wash }]}>
                <Vote size={18} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t.collab?.createPoll || 'Tạo bình chọn'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Question */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {t.collab?.pollTitle || 'Thăm dò ý kiến'} *
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder={t.collab?.pollQuestionPlaceholder || 'Đặt câu hỏi bình chọn...'}
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.wash,
                    borderColor: colors.hairline,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Options */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {t.collab?.addOption || 'Thêm lựa chọn'} *
              </Text>
              {options.map((opt, idx) => (
                <View key={idx} style={styles.optionRow}>
                  <TextInput
                    value={opt}
                    onChangeText={(val) => handleOptionChange(idx, val)}
                    placeholder={(t.collab?.pollOptionPlaceholder || 'Lựa chọn {index}').replace('{index}', String(idx + 1))}
                    placeholderTextColor={colors.subtle}
                    style={[
                      styles.input,
                      styles.optionInput,
                      {
                        backgroundColor: colors.wash,
                        borderColor: colors.hairline,
                        color: colors.text,
                      },
                    ]}
                  />
                  {options.length > 2 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveOption(idx)}
                      style={styles.removeOptionBtn}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {options.length < 8 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleAddOption}
                  style={styles.addOptionBtn}
                >
                  <Plus size={15} color={colors.primary} />
                  <Text style={[styles.addOptionBtnText, { color: colors.primary }]}>
                    {t.collab?.addOption || 'Thêm lựa chọn'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={[styles.footerRow, { borderTopColor: colors.hairline }]}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={[styles.cancelBtn, { borderColor: colors.hairline }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.subtle }]}>
                {t.common?.cancel || 'Hủy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {t.collab?.createPoll || 'Tạo bình chọn'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  formScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
  },
  removeOptionBtn: {
    padding: 8,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  addOptionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
