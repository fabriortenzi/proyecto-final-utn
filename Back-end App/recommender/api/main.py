from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from inference.recommender import Recommender
import os

recommender = None

def load_recommender():
    global recommender
    recommender = Recommender()
    print("Modelo cargado")

@asynccontextmanager
async def lifespan(app: FastAPI):
    model_exists = os.path.exists(
        f"{os.getenv('MODEL_PATH', '/app/saved_model')}/model.pt"
    )
    if model_exists:
        load_recommender()
    else:
        print("Modelo no entrenado todavía, el contenedor lo entrenará automáticamente")
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/recomendaciones/{user_id}")
def get_recommendations(user_id: str, top_k: int = 3):
    if recommender is None:
        raise HTTPException(503, "Modelo no disponible")
    return {"userId": user_id, "recomendaciones": recommender.recommend(user_id, top_k)}

@app.post("/reload")
def reload_model():
    """Recarga el modelo en memoria sin reiniciar el contenedor. Lo llama el cron después de reentrenar."""
    try:
        load_recommender()
        return {"status": "ok", "message": "Modelo recargado"}
    except Exception as e:
        raise HTTPException(500, f"Error recargando modelo: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": recommender is not None}