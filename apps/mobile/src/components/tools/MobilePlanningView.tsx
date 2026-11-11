import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  FileSpreadsheet,
  Plus,
  ArrowLeft,
  Trash2,
  X,
  Check,
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
import { PlanningSheetEntity } from '@circle/types';
import { ColorTheme } from '../../constants/theme';
import { getGlassTheme } from '../../constants/glass-theme';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

interface MobilePlanningViewProps {
  circleId: string;
}

export const MobilePlanningView: React.FC<MobilePlanningViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = useMemo(() => getGlassTheme(isDark, uiStyle), [isDark, uiStyle]);
  const { t, locale } = useLanguageStore();
  const insets = useSafeAreaInsets();
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const topClearance = Math.max(insets.top + 52, Platform.OS === 'ios' ? 74 : 64);
  const bottomClearance = Math.max(insets.bottom + 16, 24);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [sheets, setSheets] = useState<PlanningSheetEntity[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<PlanningSheetEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Inline feedback & 2-step confirmation (zero Alert.alert)
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDeleteSheet, setConfirmDeleteSheet] = useState(false);
  const [isDeletingSheet, setIsDeletingSheet] = useState(false);

  // Modal: Create Sheet
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Modal: Add Column
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addColError, setAddColError] = useState<string | null>(null);
  const [isAddingCol, setIsAddingCol] = useState(false);

  // Modal: Edit Cell
  const [editingCell, setEditingCell] = useState<{
    cellId: string;
    columnTitle: string;
    value: string;
  } | null>(null);
  const [editCellError, setEditCellError] = useState<string | null>(null);
  const [isSavingCell, setIsSavingCell] = useState(false);

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

  const loadSheets = async () => {
    try {
      setIsLoading(true);
      const data = await getPlanningSheetsApi(circleId);
      setSheets(data);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadSheetsError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetDetail = async (sheetId: string, silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await getPlanningSheetDetailApi(circleId, sheetId);
      setSelectedSheet(data);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadSheetDetailError, 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedSheet(null);
    setConfirmDeleteSheet(false);
    loadSheets();
  }, [circleId]);

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setNewTitle('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSheet = async () => {
    if (!newTitle.trim()) {
      setCreateError(t.collab.enterSheetTitleError);
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      const created = await createPlanningSheetApi(circleId, {
        title: newTitle.trim(),
      });
      setNewTitle('');
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.planningSheetCreated, 'success');
      loadSheets();
      setSelectedSheet(created);
      setConfirmDeleteSheet(false);
    } catch (err: any) {
      setCreateError(err?.message || t.collab.createSheetError);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenAddColModal = () => {
    setAddColError(null);
    setNewColumnTitle('');
    setIsAddColumnModalOpen(true);
  };

  const handleAddColumn = async () => {
    if (!selectedSheet) return;
    if (!newColumnTitle.trim()) {
      setAddColError(t.collab.newColumnTitlePrompt);
      return;
    }

    try {
      setIsAddingCol(true);
      setAddColError(null);
      const updated = await addSheetColumnApi(circleId, selectedSheet.id, {
        columnTitle: newColumnTitle.trim(),
      });
      setNewColumnTitle('');
      setIsAddColumnModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.planningColumnAdded, 'success');
      setSelectedSheet(updated);
      loadSheets();
    } catch (err: any) {
      setAddColError(err?.message || t.collab.addColumnError);
    } finally {
      setIsAddingCol(false);
    }
  };

  const handleAddRow = async () => {
    if (!selectedSheet || isAddingRow) return;

    try {
      setIsAddingRow(true);
      const updated = await addSheetRowApi(circleId, selectedSheet.id, {});
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showNotice(t.collab.planningRowAdded, 'success');
      setSelectedSheet(updated);
      loadSheets();
    } catch (err: any) {
      showNotice(err?.message || t.collab.addRowError, 'error');
    } finally {
      setIsAddingRow(false);
    }
  };

  const handleSaveCell = async () => {
    if (!editingCell || !selectedSheet || isSavingCell) return;

    try {
      setIsSavingCell(true);
      setEditCellError(null);
      await updateSheetCellApi(circleId, selectedSheet.id, editingCell.cellId, {
        cellValue: editingCell.value,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingCell(null);
      loadSheetDetail(selectedSheet.id, true);
    } catch (err: any) {
      setEditCellError(err?.message || t.collab.updateCellError);
    } finally {
      setIsSavingCell(false);
    }
  };

  const handleConfirmDeleteSheet = async () => {
    if (!selectedSheet || isDeletingSheet) return;
    try {
      setIsDeletingSheet(true);
      await deletePlanningSheetApi(circleId, selectedSheet.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmDeleteSheet(false);
      setSelectedSheet(null);
      showNotice(t.collab.planningSheetDeleted, 'success');
      loadSheets();
    } catch (err: any) {
      showNotice(err?.message || t.collab.deleteSheetError, 'error');
    } finally {
      setIsDeletingSheet(false);
    }
  };

  const renderNoticeBanner = () =>
    statusNotice ? (
      <View pointerEvents="box-none" style={[styles.noticeWrapper, { top: selectedSheet ? topClearance + 46 : topClearance + 4 }]}>
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
    ) : null;

  const renderSurfacePill = (
    children: any,
    containerStyle?: any,
  ) => {
    const surfaceStyle = {
      borderRadius: 999,
      overflow: 'hidden' as const,
      backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
      borderWidth: isGlass ? StyleSheet.hairlineWidth : 1,
      borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isGlass ? (isDark ? 0.28 : 0.08) : 0,
      shadowRadius: 8,
      elevation: isGlass ? 3 : 0,
    };

    if (isGlass) {
      return (
        <BlurView
          intensity={glassTheme.blur.intensity}
          tint={glassTheme.blur.tint}
          style={[surfaceStyle, containerStyle]}
        >
          {children}
        </BlurView>
      );
    }
    return <View style={[surfaceStyle, containerStyle]}>{children}</View>;
  };

  // =========================================================================
  // VIEW: SHEET DETAIL (INTERACTIVE SPREADSHEET MATRIX)
  // =========================================================================
  if (selectedSheet) {
    const columns = selectedSheet.columns || [];
    const rows = selectedSheet.rows || [];

    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        {renderNoticeBanner()}

        {/* Floating Sub-toolbar (strictly gated Glass vs Flat) */}
        <View
          pointerEvents="box-none"
          style={[styles.subToolbarContainer, { top: topClearance }]}
        >
          {renderSurfacePill(
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.glassPillTouch}
              onPress={() => {
                setConfirmDeleteSheet(false);
                setSelectedSheet(null);
              }}
              accessibilityLabel={t.collab.backToList}
            >
              <ArrowLeft size={15} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]} numberOfLines={1}>
                {selectedSheet.title}
              </Text>
            </TouchableOpacity>,
            { flexShrink: 1, maxWidth: '42%' },
          )}

          <View style={styles.subToolbarActions}>
            {renderSurfacePill(
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleOpenAddColModal}
                style={styles.glassActionTouch}
                accessibilityLabel={t.collab.addColumn}
              >
                <Plus size={13} color={colors.text} />
                <Text style={[styles.glassActionBtnText, { color: colors.text }]} numberOfLines={1}>
                  {t.collab.addColumn}
                </Text>
              </TouchableOpacity>,
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddRow}
              disabled={isAddingRow}
              style={[styles.glassActionBtnPrimary, { backgroundColor: colors.primary }]}
              accessibilityLabel={t.collab.addRow}
            >
              {isAddingRow ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Plus size={13} color={colors.onPrimary} />
              )}
              <Text style={[styles.glassActionBtnTextPri, { color: colors.onPrimary }]} numberOfLines={1}>
                {t.collab.addRow}
              </Text>
            </TouchableOpacity>

            {renderSurfacePill(
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setConfirmDeleteSheet((prev) => !prev)}
                style={styles.glassIconTouch}
                accessibilityLabel={t.collab.deleteSheet}
              >
                <Trash2 size={15} color={colors.danger} />
              </TouchableOpacity>,
            )}
          </View>
        </View>

        {/* Spreadsheet Horizontal & Vertical Scroll Grid (scroll-under) */}
        <ScrollView
          style={styles.gridContainer}
          contentContainerStyle={{
            paddingTop: topClearance + 50,
            paddingHorizontal: 14,
            paddingBottom: bottomClearance,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Inline 2-step delete confirmation */}
          {confirmDeleteSheet && (
            <View
              style={[
                styles.confirmDeleteCard,
                { backgroundColor: colors.surface, borderColor: '#DC2626' },
              ]}
            >
              <Text style={[styles.confirmDeleteTitle, { color: colors.text }]}>
                {t.collab.planningDeleteConfirmTitle}
              </Text>
              <Text style={[styles.confirmDeleteDesc, { color: colors.subtle }]}>
                {t.collab.deleteSheetConfirm}
              </Text>
              <View style={styles.confirmDeleteActions}>
                <TouchableOpacity
                  onPress={() => setConfirmDeleteSheet(false)}
                  disabled={isDeletingSheet}
                  style={[styles.confirmCancelBtn, { borderColor: colors.hairline }]}
                >
                  <Text style={[styles.confirmCancelText, { color: colors.text }]}>
                    {t.common.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmDeleteSheet}
                  disabled={isDeletingSheet}
                  style={styles.confirmDestroyBtn}
                >
                  {isDeletingSheet ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmDestroyText}>{t.common.delete}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={[styles.table, { borderColor: colors.hairline, backgroundColor: colors.canvas }]}>
              {/* Header Row */}
              <View
                style={[
                  styles.tableHeaderRow,
                  {
                    backgroundColor: isDark ? colors.elevated : colors.surface,
                    borderBottomColor: colors.hairline,
                  },
                ]}
              >
                <View
                  style={[
                    styles.headerCell,
                    styles.indexCell,
                    {
                      borderRightColor: colors.hairline,
                      backgroundColor: isDark ? colors.elevated : colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.headerCellText, { color: colors.subtle }]}>#</Text>
                </View>
                {columns.map((col) => (
                  <View key={col.id} style={[styles.headerCell, { borderRightColor: colors.hairline }]}>
                    <Text style={[styles.headerCellText, { color: colors.text }]} numberOfLines={1}>
                      {col.columnTitle}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {rows.length === 0 ? (
                <View style={styles.emptyTableNotice}>
                  <Text style={[styles.emptyTableText, { color: colors.subtle }]}>
                    {t.collab.sheetEmptyRows}
                  </Text>
                </View>
              ) : (
                rows.map((row, rIdx) => (
                  <View key={row.id} style={[styles.tableDataRow, { borderBottomColor: colors.hairline }]}>
                    <View
                      style={[
                        styles.dataCell,
                        styles.indexCell,
                        {
                          borderRightColor: colors.hairline,
                          backgroundColor: isDark ? colors.elevated : colors.surface,
                        },
                      ]}
                    >
                      <Text style={[styles.indexCellText, { color: colors.subtle }]}>{rIdx + 1}</Text>
                    </View>
                    {columns.map((col) => {
                      const cell = row.cells.find((c) => c.columnId === col.id);
                      return (
                        <TouchableOpacity
                          key={col.id}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (!cell) return;
                            setEditCellError(null);
                            setEditingCell({
                              cellId: cell.id,
                              columnTitle: col.columnTitle,
                              value: cell.cellValue || '',
                            });
                          }}
                          style={[
                            styles.dataCell,
                            { borderRightColor: colors.hairline, backgroundColor: colors.canvas },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dataCellText,
                              { color: colors.text },
                              !cell?.cellValue && { color: colors.subtle },
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalBackdrop}
          >
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t.collab.planningModalAddColumnTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAddColumnModalOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={t.common.close}
                >
                  <X size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.subtle }]}>
                {t.collab.planningColumnNameLabel}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.canvas,
                    borderColor: colors.hairline,
                    color: colors.text,
                  },
                ]}
                value={newColumnTitle}
                onChangeText={(val) => {
                  setNewColumnTitle(val);
                  if (addColError) setAddColError(null);
                }}
                placeholder={t.collab.newColumnTitlePrompt}
                placeholderTextColor={colors.subtle}
                autoFocus
              />

              {addColError ? (
                <Text style={[styles.inlineErrorText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  {addColError}
                </Text>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setIsAddColumnModalOpen(false)}
                  disabled={isAddingCol}
                  style={styles.modalCancelBtn}
                >
                  <Text style={[styles.modalCancelText, { color: colors.subtle }]}>
                    {t.common.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddColumn}
                  disabled={isAddingCol}
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                >
                  {isAddingCol ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.modalSubmitText, { color: colors.onPrimary }]}>
                      {t.collab.addColumn}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal: Edit Cell */}
        <Modal
          visible={Boolean(editingCell)}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingCell(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalBackdrop}
          >
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {t.collab.planningModalEditCellTitle.replace(
                    '{col}',
                    editingCell?.columnTitle || '',
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() => setEditingCell(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={t.common.close}
                >
                  <X size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    minHeight: 88,
                    textAlignVertical: 'top',
                    backgroundColor: colors.canvas,
                    borderColor: colors.hairline,
                    color: colors.text,
                  },
                ]}
                value={editingCell?.value || ''}
                onChangeText={(text) => {
                  setEditingCell((prev) => (prev ? { ...prev, value: text } : null));
                  if (editCellError) setEditCellError(null);
                }}
                placeholder={t.collab.planningCellValuePlaceholder}
                placeholderTextColor={colors.subtle}
                multiline
                autoFocus
              />

              {editCellError ? (
                <Text style={[styles.inlineErrorText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  {editCellError}
                </Text>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setEditingCell(null)}
                  disabled={isSavingCell}
                  style={styles.modalCancelBtn}
                >
                  <Text style={[styles.modalCancelText, { color: colors.subtle }]}>
                    {t.common.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveCell}
                  disabled={isSavingCell}
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                >
                  {isSavingCell ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.modalSubmitText, { color: colors.onPrimary }]}>
                      {t.common.save}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // =========================================================================
  // VIEW: LIST OF PLANNING SHEETS
  // =========================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {renderNoticeBanner()}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      ) : sheets.length === 0 ? (
        <View style={[styles.emptyContainer, { paddingTop: topClearance }]}>
          <Table size={48} color={colors.subtle} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t.collab.sheetEmptyTitle}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.subtle }]}>
            {t.collab.sheetEmptyDesc}
          </Text>
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.emptyCreateBtnText, { color: colors.onPrimary }]}>
              {t.collab.createFirstSheet}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: topClearance + 8, paddingBottom: bottomClearance + 76 },
          ]}
        >
          {sheets.map((sheet) => (
            <TouchableOpacity
              key={sheet.id}
              activeOpacity={0.75}
              onPress={() => {
                setConfirmDeleteSheet(false);
                setSelectedSheet(sheet);
                loadSheetDetail(sheet.id, true);
              }}
              style={[
                styles.sheetCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.sheetCardHeader}>
                <FileSpreadsheet size={22} color={colors.sage} />
                <View style={styles.sheetCardInfo}>
                  <Text style={[styles.sheetCardTitle, { color: colors.text }]} numberOfLines={1}>
                    {sheet.title}
                  </Text>
                  <Text style={[styles.sheetCardStats, { color: colors.subtle }]}>
                    {t.collab.planningColRowStats
                      .replace('{cols}', String(sheet.columns?.length ?? 0))
                      .replace('{rows}', String(sheet.rows?.length ?? 0))}
                  </Text>
                </View>
              </View>

              <View style={[styles.sheetCardFooter, { borderTopColor: colors.hairline }]}>
                <Text style={[styles.sheetCreator, { color: colors.subtle }]}>
                  {t.collab.pollCreatedBy.replace(
                    '{name}',
                    sheet.creator?.user?.profile?.displayName ||
                      sheet.creator?.nickname ||
                      t.collab.memberDefault,
                  )}
                </Text>
                <Text style={[styles.sheetDate, { color: colors.subtle }]}>
                  {new Date(sheet.createdAt).toLocaleDateString(dateLocale)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        accessibilityLabel={t.collab.createSheet}
      >
        <Plus size={18} color={colors.onPrimary} />
        <Text style={[styles.fabText, { color: colors.onPrimary }]}>{t.collab.createSheet}</Text>
      </TouchableOpacity>

      {/* Modal: Create Sheet */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.collab.planningModalCreateTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t.common.close}
              >
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.subtle }]}>
              {t.collab.planningSheetNameLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.canvas,
                  borderColor: colors.hairline,
                  color: colors.text,
                },
              ]}
              value={newTitle}
              onChangeText={(val) => {
                setNewTitle(val);
                if (createError) setCreateError(null);
              }}
              placeholder={t.collab.sheetTitlePlaceholder}
              placeholderTextColor={colors.subtle}
              autoFocus
            />

            <Text style={[styles.defaultColsHint, { color: colors.subtle }]}>
              {t.collab.planningDefaultColumnsHint} {t.collab.planningDefaultColsPreview}
            </Text>

            {createError ? (
              <Text style={[styles.inlineErrorText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                {createError}
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.subtle }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSheet}
                disabled={isCreating}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.modalSubmitText, { color: colors.onPrimary }]}>
                    {t.collab.createSheet}
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
    subToolbarContainer: {
      position: 'absolute',
      left: 14,
      right: 14,
      zIndex: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    subToolbarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    glassPillTouch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 36,
    },
    backText: {
      fontSize: 12,
      fontWeight: '600',
      flexShrink: 1,
    },
    glassActionTouch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      minHeight: 36,
    },
    glassActionBtnText: {
      fontSize: 11,
      fontWeight: '600',
    },
    glassActionBtnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 36,
      borderRadius: 999,
    },
    glassActionBtnTextPri: {
      fontSize: 11,
      fontWeight: '700',
    },
    glassIconTouch: {
      minWidth: 36,
      minHeight: 36,
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmDeleteCard: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      marginBottom: 12,
      gap: 6,
    },
    confirmDeleteTitle: {
      fontSize: 13,
      fontWeight: '700',
    },
    confirmDeleteDesc: {
      fontSize: 12,
      lineHeight: 17,
    },
    confirmDeleteActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 6,
    },
    confirmCancelBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
    },
    confirmCancelText: {
      fontSize: 12,
      fontWeight: '600',
    },
    confirmDestroyBtn: {
      backgroundColor: '#DC2626',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      minWidth: 68,
      alignItems: 'center',
    },
    confirmDestroyText: {
      color: '#FFFFFF',
      fontSize: 12,
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
    emptySubtitle: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 18,
      marginBottom: 16,
    },
    emptyCreateBtn: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 999,
    },
    emptyCreateBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    scrollList: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 12,
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
    sheetCard: {
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
    },
    sheetCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    sheetCardInfo: {
      flex: 1,
    },
    sheetCardTitle: {
      fontSize: 14,
      fontWeight: '700',
    },
    sheetCardStats: {
      fontSize: 11,
      marginTop: 2,
    },
    sheetCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: 10,
      paddingTop: 8,
    },
    sheetCreator: {
      fontSize: 11,
    },
    sheetDate: {
      fontSize: 11,
    },
    gridContainer: {
      flex: 1,
    },
    table: {
      borderWidth: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    tableHeaderRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
    },
    tableDataRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    indexCell: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCell: {
      width: 140,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRightWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
    },
    headerCellText: {
      fontSize: 11,
      fontWeight: '700',
    },
    dataCell: {
      width: 140,
      minHeight: 44,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRightWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
    },
    dataCellText: {
      fontSize: 12,
    },
    indexCellText: {
      fontSize: 11,
      fontWeight: '600',
    },
    emptyTableNotice: {
      padding: 28,
      alignItems: 'center',
      minWidth: 320,
    },
    emptyTableText: {
      fontSize: 12,
      textAlign: 'center',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 20,
      width: '100%',
      maxWidth: 360,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 8,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
    },
    defaultColsHint: {
      fontSize: 11,
      marginTop: 8,
      lineHeight: 16,
    },
    inlineErrorText: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 8,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
    },
    modalCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 8,
    },
    modalCancelText: {
      fontSize: 12,
      fontWeight: '600',
    },
    modalSubmitBtn: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 999,
      minWidth: 80,
      alignItems: 'center',
    },
    modalSubmitText: {
      fontSize: 12,
      fontWeight: '700',
    },
  });
