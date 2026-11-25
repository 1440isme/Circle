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
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
  Check,
  Table,
  Share2,
  CheckSquare,
  Square,
  Layers,
  LayoutGrid,
  Wallet,
  Luggage,
  MapPin,
  ListTodo,
  Sparkles,
  ChevronLeft,
  Edit3,
  User,
  Users,
  Activity,
  Calendar,
  FileText,
  Tag,
  DollarSign,
} from 'lucide-react-native';
import {
  getPlanningSheetsApi,
  getPlanningSheetDetailApi,
  createPlanningSheetApi,
  updatePlanningSheetApi,
  addSheetColumnApi,
  updateSheetColumnApi,
  deleteSheetColumnApi,
  addSheetRowApi,
  deleteSheetRowApi,
  updateSheetCellApi,
  deletePlanningSheetApi,
  sharePlanningSheetApi,
  getCircleMembersApi,
} from '../../services/circle-tools.service';
import { getSocket } from '../../services/socket';
import { PlanningSheetEntity, SheetCellEntity } from '@circle/types';
import {
  computePlanningSheetSummary,
  formatVnd,
  parseVnd,
  PLANNING_TEMPLATES,
  PRESET_COLUMNS,
  ColumnPreset,
  PlanningTemplateType,
  SheetColumnType,
} from '@circle/shared';
import { ColorTheme } from '../../constants/theme';
import { getGlassTheme } from '../../constants/glass-theme';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { MobileConfirmModal } from '../ui/MobileConfirmModal';

interface MobilePlanningViewProps {
  circleId: string;
  onRegisterBack?: (handler: (() => boolean) | null) => void;
}

