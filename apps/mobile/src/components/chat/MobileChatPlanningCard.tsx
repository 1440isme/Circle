import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  FileSpreadsheet,
  Wallet,
  CheckSquare,
  Compass,
  LayoutList,
  ChevronRight,
} from 'lucide-react-native';
import { PlanningSheetMessagePayload } from '@circle/types';
import { formatVnd } from '@circle/shared';
import { ColorTheme } from '../../constants/theme';
import { useLanguageStore } from '../../stores/language.store';

interface MobileChatPlanningCardProps {
  payload: PlanningSheetMessagePayload;
  colors: ColorTheme;
  isDark: boolean;
  onPressSheet?: (sheetId: string) => void;
}

export const MobileChatPlanningCard: React.FC<MobileChatPlanningCardProps> = ({
  payload,
  colors,
  isDark,
  onPressSheet,
}) => {
  const { t } = useLanguageStore();

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <Wallet size={18} color="#10b981" />;
      case 'packing':
        return <CheckSquare size={18} color="#0284c7" />;
      case 'trip':
        return <Compass size={18} color="#f59e0b" />;
      case 'task':
        return <LayoutList size={18} color="#8b5cf6" />;
      default:
        return <FileSpreadsheet size={18} color={colors.primary} />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPressSheet && onPressSheet(payload.sheetId)}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#ffffff',
          borderColor: colors.hairline,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: colors.wash }]}>
            {getTemplateIcon(payload.templateType)}
          </View>
          <View style={styles.titleBox}>
            <Text style={[styles.eyebrow, { color: colors.sage }]}>
              {t.collab.planningTitle}
            </Text>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {payload.title}
            </Text>
          </View>
        </View>
        <ChevronRight size={16} color={colors.subtle} />
      </View>

      {/* Progress or Fund display */}
      {payload.totalVnd !== undefined && payload.totalVnd > 0 ? (
        <View style={[styles.fundBox, { backgroundColor: colors.wash }]}>
          <Text style={[styles.totalVnd, { color: '#10b981' }]}>
            {formatVnd(payload.totalVnd)}
          </Text>
          <Text style={[styles.splitVnd, { color: colors.subtle }]}>
            {formatVnd(payload.splitPerPerson || 0)}/{t.collab.perPerson}
          </Text>
        </View>
      ) : payload.completionPercent !== undefined ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={[styles.progressCount, { color: colors.subtle }]}>
              {payload.completedItems || 0}/{payload.totalItems || 0} {t.collab.completed}
            </Text>
            <Text style={[styles.progressPct, { color: colors.sage }]}>
              {payload.completionPercent}%
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.hairline }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${payload.completionPercent}%`,
                  backgroundColor: colors.sage,
                },
              ]}
            />
          </View>
        </View>
      ) : (
        <Text style={[styles.summaryText, { color: colors.subtle }]}>
          {payload.summaryText}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginVertical: 4,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  fundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  totalVnd: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  splitVnd: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    gap: 5,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCount: {
    fontSize: 11,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  summaryText: {
    fontSize: 12,
  },
});
