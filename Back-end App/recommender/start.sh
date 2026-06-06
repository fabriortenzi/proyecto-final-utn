#!/bin/sh

# Si no hay modelo entrenado, entrenar antes de levantar el servidor
if [ ! -f "$MODEL_PATH/model.pt" ]; then
  echo "No hay modelo, entrenando por primera vez..."
  python -m model.train
fi

# Arrancar cron en background (para reentrenamiento nocturno)
cron

# Arrancar FastAPI en foreground
exec uvicorn api.main:app --host 0.0.0.0 --port 8001