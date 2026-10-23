import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Vote,
  Plus,
  Trash2,
  Lock,
  Check,
  X,
  Clock,
  Users,
} from 'lucide-react-native';
import {
  getPollsApi,
  createPollApi,
  votePollApi,
  closePollApi,
  deletePollApi,
} from '../../services/circle-tools.service';
import { GroupPollEntity } from '@circle/types';

interface MobilePollViewProps {
  circleId: string;
}

export const MobilePollView: React.FC<MobilePollViewProps> = ({ circleId }) => {
  const [polls, setPolls] = useState<GroupPollEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal: Create Poll
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const loadPolls = async () => {
    try {
      setIsLoading(true);
      const data = await getPollsApi(circleId);
      setPolls(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách bình chọn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, [circleId]);

  const handleAddOptionField = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async () => {
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim() || validOptions.length < 2) {
      Alert.alert('Thông báo', 'Vui lòng nhập câu hỏi và tối thiểu 2 lựa chọn');
      return;
    }

    try {
      await createPollApi(circleId, {
        question: question.trim(),
        options: validOptions,
      });
      setQuestion('');
      setOptions(['', '']);
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadPolls();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo bình chọn');
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await votePollApi(circleId, pollId, { optionId });
      loadPolls();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể bỏ phiếu');
    }
  };

  const handleClosePoll = async (pollId: string) => {
    Alert.alert('Đóng bình chọn', 'Thành viên sẽ không thể bỏ phiếu thêm.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đóng',
        onPress: async () => {
          try {
            await closePollApi(circleId, pollId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadPolls();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể đóng bình chọn');
          }
        },
      },
    ]);
  };

  const handleDeletePoll = async (pollId: string) => {
    Alert.alert('Xóa bình chọn', 'Bạn có chắc chắn muốn xóa cuộc bình chọn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePollApi(circleId, pollId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadPolls();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể xóa bình chọn');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Bình Chọn Nhóm (Poll)</Text>
          <Text style={styles.subtitle}>
            Thăm dò ý kiến và biểu quyết tập thể
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={styles.createButton}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.createButtonText}>Tạo poll</Text>
        </TouchableOpacity>
      </View>

      {/* Polls List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : polls.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Vote size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Chưa có cuộc bình chọn nào</Text>
          <Text style={styles.emptySubtitle}>
            Tạo bình chọn để nhóm cùng chọn quán ăn, thời gian họp mặt hoặc lấy ý kiến chung.
          </Text>
          <TouchableOpacity
            onPress={() => setIsCreateModalOpen(true)}
            style={styles.emptyCreateBtn}
          >
            <Text style={styles.emptyCreateBtnText}>Tạo bình chọn ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollList} contentContainerStyle={styles.listContent}>
          {polls.map((poll) => {
            const isClosed = poll.isClosed;

            return (
              <View key={poll.id} style={styles.pollCard}>
                {/* Header row */}
                <View style={styles.pollCardHeader}>
                  <View style={styles.statusBadgeRow}>
                    {isClosed ? (
                      <View style={styles.closedBadge}>
                        <Lock size={10} color="#64748B" />
                        <Text style={styles.closedBadgeText}>Đã kết thúc</Text>
                      </View>
                    ) : (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Đang bình chọn</Text>
                      </View>
                    )}
                    <Text style={styles.voteCountText}>{poll.totalVotes} lượt vote</Text>
                  </View>

                  <View style={styles.cardActions}>
                    {!isClosed && (
                      <TouchableOpacity
                        onPress={() => handleClosePoll(poll.id)}
                        style={styles.iconBtn}
                      >
                        <Lock size={14} color="#64748B" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeletePoll(poll.id)}
                      style={styles.iconBtn}
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Question */}
                <Text style={styles.pollQuestion}>{poll.question}</Text>

                {/* Options */}
                <View style={styles.optionsList}>
                  {poll.options.map((opt) => {
                    const isSelected = poll.userVotedOptionId === opt.id;

                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.8}
                        disabled={isClosed}
                        onPress={() => handleVote(poll.id, opt.id)}
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                        ]}
                      >
                        {/* Progress bar background */}
                        <View
                          style={[
                            styles.optionProgressFill,
                            { width: `${opt.percentage}%` },
                            isSelected && styles.optionProgressFillSelected,
                          ]}
                        />

                        <View style={styles.optionContent}>
                          <View style={styles.optionLeft}>
                            <View
                              style={[
                                styles.optionCheck,
                                isSelected && styles.optionCheckSelected,
                              ]}
                            >
                              {isSelected && <Check size={10} color="#FFF" />}
                            </View>
                            <Text
                              style={[
                                styles.optionText,
                                isSelected && styles.optionTextSelected,
                              ]}
                            >
                              {opt.optionText}
                            </Text>
                          </View>

                          <Text style={styles.optionPercent}>
                            {opt.voteCount} ({opt.percentage}%)
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Footer info */}
                <View style={styles.pollFooter}>
                  <Text style={styles.pollCreator}>
                    Tạo bởi {poll.creator?.user?.profile?.displayName || 'Thành viên'}
                  </Text>
                  <Text style={styles.pollDate}>
                    {new Date(poll.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal: Create Poll */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo Cuộc Bình Chọn Mới</Text>
            <TextInput
              style={styles.input}
              value={question}
              onChangeText={setQuestion}
              placeholder="Nhập câu hỏi bình chọn..."
              placeholderTextColor="#94A3B8"
              autoFocus
            />

            <Text style={styles.inputSectionTitle}>Phương án lựa chọn</Text>
            <View style={styles.optionsInputGroup}>
              {options.map((opt, idx) => (
                <View key={idx} style={styles.optionInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={opt}
                    onChangeText={(val) => handleOptionChange(idx, val)}
                    placeholder={`Lựa chọn ${idx + 1}`}
                    placeholderTextColor="#94A3B8"
                  />
                  {options.length > 2 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveOptionField(idx)}
                      style={styles.removeOptionBtn}
                    >
                      <X size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {options.length < 6 && (
              <TouchableOpacity
                onPress={handleAddOptionField}
                style={styles.addOptionBtn}
              >
                <Plus size={12} color="#F59E0B" />
                <Text style={styles.addOptionBtnText}>Thêm lựa chọn</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreatePoll}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>Tạo poll</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyCreateBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  pollCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pollCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  closedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  voteCountText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 4,
  },
  pollQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
    marginBottom: 12,
  },
  optionCard: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  optionProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#CBD5E1',
    opacity: 0.3,
  },
  optionProgressFillSelected: {
    backgroundColor: '#F59E0B',
    opacity: 0.25,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    zIndex: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  optionCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  optionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#B45309',
    fontWeight: '700',
  },
  optionPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  pollCreator: {
    fontSize: 10,
    color: '#94A3B8',
  },
  pollDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  optionsInputGroup: {
    gap: 6,
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeOptionBtn: {
    padding: 6,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  addOptionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
});
