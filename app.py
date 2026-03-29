from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from db import get_db_connection
import uuid, os

app = Flask(__name__, static_folder="frontend", template_folder="frontend")

@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("frontend/css", filename)

@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("frontend/js", filename)
CORS(app)  # Allows your HTML files to call Flask freely

# ─────────────────────────────────────────
# Serve HTML pages
# ─────────────────────────────────────────
@app.route("/")
def home():
    return send_from_directory("frontend", "index.html")

@app.route("/<page>.html")
def serve_page(page):
    return send_from_directory("frontend", page + ".html")


# ─────────────────────────────────────────
# STUDENTS
# ─────────────────────────────────────────
@app.route("/api/students", methods=["GET"])
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.Registration_No AS reg, s.Name AS name, s.Email AS email,
               s.Branch AS branch, s.CGPA AS cgpa, s.Graduation_Year AS year,
               s.Phone AS phone, s.Backlog_Status AS backlog,
               GROUP_CONCAT(sk.Skill_Name SEPARATOR ',') AS skills_raw
        FROM STUDENT s
        LEFT JOIN STUDENT_SKILL sk ON s.Registration_No = sk.Registration_No
        GROUP BY s.Registration_No
        ORDER BY s.Name
    """)
    rows = cursor.fetchall()
    cursor.close(); conn.close()

    students = []
    for r in rows:
        skills = [{"reg": r["reg"], "skill": sk} for sk in r["skills_raw"].split(",") if sk] if r["skills_raw"] else []
        students.append({
            "reg": r["reg"], "name": r["name"], "email": r["email"],
            "branch": r["branch"], "cgpa": float(r["cgpa"]),
            "year": r["year"], "phone": r["phone"] or "",
            "backlog": r["backlog"] or "No",
            "_skills": skills
        })
    return jsonify(students)


@app.route("/api/students", methods=["POST"])
def add_student():
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO STUDENT
            (Registration_No, Name, Branch, CGPA, Email, Phone, Backlog_Status, Resume_Link, Graduation_Year)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (d["reg"], d["name"], d["branch"], d["cgpa"], d["email"],
              d.get("phone",""), d.get("backlog","No"), d.get("resume",""), d["year"]))
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


@app.route("/api/students/<reg>", methods=["DELETE"])
def delete_student(reg):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS=0")
        cursor.execute("DELETE FROM STUDENT_SKILL WHERE Registration_No=%s", (reg,))
        cursor.execute("DELETE FROM APPLICATION WHERE Registration_No=%s", (reg,))
        cursor.execute("DELETE FROM PLACEMENT_RESULT WHERE Registration_No=%s", (reg,))
        cursor.execute("DELETE FROM STUDENT WHERE Registration_No=%s", (reg,))
        cursor.execute("SET FOREIGN_KEY_CHECKS=1")
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


# ─────────────────────────────────────────
# SKILLS
# ─────────────────────────────────────────
@app.route("/api/skills", methods=["GET"])
def get_skills():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT Registration_No AS reg, Skill_Name AS skill FROM STUDENT_SKILL")
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(rows)


@app.route("/api/skills", methods=["POST"])
def add_skill():
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO STUDENT_SKILL (Registration_No, Skill_Name) VALUES (%s,%s)",
                       (d["reg"], d["skill"]))
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


@app.route("/api/skills", methods=["DELETE"])
def delete_skill():
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM STUDENT_SKILL WHERE Registration_No=%s AND Skill_Name=%s",
                       (d["reg"], d["skill"]))
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


# ─────────────────────────────────────────
# COMPANIES
# ─────────────────────────────────────────
@app.route("/api/companies", methods=["GET"])
def get_companies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT Company_ID AS id, Company_Name AS name, Industry_Type AS industry, HR_Name AS hr, HR_Email AS email, Contact_Number AS contact FROM COMPANY ORDER BY Company_Name")
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(rows)


@app.route("/api/companies", methods=["POST"])
def add_company():
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        new_id = "C" + str(uuid.uuid4())[:6].upper()
        cursor.execute("""
            INSERT INTO COMPANY (Company_ID, Company_Name, Industry_Type, HR_Name, HR_Email, Contact_Number)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (new_id, d["name"], d["industry"], d["hr"], d["email"], d["contact"]))
        conn.commit()
        return jsonify({"ok": True, "id": new_id})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


