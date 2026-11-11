import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  KeyboardAvoidingView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Compass,
  Plus,
  Trash2,
  X,
  Trophy,
  RotateCw,
  Check,
} from 'lucide-react-native';
import {
  getWheelsApi,
  createWheelApi,
  spinWheelApi,
  deleteWheelApi,
} from '../../services/circle-tools.service';
import { DecisionWheelEntity } from '@circle/types';
import { ColorTheme } from '../../constants/theme';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

interface MobileWheelViewProps {
  circleId: string;
}

const DEFAULT_COLORS = [
  '#F87171',
  '#FB923C',
  '#FBBF24',
  '#34D399',
  '#60A5FA',
  '#818CF8',
  '#A78BFA',
  '#F472B6',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function createSlicePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export const MobileWheelView: React.FC<MobileWheelViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(264, Math.max(210, width - 96));
  const topClearance = Math.max(insets.top + 52, Platform.OS === 'ios' ? 74 : 64);
  const bottomClearance = Math.max(insets.bottom + 16, 24);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [wheels, setWheels] = useState<DecisionWheelEntity[]>([]);
  const [selectedWheel, setSelectedWheel] = useState<DecisionWheelEntity | null>(null);
  const selectedWheelIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Inline feedback & 2-step delete confirmation (zero Alert.alert)
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDeleteWheelId, setConfirmDeleteWheelId] = useState<string | null>(null);
  const [isDeletingWheelId, setIsDeletingWheelId] = useState<string | null>(null);

  // Cumulative rotation in degrees (matches target slice precisely under top pointer)
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const currentRotationDegRef = useRef(0);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>([
    t.collab.wheelDefaultOption1,
    t.collab.wheelDefaultOption2,
    t.collab.wheelDefaultOption3,
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    selectedWheelIdRef.current = selectedWheel?.id || null;
  }, [selectedWheel]);

  const showNotice = (message: string, type: 'success' | 'error' = 'error') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusNotice({ type, message });
    statusTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const loadWheels = async (preferredId?: string, silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await getWheelsApi(circleId);
      setWheels(data);
      const targetId = preferredId || selectedWheelIdRef.current;
      const matched = targetId ? data.find((w) => w.id === targetId) : undefined;
      setSelectedWheel(matched || data[0] || null);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadWheelError, 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedWheel(null);
    setWinner(null);
    setConfirmDeleteWheelId(null);
    currentRotationDegRef.current = 0;
    rotateAnim.setValue(0);
    loadWheels();
  }, [circleId]);

  const handleSpin = async () => {
    if (!selectedWheel || isSpinning || selectedWheel.options.length < 2) return;

    setIsSpinning(true);
    setWinner(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await spinWheelApi(circleId, selectedWheel.id);
      const selectedOption = result.selectedOption;
      const targetLabel = selectedOption.optionLabel;

      const numOptions = selectedWheel.options.length;
      const sliceDeg = 360 / numOptions;
      const matchedIndex = selectedWheel.options.findIndex(
        (o) => o.id === selectedOption.id || o.optionLabel === targetLabel,
      );
      const targetIndex = Math.max(0, matchedIndex);

      // Slice i midpoint at 0 deg rotation is at (-90 + (i + 0.5) * sliceDeg).
      // Pointer is at top (-90 deg), so clockwise rotation R aligns slice i midpoint when:
      // ((i + 0.5) * sliceDeg + R) % 360 === 0
      const jitter = (Math.random() - 0.5) * sliceDeg * 0.45;
      const targetMod = (360 - (((targetIndex + 0.5) * sliceDeg + jitter) % 360) + 360) % 360;
      const currentDeg = currentRotationDegRef.current;
      const currentMod = ((currentDeg % 360) + 360) % 360;
      const forwardDelta = (targetMod - currentMod + 360) % 360;
      const nextDeg = currentDeg + 6 * 360 + forwardDelta;

      currentRotationDegRef.current = nextDeg;
      Animated.timing(rotateAnim, {
        toValue: nextDeg,
        duration: 3800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        setIsSpinning(false);
        if (finished) {
          setWinner(targetLabel);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });
    } catch (err: any) {
      setIsSpinning(false);
      showNotice(err?.message || t.collab.spinWheelError, 'error');
    }
  };

  const handleOpenCreateModal = () => {
    setFormError(null);
    setTitle('');
    setOptions([
      t.collab.wheelDefaultOption1,
      t.collab.wheelDefaultOption2,
      t.collab.wheelDefaultOption3,
    ]);
    setIsCreateModalOpen(true);
  };

  const handleCreateWheel = async () => {
    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!title.trim() || trimmedOptions.length < 2) {
      setFormError(t.collab.wheelValidationMin);
      return;
    }

    try {
      setIsCreating(true);
      setFormError(null);
      const validOptions = trimmedOptions.map((label, idx) => ({
        optionLabel: label,
        color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      }));

      const res = await createWheelApi(circleId, {
        title: title.trim(),
        options: validOptions,
      });

      setSelectedWheel(res);
      setWinner(null);
      currentRotationDegRef.current = 0;
      rotateAnim.setValue(0);
      setTitle('');
      setOptions([
        t.collab.wheelDefaultOption1,
        t.collab.wheelDefaultOption2,
        t.collab.wheelDefaultOption3,
      ]);
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadWheels(res.id, true);
    } catch (err: any) {
      setFormError(err?.message || t.collab.createWheelError);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDeleteWheel = async (wheelId: string) => {
    if (isDeletingWheelId) return;
    try {
      setIsDeletingWheelId(wheelId);
      await deleteWheelApi(circleId, wheelId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmDeleteWheelId(null);
      if (selectedWheel?.id === wheelId) {
        setSelectedWheel(null);
        setWinner(null);
        currentRotationDegRef.current = 0;
        rotateAnim.setValue(0);
      }
      await loadWheels(undefined, true);
    } catch (err: any) {
      showNotice(err?.message || t.collab.deleteWheelError, 'error');
    } finally {
      setIsDeletingWheelId(null);
    }
  };

  const spinInterpolation = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const renderSvgWheel = (wheel: DecisionWheelEntity) => {
    const opts = wheel.options || [];
    const numOptions = opts.length;
    const viewSize = 260;
    const cx = viewSize / 2;
    const cy = viewSize / 2;
    const radius = 122;
    const sliceDeg = numOptions > 0 ? 360 / numOptions : 360;

    return (
      <Svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${viewSize} ${viewSize}`}>
        <G>
          {numOptions <= 1 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={opts[0]?.color || DEFAULT_COLORS[0]}
              stroke={colors.surface}
              strokeWidth={3}
            />
          ) : (
            opts.map((opt, idx) => {
              const startDeg = idx * sliceDeg - 90;
              const endDeg = (idx + 1) * sliceDeg - 90;
              const midDeg = startDeg + sliceDeg / 2;
              const fillColor = opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
              const rawLabel = opt.optionLabel || '';
              const label = rawLabel.length > 12 ? `${rawLabel.slice(0, 11)}…` : rawLabel;

              // Flip text 180 deg when slice is in left hemisphere so labels stay readable
              const normMid = ((midDeg % 360) + 360) % 360;
              const isLeftHalf = normMid > 90 && normMid < 270;
              const textPos = polarToCartesian(cx, cy, radius * 0.62, midDeg);
              const textRotation = isLeftHalf ? midDeg + 180 : midDeg;

              return (
                <G key={opt.id || idx}>
                  <Path
                    d={createSlicePath(cx, cy, radius, startDeg, endDeg)}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={textPos.x}
                    y={textPos.y}
                    fill="#131316"
                    fontSize={numOptions > 8 ? '10' : '11.5'}
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="central"
                    transform={`rotate(${textRotation}, ${textPos.x}, ${textPos.y})`}
                  >
                    {label}
                  </SvgText>
                </G>
              );
            })
          )}
          {/* Outer rim highlight & center hub */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={colors.hairline}
            strokeWidth={3}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={24}
            fill={colors.surface}
            stroke={colors.hairline}
            strokeWidth={3}
          />
          <Circle cx={cx} cy={cy} r={8} fill={colors.sage} />
        </G>
      </Svg>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {statusNotice ? (
        <View pointerEvents="box-none" style={[styles.noticeWrapper, { top: topClearance + 4 }]}>
          <View
            style={[
              styles.noticeBanner,
              {
                backgroundColor: colors.surface,
                borderColor: statusNotice.type === 'success' ? colors.sage : '#DC2626',
              },
            ]}
          >
            {statusNotice.type === 'success' ? (
              <Check size={14} color={colors.sage} />
            ) : (
              <X size={14} color="#DC2626" />
            )}
            <Text style={[styles.noticeText, { color: colors.text }]} numberOfLines={2}>
              {statusNotice.message}
            </Text>
            <TouchableOpacity
              onPress={() => setStatusNotice(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t.common.close}
            >
              <X size={14} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Scroll-under Content Layer */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      ) : selectedWheel ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: topClearance + 8, paddingBottom: bottomClearance + 76 },
          ]}
        >
          {/* Wheel Disc Card */}
          <View
            style={[
              styles.wheelCard,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <Text style={[styles.wheelTitle, { color: colors.text }]}>{selectedWheel.title}</Text>

            {/* Pointer */}
            <Text style={[styles.pointer, { color: colors.sage }]}>▼</Text>

            {/* Rotating Proportional SVG Wheel */}
            <Animated.View
              style={{
                width: wheelSize,
                height: wheelSize,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: spinInterpolation }],
              }}
            >
              {renderSvgWheel(selectedWheel)}
            </Animated.View>

            {/* Winner Announcement */}
            {winner ? (
              <View
                style={[
                  styles.winnerBanner,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.35)' : '#FDE68A',
                  },
                ]}
              >
                <Trophy size={18} color={isDark ? '#FBBF24' : '#B45309'} />
                <Text style={[styles.winnerText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                  {t.collab.wheelResultLabel.replace('{winner}', winner)}
                </Text>
              </View>
            ) : null}

            {/* Spin CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.spinBtn,
                { backgroundColor: colors.primary },
                isSpinning && { opacity: 0.65 },
              ]}
              disabled={isSpinning}
              onPress={handleSpin}
            >
              <RotateCw size={16} color={colors.onPrimary} />
              <Text style={[styles.spinBtnText, { color: colors.onPrimary }]}>
                {isSpinning ? t.collab.spinning : t.collab.spinAction}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionHeader}>
              {t.collab.wheelOptionsTitle.replace(
                '{count}',
                String(selectedWheel.options.length),
              )}
            </Text>
            <View style={styles.optionsWrap}>
              {selectedWheel.options.map((opt, idx) => (
                <View key={opt.id || idx} style={styles.optionPill}>
                  <View
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor:
                          opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                      },
                    ]}
                  />
                  <Text style={styles.optionText}>{opt.optionLabel}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Wheel Switcher */}
          <View style={styles.switchSection}>
            <Text style={styles.sectionHeader}>
              {t.collab.wheelListTitle.replace('{count}', String(wheels.length))}
            </Text>
            <View style={{ gap: 8 }}>
              {wheels.map((w) => {
                const isSelected = selectedWheel.id === w.id;
                const isConfirmingDelete = confirmDeleteWheelId === w.id;

                return (
                  <View key={w.id} style={{ gap: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.wheelItem,
                        {
                          backgroundColor: isSelected ? colors.wash : colors.canvas,
                          borderColor: isSelected ? colors.sage : colors.hairline,
                        },
                      ]}
                      onPress={() => {
                        if (isSpinning) return;
                        setSelectedWheel(w);
                        setWinner(null);
                        setConfirmDeleteWheelId(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.wheelItemText,
                          { color: isSelected ? colors.sage : colors.text },
                          isSelected && { fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {w.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setConfirmDeleteWheelId((prev) => (prev === w.id ? null : w.id))
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={t.collab.wheelDeleteTitle}
                      >
                        <Trash2 size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </TouchableOpacity>

                    {isConfirmingDelete && (
                      <View
                        style={[
                          styles.inlineDeleteRow,
                          { backgroundColor: colors.canvas, borderColor: '#DC2626' },
                        ]}
                      >
                        <Text style={[styles.inlineDeleteText, { color: colors.text }]}>
                          {t.collab.deleteWheelConfirm}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => setConfirmDeleteWheelId(null)}
                            disabled={isDeletingWheelId === w.id}
                            style={[styles.inlineCancelBtn, { borderColor: colors.hairline }]}
                          >
                            <Text style={[styles.inlineCancelText, { color: colors.text }]}>
                              {t.common.cancel}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleConfirmDeleteWheel(w.id)}
                            disabled={isDeletingWheelId === w.id}
                            style={styles.inlineConfirmDelBtn}
                          >
                            {isDeletingWheelId === w.id ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.inlineConfirmDelText}>{t.common.delete}</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.emptyContainer, { backgroundColor: colors.canvas, paddingTop: topClearance }]}>
          <Compass size={48} color={colors.subtle} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t.collab.wheelEmptyTitle}
          </Text>
          <Text style={[styles.emptySub, { color: colors.subtle }]}>
            {t.collab.wheelEmptyDesc}
          </Text>
          <TouchableOpacity
            style={[styles.createEmptyBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpenCreateModal}
          >
            <Plus size={16} color={colors.onPrimary} />
            <Text style={[styles.createEmptyText, { color: colors.onPrimary }]}>
              {t.collab.createWheel}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenCreateModal}
        style={[
          styles.fab,
          {
            bottom: bottomClearance,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        accessibilityLabel={t.collab.createWheel}
      >
        <Plus size={18} color={colors.onPrimary} />
        <Text style={[styles.fabText, { color: colors.onPrimary }]}>{t.collab.createWheel}</Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
                paddingBottom: bottomClearance,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.collab.wheelCreateModalTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t.common.close}
              >
                <X size={20} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.collab.wheelTopicLabel}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.canvas,
                    borderColor: colors.hairline,
                    color: colors.text,
                  },
                ]}
                placeholder={t.collab.wheelTopicPlaceholder}
                placeholderTextColor={colors.subtle}
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (formError) setFormError(null);
                }}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.optHeader}>
                <Text style={styles.label}>{t.collab.wheelMinOptionsLabel}</Text>
                {options.length < 12 && (
                  <TouchableOpacity
                    onPress={() =>
                      setOptions([
                        ...options,
                        t.collab.wheelItemPlaceholder.replace(
                          '{index}',
                          String(options.length + 1),
                        ),
                      ])
                    }
                  >
                    <Text style={[styles.addOptLink, { color: colors.sage }]}>
                      + {t.collab.addItem}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={{ maxHeight: 190 }} keyboardShouldPersistTaps="handled">
                {options.map((opt, idx) => (
                  <View key={idx} style={styles.optInputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          backgroundColor: colors.canvas,
                          borderColor: colors.hairline,
                          color: colors.text,
                        },
                      ]}
                      value={opt}
                      onChangeText={(val) => {
                        const copy = [...options];
                        copy[idx] = val;
                        setOptions(copy);
                        if (formError) setFormError(null);
                      }}
                      placeholder={t.collab.wheelItemPlaceholder.replace(
                        '{index}',
                        String(idx + 1),
                      )}
                      placeholderTextColor={colors.subtle}
                    />
                    {options.length > 2 && (
                      <TouchableOpacity
                        onPress={() => setOptions(options.filter((_, i) => i !== idx))}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel={t.common.delete}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>

            {formError ? (
              <Text style={[styles.inlineErrorText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                {formError}
              </Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={isCreating}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                disabled={isCreating}
                onPress={handleCreateWheel}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                    {t.collab.wheelCreateSubmit}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noticeWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 60,
    },
    noticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      paddingHorizontal: 16,
      gap: 16,
    },
    fab: {
      position: 'absolute',
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 999,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.22,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 20,
    },
    fabText: {
      fontSize: 13,
      fontWeight: '700',
    },
    wheelCard: {
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
    },
    wheelTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
      textAlign: 'center',
    },
    pointer: {
      fontSize: 22,
      marginBottom: -8,
      zIndex: 10,
    },
    winnerBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 16,
    },
    winnerText: {
      fontSize: 13,
      fontWeight: '700',
    },
    spinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 26,
      paddingVertical: 12,
      borderRadius: 999,
      marginTop: 18,
    },
    spinBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    optionsSection: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.subtle,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    optionsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.canvas,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    colorDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    optionText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    switchSection: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    wheelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      gap: 10,
    },
    wheelItemText: {
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
    },
    inlineDeleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      gap: 8,
    },
    inlineDeleteText: {
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
    inlineCancelBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
    },
    inlineCancelText: {
      fontSize: 11,
      fontWeight: '600',
    },
    inlineConfirmDelBtn: {
      backgroundColor: '#DC2626',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 56,
      alignItems: 'center',
    },
    inlineConfirmDelText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 12,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 18,
    },
    createEmptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 999,
      marginTop: 16,
    },
    createEmptyText: {
      fontSize: 13,
      fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 8,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    formGroup: {
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtle,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13,
    },
    optHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    addOptLink: {
      fontSize: 12,
      fontWeight: '700',
    },
    optInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 4,
    },
    inlineErrorText: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    cancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    cancelText: {
      fontSize: 13,
      color: colors.subtle,
      fontWeight: '600',
    },
    submitBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      minWidth: 100,
      alignItems: 'center',
    },
    submitText: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
