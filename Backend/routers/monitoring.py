from fastapi import APIRouter
from fastapi.responses import JSONResponse
import sqlite3

router = APIRouter()

# Update the path to your SQLite DB file in the DB folder
db_path = "DB\idoc_data.db"

@router.get("/edids-data")
async def get_edids_data():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT idoc_number, sender, receiver, date_created, time_st_created, status, person_to_notify, status_text, message_type
            FROM idoc_data
        """)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        conn.close()

        # Convert rows to list of dicts
        data = [dict(zip(columns, row)) for row in rows]
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

