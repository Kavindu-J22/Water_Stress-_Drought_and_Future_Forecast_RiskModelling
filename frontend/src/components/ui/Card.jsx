import React from 'react';

export function Card({ children, className = '', title, subtitle, action, footer }) {
  return (
    <div className={`bg-white rounded-md border border-neutral-200 shadow-card hover:shadow-card-hover transition-shadow overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-neutral-900 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 text-xs text-neutral-500">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
