import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, ShieldAlert, Droplets, User } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useC3HostIntegration } from '../../context/C3HostIntegrationContext';

export function Header({ onToggleMobileMenu, isMobileMenuOpen, activeAlertCount = 0 }) {
  const location = useLocation();
  const { layoutMode } = useC3HostIntegration();

  // If host layout mode, the host renders its own header
  if (layoutMode === 'host') {
    return null;
  }

  const navItems = [
    { name: 'Home', path: '/', disabled: false },
    { name: 'C1: Yield & Market', path: '#', disabled: true, tag: 'Module' },
    { name: 'C2: Crown Symptoms', path: '#', disabled: true, tag: 'Module' },
    { name: 'C3: Drought & Water Stress', path: '/c3/dashboard', disabled: false, active: true },
    { name: 'C4: Spatial Spread', path: '#', disabled: true, tag: 'Module' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 h-14 md:h-16 px-4 sm:px-6 lg:px-8 transition-all">
      <div className="h-full flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 touch-target focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/c3/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-primary-500 flex items-center justify-center text-white shadow-sm">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg tracking-tight text-neutral-900">
                Coconut<span className="text-primary-500">Risk</span> AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded border border-amber-200">
                Component 03
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map(item => (
            item.disabled ? (
              <span
                key={item.name}
                className="px-3 py-1.5 text-xs font-medium text-neutral-400 cursor-not-allowed flex items-center space-x-1"
                title="Integrated platform module — available when C1/C2/C4 are mounted"
              >
                <span>{item.name}</span>
                <span className="text-[9px] bg-neutral-100 text-neutral-400 px-1 py-0.5 rounded">Disabled</span>
              </span>
            ) : (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  item.active
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {item.name}
              </Link>
            )
          ))}
        </nav>

        {/* Right Actions: Alert Bell + Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            to="/c3/alerts"
            className="relative p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 touch-target transition-colors"
            title="Active Drought Alerts"
          >
            <Bell className="w-5 h-5" />
            {activeAlertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-risk-critical text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {activeAlertCount > 9 ? '9+' : activeAlertCount}
              </span>
            )}
          </Link>

          <div className="h-6 w-px bg-neutral-200 hidden sm:block" />

          <div className="flex items-center space-x-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-semibold text-xs border border-neutral-300">
              <User className="w-4 h-4 text-neutral-600" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-neutral-800 block leading-tight">ML Researcher</span>
              <span className="text-[10px] text-neutral-500 block leading-tight">Simulation Mode</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
