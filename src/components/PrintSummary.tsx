import type { FC } from 'react';
import type { Plan } from '../schemas';
import { CATEGORIES } from '../schemas';
import { budgetStatus, formatINR, toLakh } from '../engine';
import { aggregateGuests } from '../engine/guests';
import { sortRunSheet } from '../engine/runsheet';

interface PrintSummaryProps {
  plan: Plan;
  today: string;
}

export const PrintSummary: FC<PrintSummaryProps> = ({ plan }) => {
  const status = budgetStatus(plan);
  const guests = aggregateGuests(plan.guestList);
  const runsheet = sortRunSheet(plan.runSheet);

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{plan.title}</h1>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-600 mt-1">
            Occasion: {plan.occasion.toUpperCase()} · Location: {plan.city ?? 'Local Venue'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Celebration Date: {plan.eventDate}</p>
          <p className="text-xs text-gray-500">Generated via Prabandh · प्रबंध</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-4 gap-4 p-4 border border-gray-300 rounded-lg text-center">
        <div>
          <span className="text-xs uppercase text-gray-500 block">Total Budget</span>
          <p className="text-xl font-bold">{formatINR(status.total)}</p>
          <span className="text-xs text-gray-500">{toLakh(status.total)}</span>
        </div>
        <div>
          <span className="text-xs uppercase text-gray-500 block">Committed Spend</span>
          <p className="text-xl font-bold">{formatINR(status.committed)}</p>
        </div>
        <div>
          <span className="text-xs uppercase text-gray-500 block">Target Headcount</span>
          <p className="text-xl font-bold">{plan.guests} Guests</p>
          <span className="text-xs text-gray-500">~{formatINR(plan.perPlate)}/plate</span>
        </div>
        <div>
          <span className="text-xs uppercase text-gray-500 block">Confirmed RSVPs</span>
          <p className="text-xl font-bold">{guests.confirmedCount}</p>
          <span className="text-xs text-gray-500">{guests.confirmationRate}% confirmed</span>
        </div>
      </div>

      {/* Budget Breakdown Table */}
      <div>
        <h2 className="text-base font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
          Category Budget Allocation
        </h2>
        <table className="w-full text-left text-xs border border-gray-200">
          <thead className="bg-gray-100 font-bold">
            <tr>
              <th className="p-2 border">Category</th>
              <th className="p-2 border text-right">Allocated (INR ₹)</th>
              <th className="p-2 border text-right">Share (%)</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const amount = plan.allocation[cat];
              const pct = status.total > 0 ? (amount / status.total) * 100 : 0;
              return (
                <tr key={cat}>
                  <td className="p-2 border capitalize font-medium">{cat}</td>
                  <td className="p-2 border text-right font-mono">{formatINR(amount)}</td>
                  <td className="p-2 border text-right font-mono">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Day-of Run Sheet */}
      {runsheet.length > 0 && (
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
            Day-of Event Itinerary & Leads
          </h2>
          <table className="w-full text-left text-xs border border-gray-200">
            <thead className="bg-gray-100 font-bold">
              <tr>
                <th className="p-2 border w-20">Time</th>
                <th className="p-2 border">Ceremony / Activity</th>
                <th className="p-2 border w-44">Lead Coordinator</th>
              </tr>
            </thead>
            <tbody>
              {runsheet.map((item) => (
                <tr key={item.id}>
                  <td className="p-2 border font-mono font-bold">{item.time}</td>
                  <td className="p-2 border">
                    <strong>{item.title}</strong>
                    {item.description && (
                      <span className="text-gray-600 block">{item.description}</span>
                    )}
                  </td>
                  <td className="p-2 border">{item.coordinator ?? 'Host Family'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sign-off */}
      <div className="pt-6 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
        <span>Confidential Family Event Plan</span>
        <span>Prabandh · प्रबंध · Connected Celebration Architecture</span>
      </div>
    </div>
  );
};
