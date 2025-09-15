# routers/idoc_router.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.error_models import invoke_with_retry, askai_chain

router = APIRouter()

class ErrorMessageRequest(BaseModel):
    error_message: str

@router.post("/resolve-idoc-error")
async def resolve_idoc_error(request: ErrorMessageRequest):
    try:
        response = invoke_with_retry(askai_chain, {"error_message": request.error_message})
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI resolution failed: {str(e)}")
