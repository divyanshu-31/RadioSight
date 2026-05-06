import sqlite3
from datetime import datetime

DB_FILE = "radiosight_history.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            patient_name TEXT,
            patient_age INTEGER,
            patient_gender TEXT,
            disease TEXT,
            confidence REAL,
            date TEXT
        )
    ''')
    conn.commit()
    conn.close()

def add_analysis(patient_id, name, age, gender, disease, confidence):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    cursor.execute('''
        INSERT INTO history (patient_id, patient_name, patient_age, patient_gender, disease, confidence, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, name, age, gender, disease, confidence, date_str))
    conn.commit()
    conn.close()

def get_history():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM history ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": row["id"],
            "patient_id": row["patient_id"],
            "name": row["patient_name"],
            "age": row["patient_age"],
            "gender": row["patient_gender"],
            "disease": row["disease"],
            "confidence": row["confidence"],
            "date": row["date"]
        } for row in rows
    ]

# Initialize db on import
init_db()
