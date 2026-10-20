import React from 'react';

export function Badge({ 
  children, 
  variant = 'neutral', // 'critical' | 'high' | 'medium' | 'low' | 'c1' | 'c2' | 'c3' | 'c4' | 'neutral' | 'primary'
  size = 'md', // 'sm' | 'md'
  className = '' 
}) {
  const variants = {
    critical: 'bg-red-100 text-risk-critical border-red-200',
    high: 'bg-orange-100 text-risk-high border-orange-200',
    medium: 'bg-amber-100 text-risk-medium border-amber-200',
    low: 'bg-emerald-100 text-risk-low border-emerald-200',
    primary: 'bg-primary-100 text-primary-600 border-primary-200',
    c1: 'bg-blue-100 text-blue-700 border-blue-200',
    c2: 'bg-green-100 text-green-700 border-green-200',
    c3: 'bg-amber-100 text-amber-700 border-amber-200',
    c4: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${variants[variant] || variants.neutral} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
