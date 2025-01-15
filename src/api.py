from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from src.ai.rag import RAGSystem

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo only - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG system
rag = RAGSystem()

class Document(BaseModel):
    text: str
    metadata: Dict[str, Any]

class Query(BaseModel):
    query: str

@app.post("/ingest")
async def ingest_document(document: Document):
    try:
        chunks = rag.ingest_text(document.text, document.metadata)
        return {"status": "success", "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_documents(query: Query):
    try:
        response = rag.query(query.query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 