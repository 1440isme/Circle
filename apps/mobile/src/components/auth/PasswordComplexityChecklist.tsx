import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { checkPasswordRequirements } from '@circle/shared';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

interface PasswordComplexityChecklistProps {
  password: string;
  confirmPassword?: string;
  showMatch?: boolean;
}

export const PasswordComplexityChecklist: React.FC<PasswordComplexityChecklistProps> = ({
  password,
  confirmPassword,
  showMatch = false,
}) => {
  const { colors } = useThemeStore();
  const { t } = useLanguageStore();

  const reqs = checkPasswordRequirements(password);
  const isMatch = Boolean(confirmPassword && password === confirmPassword);

  const criteria = [
    { key: 'minLength', label: t.validation.passwordMinLength, valid: reqs.minLength },
    { key: 'hasUpper', label: t.validation.passwordUppercase, valid: reqs.hasUpper },
    { key: 'hasLower', label: t.validation.passwordLowercase, valid: reqs.hasLower },
    { key: 'hasNumber', label: t.validation.passwordNumber, valid: reqs.hasNumber },
    { key: 'hasSpecial', label: t.validation.passwordSpecialChar, valid: reqs.hasSpecial },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `${colors.wash}60`, borderColor: colors.hairline },
      ]}
    >
      <Text style={[styles.title, { color: colors.subtle }]}>
        {t.auth.passwordStrength}
      </Text>

      <View style={styles.list}>
        {criteria.map((item) => (
          <View key={item.key} style={styles.item}>
            <CheckCircle2
              size={14}
              color={item.valid ? colors.primary : colors.subtle}
            />
            <Text
              style={[
                styles.itemText,
                { color: item.valid ? colors.text : colors.subtle },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}

        {showMatch && confirmPassword !== undefined && confirmPassword.length > 0 && (
          <View style={[styles.item, styles.matchItem, { borderTopColor: colors.hairline }]}>
            {isMatch ? (
              <CheckCircle2 size={14} color={colors.primary} />
            ) : (
              <XCircle size={14} color={colors.coral} />
            )}
            <Text
              style={[
                styles.itemText,
                { color: isMatch ? colors.primary : colors.coral, fontWeight: '600' },
              ]}
            >
              {isMatch ? t.auth.passwordMatch : t.auth.passwordMismatch}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  list: {
    gap: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchItem: {
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
