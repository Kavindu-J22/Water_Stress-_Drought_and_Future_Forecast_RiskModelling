import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';

export function ForecastChart({ 
  history = [], 
  forecastPoints = [], 
  locationName = 'Kurunegala',
  horizonMonths = 1,
  height = 340 
}) {
  // Merge history and forecast into unified chart points
  const chartData = [];

  // Add historical points
  history.forEach(h => {
    chartData.push({
      month: h.month,
      actual_spi3: h.spi_3,
      predicted_spi3: null,
      interval: null,
      interval_lower: null,
      interval_upper: null,
      risk_category: h.risk_category,
      is_forecast: false
    });
  });

  // Connect last historical to forecast
  if (forecastPoints && forecastPoints.length > 0) {
    forecastPoints.forEach(f => {
      // If point exists, update it with forecast connection
      const existing = chartData.find(d => d.month === f.month);
      if (existing) {
        existing.predicted_spi3 = f.predicted_spi3;
        existing.interval_lower = f.lower_90;
        existing.interval_upper = f.upper_90;
        existing.interval = [f.lower_90, f.upper_90];
      } else {
        chartData.push({
          month: f.month,
          actual_spi3: null,
          predicted_spi3: f.predicted_spi3,
          interval_lower: f.lower_90,
          interval_upper: f.upper_90,
          interval: [f.lower_90, f.upper_90],
          risk_category: f.risk_category,
          is_forecast: true
        });
      }
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const pt = chartData.find(d => d.month === label);
    return (
      <div className="bg-neutral-900/95 text-white p-3 rounded shadow-lg text-xs border border-neutral-700 min-w-[170px]">
        <div className="font-bold border-b border-neutral-700 pb-1 mb-1.5 flex justify-between">
          <span>{label}</span>
          <span className="text-neutral-400">{pt?.is_forecast ? 'Forecast Target' : 'Historical Record'}</span>
        </div>
        {pt?.actual_spi3 !== null && pt?.actual_spi3 !== undefined && (
          <div className="flex justify-between py-0.5">
            <span className="text-emerald-400">Actual SPI-3:</span>
            <span className="font-mono font-semibold">{pt.actual_spi3.toFixed(2)}</span>
          </div>
        )}
        {pt?.predicted_spi3 !== null && pt?.predicted_spi3 !== undefined && (
          <div className="flex justify-between py-0.5">
            <span className="text-amber-400">Forecast SPI-3:</span>
            <span className="font-mono font-semibold">{pt.predicted_spi3.toFixed(2)}</span>
          </div>
        )}
        {pt?.interval_lower !== null && pt?.interval_lower !== undefined && (
          <div className="flex justify-between py-0.5 text-neutral-300">
            <span>90% Conformal Band:</span>
            <span className="font-mono">[{pt.interval_lower.toFixed(2)}, {pt.interval_upper.toFixed(2)}]</span>
          </div>
        )}
        {pt?.risk_category && (
          <div className="mt-1 pt-1 border-t border-neutral-800 flex justify-between">
            <span className="text-neutral-400">Risk Level:</span>
            <span className={`font-semibold ${
              pt.risk_category === 'Critical' ? 'text-red-400' :
              pt.risk_category === 'High' ? 'text-orange-400' :
              pt.risk_category === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
            }`}>{pt.risk_category}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 11, fill: '#6B7280' }} 
            tickMargin={8} 
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[-3.0, 2.5]} 
            ticks={[-3.0, -2.0, -1.5, -1.0, -0.5, 0.0, 1.0, 2.0]}
            tick={{ fontSize: 11, fill: '#6B7280' }} 
            unit=""
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Risk Threshold Reference Lines */}
          <ReferenceLine y={-1.5} stroke="#DC2626" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Critical (-1.5)', fill: '#DC2626', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={-1.0} stroke="#EA580C" strokeDasharray="4 4" strokeWidth={1.2} label={{ value: 'High (-1.0)', fill: '#EA580C', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={-0.5} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Medium (-0.5)', fill: '#F59E0B', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={0.0} stroke="#9CA3AF" strokeWidth={1} />
          
          {/* Conformal Uncertainty Area Band */}
          <Area
            type="monotone"
            dataKey="interval"
            stroke="none"
            fill="#FDE68A"
            fillOpacity={0.4}
            name="90% Conformal Prediction Band"
          />

          {/* Actual SPI-3 History */}
          <Line
            type="monotone"
            dataKey="actual_spi3"
            stroke="#2E7D32"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: '#2E7D32' }}
            activeDot={{ r: 5 }}
            name="Observed SPI-3 (Synthetic)"
          />

          {/* Forecast Future SPI-3 */}
          <Line
            type="monotone"
            dataKey="predicted_spi3"
            stroke="#F59E0B"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#F59E0B' }}
            activeDot={{ r: 6 }}
            name={`Forecast SPI-3 (${horizonMonths}M Ahead)`}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ForecastChart;
