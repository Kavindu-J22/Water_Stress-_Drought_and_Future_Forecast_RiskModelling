# Integration Guide: Mounting Component 03 into Host Platform (C1/C2/C4)

Component 03 is architected with dual-mode operational compatibility:
1. **Standalone Mode:** Operates independently with its own Navigation, Header, Sidebar, and Footer.
2. **Host Mode:** Plugs directly into the CoconutRisk AI parent host platform without namespace collisions or double-rendering of layout elements.

---

## 1. Frontend Host Integration

Component 03 exports `C3ModuleRoutes` from `src/App.jsx`.

### Usage in Host Router (React Router v6)

```jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HostLayout } from './components/HostLayout';
import { C3ModuleRoutes } from 'coconutrisk-c3-frontend'; // Or relative import

export function HostApp() {
  return (
    <Routes>
      <Route path="/" element={<HostLayout />}>
        {/* Host Home / C1 / C2 */}
        <Route path="c1/*" element={<C1ModuleRoutes />} />
        <Route path="c2/*" element={<C2ModuleRoutes />} />

        {/* Mount C3 cleanly under /c3/* in host mode */}
        <Route 
          path="c3/*" 
          element={
            <C3ModuleRoutes 
              layoutMode="host" 
              apiBase="/api/v1/c3" 
            />
          } 
        />

        <Route path="c4/*" element={<C4ModuleRoutes />} />
      </Route>
    </Routes>
  );
}
```

### Layout Mode Behavior
- When `layoutMode === 'host'`, C3 disables its own `Header`, `Sidebar`, and `Footer`, rendering only its page content (`C3Dashboard`, `C3RiskMap`, etc.) within the host's `<Outlet />`.
- All URL parameters and sub-routes (`/c3/dashboard`, `/c3/map`, `/c3/forecast`, `/c3/models`, `/c3/alerts`, `/c3/reports`) remain fully functional.

---

## 2. Backend Express Gateway Integration

Component 03 exports `registerC3Routes(expressApp, options)` from `api/src/app.js`.

### Usage in Host Express Server

```javascript
const express = require('express');
const { registerC3Routes } = require('./c3-api/src/app');

const hostApp = express();

// Mount C3 API endpoints under /api/v1/c3 with optional host auth middleware
registerC3Routes(hostApp, {
  prefix: '/api/v1/c3',
  authMiddleware: myHostJwtAuthMiddleware // Optional
});
```

### Namespace Isolation
- All C3 endpoints are strictly prefixed under `/api/v1/c3/*`.
- C3 routes will never collide with `/api/v1/c1/*`, `/api/v1/c2/*`, or `/api/v1/c4/*`.

---

## 3. Event Contract for Inter-Module Communication

When downstream modules (such as C1 yield forecasting or C4 spatial disease risk) subscribe to C3 drought risk forecasts, C3 emits standardized event payloads:

```typescript
interface C3DroughtForecastEvent {
  type: 'C3_DROUGHT_FORECAST_UPDATED';
  location_id: string;        // e.g. "C3_003"
  location_name: string;      // e.g. "Kurunegala"
  issue_month: string;        // "YYYY-MM", e.g. "2025-12"
  target_month: string;       // "YYYY-MM", e.g. "2026-01"
  horizon_months: 1 | 3 | 6;
  predicted_spi3: number;     // e.g. -0.45
  risk_category: 'Low' | 'Medium' | 'High' | 'Critical';
  prediction_interval_90: {
    lower: number;
    upper: number;
  };
  model_id: string;           // e.g. "xgboost_h1"
  is_synthetic: true;
  data_origin: 'SYNTHETIC_SIMULATION';
  disclaimer: string;
}
```

> **IMPORTANT:** Inter-module consumers must not infer direct palm physiological disease causality without supervisor-approved multimodal research design.
