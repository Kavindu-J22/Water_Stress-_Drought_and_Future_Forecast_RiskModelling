import React, { createContext, useContext, useState, useEffect } from 'react';

const C3HostIntegrationContext = createContext({
  layoutMode: 'standalone', // 'standalone' | 'host'
  apiBase: '/api/v1/c3',
  hostNav: null,
  user: null,
  activeAlertCount: 0,
  refreshAlertCount: () => {}
});

export function C3HostIntegrationProvider({ 
  children, 
  layoutMode = 'standalone', 
  apiBase = '/api/v1/c3', 
  hostNav = null, 
  user = null 
}) {
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  return (
    <C3HostIntegrationContext.Provider value={{
      layoutMode,
      apiBase,
      hostNav,
      user,
      activeAlertCount,
      setActiveAlertCount
    }}>
      {children}
    </C3HostIntegrationContext.Provider>
  );
}

export function useC3HostIntegration() {
  return useContext(C3HostIntegrationContext);
}
