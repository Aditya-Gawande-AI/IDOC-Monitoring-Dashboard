# routers/chatbot_router.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.assistant_models import get_chat_response

router = APIRouter()

class ChatRequest(BaseModel):
    user_query: str

@router.post("/chat")
async def chat_with_bot(request: ChatRequest):
    try:
        response = get_chat_response(request.user_query)
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot failed: {str(e)}")
