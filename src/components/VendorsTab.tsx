import { useState, useMemo, type FC, type FormEvent } from 'react';
import type {
  Category,
  PaymentMilestone,
  Plan,
  Quote,
  StoredQuote,
  Vendor,
  VendorMeeting,
  VendorStatus,
} from '../schemas';
import { CATEGORIES } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import {
  calculateVendorPayments,
  compareQuoteToBudget,
  effectiveQuoteCost,
  generateVendorInquiry,
  vendorChecklist,
} from '../engine/vendors';
import { formatINR } from '../engine/money';
import { OCCASION_LABELS } from '../engine/presets';
import { api } from '../lib/api';

interface VendorsTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

type SubView = 'checklist' | 'comparison' | 'tastings' | 'booked';

export const VendorsTab: FC<VendorsTabProps> = ({ plan, dispatch }) => {
  const [subView, setSubView] = useState<SubView>('checklist');
  const [comparisonCategory, setComparisonCategory] = useState<Category>('catering');

  // Quote Analyzer state
  const [showQuoteAnalyzer, setShowQuoteAnalyzer] = useState(false);
  const [quoteCategory, setQuoteCategory] = useState<Category>('catering');
  const [rawQuoteText, setRawQuoteText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedQuote, setExtractedQuote] = useState<Quote | null>(null);

  // Add Vendor modal state
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorCat, setVendorCat] = useState<Category>('catering');
  const [vendorPhone, setVendorPhone] = useState('');

  // Add Payment Milestone state
  const [activeVendorForPayment, setActiveVendorForPayment] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState('Token Advance (25%)');
  const [milestoneAmount, setMilestoneAmount] = useState<number>(50000);
  const [milestoneDue, setMilestoneDue] = useState(plan.eventDate);

  // Add Vendor Meeting / Tasting state
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingVendorId, setMeetingVendorId] = useState(plan.vendors[0]?.id ?? 'v-caterer');
  const [meetingVendorName, setMeetingVendorName] = useState(plan.vendors[0]?.name ?? 'Master Caterers');
  const [meetingCategory, setMeetingCategory] = useState<Category>('catering');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [meetingType, setMeetingType] = useState<VendorMeeting['meetingType']>('food_tasting');
  const [meetingAttendees, setMeetingAttendees] = useState('Both Families & Key Decision Makers');
  const [meetingRating, setMeetingRating] = useState(5);
  const [meetingDishes, setMeetingDishes] = useState('Paneer Lababdar, Dal Bukhara, Angoori Gulab Jamun, Live Chaat');
  const [meetingFeedback, setMeetingFeedback] = useState('Food quality was rich and authentic. Requested slightly milder spice in Dal Makhani for elderly guests.');

  // Copied text state
  const [copiedInquiry, setCopiedInquiry] = useState(false);

  const checklistItems = useMemo(() => vendorChecklist(plan), [plan]);
  const bookedCount = checklistItems.filter((i) => i.status === 'booked').length;
  const quotesList = useMemo(() => plan.quotes ?? [], [plan.quotes]);
  const vendorMeetings = useMemo(() => plan.vendorMeetings ?? [], [plan.vendorMeetings]);

  async function handleAnalyzeQuote(e: FormEvent) {
    e.preventDefault();
    if (!rawQuoteText.trim()) return;
    setIsExtracting(true);
    try {
      const q = await api.extractQuote(rawQuoteText, quoteCategory);
      setExtractedQuote(q);
    } catch {
      // Fallback
    } finally {
      setIsExtracting(false);
    }
  }

  function handleSaveQuoteForComparison() {
    if (!extractedQuote) return;
    const stored: StoredQuote = {
      id: `sq-${Date.now()}`,
      category: extractedQuote.category,
      quote: extractedQuote,
      accepted: false,
    };
    dispatch({ type: 'addStoredQuote', stored });
    setShowQuoteAnalyzer(false);
    setRawQuoteText('');
    setExtractedQuote(null);
    setSubView('comparison');
    setComparisonCategory(extractedQuote.category);
  }

  function handleAcceptQuoteAsVendor(targetQuote: Quote = extractedQuote!) {
    if (!targetQuote) return;
    const cat = targetQuote.category;
    const effCost = effectiveQuoteCost(targetQuote, plan.guests);

    const advancePct = targetQuote.advancePercent ?? 30;
    const advanceAmount = Math.round((effCost * advancePct) / 100);
    const balanceAmount = effCost - advanceAmount;

    const payments: PaymentMilestone[] = [
      {
        id: `pm-1-${Date.now()}`,
        title: `Booking Token (${advancePct}%)`,
        amount: advanceAmount,
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'pending',
      },
      {
        id: `pm-2-${Date.now()}`,
        title: 'Final Balance on Event Day',
        amount: balanceAmount,
        dueDate: plan.eventDate,
        status: 'pending',
      },
    ];

    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      name: targetQuote.vendorName || `Locked ${cat.toUpperCase()} Vendor`,
      category: cat,
      status: 'booked',
      quote: targetQuote,
      payments,
    };

    dispatch({ type: 'addVendor', vendor: newVendor });
    dispatch({
      type: 'addStoredQuote',
      stored: {
        id: `sq-${Date.now()}`,
        category: cat,
        quote: targetQuote,
        accepted: true,
      },
    });

    setShowQuoteAnalyzer(false);
    setRawQuoteText('');
    setExtractedQuote(null);
    setSubView('booked');
  }

  function handleCreateVendor(e: FormEvent) {
    e.preventDefault();
    if (!vendorName.trim()) return;
    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      name: vendorName.trim(),
      category: vendorCat,
      status: 'shortlisted',
      phone: vendorPhone.trim() || undefined,
      payments: [],
    };
    dispatch({ type: 'addVendor', vendor: newVendor });
    setVendorName('');
    setVendorPhone('');
    setShowAddVendor(false);
    setSubView('booked');
  }

  function handleAddPaymentMilestone(e: FormEvent) {
    e.preventDefault();
    if (!activeVendorForPayment) return;
    const newPm: PaymentMilestone = {
      id: `pm-${Date.now()}`,
      title: milestoneTitle,
      amount: Math.max(1, milestoneAmount),
      dueDate: milestoneDue,
      status: 'pending',
    };
    dispatch({ type: 'addPayment', vendorId: activeVendorForPayment, payment: newPm });
    setActiveVendorForPayment(null);
    setMilestoneAmount(50000);
  }

  function handleCreateMeeting(e: FormEvent) {
    e.preventDefault();
    const newMeeting: VendorMeeting = {
      id: `vm-${Date.now()}`,
      vendorId: meetingVendorId,
      vendorName: meetingVendorName.trim() || 'Selected Vendor',
      category: meetingCategory,
      meetingDate,
      meetingType,
      attendees: meetingAttendees.trim() || 'Family Members',
      rating: meetingRating,
      dishesOrItemsTested: meetingDishes.trim() || undefined,
      feedback: meetingFeedback.trim() || 'Meeting completed satisfactorily.',
      status: 'completed',
    };
    dispatch({ type: 'addVendorMeeting', meeting: newMeeting });
    setShowMeetingModal(false);
    setSubView('tastings');
  }

  const comparison = extractedQuote
    ? compareQuoteToBudget(extractedQuote, plan.allocation[extractedQuote.category], plan.guests)
    : null;

  return (
    <div className="space-y-6">
      {/* Top summary card */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
              <Icon name="store" className="w-5 h-5 text-brand-600" />
              Vendor & Sourcing Management (सप्लायर प्रबंधन)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Track supplier outreach, compare competing WhatsApp quotations side-by-side, audit contractual terms, log food tasting & trial visits, and schedule installment payments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMeetingModal(true)}
              className="btn-secondary text-xs"
            >
              <Icon name="check" className="w-4 h-4 text-emerald-500" />
              Log Tasting / Trial Visit
            </button>
            <button
              type="button"
              onClick={() => setShowQuoteAnalyzer(true)}
              className="btn-primary text-xs"
            >
              <Icon name="sparkle" className="w-4 h-4" />
              Analyze Vendor Quote (AI)
            </button>
            <button
              type="button"
              onClick={() => setShowAddVendor(true)}
              className="btn-secondary text-xs"
            >
              <Icon name="plus" className="w-4 h-4" />
              Add Vendor
            </button>
          </div>
        </div>

        {/* Pipeline counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Confirmed</span>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {bookedCount} / {checklistItems.length}
            </p>
            <p className="text-[11px] text-stone-500">Categories locked</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Outreach</span>
            <p className="text-2xl font-extrabold text-stone-700 dark:text-stone-300">
              {checklistItems.filter((i) => i.contacted).length}
            </p>
            <p className="text-[11px] text-stone-500">Vendors contacted</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Tasting & Trials</span>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {vendorMeetings.length}
            </p>
            <p className="text-[11px] text-stone-500">In-person trials logged</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Quotations</span>
            <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
              {quotesList.length}
            </p>
            <p className="text-[11px] text-stone-500">Quotes in comparison matrix</p>
          </div>
        </div>

        {/* Sub-view Segmented Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 w-fit">
          <button
            type="button"
            onClick={() => setSubView('checklist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subView === 'checklist'
                ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            1. Sourcing Checklist ({checklistItems.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subView === 'comparison'
                ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            2. Quote Comparison Matrix ({quotesList.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('tastings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subView === 'tastings'
                ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            3. Tasting & Trial Visits ({vendorMeetings.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('booked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subView === 'booked'
                ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            4. Booked Contracts & Payments ({plan.vendors.length})
          </button>
        </div>
      </section>

      {/* Quote Analyzer Modal */}
      {showQuoteAnalyzer && (
        <section className="card border-brand-300 dark:border-brand-900 bg-brand-50/20 dark:bg-brand-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="sparkle" className="w-5 h-5 text-brand-600" />
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Vendor Quote Analyzer & Contract Verifier
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowQuoteAnalyzer(false);
                setExtractedQuote(null);
              }}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleAnalyzeQuote} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Category
                </label>
                <select
                  value={quoteCategory}
                  onChange={(e) => setQuoteCategory(e.target.value as Category)}
                  className="input-base text-xs"
                >
                  {CATEGORIES.filter((c) => c !== 'contingency').map((cat) => (
                    <option key={cat} value={cat}>
                      {OCCASION_LABELS[plan.occasion][cat] ?? cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Paste Raw Proposal (WhatsApp message or Email draft)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rawQuoteText}
                  onChange={(e) => setRawQuoteText(e.target.value)}
                  placeholder="e.g. ₹1500 per plate, minimum 250 plates, 50% advance, GST extra, includes standard buffet and welcome mocktails."
                  className="input-base text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isExtracting || !rawQuoteText.trim()}
                className="btn-primary text-xs"
              >
                {isExtracting ? 'Analyzing Terms...' : 'Extract & Compare Terms'}
              </button>
            </div>
          </form>

          {/* Analysis Results */}
          {extractedQuote && comparison && (
            <div className="mt-4 pt-4 border-t border-brand-200 dark:border-brand-900/60 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">Effective Total Cost</span>
                  <p className="text-xl font-bold text-stone-900 dark:text-stone-100">
                    {formatINR(comparison.effectiveCost)}
                  </p>
                  <p className="text-xs text-stone-500">
                    Category budget: {formatINR(comparison.categoryBudget)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">Rate Details</span>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {extractedQuote.pricePerPlate ? `${formatINR(extractedQuote.pricePerPlate)}/plate` : 'Lump Sum'}
                  </p>
                  <p className="text-xs text-stone-500">
                    Min guarantee: {extractedQuote.guestMinimum ?? 'None'} · Advance: {extractedQuote.advancePercent ?? 'Unstated'}%
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">Taxes & Cancellation</span>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    GST: {extractedQuote.taxIncluded === true ? 'Included' : extractedQuote.taxIncluded === false ? 'Extra (+18%)' : 'Not stated'}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {extractedQuote.cancellationPolicy ?? 'No cancellation terms stated'}
                  </p>
                </div>
              </div>

              {/* Flags */}
              {comparison.flags.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Contractual Check & Risk Flags
                  </h5>
                  <div className="space-y-1.5">
                    {comparison.flags.map((f, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          f.type === 'warn'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                        }`}
                      >
                        <Icon name={f.type === 'warn' ? 'alert' : 'check'} className="w-4 h-4 shrink-0" />
                        <span>{f.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up negotiation text & Multi-action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const inquiry = generateVendorInquiry(
                      extractedQuote.vendorName ?? 'Vendor',
                      extractedQuote.category,
                      extractedQuote,
                      plan.guests,
                      plan.eventDate,
                    );
                    navigator.clipboard.writeText(inquiry).then(() => {
                      setCopiedInquiry(true);
                      setTimeout(() => setCopiedInquiry(false), 2500);
                    });
                  }}
                  className="btn-secondary text-xs"
                >
                  <Icon name="whatsapp" className="w-3.5 h-3.5 text-emerald-500" />
                  {copiedInquiry ? 'Negotiation Message Copied!' : 'Copy WhatsApp Negotiation Message'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveQuoteForComparison}
                    className="btn-secondary text-xs"
                  >
                    Save for Comparison Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcceptQuoteAsVendor(extractedQuote)}
                    className="btn-primary text-xs"
                  >
                    <Icon name="check" className="w-4 h-4" />
                    Lock In Vendor & Setup Payment Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Add Vendor Form Modal */}
      {showAddVendor && (
        <form onSubmit={handleCreateVendor} className="card border-stone-300 dark:border-stone-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">Add New Vendor</h4>
            <button
              type="button"
              onClick={() => setShowAddVendor(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Royal Caterers / DJ Sunny"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Category
              </label>
              <select
                value={vendorCat}
                onChange={(e) => setVendorCat(e.target.value as Category)}
                className="input-base text-xs"
              >
                {CATEGORIES.filter((c) => c !== 'contingency').map((cat) => (
                  <option key={cat} value={cat}>
                    {OCCASION_LABELS[plan.occasion][cat] ?? cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Contact Phone (WhatsApp)
              </label>
              <input
                type="text"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="input-base text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddVendor(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Vendor
            </button>
          </div>
        </form>
      )}

      {/* Record In-Person Tasting / Trial Meeting Modal */}
      {showMeetingModal && (
        <form onSubmit={handleCreateMeeting} className="card border-indigo-300 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-indigo-500" />
              Record Supplier Tasting & In-Person Trial Visit (सप्लायर मुलाक़ात व चखना)
            </h4>
            <button
              type="button"
              onClick={() => setShowMeetingModal(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                required
                value={meetingVendorName}
                onChange={(e) => {
                  setMeetingVendorName(e.target.value);
                  const found = plan.vendors.find((v) => v.name.toLowerCase() === e.target.value.toLowerCase());
                  if (found) {
                    setMeetingVendorId(found.id);
                    setMeetingCategory(found.category);
                  }
                }}
                placeholder="e.g. Royal Awadhi Caterers / MUA Simran"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Meeting / Visit Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as VendorMeeting['meetingType'])}
                className="input-base text-xs"
              >
                <option value="food_tasting">Food Tasting Session (भोजन चखना)</option>
                <option value="makeup_trial">Bridal Makeup / Styling Trial</option>
                <option value="decor_mockup">Mandap & Floral Mockup Walkthrough</option>
                <option value="sound_check">DJ & Orchestra Acoustic Sound Check</option>
                <option value="contract_discussion">In-Person Contract Negotiation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Date of Meeting
              </label>
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="input-base text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Dishes / Items Sampled or Tested
              </label>
              <input
                type="text"
                value={meetingDishes}
                onChange={(e) => setMeetingDishes(e.target.value)}
                placeholder="e.g. Paneer Lababdar, Live Jalebi, Dal Bukhara, Airbrush Makeup"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Overall Impression / Rating
              </label>
              <select
                value={meetingRating}
                onChange={(e) => setMeetingRating(parseInt(e.target.value, 10))}
                className="input-base text-xs font-bold text-amber-500"
              >
                <option value={5}>★★★★★ (5/5 Excellent)</option>
                <option value={4}>★★★★☆ (4/5 Very Good)</option>
                <option value={3}>★★★☆☆ (3/5 Average)</option>
                <option value={2}>★★☆☆☆ (2/5 Needs Changes)</option>
                <option value={1}>★☆☆☆☆ (1/5 Unsatisfactory)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Attendees Present
              </label>
              <input
                type="text"
                value={meetingAttendees}
                onChange={(e) => setMeetingAttendees(e.target.value)}
                placeholder="e.g. Both families, Groom & Bride"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Feedback & Recipe Adjustments
              </label>
              <input
                type="text"
                required
                value={meetingFeedback}
                onChange={(e) => setMeetingFeedback(e.target.value)}
                placeholder="e.g. Delicious sweets, requested slightly less spice in Dal Makhani"
                className="input-base text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowMeetingModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Tasting Visit Log
            </button>
          </div>
        </form>
      )}

      {/* Add Payment Milestone Modal */}
      {activeVendorForPayment && (
        <form onSubmit={handleAddPaymentMilestone} className="card border-brand-300 bg-brand-50/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Add Payment Installment Milestone
            </h4>
            <button
              type="button"
              onClick={() => setActiveVendorForPayment(null)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Milestone Title
              </label>
              <input
                type="text"
                required
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder="e.g. 50% Advance / Stage Completion"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Amount (INR ₹)
              </label>
              <input
                type="number"
                min={1}
                required
                value={milestoneAmount}
                onChange={(e) => setMilestoneAmount(parseInt(e.target.value || '1', 10))}
                className="input-base text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={milestoneDue}
                onChange={(e) => setMilestoneDue(e.target.value)}
                className="input-base text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveVendorForPayment(null)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* VIEW 1: Sourcing Checklist */}
      {subView === 'checklist' && (
        <section className="card space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Celebration Sourcing Checklist
              </h4>
              <p className="text-xs text-stone-500">
                Mark suppliers as contacted once you begin conversations. Accepting a quote automatically marks the category locked.
              </p>
            </div>
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
              {bookedCount} of {checklistItems.length} categories confirmed
            </span>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {checklistItems.map((item) => {
              const matchingQuotes = quotesList.filter((q) => q.category === item.category);
              const matchingMeetings = vendorMeetings.filter((m) => m.category === item.category);
              return (
                <div
                  key={item.category}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 max-w-xl">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                        {item.label}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.status === 'booked'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                            : item.status === 'quoted'
                              ? 'bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-200 border border-brand-300 dark:border-brand-800'
                              : item.status === 'contacted'
                                ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-800'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                      {matchingQuotes.length > 0 && (
                        <span className="text-[10px] font-semibold text-stone-500">
                          ({matchingQuotes.length} quote{matchingQuotes.length > 1 ? 's' : ''})
                        </span>
                      )}
                      {matchingMeetings.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                          ✓ Tasting Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {item.hint}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.contacted}
                        onChange={() =>
                          dispatch({ type: 'toggleContacted', category: item.category })
                        }
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                      Contacted
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setMeetingCategory(item.category);
                        setMeetingVendorName(`${item.label} Partner`);
                        setShowMeetingModal(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      + Tasting
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQuoteCategory(item.category);
                        setShowQuoteAnalyzer(true);
                      }}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                    >
                      + Quote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* VIEW 2: Side-by-Side Quotation Comparison Matrix */}
      {subView === 'comparison' && (
        <section className="space-y-4">
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Side-by-Side Quotation Comparison Matrix
                </h4>
                <p className="text-xs text-stone-500">
                  Compare multi-vendor proposals side-by-side on effective cost, minimum guarantees, advance payment risks, and hidden taxes.
                </p>
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">Category:</span>
                <select
                  value={comparisonCategory}
                  onChange={(e) => setComparisonCategory(e.target.value as Category)}
                  className="input-base text-xs py-1"
                >
                  {CATEGORIES.filter((c) => c !== 'contingency').map((cat) => (
                    <option key={cat} value={cat}>
                      {OCCASION_LABELS[plan.occasion][cat] ?? cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quotations for the selected category */}
          {(() => {
            const categoryQuotes = quotesList.filter((q) => q.category === comparisonCategory);
            const categoryBudget = plan.allocation[comparisonCategory] ?? 0;

            if (categoryQuotes.length === 0) {
              return (
                <div className="card text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 mx-auto flex items-center justify-center">
                    <Icon name="sparkle" className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                      No Quotations Saved Yet for {OCCASION_LABELS[plan.occasion][comparisonCategory] ?? comparisonCategory}
                    </h5>
                    <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                      Paste WhatsApp proposals from your caterers, photographers, or decorators into the Quote Analyzer to compare them here side-by-side.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteCategory(comparisonCategory);
                      setShowQuoteAnalyzer(true);
                    }}
                    className="btn-primary text-xs"
                  >
                    + Analyze Proposal for {comparisonCategory}
                  </button>
                </div>
              );
            }

            const evaluated = categoryQuotes.map((sq) => {
              const comp = compareQuoteToBudget(sq.quote, categoryBudget, plan.guests);
              return { sq, comp };
            });

            return (
              <div className="card overflow-x-auto">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Comparing {categoryQuotes.length} Proposal{categoryQuotes.length > 1 ? 's' : ''} (Budget: {formatINR(categoryBudget)})
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteCategory(comparisonCategory);
                      setShowQuoteAnalyzer(true);
                    }}
                    className="btn-secondary text-xs"
                  >
                    + Add Another Quote
                  </button>
                </div>

                <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800">
                      <th className="py-2.5 px-3 font-bold text-stone-400 uppercase tracking-wider w-40">
                        Specification
                      </th>
                      {evaluated.map(({ sq }, i) => (
                        <th key={sq.id} className="py-2.5 px-3 font-bold text-stone-900 dark:text-stone-100">
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
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">Effective Cost ({plan.guests} guests)</td>
                      {evaluated.map(({ sq, comp }) => (
                        <td key={sq.id} className="py-2.5 px-3 font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                          {formatINR(comp.effectiveCost)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">Against Budget</td>
                      {evaluated.map(({ sq, comp }) => (
                        <td key={sq.id} className="py-2.5 px-3">
                          {comp.isOverBudget ? (
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              +{formatINR(comp.variance)} over
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              -{formatINR(Math.abs(comp.variance))} within
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">Rate Structure</td>
                      {evaluated.map(({ sq }) => (
                        <td key={sq.id} className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                          {sq.quote.pricePerPlate ? `${formatINR(sq.quote.pricePerPlate)}/plate` : 'Lump Sum Package'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">Guest Minimum Guarantee</td>
                      {evaluated.map(({ sq }) => (
                        <td key={sq.id} className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                          {sq.quote.guestMinimum ? `${sq.quote.guestMinimum} guests` : 'None specified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">Advance Payment Demanded</td>
                      {evaluated.map(({ sq }) => (
                        <td key={sq.id} className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                          {sq.quote.advancePercent !== null ? `${sq.quote.advancePercent}%` : 'Unspecified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">GST / Tax Status</td>
                      {evaluated.map(({ sq }) => (
                        <td key={sq.id} className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                          {sq.quote.taxIncluded === true
                            ? 'GST Included'
                            : sq.quote.taxIncluded === false
                              ? 'GST Extra (+18%)'
                              : 'Not Stated'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">Contract Risk Flags</td>
                      {evaluated.map(({ sq, comp }) => (
                        <td key={sq.id} className="py-2.5 px-3 space-y-1">
                          {comp.flags.map((flag, idx) => (
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
                          ))}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-500">Actions</td>
                      {evaluated.map(({ sq }) => (
                        <td key={sq.id} className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {!sq.accepted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  dispatch({ type: 'acceptStoredQuote', quoteId: sq.id });
                                  handleAcceptQuoteAsVendor(sq.quote);
                                }}
                                className="btn-primary text-[11px] py-1 px-2.5"
                              >
                                Accept & Lock
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600">✓ Locked in</span>
                            )}
                            <button
                              type="button"
                              onClick={() => dispatch({ type: 'deleteStoredQuote', quoteId: sq.id })}
                              className="text-stone-400 hover:text-red-600 p-1"
                              title="Delete Quote"
                            >
                              <Icon name="trash" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </section>
      )}

      {/* VIEW 3: Tasting & Trial Visits */}
      {subView === 'tastings' && (
        <section className="space-y-4">
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Supplier Tasting & Trial Visits (सप्लायर मुलाक़ात व चखना सत्र)
                </h4>
                <p className="text-xs text-stone-500">
                  Record food tastings with caterers, bridal makeup trials, mandap mockup walkthroughs, and DJ sound tests.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMeetingModal(true)}
                className="btn-primary text-xs"
              >
                + Log Tasting / Trial Visit
              </button>
            </div>
          </div>

          {vendorMeetings.length === 0 ? (
            <div className="card text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto flex items-center justify-center">
                <Icon name="check" className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                No Tasting or Trial Visits Logged Yet
              </h5>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Schedule a food tasting session with your shortlisted caterer to sample main course gravies, live chaat, and sweets before locking in your booking.
              </p>
              <button
                type="button"
                onClick={() => setShowMeetingModal(true)}
                className="btn-primary text-xs"
              >
                + Record First Tasting Session
              </button>
            </div>
          ) : (
            vendorMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="card border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {meeting.vendorName}
                      </h4>
                      <span className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {meeting.meetingType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-amber-500">
                        {'★'.repeat(meeting.rating)}{'☆'.repeat(5 - meeting.rating)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      📅 Date: {meeting.meetingDate} · 👥 Attendees: {meeting.attendees}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'deleteVendorMeeting', meetingId: meeting.id })}
                    className="p-1 rounded text-stone-400 hover:text-red-600"
                    title="Delete Meeting Log"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>

                {meeting.dishesOrItemsTested && (
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 text-xs">
                    <span className="font-semibold text-brand-600 dark:text-brand-400 block mb-0.5">
                      Items / Dishes Sampled:
                    </span>
                    <p className="text-stone-800 dark:text-stone-200">{meeting.dishesOrItemsTested}</p>
                  </div>
                )}

                <div className="text-xs space-y-1">
                  <span className="font-semibold text-stone-500 block">Feedback & Recipe Adjustments:</span>
                  <p className="text-stone-700 dark:text-stone-300 italic">{meeting.feedback}</p>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* VIEW 4: Booked Contracts & Payment Milestones */}
      {subView === 'booked' && (
        <section className="space-y-4">
          {plan.vendors.length === 0 ? (
            <div className="card text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 mx-auto flex items-center justify-center">
                <Icon name="store" className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                No Booked Vendors Yet
              </h5>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Use the Sourcing Checklist or Quote Comparison to lock in vendors and generate payment schedules.
              </p>
              <button
                type="button"
                onClick={() => setShowAddVendor(true)}
                className="btn-primary text-xs"
              >
                + Add Vendor Manually
              </button>
            </div>
          ) : (
            plan.vendors.map((vendor) => {
              const payments = calculateVendorPayments(vendor);
              return (
                <div
                  key={vendor.id}
                  className="card border border-stone-200 dark:border-stone-800 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {vendor.name}
                        </h4>
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {OCCASION_LABELS[plan.occasion][vendor.category] ?? vendor.category}
                        </span>
                        <select
                          value={vendor.status}
                          onChange={(e) => {
                            dispatch({
                              type: 'updateVendor',
                              vendor: { ...vendor, status: e.target.value as VendorStatus },
                            });
                          }}
                          className="text-xs font-bold rounded-lg border border-stone-200 dark:border-stone-700 px-2 py-0.5 bg-white dark:bg-stone-900"
                        >
                          <option value="shortlisted">Shortlisted</option>
                          <option value="contacted">Contacted</option>
                          <option value="quoted">Quoted</option>
                          <option value="booked">Booked & Locked</option>
                        </select>
                      </div>
                      {vendor.phone && (
                        <p className="text-xs text-stone-400 mt-0.5">{vendor.phone}</p>
                      )}
                    </div>

                    {/* Payment Overview */}
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 uppercase">Paid / Total</span>
                        <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                          {formatINR(payments.totalPaid)} / {formatINR(payments.totalAgreed)}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {payments.balanceRemaining > 0
                            ? `Balance: ${formatINR(payments.balanceRemaining)}`
                            : 'Fully Paid'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setMeetingVendorId(vendor.id);
                          setMeetingVendorName(vendor.name);
                          setMeetingCategory(vendor.category);
                          setShowMeetingModal(true);
                        }}
                        className="btn-secondary text-xs"
                      >
                        + Tasting Visit
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveVendorForPayment(vendor.id)}
                        className="btn-secondary text-xs"
                      >
                        + Payment Milestone
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'deleteVendor', vendorId: vendor.id })}
                        className="p-1 rounded text-stone-400 hover:text-red-600"
                        title="Delete Vendor"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Milestones timeline */}
                  {vendor.payments.length > 0 && (
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                        Payment Installment Schedule
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {vendor.payments.map((pm) => (
                          <div
                            key={pm.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                              pm.status === 'paid'
                                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-stone-900 dark:text-stone-100">{pm.title}</p>
                              <p className="text-stone-500 font-semibold">{formatINR(pm.amount)}</p>
                              <p className="text-[10px] text-stone-400">Due: {pm.dueDate}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: 'togglePayment',
                                  vendorId: vendor.id,
                                  paymentId: pm.id,
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                                pm.status === 'paid'
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-emerald-500'
                              }`}
                            >
                              {pm.status === 'paid' ? '✓ Paid' : 'Mark Paid'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
};
