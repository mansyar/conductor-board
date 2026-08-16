import type { ColumnId } from './types';

export interface ColumnConfig {
  id: ColumnId;
  label: string;
  dot: string;
  bar: string;
  accent: string;
}

/** Four fixed lifecycle columns, each with its own color that is never reused. */
export const COLUMN_CONFIG: Record<ColumnId, ColumnConfig> = {
  'spec-plan': {
    id: 'spec-plan',
    label: 'Spec & Plan',
    dot: 'bg-sky-400',
    bar: 'bg-sky-400',
    accent: 'text-sky-300',
  },
  implement: {
    id: 'implement',
    label: 'Implement',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
    accent: 'text-amber-300',
  },
  review: {
    id: 'review',
    label: 'Review',
    dot: 'bg-violet-400',
    bar: 'bg-violet-400',
    accent: 'text-violet-300',
  },
  complete: {
    id: 'complete',
    label: 'Complete',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400',
    accent: 'text-emerald-300',
  },
};

export const COLUMN_ORDER: ColumnId[] = [
  'spec-plan',
  'implement',
  'review',
  'complete',
];
