import type { FC, ReactNode } from 'react';
import type { Quote, StoredQuote } from '../../schemas';
import type { Action } from '../../state/planStore';
import type { compareQuoteToBudget } from '../../engine/vendors';
import { formatINR } from '../../engine/money';
import { Icon } from '../Icon';

type Comparison = ReturnType<typeof compareQuoteToBudget>;

/** A stored quote paired with its budget comparison. */
export interface EvaluatedQuote {
  sq: StoredQuote;
  comp: Comparison;
}

interface ComparisonTableProps {
  evaluated: EvaluatedQuote[];
  guests: number;
  dispatch: (action: Action) => void;
  onLockIn: (quote: Quote) => void;
}

const ROW_HEAD_CLASS = 'py-2.5 px-3 font-semibold text-stone-600 dark:text-stone-400';
const PLAIN_CELL_CLASS = 'py-2.5 px-3 text-stone-700 dark:text-stone-300';

interface RowProps {
  label: ReactNode;
  evaluated: EvaluatedQuote[];
  cell: (e: EvaluatedQuote) => ReactNode;
  cellClass?: string;
}

/** One specification row: a row header plus one cell per proposal. */
const Row: FC<RowProps> = ({ label, evaluated, cell, cellClass = PLAIN_CELL_CLASS }) => (
  <tr>
    <th scope="row" className={ROW_HEAD_CLASS}>
      {label}
    </th>
    {evaluated.map((e) => (
      <td key={e.sq.id} className={cellClass}>
        {cell(e)}
      </td>
    ))}
  </tr>
);

function gstStatus(taxIncluded: boolean | null): string {
  if (taxIncluded === true) return 'GST Included';
  if (taxIncluded === false) return 'GST Extra (+18%)';
  return 'Not Stated';
}

function BudgetDelta({ comp }: { comp: Comparison }) {
  return comp.isOverBudget ? (
    <span className="font-bold text-amber-700 dark:text-amber-400">
      +{formatINR(comp.variance)} over
    </span>
  ) : (
    <span className="font-bold text-emerald-700 dark:text-emerald-400">
      -{formatINR(Math.abs(comp.variance))} within
    </span>
  );
}

function RiskFlags({ comp }: { comp: Comparison }) {
  return comp.flags.map((flag, idx) => (
    <div
      key={idx}
      className={`text-[10px] p-1.5 rounded flex items-center gap-1.5 ${
        flag.type === 'warn'
          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
      }`}
    >
      <Icon name={flag.type === 'warn' ? 'alert' : 'check'} className="w-3 h-3 shrink-0" />
      <span>{flag.message}</span>
    </div>
  ));
}

/** Side-by-side comparison matrix of stored quotes for one category. */
export const ComparisonTable: FC<ComparisonTableProps> = ({
  evaluated,
  guests,
  dispatch,
  onLockIn,
}) => (
  <table className="w-full text-xs text-left border-collapse min-w-[500px]">
    <caption className="sr-only">Side-by-side vendor quotation comparison</caption>
    <thead>
      <tr className="border-b border-stone-200 dark:border-stone-800">
        <th
          scope="col"
          className="py-2.5 px-3 font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider w-40"
        >
          Specification
        </th>
        {evaluated.map(({ sq }, i) => (
          <th
            scope="col"
            key={sq.id}
            className="py-2.5 px-3 font-bold text-stone-900 dark:text-stone-100"
          >
            <div className="flex items-center justify-between">
              <span>{sq.quote.vendorName || `Proposal ${i + 1}`}</span>
              {sq.accepted && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ✓ Accepted
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
      <Row
        label={`Effective Cost (${guests} guests)`}
        evaluated={evaluated}
        cellClass="py-2.5 px-3 font-extrabold text-stone-900 dark:text-stone-100 text-sm"
        cell={({ comp }) => formatINR(comp.effectiveCost)}
      />
      <Row
        label="Against Budget"
        evaluated={evaluated}
        cellClass="py-2.5 px-3"
        cell={({ comp }) => <BudgetDelta comp={comp} />}
      />
      <Row
        label="Rate Structure"
        evaluated={evaluated}
        cell={({ sq }) =>
          sq.quote.pricePerPlate ? `${formatINR(sq.quote.pricePerPlate)}/plate` : 'Lump Sum Package'
        }
      />
      <Row
        label="Guest Minimum Guarantee"
        evaluated={evaluated}
        cell={({ sq }) =>
          sq.quote.guestMinimum ? `${sq.quote.guestMinimum} guests` : 'None specified'
        }
      />
      <Row
        label="Advance Payment Demanded"
        evaluated={evaluated}
        cell={({ sq }) =>
          sq.quote.advancePercent !== null ? `${sq.quote.advancePercent}%` : 'Unspecified'
        }
      />
      <Row
        label="GST / Tax Status"
        evaluated={evaluated}
        cell={({ sq }) => gstStatus(sq.quote.taxIncluded)}
      />
      <Row
        label="Contract Risk Flags"
        evaluated={evaluated}
        cellClass="py-2.5 px-3 space-y-1"
        cell={({ comp }) => <RiskFlags comp={comp} />}
      />
      <Row
        label="Actions"
        evaluated={evaluated}
        cellClass="py-2.5 px-3"
        cell={({ sq }) => (
          <div className="flex items-center gap-2">
            {!sq.accepted ? (
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'acceptStoredQuote', quoteId: sq.id });
                  onLockIn(sq.quote);
                }}
                className="btn-primary text-[11px] py-1 px-2.5"
              >
                Accept & Lock
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                ✓ Locked in
              </span>
            )}
            <button
              type="button"
              onClick={() => dispatch({ type: 'deleteStoredQuote', quoteId: sq.id })}
              className="text-stone-600 dark:text-stone-400 hover:text-red-600 p-1"
              title="Delete Quote"
              aria-label="Delete Quote"
            >
              <Icon name="trash" className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />
    </tbody>
  </table>
);
