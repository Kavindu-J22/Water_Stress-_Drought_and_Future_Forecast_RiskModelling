# CoconutRisk AI — Component 03: Complete Setup & Execution Guide

This guide provides step-by-step instructions to set up, configure, and run **Component 03: Water Stress, Drought and Future Forecast Risk Modelling** on any machine (Windows, macOS, or Linux) after cloning the repository from GitHub.

---

## 1. Prerequisites to Install on the New Machine

Before starting, ensure the machine has the following tools installed:

| Tool | Recommended Version | Download Link / Verification Command |
|---|---|---|
| **Git** | Any recent version | `git --version` |
| **Node.js** | v20.x or v22.x LTS (v18+ supported) | [nodejs.org](https://nodejs.org/) (`node -v` & `npm -v`) |
| **Python** | 3.10, 3.11, or 3.12 | [python.org](https://www.python.org/) (`python --version`) |
| **PostgreSQL** | v14 to v18 (Optional: Docker) | [postgresql.org](https://www.postgresql.org/download/) |

> **Note on PostgreSQL:** The backend includes an automated fallback mechanism. If PostgreSQL is not installed or offline, the system automatically runs in **Read-Only Session Mode** without crashing.

---

## 2. Step-by-Step Setup After Cloning

### Step 1: Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd "Water_Stress,_Drought_and_Future_Forecast_RiskModelling"
```

---

### Step 2: Configure Environment Variables
Copy the `.env.example` file to create your local `.env`:

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**On macOS / Linux (Bash):**
```bash
cp .env.example .env
```

Open `.env` in any text editor and adjust your PostgreSQL credentials if different:
```env
# Ports
PORT=8000
ML_PORT=8001
VITE_PORT=5173

# API Gateway & Backend
ML_SERVICE_URL=http://localhost:8001/internal/c3
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password_here
PGDATABASE=coconutrisk_c3
DATABASE_URL=postgresql://postgres:your_postgres_password_here@localhost:5432/coconutrisk_c3
NODE_ENV=development
JWT_SECRET=dev_c3_secret_key_change_in_production_2026

# ML Service Paths
C3_DATA_DIR=research-data
C3_MODEL_DIR=ml-service/saved_models
C3_DEMO_MODE=true

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api/v1/c3
VITE_C3_STANDALONE=true
```

---

### Step 3: Set Up the PostgreSQL Database
Open your PostgreSQL terminal (`psql`) or pgAdmin and run:
```sql
CREATE DATABASE coconutrisk_c3;
```
*(You do not need to create tables manually. The Express backend automatically creates all required tables — `c3_alert_dismissals`, `c3_alert_settings`, and `c3_report_jobs` — upon first startup!)*

---

### Step 4: Set Up the Python ML Service
Create and activate a Python virtual environment, then install dependencies:

**On Windows (PowerShell):**
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install required packages
pip install --upgrade pip
pip install -r ml-service/requirements.txt
```

**On macOS / Linux (Bash):**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install required packages
pip install --upgrade pip
pip install -r ml-service/requirements.txt
```

---

### Step 5: Install Node.js Backend Gateway Dependencies
From the repository root:
```bash
cd api
npm install
cd ..
```

---

### Step 6: Install React Frontend Dependencies
From the repository root:
```bash
cd frontend
npm install
cd ..
```

---

## 3. How to Run the Entire System Manually

To run the complete system with hot-reloading and live logging, open **3 separate terminal windows** (ensure your Python virtual environment is activated in Terminal 1):

### Terminal 1: Python FastAPI ML Inference Engine (Port 8001)
```bash
# From project root (with venv activated)
python ml-service/app/main.py
```
- **Live ML Service:** `http://localhost:8001`
- **Interactive OpenAPI (Swagger) Docs:** `http://localhost:8001/docs`

---

### Terminal 2: Node.js Express API Gateway (Port 8000)
```bash
# From project root
cd api
node src/app.js
```
- **API Gateway Base:** `http://localhost:8000/api/v1/c3`
- **Health Check Endpoint:** `http://localhost:8000/api/v1/c3/health`

---

### Terminal 3: React 18 Frontend SPA (Port 5173)
```bash
# From project root
cd frontend
npm run dev
```
- **Web Application UI:** `http://localhost:5173`

---

## 4. One-Command Alternative: Running via Docker Compose

If you have **Docker Desktop** installed, you do not need to install Python, Node, or PostgreSQL manually. Simply run:

```bash
docker compose up --build
```

This single command automatically builds and boots:
1. `c3-postgres` container on port `5432`
2. `c3-ml-service` container on port `8001`
3. `c3-api-gateway` container on port `8000`
4. `c3-frontend` container on port `5173`

---

## 5. Automated Verification & Testing Commands

To verify that the newly cloned and setup project is functioning 100% correctly, run these automated tests:

### 1. End-to-End System Smoke Test
Validates simulated dataset loading, all 24 models in registry, multi-horizon inference, GeoJSON generation, and binary PDF/CSV file generators:
```bash
python scripts/smoke_test.py
```
*(Expected output: `ALL SMOKE TESTS PASSED! C3 ML & DATA PIPELINE OPERATIONAL!`)*

### 2. Python ML Service PyTest Suite
Runs 11 unit & contract tests:
```bash
python -m pytest ml-service/tests/test_c3_ml.py -v
```
*(Expected output: `11 passed`)*

### 3. Node.js Express API Gateway Jest Suite
Runs 6 API contract and database pool tests:
```bash
cd api
npm test
cd ..
```
*(Expected output: `6 passed, 6 total`)*

---

## 6. (Optional) Re-training All 24 Machine Learning Models

The repository comes pre-packaged with all 24 trained model artifacts and validation quantiles in `ml-service/saved_models/`. 

If you wish to re-train all models from scratch on the simulated 1981–2025 dataset:
```bash
python ml-service/training/train_all.py
```
This automatically runs:
1. Data preprocessing and chronological splitting (`prepare.py`)
2. Baselines training: Persistence & Seasonal Climatology (`train_baselines.py`)
3. Classical ML: Random Forest & XGBoost (`train_classical.py`)
4. Time-series econometrics: SARIMAX (`train_sarimax.py`)
5. PyTorch Deep Sequences: LSTM, GRU, TCN (`train_deep.py`)
6. Split Conformal 90% calibration intervals (`make_intervals.py`)
7. Feature ablation studies & benchmark JSON generation (`evaluate.py`)
