from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import messages

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(messages.router, prefix="/messages", tags=["messages"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 