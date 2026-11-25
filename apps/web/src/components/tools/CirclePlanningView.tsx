'use client';

import { createPortal } from 'react-dom';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Table,
  Check,
  Clock,
  AlertCircle,
  X,
  Share2,
  CheckSquare,
  Square,
  Wallet,
  Luggage,
  ListTodo,
  MapPin,
  Sparkles,
  Edit3,
  User,
  Calendar,
  Tag,
  Activity,
  FileText,
  DollarSign,
  Users,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useCircleMembersQuery } from '../../hooks/use-circle-queries';
import {
  usePlanningSheetsQuery,
  usePlanningSheetDetailQuery,
  useCreatePlanningSheetMutation,
  useUpdatePlanningSheetMutation,
  useAddSheetColumnMutation,
  useUpdateSheetColumnMutation,
  useDeleteSheetColumnMutation,
  useAddSheetRowMutation,
  useDeleteSheetRowMutation,
  useUpdateSheetCellMutation,
  useDeletePlanningSheetMutation,
  useSharePlanningSheetMutation,
  TOOLS_KEYS,
} from '../../hooks/use-circle-tools';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { SheetCellEntity } from '@circle/types';
import { ConfirmModal } from '../ui/ConfirmModal';
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

interface CirclePlanningViewProps {
  circleId: string;
}