export const MobilePlanningView: React.FC<MobilePlanningViewProps> = ({
  circleId,
  onRegisterBack,
}) => {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = useMemo(() => getGlassTheme(isDark, uiStyle), [isDark, uiStyle]);
  const { t, locale } = useLanguageStore();
  const insets = useSafeAreaInsets();
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const headerButtonTop = Platform.OS === 'ios' ? 52 : 36;
  const topClearance = Math.max(insets.top + 56, Platform.OS === 'ios' ? 88 : 72);
  const bottomClearance = Math.max(insets.bottom + 24, 32);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [sheets, setSheets] = useState<PlanningSheetEntity[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<PlanningSheetEntity | null>(null);
  const selectedSheetRef = useRef<PlanningSheetEntity | null>(null);
  selectedSheetRef.current = selectedSheet;

  // View Mode: 'cards' (default ergonomic list for mobile) or 'table' (matrix grid)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [isLoading, setIsLoading] = useState(true);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isSharingSheet, setIsSharingSheet] = useState(false);

  // Inline feedback & Unified confirmation modal
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDeletingSheet, setIsDeletingSheet] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'sheet' | 'row';
    id?: string;
    title: string;
    description?: string;
  } | null>(null);
  const [isConfirmBusy, setIsConfirmBusy] = useState(false);

  // Modal: Create Sheet with Template Picker
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PlanningTemplateType>('expense');
  const [newTitle, setNewTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Modal: Rename Sheet Title (CRUD Sheet Update)
  const [isRenameSheetModalOpen, setIsRenameSheetModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Modal: Add Column with Presets
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnType, setNewColumnType] = useState<SheetColumnType>('text');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [addColError, setAddColError] = useState<string | null>(null);
  const [isAddingCol, setIsAddingCol] = useState(false);

  // Modal: Edit Cell (with Auto-save)
  const [editingCell, setEditingCell] = useState<{
    cellId: string;
    columnTitle: string;
    columnType?: string;
    value: string;
  } | null>(null);
  const [editCellError, setEditCellError] = useState<string | null>(null);
  const [isSavingCell, setIsSavingCell] = useState(false);
  const autoSaveDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal: Member Assignee Picker (1-tap auto-save)
  const [memberPickerCell, setMemberPickerCell] = useState<{
    cellId: string;
    currentVal: string;
  } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'error') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusNotice({ type, message });
    statusTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (autoSaveDebounceTimerRef.current) clearTimeout(autoSaveDebounceTimerRef.current);
    };
  }, []);

  // Back handling
  useEffect(() => {
    if (onRegisterBack) {
      if (selectedSheet) {
        onRegisterBack(() => {
          setConfirmModal(null);
          setSelectedSheet(null);
          return true;
        });
      } else {
        onRegisterBack(null);
      }
    }
    return () => {
      onRegisterBack?.(null);
    };
  }, [selectedSheet, onRegisterBack]);

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

  const loadMembers = async () => {
    try {
      const data = await getCircleMembersApi(circleId);
      setMembers(data || []);
    } catch {
      // silently tolerate member load fail
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
    setConfirmModal(null);
    loadSheets();
    loadMembers();
  }, [circleId]);

  // Real-time Socket Synchronization
  useEffect(() => {
    let isSubscribed = true;
    getSocket().then((socket) => {
      if (!socket || !isSubscribed) return;

      const handleUpdate = (payload: any) => {
        loadSheets();
        if (
          selectedSheetRef.current &&
          (payload?.sheetId === selectedSheetRef.current.id || !payload?.sheetId)
        ) {
          loadSheetDetail(selectedSheetRef.current.id, true);
        }
      };

      const handleDeleted = (payload: any) => {
        loadSheets();
        if (selectedSheetRef.current?.id === payload?.sheetId) {
          setSelectedSheet(null);
        }
      };

      socket.on('circle:sheet-cell-updated', handleUpdate);
      socket.on('circle:sheet-structure-updated', handleUpdate);
      socket.on('circle:sheet-deleted', handleDeleted);
    });

    return () => {
      isSubscribed = false;
    };
  }, [circleId]);

  // Computed summary for the active sheet dynamically taking real circle member count into account
  const sheetSummary = useMemo(() => {
    if (!selectedSheet) return null;
    const memberCount = Math.max(1, members.length);
    return computePlanningSheetSummary(selectedSheet, memberCount);
  }, [selectedSheet, members.length]);

  const isMemberColumn = (col: { columnType?: string; columnTitle: string }) => {
    if (col.columnType === 'member') return true;
    const lower = col.columnTitle.toLowerCase();
    return (
      lower.includes('người') ||
      lower.includes('phụ trách') ||
      lower.includes('thực hiện') ||
      lower.includes('trả') ||
      lower.includes('assignee') ||
      lower.includes('member')
    );
  };

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setSelectedTemplate('expense');
    setNewTitle('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSheet = async () => {
    const titleToUse =
      newTitle.trim() ||
      PLANNING_TEMPLATES[selectedTemplate]?.defaultTitle ||
      t.collab.createSheet;

    try {
      setIsCreating(true);
      setCreateError(null);
      const created = await createPlanningSheetApi(circleId, {
        title: titleToUse,
        templateType: selectedTemplate,
      });
      setNewTitle('');
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.planningSheetCreated, 'success');
      loadSheets();
      setSelectedSheet(created);
      setConfirmModal(null);
    } catch (err: any) {
      setCreateError(err?.message || t.collab.createSheetError);
    } finally {
      setIsCreating(false);
    }
  };

  // Sheet Title Rename (Auto-save)
  const handleSaveRenameSheet = async () => {
    if (!selectedSheet || !renameDraft.trim() || isRenaming) return;
    try {
      setIsRenaming(true);
      const updated = await updatePlanningSheetApi(circleId, selectedSheet.id, {
        title: renameDraft.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.autoSaved || 'Đã lưu', 'success');
      setSelectedSheet(updated);
      setIsRenameSheetModalOpen(false);
      loadSheets();
    } catch (err: any) {
      showNotice(err?.message || t.collab.createSheetError, 'error');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleOpenAddColModal = () => {
    setAddColError(null);
    setNewColumnTitle('');
    setNewColumnType('text');
    setSelectedPresetId(null);
    setIsAddColumnModalOpen(true);
  };

  const handleSelectPreset = (preset: ColumnPreset) => {
    setSelectedPresetId(preset.id);
    const presetLabel = locale === 'vi' ? preset.defaultTitle : preset.enTitle;
    setNewColumnTitle(presetLabel);
    setNewColumnType(preset.type);
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
        columnType: newColumnType,
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

  const handleDeleteRow = async (rowId: string) => {
    if (!selectedSheet) return;
    try {
      const updated = await deleteSheetRowApi(circleId, selectedSheet.id, rowId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedSheet(updated);
      loadSheets();
    } catch (err: any) {
      showNotice(err?.message || t.collab.deleteRow, 'error');
    }
  };

  // Instant Checkbox Toggle (1-tap, no modal, auto-save)
  const handleToggleCheckbox = async (cell: SheetCellEntity) => {
    if (!selectedSheet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextVal = cell.cellValue === 'true' ? '' : 'true';
    try {
      await updateSheetCellApi(circleId, selectedSheet.id, cell.id, {
        cellValue: nextVal,
      });
      loadSheetDetail(selectedSheet.id, true);
    } catch (err: any) {
      showNotice(err?.message || t.collab.updateCellError, 'error');
    }
  };

  // Instant Status Cycle (1-tap, no modal, auto-save)
  const handleCycleStatus = async (cell: SheetCellEntity) => {
    if (!selectedSheet) return;
    Haptics.selectionAsync();
    const current = cell.cellValue || 'todo';
    const nextStatus = current === 'todo' ? 'in_progress' : current === 'in_progress' ? 'done' : 'todo';
    try {
      await updateSheetCellApi(circleId, selectedSheet.id, cell.id, {
        cellValue: nextStatus,
      });
      loadSheetDetail(selectedSheet.id, true);
    } catch (err: any) {
      showNotice(err?.message || t.collab.updateCellError, 'error');
    }
  };

  // Member Assignee Select (1-tap, auto-save)
  const handleSelectMember = async (displayName: string) => {
    if (!memberPickerCell || !selectedSheet) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cellId = memberPickerCell.cellId;
    setMemberPickerCell(null);
    try {
      await updateSheetCellApi(circleId, selectedSheet.id, cellId, {
        cellValue: displayName,
      });
      showNotice(t.collab.autoSaved || 'Đã lưu', 'success');
      loadSheetDetail(selectedSheet.id, true);
    } catch (err: any) {
      showNotice(err?.message || t.collab.updateCellError, 'error');
    }
  };

  // Cell Text/Currency Auto-save with Debounce
  const handleCellTextChange = (text: string) => {
    if (!editingCell || !selectedSheet) return;
    setEditingCell((prev) => (prev ? { ...prev, value: text } : null));

    if (autoSaveDebounceTimerRef.current) clearTimeout(autoSaveDebounceTimerRef.current);
    autoSaveDebounceTimerRef.current = setTimeout(async () => {
      try {
        await updateSheetCellApi(circleId, selectedSheet.id, editingCell.cellId, {
          cellValue: text,
        });
        loadSheetDetail(selectedSheet.id, true);
      } catch {
        // silent fail on debounce
      }
    }, 600);
  };

  const handleSaveCellModal = async () => {
    if (!editingCell || !selectedSheet || isSavingCell) return;
    if (autoSaveDebounceTimerRef.current) clearTimeout(autoSaveDebounceTimerRef.current);

    try {
      setIsSavingCell(true);
      setEditCellError(null);
      await updateSheetCellApi(circleId, selectedSheet.id, editingCell.cellId, {
        cellValue: editingCell.value,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.autoSaved || 'Đã lưu', 'success');
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
      setSelectedSheet(null);
      showNotice(t.collab.planningSheetDeleted, 'success');
      loadSheets();
    } catch (err: any) {
      showNotice(err?.message || t.collab.deleteSheetError, 'error');
    } finally {
      setIsDeletingSheet(false);
    }
  };

  const handleExecuteConfirm = async () => {
    if (!confirmModal || isConfirmBusy) return;
    setIsConfirmBusy(true);
    try {
      if (confirmModal.type === 'sheet') {
        await handleConfirmDeleteSheet();
      } else if (confirmModal.type === 'row' && confirmModal.id) {
        await handleDeleteRow(confirmModal.id);
      }
      setConfirmModal(null);
    } catch {
      // errors already shown
    } finally {
      setIsConfirmBusy(false);
    }
  };

  const handleShareToChat = async () => {
    if (!selectedSheet || isSharingSheet) return;
    try {
      setIsSharingSheet(true);
      await sharePlanningSheetApi(circleId, selectedSheet.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.sharedSheetSuccess, 'success');
    } catch (err: any) {
      showNotice(err?.message || t.collab.shareSheetToChat, 'error');
    } finally {
      setIsSharingSheet(false);
    }
  };

  const renderNoticeBanner = () =>
    statusNotice ? (
      <View
        pointerEvents="box-none"
        style={[
          styles.noticeWrapper,
          { top: selectedSheet ? headerButtonTop + 48 : topClearance + 4 },
        ]}
      >
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

  const renderSurfacePill = (children: any, containerStyle?: any) => {
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

  // Helper for preset icons on mobile
  const renderPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'check-square':
        return <CheckSquare size={13} color={colors.primary} />;
      case 'activity':
        return <Activity size={13} color={colors.primary} />;
      case 'user':
        return <User size={13} color={colors.primary} />;
      case 'dollar-sign':
        return <DollarSign size={13} color={colors.primary} />;
      case 'calendar':
        return <Calendar size={13} color={colors.primary} />;
      case 'file-text':
        return <FileText size={13} color={colors.primary} />;
      case 'tag':
        return <Tag size={13} color={colors.primary} />;
      default:
        return <Check size={13} color={colors.primary} />;
    }
  };

  // =========================================================================
  // VIEW: SHEET DETAIL (CARDS / TABLE VIEW)
  // =========================================================================
  if (selectedSheet) {
    const columns = selectedSheet.columns || [];
    const rows = selectedSheet.rows || [];

    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        {renderNoticeBanner()}

        {/* Floating Top Controls */}
        <View pointerEvents="box-none" style={[styles.subToolbarContainer, { top: headerButtonTop }]}>
          {/* Back button correctly labeled "Bảng kế hoạch" (Planning Board) */}
          {renderSurfacePill(
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setConfirmModal(null);
                setSelectedSheet(null);
              }}
              style={[
                styles.glassPillTouch,
                { paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
              ]}
              accessibilityLabel={t.collab.planningBoard || 'Bảng kế hoạch'}
            >
              <ChevronLeft size={16} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text }]} numberOfLines={1}>
                {t.collab.planningBoard || 'Bảng kế hoạch'}
              </Text>
            </TouchableOpacity>,
            { flexShrink: 1, maxWidth: '48%' },
          )}

          <View style={styles.subToolbarActions}>
            {/* View Mode Toggle: Cards vs Table */}
            {renderSurfacePill(
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  setViewMode((prev) => (prev === 'cards' ? 'table' : 'cards'));
                }}
                style={styles.glassIconTouch}
                accessibilityLabel={viewMode === 'cards' ? t.collab.tableView : t.collab.cardView}
              >
                {viewMode === 'cards' ? (
                  <Table size={15} color={colors.text} />
                ) : (
                  <LayoutGrid size={15} color={colors.text} />
                )}
              </TouchableOpacity>,
            )}

            {/* Share to Chat Button */}
            {renderSurfacePill(
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShareToChat}
                disabled={isSharingSheet}
                style={styles.glassIconTouch}
                accessibilityLabel={t.collab.shareSheetToChat}
              >
                {isSharingSheet ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Share2 size={15} color={colors.primary} />
                )}
              </TouchableOpacity>,
            )}

            {/* Add Column Button */}
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

            {/* Add Row Button */}
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

            {/* Delete Sheet Button */}
            {renderSurfacePill(
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'sheet',
                    title: t.collab.planningDeleteConfirmTitle,
                    description: t.collab.deleteSheetConfirm,
                  })
                }
                style={styles.glassIconTouch}
                accessibilityLabel={t.collab.deleteSheet}
              >
                <Trash2 size={15} color={colors.danger} />
              </TouchableOpacity>,
            )}
          </View>
        </View>

        {/* Header Sheet Title Banner & Rename Option */}
        <View
          style={{
            marginTop: headerButtonTop + 48,
            paddingHorizontal: 16,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setRenameDraft(selectedSheet.title);
              setIsRenameSheetModalOpen(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: '800',
                color: colors.text,
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {selectedSheet.title}
            </Text>
            <Edit3 size={13} color={colors.subtle} />
          </TouchableOpacity>

          <Text style={{ fontSize: 11, color: colors.subtle, fontWeight: '500' }}>
            {columns.length} {t.collab.columnsCount.replace('{count}', '')} · {rows.length}{' '}
            {t.collab.rowsCount.replace('{count}', '')}
          </Text>
        </View>

        {/* Content Area: Cards View (Default Mobile Ergonomics) */}
        {viewMode === 'cards' ? (
          <ScrollView
            style={styles.gridContainer}
            contentContainerStyle={{
              paddingTop: 8,
              paddingHorizontal: 14,
              paddingBottom: bottomClearance + 64,
            }}
            showsVerticalScrollIndicator={false}
          >
            {rows.length === 0 ? (
              <View style={[styles.emptyNoticeCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <Table size={28} color={colors.sage} />
                <Text style={[styles.emptyNoticeTitle, { color: colors.text }]}>
                  {t.collab.sheetEmptyRows}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddRow}
                  style={[styles.emptyAddRowBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={14} color={colors.onPrimary} />
                  <Text style={[styles.emptyAddRowText, { color: colors.onPrimary }]}>
                    {t.collab.addRow}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              rows.map((row, rIdx) => {
                return (
                  <View
                    key={row.id}
                    style={[
                      styles.rowCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    {/* Row Card Header */}
                    <View style={styles.rowCardHeader}>
                      <View style={styles.rowCardBadge}>
                        <Text style={[styles.rowCardIndexText, { color: colors.subtle }]}>
                          #{rIdx + 1}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() =>
                          setConfirmModal({
                            isOpen: true,
                            type: 'row',
                            id: row.id,
                            title: t.common.delete,
                            description: t.collab.deleteRowConfirm || (locale === 'vi' ? 'Bạn có chắc chắn muốn xóa hàng này không?' : 'Are you sure you want to delete this row?'),
                          })
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.rowCardDeleteBtn}
                      >
                        <Trash2 size={14} color={colors.subtle} />
                      </TouchableOpacity>
                    </View>

                    {/* Columns rendered inside Card */}
                    <View style={styles.rowCardFields}>
                      {columns.map((col) => {
                        const cell = row.cells.find((c) => c.columnId === col.id);
                        const isMemberCol = isMemberColumn(col);
                        const colType = (col.columnType || (isMemberCol ? 'member' : 'text')) as SheetColumnType;

                        // Checkbox column
                        if (colType === 'checkbox') {
                          const isChecked = cell?.cellValue === 'true';
                          return (
                            <TouchableOpacity
                              key={col.id}
                              activeOpacity={0.7}
                              onPress={() => cell && handleToggleCheckbox(cell)}
                              style={styles.rowCardCheckboxRow}
                            >
                              {isChecked ? (
                                <CheckSquare size={20} color={colors.primary} />
                              ) : (
                                <Square size={20} color={colors.subtle} />
                              )}
                              <Text
                                style={[
                                  styles.rowCardCheckboxLabel,
                                  {
                                    color: isChecked ? colors.subtle : colors.text,
                                    textDecorationLine: isChecked ? 'line-through' : 'none',
                                  },
                                ]}
                              >
                                {col.columnTitle}
                              </Text>
                            </TouchableOpacity>
                          );
                        }

                        // Status column
                        if (colType === 'status') {
                          const status = cell?.cellValue || 'todo';
                          return (
                            <TouchableOpacity
                              key={col.id}
                              activeOpacity={0.7}
                              onPress={() => cell && handleCycleStatus(cell)}
                              style={styles.rowCardStatusRow}
                            >
                              <Text style={[styles.rowCardFieldLabel, { color: colors.subtle }]}>
                                {col.columnTitle}:
                              </Text>
                              <View
                                style={[
                                  styles.statusPill,
                                  {
                                    backgroundColor:
                                      status === 'done'
                                        ? 'rgba(16,185,129,0.15)'
                                        : status === 'in_progress'
                                        ? 'rgba(245,158,11,0.15)'
                                        : 'rgba(148,163,184,0.15)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    {
                                      color:
                                        status === 'done'
                                          ? '#10B981'
                                          : status === 'in_progress'
                                          ? '#F59E0B'
                                          : colors.subtle,
                                    },
                                  ]}
                                >
                                  {status === 'done'
                                    ? t.collab.completed
                                    : status === 'in_progress'
                                    ? t.collab.progress
                                    : t.collab.markUncompleted}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        }

                        // Member Assignee Column
                        if (isMemberCol) {
                          return (
                            <TouchableOpacity
                              key={col.id}
                              activeOpacity={0.7}
                              onPress={() =>
                                cell &&
                                setMemberPickerCell({
                                  cellId: cell.id,
                                  currentVal: cell.cellValue || '',
                                })
                              }
                              style={styles.rowCardFieldRow}
                            >
                              <Text style={[styles.rowCardFieldLabel, { color: colors.subtle }]}>
                                {col.columnTitle}:
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <View
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: colors.wash,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <User size={12} color={colors.primary} />
                                </View>
                                <Text
                                  style={[
                                    styles.rowCardFieldValue,
                                    {
                                      color: cell?.cellValue ? colors.text : colors.subtle,
                                      fontWeight: cell?.cellValue ? '600' : 'normal',
                                      fontStyle: cell?.cellValue ? 'normal' : 'italic',
                                    },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {cell?.cellValue || t.collab.unassignedMember || 'Chưa gán'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        }

                        // Currency Column
                        if (colType === 'currency') {
                          return (
                            <TouchableOpacity
                              key={col.id}
                              activeOpacity={0.7}
                              onPress={() =>
                                cell &&
                                setEditingCell({
                                  cellId: cell.id,
                                  columnTitle: col.columnTitle,
                                  columnType: 'currency',
                                  value: cell.cellValue || '',
                                })
                              }
                              style={styles.rowCardFieldRow}
                            >
                              <Text style={[styles.rowCardFieldLabel, { color: colors.subtle }]}>
                                {col.columnTitle}:
                              </Text>
                              <Text style={[styles.rowCardCurrencyText, { color: colors.primary }]}>
                                {cell?.cellValue ? formatVnd(parseVnd(cell.cellValue)) : '0đ'}
                              </Text>
                            </TouchableOpacity>
                          );
                        }

                        // Text / Date / Other columns
                        return (
                          <TouchableOpacity
                            key={col.id}
                            activeOpacity={0.7}
                            onPress={() =>
                              cell &&
                              setEditingCell({
                                cellId: cell.id,
                                columnTitle: col.columnTitle,
                                columnType: colType,
                                value: cell.cellValue || '',
                              })
                            }
                            style={styles.rowCardFieldRow}
                          >
                            <Text style={[styles.rowCardFieldLabel, { color: colors.subtle }]}>
                              {col.columnTitle}:
                            </Text>
                            <Text
                              style={[
                                styles.rowCardFieldValue,
                                {
                                  color: cell?.cellValue ? colors.text : colors.subtle,
                                  fontStyle: cell?.cellValue ? 'normal' : 'italic',
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {cell?.cellValue || '—'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        ) : (
          /* Table Matrix View (Original spreadsheet grid) */
          <ScrollView
            style={styles.gridContainer}
            contentContainerStyle={{
              paddingTop: 8,
              paddingHorizontal: 14,
              paddingBottom: bottomClearance + 64,
            }}
            showsVerticalScrollIndicator={false}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={[styles.table, { borderColor: colors.hairline, backgroundColor: colors.canvas }]}>
                {/* Header Row */}
                <View style={[styles.tableHeaderRow, { borderBottomColor: colors.hairline, backgroundColor: colors.surface }]}>
                  <View style={[styles.indexCell, { borderRightColor: colors.hairline }]}>
                    <Text style={[styles.indexCellText, { color: colors.subtle }]}>#</Text>
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
                    <View
                      key={row.id}
                      style={[
                        styles.tableDataRow,
                        {
                          borderBottomColor: colors.hairline,
                          backgroundColor: rIdx % 2 === 0 ? colors.canvas : colors.surface,
                        },
                      ]}
                    >
                      <View style={[styles.indexCell, { borderRightColor: colors.hairline }]}>
                        <Text style={[styles.indexCellText, { color: colors.subtle }]}>{rIdx + 1}</Text>
                      </View>
                      {columns.map((col) => {
                        const cell = row.cells.find((c) => c.columnId === col.id);
                        const isMemberCol = isMemberColumn(col);
                        const colType = (col.columnType || (isMemberCol ? 'member' : 'text')) as SheetColumnType;

                        return (
                          <TouchableOpacity
                            key={col.id}
                            activeOpacity={0.65}
                            onPress={() => {
                              if (!cell) return;
                              if (colType === 'checkbox') {
                                handleToggleCheckbox(cell);
                              } else if (colType === 'status') {
                                handleCycleStatus(cell);
                              } else if (isMemberCol) {
                                setMemberPickerCell({
                                  cellId: cell.id,
                                  currentVal: cell.cellValue || '',
                                });
                              } else {
                                setEditingCell({
                                  cellId: cell.id,
                                  columnTitle: col.columnTitle,
                                  columnType: colType,
                                  value: cell.cellValue || '',
                                });
                              }
                            }}
                            style={[styles.dataCell, { borderRightColor: colors.hairline }]}
                          >
                            {colType === 'checkbox' ? (
                              <View style={{ alignItems: 'center' }}>
                                {cell?.cellValue === 'true' ? (
                                  <CheckSquare size={16} color={colors.primary} />
                                ) : (
                                  <Square size={16} color={colors.subtle} />
                                )}
                              </View>
                            ) : isMemberCol ? (
                              <Text
                                style={[
                                  styles.dataCellText,
                                  {
                                    color: cell?.cellValue ? colors.text : colors.subtle,
                                    fontWeight: cell?.cellValue ? '600' : 'normal',
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {cell?.cellValue || t.collab.unassignedMember || '—'}
                              </Text>
                            ) : (
                              <Text
                                style={[
                                  styles.dataCellText,
                                  {
                                    color: cell?.cellValue ? colors.text : colors.subtle,
                                    fontStyle: cell?.cellValue ? 'normal' : 'italic',
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {colType === 'currency'
                                  ? cell?.cellValue
                                    ? formatVnd(parseVnd(cell.cellValue))
                                    : '0đ'
                                  : cell?.cellValue || '—'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </ScrollView>
        )}

        {/* Floating Bottom Glass Summary Bar (Dynamic expense & split calculation) */}
        {sheetSummary && (
          <View pointerEvents="box-none" style={[styles.summaryFooterWrapper, { bottom: bottomClearance }]}>
            <View
              style={[
                styles.summaryFooterCard,
                {
                  backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
                  borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
                },
              ]}
            >
              <View style={styles.summaryFooterStats}>
                {/* Dynamic total expenditure */}
                {(sheetSummary.totalVnd || 0) > 0 && (
                  <View style={styles.summaryStatItem}>
                    <Text style={[styles.summaryStatLabel, { color: colors.subtle }]}>
                      {t.collab.totalExpense}:
                    </Text>
                    <Text style={[styles.summaryStatValue, { color: colors.primary }]}>
                      {formatVnd(sheetSummary.totalVnd || 0)}
                    </Text>
                  </View>
                )}

                {/* Per-person average calculation */}
                {(sheetSummary.splitPerPerson || 0) > 0 && (
                  <View style={styles.summaryStatItem}>
                    <Text style={[styles.summaryStatLabel, { color: colors.subtle }]}>
                      {t.collab.perPerson}:
                    </Text>
                    <Text style={[styles.summaryStatValue, { color: colors.text }]}>
                      {formatVnd(sheetSummary.splitPerPerson || 0)}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.subtle }}>
                      ({Math.max(1, members.length)} {locale === 'vi' ? 'người' : 'pers'})
                    </Text>
                  </View>
                )}

                {/* Completion progress */}
                {(sheetSummary.totalCheckboxes || 0) > 0 && (
                  <View style={styles.summaryStatItem}>
                    <View style={[styles.progressBarTrack, { backgroundColor: colors.hairline }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${sheetSummary.completionPercent || 0}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.summaryProgressText, { color: colors.subtle }]}>
                      {sheetSummary.completedCheckboxes || 0}/{sheetSummary.totalCheckboxes || 0} ({sheetSummary.completionPercent || 0}%)
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Modal: Edit Cell Value with Auto-save */}
        <Modal
          visible={!!editingCell}
          animationType="fade"
          transparent
          onRequestClose={() => setEditingCell(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBackdrop}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {editingCell?.columnTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => setEditingCell(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.subtle }]}>
                {t.collab.editCellHint}
              </Text>
              <TextInput
                value={editingCell?.value || ''}
                onChangeText={handleCellTextChange}
                onBlur={handleSaveCellModal}
                keyboardType={editingCell?.columnType === 'currency' ? 'numeric' : 'default'}
                placeholder={t.collab.editCellHint}
                placeholderTextColor={colors.subtle}
                autoFocus
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.hairline,
                    backgroundColor: colors.canvas,
                  },
                ]}
              />

              {editCellError && (
                <Text style={[styles.inlineErrorText, { color: '#DC2626' }]}>
                  {editCellError}
                </Text>
              )}

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
                  onPress={handleSaveCellModal}
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

        {/* Modal: Member Assignee Picker (1-tap auto-save) */}
        <Modal
          visible={!!memberPickerCell}
          animationType="fade"
          transparent
          onRequestClose={() => setMemberPickerCell(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                  maxHeight: '75%',
                },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t.collab.selectMemberPrompt || 'Chọn thành viên'}
                </Text>
                <TouchableOpacity
                  onPress={() => setMemberPickerCell(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {/* All Members Option */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectMember('Tất cả')}
                  style={[
                    styles.memberPickerRow,
                    { borderBottomColor: colors.hairline, backgroundColor: colors.wash },
                  ]}
                >
                  <View style={[styles.memberAvatarBox, { backgroundColor: colors.primary }]}>
                    <Users size={14} color={colors.onPrimary} />
                  </View>
                  <Text style={[styles.memberNameText, { color: colors.text, fontWeight: '700' }]}>
                    {t.collab.allMembersLabel || 'Tất cả thành viên'}
                  </Text>
                </TouchableOpacity>

                {/* Unassign Option */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectMember('')}
                  style={[styles.memberPickerRow, { borderBottomColor: colors.hairline }]}
                >
                  <View style={[styles.memberAvatarBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <X size={14} color="#EF4444" />
                  </View>
                  <Text style={[styles.memberNameText, { color: '#EF4444' }]}>
                    {t.collab.unassignedMember || 'Bỏ gán'}
                  </Text>
                </TouchableOpacity>

                {/* Circle Members List */}
                {members.map((m: any) => {
                  const displayName =
                    m.nickname || m.user?.profile?.displayName || m.user?.username || 'Thành viên';
                  const avatarUrl = m.user?.profile?.avatarUrl;

                  return (
                    <TouchableOpacity
                      key={m.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectMember(displayName)}
                      style={[styles.memberPickerRow, { borderBottomColor: colors.hairline }]}
                    >
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.memberAvatarImg} />
                      ) : (
                        <View style={[styles.memberAvatarBox, { backgroundColor: colors.wash }]}>
                          <Text style={[styles.memberInitial, { color: colors.primary }]}>
                            {displayName[0]?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.memberNameText, { color: colors.text }]}>
                        {displayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal: Rename Sheet Title (CRUD Sheet Update) */}
        <Modal
          visible={isRenameSheetModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIsRenameSheetModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBackdrop}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t.collab.renameSheet || 'Đổi tên bảng kế hoạch'}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsRenameSheetModalOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.subtle }]}>
                {t.collab.sheetTitlePlaceholder}
              </Text>
              <TextInput
                value={renameDraft}
                onChangeText={setRenameDraft}
                autoFocus
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.hairline,
                    backgroundColor: colors.canvas,
                  },
                ]}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setIsRenameSheetModalOpen(false)}
                  disabled={isRenaming}
                  style={styles.modalCancelBtn}
                >
                  <Text style={[styles.modalCancelText, { color: colors.subtle }]}>
                    {t.common.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveRenameSheet}
                  disabled={isRenaming}
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                >
                  {isRenaming ? (
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

        {/* Modal: Add Column with Preset Choices */}
        <Modal
          visible={isAddColumnModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIsAddColumnModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBackdrop}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                  maxHeight: '85%',
                },
              ]}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t.collab.addColumn}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAddColumnModalOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              {/* Preset Column Choices Grid */}
              <Text style={[styles.inputLabel, { color: colors.subtle, marginBottom: 8 }]}>
                {t.collab.presetColumnsLabel || 'Mẫu cột có sẵn'}
              </Text>
              <View style={styles.presetGrid}>
                {PRESET_COLUMNS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  const presetLabel = locale === 'vi' ? preset.defaultTitle : preset.enTitle;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectPreset(preset)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(16,185,129,0.2)'
                              : 'rgba(16,185,129,0.1)'
                            : colors.canvas,
                          borderColor: isSelected ? colors.primary : colors.hairline,
                        },
                      ]}
                    >
                      {renderPresetIcon(preset.iconName)}
                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {presetLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.subtle, marginTop: 10 }]}>
                {t.collab.newColumnTitlePrompt}
              </Text>
              <TextInput
                value={newColumnTitle}
                onChangeText={setNewColumnTitle}
                placeholder={t.collab.columnTitlePlaceholder}
                placeholderTextColor={colors.subtle}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.hairline,
                    backgroundColor: colors.canvas,
                  },
                ]}
              />

              {addColError && (
                <Text style={[styles.inlineErrorText, { color: '#DC2626' }]}>
                  {addColError}
                </Text>
              )}

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
      </View>
    );
  }

  // =========================================================================
  // VIEW: LIST OF PLANNING SHEETS
  // =========================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {renderNoticeBanner()}

      {/* Sheet List (scroll-under) */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: topClearance + 8,
          paddingHorizontal: 16,
          paddingBottom: bottomClearance + 64,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headingTitle, { color: colors.text }]}>
          {t.collab.planningTitle}
        </Text>
        <Text style={[styles.headingSubtitle, { color: colors.subtle }]}>
          {t.collab.planningSubtitle}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : sheets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <FileSpreadsheet size={40} color={colors.sage} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t.collab.sheetEmptyTitle}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.subtle }]}>
              {t.collab.sheetEmptyDesc}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenCreateModal}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={15} color={colors.onPrimary} />
              <Text style={[styles.emptyBtnText, { color: colors.onPrimary }]}>
                {t.collab.createFirstSheet}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sheetList}>
            {sheets.map((sheet) => {
              const memberCount = Math.max(1, members.length);
              const summary = computePlanningSheetSummary(sheet, memberCount);

              return (
                <TouchableOpacity
                  key={sheet.id}
                  activeOpacity={0.75}
                  onPress={() => setSelectedSheet(sheet)}
                  style={[
                    styles.sheetCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.hairline,
                    },
                  ]}
                >
                  <View style={styles.sheetCardHeader}>
                    <FileSpreadsheet size={24} color={colors.sage} />
                    <View style={styles.sheetCardInfo}>
                      <Text style={[styles.sheetCardTitle, { color: colors.text }]} numberOfLines={1}>
                        {sheet.title}
                      </Text>

                      {/* Summary pill */}
                      {(summary.totalVnd || 0) > 0 ? (
                        <Text style={[styles.sheetCardStats, { color: colors.primary, fontWeight: '700' }]}>
                          {t.collab.totalExpense}: {formatVnd(summary.totalVnd || 0)}
                          {summary.splitPerPerson ? ` (${formatVnd(summary.splitPerPerson)}/${locale === 'vi' ? 'người' : 'pers'})` : ''}
                        </Text>
                      ) : (summary.totalCheckboxes || 0) > 0 ? (
                        <Text style={[styles.sheetCardStats, { color: colors.subtle }]}>
                          {summary.completedCheckboxes || 0}/{summary.totalCheckboxes || 0} ({summary.completionPercent || 0}%)
                        </Text>
                      ) : (
                        <Text style={[styles.sheetCardStats, { color: colors.subtle }]}>
                          {t.collab.columnsCount.replace('{count}', String(sheet.columns.length))} •{' '}
                          {t.collab.rowsCount.replace('{count}', String(sheet.rows.length))}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.sheetCardFooter, { borderTopColor: colors.hairline }]}>
                    <Text style={[styles.sheetCreator, { color: colors.subtle }]}>
                      {sheet.creator?.user?.profile?.displayName || t.collab.memberDefault}
                    </Text>
                    <Text style={[styles.sheetDate, { color: colors.subtle }]}>
                      {new Date(sheet.createdAt).toLocaleDateString(dateLocale)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Create FAB */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenCreateModal}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: bottomClearance,
            shadowColor: colors.primary,
          },
        ]}
      >
        <Plus size={18} color={colors.onPrimary} />
        <Text style={[styles.fabText, { color: colors.onPrimary }]}>
          {t.collab.createSheet}
        </Text>
      </TouchableOpacity>

      {/* Modal: Create Sheet with Template Picker */}
      <Modal
        visible={isCreateModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.collab.createSheet}
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.subtle }]}>
              {t.collab.selectTemplate}
            </Text>

            {/* Template selector pills */}
            <View style={styles.templatePickerGrid}>
              {(['expense', 'packing', 'trip', 'task', 'custom'] as PlanningTemplateType[]).map(
                (tpl) => {
                  const isSelected = selectedTemplate === tpl;
                  const tplDef = PLANNING_TEMPLATES[tpl];
                  const label =
                    tpl === 'expense'
                      ? t.collab.templateExpenseTitle
                      : tpl === 'packing'
                      ? t.collab.templatePackingTitle
                      : tpl === 'trip'
                      ? t.collab.templateTripTitle
                      : tpl === 'task'
                      ? t.collab.templateTaskTitle
                      : t.collab.templateCustomTitle;

                  return (
                    <TouchableOpacity
                      key={tpl}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedTemplate(tpl);
                        if (!newTitle) {
                          setNewTitle(tplDef?.defaultTitle || '');
                        }
                      }}
                      style={[
                        styles.templatePill,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(16,185,129,0.2)'
                              : 'rgba(16,185,129,0.1)'
                            : colors.canvas,
                          borderColor: isSelected ? colors.primary : colors.hairline,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.templatePillText,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>

            <Text style={[styles.inputLabel, { color: colors.subtle, marginTop: 12 }]}>
              {t.collab.sheetTitlePlaceholder}
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={
                PLANNING_TEMPLATES[selectedTemplate]?.defaultTitle || t.collab.sheetTitlePlaceholder
              }
              placeholderTextColor={colors.subtle}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.hairline,
                  backgroundColor: colors.canvas,
                },
              ]}
            />

            {createError && (
              <Text style={[styles.inlineErrorText, { color: '#DC2626' }]}>
                {createError}
              </Text>
            )}

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

      {/* Shared Mobile Confirmation Modal */}
      <MobileConfirmModal
        visible={!!confirmModal?.isOpen}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleExecuteConfirm}
        title={confirmModal?.title || ''}
        description={confirmModal?.description}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isConfirmBusy || isDeletingSheet}
      />
    </View>
  );
};

const createStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subToolbarContainer: {
      position: 'absolute',
      left: 12,
      right: 12,
      zIndex: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    subToolbarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    glassPillTouch: {
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    glassActionTouch: {
      height: 38,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    glassIconTouch: {
      width: 38,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    glassActionBtnText: {
      fontSize: 12,
      fontWeight: '600',
    },
    glassActionBtnPrimary: {
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    glassActionBtnTextPri: {
      fontSize: 12,
      fontWeight: '700',
    },
    backText: {
      fontSize: 13,
      fontWeight: '700',
    },
    noticeWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 50,
      alignItems: 'center',
    },
    noticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    noticeText: {
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
    headingTitle: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headingSubtitle: {
      fontSize: 13,
      marginTop: 4,
      marginBottom: 20,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginTop: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: 12,
    },
    emptyDesc: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 16,
      lineHeight: 18,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    emptyBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    sheetList: {
      gap: 12,
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
      fontSize: 15,
      fontWeight: '700',
    },
    sheetCardStats: {
      fontSize: 11,
      marginTop: 3,
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
    fab: {
      position: 'absolute',
      right: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      height: 44,
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
    gridContainer: {
      flex: 1,
    },
    // Row Card Styles
    rowCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    rowCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    rowCardBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    rowCardIndexText: {
      fontSize: 11,
      fontWeight: '700',
    },
    rowCardDeleteBtn: {
      padding: 4,
    },
    rowCardDeleteConfirm: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rowCardDeleteConfirmBtn: {
      backgroundColor: '#DC2626',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    rowCardDeleteConfirmText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    rowCardCancelBtn: {
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    rowCardCancelText: {
      fontSize: 10,
      fontWeight: '600',
    },
    rowCardFields: {
      gap: 6,
    },
    rowCardCheckboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    },
    rowCardCheckboxLabel: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    rowCardStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    rowCardFieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      gap: 8,
    },
    rowCardFieldLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    rowCardFieldValue: {
      fontSize: 13,
      flex: 1,
      textAlign: 'right',
    },
    rowCardCurrencyText: {
      fontSize: 14,
      fontWeight: '700',
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '700',
    },
    emptyNoticeCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
      marginTop: 20,
    },
    emptyNoticeTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 10,
      marginBottom: 12,
    },
    emptyAddRowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    emptyAddRowText: {
      fontSize: 12,
      fontWeight: '700',
    },
    // Summary Footer Card
    summaryFooterWrapper: {
      position: 'absolute',
      left: 14,
      right: 14,
      zIndex: 25,
    },
    summaryFooterCard: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    summaryFooterStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      flexWrap: 'wrap',
    },
    summaryStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    summaryStatLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    summaryStatValue: {
      fontSize: 13,
      fontWeight: '800',
    },
    progressBarTrack: {
      width: 50,
      height: 5,
      borderRadius: 999,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 999,
    },
    summaryProgressText: {
      fontSize: 11,
      fontWeight: '600',
    },
    // Table Grid
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
    // Modals
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
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
    },
    templatePickerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 6,
    },
    templatePill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    templatePillText: {
      fontSize: 11,
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    presetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    presetChipText: {
      fontSize: 11,
    },
    memberPickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    memberAvatarBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarImg: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    memberInitial: {
      fontSize: 12,
      fontWeight: '700',
    },
    memberNameText: {
      fontSize: 13,
      fontWeight: '500',
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
