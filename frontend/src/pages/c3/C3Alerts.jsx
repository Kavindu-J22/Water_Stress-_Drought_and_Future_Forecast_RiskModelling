import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  Check, 
  Settings, 
  Filter, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  X,
  Sliders
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import c3Api from '../../services/c3Api';

export function C3Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL' | 'Critical' | 'High' | 'Medium'
  const [dismissingId, setDismissingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [thresholds, setThresholds] = useState({
    critical: -1.5,
    high: -1.0,
    medium: -0.5
  });

  const loadAlerts = () => {
    setLoading(true);
    c3Api.getAlerts('active')
      .then(res => {
        setAlerts(res || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load alerts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleDismiss = async (alertId, locationId) => {
    setDismissingId(alertId);
    try {
      const res = await c3Api.dismissAlert(alertId, locationId);
      setToastMessage(res.message);
      // Remove from active list
      setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
    } catch (err) {
      setToastMessage('Failed to dismiss alert: ' + err.message);
    } finally {
      setDismissingId(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await c3Api.saveAlertSettings({
        critical_threshold_spi: thresholds.critical,
        high_threshold_spi: thresholds.high,
        medium_threshold_spi: thresholds.medium
      });
      setToastMessage(res.message || 'Alert thresholds successfully updated.');
      setIsSettingsOpen(false);
    } catch (err) {
      setToastMessage('Failed to save settings: ' + err.message);
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const counts = {
    critical: alerts.filter(a => a.severity === 'Critical').length,
    high: alerts.filter(a => a.severity === 'High').length,
    medium: alerts.filter(a => a.severity === 'Medium').length,
  };

  const getSeverityBadge = (sev) => {
    const s = sev.toLowerCase();
    if (s === 'critical') return <Badge variant="critical">Critical</Badge>;
    if (s === 'high') return <Badge variant="high">High</Badge>;
    return <Badge variant="medium">Medium</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-md shadow-xl text-xs flex items-center space-x-2 border border-neutral-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-md border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-primary-500" />
            <span>Drought Risk Alert Center</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Threshold-generated simulated drought warnings across study sites.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            icon={Sliders}
          >
            Configure Thresholds
          </Button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterSeverity('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all touch-target ${
            filterSeverity === 'ALL'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          All Active Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setFilterSeverity('Critical')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all touch-target ${
            filterSeverity === 'Critical'
              ? 'bg-risk-critical text-white shadow-sm'
              : 'bg-white text-risk-critical hover:bg-red-50 border border-red-200'
          }`}
        >
          Critical ({counts.critical})
        </button>
        <button
          onClick={() => setFilterSeverity('High')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all touch-target ${
            filterSeverity === 'High'
              ? 'bg-risk-high text-white shadow-sm'
              : 'bg-white text-risk-high hover:bg-orange-50 border border-orange-200'
          }`}
        >
          High ({counts.high})
        </button>
        <button
          onClick={() => setFilterSeverity('Medium')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all touch-target ${
            filterSeverity === 'Medium'
              ? 'bg-risk-medium text-white shadow-sm'
              : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          Medium ({counts.medium})
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500 bg-white rounded-md border border-neutral-200">
            Checking threshold triggers...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-md border border-neutral-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-neutral-800">No Active Alerts in this Category</h3>
            <p className="text-xs text-neutral-500">
              All demo sites currently meet simulated baseline conditions.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.alert_id}
              className={`p-4 rounded-md border shadow-card bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                alert.severity === 'Critical' ? 'border-l-4 border-l-risk-critical' :
                alert.severity === 'High' ? 'border-l-4 border-l-risk-high' :
                'border-l-4 border-l-risk-medium'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(alert.severity)}
                  <span className="font-mono text-xs font-bold text-neutral-900">{alert.alert_id}</span>
                  <span className="text-neutral-400">·</span>
                  <span className="text-xs text-neutral-500">Target Month: <strong>{alert.target_month}</strong></span>
                </div>
                <h4 className="font-bold text-sm text-neutral-900">
                  {alert.location_name} ({alert.location_id}) — {alert.district} District
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {alert.message}
                </p>
                <div className="text-[11px] text-neutral-400 flex items-center space-x-3 pt-1">
                  <span>Issued: Dec 2025 (Synthetic)</span>
                  <span>Predicted SPI-3: <strong className="text-neutral-700">{alert.predicted_spi3}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <a
                  href={`/c3/dashboard?location_id=${alert.location_id}`}
                  className="px-3 py-2 text-xs font-semibold rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 touch-target"
                >
                  View Trends
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  loading={dismissingId === alert.alert_id}
                  onClick={() => handleDismiss(alert.alert_id, alert.location_id)}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Dismiss
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Threshold Configuration Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl border border-neutral-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-bold text-base text-neutral-900">Configure Alert Thresholds</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Critical Risk Threshold (SPI-3)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.critical}
                  onChange={(e) => setThresholds({ ...thresholds, critical: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-neutral-300 rounded focus:ring-primary-500 font-mono"
                />
                <span className="text-[10px] text-neutral-500">Default: ≤ -1.5</span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  High Risk Threshold (SPI-3)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.high}
                  onChange={(e) => setThresholds({ ...thresholds, high: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-neutral-300 rounded focus:ring-primary-500 font-mono"
                />
                <span className="text-[10px] text-neutral-500">Default: ≤ -1.0</span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Medium Risk Threshold (SPI-3)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.medium}
                  onChange={(e) => setThresholds({ ...thresholds, medium: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-neutral-300 rounded focus:ring-primary-500 font-mono"
                />
                <span className="text-[10px] text-neutral-500">Default: ≤ -0.5</span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Thresholds
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default C3Alerts;
