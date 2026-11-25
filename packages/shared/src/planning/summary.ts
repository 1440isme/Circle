import { PlanningSheetSummary, PlanningTemplateType } from './types';

export function formatVnd(amount: number): string {
  if (!Number.isFinite(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';
}

export function parseVnd(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export interface SheetRowLike {
  id: string;
  cells: Array<{ columnId: string; cellValue: string }>;
}

export interface SheetColumnLike {
  id: string;
  columnIndex: number;
  columnTitle: string;
  columnType?: string;
}

export interface SheetLike {
  id: string;
  title: string;
  templateType?: string;
  columns: SheetColumnLike[];
  rows: SheetRowLike[];
  metadata?: Record<string, unknown> | null;
}

export function computePlanningSheetSummary(
  sheet: SheetLike,
  memberCount: number = 1
): PlanningSheetSummary {
  const templateType = (sheet.templateType || 'custom') as PlanningTemplateType;
  const rows = sheet.rows || [];
  const columns = sheet.columns || [];

  // Identify column types
  const currencyCols = columns.filter((c) => {
    if (c.columnType === 'currency') return true;
    const title = (c.columnTitle || '').toLowerCase();
    return (
      title.includes('tiền') ||
      title.includes('chi') ||
      title.includes('amount') ||
      title.includes('giá') ||
      title.includes('phí')
    );
  });
  const checkboxCols = columns.filter((c) => {
    if (c.columnType === 'checkbox') return true;
    const title = (c.columnTitle || '').toLowerCase();
    return title.includes('chuẩn bị') || title.includes('hoàn thành') || title.includes('done') || title.includes('check');
  });
  const statusCols = columns.filter((c) => {
    if (c.columnType === 'status') return true;
    const title = (c.columnTitle || '').toLowerCase();
    return title.includes('trạng thái') || title.includes('status');
  });

  let totalVnd = 0;
  let hasCurrency = currencyCols.length > 0;

  if (hasCurrency) {
    const curColIds = new Set(currencyCols.map((c) => c.id));
    rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (curColIds.has(cell.columnId)) {
          totalVnd += parseVnd(cell.cellValue);
        }
      });
    });
  }

  let totalCheckboxes = 0;
  let completedCheckboxes = 0;
  let hasCheckboxes = checkboxCols.length > 0;

  if (hasCheckboxes) {
    const cbColIds = new Set(checkboxCols.map((c) => c.id));
    rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cbColIds.has(cell.columnId)) {
          totalCheckboxes++;
          const val = cell.cellValue.toLowerCase().trim();
          if (val === 'true' || val === '1' || val === 'xong' || val === 'done' || val === 'yes') {
            completedCheckboxes++;
          }
        }
      });
    });
  } else if (statusCols.length > 0) {
    // If no checkboxes but status columns exist, count status 'done'
    const statusColIds = new Set(statusCols.map((c) => c.id));
    rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (statusColIds.has(cell.columnId)) {
          totalCheckboxes++;
          const val = cell.cellValue.toLowerCase().trim();
          if (val === 'done' || val === 'completed' || val === 'hoàn thành') {
            completedCheckboxes++;
          }
        }
      });
    });
    hasCheckboxes = totalCheckboxes > 0;
  }

  const completionPercent =
    totalCheckboxes > 0 ? Math.round((completedCheckboxes / totalCheckboxes) * 100) : undefined;

  const validMemberCount = Math.max(1, memberCount);
  const splitPerPerson = hasCurrency ? Math.round(totalVnd / validMemberCount) : undefined;

  // Generate concise summary text
  let summaryText = '';
  if (hasCurrency && totalVnd > 0) {
    summaryText = `Tổng chi: ${formatVnd(totalVnd)} • ${formatVnd(splitPerPerson || 0)}/người`;
  } else if (hasCheckboxes && totalCheckboxes > 0) {
    summaryText = `Hoàn thành ${completedCheckboxes}/${totalCheckboxes} (${completionPercent}%)`;
  } else {
    summaryText = `${rows.length} mục kế hoạch`;
  }

  return {
    sheetId: sheet.id,
    title: sheet.title,
    templateType,
    totalVnd: hasCurrency ? totalVnd : undefined,
    splitPerPerson,
    totalCheckboxes: hasCheckboxes ? totalCheckboxes : undefined,
    completedCheckboxes: hasCheckboxes ? completedCheckboxes : undefined,
    completionPercent,
    summaryText,
    totalRows: rows.length,
  };
}
