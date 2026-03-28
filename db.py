import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="kopalg_2025",   # 👈 YOUR MySQL password
        database="placement_db"
    )