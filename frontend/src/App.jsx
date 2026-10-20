import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { C3HostIntegrationProvider } from './context/C3HostIntegrationContext';
import Layout from './components/layout/Layout';

// C3 Pages
import C3Overview from './pages/c3/C3Overview';
import C3Dashboard from './pages/c3/C3Dashboard';
import C3RiskMap from './pages/c3/C3RiskMap';
import C3Forecast from './pages/c3/C3Forecast';
import C3ModelComparison from './pages/c3/C3ModelComparison';
import C3Alerts from './pages/c3/C3Alerts';
import C3Reports from './pages/c3/C3Reports';

/**
 * C1/C2/C4 Integration Export:
 * Allows the host platform to mount C3 directly into its Router v6 routes.
 */
export function C3ModuleRoutes({ 
  layoutMode = 'host', 
  apiBase = '/api/v1/c3', 
  hostNav = null, 
  user = null 
}) {
  return (
    <C3HostIntegrationProvider layoutMode={layoutMode} apiBase={apiBase} hostNav={hostNav} user={user}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<C3Overview />} />
          <Route path="dashboard" element={<C3Dashboard />} />
          <Route path="map" element={<C3RiskMap />} />
          <Route path="forecast" element={<C3Forecast />} />
          <Route path="models" element={<C3ModelComparison />} />
          <Route path="alerts" element={<C3Alerts />} />
          <Route path="reports" element={<C3Reports />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </C3HostIntegrationProvider>
  );
}

/**
 * Standalone Application Router:
 * Default root for running Component 03 independently.
 */
export function App() {
  return (
    <C3HostIntegrationProvider layoutMode="standalone">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/c3/dashboard" replace />} />
        </Route>

        <Route path="/c3" element={<Layout />}>
          <Route index element={<C3Overview />} />
          <Route path="dashboard" element={<C3Dashboard />} />
          <Route path="map" element={<C3RiskMap />} />
          <Route path="forecast" element={<C3Forecast />} />
          <Route path="models" element={<C3ModelComparison />} />
          <Route path="alerts" element={<C3Alerts />} />
          <Route path="reports" element={<C3Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/c3/dashboard" replace />} />
      </Routes>
    </C3HostIntegrationProvider>
  );
}

export default App;
