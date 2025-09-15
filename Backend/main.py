# main.py

from fastapi import FastAPI
from routers import assistant, error_analysis

app = FastAPI(
    title="SAP iDoc Chatbot API",
    description="Chatbot assistant for SAP iDoc error resolution and analysis",
    version="1.0.0"
)

# Register routers
app.include_router(assistant.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(error_analysis.router, prefix="/api/analysis", tags=["Error Analysis"])
