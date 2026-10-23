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
  Heart,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react-native';
import {
  getAnonymousPostsApi,
  createAnonymousPostApi,
  deleteAnonymousPostApi,
} from '../../services/circle-tools.service';
import { AnonymousPostEntity } from '@circle/types';

interface MobileAnonymousViewProps {
  circleId: string;
}

interface MobileTheme {
  id: string;
  name: string;
  bg: string;
  border: string;
  text: string;
  tagBg: string;
  tagText: string;
}

const THEMES: MobileTheme[] = [
  {
    id: 'sunset',
    name: 'Hoàng hôn',
    bg: '#FEF3C7',
    border: '#FDE68A',
    text: '#78350F',
    tagBg: '#FDE68A',
    tagText: '#92400E',
  },
  {
    id: 'ocean',
    name: 'Đại dương',
    bg: '#E0F2FE',
    border: '#BAE6FD',
    text: '#0C4A6E',
    tagBg: '#BAE6FD',
    tagText: '#0369A1',
  },
  {
    id: 'lavender',
    name: 'Oải hương',
    bg: '#F3E8FF',
    border: '#E9D5FF',
    text: '#581C87',
    tagBg: '#E9D5FF',
    tagText: '#7E22CE',
  },
  {
    id: 'rose',
    name: 'Hoa hồng',
    bg: '#FFE4E6',
    border: '#FECDD3',
    text: '#881337',
    tagBg: '#FECDD3',
    tagText: '#BE123C',
  },
  {
    id: 'mint',
    name: 'Bạc hà',
    bg: '#D1FAE5',
    border: '#A7F3D0',
    text: '#064E3B',
    tagBg: '#A7F3D0',
    tagText: '#047857',
  },
];

export const MobileAnonymousView: React.FC<MobileAnonymousViewProps> = ({ circleId }) => {
  const [posts, setPosts] = useState<AnonymousPostEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compose modal
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await getAnonymousPostsApi(circleId);
      setPosts(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải lời nhắn ẩn danh');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [circleId]);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung tâm sự');
      return;
    }

    try {
      await createAnonymousPostApi(circleId, {
        content: content.trim(),
        cardTheme: selectedTheme,
      });

      setContent('');
      setIsComposeModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadPosts();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi tâm sự');
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Gỡ lời nhắn', 'Bạn có chắc chắn muốn gỡ bỏ lời nhắn này khỏi nhóm?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Gỡ bỏ',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnonymousPostApi(circleId, postId);
            loadPosts();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể gỡ bài viết');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Điều Muốn Nói</Text>
          <Text style={styles.screenSub}>Hộp thư tâm sự ẩn danh ấm cúng</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setIsComposeModalOpen(true)}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Gửi lời nhắn</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <ShieldCheck size={18} color="#059669" />
          <Text style={styles.securityText}>
            <Text style={{ fontWeight: '700' }}>Bảo Mật Tuyệt Đối: </Text>
            Lời nhắn được bóc tách 100% danh tính và không lưu vết người gửi trên hệ thống.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#475569" style={{ marginTop: 40 }} />
        ) : posts.length > 0 ? (
          <View style={{ gap: 12 }}>
            {posts.map((post) => {
              const th = THEMES.find((t) => t.id === post.cardTheme) || THEMES[0]!;
              return (
                <View
                  key={post.id}
                  style={[
                    styles.postCard,
                    { backgroundColor: th.bg, borderColor: th.border },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.tag, { backgroundColor: th.tagBg }]}>
                      <Text style={[styles.tagText, { color: th.tagText }]}>
                        Người gửi ẩn danh
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
                      <Trash2 size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.cardContent, { color: th.text }]}>
                    {post.content}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={11} color="#64748B" />
                      <Text style={styles.footerText}>Điều muốn nói</Text>
                    </View>
                    <Text style={styles.footerText}>
                      {new Date(post.postedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Heart size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Hộp thư đang trống</Text>
            <Text style={styles.emptySub}>
              Hãy là người đầu tiên gửi lời cảm ơn hoặc tâm sự ẩn danh đến vòng tròn!
            </Text>
            <TouchableOpacity
              style={styles.createEmptyBtn}
              onPress={() => setIsComposeModalOpen(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createEmptyText}>Gửi Tâm Sự Ngay</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Compose Modal */}
      <Modal visible={isComposeModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gửi Lời Nhắn Ẩn Danh</Text>
              <TouchableOpacity onPress={() => setIsComposeModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Theme Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Màu thiệp trang trí</Text>
              <View style={styles.themesRow}>
                {THEMES.map((th) => (
                  <TouchableOpacity
                    key={th.id}
                    style={[
                      styles.themeBtn,
                      { backgroundColor: th.bg, borderColor: th.border },
                      selectedTheme === th.id && styles.themeBtnSelected,
                    ]}
                    onPress={() => setSelectedTheme(th.id)}
                  >
                    <Text style={[styles.themeBtnText, { color: th.text }]}>
                      {th.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nội dung tâm sự *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Viết điều bạn muốn nhắn nhủ một cách chân thành..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                maxLength={1000}
                value={content}
                onChangeText={setContent}
              />
              <Text style={styles.charCount}>{content.length}/1000 ký tự</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsComposeModalOpen(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreatePost}>
                <Send size={14} color="#FFFFFF" />
                <Text style={styles.submitText}>Gửi lời nhắn</Text>
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
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 10,
    color: '#64748B',
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
    marginBottom: 6,
  },
  themesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeBtnSelected: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  themeBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
