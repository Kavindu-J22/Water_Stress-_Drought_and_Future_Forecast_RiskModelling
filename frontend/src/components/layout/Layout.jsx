import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useC3HostIntegration } from '../../context/C3HostIntegrationContext';

export function Layout() {
  const { layoutMode, activeAlertCount } = useC3HostIntegration();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (layoutMode === 'host') {
    // In host mode, render only C3 content without duplicate wrapper
    return (
      <div className="c3-module-host-container w-full min-h-screen">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header 
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        isMobileMenuOpen={isMobileMenuOpen}
        activeAlertCount={activeAlertCount}
      />
      
      <div className="flex-1 flex">
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
        
        <main className="flex-1 md:ml-[240px] px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default Layout;
