import { useCallback, useMemo, useState, type FC, type FormEvent } from 'react';
import type { Category, Plan, Quote, Vendor } from '../../schemas';
import type { Action } from '../../state/planStore';
import { vendorChecklist } from '../../engine/vendors';
import { isoToday } from '../../state/planFactory';
import { AddVendorForm, type AddVendorDraft } from './AddVendorForm';
import { BookedView } from './BookedView';
import { ChecklistView } from './ChecklistView';
import { ComparisonView } from './ComparisonView';
import { MeetingForm } from './MeetingForm';
import { PaymentMilestoneForm, type MilestoneDraft } from './PaymentMilestoneForm';
import { QuoteAnalyzer } from './QuoteAnalyzer';
import { TastingsView } from './TastingsView';
import { VendorsSummary } from './VendorsSummary';
import {
  DEFAULT_CATEGORY,
  DEFAULT_MEETING_ATTENDEES,
  DEFAULT_MEETING_DISHES,
  DEFAULT_MEETING_FEEDBACK,
  DEFAULT_MEETING_VENDOR_ID,
  DEFAULT_MEETING_VENDOR_NAME,
  DEFAULT_MILESTONE_AMOUNT,
  DEFAULT_MILESTONE_TITLE,
  MAX_RATING,
  type SubView,
} from './constants';
import {
  buildBookedVendor,
  buildManualVendor,
  buildMeeting,
  buildMilestone,
  buildStoredQuote,
  type MeetingDraft,
} from './helpers';
import { useDraft } from './useDraft';
import { useQuoteAnalyzer } from './useQuoteAnalyzer';

interface VendorsTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

function initialMeetingDraft(plan: Plan): MeetingDraft {
  return {
    vendorId: plan.vendors[0]?.id ?? DEFAULT_MEETING_VENDOR_ID,
    vendorName: plan.vendors[0]?.name ?? DEFAULT_MEETING_VENDOR_NAME,
    category: DEFAULT_CATEGORY,
    meetingDate: isoToday(),
    meetingType: 'food_tasting',
    attendees: DEFAULT_MEETING_ATTENDEES,
    rating: MAX_RATING,
    dishes: DEFAULT_MEETING_DISHES,
    feedback: DEFAULT_MEETING_FEEDBACK,
  };
}

