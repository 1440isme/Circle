import { SheetColumnType } from './types';

export interface ColumnPreset {
  id: string;
  type: SheetColumnType;
  titleKey: string;
  defaultTitle: string;
  enTitle: string;
  iconName: string;
}

export const PRESET_COLUMNS: ColumnPreset[] = [
  {
    id: 'task',
    type: 'text',
    titleKey: 'tools.planning.presets.task',
    defaultTitle: 'Hạng mục công việc',
    enTitle: 'Task / Item',
    iconName: 'check-square',
  },
  {
    id: 'status',
    type: 'status',
    titleKey: 'tools.planning.presets.status',
    defaultTitle: 'Trạng thái',
    enTitle: 'Status',
    iconName: 'activity',
  },
  {
    id: 'assignee',
    type: 'member',
    titleKey: 'tools.planning.presets.assignee',
    defaultTitle: 'Người phụ trách',
    enTitle: 'Assignee',
    iconName: 'user',
  },
  {
    id: 'amount',
    type: 'currency',
    titleKey: 'tools.planning.presets.amount',
    defaultTitle: 'Số tiền (VND)',
    enTitle: 'Amount (VND)',
    iconName: 'dollar-sign',
  },
  {
    id: 'date',
    type: 'date',
    titleKey: 'tools.planning.presets.date',
    defaultTitle: 'Thời gian / Hạn chót',
    enTitle: 'Date / Deadline',
    iconName: 'calendar',
  },
  {
    id: 'notes',
    type: 'text',
    titleKey: 'tools.planning.presets.notes',
    defaultTitle: 'Ghi chú',
    enTitle: 'Notes',
    iconName: 'file-text',
  },
  {
    id: 'category',
    type: 'text',
    titleKey: 'tools.planning.presets.category',
    defaultTitle: 'Phân loại',
    enTitle: 'Category',
    iconName: 'tag',
  },
  {
    id: 'checkbox',
    type: 'checkbox',
    titleKey: 'tools.planning.presets.checkbox',
    defaultTitle: 'Đã chuẩn bị',
    enTitle: 'Checklist',
    iconName: 'check',
  },
];
