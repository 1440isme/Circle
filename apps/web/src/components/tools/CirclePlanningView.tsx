'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import {
  usePlanningSheetsQuery,
  usePlanningSheetDetailQuery,
  useCreatePlanningSheetMutation,
  useAddSheetColumnMutation,
  useAddSheetRowMutation,
  useUpdateSheetCellMutation,
  useDeletePlanningSheetMutation,
} from '../../hooks/use-circle-tools';
import { SheetCellEntity } from '@circle/types';

interface CirclePlanningViewProps {
  circleId: string;
}

export const CirclePlanningView: React.FC<CirclePlanningViewProps> = ({ circleId }) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmDeleteSheetId, setConfirmDeleteSheetId] = useState<string | null>(null);

  // Editing cell state: cellId -> draft value
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [cellDraftValue, setCellDraftValue] = useState<string>('');

  const { data: sheets = [], isLoading: isLoadingSheets } = usePlanningSheetsQuery(circleId);
  const { data: activeSheet, isLoading: isLoadingDetail } =
    usePlanningSheetDetailQuery(circleId, selectedSheetId);

  const createSheetMutation = useCreatePlanningSheetMutation(circleId);
  const addColumnMutation = useAddSheetColumnMutation(circleId, selectedSheetId || '');
  const addRowMutation = useAddSheetRowMutation(circleId, selectedSheetId || '');
  const updateCellMutation = useUpdateSheetCellMutation(circleId, selectedSheetId || '');
  const deleteSheetMutation = useDeletePlanningSheetMutation(circleId);

  useEffect(() => {
    if (!isCreateModalOpen && !isAddColumnModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsAddColumnModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isAddColumnModalOpen]);

  // Handlers
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newSheetTitle.trim()) {
      setModalError(t.collab.enterSheetTitleError);
      return;
    }

    try {
      const created = await createSheetMutation.mutateAsync({
        title: newSheetTitle.trim(),
      });
      setNewSheetTitle('');
      setIsCreateModalOpen(false);
      setSelectedSheetId(created.id);
    } catch (err: any) {
      setModalError(err?.message || t.collab.createSheetError);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newColumnTitle.trim() || !selectedSheetId) return;

    try {
      await addColumnMutation.mutateAsync({
        columnTitle: newColumnTitle.trim(),
      });
      setNewColumnTitle('');
      setIsAddColumnModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || t.collab.addColumnError);
    }
  };

  const handleAddRow = async () => {
    if (!selectedSheetId) return;
    setPlanningError(null);
    try {
      await addRowMutation.mutateAsync({});
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.addRowError);
    }
  };

  const handleStartEditCell = (cell: SheetCellEntity) => {
    setEditingCellId(cell.id);
    setCellDraftValue(cell.cellValue || '');
  };

  const handleSaveCell = async (cellId: string) => {
    if (!selectedSheetId) return;
    setPlanningError(null);
    try {
      await updateCellMutation.mutateAsync({
        cellId,
        input: { cellValue: cellDraftValue },
      });
      setEditingCellId(null);
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.updateCellError);
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    setPlanningError(null);
    try {
      await deleteSheetMutation.mutateAsync(sheetId);
      setConfirmDeleteSheetId(null);
      if (selectedSheetId === sheetId) {
        setSelectedSheetId(null);
      }
    } catch (err: any) {
      setPlanningError(err?.message || t.collab.deleteSheetError);
    }
  };

  // =========================================================================
  // VIEW: SHEET DETAIL (SPREADSHEET GRID)
  // =========================================================================
  if (selectedSheetId) {
    return (
      <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
        {/* Floating Glass Toolbar */}
        <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex flex-col items-center px-4 gap-2">
          <div className="pointer-events-auto flex items-center justify-between px-4 py-2 rounded-full glass shadow-sm max-w-5xl w-full transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteSheetId(null);
                  setSelectedSheetId(null);
                }}
                className="p-1.5 rounded-full hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white transition-colors"
                title={t.collab.backToList}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <FileSpreadsheet className="w-4 h-4 text-circle-sage dark:text-circle-dark-primary shrink-0" />
              <div className="truncate">
                <h2 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text leading-tight truncate">
                  {activeSheet?.title || t.collab.planningTitle}
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-circle-sage dark:text-circle-dark-primary font-medium ml-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-circle-primary animate-pulse" />
                <span>{t.collab.realtimeSyncNotice}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setNewColumnTitle('');
                  setIsAddColumnModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/60 dark:bg-circle-dark-surface/60 hover:bg-circle-wash text-circle-charcoal dark:text-circle-dark-text transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-circle-sage dark:text-circle-dark-primary" />
                <span>{t.collab.addColumn}</span>
              </button>
              <button
                type="button"
                onClick={handleAddRow}
                disabled={addRowMutation.isPending}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white transition-all flex items-center gap-1 shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.collab.addRow}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmDeleteSheetId(
                    confirmDeleteSheetId === selectedSheetId ? null : selectedSheetId,
                  )
                }
                className="p-1.5 rounded-full hover:bg-rose-500/10 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-colors"
                title={t.collab.deleteSheet}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Inline Delete Sheet Confirmation Bar */}
          {confirmDeleteSheetId === selectedSheetId && (
            <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl glass-sheet border border-rose-500/30 px-4 py-2 text-xs max-w-md w-full shadow-lg">
              <span className="text-circle-charcoal dark:text-circle-dark-text font-medium">
                {t.collab.deleteSheetConfirm}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSheetId(null)}
                  className="px-2.5 py-1 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  disabled={deleteSheetMutation.isPending}
                  onClick={() => handleDeleteSheet(selectedSheetId)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spreadsheet Content Area (Scroll-under content layer with safe top padding) */}
        <div className="flex-1 overflow-auto p-6 pt-28 lg:pt-20 bg-circle-canvas/40 dark:bg-circle-dark-bg/40">
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
                      {activeSheet.columns.map((col) => (
                        <th
                          key={col.id}
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-bold text-circle-charcoal dark:text-circle-dark-text uppercase tracking-wider border-r border-circle-hairline dark:border-circle-dark-border min-w-[160px]"
                        >
                          <div className="flex items-center justify-between">
                            <span>{col.columnTitle}</span>
                          </div>
                        </th>
                      ))}
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
                      activeSheet.rows.map((row, rIdx) => (
                        <tr
                          key={row.id}
                          className="hover:bg-circle-wash/50 dark:hover:bg-circle-dark-hover/40 transition-colors"
                        >
                          <td className="w-12 px-3 py-2 text-center text-xs font-medium text-circle-slate dark:text-circle-dark-muted border-r border-circle-hairline dark:border-circle-dark-border select-none bg-circle-canvas/50 dark:bg-circle-dark-surface/50">
                            {rIdx + 1}
                          </td>
                          {activeSheet.columns.map((col) => {
                            const cell = row.cells.find((c) => c.columnId === col.id);
                            const isEditing = cell && editingCellId === cell.id;

                            return (
                              <td
                                key={col.id}
                                className="px-3 py-2 text-sm border-r border-circle-hairline dark:border-circle-dark-border relative group"
                                onClick={() => cell && !isEditing && handleStartEditCell(cell)}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={cellDraftValue}
                                      onChange={(e) => setCellDraftValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveCell(cell.id);
                                        if (e.key === 'Escape') setEditingCellId(null);
                                      }}
                                      autoFocus
                                      className="w-full px-2 py-1 text-sm rounded border border-circle-primary bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text outline-none focus:ring-1 focus:ring-circle-primary shadow-inner"
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveCell(cell.id);
                                      }}
                                      className="p-1 rounded bg-circle-primary text-circle-charcoal dark:text-circle-dark-canvas hover:bg-circle-sage hover:text-white dark:hover:text-white transition-colors"
                                      title={t.collab.saveCell}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
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
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-circle-slate dark:text-circle-dark-muted bg-circle-wash dark:bg-circle-dark-hover px-1.5 py-0.5 rounded-full"
                                        title={`${t.collab.editCellHint} (${
                                          cell.lastEditedBy.user?.profile?.displayName ||
                                          t.collab.memberDefault
                                        })`}
                                      >
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add Column */}
        {isAddColumnModalOpen && (
          <div
            onClick={(e) => e.target === e.currentTarget && setIsAddColumnModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          >
            <div className="glass-sheet rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
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
                    className="px-4 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-xl"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={addColumnMutation.isPending}
                    className="px-4 py-2 text-xs font-semibold bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white rounded-xl disabled:opacity-50"
                  >
                    {addColumnMutation.isPending ? t.common.loading : t.collab.addColumn}
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
  // VIEW: LIST OF PLANNING SHEETS
  // =========================================================================
  return (
    <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Floating Glass Toolbar */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center justify-between px-5 py-2.5 rounded-full glass shadow-sm max-w-4xl w-full transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-circle-sage dark:text-circle-dark-primary shrink-0" />
            <h1 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
              {t.collab.planningTitle}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setNewSheetTitle('');
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.collab.createSheet}</span>
          </button>
        </div>
      </div>

      {/* Sheet Grid Cards (Scroll-under content with safe top padding) */}
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
                setIsCreateModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white text-xs font-bold transition-all shadow-xs"
            >
              {t.collab.createFirstSheet}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {sheets.map((sheet) => {
              const isConfirming = confirmDeleteSheetId === sheet.id;
              return (
                <div
                  key={sheet.id}
                  onClick={() => !isConfirming && setSelectedSheetId(sheet.id)}
                  className="group relative p-5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface hover:shadow-md hover:border-circle-sage/50 dark:hover:border-circle-dark-primary/50 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <FileSpreadsheet className="w-6 h-6 text-circle-sage dark:text-circle-dark-primary shrink-0" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteSheetId(isConfirming ? null : sheet.id);
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

                  {isConfirming ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pt-3 border-t border-rose-500/20 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="text-rose-600 dark:text-rose-400 font-medium truncate">
                        {t.collab.deleteSheet}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSheetId(null)}
                          className="px-2 py-1 rounded-lg text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="button"
                          disabled={deleteSheetMutation.isPending}
                          onClick={() => handleDeleteSheet(sheet.id)}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Sheet */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-sheet rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl">
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
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted mb-5">
              {t.collab.planningSubtitle}
            </p>

            <form onSubmit={handleCreateSheet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1.5">
                  {t.collab.sheetTitlePlaceholder}
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder={t.collab.sheetTitlePlaceholder}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-circle-hairline dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-circle-charcoal dark:text-circle-dark-text text-sm outline-none focus:border-circle-primary"
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-hover rounded-xl"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createSheetMutation.isPending}
                  className="px-5 py-2.5 text-xs font-bold bg-circle-primary hover:bg-circle-sage text-circle-charcoal dark:text-circle-dark-canvas hover:text-white dark:hover:text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {createSheetMutation.isPending ? t.common.loading : t.collab.createSheet}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
