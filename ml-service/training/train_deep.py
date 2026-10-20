"""PyTorch Deep Learning Sequence Models: LSTM, GRU, and Temporal Convolutional Network (TCN).
Strict chronological sequences (lookback=12 months).
Early stopping on VALIDATION set; evaluated once on untouched TEST set.
"""
import sys
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from training.prepare import get_data_dir, get_saved_models_dir, prepare_sequence_data
from training.make_intervals import compute_conformal_quantile, evaluate_interval_coverage
from training.train_baselines import evaluate_predictions, RISK_CATEGORIES

# Set deterministic seed
torch.manual_seed(20261020)
np.random.seed(20261020)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class LSTMForecaster(nn.Module):
    def __init__(self, num_features=16, num_locations=32, loc_dim=8, hidden_dim=64, num_layers=2):
        super().__init__()
        self.loc_embed = nn.Embedding(num_locations, loc_dim)
        self.input_proj = nn.Linear(num_features + loc_dim, hidden_dim)
        self.lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0.0
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 1)
        )

    def forward(self, x, loc_idx):
        # x: (batch, seq_len, num_features)
        # loc_idx: (batch,)
        batch_size, seq_len, _ = x.shape
        loc_emb = self.loc_embed(loc_idx)  # (batch, loc_dim)
        loc_emb_expanded = loc_emb.unsqueeze(1).expand(-1, seq_len, -1)  # (batch, seq_len, loc_dim)
        
        combined = torch.cat([x, loc_emb_expanded], dim=-1)
        proj = torch.relu(self.input_proj(combined))
        out, _ = self.lstm(proj)
        last_step = out[:, -1, :]  # (batch, hidden_dim)
        pred = self.head(last_step)
        return pred.squeeze(-1)

class GRUForecaster(nn.Module):
    def __init__(self, num_features=16, num_locations=32, loc_dim=8, hidden_dim=64, num_layers=2):
        super().__init__()
        self.loc_embed = nn.Embedding(num_locations, loc_dim)
        self.input_proj = nn.Linear(num_features + loc_dim, hidden_dim)
        self.gru = nn.GRU(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0.0
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 1)
        )

    def forward(self, x, loc_idx):
        batch_size, seq_len, _ = x.shape
        loc_emb = self.loc_embed(loc_idx)
        loc_emb_expanded = loc_emb.unsqueeze(1).expand(-1, seq_len, -1)
        
        combined = torch.cat([x, loc_emb_expanded], dim=-1)
        proj = torch.relu(self.input_proj(combined))
        out, _ = self.gru(proj)
        last_step = out[:, -1, :]
        pred = self.head(last_step)
        return pred.squeeze(-1)

class ChausalConv1dBlock(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, dilation):
        super().__init__()
        self.padding = (kernel_size - 1) * dilation
        self.conv1 = nn.Conv1d(in_channels, out_channels, kernel_size, padding=self.padding, dilation=dilation)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(0.2)
        self.conv2 = nn.Conv1d(out_channels, out_channels, kernel_size, padding=self.padding, dilation=dilation)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(0.2)
        self.res = nn.Conv1d(in_channels, out_channels, 1) if in_channels != out_channels else nn.Identity()

    def forward(self, x):
        # x: (batch, channels, seq_len)
        res = self.res(x)
        out = self.conv1(x)
        if self.padding > 0:
            out = out[:, :, :-self.padding]  # causal crop
        out = self.dropout1(self.relu1(out))
        out = self.conv2(out)
        if self.padding > 0:
            out = out[:, :, :-self.padding]  # causal crop
        out = self.dropout2(self.relu2(out))
        return out + res

class TCNForecaster(nn.Module):
    def __init__(self, num_features=16, num_locations=32, loc_dim=8, num_channels=48):
        super().__init__()
        self.loc_embed = nn.Embedding(num_locations, loc_dim)
        in_dim = num_features + loc_dim
        self.block1 = ChausalConv1dBlock(in_dim, num_channels, kernel_size=3, dilation=1)
        self.block2 = ChausalConv1dBlock(num_channels, num_channels, kernel_size=3, dilation=2)
        self.block3 = ChausalConv1dBlock(num_channels, num_channels, kernel_size=3, dilation=4)
        self.head = nn.Sequential(
            nn.Linear(num_channels, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 1)
        )

    def forward(self, x, loc_idx):
        batch_size, seq_len, _ = x.shape
        loc_emb = self.loc_embed(loc_idx)
        loc_emb_expanded = loc_emb.unsqueeze(1).expand(-1, seq_len, -1)
        
        combined = torch.cat([x, loc_emb_expanded], dim=-1)
        # transpose to (batch, channels, seq_len) for Conv1d
        inp = combined.transpose(1, 2)
        out = self.block1(inp)
        out = self.block2(out)
        out = self.block3(out)
        last_step = out[:, :, -1]  # (batch, num_channels)
        pred = self.head(last_step)
        return pred.squeeze(-1)

