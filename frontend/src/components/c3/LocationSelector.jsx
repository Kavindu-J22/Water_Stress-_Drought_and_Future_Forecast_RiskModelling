import React from 'react';
import { MapPin } from 'lucide-react';

export function LocationSelector({ 
  locations = [], 
  selectedLocationId = 'C3_001', 
  onChange,
  className = ''
}) {
  // Group locations by Province
  const grouped = locations.reduce((acc, loc) => {
    const prov = loc.province || 'Other';
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(loc);
    return acc;
  }, {});

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 pointer-events-none text-neutral-500">
        <MapPin className="w-4 h-4" />
      </div>
      <select
        value={selectedLocationId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2.5 bg-white border border-neutral-300 rounded-md text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm appearance-none cursor-pointer"
      >
        {Object.entries(grouped).map(([province, locList]) => (
          <optgroup key={province} label={`${province} Province`}>
            {locList.map(l => (
              <option key={l.location_id} value={l.location_id}>
                {l.location_name} ({l.location_id}) — {l.district}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="absolute right-3 pointer-events-none text-neutral-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export default LocationSelector;