export const CirclePlanningView: React.FC<CirclePlanningViewProps> = ({ circleId }) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const queryClient = useQueryClient();

  const activePlanningSheetId = useCircleStore((s) => s.activePlanningSheetId);
  const setActivePlanningSheetId = useCircleStore((s) => s.setActivePlanningSheetId);

  // Queries
  const { data: sheets = [], isLoading: isLoadingSheets } = usePlanningSheetsQuery(circleId);
  const { data: members = [] } = useCircleMembersQuery(circleId);

  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const { data: activeSheet, isLoading: isLoadingDetail } =
    usePlanningSheetDetailQuery(circleId, selectedSheetId);

  // Mutations
  const createSheetMutation = useCreatePlanningSheetMutation(circleId);
  const updateSheetMutation = useUpdatePlanningSheetMutation(circleId, selectedSheetId || '');
  const addColumnMutation = useAddSheetColumnMutation(circleId, selectedSheetId || '');
  const updateColumnMutation = useUpdateSheetColumnMutation(circleId, selectedSheetId || '');
  const deleteColumnMutation = useDeleteSheetColumnMutation(circleId, selectedSheetId || '');
  const addRowMutation = useAddSheetRowMutation(circleId, selectedSheetId || '');
  const deleteRowMutation = useDeleteSheetRowMutation(circleId, selectedSheetId || '');
  const updateCellMutation = useUpdateSheetCellMutation(circleId, selectedSheetId || '');
  const deleteSheetMutation = useDeletePlanningSheetMutation(circleId);
  const shareSheetMutation = useSharePlanningSheetMutation(circleId, selectedSheetId || '');

  // Modals & form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PlanningTemplateType>('expense');
  const [newSheetTitle, setNewSheetTitle] = useState('');

  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnType, setNewColumnType] = useState<SheetColumnType>('text');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Column edit modal
  const [editingColumn, setEditingColumn] = useState<{ id: string; title: string; type: SheetColumnType } | null>(null);

  // Sheet Title inline edit state
  const [isEditingSheetTitle, setIsEditingSheetTitle] = useState(false);
  const [sheetTitleDraft, setSheetTitleDraft] = useState('');

  // Auto-save feedback state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceCellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cell editing state
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [cellDraftValue, setCellDraftValue] = useState<string>('');
  const cellDraftValueRef = useRef<string>('');
  cellDraftValueRef.current = cellDraftValue;

  // Member Assignee popover state: cellId -> boolean
  const [memberPicker, setMemberPicker] = useState<{
    cellId: string;
    top: number;
    bottom: number;
    left: number;
    width: number;
    maxHeight: number;
    openAbove: boolean;
  } | null>(null);
  const memberPickerCellId = memberPicker?.cellId;
  const memberPickerRef = useRef<HTMLDivElement>(null);
  const memberPickerAnchor = useRef<HTMLElement | null>(null);

  // Confirmations & errors
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'sheet' | 'column' | 'row';
    id: string;
    title: string;
    description?: string;
  } | null>(null);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);

  const handleExecuteConfirm = async () => {
    if (!confirmModal) return;
    try {
      if (confirmModal.type === 'sheet') {
        await handleDeleteSheet(confirmModal.id);
      } else if (confirmModal.type === 'column') {
        await handleDeleteColumn(confirmModal.id);
      } else if (confirmModal.type === 'row') {
        await handleDeleteRow(confirmModal.id);
      }
      setConfirmModal(null);
    } catch {
      // error handled in sub-handler
    }
  };

  // Jump from Command Center if activePlanningSheetId was set
  useEffect(() => {
    if (activePlanningSheetId) {
      setSelectedSheetId(activePlanningSheetId);
      setActivePlanningSheetId(null);
    }
  }, [activePlanningSheetId, setActivePlanningSheetId]);

  // Sync title draft when activeSheet loads
  useEffect(() => {
    if (activeSheet?.title) {
      setSheetTitleDraft(activeSheet.title);
    }
  }, [activeSheet?.title]);

  // Real-time Socket Synchronization
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !circleId) return;

    const handleSheetUpdate = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.planningSheets(circleId) });
      if (payload?.sheetId || selectedSheetId) {
        queryClient.invalidateQueries({
          queryKey: TOOLS_KEYS.planningSheetDetail(circleId, payload?.sheetId || selectedSheetId),
        });
      }
    };

    const handleSheetDeleted = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: TOOLS_KEYS.planningSheets(circleId) });
      if (selectedSheetId === payload?.sheetId) {
        setSelectedSheetId(null);
      }
    };

    socket.on('circle:sheet-cell-updated', handleSheetUpdate);
    socket.on('circle:sheet-structure-updated', handleSheetUpdate);
    socket.on('circle:sheet-deleted', handleSheetDeleted);

    return () => {
      socket.off('circle:sheet-cell-updated', handleSheetUpdate);
      socket.off('circle:sheet-structure-updated', handleSheetUpdate);
      socket.off('circle:sheet-deleted', handleSheetDeleted);
    };
  }, [circleId, selectedSheetId, queryClient]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsAddColumnModalOpen(false);
        setEditingColumn(null);
        memberPickerAnchor.current?.focus({ preventScroll: true });
        memberPickerAnchor.current = null;
        setMemberPicker(null);
        setEditingCellId(null);
        setIsEditingSheetTitle(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!memberPicker) return;
    memberPickerRef.current?.querySelector('button')?.focus({ preventScroll: true });
    const close = () => setMemberPicker(null);
    const closeOutside = (event: PointerEvent) => {
      if (!memberPickerRef.current?.contains(event.target as Node) &&
          !memberPickerAnchor.current?.contains(event.target as Node)) close();
    };
    const closeOnScroll = (event: Event) => {
      if (!memberPickerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [memberPicker]);

  // Cleanup auto-save timers
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (debounceCellTimerRef.current) clearTimeout(debounceCellTimerRef.current);
    };
  }, []);

  // Computed summary for the active sheet dynamically taking circle members count into account
  const sheetSummary = useMemo(() => {
    if (!activeSheet) return null;
    const memberCount = Math.max(1, members.length);
    return computePlanningSheetSummary(activeSheet, memberCount);
  }, [activeSheet, members.length]);

  const triggerAutoSaveFeedback = useCallback(() => {
    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saved');
      autoSaveTimerRef.current = setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    }, 400);
  }, []);

  // Handlers
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    const titleToUse =
      newSheetTitle.trim() ||
      PLANNING_TEMPLATES[selectedTemplate]?.defaultTitle ||
      t.collab.createSheet;

    try {
      const created = await createSheetMutation.mutateAsync({
        title: titleToUse,
        templateType: selectedTemplate,
      });
      setNewSheetTitle('');
      setIsCreateModalOpen(false);
      setSelectedSheetId(created.id);
    } catch (err: any) {
      setModalError(err?.message || t.collab.createSheetError);
    }
  };

  // Sheet Title Auto-save Rename
  const handleSaveSheetTitle = async () => {
    if (!selectedSheetId || !sheetTitleDraft.trim() || sheetTitleDraft.trim() === activeSheet?.title) {
      setIsEditingSheetTitle(false);
      return;
    }
    try {
      triggerAutoSaveFeedback();
      await updateSheetMutation.mutateAsync({ title: sheetTitleDraft.trim() });
      setIsEditingSheetTitle(false);
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.createSheetError);
      setIsEditingSheetTitle(false);
    }
  };

  // Add Column with Preset
  const handleSelectPreset = (preset: ColumnPreset) => {
    setSelectedPresetId(preset.id);
    const presetTitle = locale === 'vi' ? preset.defaultTitle : preset.enTitle;
    setNewColumnTitle(presetTitle);
    setNewColumnType(preset.type);
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newColumnTitle.trim() || !selectedSheetId) return;

    try {
      await addColumnMutation.mutateAsync({
        columnTitle: newColumnTitle.trim(),
        columnType: newColumnType,
      });
      setNewColumnTitle('');
      setNewColumnType('text');
      setSelectedPresetId(null);
      setIsAddColumnModalOpen(false);
      triggerAutoSaveFeedback();
    } catch (err: any) {
      setModalError(err?.message || t.collab.addColumnError);
    }
  };

  // Update Column (Rename / Change type)
  const handleSaveColumnEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheetId || !editingColumn || !editingColumn.title.trim()) return;

    try {
      triggerAutoSaveFeedback();
      await updateColumnMutation.mutateAsync({
        columnId: editingColumn.id,
        input: {
          columnTitle: editingColumn.title.trim(),
          columnType: editingColumn.type,
        },
      });
      setEditingColumn(null);
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.editColumn);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!selectedSheetId) return;
    setPlanningError(null);
    try {
      await deleteColumnMutation.mutateAsync(columnId);
      triggerAutoSaveFeedback();
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.deleteColumn);
    }
  };

  const handleAddRow = async () => {
    if (!selectedSheetId) return;
    setPlanningError(null);
    try {
      await addRowMutation.mutateAsync({});
      triggerAutoSaveFeedback();
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.addRowError);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!selectedSheetId) return;
    setPlanningError(null);
    try {
      await deleteRowMutation.mutateAsync(rowId);
      triggerAutoSaveFeedback();
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.deleteRow);
    }
  };

  // Cell editing & auto-save
  const handleStartEditCell = (cell: SheetCellEntity) => {
    setEditingCellId(cell.id);
    setCellDraftValue(cell.cellValue || '');
  };

  const executeSaveCell = async (cellId: string, value: string) => {
    if (!selectedSheetId) return;
    try {
      triggerAutoSaveFeedback();
      await updateCellMutation.mutateAsync({
        cellId,
        input: { cellValue: value },
      });
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.updateCellError);
    }
  };

  const handleCellChange = (cellId: string, nextValue: string) => {
    setCellDraftValue(nextValue);
    if (debounceCellTimerRef.current) clearTimeout(debounceCellTimerRef.current);
    debounceCellTimerRef.current = setTimeout(() => {
      executeSaveCell(cellId, nextValue);
    }, 600);
  };

  const handleCellBlur = (cellId: string) => {
    if (debounceCellTimerRef.current) clearTimeout(debounceCellTimerRef.current);
    executeSaveCell(cellId, cellDraftValueRef.current);
    setEditingCellId(null);
  };

  const handleToggleCheckboxCell = async (cell: SheetCellEntity) => {
    if (!selectedSheetId) return;
    const nextVal = cell.cellValue === 'true' ? '' : 'true';
    executeSaveCell(cell.id, nextVal);
  };

  const handleCycleStatusCell = async (cell: SheetCellEntity) => {
    if (!selectedSheetId) return;
    const current = cell.cellValue || 'todo';
    const nextStatus = current === 'todo' ? 'in_progress' : current === 'in_progress' ? 'done' : 'todo';
    executeSaveCell(cell.id, nextStatus);
  };

  // Member Assignee Selection (Auto-save)
  const openMemberPicker = (cellId: string, button: HTMLButtonElement) => {
    if (memberPicker?.cellId === cellId) {
      setMemberPicker(null);
      return;
    }

    memberPickerAnchor.current = button;
    const anchor = button.getBoundingClientRect();
    const gap = 4;
    const margin = 8;
    const viewportHeight = window.innerHeight;
    const below = viewportHeight - anchor.bottom - gap - margin;
    const above = anchor.top - gap - margin;
    const openAbove = below < 248 && above > below;
    const width = Math.min(224, window.innerWidth - margin * 2);
    setMemberPicker({
      cellId,
      top: anchor.bottom + gap,
      bottom: viewportHeight - anchor.top + gap,
      left: Math.max(margin, Math.min(anchor.left, window.innerWidth - width - margin)),
      width,
      maxHeight: Math.max(0, openAbove ? above : below),
      openAbove,
    });
  };

  const handleSelectMember = (cellId: string, memberDisplayName: string) => {
    memberPickerAnchor.current?.focus({ preventScroll: true });
    memberPickerAnchor.current = null;
    executeSaveCell(cellId, memberDisplayName);
    setMemberPicker(null);
  };

  const handleDeleteSheet = async (sheetId: string) => {
    setPlanningError(null);
    try {
      await deleteSheetMutation.mutateAsync(sheetId);
      if (selectedSheetId === sheetId) {
        setSelectedSheetId(null);
      }
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.deleteSheetError);
    }
  };

  const handleShareToChat = async () => {
    if (!selectedSheetId) return;
    setPlanningError(null);
    try {
      await shareSheetMutation.mutateAsync();
      setShareSuccessNotice(t.collab.sharedSheetSuccess);
      setTimeout(() => setShareSuccessNotice(null), 3500);
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.shareSheetToChat);
    }
  };

  // Helper to test if a column is a member assignee column
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

  // Template cards definition
  const templateCards: Array<{
    type: PlanningTemplateType;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      type: 'expense',
      title: t.collab.templateExpenseTitle,
      desc: t.collab.templateExpenseDesc,
      icon: Wallet,
    },
    {
      type: 'packing',
      title: t.collab.templatePackingTitle,
      desc: t.collab.templatePackingDesc,
      icon: Luggage,
    },
    {
      type: 'trip',
      title: t.collab.templateTripTitle,
      desc: t.collab.templateTripDesc,
      icon: MapPin,
    },
    {
      type: 'task',
      title: t.collab.templateTaskTitle,
      desc: t.collab.templateTaskDesc,
      icon: ListTodo,
    },
    {
      type: 'custom',
      title: t.collab.templateCustomTitle,
      desc: t.collab.templateCustomDesc,
      icon: Sparkles,
    },
  ];

  // Helper for preset icons
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'check-square':
        return <CheckSquare className="w-4 h-4" />;
      case 'activity':
        return <Activity className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'dollar-sign':
        return <DollarSign className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'file-text':
        return <FileText className="w-4 h-4" />;
      case 'tag':
        return <Tag className="w-4 h-4" />;
      default:
        return <Check className="w-4 h-4" />;
    }
  };

  // =========================================================================
  // VIEW: SHEET DETAIL (SPREADSHEET GRID)
  // =========================================================================
  if (selectedSheetId) {
    return (
      <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
        {/* Floating Top Controls */}
        <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex flex-col items-center px-4 md:px-6 gap-2">
          <div className="w-full flex items-center justify-between gap-2 flex-wrap">
            {/* Left side: Back to Planning Board + Sheet Title with Inline Rename */}
            <div className="pointer-events-auto flex items-center gap-2 max-w-full sm:max-w-md">
              <button
                type="button"
                onClick={() => {
                  setMemberPicker(null);
                  setSelectedSheetId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shrink-0"
                title={t.collab.planningBoard || 'Bảng kế hoạch'}
              >
                <ChevronLeft className="h-4 w-4 shrink-0 text-circle-sage dark:text-circle-dark-primary" />
                <span>{t.collab.planningBoard || 'Bảng kế hoạch'}</span>
              </button>

              {/* Sheet Title Display & Rename */}
              <div className="flex items-center gap-1 px-3 h-9 rounded-full backdrop-blur-xl bg-white/80 dark:bg-circle-dark-surface/80 border border-circle-hairline/60 dark:border-white/10 shadow-xs min-w-0">
                {isEditingSheetTitle ? (
                  <input
                    type="text"
                    value={sheetTitleDraft}
                    onChange={(e) => setSheetTitleDraft(e.target.value)}
                    onBlur={handleSaveSheetTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSheetTitle();
                      if (e.key === 'Escape') setIsEditingSheetTitle(false);
                    }}
                    autoFocus
                    className="text-xs sm:text-sm font-bold bg-transparent outline-none text-circle-charcoal dark:text-circle-dark-text border-b border-circle-primary w-28 sm:w-44"
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingSheetTitle(true)}
                    className="flex items-center gap-1.5 cursor-pointer group"
                    title={t.collab.renameSheet || 'Đổi tên bảng'}
                  >
                    <span className="text-xs sm:text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate max-w-[120px] sm:max-w-[180px]">
                      {activeSheet?.title || '...'}
                    </span>
                    <Edit3 className="w-3 h-3 text-circle-slate/60 group-hover:text-circle-primary transition-colors shrink-0" />
                  </div>
                )}
              </div>

              {/* Auto-save status feedback badge */}
              {autoSaveStatus !== 'idle' && (
                <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-circle-slate dark:text-circle-dark-muted px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 animate-fade-in shrink-0">
                  {autoSaveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-circle-primary" />
                      <span>{t.collab.autoSaving || 'Đang lưu...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>{t.collab.autoSaved || 'Đã lưu'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right side: Actions */}
            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareToChat}
                disabled={shareSheetMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title={t.collab.shareSheetToChat}
              >
                {shareSheetMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-circle-sage" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-circle-sage dark:text-circle-dark-primary" />
                )}
                <span className="hidden md:inline">{t.collab.shareSheetToChat}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setNewColumnTitle('');
                  setNewColumnType('text');
                  setSelectedPresetId(null);
                  setIsAddColumnModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-circle-sage dark:text-circle-dark-primary" />
                <span>{t.collab.addColumn}</span>
              </button>

              <button
                type="button"
                onClick={handleAddRow}
                disabled={addRowMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm border border-circle-hairline/60 dark:border-white/12 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.collab.addRow}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'sheet',
                    id: selectedSheetId,
                    title: t.collab.deleteSheet,
                    description: t.collab.deleteSheetConfirm,
                  })
                }
                className="inline-flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-rose-500/10 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-all active:scale-95 cursor-pointer"
                title={t.collab.deleteSheet}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Share Success Notice */}
          {shareSuccessNotice && (
            <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm animate-fade-in">
              <Check className="w-4 h-4" />
              <span>{shareSuccessNotice}</span>
            </div>
          )}
        </div>

        {/* Spreadsheet Content Area */}
        <div className="flex-1 overflow-auto p-6 pt-28 lg:pt-20 pb-28 bg-circle-canvas/40 dark:bg-circle-dark-bg/40">
          {planningError && (
            <div className="mb-4 max-w-5xl mx-auto flex items-center justify-between gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{planningError}</span>
              </div>
              <button type="button" onClick={() => setPlanningError(null)} className="p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {isLoadingDetail ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-circle-sage dark:text-circle-dark-primary" />
            </div>
          ) : !activeSheet ? (
            <div className="h-full flex items-center justify-center text-circle-slate dark:text-circle-dark-muted">
              {t.collab.sheetEmptyTitle}
            </div>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <div className="border border-circle-hairline dark:border-circle-dark-border rounded-2xl overflow-hidden bg-white dark:bg-circle-dark-surface shadow-xs">
                <table className="min-w-full divide-y divide-circle-hairline dark:divide-circle-dark-border">
                  {/* Table Header */}
                  <thead className="bg-circle-canvas dark:bg-circle-dark-surface/80">
                    <tr>
                      <th
                        scope="col"
                        className="w-12 px-3 py-3.5 text-center text-xs font-bold text-circle-slate dark:text-circle-dark-muted uppercase tracking-wider border-r border-circle-hairline dark:border-circle-dark-border select-none"
                      >
                        #
                      </th>
                      {activeSheet.columns.map((col) => {
                        return (
                          <th
                            key={col.id}
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider border-r border-circle-hairline dark:border-circle-dark-border min-w-[170px] group relative select-none"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{col.columnTitle}</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingColumn({
                                      id: col.id,
                                      title: col.columnTitle,
                                      type: (col.columnType || 'text') as SheetColumnType,
                                    })
                                  }
                                  className="p-1 rounded text-circle-slate hover:text-circle-primary hover:bg-circle-wash dark:hover:bg-circle-dark-hover transition-colors"
                                  title={t.collab.editColumn}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      type: 'column',
                                      id: col.id,
                                      title: t.collab.deleteColumn,
                                      description: t.collab.deleteColumnConfirm,
                                    })
                                  }
                                  className="p-1 rounded text-circle-slate hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  title={t.collab.deleteColumn}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-circle-hairline dark:divide-circle-dark-border bg-white dark:bg-circle-dark-surface">
                    {activeSheet.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activeSheet.columns.length + 1}
                          className="text-center py-12 text-sm text-circle-slate dark:text-circle-dark-muted"
                        >
                          {t.collab.sheetEmptyRows}
                        </td>
                      </tr>
                    ) : (
                      activeSheet.rows.map((row, rIdx) => {
                        return (
                          <tr
                            key={row.id}
                            className="group hover:bg-circle-wash/50 dark:hover:bg-circle-dark-hover/40 transition-colors"
                          >
                            {/* Row Index & Row Delete Action */}
                            <td className="w-12 px-2 py-2 text-center text-xs font-medium text-circle-slate dark:text-circle-dark-muted border-r border-circle-hairline dark:border-circle-dark-border select-none bg-circle-canvas/50 dark:bg-circle-dark-surface/50 relative">
                              <div className="flex items-center justify-center">
                                <span className="group-hover:hidden">{rIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      type: 'row',
                                      id: row.id,
                                      title: t.collab.deleteRow,
                                      description: t.collab.deleteRowConfirm,
                                    })
                                  }
                                  className="hidden group-hover:flex items-center justify-center text-circle-slate hover:text-rose-500 p-0.5 rounded transition-colors"
                                  title={t.collab.deleteRow}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Cells */}
                            {activeSheet.columns.map((col) => {
                              const cell = row.cells.find((c) => c.columnId === col.id);
                              const isEditing = cell && editingCellId === cell.id;
                              const isMemberCol = isMemberColumn(col);
                              const colType = (col.columnType || (isMemberCol ? 'member' : 'text')) as SheetColumnType;
                              const isMemberPickerOpen = cell && memberPickerCellId === cell.id;

                              return (
                                <td
                                  key={col.id}
                                  className="px-3 py-2 text-sm border-r border-circle-hairline dark:border-circle-dark-border relative group/cell"
                                  onClick={() => {
                                    if (!cell || isMemberCol) return;
                                    if (colType === 'checkbox') {
                                      handleToggleCheckboxCell(cell);
                                    } else if (colType === 'status') {
                                      handleCycleStatusCell(cell);
                                    } else if (!isEditing) {
                                      handleStartEditCell(cell);
                                    }
                                  }}
                                >
                                  {/* Member Assignee Cell */}
                                  {isMemberCol ? (
                                    <div className="relative min-h-[28px] flex items-center justify-between cursor-pointer">
                                      <button
                                        type="button"
                                        disabled={!cell}
                                        aria-label={t.collab.selectMemberPrompt}
                                        aria-haspopup="dialog"
                                        aria-expanded={Boolean(isMemberPickerOpen)}
                                        onClick={(event) => {
                                          if (cell) openMemberPicker(cell.id, event.currentTarget);
                                        }}
                                        className="flex w-full items-center gap-1.5 text-left"
                                      >
                                        <div className="w-5 h-5 rounded-full bg-circle-primary/15 text-circle-primary flex items-center justify-center text-[10px] font-bold">
                                          {cell?.cellValue ? cell.cellValue[0]?.toUpperCase() : <User className="w-3 h-3" />}
                                        </div>
                                        <span
                                          className={`text-sm ${
                                            cell?.cellValue
                                              ? 'font-medium text-circle-charcoal dark:text-circle-dark-text'
                                              : 'text-circle-slate/40 dark:text-circle-dark-muted/40 italic text-xs'
                                          }`}
                                        >
                                          {cell?.cellValue || t.collab.unassignedMember || 'Chưa gán'}
                                        </span>
                                      </button>

                                      {/* Member Selection Popover */}
                                      {isMemberPickerOpen && memberPicker && createPortal(
                                        <div
                                          ref={memberPickerRef}
                                          role="dialog"
                                          aria-label={t.collab.selectMemberPrompt}
                                          style={{
                                            left: memberPicker.left,
                                            top: memberPicker.openAbove ? undefined : memberPicker.top,
                                            bottom: memberPicker.openAbove ? memberPicker.bottom : undefined,
                                            width: memberPicker.width,
                                            maxHeight: memberPicker.maxHeight,
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="fixed z-[100] flex flex-col overflow-hidden p-2 rounded-xl glass-sheet border border-circle-hairline/80 dark:border-white/12 shadow-xl animate-fade-in"
                                        >
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted px-2 py-1 mb-1 border-b border-circle-hairline/60 dark:border-white/10">
                                            {t.collab.selectMemberPrompt || 'Chọn thành viên'}
                                          </div>
                                          <div className="min-h-0 max-h-48 overflow-y-auto space-y-1">
                                            {/* All Members Option */}
                                            <button
                                              type="button"
                                              onClick={() => handleSelectMember(cell.id, 'Tất cả')}
                                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-hover text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text text-left transition-colors"
                                            >
                                              <Users className="w-4 h-4 text-circle-primary shrink-0" />
                                              <span>{t.collab.allMembersLabel || 'Tất cả thành viên'}</span>
                                            </button>

                                            {/* Unassign Option */}
                                            <button
                                              type="button"
                                              onClick={() => handleSelectMember(cell.id, '')}
                                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-rose-500/10 text-xs font-medium text-rose-500 text-left transition-colors"
                                            >
                                              <X className="w-4 h-4 shrink-0" />
                                              <span>{t.collab.unassignedMember || 'Bỏ gán'}</span>
                                            </button>

                                            {/* Actual Circle Members */}
                                            {members.map((m: any) => {
                                              const displayName =
                                                m.nickname || m.user?.profile?.displayName || m.user?.username || 'Thành viên';
                                              const avatarUrl = m.user?.profile?.avatarUrl;
                                              return (
                                                <button
                                                  key={m.id}
                                                  type="button"
                                                  onClick={() => handleSelectMember(cell.id, displayName)}
                                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-circle-wash dark:hover:bg-circle-dark-hover text-xs text-circle-charcoal dark:text-circle-dark-text text-left transition-colors"
                                                >
                                                  {avatarUrl ? (
                                                    <img
                                                      src={avatarUrl}
                                                      alt={displayName}
                                                      className="w-5 h-5 rounded-full object-cover shrink-0"
                                                    />
                                                  ) : (
                                                    <div className="w-5 h-5 rounded-full bg-circle-primary/10 text-circle-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                      {displayName[0]?.toUpperCase()}
                                                    </div>
                                                  )}
                                                  <span className="truncate font-medium">{displayName}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>,
                                        document.body,
                                      )}
                                    </div>
                                  ) : isEditing ? (
                                    /* Inline Text / Currency Edit with Auto-save on blur / debounced change */
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type={colType === 'currency' ? 'number' : 'text'}
                                        value={cellDraftValue}
                                        onChange={(e) => handleCellChange(cell.id, e.target.value)}
                                        onBlur={() => handleCellBlur(cell.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleCellBlur(cell.id);
                                          if (e.key === 'Escape') setEditingCellId(null);
                                        }}
                                        autoFocus
                                        className="w-full px-2 py-1 text-sm rounded border border-circle-primary bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text outline-none focus:ring-1 focus:ring-circle-primary shadow-inner"
                                      />
                                    </div>
                                  ) : colType === 'checkbox' ? (
                                    /* Checkbox toggle */
                                    <div className="flex items-center justify-center min-h-[28px] cursor-pointer">
                                      {cell?.cellValue === 'true' ? (
                                        <CheckSquare className="w-5 h-5 text-circle-sage dark:text-circle-dark-primary transition-transform active:scale-90" />
                                      ) : (
                                        <Square className="w-5 h-5 text-circle-slate/40 hover:text-circle-slate transition-colors active:scale-90" />
                                      )}
                                    </div>
                                  ) : colType === 'status' ? (
                                    /* Status cycle */
                                    <div className="flex items-center min-h-[28px] cursor-pointer">
                                      {cell?.cellValue === 'done' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          <Check className="w-3 h-3" />
                                          {t.collab.completed}
                                        </span>
                                      ) : cell?.cellValue === 'in_progress' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                          {t.collab.progress}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-circle-slate dark:text-circle-dark-muted border border-slate-500/20">
                                          {t.collab.markUncompleted}
                                        </span>
                                      )}
                                    </div>
                                  ) : colType === 'currency' ? (
                                    /* Currency display */
                                    <div className="flex items-center justify-between min-h-[28px] cursor-pointer font-mono tabular-nums">
                                      <span
                                        className={
                                          cell?.cellValue
                                            ? 'text-circle-charcoal dark:text-circle-dark-text font-semibold text-sm'
                                            : 'text-circle-slate/40 dark:text-circle-dark-muted/40 italic text-xs'
                                        }
                                      >
                                        {cell?.cellValue ? formatVnd(parseVnd(cell.cellValue)) : '0đ'}
                                      </span>
                                    </div>
                                  ) : (
                                    /* Plain text / date */
                                    <div className="flex items-center justify-between min-h-[28px] cursor-pointer">
                                      <span
                                        className={`text-sm ${
                                          cell?.cellValue
                                            ? 'text-circle-charcoal dark:text-circle-dark-text font-normal'
                                            : 'text-circle-slate/40 dark:text-circle-dark-muted/40 italic text-xs'
                                        }`}
                                      >
                                        {cell?.cellValue || '—'}
                                      </span>

                                      {cell?.lastEditedBy && (
                                        <div
                                          className="opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-circle-slate dark:text-circle-dark-muted bg-circle-wash dark:bg-circle-dark-hover px-1.5 py-0.5 rounded-full ml-1"
                                          title={`${t.collab.editCellHint} (${
                                            cell.lastEditedBy.user?.profile?.displayName ||
                                            t.collab.memberDefault
                                          })`}
                                        >
                                          <Clock className="w-2.5 h-2.5" />
                                          <span className="truncate max-w-[60px]">
                                            {cell.lastEditedBy.user?.profile?.displayName?.split(' ')[0] ||
                                              t.collab.memberDefault}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Glass Summary Footer (Dynamic calculations for Expense & Progress) */}
        {sheetSummary && (
          <div className="absolute bottom-4 left-4 right-4 z-20 max-w-4xl mx-auto flex items-center justify-between gap-3 px-5 py-3 rounded-2xl glass-sheet border border-circle-hairline/80 dark:border-white/12 shadow-lg backdrop-blur-xl">
            <div className="flex items-center gap-4 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text flex-wrap">
              {/* Total Expense calculation */}
              {(sheetSummary.totalVnd || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-circle-slate dark:text-circle-dark-muted">
                    {t.collab.totalExpense}:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatVnd(sheetSummary.totalVnd || 0)}
                  </span>
                </div>
              )}

              {/* Per-person average dynamically based on circle members count */}
              {(sheetSummary.splitPerPerson || 0) > 0 && (
                <div className="flex items-center gap-2 border-l border-circle-hairline dark:border-white/12 pl-4">
                  <span className="text-circle-slate dark:text-circle-dark-muted">
                    {t.collab.perPerson}:
                  </span>
                  <span className="font-bold text-circle-charcoal dark:text-circle-dark-text font-mono">
                    {formatVnd(sheetSummary.splitPerPerson || 0)}
                  </span>
                  <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-normal">
                    ({Math.max(1, members.length)} {locale === 'vi' ? 'người' : 'members'})
                  </span>
                </div>
              )}

              {/* Checkboxes / Task completion progress */}
              {(sheetSummary.totalCheckboxes || 0) > 0 && (
                <div className="flex items-center gap-2.5 border-l border-circle-hairline dark:border-white/12 pl-4">
                  <div className="w-24 h-2 rounded-full bg-circle-hairline dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-circle-primary rounded-full transition-all duration-300"
                      style={{ width: `${sheetSummary.completionPercent || 0}%` }}
                    />
                  </div>
                  <span className="text-circle-slate dark:text-circle-dark-muted">
                    {sheetSummary.completedCheckboxes || 0}/{sheetSummary.totalCheckboxes || 0} ({sheetSummary.completionPercent || 0}%)
                  </span>
                </div>
              )}
            </div>

            {/* Total rows counter */}
            <div className="hidden sm:block text-xs text-circle-slate dark:text-circle-dark-muted">
              {activeSheet?.rows.length || 0} {t.collab.rowsCount.replace('{count}', '')}
            </div>
          </div>
        )}

        {/* Modal: Add Column with Preset Choices */}
        {isAddColumnModalOpen && (
          <div
            onClick={(e) => e.target === e.currentTarget && setIsAddColumnModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          >
            <div className="glass-sheet rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.collab.addColumn}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
                  aria-label={t.common.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preset Column Choices Grid */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-2">
                  {t.collab.presetColumnsLabel || 'Mẫu cột có sẵn'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_COLUMNS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    const presetLabel = locale === 'vi' ? preset.defaultTitle : preset.enTitle;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all active:scale-95 text-xs font-semibold ${
                          isSelected
                            ? 'border-circle-primary bg-circle-primary/10 text-circle-primary dark:text-circle-dark-primary shadow-xs'
                            : 'border-circle-hairline dark:border-circle-dark-border text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-wash dark:hover:bg-circle-dark-hover'
                        }`}
                      >
                        <span className={isSelected ? 'text-circle-primary' : 'text-circle-slate'}>
                          {getPresetIcon(preset.iconName)}
                        </span>
                        <span className="truncate">{presetLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleAddColumn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                    {t.collab.newColumnTitlePrompt}
                  </label>
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder={t.collab.columnTitlePlaceholder}
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                    {locale === 'vi' ? 'Kiểu dữ liệu cột' : 'Column Data Type'}
                  </label>
                  <select
                    value={newColumnType}
                    onChange={(e) => setNewColumnType(e.target.value as SheetColumnType)}
                    className="w-full px-3 py-2 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                  >
                    <option value="text">Văn bản (Text)</option>
                    <option value="member">Thành viên (Member Assignee)</option>
                    <option value="currency">Số tiền (VND Currency)</option>
                    <option value="checkbox">Hộp kiểm (Checkbox)</option>
                    <option value="status">Trạng thái (Status)</option>
                    <option value="date">Ngày tháng (Date)</option>
                  </select>
                </div>

                {modalError && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddColumnModalOpen(false)}
                    className="px-4 h-9 text-xs sm:text-sm font-bold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-full transition-all active:scale-95 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={addColumnMutation.isPending}
                    className="px-5 h-9 text-xs sm:text-sm font-bold bg-circle-primary hover:bg-circle-sage text-white rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {addColumnMutation.isPending ? t.common.loading : t.collab.addColumn}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Column (Rename / Change Type) */}
        {editingColumn && (
          <div
            onClick={(e) => e.target === e.currentTarget && setEditingColumn(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          >
            <div className="glass-sheet rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.collab.editColumnTitle || 'Chỉnh sửa cột'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingColumn(null)}
                  className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
                  aria-label={t.common.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveColumnEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                    {t.collab.newColumnTitlePrompt}
                  </label>
                  <input
                    type="text"
                    value={editingColumn.title}
                    onChange={(e) =>
                      setEditingColumn((prev) => (prev ? { ...prev, title: e.target.value } : null))
                    }
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                    {locale === 'vi' ? 'Kiểu dữ liệu cột' : 'Column Data Type'}
                  </label>
                  <select
                    value={editingColumn.type}
                    onChange={(e) =>
                      setEditingColumn((prev) =>
                        prev ? { ...prev, type: e.target.value as SheetColumnType } : null,
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                  >
                    <option value="text">Văn bản (Text)</option>
                    <option value="member">Thành viên (Member Assignee)</option>
                    <option value="currency">Số tiền (VND Currency)</option>
                    <option value="checkbox">Hộp kiểm (Checkbox)</option>
                    <option value="status">Trạng thái (Status)</option>
                    <option value="date">Ngày tháng (Date)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingColumn(null)}
                    className="px-4 h-9 text-xs sm:text-sm font-bold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-full transition-all active:scale-95 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={updateColumnMutation.isPending}
                    className="px-5 h-9 text-xs sm:text-sm font-bold bg-circle-primary hover:bg-circle-sage text-white rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {updateColumnMutation.isPending ? t.common.loading : t.common.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: LIST OF PLANNING SHEETS (GRID CARDS)
  // =========================================================================
  return (
    <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Floating Top Controls */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4 md:px-6">
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setNewSheetTitle('');
              setSelectedTemplate('expense');
              setIsCreateModalOpen(true);
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-bold text-xs sm:text-sm shadow-sm border border-circle-hairline/60 dark:border-white/12 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t.collab.createSheet}</span>
          </button>
        </div>
      </div>

      {/* Sheet Grid Cards */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-12">
        {planningError && (
          <div className="mb-4 max-w-5xl mx-auto flex items-center justify-between gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{planningError}</span>
            </div>
            <button type="button" onClick={() => setPlanningError(null)} className="p-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isLoadingSheets ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-circle-sage dark:text-circle-dark-primary" />
          </div>
        ) : sheets.length === 0 ? (
          <div className="h-80 max-w-3xl mx-auto flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-circle-hairline dark:border-circle-dark-border rounded-3xl bg-circle-canvas/50 dark:bg-circle-dark-surface/30">
            <Table className="w-10 h-10 text-circle-sage dark:text-circle-dark-primary opacity-75 mb-4" />
            <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text mb-1">
              {t.collab.sheetEmptyTitle}
            </h3>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted max-w-sm mb-5">
              {t.collab.sheetEmptyDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setNewSheetTitle('');
                setSelectedTemplate('expense');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full bg-circle-primary hover:bg-circle-sage text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.collab.createFirstSheet}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {sheets.map((sheet) => {
              const memberCount = Math.max(1, members.length);
              const summary = computePlanningSheetSummary(sheet, memberCount);

              return (
                <div
                  key={sheet.id}
                  onClick={() => setSelectedSheetId(sheet.id)}
                  className="group relative p-5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:shadow-md hover:border-circle-sage/50 dark:hover:border-circle-dark-primary/50 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <FileSpreadsheet className="w-6 h-6 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModal({
                            isOpen: true,
                            type: 'sheet',
                            id: sheet.id,
                            title: t.collab.deleteSheet,
                            description: t.collab.deleteSheetConfirm,
                          });
                        }}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all"
                        title={t.collab.deleteSheetTooltip}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text group-hover:text-circle-sage dark:group-hover:text-circle-dark-primary transition-colors mb-2">
                      {sheet.title}
                    </h3>

                    {/* Summary badge */}
                    {(summary.totalVnd || 0) > 0 ? (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono flex-wrap">
                        <span>{t.collab.totalExpense}:</span>
                        <span>{formatVnd(summary.totalVnd || 0)}</span>
                        {summary.splitPerPerson && (
                          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-normal">
                            ({formatVnd(summary.splitPerPerson)}/{locale === 'vi' ? 'người' : 'pers'})
                          </span>
                        )}
                      </div>
                    ) : (summary.totalCheckboxes || 0) > 0 ? (
                      <div className="mb-3 flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-circle-hairline dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-circle-primary rounded-full"
                            style={{ width: `${summary.completionPercent || 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted font-semibold">
                          {summary.completedCheckboxes || 0}/{summary.totalCheckboxes || 0} ({summary.completionPercent || 0}%)
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-3 text-xs text-circle-slate dark:text-circle-dark-muted mb-4">
                      <span>
                        {t.collab.columnsCount.replace('{count}', String(sheet.columns.length))}
                      </span>
                      <span>•</span>
                      <span>
                        {t.collab.rowsCount.replace('{count}', String(sheet.rows.length))}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-circle-hairline/70 dark:border-circle-dark-border/60 flex items-center justify-between text-[11px] text-circle-slate dark:text-circle-dark-muted">
                    <span>
                      {sheet.creator?.user?.profile?.displayName || t.collab.memberDefault}
                    </span>
                    <span>
                      {new Date(sheet.createdAt).toLocaleDateString(
                        locale === 'vi' ? 'vi-VN' : 'en-US',
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Sheet with Template Picker */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-sheet rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.createSheet}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
                aria-label={t.common.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted mb-4">
              {t.collab.selectTemplate}
            </p>

            <form onSubmit={handleCreateSheet} className="space-y-4">
              {/* Template Picker Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {templateCards.map((card) => {
                  const Icon = card.icon;
                  const isSelected = selectedTemplate === card.type;
                  return (
                    <button
                      key={card.type}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(card.type);
                        if (!newSheetTitle) {
                          setNewSheetTitle(PLANNING_TEMPLATES[card.type]?.defaultTitle || '');
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all active:scale-98 flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-circle-primary bg-circle-primary/10 shadow-xs'
                          : 'border-circle-hairline dark:border-circle-dark-border hover:bg-circle-wash dark:hover:bg-circle-dark-hover'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isSelected
                            ? 'text-circle-sage dark:text-circle-dark-primary'
                            : 'text-circle-slate dark:text-circle-dark-muted'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                          {card.title}
                        </p>
                        <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted line-clamp-2 mt-0.5 leading-snug">
                          {card.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {t.collab.sheetTitlePlaceholder}
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder={PLANNING_TEMPLATES[selectedTemplate]?.defaultTitle || t.collab.sheetTitlePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 h-9 text-xs sm:text-sm font-bold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-full transition-all active:scale-95 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createSheetMutation.isPending}
                  className="px-5 h-9 text-xs sm:text-sm font-bold bg-circle-primary hover:bg-circle-sage text-white rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {createSheetMutation.isPending ? t.common.loading : t.collab.createSheet}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmModal?.isOpen}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleExecuteConfirm}
        title={confirmModal?.title || ''}
        description={confirmModal?.description}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={
          deleteSheetMutation.isPending ||
          deleteColumnMutation.isPending ||
          deleteRowMutation.isPending
        }
      />
    </div>
  );
};
