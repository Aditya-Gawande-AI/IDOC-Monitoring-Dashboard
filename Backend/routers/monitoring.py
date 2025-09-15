from fastapi import APIRouter
from fastapi.responses import JSONResponse
import pandas as pd
import datetime
from pathlib import Path

router = APIRouter()

# This router file lives in Backend/routers/, so Backend is parents[1]
THIS_FILE = Path(__file__).resolve()
BACKEND_DIR = THIS_FILE.parents[1]
excel_file_path = (BACKEND_DIR / 'db' / 'EDIDS.xlsx').resolve()

@router.get("/edids-data")
async def get_edids_data():
    try:
        if not excel_file_path.exists():
            return JSONResponse(content={"error": f"EDIDS.xlsx not found at {excel_file_path}"}, status_code=500)

        df = pd.read_excel(excel_file_path, engine='openpyxl')

        # Convert datetime and time columns to string
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].astype(str)
            elif df[col].apply(lambda x: isinstance(x, datetime.time)).any():
                df[col] = df[col].apply(lambda x: x.strftime('%H:%M:%S') if isinstance(x, datetime.time) else x)

        data = df.to_dict(orient="records")
        return JSONResponse(content=data)
    except FileNotFoundError as e:
        return JSONResponse(content={"error": f"File not found: {str(e)}"}, status_code=500)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
