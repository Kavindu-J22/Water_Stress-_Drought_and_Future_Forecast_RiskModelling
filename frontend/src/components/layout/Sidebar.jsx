import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gauge, 
  Map as MapIcon, 
  TrendingUp, 
  Cpu, 
  BellRing, 
  FileText, 
  ShieldCheck, 
  X,
  ExternalLink
} from 'lucide-react';
import { useC3HostIntegration } from '../../context/C3HostIntegrationContext';

export function Sidebar({ isOpen, onClose }) {
  const { layoutMode } = useC3HostIntegration();

  if (layoutMode === 'host') {
    return null;
  }

  const c3NavItems = [
    { name: 'Overview', path: '/c3', icon: LayoutDashboard },
    { name: 'Risk Dashboard', path: '/c3/dashboard', icon: Gauge },
    { name: 'Geo Risk Map', path: '/c3/map', icon: MapIcon },
    { name: 'Future Forecast', path: '/c3/forecast', icon: TrendingUp },
    { name: 'Model Comparison', path: '/c3/models', icon: Cpu },
    { name: 'Alerts Center', path: '/c3/alerts', icon: BellRing },
    { name: 'Reports & Exports', path: '/c3/reports', icon: FileText },
  ];

  const integratedModules = [
    { name: 'C1: Yield & Market', code: 'C1', desc: 'National yield & pricing' },
    { name: 'C2: Crown Symptoms', code: 'C2', desc: 'Computer vision diagnostics' },
    { name: 'C4: Spatial Spread', code: 'C4', desc: 'Cellular disease vectors' },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between py-4">
      <div className="space-y-6">
        {/* Mobile Header with Close */}
        <div className="md:hidden px-4 flex items-center justify-between pb-3 border-b border-neutral-200">
          <span className="font-bold text-sm text-neutral-800">C3 Navigation</span>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-neutral-900 touch-target">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* C3 Module Navigation */}
        <div className="px-3">
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
            Component 03: Drought & Water
          </span>
          <nav className="space-y-1">
            {c3NavItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/c3'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-l-[3px] border-primary-500 bg-primary-50 text-primary-600 font-semibold rounded-l-none'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border-l-[3px] border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Integrated Modules (Disabled in Standalone Mode) */}
        <div className="px-3 pt-2">
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
            Integrated Platform
          </span>
          <div className="space-y-1">
            {integratedModules.map(mod => (
              <div
                key={mod.code}
                className="px-3 py-2 rounded-md bg-neutral-50/60 border border-dashed border-neutral-200 text-neutral-400 text-xs flex items-center justify-between cursor-not-allowed select-none"
                title="Integration hook available. Disabled in standalone C3 prototype."
              >
                <div>
                  <span className="font-semibold block text-neutral-500">{mod.name}</span>
                  <span className="text-[10px] text-neutral-400">{mod.desc}</span>
                </div>
                <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-200/70 text-neutral-500 font-mono">
                  STANDALONE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provenance Badge */}
      <div className="px-4 pt-4 border-t border-neutral-200">
        <div className="p-2.5 bg-neutral-100 rounded text-[11px] text-neutral-600 leading-snug">
          <div className="flex items-center space-x-1 font-semibold text-neutral-800 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
            <span>Synthetic Demonstration</span>
          </div>
          <span>Trained ML Pipeline · Dec 2025 Synthetic Horizon</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Static 240px) */}
      <aside className="hidden md:block fixed top-16 bottom-0 left-0 w-[240px] bg-white border-r border-neutral-200 overflow-y-auto z-30">
        {content}
      </aside>

      {/* Mobile Slide-over Drawer with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative w-[260px] max-w-[80%] bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
