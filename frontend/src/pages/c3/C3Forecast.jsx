import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Download, 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Clock,
  ExternalLink 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HorizonTabs } from '../../components/c3/HorizonTabs';
import { RiskLegend } from '../../components/c3/RiskLegend';
import c3Api from '../../services/c3Api';

export function C3Forecast() {
  const [horizonMonths, setHorizonMonths] = useState(1);
  const [forecasts, setForecasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    setLoading(true);
    c3Api.getAllForecasts(horizonMonths)
      .then(res => {
        setForecasts(res.forecasts || []);
        setMeta(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load forecasts:', err);
        setLoading(false);
      });
  }, [horizonMonths]);

  const filteredForecasts = forecasts.filter(f => {
    const matchesSearch = 
      f.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRiskVariant = (risk) => {
    const r = (risk || '').toLowerCase();
    if (r === 'critical') return 'critical';
    if (r === 'high') return 'high';
    if (r === 'medium') return 'medium';
    return 'low';
  };

  const handleDownloadCSV = () => {
    const url = c3Api.getExportForecastUrl(horizonMonths);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-md border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            <span>National Drought Risk Forecasts</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Trained model inference across all 32 representative Sri Lankan study locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <HorizonTabs activeHorizon={horizonMonths} onChange={setHorizonMonths} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            icon={Download}
            className="text-neutral-700"
          >
            Export Forecast CSV
          </Button>
        </div>
      </div>

      {/* Model & Target Info Banner */}
      <div className="bg-primary-50 border border-primary-200 p-4 rounded-md flex flex-wrap items-center justify-between gap-4 text-xs text-primary-950">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-primary-700 font-medium block">Issue Baseline:</span>
            <span className="font-bold text-sm">Dec 2025</span>
          </div>
          <div className="h-8 w-px bg-primary-200" />
          <div>
            <span className="text-primary-700 font-medium block">Forecast Target:</span>
            <span className="font-bold text-sm text-primary-600">{meta?.target_month || '2026-01'}</span>
          </div>
          <div className="h-8 w-px bg-primary-200" />
          <div>
            <span className="text-primary-700 font-medium block">Primary Regressor:</span>
            <span className="font-bold text-sm">{meta?.model_name || 'XGBoost Regressor'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-primary-800">
          <ShieldCheck className="w-4 h-4 text-primary-500" />
          <span>Calibrated Split Conformal Intervals (90% Nominal)</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-md border border-neutral-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search location or ID (e.g. Kurunegala, C3_003)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-neutral-500">
          Showing <strong>{filteredForecasts.length}</strong> of <strong>{forecasts.length}</strong> locations
        </div>
      </div>

      {/* Forecast Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Issue Month</th>
                <th className="py-3 px-4">Target Month</th>
                <th className="py-3 px-4">Predicted SPI-3</th>
                <th className="py-3 px-4">Risk Category</th>
                <th className="py-3 px-4">90% Prediction Interval</th>
                <th className="py-3 px-4">Model ID</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-500">
                    Loading trained model forecasts...
                  </td>
                </tr>
              ) : filteredForecasts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-neutral-500">
                    No locations match "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredForecasts.map(f => (
                  <tr key={f.location_id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{f.location_name}</div>
                      <span className="text-[11px] text-neutral-500">{f.location_id}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono">{f.issue_month}</td>
                    <td className="py-3 px-4 font-bold text-neutral-900 font-mono">{f.target_month}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-neutral-900">
                      {f.predicted_spi3 !== null ? f.predicted_spi3.toFixed(2) : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getRiskVariant(f.risk_category)}>
                        {f.risk_category || 'Pending'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      [{f.prediction_interval_90?.lower?.toFixed(2)}, {f.prediction_interval_90?.upper?.toFixed(2)}]
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                      {f.model_id || 'xgboost'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/c3/dashboard?location_id=${f.location_id}&horizon=${horizonMonths}`}
                        className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center text-xs"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Disclaimer and Legend */}
      <div className="bg-white p-4 rounded-md border border-neutral-200 shadow-sm space-y-3">
        <RiskLegend compact={true} />
        <div className="text-[11px] text-neutral-500 border-t border-neutral-100 pt-2">
          <strong>Note:</strong> A 6M horizon returns a 6-month-ahead single target (e.g. Jun 2026), not an autoregressive cumulative monthly trajectory. Predictions represent meteorological drought probability indicators derived from simulated environmental time series.
        </div>
      </div>
    </div>
  );
}

export default C3Forecast;
