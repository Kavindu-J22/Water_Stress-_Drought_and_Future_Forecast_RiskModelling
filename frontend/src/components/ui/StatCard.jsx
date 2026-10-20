import React from 'react';

export function StatCard({ 
  title, 
  value, 
  unit = '', 
  subtitle, 
  icon: Icon, 
  trend, // { value: string, direction: 'up' | 'down' | 'neutral', label: string }
  badge,
  variant = 'default', // 'default' | 'critical' | 'high' | 'medium' | 'low'
  className = ''
}) {
  const variantStyles = {
    default: 'border-neutral-200 bg-white text-neutral-900',
    critical: 'border-red-200 bg-red-50/50 text-red-950',
    high: 'border-orange-200 bg-orange-50/50 text-orange-950',
    medium: 'border-amber-200 bg-amber-50/50 text-amber-950',
    low: 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
  };

  const iconColors = {
    default: 'bg-neutral-100 text-neutral-700',
    critical: 'bg-red-100 text-risk-critical',
    high: 'bg-orange-100 text-risk-high',
    medium: 'bg-amber-100 text-risk-medium',
    low: 'bg-emerald-100 text-risk-low'
  };

  return (
    <div className={`p-4 sm:p-5 rounded-md border shadow-card transition-all ${variantStyles[variant]} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</span>
            {unit && <span className="text-sm font-medium text-neutral-500">{unit}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          {Icon && (
            <div className={`p-2.5 rounded-md ${iconColors[variant]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          {badge && <div>{badge}</div>}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={`font-medium ${
              trend.direction === 'up' ? 'text-risk-critical' : 
              trend.direction === 'down' ? 'text-risk-low' : 'text-neutral-500'
            }`}>
              {trend.value} {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
