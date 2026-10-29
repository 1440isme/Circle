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
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  FileSpreadsheet,
  Plus,
  ArrowLeft,
  Trash2,
  X,
  Check,
  Edit2,
  Table,
} from 'lucide-react-native';
import {
  getPlanningSheetsApi,
  getPlanningSheetDetailApi,
  createPlanningSheetApi,
  addSheetColumnApi,
  addSheetRowApi,
  updateSheetCellApi,
  deletePlanningSheetApi,
} from '../../services/circle-tools.service';
import { PlanningSheetEntity, SheetCellEntity } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

interface MobilePlanningViewProps {
  circleId: string;
}

const { width } = Dimensions.get('window');

export const MobilePlanningView: React.FC<MobilePlanningViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();
  const [sheets, setSheets] = useState<PlanningSheetEntity[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<PlanningSheetEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal: Create Sheet
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Modal: Add Column
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Modal: Edit Cell
  const [editingCell, setEditingCell] = useState<{
    cellId: string;
    columnTitle: string;
    value: string;
  } | null>(null);

  const loadSheets = async () => {
    try {
      setIsLoading(true);
      const data = await getPlanningSheetsApi(circleId);
      setSheets(data);
    } catch (err: any) {
      Alert.alert(t.common?.error || 'Lỗi', err.message || t.collab?.loadSheetsError || 'Không thể tải bảng');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetDetail = async (sheetId: string) => {
    try {
      setIsLoading(true);
      const data = await getPlanningSheetDetailApi(circleId, sheetId);
      setSelectedSheet(data);
    } catch (err: any) {
      Alert.alert(t.common?.error || 'Lỗi', err.message || t.collab?.loadSheetDetailError || 'Không thể tải chi tiết');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSheets();
  }, [circleId]);

  const handleCreateSheet = async () => {
    if (!newTitle.trim()) {
      Alert.alert(t.common?.notice || 'Thông báo', t.collab?.enterSheetTitleError || 'Vui lòng nhập tên bảng');
      return;
    }

    try {
      const created = await createPlanningSheetApi(circleId, {
        title: newTitle.trim(),
      });
      setNewTitle('');
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadSheets();
      setSelectedSheet(created);
    } catch (err: any) {
      Alert.alert(t.common?.error || 'Lỗi', err.message || t.collab?.createSheetError || 'Lỗi');
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !selectedSheet) return;

    try {
      const updated = await addSheetColumnApi(circleId, selectedSheet.id, {
        columnTitle: newColumnTitle.trim(),
      });
      setNewColumnTitle('');
      setIsAddColumnModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedSheet(updated);
    } catch (err: any) {
      Alert.alert(t.common?.error || 'Lỗi', err.message || t.collab?.addColumnError || 'Lỗi');
    }
  };

  const handleAddRow = async () => {
    if (!selectedSheet) return;

    try {
      const updated = await addSheetRowApi(circleId, selectedSheet.id, {});
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedSheet(updated);
    } catch (err: any) {
      Alert.alert(t.common?.error || 'Lỗi', err.message || t.collab?.addRowError || 'Lỗi');
    }
  };

  const handleSaveCell = async () => {
    if (!editingCell || !selectedSheet) return;

    try {
      await updateSheetCellApi(circleId, selectedSheet.id, editingCell.cellId, {
        cellValue: editingCell.value,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reload sheet detail
      loadSheetDetail(selectedSheet.id);
      setEditingCell(null);
    } catch (err: any) {
      Alert.alert(t.common?.error || 'Lỗi', err.message || t.collab?.updateCellError || 'Lỗi');
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    Alert.alert(
      t.collab?.deleteSheet || 'Xác nhận xóa',
      t.collab?.deleteSheetConfirm || 'Bạn có chắc chắn muốn xóa bảng kế hoạch này?',
      [
        { text: t.common?.cancel || 'Hủy', style: 'cancel' },
        {
          text: t.common?.delete || 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlanningSheetApi(circleId, sheetId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelectedSheet(null);
              loadSheets();
            } catch (err: any) {
              Alert.alert(t.common?.error || 'Lỗi', err.message || t.collab?.deleteSheetError || 'Lỗi');
            }
          },
        },
      ],
    );
  };

  // =========================================================================
  // VIEW: SHEET DETAIL (INTERACTIVE SPREADSHEET MATRIX)
  // =========================================================================
  if (selectedSheet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        {/* Header Bar */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }]}>
          <TouchableOpacity
            onPress={() => setSelectedSheet(null)}
            style={styles.backButton}
          >
            <ArrowLeft size={18} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Danh sách</Text>
          </TouchableOpacity>

          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => setIsAddColumnModalOpen(true)}
              style={[styles.actionBtnSecondary, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
            >
              <Plus size={14} color={colors.text} />
              <Text style={[styles.actionBtnTextSec, { color: colors.text }]}>+ Cột</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddRow}
              style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
            >
              <Plus size={14} color="#FFF" />
              <Text style={styles.actionBtnTextPri}>+ Dòng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteSheet(selectedSheet.id)}
              style={styles.deleteBtn}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sheet Title */}
        <View style={[styles.sheetTitleHeader, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }]}>
          <FileSpreadsheet size={20} color={colors.primary} />
          <Text style={[styles.sheetTitleText, { color: colors.text }]} numberOfLines={1}>
            {selectedSheet.title}
          </Text>
        </View>

        {/* Spreadsheet Horizontal & Vertical Scroll Grid */}
        <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={[styles.table, { borderColor: colors.hairline }]}>
              {/* Header Row */}
              <View style={[styles.tableHeaderRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderBottomColor: colors.hairline }]}>
                <View style={[styles.headerCell, styles.indexCell, { borderRightColor: colors.hairline }]}>
                  <Text style={[styles.headerCellText, { color: colors.subtle }]}>#</Text>
                </View>
                {selectedSheet.columns.map((col) => (
                  <View key={col.id} style={[styles.headerCell, { borderRightColor: colors.hairline }]}>
                    <Text style={[styles.headerCellText, { color: colors.text }]} numberOfLines={1}>
                      {col.columnTitle}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {selectedSheet.rows.length === 0 ? (
                <View style={styles.emptyTableNotice}>
                  <Text style={[styles.emptyTableText, { color: colors.subtle }]}>
                    Chưa có dòng nào. Bấm "+ Dòng" để thêm dữ liệu.
                  </Text>
                </View>
              ) : (
                selectedSheet.rows.map((row, rIdx) => (
                  <View key={row.id} style={[styles.tableDataRow, { borderBottomColor: colors.hairline }]}>
                    <View style={[styles.dataCell, styles.indexCell, { borderRightColor: colors.hairline, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}>
                      <Text style={[styles.indexCellText, { color: colors.subtle }]}>{rIdx + 1}</Text>
                    </View>
                    {selectedSheet.columns.map((col) => {
                      const cell = row.cells.find((c) => c.columnId === col.id);
                      return (
                        <TouchableOpacity
                          key={col.id}
                          activeOpacity={0.7}
                          onPress={() =>
                            cell &&
                            setEditingCell({
                              cellId: cell.id,
                              columnTitle: col.columnTitle,
                              value: cell.cellValue || '',
                            })
                          }
                          style={[styles.dataCell, { borderRightColor: colors.hairline, backgroundColor: colors.surface }]}
                        >
                          <Text
                            style={[
                              styles.dataCellText,
                              { color: colors.text },
                              !cell?.cellValue && { color: colors.subtle, fontStyle: 'italic' },
                            ]}
                            numberOfLines={2}
                          >
                            {cell?.cellValue || '—'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </ScrollView>

        {/* Modal: Add Column */}
        <Modal
          visible={isAddColumnModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddColumnModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Thêm cột mới</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: colors.hairline, color: colors.text }]}
                value={newColumnTitle}
                onChangeText={setNewColumnTitle}
                placeholder="Tên cột (Tiến độ, Hạn chót...)"
                placeholderTextColor={colors.subtle}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setIsAddColumnModalOpen(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={[styles.modalCancelText, { color: colors.subtle }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddColumn}
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.modalSubmitText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Edit Cell */}
        <Modal
          visible={Boolean(editingCell)}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingCell(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Chỉnh sửa: {editingCell?.columnTitle}
              </Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: colors.hairline, color: colors.text }]}
                value={editingCell?.value || ''}
                onChangeText={(text) =>
                  setEditingCell((prev) => (prev ? { ...prev, value: text } : null))
                }
                placeholder="Nhập nội dung ô..."
                placeholderTextColor={colors.subtle}
                multiline
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setEditingCell(null)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={[styles.modalCancelText, { color: colors.subtle }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveCell}
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.modalSubmitText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // =========================================================================
  // VIEW: LIST OF PLANNING SHEETS
  // =========================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }]}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.title, { color: colors.text }]}>Bảng kế hoạch nhóm</Text>
          <Text style={[styles.subtitle, { color: colors.subtle }]}>
            Quản lý công việc và tiến độ theo bảng tính
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={[styles.createButton, { backgroundColor: colors.primary }]}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.createButtonText}>Tạo bảng</Text>
        </TouchableOpacity>
      </View>

      {/* Sheets Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sheets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Table size={48} color={colors.subtle} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có bảng kế hoạch nào</Text>
          <Text style={[styles.emptySubtitle, { color: colors.subtle }]}>
            Tạo bảng tính đầu tiên để cùng nhóm quản lý công việc và thời hạn.
          </Text>
          <TouchableOpacity
            onPress={() => setIsCreateModalOpen(true)}
            style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.emptyCreateBtnText}>Tạo bảng ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollList} contentContainerStyle={styles.listContent}>
          {sheets.map((sheet) => (
            <TouchableOpacity
              key={sheet.id}
              activeOpacity={0.7}
              onPress={() => setSelectedSheet(sheet)}
              style={[styles.sheetCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
            >
              <View style={styles.sheetCardHeader}>
                <View style={[styles.sheetIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                  <FileSpreadsheet size={20} color={colors.primary} />
                </View>
                <View style={styles.sheetCardInfo}>
                  <Text style={[styles.sheetCardTitle, { color: colors.text }]} numberOfLines={1}>
                    {sheet.title}
                  </Text>
                  <Text style={[styles.sheetCardStats, { color: colors.subtle }]}>
                    {sheet.columns.length} cột · {sheet.rows.length} dòng
                  </Text>
                </View>
              </View>

              <View style={[styles.sheetCardFooter, { borderTopColor: colors.hairline }]}>
                <Text style={[styles.sheetCreator, { color: colors.subtle }]}>
                  Tạo bởi {sheet.creator?.user?.profile?.displayName || 'Thành viên'}
                </Text>
                <Text style={[styles.sheetDate, { color: colors.subtle }]}>
                  {new Date(sheet.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Modal: Create Sheet */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Tạo Bảng Kế Hoạch Mới</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderColor: colors.hairline, color: colors.text }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Nhập tên bảng kế hoạch..."
              placeholderTextColor={colors.subtle}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.subtle }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSheet}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSubmitText}>Tạo bảng</Text>
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
    backgroundColor: '#10B981',
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
    backgroundColor: '#10B981',
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
  sheetCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCardInfo: {
    flex: 1,
  },
  sheetCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetCardStats: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sheetCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 10,
    paddingTop: 8,
  },
  sheetCreator: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sheetDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnTextSec: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnTextPri: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  sheetTitleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sheetTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  gridContainer: {
    flex: 1,
  },
  table: {
    backgroundColor: '#FFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  indexCell: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerCell: {
    width: 140,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    justifyContent: 'center',
  },
  headerCellText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  dataCell: {
    width: 140,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    justifyContent: 'center',
  },
  dataCellText: {
    fontSize: 12,
    color: '#0F172A',
  },
  dataCellEmpty: {
    color: '#CBD5E1',
  },
  indexCellText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyTableNotice: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 12,
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
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
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
    backgroundColor: '#10B981',
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
