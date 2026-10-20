import React from 'react';

export function HorizonTabs({ activeHorizon = 1, onChange, className = '' }) {
  const horizons = [
    { value: 1, label: '1-Month Ahead', shortLabel: '1M', targetDesc: 'Jan 2026' },
    { value: 3, label: '3-Month Ahead', shortLabel: '3M', targetDesc: 'Mar 2026' },
    { value: 6, label: '6-Month Ahead', shortLabel: '6M', targetDesc: 'Jun 2026' },
  ];

  return (
    <div className={`inline-flex p-1 bg-neutral-200/70 rounded-md border border-neutral-300/50 ${className}`}>
      {horizons.map(h => {
        const isActive = activeHorizon === h.value;
        return (
          <button
            key={h.value}
            onClick={() => onChange(h.value)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded transition-all touch-target select-none ${
              isActive 
                ? 'bg-primary-500 text-white shadow-sm' 
                : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <span className="hidden sm:inline">{h.label}</span>
            <span className="sm:hidden">{h.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export default HorizonTabs;
