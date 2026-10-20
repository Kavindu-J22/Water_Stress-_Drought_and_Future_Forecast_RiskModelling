FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY ml-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service /app/ml-service
COPY research-data /app/research-data

ENV PYTHONPATH=/app/ml-service
ENV PORT=8001
ENV C3_DATA_DIR=/app/research-data
ENV C3_MODEL_DIR=/app/ml-service/saved_models

EXPOSE 8001

CMD ["python", "ml-service/app/main.py"]
