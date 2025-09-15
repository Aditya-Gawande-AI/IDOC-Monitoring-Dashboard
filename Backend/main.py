from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import assistant, error_analysis, monitoring, overview  # 👈 Add overview here

app = FastAPI(
    title="SAP iDoc Chatbot API",
    description="Chatbot assistant for SAP iDoc error resolution and analysis",
    version="1.0.0"
)

# Enable CORS for local frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost",
        "http://127.0.0.1"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
app.include_router(assistant.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(error_analysis.router, prefix="/api/analysis", tags=["Error Analysis"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(overview.router, prefix="/api/overview", tags=["Overview"])  # 👈 Add this line
