import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Thermometer, 
  CloudRain, 
  Gauge, 
  Map as MapIcon, 
  Cpu, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RiskLegend } from '../../components/c3/RiskLegend';
import c3Api from '../../services/c3Api';

export function C3Overview() {
  const [health, setHealth] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      c3Api.getHealth().catch(() => null),
      c3Api.getOverview('C3_003').catch(() => null) // Kurunegala demo site
    ]).then(([h, ov]) => {
      setHealth(h);
      setOverviewData(ov);
      setLoading(false);
    });
  }, []);

  const indicators = [
    {
      title: 'Meteorological Drought (SPI-3)',
      value: overviewData ? overviewData.spi_3.toFixed(2) : '-0.35',
      desc: 'Standardized 3-month precipitation anomaly relative to 1981–2010 synthetic baseline',
      icon: Gauge,
      badge: overviewData?.current_risk || 'Low',
      badgeVariant: (overviewData?.current_risk || 'Low').toLowerCase()
    },
    {
      title: 'Monthly Rainfall',
      value: overviewData ? `${overviewData.rainfall_monthly_mm} mm` : '131.3 mm',
      desc: 'Accumulated monthly precipitation across simulated study grid cell',
      icon: CloudRain,
      badge: 'Synthetic',
      badgeVariant: 'neutral'
    },
    {
      title: 'Surface Temperature',
      value: overviewData ? `${overviewData.temperature_c} °C` : '27.9 °C',
      desc: 'Mean monthly ambient temperature driving simulated vapor pressure deficit',
      icon: Thermometer,
      badge: 'Simulated',
      badgeVariant: 'neutral'
    },
    {
      title: 'Soil Moisture Proxy',
      value: overviewData ? `${overviewData.soil_moisture_m3m3.toFixed(3)} m³/m³` : '0.446 m³/m³',
      desc: 'Topsoil volumetric water content proxy parameter',
      icon: Droplets,
      badge: 'Proxy',
      badgeVariant: 'neutral'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-700 rounded-lg p-6 sm:p-8 lg:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm border border-white/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>CoconutRisk AI — Research Platform Component 03</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Water Stress, Drought & Future Forecast Risk Modelling
          </h1>

          <p className="text-sm sm:text-base text-primary-100 leading-relaxed max-w-2xl">
            Multi-horizon environmental drought risk forecasting (1, 3, and 6 months ahead) using chronological machine learning and PyTorch deep sequence models over 32 representative Sri Lankan study locations.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/c3/dashboard">
              <button
                type="button"
                className="inline-flex items-center justify-center font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 shadow-md hover:shadow-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 cursor-pointer"
              >
                <span>Launch Risk Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </Link>
            <Link to="/c3/map">
              <button
                type="button"
                className="inline-flex items-center justify-center font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 bg-emerald-900/80 hover:bg-emerald-900 text-white border border-emerald-300/40 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 cursor-pointer backdrop-blur-sm"
              >
                <MapIcon className="w-4 h-4 mr-2" />
                <span>Explore Geo Risk Map</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Droplets className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* 4 Ecological Indicators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Key Environmental Drought Indicators (As of Dec 2025)
          </h2>
          <span className="text-xs text-neutral-500">Representative Site: Kurunegala (C3_003)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indicators.map(ind => {
            const Icon = ind.icon;
            return (
              <Card key={ind.title} className="hover:border-primary-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2.5 rounded-md bg-primary-50 text-primary-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant={ind.badgeVariant}>{ind.badge}</Badge>
                </div>
                <div className="text-2xl font-bold text-neutral-900 mt-2">{ind.value}</div>
                <div className="text-xs font-semibold text-neutral-700 mt-0.5">{ind.title}</div>
                <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">{ind.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Risk Categorization Scheme */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Standardized Drought Risk Categories (Derived from SPI-3)
          </h2>
          <span className="text-xs text-neutral-500 font-mono">Gamma 1981–2010 Baseline</span>
        </div>
        <RiskLegend />
      </div>

      {/* Pipeline & Operational Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Active ML Pipeline" subtitle="Trained model checkpoints">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Model Algorithms</span>
              <span className="font-semibold text-neutral-900">XGBoost, RF, LSTM, GRU, TCN</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Forecasting Horizons</span>
              <span className="font-semibold text-neutral-900">1M, 3M, 6M ahead</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Uncertainty Calibration</span>
              <span className="font-semibold text-neutral-900">Split Conformal (90% nominal)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-600">Status</span>
              <span className="inline-flex items-center text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Models Ready
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <Link to="/c3/models" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center">
              <span>View Benchmark Metrics</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </Card>

        <Card title="Simulated Study Grid" subtitle="Illustrative geographic sites">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Total Demo Sites</span>
              <span className="font-semibold text-neutral-900">32 Sri Lankan Locations</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Spatial Resolution</span>
              <span className="font-semibold text-neutral-900">0.1° Illustrative Squares</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Climatic Zones</span>
              <span className="font-semibold text-neutral-900">Dry, Intermediate, Wet (SW/NE)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-600">Ground Truth Caveat</span>
              <span className="text-amber-700 font-medium">Non-surveyed bounds</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <Link to="/c3/map" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center">
              <span>Inspect Grid on Map</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </Card>

        <Card title="Research Integrity" subtitle="Validation & operational disclaimer">
          <div className="text-xs text-neutral-600 space-y-2 leading-relaxed">
            <p>
              Component 03 predicts <strong>meteorological drought indices</strong> to assist risk planning. It does NOT diagnose tree symptoms (C2), map disease (C4), or estimate coconut crop exports (C1).
            </p>
            <p className="text-neutral-500">
              All time series and results are derived from reproducible simulations. This prototype does not substitute for verified Sri Lankan Department of Meteorology bulletins.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <Link to="/c3/reports" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center">
              <span>Generate Audit Reports</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default C3Overview;
