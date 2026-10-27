'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Table,
  Check,
  Edit2,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  usePlanningSheetsQuery,
  usePlanningSheetDetailQuery,
  useCreatePlanningSheetMutation,
  useAddSheetColumnMutation,
  useAddSheetRowMutation,
  useUpdateSheetCellMutation,
  useDeletePlanningSheetMutation,
} from '../../hooks/use-circle-tools';
import { PlanningSheetEntity, SheetCellEntity } from '@circle/types';

interface CirclePlanningViewProps {
  circleId: string;
}

export const CirclePlanningView: React.FC<CirclePlanningViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Editing cell state: cellId -> draft value
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [cellDraftValue, setCellDraftValue] = useState<string>('');

  const { data: sheets = [], isLoading: isLoadingSheets } = usePlanningSheetsQuery(circleId);
  const { data: activeSheet, isLoading: isLoadingDetail } = usePlanningSheetDetailQuery(
    circleId,
    selectedSheetId,
  );

  const createSheetMutation = useCreatePlanningSheetMutation(circleId);
  const addColumnMutation = useAddSheetColumnMutation(circleId, selectedSheetId || '');
  const addRowMutation = useAddSheetRowMutation(circleId, selectedSheetId || '');
  const updateCellMutation = useUpdateSheetCellMutation(circleId, selectedSheetId || '');
  const deleteSheetMutation = useDeletePlanningSheetMutation(circleId);

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;

    try {
      const created = await createSheetMutation.mutateAsync({
        title: newSheetTitle.trim(),
      });
      setNewSheetTitle('');
      setIsCreateModalOpen(false);
      setSelectedSheetId(created.id);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo bảng kế hoạch');
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !selectedSheetId) return;

    try {
      await addColumnMutation.mutateAsync({
        columnTitle: newColumnTitle.trim(),
      });
      setNewColumnTitle('');
      setIsAddColumnModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm cột');
    }
  };

  const handleAddRow = async () => {
    if (!selectedSheetId) return;
    try {
      await addRowMutation.mutateAsync({});
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm dòng');
    }
  };

  const handleStartEditCell = (cell: SheetCellEntity) => {
    setEditingCellId(cell.id);
    setCellDraftValue(cell.cellValue || '');
  };

  const handleSaveCell = async (cellId: string) => {
    if (!selectedSheetId) return;
    try {
      await updateCellMutation.mutateAsync({
        cellId,
        input: { cellValue: cellDraftValue },
      });
      setEditingCellId(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật ô');
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bảng kế hoạch này?')) return;
    try {
      await deleteSheetMutation.mutateAsync(sheetId);
      if (selectedSheetId === sheetId) {
        setSelectedSheetId(null);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa bảng kế hoạch');
    }
  };

  // =========================================================================
  // VIEW: SHEET DETAIL (SPREADSHEET GRID)
  // =========================================================================
  if (selectedSheetId) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
        {/* Detail Top Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-circle-dark-border flex items-center justify-between bg-white dark:bg-circle-dark-surface z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSheetId(null)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-circle-dark-hover transition-colors"
              title="Quay lại danh sách bảng"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  {activeSheet?.title || 'Bảng kế hoạch'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đồng bộ thời gian thực
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddColumnModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-circle-dark-border dark:hover:bg-circle-dark-hover text-gray-800 dark:text-white transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm cột
            </button>
            <button
              onClick={handleAddRow}
              disabled={addRowMutation.isPending}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-circle-primary hover:bg-circle-primary-hover text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm dòng
            </button>
            <button
              onClick={() => handleDeleteSheet(selectedSheetId)}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Xóa bảng kế hoạch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Spreadsheet Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/50 dark:bg-circle-dark-bg/50">
          {isLoadingDetail ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-circle-primary" />
            </div>
          ) : !activeSheet ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Không tìm thấy dữ liệu bảng tính
            </div>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <div className="border border-gray-200 dark:border-circle-dark-border rounded-2xl overflow-hidden bg-white dark:bg-circle-dark-surface shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-circle-dark-border">
                  {/* Table Header */}
                  <thead className="bg-gray-50 dark:bg-circle-dark-surface/80">
                    <tr>
                      <th
                        scope="col"
                        className="w-12 px-3 py-3.5 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-r border-gray-200 dark:border-circle-dark-border select-none"
                      >
                        #
                      </th>
                      {activeSheet.columns.map((col) => (
                        <th
                          key={col.id}
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-200 dark:border-circle-dark-border min-w-[160px]"
                        >
                          <div className="flex items-center justify-between">
                            <span>{col.columnTitle}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-200 dark:divide-circle-dark-border bg-white dark:bg-circle-dark-surface">
                    {activeSheet.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activeSheet.columns.length + 1}
                          className="text-center py-12 text-sm text-gray-400 dark:text-gray-500"
                        >
                          Bảng chưa có dữ liệu. Bấm "Thêm dòng" để bắt đầu!
                        </td>
                      </tr>
                    ) : (
                      activeSheet.rows.map((row, rIdx) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-circle-dark-hover/40 transition-colors"
                        >
                          <td className="w-12 px-3 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-circle-dark-border select-none bg-gray-50/50 dark:bg-circle-dark-surface/50">
                            {rIdx + 1}
                          </td>
                          {activeSheet.columns.map((col) => {
                            const cell = row.cells.find((c) => c.columnId === col.id);
                            const isEditing = cell && editingCellId === cell.id;

                            return (
                              <td
                                key={col.id}
                                className="px-3 py-2 text-sm border-r border-gray-200 dark:border-circle-dark-border relative group"
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
                                      className="w-full px-2 py-1 text-sm rounded border border-circle-primary dark:border-circle-primary bg-white dark:bg-circle-dark-bg text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-circle-primary shadow-inner"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveCell(cell.id);
                                      }}
                                      className="p-1 rounded bg-circle-primary text-white hover:bg-circle-primary-hover"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between min-h-[28px] cursor-pointer">
                                    <span
                                      className={`text-sm ${
                                        cell?.cellValue
                                          ? 'text-gray-900 dark:text-gray-100 font-normal'
                                          : 'text-gray-300 dark:text-gray-600 italic text-xs'
                                      }`}
                                    >
                                      {cell?.cellValue || '—'}
                                    </span>

                                    {/* Last edited badge */}
                                    {cell?.lastEditedBy && (
                                      <div
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-circle-dark-hover px-1.5 py-0.5 rounded-full"
                                        title={`Sửa bởi ${
                                          cell.lastEditedBy.user?.profile?.displayName || 'Thành viên'
                                        }`}
                                      >
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>
                                          {cell.lastEditedBy.user?.profile?.displayName?.split(' ')[0] ||
                                            'Member'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-circle-dark-surface border border-gray-100 dark:border-circle-dark-border rounded-2xl w-full max-w-sm p-6 shadow-xl">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Thêm cột mới vào bảng tính
              </h3>
              <form onSubmit={handleAddColumn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Tên cột (ví dụ: Tiến độ, Link tài liệu...)
                  </label>
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Nhập tên cột..."
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-gray-900 dark:text-white text-sm outline-none focus:border-circle-primary"
                  />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddColumnModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-circle-dark-hover rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={addColumnMutation.isPending}
                    className="px-4 py-2 text-xs font-semibold bg-circle-primary text-white hover:bg-circle-primary-hover rounded-xl"
                  >
                    {addColumnMutation.isPending ? 'Đang thêm...' : 'Thêm cột'}
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
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-circle-dark-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Bảng kế hoạch & Tiến độ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cộng tác phân công công việc và quản lý tiến độ dạng bảng tính theo thời gian thực
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-primary-hover text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo bảng kế hoạch mới
        </button>
      </div>

      {/* Sheet Grid Cards */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoadingSheets ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-circle-primary" />
          </div>
        ) : sheets.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 dark:border-circle-dark-border rounded-3xl bg-gray-50/50 dark:bg-circle-dark-surface/30">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Table className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
              Chưa có bảng kế hoạch nào trong Vòng tròn
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-5">
              Tạo bảng kế hoạch dạng bảng tính để phân công công việc, theo dõi deadline và tiến độ cùng các thành viên.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-primary-hover text-white text-xs font-bold transition-colors shadow-sm"
            >
              Tạo bảng đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sheets.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => setSelectedSheetId(sheet.id)}
                className="group relative p-5 rounded-2xl border border-gray-200 dark:border-circle-dark-border bg-white dark:bg-circle-dark-surface hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(sheet.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      title="Xóa bảng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2">
                    {sheet.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span>{sheet.columns.length} cột</span>
                    <span>•</span>
                    <span>{sheet.rows.length} dòng</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-circle-dark-border/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span>
                    Tạo bởi {sheet.creator?.user?.profile?.displayName || 'Thành viên'}
                  </span>
                  <span>{new Date(sheet.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create Sheet */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-circle-dark-surface border border-gray-100 dark:border-circle-dark-border rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Tạo Bảng Kế Hoạch Mới
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Bảng tính mặc định được thiết lập sẵn các cột phân công nhiệm vụ, người phụ trách, tiến độ và hạn chót.
            </p>

            <form onSubmit={handleCreateSheet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên bảng kế hoạch
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch Dã ngoại Cuối tuần, Đồ án Tốt nghiệp..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-gray-900 dark:text-white text-sm outline-none focus:border-circle-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-circle-dark-hover rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSheetMutation.isPending}
                  className="px-5 py-2.5 text-xs font-bold bg-circle-primary text-white hover:bg-circle-primary-hover rounded-xl shadow-sm"
                >
                  {createSheetMutation.isPending ? 'Đang tạo...' : 'Tạo bảng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