# ─────────────────────────────────────────
# DRIVES
# ─────────────────────────────────────────
@app.route("/api/drives", methods=["GET"])
def get_drives():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT Drive_ID AS id, Company_ID AS companyId, Job_Role AS role,
               Package AS package, Drive_Date AS date, Venue AS venue,
               Min_CGPA AS minCgpa, Eligible_Branch AS branch, Drive_Status AS status
        FROM PLACEMENT_DRIVE ORDER BY Drive_Date DESC
    """)
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    for r in rows:
        r["date"] = str(r["date"])          # convert date object to string
        r["package"] = float(r["package"])
        r["minCgpa"] = float(r["minCgpa"])
    return jsonify(rows)


@app.route("/api/drives", methods=["POST"])
def add_drive():
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        new_id = "D" + str(uuid.uuid4())[:6].upper()
        cursor.execute("""
            INSERT INTO PLACEMENT_DRIVE
            (Drive_ID, Company_ID, Job_Role, Package, Drive_Date, Venue, Min_CGPA, Eligible_Branch, Drive_Status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (new_id, d["companyId"], d["role"], d["package"], d["date"],
              d["venue"], d["minCgpa"], d["branch"], d.get("status","Open")))
        conn.commit()
        return jsonify({"ok": True, "id": new_id})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


# ─────────────────────────────────────────
# APPLICATIONS
# ─────────────────────────────────────────
@app.route("/api/applications", methods=["GET"])
def get_applications():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT Application_ID AS id, Registration_No AS studentReg,
               Drive_ID AS driveId, Application_Status AS status
        FROM APPLICATION
    """)
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    return jsonify(rows)


@app.route("/api/applications", methods=["POST"])
def add_application():
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Eligibility check
        cursor.execute("SELECT CGPA, Branch FROM STUDENT WHERE Registration_No=%s", (d["studentReg"],))
        student = cursor.fetchone()
        cursor.execute("SELECT Min_CGPA, Eligible_Branch, Drive_Status FROM PLACEMENT_DRIVE WHERE Drive_ID=%s", (d["driveId"],))
        drive = cursor.fetchone()

        if not student or not drive:
            return jsonify({"ok": False, "error": "Invalid student or drive"}), 400
        if drive["Drive_Status"] == "Closed":
            return jsonify({"ok": False, "error": "Drive is closed"}), 400
        if float(student["CGPA"]) < float(drive["Min_CGPA"]) or student["Branch"] != drive["Eligible_Branch"]:
            return jsonify({"ok": False, "error": "Student not eligible"}), 400

        # Duplicate check
        cursor.execute("SELECT 1 FROM APPLICATION WHERE Registration_No=%s AND Drive_ID=%s",
                       (d["studentReg"], d["driveId"]))
        if cursor.fetchone():
            return jsonify({"ok": False, "error": "Already applied"}), 400

        new_id = "A" + str(uuid.uuid4())[:6].upper()
        cursor.execute("""
            INSERT INTO APPLICATION (Application_ID, Registration_No, Drive_ID, Application_Status)
            VALUES (%s,%s,%s,'Applied')
        """, (new_id, d["studentReg"], d["driveId"]))
        conn.commit()
        return jsonify({"ok": True, "id": new_id})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


@app.route("/api/applications/<app_id>", methods=["PATCH"])
def update_application(app_id):
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE APPLICATION SET Application_Status=%s WHERE Application_ID=%s",
                       (d["status"], app_id))
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


# ─────────────────────────────────────────
# RESULTS
# ─────────────────────────────────────────
@app.route("/api/results", methods=["GET"])
def get_results():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT Result_ID AS id, Registration_No AS studentReg,
               Company_ID AS companyId, Package_Offered AS package,
               Offer_Status AS status
        FROM PLACEMENT_RESULT
    """)
    rows = cursor.fetchall()
    cursor.close(); conn.close()
    for r in rows:
        r["package"] = float(r["package"])
    return jsonify(rows)


@app.route("/api/results", methods=["POST"])
def add_result():
    d = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        new_id = "R" + str(uuid.uuid4())[:6].upper()
        cursor.execute("""
            INSERT INTO PLACEMENT_RESULT (Result_ID, Registration_No, Company_ID, Package_Offered, Offer_Status)
            VALUES (%s,%s,%s,%s,%s)
        """, (new_id, d["studentReg"], d["companyId"], d["package"], d["status"]))
        conn.commit()
        return jsonify({"ok": True, "id": new_id})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    finally:
        cursor.close(); conn.close()


if __name__ == "__main__":
    app.run(debug=True)
