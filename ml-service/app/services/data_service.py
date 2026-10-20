"""Data loading and caching service for CoconutRisk AI Component 03.
Provides high-performance access to simulated environmental datasets and geojson grids.
"""
import os
import json
import gzip
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional

class DataService:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or self._find_data_dir()
        self._load_locations()
        self._load_monthly_history()
        self._load_geojson()

    def _find_data_dir(self) -> Path:
        candidates = [
            Path(__file__).resolve().parents[3] / 'research-data',
            Path(__file__).resolve().parents[2] / 'research-data',
            Path('research-data'),
            Path('../research-data'),
            Path('C3_Final_Dataset'),
            Path('../C3_Final_Dataset')
        ]
        for c in candidates:
            if (c / 'dataset' / 'locations_demo.csv').exists():
                return c
        raise FileNotFoundError("Could not find research-data directory")

    def _load_locations(self):
        loc_path = self.data_dir / 'dataset' / 'locations_demo.csv'
        self.locations_df = pd.read_csv(loc_path)
        self.locations_dict = {
            row['location_id']: row.to_dict() 
            for _, row in self.locations_df.iterrows()
        }
        self.id_to_idx = {
            loc_id: idx for idx, loc_id in enumerate(sorted(self.locations_dict.keys()))
        }

    def _load_monthly_history(self):
        hist_path = self.data_dir / 'dataset' / 'monthly_reference_1981_2025.csv'
        self.history_df = pd.read_csv(hist_path)
        # Pre-sort for fast lookups
        self.history_df = self.history_df.sort_values(['location_id', 'forecast_issue_month']).reset_index(drop=True)
        self.as_of_month = self.history_df['forecast_issue_month'].max()

    def _load_geojson(self):
        geo_path = self.data_dir / 'dataset' / 'coconut_grid.geojson'
        with open(geo_path, 'r', encoding='utf-8') as f:
            self.geojson_grid = json.load(f)

    def get_locations(self) -> List[Dict[str, Any]]:
        return self.locations_df.to_dict(orient='records')

    def get_location_by_id(self, location_id: str) -> Optional[Dict[str, Any]]:
        return self.locations_dict.get(location_id)

    def get_history(self, location_id: str, from_month: Optional[str] = None, to_month: Optional[str] = None) -> List[Dict[str, Any]]:
        df = self.history_df[self.history_df['location_id'] == location_id]
        if from_month:
            df = df[df['forecast_issue_month'] >= from_month]
        if to_month:
            df = df[df['forecast_issue_month'] <= to_month]
        return df.to_dict(orient='records')

    def get_latest_monthly_record(self, location_id: str, issue_month: Optional[str] = None) -> Optional[Dict[str, Any]]:
        target_month = issue_month or self.as_of_month
        df = self.history_df[
            (self.history_df['location_id'] == location_id) & 
            (self.history_df['forecast_issue_month'] == target_month)
        ]
        if df.empty:
            return None
        return df.iloc[0].to_dict()

    def get_recent_history_slice(self, location_id: str, count: int = 24) -> List[Dict[str, Any]]:
        df = self.history_df[self.history_df['location_id'] == location_id]
        return df.tail(count).to_dict(orient='records')

    def get_geojson(self) -> Dict[str, Any]:
        return self.geojson_grid

# Singleton instance
data_service = DataService()
