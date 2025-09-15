from fastapi import APIRouter
from fastapi.responses import JSONResponse
import pandas as pd
import datetime

router = APIRouter()

excel_file_path = r"C:\Users\10735219\IDOC-Monitoring-Dashboard-main\IDOC-Monitoring-Dashboard-main\Backend\DB\EDIDS.xlsx"

@router.get("/edids-data")
async def get_edids_data():
    try:
        df = pd.read_excel(excel_file_path, engine='openpyxl')

        # Convert datetime and time columns to string
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].astype(str)
            elif df[col].apply(lambda x: isinstance(x, datetime.time)).any():
                df[col] = df[col].apply(lambda x: x.strftime('%H:%M:%S') if isinstance(x, datetime.time) else x)

        data = df.to_dict(orient="records")
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
