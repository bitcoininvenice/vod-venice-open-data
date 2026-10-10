'use client';

import React from 'react';
import { Route } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/** «Come arrivare qui»: apre il planner con il luogo come destinazione. */
export const PlanHereButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs text-emerald-300 cursor-pointer"
      data-testid="plan-here"
    >
      <Route className="w-3.5 h-3.5" aria-hidden />
      {t('ui.planner.planHere')}
    </button>
  );
};
