"""Model Registry Service for CoconutRisk AI Component 03.
Catalogs versioned model artifacts, loads weights and preprocessors,
and provides metadata, hyperparameters, and conformal quantiles.
"""
import os
import json
import joblib
import torch
from pathlib import Path
from typing import Dict, List, Any, Optional

class ModelRegistry:
    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or self._find_models_dir()
        self._load_registry()

    def _find_models_dir(self) -> Path:
        candidates = [
            Path(__file__).resolve().parents[2] / 'saved_models',
            Path('ml-service/saved_models'),
            Path('saved_models'),
            Path('../saved_models')
        ]
        for c in candidates:
            if c.exists():
                return c
        out = Path('saved_models')
        out.mkdir(parents=True, exist_ok=True)
        return out

    def _load_registry(self):
        metrics_file = self.models_dir / 'model_metrics.json'
        if metrics_file.exists():
            try:
                with open(metrics_file, 'r', encoding='utf-8') as f:
                    self.metrics_data = json.load(f)
            except Exception:
                self.metrics_data = None
        else:
            self.metrics_data = None

        self._cached_preprocessors = {}
        self._cached_models = {}

    def reload(self):
        self._load_registry()

    def is_ready(self) -> bool:
        return self.metrics_data is not None and len(self.metrics_data.get('models', [])) > 0

    def get_models(self) -> List[Dict[str, Any]]:
        if not self.metrics_data:
            return []
        return self.metrics_data.get('models', [])

    def get_best_models_per_horizon(self) -> Dict[str, Any]:
        if not self.metrics_data:
            return {}
        return self.metrics_data.get('best_models_per_horizon', {})

    def get_ablation_study(self) -> List[Dict[str, Any]]:
        if not self.metrics_data:
            return []
        return self.metrics_data.get('ablation_study', [])

    def get_model_details(self, model_id: str) -> Optional[Dict[str, Any]]:
        models = self.get_models()
        for m in models:
            if m.get('model_id') == model_id:
                return m
        return None

    def get_preprocessor(self, horizon: int) -> Optional[Dict[str, Any]]:
        if horizon not in self._cached_preprocessors:
            prep_file = self.models_dir / f'preprocessor_h{horizon}.joblib'
            if prep_file.exists():
                self._cached_preprocessors[horizon] = joblib.load(prep_file)
            else:
                return None
        return self._cached_preprocessors[horizon]

    def get_classical_model(self, model_type: str, horizon: int):
        key = f'{model_type}_h{horizon}'
        if key not in self._cached_models:
            model_file = self.models_dir / f'{model_type}_h{horizon}.joblib'
            if model_file.exists():
                self._cached_models[key] = joblib.load(model_file)
            else:
                return None
        return self._cached_models[key]

# Singleton instance
model_registry = ModelRegistry()
