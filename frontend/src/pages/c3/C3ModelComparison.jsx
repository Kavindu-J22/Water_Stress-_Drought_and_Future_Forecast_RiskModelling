import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  BarChart2, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import c3Api from '../../services/c3Api';

export function C3ModelComparison() {
  const [modelData, setModelData] = useState(null);
  const [selectedHorizon, setSelectedHorizon] = useState('ALL'); // 'ALL' | 1 | 3 | 6
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    c3Api.getModels()
      .then(res => {
        setModelData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load model registry:', err);
        setLoading(false);
      });
  }, []);

  const models = modelData?.models || [];
  const ablation = modelData?.ablation_study || [];

  const filteredModels = models.filter(m => {
    if (selectedHorizon === 'ALL') return true;
    return m.horizon_months === Number(selectedHorizon);
  });

  // Prepare chart comparison data (Horizons 1, 3, 6 for key algorithms)
  const chartAlgorithms = ['Persistence', 'SARIMAX', 'Random Forest', 'XGBoost', 'LSTM', 'GRU', 'TCN'];
  const chartData = [1, 3, 6].map(h => {
    const entry = { horizon: `H${h}M` };
    chartAlgorithms.forEach(algo => {
      const found = models.find(m => m.horizon_months === h && (m.model_name === algo || m.algorithm.includes(algo)));
      entry[algo] = found ? Number(found.mae.toFixed(3)) : null;
    });
    return entry;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-md border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-primary-500" />
            <span>Model Benchmarks & Empirical Evaluation</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Empirical held-out test evaluations (2023–2025) comparing Baselines, Classical ML, SARIMAX, and Deep Learning.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-neutral-500">Filter Horizon:</span>
          <div className="inline-flex p-1 bg-neutral-100 rounded-md border border-neutral-200 text-xs font-semibold">
            {['ALL', '1', '3', '6'].map(h => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-3 py-1 rounded transition-all touch-target ${
                  selectedHorizon === h 
                    ? 'bg-primary-500 text-white shadow-sm' 
                    : 'text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {h === 'ALL' ? 'All Horizons' : `${h}M`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Best Model Summary Cards */}
      {modelData?.best_models_per_horizon && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 3, 6].map(h => {
            const best = modelData.best_models_per_horizon[String(h)];
            if (!best) return null;
            return (
              <div key={h} className="p-4 rounded-md border border-primary-200 bg-primary-50/40 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-2 py-0.5 rounded">
                    Top Model · Horizon {h}M
                  </span>
                  <Sparkles className="w-4 h-4 text-primary-500" />
                </div>
                <h3 className="font-bold text-base text-neutral-900">{best.model_name}</h3>
                <span className="text-xs text-neutral-500 block mb-2">{best.algorithm}</span>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-primary-200/60 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase">MAE</span>
                    <span className="font-bold text-sm text-neutral-900">{best.mae}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase">RMSE</span>
                    <span className="font-bold text-sm text-neutral-900">{best.rmse}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase">90% Cov</span>
                    <span className="font-bold text-sm text-primary-600">{best.empirical_test_coverage_pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MAE Visual Bar Chart Comparison */}
      <Card
        title="Test Set Error Comparison (MAE by Model & Horizon)"
        subtitle="Lower is better. Assesses generalization error on untouched 2023–2025 simulated test partition (N=1,152 per horizon)"
      >
        <div className="w-full h-[320px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="horizon" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} />
              <YAxis domain={[0, 1.3]} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
              <Bar dataKey="Persistence" fill="#9CA3AF" />
              <Bar dataKey="SARIMAX" fill="#6B7280" />
              <Bar dataKey="Random Forest" fill="#3B82F6" />
              <Bar dataKey="XGBoost" fill="#1B5E20" />
              <Bar dataKey="LSTM" fill="#4CAF50" />
              <Bar dataKey="GRU" fill="#81C784" />
              <Bar dataKey="TCN" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Complete Models Benchmark Table */}
      <Card title="Held-Out Model Evaluation Matrix" subtitle="Detailed performance breakdown across all evaluated architectures">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Horizon</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Algorithm</th>
                <th className="py-3 px-3 text-right">MAE</th>
                <th className="py-3 px-3 text-right">RMSE</th>
                <th className="py-3 px-3 text-right">Drought Recall</th>
                <th className="py-3 px-3 text-right">Macro F1</th>
                <th className="py-3 px-3 text-right">90% Coverage</th>
                <th className="py-3 px-3 text-right">Train Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-medium">
              {filteredModels.map((m, idx) => (
                <tr key={`${m.model_id}-${idx}`} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded font-mono">
                      H{m.horizon_months}M
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-neutral-900">
                    {m.model_name}
                    {m.is_baseline && (
                      <span className="ml-1.5 text-[9px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded">
                        Baseline
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-500 max-w-xs truncate" title={m.algorithm}>
                    {m.algorithm}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                    {m.mae.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {m.rmse.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {m.drought_recall !== null && m.drought_recall !== undefined ? m.drought_recall.toFixed(2) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {m.macro_f1 !== null && m.macro_f1 !== undefined ? m.macro_f1.toFixed(2) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-primary-600">
                    {m.empirical_test_coverage_pct !== null && m.empirical_test_coverage_pct !== undefined ? `${m.empirical_test_coverage_pct}%` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-400">
                    {m.training_time_seconds !== undefined ? `${m.training_time_seconds}s` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Feature Ablation Analysis Card */}
      <Card
        title="Feature Ablation Study (Horizon 1M)"
        subtitle="Honest sensitivity experiment testing feature groups. Note degradation when removing engineered rainfall lags."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Experiment</th>
                <th className="py-2.5 px-3 text-center">Feature Count</th>
                <th className="py-2.5 px-3 text-right">Test MAE</th>
                <th className="py-2.5 px-3 text-right">Test RMSE</th>
                <th className="py-2.5 px-3 text-right">Macro F1</th>
                <th className="py-2.5 px-3 text-right">Conformal 90% Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-medium">
              {ablation.map((a, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="py-2.5 px-3 font-semibold text-neutral-800">{a.experiment}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-neutral-500">{a.features_count}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">{a.mae.toFixed(4)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">{a.rmse.toFixed(4)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">{a.macro_f1.toFixed(4)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-primary-600">{a.conformal_coverage_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default C3ModelComparison;
