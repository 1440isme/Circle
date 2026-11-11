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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Vote, Plus, Trash2, AlertCircle } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { getGlassTheme } from '../../constants/glass-theme';
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
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const insets = useSafeAreaInsets();
  const { t } = useLanguageStore();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleAddOption = () => {
    if (options.length < 8) {
      Haptics.selectionAsync();
      setFormError(null);
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      Haptics.selectionAsync();
      setFormError(null);
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    if (formError) setFormError(null);
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleSubmit = async () => {
    setFormError(null);
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setFormError(t.collab.pollValidationQuestion);
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      setFormError(t.collab.pollValidationOptions);
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
      setFormError(null);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || t.collab.createPollError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sheetBody = (
    <>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.hairline }]}>
        <View style={styles.headerLeft}>
          <Vote size={20} color={colors.sage} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t.collab.createPoll}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.closeBtn, { backgroundColor: colors.wash }]}
          accessibilityLabel={t.common.close}
        >
          <X size={18} color={colors.subtle} />
        </TouchableOpacity>
      </View>

      {/* Inline Validation / Server Error Banner */}
      {formError && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: `${colors.danger}15`, borderColor: `${colors.danger}40` },
          ]}
        >
          <AlertCircle size={16} color={colors.danger} />
          <Text style={[styles.errorBannerText, { color: colors.danger }]}>
            {formError}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t.collab.pollTitle} *
          </Text>
          <TextInput
            value={question}
            onChangeText={(val) => {
              if (formError) setFormError(null);
              setQuestion(val);
            }}
            placeholder={t.collab.pollQuestionPlaceholder}
            placeholderTextColor={colors.subtle}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.canvas : colors.wash,
                borderColor: colors.hairline,
                color: colors.text,
              },
            ]}
          />
        </View>

        {/* Options */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {t.collab.addOption} *
          </Text>
          {options.map((opt, idx) => (
            <View key={idx} style={styles.optionRow}>
              <TextInput
                value={opt}
                onChangeText={(val) => handleOptionChange(idx, val)}
                placeholder={t.collab.pollOptionPlaceholder.replace('{index}', String(idx + 1))}
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  styles.optionInput,
                  {
                    backgroundColor: isDark ? colors.canvas : colors.wash,
                    borderColor: colors.hairline,
                    color: colors.text,
                  },
                ]}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  onPress={() => handleRemoveOption(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.removeOptionBtn}
                  accessibilityLabel={t.collab.removeOption}
                >
                  <Trash2 size={16} color={colors.danger} />
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
              <Plus size={15} color={colors.sage} />
              <Text style={[styles.addOptionBtnText, { color: colors.sage }]}>
                {t.collab.addOption}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer Submit */}
      <View style={[styles.footerRow, { borderTopColor: colors.hairline }]}>
        <TouchableOpacity
          onPress={handleClose}
          disabled={isSubmitting}
          style={[styles.cancelBtn, { borderColor: colors.hairline, backgroundColor: colors.wash }]}
        >
          <Text style={[styles.cancelBtnText, { color: colors.text }]}>
            {t.common.cancel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.submitBtnText, { color: colors.onPrimary }]}>
              {t.collab.createPoll}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={handleClose}
        />

        {uiStyle === 'glass' ? (
          <BlurView
            intensity={glassTheme.blur.intensity}
            tint={glassTheme.blur.tint}
            style={[
              styles.modalSheet,
              {
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: glassTheme.colors.glassBorder,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            {sheetBody}
          </BlurView>
        ) : (
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: colors.hairline,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            {sheetBody}
          </View>
        )}
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
    maxHeight: '85%',
    overflow: 'hidden',
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
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  formScrollContent: {
    paddingBottom: 12,
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
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
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
    padding: 10,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  addOptionBtnText: {
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '700',
  },
});
