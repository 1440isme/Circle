import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Compass,
  Plus,
  Trash2,
  X,
  Trophy,
  RotateCw,
} from 'lucide-react-native';
import {
  getWheelsApi,
  createWheelApi,
  spinWheelApi,
  deleteWheelApi,
} from '../../services/circle-tools.service';
import { DecisionWheelEntity } from '@circle/types';

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

export const MobileWheelView: React.FC<MobileWheelViewProps> = ({ circleId }) => {
  const [wheels, setWheels] = useState<DecisionWheelEntity[]>([]);
  const [selectedWheel, setSelectedWheel] = useState<DecisionWheelEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Rotation animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['Ăn phở', 'Cơm tấm', 'Bún chả']);

  const loadWheels = async () => {
    try {
      setIsLoading(true);
      const data = await getWheelsApi(circleId);
      setWheels(data);
      if (data.length > 0 && !selectedWheel) {
        setSelectedWheel(data[0] || null);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải vòng quay');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWheels();
  }, [circleId]);

  const handleSpin = async () => {
    if (!selectedWheel || isSpinning || selectedWheel.options.length < 2) return;

    setIsSpinning(true);
    setWinner(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await spinWheelApi(circleId, selectedWheel.id);
      const targetLabel = result.selectedOption.optionLabel;

      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 8, // 8 full spins
        duration: 3500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setWinner(targetLabel);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    } catch (err: any) {
      setIsSpinning(false);
      Alert.alert('Lỗi', err.message || 'Không thể quay vòng');
    }
  };

  const handleCreateWheel = async () => {
    if (!title.trim() || options.filter((o) => o.trim()).length < 2) {
      Alert.alert('Thông báo', 'Cần nhập tiêu đề và ít nhất 2 phương án');
      return;
    }

    try {
      const validOptions = options
        .filter((o) => o.trim())
        .map((label, idx) => ({
          optionLabel: label.trim(),
          color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        }));

      const res = await createWheelApi(circleId, {
        title: title.trim(),
        options: validOptions,
      });

      setSelectedWheel(res);
      setTitle('');
      setOptions(['Ăn phở', 'Cơm tấm', 'Bún chả']);
      setIsCreateModalOpen(false);
      loadWheels();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo vòng quay');
    }
  };

  const handleDeleteWheel = (wheelId: string) => {
    Alert.alert('Xóa Vòng Quay', 'Bạn có chắc chắn muốn xóa vòng quay này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWheelApi(circleId, wheelId);
            setSelectedWheel(null);
            loadWheels();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể xóa');
          }
        },
      },
    ]);
  };

  const spinInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Vòng Xoay May Mắn</Text>
          <Text style={styles.screenSub}>Chọn ngẫu nhiên công bằng và thú vị</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setIsCreateModalOpen(true)}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#475569" style={{ marginTop: 40 }} />
      ) : selectedWheel ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Wheel Disc Card */}
          <View style={styles.wheelCard}>
            <Text style={styles.wheelTitle}>{selectedWheel.title}</Text>

            {/* Pointer */}
            <Text style={styles.pointer}>▼</Text>

            {/* Rotating Disc */}
            <Animated.View
              style={[
                styles.wheelDisc,
                { transform: [{ rotate: spinInterpolation }] },
              ]}
            >
              <View style={styles.discInner}>
                <Compass size={48} color="#0D9488" />
              </View>
            </Animated.View>

            {/* Winner Announcement */}
            {winner ? (
              <View style={styles.winnerBanner}>
                <Trophy size={18} color="#D97706" />
                <Text style={styles.winnerText}>Kết quả: {winner}</Text>
              </View>
            ) : null}

            {/* Spin CTA */}
            <TouchableOpacity
              style={[styles.spinBtn, isSpinning && { opacity: 0.6 }]}
              disabled={isSpinning}
              onPress={handleSpin}
            >
              <RotateCw size={16} color="#FFFFFF" />
              <Text style={styles.spinBtnText}>
                {isSpinning ? 'Đang quay...' : 'QUAY NGAY'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionHeader}>
              Các phương án ({selectedWheel.options.length})
            </Text>
            <View style={styles.optionsWrap}>
              {selectedWheel.options.map((opt, idx) => (
                <View key={opt.id} style={styles.optionPill}>
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
            <Text style={styles.sectionHeader}>Chọn Vòng Quay</Text>
            <View style={{ gap: 8 }}>
              {wheels.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.wheelItem,
                    selectedWheel.id === w.id && styles.wheelItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedWheel(w);
                    setWinner(null);
                  }}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      selectedWheel.id === w.id && styles.wheelItemTextSelected,
                    ]}
                  >
                    {w.title}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteWheel(w.id)}>
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Compass size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Chưa có Vòng xoay nào</Text>
          <Text style={styles.emptySub}>
            Tạo vòng xoay may mắn để cùng quyết định quán ăn hay điểm hẹn!
          </Text>
          <TouchableOpacity
            style={styles.createEmptyBtn}
            onPress={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.createEmptyText}>Tạo Vòng Quay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Modal */}
      <Modal visible={isCreateModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Vòng Quay Mới</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Chủ đề vòng quay *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Ăn gì trưa nay, Đi đâu cuối tuần..."
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.optHeader}>
                <Text style={styles.label}>Các phương án</Text>
                <TouchableOpacity
                  onPress={() =>
                    setOptions([...options, `Phương án ${options.length + 1}`])
                  }
                >
                  <Text style={styles.addOptLink}>+ Thêm</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 150 }}>
                {options.map((opt, idx) => (
                  <View key={idx} style={styles.optInputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={opt}
                      onChangeText={(val) => {
                        const copy = [...options];
                        copy[idx] = val;
                        setOptions(copy);
                      }}
                    />
                    {options.length > 2 && (
                      <TouchableOpacity
                        onPress={() => setOptions(options.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateWheel}>
                <Text style={styles.submitText}>Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  wheelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wheelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  pointer: {
    fontSize: 22,
    color: '#0F172A',
    marginBottom: -8,
    zIndex: 10,
  },
  wheelDisc: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: '#0D9488',
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  discInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
  },
  winnerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  spinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 16,
  },
  spinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  optionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  switchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wheelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  wheelItemSelected: {
    backgroundColor: '#CCFBF1',
  },
  wheelItemText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  wheelItemTextSelected: {
    fontWeight: '700',
    color: '#0F766E',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  createEmptyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  optHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addOptLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  optInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
