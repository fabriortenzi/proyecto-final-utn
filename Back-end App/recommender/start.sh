#!/bin/sh

if [ ! -f "$MODEL_PATH/model.pt" ]; then
  echo "No trained model found, training for the first time..."
  python -m model.train
fi

exec uvicorn api.main:app --host 0.0.0.0 --port 8001