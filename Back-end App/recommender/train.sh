#!/bin/sh
set -e

# Train on startup if model doesn't exist yet (recommender may not have one)
python -m model.train

# Reload the recommender API so it picks up the freshly trained model
curl -s -X POST http://recommender:8001/reload && echo ""

while true; do
  echo "[$(date)] Training round complete. Sleeping 24h..."
  sleep 86400

  echo "[$(date)] Starting daily model retrain..."
  python -m model.train

  echo "[$(date)] Reloading recommender API..."
  curl -s -X POST http://recommender:8001/reload && echo ""
done
