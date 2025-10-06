# embed_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List
import os

MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
print("Loading embedder:", MODEL)
model = SentenceTransformer(MODEL)

app = FastAPI(title="SILAS Embedding Service")

class EmbRequest(BaseModel):
    texts: List[str]

@app.post("/embed")
async def embed(req: EmbRequest):
    # returns list[list[float]]
    embs = model.encode(req.texts, show_progress_bar=False)
    return {"embeddings": embs.tolist()}