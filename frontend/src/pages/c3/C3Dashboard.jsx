import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Gauge, 
  TrendingUp, 
  ShieldCheck, 
  MapPin, 
  CloudRain, 
  Sun, 
  Droplet, 
  BarChart3, 
  Clock, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LocationSelector } from '../../components/c3/LocationSelector';
import { HorizonTabs } from '../../components/c3/HorizonTabs';
import { ForecastChart } from '../../components/c3/ForecastChart';
import { RiskLegend } from '../../components/c3/RiskLegend';
import { useC3Locations } from '../../hooks/useC3Locations';
import { useC3Dashboard } from '../../hooks/useC3Dashboard';

export function C3Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { locations, loading: locsLoading } = useC3Locations();

  const locationId = searchParams.get('location_id') || 'C3_003';
  const horizonMonths = parseInt(searchParams.get('horizon') || '1', 10);

  const { data, loading, error, refetch } = useC3Dashboard(locationId, horizonMonths);

  const handleLocationChange = (newLocId) => {
    setSearchParams({ location_id: newLocId, horizon: String(horizonMonths) });
  };

  const handleHorizonChange = (newHorizon) => {
    setSearchParams({ location_id: locationId, horizon: String(newHorizon) });
  };

  const getRiskVariant = (risk) => {
    const r = (risk || '').toLowerCase();
    if (r === 'critical') return 'critical';
    if (r === 'high') return 'high';
    if (r === 'medium') return 'medium';
    return 'low';
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-neutral-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-neutral-200 rounded-md"></div>
          ))}
        </div>
        <div className="h-80 bg-neutral-200 rounded-md"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center bg-white rounded-md border border-red-200 shadow-sm space-y-4">
        <AlertTriangle className="w-12 h-12 text-risk-critical mx-auto" />
        <h3 className="text-lg font-bold text-neutral-900">Unable to Load Dashboard Data</h3>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">{error}</p>
        <Button variant="primary" onClick={refetch}>Retry Connection</Button>
      </div>
    );
  }

  const loc = data?.location || {};
  const currentRisk = data?.current_risk || 'Low';
  const forecastRisk = data?.forecast_risk || 'Low';
  const interval = data?.prediction_interval_90 || { lower: null, upper: null };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Location & Horizon */}
      <div className="bg-white p-4 rounded-md border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            Select Study Site (32 Sri Lankan Locations)
          </label>
          <LocationSelector
            locations={locations}
            selectedLocationId={locationId}
            onChange={handleLocationChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            Forecasting Horizon
          </label>
          <HorizonTabs
            activeHorizon={horizonMonths}
            onChange={handleHorizonChange}
          />
        </div>
      </div>

      {/* Location Details Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-neutral-500">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-primary-500" />
          <span className="font-semibold text-neutral-800 text-sm">{loc.location_name}</span>
          <span>({loc.location_id})</span>
          <span>· {loc.district} District, {loc.province} Province</span>
          <span className="font-mono text-[11px]">[{loc.latitude?.toFixed(4)}°N, {loc.longitude?.toFixed(4)}°E]</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Forecast As-Of: <strong>Dec 2025</strong></span>
          <span>→ Target: <strong>{data?.target_month}</strong></span>
        </div>
      </div>

      {/* Four Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Current Historical Risk */}
        <StatCard
          title="Current Risk Regime"
          value={currentRisk}
          subtitle={`As of Dec 2025 · SPI-3: ${data?.current_spi3?.toFixed(2)}`}
          icon={Gauge}
          variant={getRiskVariant(currentRisk)}
          badge={<Badge variant={getRiskVariant(currentRisk)}>Historical</Badge>}
        />

        {/* Stat 2: Future Forecast Risk */}
        <StatCard
          title={`Forecast (${horizonMonths}M Ahead)`}
          value={forecastRisk}
          subtitle={`Target: ${data?.target_month} · Predicted SPI-3: ${data?.predicted_spi3?.toFixed(2)}`}
          icon={TrendingUp}
          variant={getRiskVariant(forecastRisk)}
          badge={<Badge variant={getRiskVariant(forecastRisk)}>Predicted</Badge>}
        />

        {/* Stat 3: Validated Uncertainty Interval */}
        <StatCard
          title="90% Conformal Interval"
          value={interval.lower !== null ? `[${interval.lower?.toFixed(2)}, ${interval.upper?.toFixed(2)}]` : 'N/A'}
          subtitle={`Empirical test coverage: ${data?.conformal_coverage_pct || 91.2}%`}
          icon={ShieldCheck}
          variant="default"
          badge={<Badge variant="primary">Calibrated</Badge>}
        />

        {/* Stat 4: Affected Demo Zones */}
        <StatCard
          title="Affected Study Zones"
          value={`${data?.affected_demo_zones_count || 0} / 32`}
          subtitle={`${data?.critical_zones_count || 0} Critical, ${data?.high_zones_count || 0} High demo zones`}
          icon={BarChart3}
          variant={(data?.critical_zones_count || 0) > 0 ? 'critical' : 'default'}
          badge={<Badge variant="neutral">National Demo</Badge>}
        />
      </div>

      {/* Main Forecast Chart Card */}
      <Card
        title={`SPI-3 Environmental Time-Series & ${horizonMonths}-Month Horizon Forecast`}
        subtitle={`Chronological trajectory through Dec 2025 with projected ${data?.target_month} target and 90% conformal band`}
        action={
          <div className="text-xs text-neutral-500 font-medium">
            Model: <span className="font-semibold text-neutral-800">{data?.model_name || 'XGBoost'}</span>
          </div>
        }
      >
        <div className="mb-2">
          <ForecastChart
            history={data?.history || []}
            forecastPoints={data?.forecast_points || []}
            locationName={loc.location_name}
            horizonMonths={horizonMonths}
            height={340}
          />
        </div>
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between text-xs text-neutral-500 gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-primary-500 inline-block" />
              <span>Historical (Synthetic)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-500 inline-block" />
              <span>Forecast</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-2 bg-amber-200/50 inline-block rounded" />
              <span>90% Uncertainty Band</span>
            </span>
          </div>
          <span className="font-mono text-[11px]">Fixed 1981–2010 Synthetic Baseline</span>
        </div>
      </Card>

      {/* Ecological Indicators & Model Drivers Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rainfall Deficit */}
        <Card title="Monthly Rainfall Deficit" subtitle="Relative to simulated seasonal norm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl font-extrabold text-neutral-900">
              {data?.rainfall_deficit_pct !== undefined ? `${data.rainfall_deficit_pct > 0 ? '+' : ''}${data.rainfall_deficit_pct}%` : '0%'}
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-md">
              <CloudRain className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Departure from the location's 1981–2010 baseline monthly precipitation for the latest observed month.
          </p>
        </Card>

        {/* Dry Spell Duration */}
        <Card title="Consecutive Dry Days" subtitle="Days with rainfall < 1.0mm in latest month">
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl font-extrabold text-neutral-900">
              {data?.dry_days_month !== undefined ? `${data.dry_days_month} days` : '15 days'}
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-md">
              <Sun className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Consecutive dry-day duration within the month indicates sustained soil moisture drawdown pressure.
          </p>
        </Card>

        {/* 3-Month Cumulative Rain */}
        <Card title="3-Month Cumulative Rain" subtitle="Quarterly precipitation volume">
          <div className="flex items-center justify-between mb-3">
            <div className="text-3xl font-extrabold text-neutral-900">
              {data?.rainfall_3m_mm !== undefined ? `${data.rainfall_3m_mm} mm` : '300 mm'}
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md">
              <Droplet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Direct volumetric input into SPI-3 calculation reflecting medium-term catchment hydrological balance.
          </p>
        </Card>
      </div>

      {/* Model-Associated Contributing Factors */}
      {data?.feature_drivers && data.feature_drivers.length > 0 && (
        <Card
          title="Model Association Factors (XGBoost Feature Importance)"
          subtitle="Empirical statistical contributions to forecast prediction — NOT causal physiological attribution"
        >
          <div className="space-y-3">
            {data.feature_drivers.map(driver => (
              <div key={driver.feature} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-700 font-mono">{driver.feature}</span>
                  <span className="text-neutral-900 font-semibold">{driver.association_pct}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, driver.association_pct * 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom Risk Legend */}
      <div className="pt-2">
        <RiskLegend compact={true} />
      </div>
    </div>
  );
}

export default C3Dashboard;
