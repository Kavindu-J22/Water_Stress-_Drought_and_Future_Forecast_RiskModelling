import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.routers.c3 import router as c3_router

app = FastAPI(
    title="CoconutRisk AI — Component 03 ML Service",
    description=(
        "Water Stress, Drought and Future Forecast Risk Modelling Service. "
        "Provides environmental time-series inference, conformal prediction intervals, "
        "and baseline comparisons over synthetic Sri Lankan demo grids."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount internal C3 routes
app.include_router(c3_router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Invalid query or body parameters",
            "details": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": str(exc)
        }
    )

@app.get("/")
def read_root():
    return {
        "service": "CoconutRisk AI - Component 03 ML Service",
        "status": "UP",
        "documentation": "/docs",
        "internal_api_prefix": "/internal/c3",
        "is_synthetic": True,
        "disclaimer": "100% Synthetic simulation demo. Not observed Sri Lankan weather or certified crop advisory."
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("ML_PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
