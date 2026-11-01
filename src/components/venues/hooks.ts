import { useCallback, useState } from 'react';
import type { VenueDetail } from '../../schemas';
import { VENUE_FORM_DEFAULTS, VISIT_FORM_DEFAULTS } from './constants';
import type { VenueFormState, VisitFormState } from './helpers';

/** Generic form-state hook returning the state and a keyed field setter. */
function useFormState<T extends object>(initial: T) {
  const [form, setForm] = useState<T>(initial);
  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );
  return { form, setField };
}

/** State for the "Add Venue" form. */
export function useVenueForm(defaultAddress: string) {
  return useFormState<VenueFormState>({
    name: '',
    type: VENUE_FORM_DEFAULTS.type,
    capacityMin: VENUE_FORM_DEFAULTS.capacityMin,
    capacityMax: VENUE_FORM_DEFAULTS.capacityMax,
    rentalCost: VENUE_FORM_DEFAULTS.rentalCost,
    cateringPolicy: VENUE_FORM_DEFAULTS.cateringPolicy,
    alcoholAllowed: false,
    parkingCapacity: VENUE_FORM_DEFAULTS.parkingCapacity,
    roomsIncluded: VENUE_FORM_DEFAULTS.roomsIncluded,
    curfewTime: VENUE_FORM_DEFAULTS.curfewTime,
    cautionDeposit: VENUE_FORM_DEFAULTS.cautionDeposit,
    address: defaultAddress,
    notes: '',
  });
}

/** State for the "Record Site Visit" form. */
export function useVisitForm(venues: readonly VenueDetail[]) {
  return useFormState<VisitFormState>({
    venueId: venues[0]?.id ?? '',
    visitDate: new Date().toISOString().slice(0, 10),
    attendees: VISIT_FORM_DEFAULTS.attendees,
    rating: VISIT_FORM_DEFAULTS.rating,
    acWorking: true,
    bridalRoomClean: true,
    soundCurfewOk: true,
    parkingAdequate: true,
    tastingDone: false,
    tastingNotes: '',
    notes: '',
  });
}
