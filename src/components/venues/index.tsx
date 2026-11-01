import { useCallback, useMemo, useState, type FC, type FormEvent } from 'react';
import type { Plan, VenueDetail } from '../../schemas';
import type { Action } from '../../state/planStore';
import { formatVenueWhatsappInquiry } from '../../engine/venues';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import type { VenueSubView } from './constants';
import { buildSiteVisit, buildVenue, visitTarget } from './helpers';
import { useVenueForm, useVisitForm } from './hooks';
import { PropertiesView } from './PropertiesView';
import { SiteVisitForm } from './SiteVisitForm';
import { VenueForm } from './VenueForm';
import { VenuesSummary } from './VenuesSummary';
import { VisitsView } from './VisitsView';

interface VenuesTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

/** Venue shortlist, comparison and site-visit log tab. */
export const VenuesTab: FC<VenuesTabProps> = ({ plan, dispatch }) => {
  const venues = useMemo(() => plan.venues ?? [], [plan.venues]);
  const siteVisits = useMemo(() => plan.siteVisits ?? [], [plan.siteVisits]);

  const [subView, setSubView] = useState<VenueSubView>('properties');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const { copiedKey, copy } = useCopyToClipboard();

  const venueForm = useVenueForm(plan.city ?? '');
  const visitForm = useVisitForm(venues);
  const setVisitField = visitForm.setField;

  const bookedVenue = venues.find((v) => v.status === 'booked');

  const openVisitForm = useCallback(
    (venueId?: string) => {
      const target = venueId ?? (visitForm.form.venueId || venues[0]?.id);
      if (target) setVisitField('venueId', target);
      setShowVisitForm(true);
    },
    [setVisitField, venues, visitForm.form.venueId],
  );
  const openAnyVisitForm = useCallback(() => openVisitForm(), [openVisitForm]);
  const openAddForm = useCallback(() => setShowAddForm(true), []);
  const closeAddForm = useCallback(() => setShowAddForm(false), []);
  const closeVisitForm = useCallback(() => setShowVisitForm(false), []);

  function handleCreateVenue(e: FormEvent) {
    e.preventDefault();
    const venue = buildVenue(venueForm.form);
    if (!venue) return;
    dispatch({ type: 'addVenue', venue });
    venueForm.setField('name', '');
    setShowAddForm(false);
  }

  function handleCreateSiteVisit(e: FormEvent) {
    e.preventDefault();
    const visit = buildSiteVisit(visitForm.form, venues);
    dispatch({ type: 'addSiteVisit', visit });
    const target = visitTarget(venues, visitForm.form.venueId);
    if (target?.status === 'shortlisted') {
      dispatch({ type: 'updateVenue', venue: { ...target, status: 'visited' } });
    }
    setShowVisitForm(false);
    setVisitField('notes', '');
    setVisitField('tastingNotes', '');
    setSubView('visits');
  }

  const handleCopyInquiry = useCallback(
    (venue: VenueDetail) =>
      copy(formatVenueWhatsappInquiry(venue, plan.eventDate, plan.guests, plan.title), venue.id),
    [copy, plan.eventDate, plan.guests, plan.title],
  );
  const handleSetStatus = useCallback(
    (venue: VenueDetail, status: VenueDetail['status']) =>
      dispatch({ type: 'updateVenue', venue: { ...venue, status } }),
    [dispatch],
  );
  const handleDeleteVenue = useCallback(
    (venueId: string) => dispatch({ type: 'deleteVenue', venueId }),
    [dispatch],
  );
  const handleDeleteVisit = useCallback(
    (visitId: string) => dispatch({ type: 'deleteSiteVisit', visitId }),
    [dispatch],
  );

  return (
    <div className="space-y-6">
      <VenuesSummary
        venueCount={venues.length}
        visitCount={siteVisits.length}
        venueBudget={plan.allocation.venue}
        bookedVenue={bookedVenue}
        subView={subView}
        onSubViewChange={setSubView}
        onLogVisit={openAnyVisitForm}
        onAddVenue={openAddForm}
      />

      {showAddForm && (
        <VenueForm
          form={venueForm.form}
          setField={venueForm.setField}
          onSubmit={handleCreateVenue}
          onCancel={closeAddForm}
        />
      )}

      {showVisitForm && (
        <SiteVisitForm
          venues={venues}
          form={visitForm.form}
          setField={visitForm.setField}
          onSubmit={handleCreateSiteVisit}
          onCancel={closeVisitForm}
        />
      )}

      {subView === 'properties' && (
        <PropertiesView
          venues={venues}
          siteVisits={siteVisits}
          guests={plan.guests}
          copiedId={copiedKey}
          onAddVenue={openAddForm}
          onLogVisit={openVisitForm}
          onSetStatus={handleSetStatus}
          onDelete={handleDeleteVenue}
          onCopyInquiry={handleCopyInquiry}
        />
      )}

      {subView === 'visits' && (
        <VisitsView
          siteVisits={siteVisits}
          onLogVisit={openAnyVisitForm}
          onDeleteVisit={handleDeleteVisit}
        />
      )}
    </div>
  );
};
