import { useState, useMemo, type FC, type FormEvent } from 'react';
import type { CateringPolicy, Plan, SiteVisit, VenueDetail, VenueType } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { evaluateVenue, formatVenueWhatsappInquiry } from '../engine/venues';
import { formatINR } from '../engine/money';

interface VenuesTabProps {
  plan: Plan;
  dispatch: (action: Action) => void;
}

type VenueSubView = 'properties' | 'visits';

export const VenuesTab: FC<VenuesTabProps> = ({ plan, dispatch }) => {
  const venues = useMemo(() => plan.venues ?? [], [plan.venues]);
  const siteVisits = useMemo(() => plan.siteVisits ?? [], [plan.siteVisits]);

  const [subView, setSubView] = useState<VenueSubView>('properties');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Venue Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<VenueType>('banquet_hall');
  const [capacityMin, setCapacityMin] = useState(100);
  const [capacityMax, setCapacityMax] = useState(500);
  const [rentalCost, setRentalCost] = useState(300000);
  const [cateringPolicy, setCateringPolicy] = useState<CateringPolicy>('external_allowed');
  const [alcoholAllowed, setAlcoholAllowed] = useState(false);
  const [parkingCapacity, setParkingCapacity] = useState(100);
  const [roomsIncluded, setRoomsIncluded] = useState(2);
  const [curfewTime, setCurfewTime] = useState('23:00');
  const [cautionDeposit, setCautionDeposit] = useState(25000);
  const [address, setAddress] = useState(plan.city ? `${plan.city}` : '');
  const [notes, setNotes] = useState('');

  // Site Visit Form state
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id ?? '');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendees, setAttendees] = useState("Groom's Parents & Uncle");
  const [visitRating, setVisitRating] = useState(5);
  const [acWorking, setAcWorking] = useState(true);
  const [bridalRoomClean, setBridalRoomClean] = useState(true);
  const [soundCurfewOk, setSoundCurfewOk] = useState(true);
  const [parkingAdequate, setParkingAdequate] = useState(true);
  const [tastingDone, setTastingDone] = useState(false);
  const [tastingNotes, setTastingNotes] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const bookedVenue = venues.find((v) => v.status === 'booked');

  function handleCreateVenue(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newVenue: VenueDetail = {
      id: `venue-${Date.now()}`,
      name: name.trim(),
      type,
      capacityMin: Math.max(0, capacityMin),
      capacityMax: Math.max(capacityMin, capacityMax),
      rentalCost: Math.max(0, rentalCost),
      cateringPolicy,
      alcoholAllowed,
      parkingCapacity: Math.max(0, parkingCapacity),
      roomsIncluded: Math.max(0, roomsIncluded),
      curfewTime,
      cautionDeposit: Math.max(0, cautionDeposit),
      address: address.trim() || undefined,
      status: 'shortlisted',
      notes: notes.trim() || undefined,
    };

    dispatch({ type: 'addVenue', venue: newVenue });
    setName('');
    setShowAddForm(false);
  }

  function handleCreateSiteVisit(e: FormEvent) {
    e.preventDefault();
    const targetVenue = venues.find((v) => v.id === selectedVenueId) ?? venues[0];
    const venueName = targetVenue ? targetVenue.name : 'Selected Venue';

    const newVisit: SiteVisit = {
      id: `visit-${Date.now()}`,
      venueId: selectedVenueId || (targetVenue ? targetVenue.id : 'v-1'),
      venueName,
      visitDate,
      attendees: attendees.trim() || 'Family Members',
      rating: visitRating,
      acWorking,
      bridalRoomClean,
      soundCurfewOk,
      parkingAdequate,
      tastingDone,
      tastingNotes: tastingNotes.trim() || undefined,
      notes: visitNotes.trim() || undefined,
      status: 'completed',
    };

    dispatch({ type: 'addSiteVisit', visit: newVisit });
    if (targetVenue && targetVenue.status === 'shortlisted') {
      dispatch({ type: 'updateVenue', venue: { ...targetVenue, status: 'visited' } });
    }

    setShowVisitForm(false);
    setVisitNotes('');
    setTastingNotes('');
    setSubView('visits');
  }

  function handleCopyInquiry(venue: VenueDetail) {
    const text = formatVenueWhatsappInquiry(venue, plan.eventDate, plan.guests, plan.title);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(venue.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  }

  function handleSetStatus(venue: VenueDetail, status: VenueDetail['status']) {
    dispatch({ type: 'updateVenue', venue: { ...venue, status } });
  }

  return (
    <div className="space-y-6">
      {/* Top summary card */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
              <Icon name="building" className="w-5 h-5 text-amber-500" />
              Venue & Property Management (स्थल प्रबंधन)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Shortlist and compare banquets, lawns, and heritage resorts. Evaluate capacity fits,
              kitchen catering policies, and log in-person physical site visits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (venues.length > 0 && !selectedVenueId) setSelectedVenueId(venues[0]!.id);
                setShowVisitForm(true);
              }}
              className="btn-secondary text-xs"
            >
              <Icon name="check" className="w-4 h-4 text-emerald-500" />
              Log Site Recce Visit
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn-primary text-xs"
            >
              <Icon name="plus" className="w-4 h-4" />
              Shortlist New Venue
            </button>
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Shortlisted
            </span>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              {venues.length}
            </p>
            <p className="text-[11px] text-stone-500">Properties under review</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Site Visits Done
            </span>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {siteVisits.length}
            </p>
            <p className="text-[11px] text-stone-500">Physical walkthroughs</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Venue Budget
            </span>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatINR(plan.allocation.venue)}
            </p>
            <p className="text-[11px] text-stone-500">Allocated in Master Budget</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Booked Venue
            </span>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 truncate mt-1">
              {bookedVenue ? bookedVenue.name : 'None Locked Yet'}
            </p>
            <p className="text-[11px] text-stone-500">
              {bookedVenue ? 'Date & Token Locked' : 'Action Required'}
            </p>
          </div>
        </div>

        {/* Sub-view Segmented Tabs */}
        <div className="mt-4 flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 w-fit">
          <button
            type="button"
            onClick={() => setSubView('properties')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subView === 'properties'
                ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            1. Properties & Halls ({venues.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('visits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subView === 'visits'
                ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            2. Site Recce & In-Person Visits ({siteVisits.length})
          </button>
        </div>
      </section>

      {/* Add Venue Form Modal */}
      {showAddForm && (
        <form
          onSubmit={handleCreateVenue}
          className="card border-amber-300 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Icon name="plus" className="w-4 h-4 text-amber-500" />
              Add Venue for Evaluation
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="venue-name-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Venue / Property Name
              </label>
              <input
                id="venue-name-input"
                aria-label="Venue or Property Name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Palace Banquet & Lawns / Amaltas Heritage Resort"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="venue-type-select"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Property Type
              </label>
              <select
                id="venue-type-select"
                aria-label="Property Type"
                value={type}
                onChange={(e) => setType(e.target.value as VenueType)}
                className="input-base text-xs"
              >
                <option value="banquet_hall">Banquet Hall (Indoor AC)</option>
                <option value="outdoor_lawn">Outdoor Open Lawn</option>
                <option value="heritage_resort">Heritage Palace / Resort</option>
                <option value="hotel_ballroom">5-Star Hotel Ballroom</option>
                <option value="community_hall">Community Hall / Pandal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="venue-min-capacity"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Min Capacity
              </label>
              <input
                id="venue-min-capacity"
                aria-label="Minimum Guest Capacity"
                type="number"
                min={0}
                required
                value={capacityMin}
                onChange={(e) => setCapacityMin(parseInt(e.target.value || '0', 10))}
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="venue-max-capacity"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Max Capacity
              </label>
              <input
                id="venue-max-capacity"
                aria-label="Maximum Guest Capacity"
                type="number"
                min={0}
                required
                value={capacityMax}
                onChange={(e) => setCapacityMax(parseInt(e.target.value || '0', 10))}
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="venue-rental-cost"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Rental Cost (₹)
              </label>
              <input
                id="venue-rental-cost"
                aria-label="Venue Rental Cost in Indian Rupees"
                type="number"
                min={0}
                required
                value={rentalCost}
                onChange={(e) => setRentalCost(parseInt(e.target.value || '0', 10))}
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="venue-caution-deposit"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Caution Deposit (₹)
              </label>
              <input
                id="venue-caution-deposit"
                aria-label="Refundable Caution Deposit in Indian Rupees"
                type="number"
                min={0}
                required
                value={cautionDeposit}
                onChange={(e) => setCautionDeposit(parseInt(e.target.value || '0', 10))}
                className="input-base text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="venue-catering-policy"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Catering Policy
              </label>
              <select
                id="venue-catering-policy"
                aria-label="Catering Policy"
                value={cateringPolicy}
                onChange={(e) => setCateringPolicy(e.target.value as CateringPolicy)}
                className="input-base text-xs"
              >
                <option value="external_allowed">Outside Caterers Allowed</option>
                <option value="in_house_mandatory">In-House Catering Mandatory</option>
                <option value="royalty_fee">Outside with Royalty Fee</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="venue-curfew-time"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Sound Curfew Time
              </label>
              <input
                id="venue-curfew-time"
                aria-label="Sound Curfew Time"
                type="text"
                value={curfewTime}
                onChange={(e) => setCurfewTime(e.target.value)}
                placeholder="23:00 / 10:00 PM"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="venue-rooms-included"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Bridal Rooms Included
              </label>
              <input
                id="venue-rooms-included"
                aria-label="Bridal Rooms Included"
                type="number"
                min={0}
                value={roomsIncluded}
                onChange={(e) => setRoomsIncluded(parseInt(e.target.value || '0', 10))}
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="venue-parking-capacity"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Parking Capacity (Cars)
              </label>
              <input
                id="venue-parking-capacity"
                aria-label="Parking Capacity in Cars"
                type="number"
                min={0}
                value={parkingCapacity}
                onChange={(e) => setParkingCapacity(parseInt(e.target.value || '0', 10))}
                className="input-base text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="venue-address-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Address / Location
              </label>
              <input
                id="venue-address-input"
                aria-label="Venue Address and Location"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Hinjawadi Flyover, Pune"
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="venue-notes-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Notes / First Impressions
              </label>
              <input
                id="venue-notes-input"
                aria-label="Venue Notes and First Impressions"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Spacious lawn, grand entrance, generator backup available"
                className="input-base text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="venue-alcohol-allowed"
              className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
            >
              <input
                id="venue-alcohol-allowed"
                aria-label="Alcohol and Bar Setup Permitted with excise license"
                type="checkbox"
                checked={alcoholAllowed}
                onChange={(e) => setAlcoholAllowed(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              Alcohol / Bar Setup Permitted (with 1-day excise license)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Venue
            </button>
          </div>
        </form>
      )}

      {/* Record Site Visit Form Modal */}
      {showVisitForm && (
        <form
          onSubmit={handleCreateSiteVisit}
          className="card border-emerald-300 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-emerald-500" />
              Record In-Person Site Visit & Recce (स्थल दौरा व निरीक्षण)
            </h4>
            <button
              type="button"
              onClick={() => setShowVisitForm(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="visit-venue-select"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Property Visited
              </label>
              <select
                id="visit-venue-select"
                aria-label="Property Visited"
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="input-base text-xs"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="visit-date-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Date of Visit
              </label>
              <input
                id="visit-date-input"
                aria-label="Date of Site Visit"
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="input-base text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="visit-attendees-input"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Visitors / Family Members Present
              </label>
              <input
                id="visit-attendees-input"
                aria-label="Visitors and Family Members Present"
                type="text"
                required
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="e.g. Groom's Parents, Bride's Brother & Uncle"
                className="input-base text-xs"
              />
            </div>
          </div>

          {/* Inspection Checklist */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
              Physical Walkthrough Inspection Checklist
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <label
                htmlFor="visit-ac-working"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium cursor-pointer"
              >
                <input
                  id="visit-ac-working"
                  aria-label="Air Conditioning Tested and Effective"
                  type="checkbox"
                  checked={acWorking}
                  onChange={(e) => setAcWorking(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                Air Conditioning Tested & Effective
              </label>
              <label
                htmlFor="visit-bridal-room"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium cursor-pointer"
              >
                <input
                  id="visit-bridal-room"
                  aria-label="Bridal Rooms and Washrooms Clean"
                  type="checkbox"
                  checked={bridalRoomClean}
                  onChange={(e) => setBridalRoomClean(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                Bridal Rooms & Washrooms Clean
              </label>
              <label
                htmlFor="visit-sound-curfew"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium cursor-pointer"
              >
                <input
                  id="visit-sound-curfew"
                  aria-label="Music Curfew 23:00 Clarified"
                  type="checkbox"
                  checked={soundCurfewOk}
                  onChange={(e) => setSoundCurfewOk(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                Music Curfew (23:00) Clarified
              </label>
              <label
                htmlFor="visit-parking-adequate"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium cursor-pointer"
              >
                <input
                  id="visit-parking-adequate"
                  aria-label="Parking and Valet Access Confirmed"
                  type="checkbox"
                  checked={parkingAdequate}
                  onChange={(e) => setParkingAdequate(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                Parking & Valet Access Confirmed
              </label>
              <label
                htmlFor="visit-tasting-done"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium cursor-pointer"
              >
                <input
                  id="visit-tasting-done"
                  aria-label="Food Tasting and Kitchen Inspected"
                  type="checkbox"
                  checked={tastingDone}
                  onChange={(e) => setTastingDone(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                Food Tasting / Kitchen Inspected
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium">
                <label htmlFor="visit-rating-select" className="cursor-pointer">
                  Overall Rating:
                </label>
                <select
                  id="visit-rating-select"
                  aria-label="Overall Site Visit Rating"
                  value={visitRating}
                  onChange={(e) => setVisitRating(parseInt(e.target.value, 10))}
                  className="font-bold text-amber-500 border-none bg-transparent"
                >
                  <option value={5}>★★★★★ (5/5)</option>
                  <option value={4}>★★★★☆ (4/5)</option>
                  <option value={3}>★★★☆☆ (3/5)</option>
                  <option value={2}>★★☆☆☆ (2/5)</option>
                  <option value={1}>★☆☆☆☆ (1/5)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="visit-tasting-notes"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Food Tasting Notes (if applicable)
              </label>
              <textarea
                id="visit-tasting-notes"
                aria-label="Food Tasting Notes"
                rows={2}
                value={tastingNotes}
                onChange={(e) => setTastingNotes(e.target.value)}
                placeholder="e.g. Tried sample live chaat counters, paneer tikka, and dessert. Fresh and well-seasoned."
                className="input-base text-xs resize-none"
              />
            </div>
            <div>
              <label
                htmlFor="visit-meeting-notes"
                className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1"
              >
                Manager Meeting & Discussion Notes
              </label>
              <textarea
                id="visit-meeting-notes"
                aria-label="Manager Meeting and Discussion Notes"
                rows={2}
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="e.g. Spoke with manager Mr. Deshmukh. Agreed to 25% booking token, generator fuel included."
                className="input-base text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowVisitForm(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Site Visit Log
            </button>
          </div>
        </form>
      )}

      {/* SUBVIEW 1: Properties List */}
      {subView === 'properties' && (
        <div className="space-y-4">
          {venues.length === 0 ? (
            <div className="card text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-500 mx-auto flex items-center justify-center">
                <Icon name="building" className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                No Venues Shortlisted Yet
              </h5>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Add banquets, lawns, or hotel ballrooms to evaluate their capacity and curfew
                against your celebration needs.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="btn-primary text-xs"
              >
                + Shortlist First Venue
              </button>
            </div>
          ) : (
            venues.map((venue) => {
              const evalRes = evaluateVenue(venue, plan.guests);
              const isBooked = venue.status === 'booked';
              const isVisited =
                venue.status === 'visited' || siteVisits.some((v) => v.venueId === venue.id);

              return (
                <div
                  key={venue.id}
                  className={`card border transition space-y-3.5 ${
                    isBooked
                      ? 'border-emerald-500/80 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/20'
                      : isVisited
                        ? 'border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-stone-900'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                          {venue.name}
                        </h4>
                        <span className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {venue.type.replace('_', ' ')}
                        </span>
                        {isBooked && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            ✓ Booked Venue
                          </span>
                        )}
                        {isVisited && !isBooked && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Walkthrough Visited
                          </span>
                        )}
                      </div>
                      {venue.address && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          📍 {venue.address}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-stone-400 font-semibold block uppercase">
                          Rental + Deposit
                        </span>
                        <p className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {formatINR(venue.rentalCost)}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          +{formatINR(venue.cautionDeposit)} caution deposit
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVenueId(venue.id);
                            setShowVisitForm(true);
                          }}
                          className="btn-secondary text-xs"
                          title="Record Site Recce Visit"
                        >
                          + Log Visit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSetStatus(venue, isBooked ? 'shortlisted' : 'booked')
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            isBooked
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'border border-stone-300 dark:border-stone-700 hover:border-emerald-500 text-stone-700 dark:text-stone-200'
                          }`}
                        >
                          {isBooked ? '✓ Venue Locked' : 'Lock This Venue'}
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'deleteVenue', venueId: venue.id })}
                          className="p-1 rounded text-stone-400 hover:text-red-600"
                          title="Remove venue"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Status Banner */}
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                      evalRes.capacityStatus === 'optimal'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : evalRes.capacityStatus === 'cramped'
                          ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                    }`}
                  >
                    <Icon
                      name={evalRes.capacityStatus === 'optimal' ? 'check' : 'alert'}
                      className="w-4 h-4 shrink-0"
                    />
                    <span>{evalRes.capacityMessage}</span>
                  </div>

                  {/* Policy Pills & Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[10px] text-stone-400 block font-semibold">
                        Catering Policy
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize">
                        {venue.cateringPolicy.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[10px] text-stone-400 block font-semibold">
                        Music Curfew
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {venue.curfewTime}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[10px] text-stone-400 block font-semibold">
                        AC Green Rooms
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {venue.roomsIncluded} Rooms Included
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[10px] text-stone-400 block font-semibold">
                        Valet / Parking
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        ~{venue.parkingCapacity} Cars
                      </span>
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  {venue.notes && (
                    <p className="text-xs text-stone-500 italic bg-stone-50/50 dark:bg-stone-900/50 p-2.5 rounded-lg border border-stone-200/50 dark:border-stone-800">
                      Notes: {venue.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSetStatus(venue, isVisited ? 'shortlisted' : 'visited')
                        }
                        className={`btn-quiet text-xs ${isVisited ? 'text-indigo-600 font-bold' : ''}`}
                      >
                        {isVisited ? '✓ Walkthrough Completed' : 'Mark Visited'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyInquiry(venue)}
                      className="btn-secondary text-xs"
                    >
                      <Icon name="whatsapp" className="w-3.5 h-3.5 text-emerald-500" />
                      {copiedId === venue.id
                        ? 'WhatsApp Enquiry Copied!'
                        : 'Copy WhatsApp Enquiry for Venue'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBVIEW 2: Site Visits & Physical Walkthrough Log */}
      {subView === 'visits' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Venue Site Recce & Physical Walkthrough Logs (स्थल निरीक्षण)
                </h4>
                <p className="text-xs text-stone-500">
                  Track in-person property visits with family members. Check air conditioning, stage
                  height, acoustic sound curfew compliance, and food tastings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (venues.length > 0 && !selectedVenueId) setSelectedVenueId(venues[0]!.id);
                  setShowVisitForm(true);
                }}
                className="btn-primary text-xs"
              >
                + Log New Site Visit
              </button>
            </div>
          </div>

          {siteVisits.length === 0 ? (
            <div className="card text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                <Icon name="check" className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                No Site Visits Logged Yet
              </h5>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Schedule or record family visits to your shortlisted venues to compare air
                conditioning cooling, stage space, washroom hygiene, and live food tasting sessions.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (venues.length > 0 && !selectedVenueId) setSelectedVenueId(venues[0]!.id);
                  setShowVisitForm(true);
                }}
                className="btn-primary text-xs"
              >
                + Record First Site Visit
              </button>
            </div>
          ) : (
            siteVisits.map((visit) => (
              <div
                key={visit.id}
                className="card border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {visit.venueName}
                      </h4>
                      <span className="text-xs font-bold text-amber-500">
                        {'★'.repeat(visit.rating)}
                        {'☆'.repeat(5 - visit.rating)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {visit.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      📅 Date: {visit.visitDate} · 👥 Attendees: {visit.attendees}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'deleteSiteVisit', visitId: visit.id })}
                    className="p-1 rounded text-stone-400 hover:text-red-600"
                    title="Delete Visit Log"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>

                {/* Inspection Checklist Badges */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${visit.acWorking ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                  >
                    {visit.acWorking ? '✓ AC Tested & Cool' : '✕ AC Issue'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${visit.bridalRoomClean ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                  >
                    {visit.bridalRoomClean ? '✓ Bridal Rooms Clean' : '✕ Rooms Need Work'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${visit.soundCurfewOk ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                  >
                    {visit.soundCurfewOk ? '✓ 23:00 Curfew Clear' : '✕ Strict Curfew Risk'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${visit.parkingAdequate ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                  >
                    {visit.parkingAdequate ? '✓ Parking & Valet OK' : '✕ Limited Parking'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${visit.tastingDone ? 'bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                  >
                    {visit.tastingDone ? '✓ Food Tasting Done' : '○ Tasting Pending'}
                  </span>
                </div>

                {/* Tasting & Manager Notes */}
                {(visit.tastingNotes || visit.notes) && (
                  <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                    {visit.tastingNotes && (
                      <p className="text-stone-700 dark:text-stone-300">
                        <strong className="text-brand-600 dark:text-brand-400">
                          🍲 Food Tasting:
                        </strong>{' '}
                        {visit.tastingNotes}
                      </p>
                    )}
                    {visit.notes && (
                      <p className="text-stone-600 dark:text-stone-400">
                        <strong>📝 Walkthrough Notes:</strong> {visit.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
