import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers, 
  MapPin, 
  Info, 
  AlertTriangle, 
  X, 
  CloudRain, 
  Thermometer, 
  Droplet, 
  Gauge 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HorizonTabs } from '../../components/c3/HorizonTabs';
import { RiskLegend } from '../../components/c3/RiskLegend';
import c3Api from '../../services/c3Api';

// Component to handle map size invalidation on resize/render
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

export function C3RiskMap() {
  const [horizonMonths, setHorizonMonths] = useState(1);
  const [layer, setLayer] = useState('risk'); // 'risk' | 'rainfall' | 'temperature'
  const [geoData, setGeoData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const geoJsonRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    c3Api.getRiskMap(horizonMonths, layer)
      .then(res => {
        setGeoData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load risk map data:', err);
        setLoading(false);
      });
  }, [horizonMonths, layer]);

  const getFeatureColor = (feature) => {
    const props = feature.properties || {};
    if (layer === 'risk') {
      const risk = (props.risk_category || 'Low').toLowerCase();
      if (risk === 'critical') return '#DC2626';
      if (risk === 'high') return '#EA580C';
      if (risk === 'medium') return '#F59E0B';
      return '#16A34A';
    } else if (layer === 'rainfall') {
      const rain = props.rainfall_monthly_mm || 100;
      if (rain < 50) return '#EF4444';
      if (rain < 100) return '#F59E0B';
      if (rain < 150) return '#3B82F6';
      return '#1D4ED8';
    } else {
      // temperature
      const temp = props.temperature_c || 27;
      if (temp > 29) return '#DC2626';
      if (temp > 27.5) return '#EA580C';
      if (temp > 26) return '#F59E0B';
      return '#10B981';
    }
  };

  const styleFeature = (feature) => {
    const isSelected = selectedFeature && selectedFeature.properties.location_id === feature.properties.location_id;
    return {
      fillColor: getFeatureColor(feature),
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? '#111827' : '#FFFFFF',
      fillOpacity: isSelected ? 0.85 : 0.65
    };
  };

  const onEachFeature = (feature, leafletLayer) => {
    leafletLayer.on({
      click: () => {
        setSelectedFeature(feature);
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.9, weight: 2.5 });
      },
      mouseout: (e) => {
        if (!selectedFeature || selectedFeature.properties.location_id !== feature.properties.location_id) {
          leafletLayer.setStyle(styleFeature(feature));
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Explicit Grid Disclaimer */}
      <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-2.5 rounded-md flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-risk-critical flex-shrink-0" />
          <span className="font-semibold">
            ILLUSTRATIVE GRID — NOT VERIFIED COCONUT PLANTATIONS.
          </span>
          <span className="hidden sm:inline text-red-700">
            0.1° squares are centered near reference towns to demonstrate spatial ML pipelines.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded">
          RESEARCH SIMULATION
        </span>
      </div>

      {/* Map Controls Card */}
      <div className="bg-white p-4 rounded-md border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Horizon Switcher */}
        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            Forecast Horizon
          </label>
          <HorizonTabs activeHorizon={horizonMonths} onChange={setHorizonMonths} />
        </div>

        {/* Layer Switcher */}
        <div>
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
            Active Data Layer
          </label>
          <div className="inline-flex p-1 bg-neutral-100 rounded-md border border-neutral-200 text-xs font-semibold">
            <button
              onClick={() => setLayer('risk')}
              className={`px-3 py-1.5 rounded transition-all touch-target ${
                layer === 'risk' ? 'bg-primary-500 text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Drought Risk (SPI-3)
            </button>
            <button
              onClick={() => setLayer('rainfall')}
              className={`px-3 py-1.5 rounded transition-all touch-target ${
                layer === 'rainfall' ? 'bg-primary-500 text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Rainfall (mm)
            </button>
            <button
              onClick={() => setLayer('temperature')}
              className={`px-3 py-1.5 rounded transition-all touch-target ${
                layer === 'temperature' ? 'bg-primary-500 text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Temperature (°C)
            </button>
          </div>
        </div>
      </div>

      {/* Map + Detail Panel Container */}
      <div className="relative rounded-md border border-neutral-200 bg-white shadow-card overflow-hidden">
        {/* Leaflet Map */}
        <div className="w-full h-[320px] sm:h-[460px] lg:h-[580px] relative z-0">
          <MapContainer
            center={[7.8731, 80.7718]}
            zoom={7.2}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapResizeHandler />
            {geoData && (
              <GeoJSON
                key={`${horizonMonths}-${layer}-${geoData.features.length}`}
                data={geoData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        </div>

        {/* Desktop Side Detail Drawer / Mobile Bottom Sheet */}
        {selectedFeature && (
          <div className="absolute right-3 top-3 bottom-3 w-80 max-w-[90%] bg-white/95 backdrop-blur-md rounded-md border border-neutral-300 shadow-2xl p-4 z-20 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-2 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Selected Demo Grid
                  </span>
                  <h3 className="font-bold text-base text-neutral-900">
                    {selectedFeature.properties.location_name}
                  </h3>
                  <span className="text-xs text-neutral-500">
                    {selectedFeature.properties.district} District · {selectedFeature.properties.province}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-900 rounded touch-target"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Forecast Indicators */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                  <span className="font-semibold text-neutral-700">Forecast Risk ({horizonMonths}M):</span>
                  <Badge variant={(selectedFeature.properties.risk_category || 'Low').toLowerCase()}>
                    {selectedFeature.properties.risk_category || 'Low'}
                  </Badge>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                  <span className="text-neutral-600">Predicted SPI-3:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {selectedFeature.properties.predicted_spi3 !== null ? selectedFeature.properties.predicted_spi3?.toFixed(2) : 'N/A'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                  <span className="text-neutral-600">90% Conformal Band:</span>
                  <span className="font-mono text-neutral-800">
                    {selectedFeature.properties.prediction_interval_90?.lower !== undefined
                      ? `[${selectedFeature.properties.prediction_interval_90.lower}, ${selectedFeature.properties.prediction_interval_90.upper}]`
                      : 'N/A'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                  <span className="text-neutral-600">Monthly Rainfall:</span>
                  <span className="font-semibold text-neutral-800">
                    {selectedFeature.properties.rainfall_monthly_mm?.toFixed(1)} mm
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                  <span className="text-neutral-600">Surface Temp:</span>
                  <span className="font-semibold text-neutral-800">
                    {selectedFeature.properties.temperature_c?.toFixed(1)} °C
                  </span>
                </div>

                <div className="p-2.5 rounded bg-neutral-50 flex items-center justify-between">
                  <span className="text-neutral-600">Soil Moisture:</span>
                  <span className="font-semibold text-neutral-800">
                    {selectedFeature.properties.soil_moisture_m3m3?.toFixed(3)} m³/m³
                  </span>
                </div>
              </div>

              {/* Caveat Notice */}
              <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800">
                <strong>Illustrative square:</strong> Centered at [{selectedFeature.properties.latitude?.toFixed(4)}, {selectedFeature.properties.longitude?.toFixed(4)}]. Does not delineate certified estate land.
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <a
                href={`/c3/dashboard?location_id=${selectedFeature.properties.location_id}&horizon=${horizonMonths}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-md shadow-sm touch-target"
              >
                Open in Full Dashboard
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="bg-white p-3 rounded-md border border-neutral-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <RiskLegend compact={true} />
        <span className="text-neutral-400 font-mono text-[11px]">
          Target: {geoData?.target_month || '2026-01'} · 32 Illustrative Demo Zones
        </span>
      </div>
    </div>
  );
}

export default C3RiskMap;
