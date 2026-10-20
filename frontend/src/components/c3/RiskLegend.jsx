import React from 'react';

export function RiskLegend({ compact = false, className = '' }) {
  const levels = [
    { name: 'Critical', color: '#DC2626', bg: 'bg-red-100', text: 'text-risk-critical', range: 'SPI-3 ≤ -1.5', desc: 'Severe meteorological drought deficit' },
    { name: 'High', color: '#EA580C', bg: 'bg-orange-100', text: 'text-risk-high', range: '-1.5 < SPI-3 ≤ -1.0', desc: 'Moderate sustained precipitation deficit' },
    { name: 'Medium', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-risk-medium', range: '-1.0 < SPI-3 ≤ -0.5', desc: 'Mild deficit / incipient dry trend' },
    { name: 'Low', color: '#16A34A', bg: 'bg-emerald-100', text: 'text-risk-low', range: 'SPI-3 > -0.5', desc: 'Normal to wet moisture regime' },
  ];

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
        <span className="text-neutral-500 font-medium mr-1">Risk Scale:</span>
        {levels.map(l => (
          <span key={l.name} className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-white border border-neutral-200">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="font-semibold text-neutral-800">{l.name}</span>
            <span className="text-neutral-400 text-[10px]">({l.range})</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {levels.map(l => (
        <div key={l.name} className="p-3 rounded-md border border-neutral-200 bg-white shadow-card flex items-start space-x-3">
          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: l.color }} />
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-sm text-neutral-900">{l.name}</span>
              <span className="text-xs font-mono text-neutral-500">{l.range}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{l.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RiskLegend;
