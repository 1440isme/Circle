export type SheetColumnType = 'text' | 'checkbox' | 'currency' | 'member' | 'status' | 'date';

export type PlanningTemplateType = 'trip' | 'expense' | 'packing' | 'task' | 'custom';

export interface PlanningTemplateColumn {
  columnTitle: string;
  columnType: SheetColumnType;
  columnConfig?: Record<string, unknown>;
}

export interface PlanningTemplateDefinition {
  type: PlanningTemplateType;
  titleKey: string;
  defaultTitle: string;
  descriptionKey: string;
  iconName: string;
  columns: PlanningTemplateColumn[];
  initialRows: Array<Record<number, string>>;
}

export interface PlanningSheetSummary {
  sheetId: string;
  title: string;
  templateType: PlanningTemplateType;
  totalVnd?: number;
  splitPerPerson?: number;
  totalCheckboxes?: number;
  completedCheckboxes?: number;
  completionPercent?: number;
  summaryText: string;
  totalRows: number;
}
