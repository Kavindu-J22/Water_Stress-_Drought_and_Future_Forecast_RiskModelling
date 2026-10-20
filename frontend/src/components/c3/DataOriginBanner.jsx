import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export function DataOriginBanner({ className = '' }) {
  return (
    <div className={`bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-r-md text-amber-900 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <p className="font-semibold text-amber-950">
            100% SYNTHETIC RESEARCH DATA — NOT OBSERVED WEATHER OR VALIDATED CROP STRESS
          </p>
          <p className="text-amber-800 mt-0.5">
            Observations up to <strong>Dec 2025 (Historical Demo)</strong>. Future forecasts are generated from environmental time-series simulation. Illustrative 0.1° demo grid squares are centered near towns and do not reflect verified coconut plantation boundaries.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DataOriginBanner;