/** Vendor sourcing, quote comparison, tasting logs and payment schedules. */
export const VendorsTab: FC<VendorsTabProps> = ({ plan, dispatch }) => {
  const [subView, setSubView] = useState<SubView>('checklist');
  const [comparisonCategory, setComparisonCategory] = useState<Category>(DEFAULT_CATEGORY);

  const [showQuoteAnalyzer, setShowQuoteAnalyzer] = useState(false);
  const [quoteCategory, setQuoteCategory] = useState<Category>(DEFAULT_CATEGORY);
  const analyzer = useQuoteAnalyzer(quoteCategory);

  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorDraft, patchVendor] = useDraft<AddVendorDraft>({
    name: '',
    category: DEFAULT_CATEGORY,
    phone: '',
  });

  const [paymentVendorId, setPaymentVendorId] = useState<string | null>(null);
  const [milestoneDraft, patchMilestone] = useDraft<MilestoneDraft>({
    title: DEFAULT_MILESTONE_TITLE,
    amount: DEFAULT_MILESTONE_AMOUNT,
    due: plan.eventDate,
  });

  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingDraft, patchMeeting] = useDraft<MeetingDraft>(initialMeetingDraft(plan));

  const checklistItems = useMemo(() => vendorChecklist(plan), [plan]);
  const bookedCount = checklistItems.filter((i) => i.status === 'booked').length;
  const contactedCount = checklistItems.filter((i) => i.contacted).length;
  const quotes = useMemo(() => plan.quotes ?? [], [plan.quotes]);
  const meetings = useMemo(() => plan.vendorMeetings ?? [], [plan.vendorMeetings]);

  const closeAnalyzer = useCallback(() => {
    setShowQuoteAnalyzer(false);
    analyzer.clearExtracted();
  }, [analyzer]);

  const openAnalyzer = useCallback((category?: Category) => {
    if (category) setQuoteCategory(category);
    setShowQuoteAnalyzer(true);
  }, []);

  const finishAnalysis = (next: SubView) => {
    setShowQuoteAnalyzer(false);
    analyzer.reset();
    setSubView(next);
  };

  const saveForComparison = () => {
    const { extracted } = analyzer;
    if (!extracted) return;
    dispatch({ type: 'addStoredQuote', stored: buildStoredQuote(extracted, false) });
    finishAnalysis('comparison');
    setComparisonCategory(extracted.category);
  };

  const lockInQuote = (quote: Quote) => {
    dispatch({ type: 'addVendor', vendor: buildBookedVendor(quote, plan) });
    dispatch({ type: 'addStoredQuote', stored: buildStoredQuote(quote, true) });
    finishAnalysis('booked');
  };

  const createVendor = (e: FormEvent) => {
    e.preventDefault();
    if (!vendorDraft.name.trim()) return;
    dispatch({
      type: 'addVendor',
      vendor: buildManualVendor(vendorDraft.name, vendorDraft.category, vendorDraft.phone),
    });
    patchVendor({ name: '', phone: '' });
    setShowAddVendor(false);
    setSubView('booked');
  };

  const addMilestone = (e: FormEvent) => {
    e.preventDefault();
    if (!paymentVendorId) return;
    dispatch({
      type: 'addPayment',
      vendorId: paymentVendorId,
      payment: buildMilestone(milestoneDraft.title, milestoneDraft.amount, milestoneDraft.due),
    });
    setPaymentVendorId(null);
    patchMilestone({ amount: DEFAULT_MILESTONE_AMOUNT });
  };

  const createMeeting = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'addVendorMeeting', meeting: buildMeeting(meetingDraft) });
    setShowMeeting(false);
    setSubView('tastings');
  };

  const logTastingFor = useCallback(
    (vendor: Vendor) => {
      patchMeeting({ vendorId: vendor.id, vendorName: vendor.name, category: vendor.category });
      setShowMeeting(true);
    },
    [patchMeeting],
  );

  const logTastingForCategory = useCallback(
    (category: Category, label: string) => {
      patchMeeting({ category, vendorName: `${label} Partner` });
      setShowMeeting(true);
    },
    [patchMeeting],
  );

  const openMeeting = useCallback(() => setShowMeeting(true), []);
  const openAddVendor = useCallback(() => setShowAddVendor(true), []);

  return (
    <div className="space-y-6">
      <VendorsSummary
        subView={subView}
        onSubViewChange={setSubView}
        bookedCount={bookedCount}
        categoryCount={checklistItems.length}
        contactedCount={contactedCount}
        meetingCount={meetings.length}
        quoteCount={quotes.length}
        vendorCount={plan.vendors.length}
        onLogTasting={openMeeting}
        onAnalyzeQuote={() => openAnalyzer()}
        onAddVendor={openAddVendor}
      />

      {showQuoteAnalyzer && (
        <QuoteAnalyzer
          plan={plan}
          category={quoteCategory}
          onCategoryChange={setQuoteCategory}
          analyzer={analyzer}
          onClose={closeAnalyzer}
          onSaveForComparison={saveForComparison}
          onLockIn={lockInQuote}
        />
      )}

      {showAddVendor && (
        <AddVendorForm
          occasion={plan.occasion}
          draft={vendorDraft}
          onChange={patchVendor}
          onSubmit={createVendor}
          onCancel={() => setShowAddVendor(false)}
        />
      )}

      {showMeeting && (
        <MeetingForm
          vendors={plan.vendors}
          draft={meetingDraft}
          onChange={patchMeeting}
          onSubmit={createMeeting}
          onCancel={() => setShowMeeting(false)}
        />
      )}

      {paymentVendorId && (
        <PaymentMilestoneForm
          draft={milestoneDraft}
          onChange={patchMilestone}
          onSubmit={addMilestone}
          onCancel={() => setPaymentVendorId(null)}
        />
      )}

      {subView === 'checklist' && (
        <ChecklistView
          items={checklistItems}
          quotes={quotes}
          meetings={meetings}
          bookedCount={bookedCount}
          dispatch={dispatch}
          onAddTasting={logTastingForCategory}
          onAddQuote={openAnalyzer}
        />
      )}

      {subView === 'comparison' && (
        <ComparisonView
          plan={plan}
          quotes={quotes}
          category={comparisonCategory}
          onCategoryChange={setComparisonCategory}
          dispatch={dispatch}
          onAnalyze={openAnalyzer}
          onLockIn={lockInQuote}
        />
      )}

      {subView === 'tastings' && (
        <TastingsView meetings={meetings} dispatch={dispatch} onLogTasting={openMeeting} />
      )}

      {subView === 'booked' && (
        <BookedView
          plan={plan}
          dispatch={dispatch}
          onAddVendor={openAddVendor}
          onLogTasting={logTastingFor}
          onAddMilestone={setPaymentVendorId}
        />
      )}
    </div>
  );
};