def train_and_eval_pytorch_model(
    model: nn.Module,
    model_name: str,
    horizon: int,
    data: dict,
    saved_models_dir: Path,
    epochs: int = 15,
    batch_size: int = 64,
    lr: float = 1e-3
):
    model = model.to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    criterion = nn.MSELoss()
    
    # DataLoaders
    train_dataset = TensorDataset(
        torch.tensor(data['X_train']),
        torch.tensor(data['loc_train']),
        torch.tensor(data['y_train'])
    )
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    X_val = torch.tensor(data['X_val']).to(device)
    loc_val = torch.tensor(data['loc_val']).to(device)
    y_val_np = data['y_val']
    
    X_test = torch.tensor(data['X_test']).to(device)
    loc_test = torch.tensor(data['loc_test']).to(device)
    y_test_np = data['y_test']
    
    best_val_mae = float('inf')
    best_state = None
    
    t0 = time.time()
    for ep in range(epochs):
        model.train()
        for batch_x, batch_loc, batch_y in train_loader:
            batch_x, batch_loc, batch_y = batch_x.to(device), batch_loc.to(device), batch_y.to(device)
            optimizer.zero_grad()
            pred = model(batch_x, batch_loc)
            loss = criterion(pred, batch_y)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            
        # Validation
        model.eval()
        with torch.no_grad():
            val_preds = model(X_val, loc_val).cpu().numpy()
            val_mae = float(np.mean(np.abs(y_val_np - val_preds)))
            
        if val_mae < best_val_mae:
            best_val_mae = val_mae
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            
    t_train = round(time.time() - t0, 3)
    
    # Restore best checkpoint
    model.load_state_dict(best_state)
    model.eval()
    
    with torch.no_grad():
        val_preds_best = model(X_val, loc_val).cpu().numpy()
        test_preds = model(X_test, loc_test).cpu().numpy()
        
    # Conformal calibration on validation
    quantile_val = compute_conformal_quantile(y_val_np, val_preds_best)
    
    # Test evaluation
    test_eval = evaluate_predictions(y_test_np, test_preds)
    test_cov = evaluate_interval_coverage(y_test_np, test_preds, quantile_val)
    
    # Save checkpoint
    checkpoint_file = f'{model_name.lower()}_h{horizon}.pt'
    checkpoint_path = saved_models_dir / checkpoint_file
    torch.save({
        'state_dict': best_state,
        'model_name': model_name,
        'horizon': horizon,
        'best_val_mae': best_val_mae,
        'conformal_quantile': quantile_val,
        'test_metrics': test_eval,
        'seq_features': data['seq_features'],
        'lookback': data['lookback'],
        'training_time_seconds': t_train
    }, checkpoint_path)
    
    entry = {
        'model_id': f'{model_name.lower()}_h{horizon}',
        'model_name': model_name,
        'algorithm': f'Deep Sequence Forecaster ({model_name})',
        'horizon_months': horizon,
        'is_baseline': False,
        'artifact_file': checkpoint_file,
        **test_eval,
        **test_cov,
        'val_mae': round(best_val_mae, 4),
        'training_time_seconds': t_train,
        'data_origin': 'SYNTHETIC_SIMULATION',
        'disclaimer': 'Synthetic demonstration results — not validated on observed weather'
    }
    
    print(f"{model_name} H{horizon}: Test MAE={test_eval['mae']:.4f}, RMSE={test_eval['rmse']:.4f}, MacroF1={test_eval['macro_f1']:.4f}, Conformal90%Cov={test_cov['empirical_test_coverage_pct']}% (Time: {t_train}s)")
    return entry

def train_all_deep_models(data_dir: Path = None, saved_models_dir: Path = None):
    if data_dir is None:
        data_dir = get_data_dir()
    if saved_models_dir is None:
        saved_models_dir = get_saved_models_dir()
        
    results = []
    
    for h in [1, 3, 6]:
        print(f"\n==========================================")
        print(f"Training Deep Learning Models for Horizon {h}M")
        print(f"==========================================")
        seq_data = prepare_sequence_data(horizon=h, lookback=12, data_dir=data_dir)
        
        # 1. LSTM Forecaster
        lstm = LSTMForecaster(num_features=len(seq_data['seq_features']), num_locations=32, loc_dim=8, hidden_dim=64, num_layers=2)
        lstm_res = train_and_eval_pytorch_model(lstm, 'LSTM', h, seq_data, saved_models_dir, epochs=15)
        results.append(lstm_res)
        
        # 2. GRU Forecaster
        gru = GRUForecaster(num_features=len(seq_data['seq_features']), num_locations=32, loc_dim=8, hidden_dim=64, num_layers=2)
        gru_res = train_and_eval_pytorch_model(gru, 'GRU', h, seq_data, saved_models_dir, epochs=15)
        results.append(gru_res)
        
        # 3. TCN Forecaster
        tcn = TCNForecaster(num_features=len(seq_data['seq_features']), num_locations=32, loc_dim=8, num_channels=48)
        tcn_res = train_and_eval_pytorch_model(tcn, 'TCN', h, seq_data, saved_models_dir, epochs=15)
        results.append(tcn_res)
        
    return results

if __name__ == '__main__':
    train_all_deep_models()
