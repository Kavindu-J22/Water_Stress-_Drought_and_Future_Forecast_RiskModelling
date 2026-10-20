import React from 'react';
import { ShieldAlert, Droplets, ExternalLink, Terminal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Platform */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">CoconutRisk AI</span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Component 03: Water Stress, Drought and Future Forecast Risk Modelling. Operational ML pipeline evaluating environmental drought indicators across Sri Lankan study sites.
            </p>
            <div className="text-[11px] text-neutral-500">
              Research Prototype · Release 2026.10
            </div>
          </div>

          {/* Col 2: Scientific Scope */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Scientific Boundary</h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              C3 models <strong>meteorological/environmental drought risk (SPI-3)</strong> based exclusively on environmental time series. It does not measure direct individual tree physiological water stress, diagnose imagery, or infer disease vectors.
            </p>
          </div>

          {/* Col 3: Synthetic Data Provenance */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Simulation Provenance</h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Accompanying 1981–2025 dataset is <strong>100% SYNTHETIC SIMULATION</strong>. Demo grid squares are illustrative 0.1° boxes near towns, NOT verified coconut plantation boundaries. Never use for operational agricultural advisories.
            </p>
          </div>

          {/* Col 4: Platform Integrations */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Platform Architecture</h4>
            <ul className="space-y-1.5 text-neutral-400">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Node.js 20+ Express Gateway (Port 8000)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Python FastAPI ML Service (Port 8001)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                <span>PyTorch (LSTM, GRU, TCN) & XGBoost</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Conformal Prediction Intervals (90%)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-neutral-500 text-[11px] gap-2">
          <div>
            © 2026 CoconutRisk AI Project — Component 03 Production Research Prototype.
          </div>
          <div className="flex items-center space-x-4">
            <a href="/api/v1/c3/health" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
              API Health
            </a>
            <a href="http://localhost:8001/docs" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
              OpenAPI Docs
            </a>
            <span className="text-neutral-600">|</span>
            <span>Simulated / Historical Demo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
