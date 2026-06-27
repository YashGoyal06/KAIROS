import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.db.connection import init_db
from backend.app.api import profiles, teams, sessions, tasks, pitch

app = FastAPI(
    title="KAIROS API",
    description="The AI-powered hackathon project co-founder and execution engine.",
    version="1.0.0"
)

# Enable CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Support all origins for developer simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    # Automatically bootstrap SQLite / PostgreSQL tables
    await init_db()

app.include_router(profiles.router, prefix="/api/v1")
app.include_router(teams.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(pitch.router, prefix="/api/v1")

@app.get("/")
@app.head("/")
async def root():
    return {"status": "online", "message": "KAIROS Core API"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
