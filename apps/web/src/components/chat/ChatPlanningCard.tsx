'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Table2,
  Wallet,
  Luggage,
  Compass,
  CheckSquare,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';

export interface PlanningSheetMessagePayload {
  type: 'PLANNING_SHEET';
  sheetId: string;
  title: string;
  templateType: string;
  summaryText: string;
  completionPercent?: number;
  completedItems?: number;
  totalItems?: number;
}

interface ChatPlanningCardProps {
  sheetData: PlanningSheetMessagePayload;
  isSenderMe?: boolean;
}

export const ChatPlanningCard: React.FC<ChatPlanningCardProps> = ({
  sheetData,
  isSenderMe = false,
}) => {
  const router = useRouter();
  const activeCircleId = useCircleStore((s) => s.activeCircleId);
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const setActivePlanningSheetId = useCircleStore((s) => s.setActivePlanningSheetId);
  const t = useLanguageStore((s) => s.t);

  const getTemplateIcon = (tpl: string) => {
    switch (tpl) {
      case 'expense':
        return <Wallet className="h-5 w-5 text-emerald-500" />;
      case 'packing':
        return <Luggage className="h-5 w-5 text-amber-500" />;
      case 'trip':
        return <Compass className="h-5 w-5 text-sky-500" />;
      case 'task':
        return <CheckSquare className="h-5 w-5 text-indigo-500" />;
      default:
        return <Table2 className="h-5 w-5 text-circle-primary" />;
    }
  };

  const getTemplateBadge = (tpl: string) => {
    switch (tpl) {
      case 'expense':
        return t.collab.templateExpenseTitle;
      case 'packing':
        return t.collab.templatePackingTitle;
      case 'trip':
        return t.collab.templateTripTitle;
      case 'task':
        return t.collab.templateTaskTitle;
      default:
        return t.nav.planningSheet;
    }
  };

  const handleOpenSheet = () => {
    if (sheetData.sheetId) {
      setActivePlanningSheetId(sheetData.sheetId);
    }
    setActiveCircleView('planning');
    router.push('/planning');
  };

  const percent = typeof sheetData.completionPercent === 'number' ? sheetData.completionPercent : null;

  return (
    <div
      onClick={handleOpenSheet}
      className={`w-full max-w-sm rounded-2xl border p-4 shadow-sm transition-all duration-200 cursor-pointer group hover:shadow-md active:scale-[0.99] select-none ${
        isSenderMe
          ? 'bg-circle-primary/10 border-circle-primary/30 hover:border-circle-primary/60 dark:bg-circle-dark-primary/10 dark:border-circle-dark-primary/30'
          : 'bg-white/80 dark:bg-circle-dark-surface/80 backdrop-blur-md border-circle-hairline dark:border-circle-dark-hairline hover:border-circle-primary/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 shrink-0 group-hover:scale-105 transition-transform">
            {getTemplateIcon(sheetData.templateType)}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted">
              {getTemplateBadge(sheetData.templateType)}
            </span>
            <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
              {sheetData.title || t.nav.planningSheet}
            </h4>
          </div>
        </div>
      </div>

      {sheetData.summaryText && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-circle-charcoal dark:text-circle-dark-text flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <TrendingUp className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted shrink-0" />
            <span className="font-medium truncate">{sheetData.summaryText}</span>
          </div>
          {percent !== null && percent > 0 && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
              {percent}%
            </span>
          )}
        </div>
      )}

      {percent !== null && (
        <div className="mb-3 w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      )}

      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-circle-primary dark:text-circle-dark-primary group-hover:translate-x-0.5 transition-transform">
        <span>{t.hub.openPlanningSheet || 'Mở bảng kế hoạch'}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
};
