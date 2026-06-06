import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI  = os.getenv("MONGO_URI",  "mongodb://mongodb:27017")
MONGO_DB   = os.getenv("MONGO_DB",   "deliverit")
MODEL_PATH = os.getenv("MODEL_PATH", "/app/saved_model")