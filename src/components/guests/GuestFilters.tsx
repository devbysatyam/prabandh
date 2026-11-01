import { memo, type FC } from 'react';

interface GuestFiltersProps {
  search: string;
  sideFilter: string;
  rsvpFilter: string;
  onSearch: (value: string) => void;
  onSide: (value: string) => void;
  onRsvp: (value: string) => void;
}

/** Search box plus side / RSVP filter selects. */
export const GuestFilters: FC<GuestFiltersProps> = memo(
  ({ search, sideFilter, rsvpFilter, onSearch, onSide, onRsvp }) => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex-1 min-w-[200px]">
        <input
          id="guest-search-input"
          aria-label="Search guests by name or notes"
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search guests by name or notes..."
          className="input-base text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          id="guest-filter-side"
          aria-label="Filter guests by family side"
          value={sideFilter}
          onChange={(e) => onSide(e.target.value)}
          className="input-base text-xs w-32"
        >
          <option value="all">All Sides</option>
          <option value="bride">Bride Side</option>
          <option value="groom">Groom Side</option>
          <option value="mutual">Mutual</option>
          <option value="community">Community</option>
        </select>

        <select
          id="guest-filter-rsvp"
          aria-label="Filter guests by RSVP status"
          value={rsvpFilter}
          onChange={(e) => onRsvp(e.target.value)}
          className="input-base text-xs w-32"
        >
          <option value="all">All RSVPs</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </select>
      </div>
    </div>
  ),
);
GuestFilters.displayName = 'GuestFilters';
