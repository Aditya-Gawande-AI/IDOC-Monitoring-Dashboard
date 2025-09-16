from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import sqlite3

router = APIRouter()

db_path = "DB\\idoc_data.db"

@router.get("/idoc-count")
async def get_idoc_count():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM idoc_data")
        rows = cursor.fetchall()
        conn.close()
        return {"count": len(rows)}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/filtered-data")
async def get_filtered_data(application: str = None):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        if application:
            cursor.execute("SELECT * FROM idoc_data WHERE message_type LIKE ?", (f"%{application}%",))
        else:
            cursor.execute("SELECT * FROM idoc_data")
            
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        conn.close()
        
        result = [dict(zip(columns, row)) for row in rows]
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.post("/reprocess")
async def reprocess_idoc(data: dict):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if the row exists in idoc_data
        cursor.execute("""
            SELECT * FROM idoc_data
            WHERE idoc_number = ? AND sender = ? AND receiver = ? AND date_created = ? AND time_st_created = ?
            AND status = ? AND person_to_notify = ? AND status_text = ? AND message_type = ?
        """, (
            data["idoc_number"], data["sender"], data["receiver"], data["date_created"], data["time_st_created"],
            data["status"], data["person_to_notify"], data["status_text"], data["message_type"]
        ))
        row = cursor.fetchone()

        if not row:
            conn.close()
            # Return error if row does not exist
            raise HTTPException(status_code=404, detail="Row not found in idoc_data table.")

        # Remove from idoc_data
        cursor.execute("""
            DELETE FROM idoc_data
            WHERE idoc_number = ? AND sender = ? AND receiver = ? AND date_created = ? AND time_st_created = ?
            AND status = ? AND person_to_notify = ? AND status_text = ? AND message_type = ?
        """, (
            data["idoc_number"], data["sender"], data["receiver"], data["date_created"], data["time_st_created"],
            data["status"], data["person_to_notify"], data["status_text"], data["message_type"]
        ))

        # Insert into reprocess_data
        cursor.execute("""
            INSERT INTO reprocess_data (idoc_number, sender, receiver, date_created, time_st_created, status, person_to_notify, status_text, message_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["idoc_number"], data["sender"], data["receiver"], data["date_created"], data["time_st_created"],
            data["status"], data["person_to_notify"], data["status_text"], data["message_type"]
        ))

        conn.commit()

        # Fetch all from reprocess_data
        cursor.execute("""
            SELECT idoc_number, sender, receiver, date_created, time_st_created, status, person_to_notify, status_text, message_type
            FROM reprocess_data
        """)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        conn.close()

        result = [dict(zip(columns, row)) for row in rows]
        return JSONResponse(content=result)
    except HTTPException as he:
        # Let FastAPI handle HTTPException
        raise he
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
