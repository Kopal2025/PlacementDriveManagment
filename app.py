from db import get_db_connection
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

# ============ STUDENT ROUTES ============
@app.route('/add_student', methods=['POST'])
def add_student():
    data = request.form
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO STUDENT 
        (Registration_No, Name, Branch, CGPA, Email, Phone, Backlog_Status, Resume_Link, Graduation_Year)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        data['reg_no'],
        data['name'],
        data['branch'],
        data['cgpa'],
        data['email'],
        data['phone'],
        data['backlog'],
        data['resume'],
        data['year']
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return "Student Added Successfully"

# ============ STUDENT SKILLS ROUTES ============
@app.route('/add_skill', methods=['POST'])
def add_skill():
    data = request.form
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO STUDENT_SKILL 
        (Registration_No, Skill_Name)
        VALUES (%s,%s)
    """, (
        data['reg_no'],
        data['skill_name']
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return "Skill Added Successfully"

@app.route('/add_multiple_skills', methods=['POST'])
def add_multiple_skills():
    data = request.form
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get skills as comma-separated list
    skills = data['skills'].split(',')
    reg_no = data['reg_no']
    
    count = 0
    for skill in skills:
        skill = skill.strip()
        if skill:
            try:
                cursor.execute("""
                    INSERT INTO STUDENT_SKILL 
                    (Registration_No, Skill_Name)
                    VALUES (%s,%s)
                """, (reg_no, skill))
                count += 1
            except:
                pass  # Skip if skill already exists
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return f"{count} Skills Added Successfully"

@app.route('/view_skills', methods=['GET'])
def view_skills():
    reg_no = request.args.get('reg_no')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT Skill_Name FROM STUDENT_SKILL 
        WHERE Registration_No = %s
    """, (reg_no,))
    
    skills = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if skills:
        skill_list = [skill[0] for skill in skills]
        return f"Skills: {', '.join(skill_list)}"
    else:
        return "No skills found for this student"

@app.route('/delete_skill', methods=['POST'])
def delete_skill():
    data = request.form
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        DELETE FROM STUDENT_SKILL 
        WHERE Registration_No = %s AND Skill_Name = %s
    """, (data['reg_no'], data['skill_name']))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return "Skill Deleted Successfully"

# ============ COMPANY ROUTES ============
@app.route('/add_company', methods=['POST'])
def add_company():
    data = request.form
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO COMPANY 
        (Company_ID, Company_Name, Industry_Type, HR_Name, HR_Email, Contact_Number)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (
        data['company_id'],
        data['company_name'],
        data['industry'],
        data['hr_name'],
        data['hr_email'],
        data['contact']
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return "Company Added Successfully"

# ============ PLACEMENT DRIVE ROUTES ============
@app.route('/create_drive', methods=['POST'])
def create_drive():
    data = request.form
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO PLACEMENT_DRIVE 
        (Drive_ID, Company_ID, Job_Role, Package, Drive_Date, Venue, Min_CGPA, Eligible_Branch, Drive_Status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        data['drive_id'],
        data['company_id'],
        data['job_role'],
        data['package'],
        data['date'],
        data['venue'],
        data['cgpa'],
        data['branch'],
        data['status']
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return "Drive Created Successfully"

# ============ APPLICATION ROUTES ============
@app.route('/apply', methods=['POST'])
def apply():
    data = request.form

    conn = get_db_connection()
    cursor = conn.cursor()

    # Get student details
    cursor.execute("SELECT CGPA, Branch FROM STUDENT WHERE Registration_No = %s", (data['reg_no'],))
    student = cursor.fetchone()

    # Get drive details
    cursor.execute("SELECT Min_CGPA, Eligible_Branch FROM PLACEMENT_DRIVE WHERE Drive_ID = %s", (data['drive_id'],))
    drive = cursor.fetchone()

    if student and drive:
        student_cgpa, student_branch = student
        min_cgpa, eligible_branch = drive

        student_cgpa = float(student_cgpa)
        min_cgpa = float(min_cgpa)

        # Eligibility check
        if student_cgpa >= min_cgpa and student_branch == eligible_branch:
            
            cursor.execute("""
                INSERT INTO APPLICATION
                (Application_ID, Registration_No, Drive_ID, Application_Status)
                VALUES (%s,%s,%s,%s)
            """, (
                data['app_id'],
                data['reg_no'],
                data['drive_id'],
                "Applied"
            ))

            conn.commit()
            result = "Applied Successfully 🎉"

        else:
            result = "Not Eligible ❌"

    else:
        result = "Invalid Student or Drive ❌"

    cursor.close()
    conn.close()

    return result

# ============ UPDATE STATUS ROUTE ============
@app.route('/update_status', methods=['POST'])
def update_status():
    data = request.form

    conn = get_db_connection()
    cursor = conn.cursor()

    # Update application status
    cursor.execute("""
        UPDATE APPLICATION
        SET Application_Status = %s
        WHERE Application_ID = %s
    """, (
        data['status'],
        data['app_id']
    ))

    # If selected → insert into result
    if data['status'] == "Selected":
        
        # Get student + drive info
        cursor.execute("""
            SELECT Registration_No, Drive_ID 
            FROM APPLICATION WHERE Application_ID = %s
        """, (data['app_id'],))
        
        app_data = cursor.fetchone()

        if app_data:
            reg_no, drive_id = app_data

            # Get company from drive
            cursor.execute("""
                SELECT Company_ID FROM PLACEMENT_DRIVE 
                WHERE Drive_ID = %s
            """, (drive_id,))
            
            company = cursor.fetchone()

            if company:
                company_id = company[0]

                cursor.execute("""
                    INSERT INTO PLACEMENT_RESULT
                    (Result_ID, Registration_No, Company_ID, Package_Offered, Offer_Status)
                    VALUES (%s,%s,%s,%s,%s)
                """, (
                    data['result_id'],
                    reg_no,
                    company_id,
                    data['package'],
                    "Accepted"
                ))

    conn.commit()
    cursor.close()
    conn.close()

    return "Status Updated Successfully"

# ============ VIEW ALL SKILLS (HTML Table) ============
@app.route('/view_all_skills')
def view_all_skills():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all students with their skills
    cursor.execute("""
        SELECT s.Registration_No, s.Name, s.Branch, 
               GROUP_CONCAT(ss.Skill_Name SEPARATOR ', ') as Skills
        FROM STUDENT s
        LEFT JOIN STUDENT_SKILL ss ON s.Registration_No = ss.Registration_No
        GROUP BY s.Registration_No, s.Name, s.Branch
        ORDER BY s.Name
    """)
    
    students = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Generate HTML page
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>All Student Skills</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
            .container { max-width: 1200px; margin: auto; background: white; padding: 20px; border-radius: 10px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 10px; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .back-btn { 
                display: inline-block; 
                margin-bottom: 20px; 
                padding: 10px 20px; 
                background-color: #007bff; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px;
            }
            .back-btn:hover { background-color: #0056b3; }
            .stats { text-align: center; margin-bottom: 20px; font-size: 18px; }
            .skill-badge { background-color: #e0e0e0; padding: 2px 8px; border-radius: 15px; display: inline-block; margin: 2px; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back-btn">← Back to Home</a>
            <h1>📊 All Student Skills</h1>
    """
    
    # Add stats
    total_students = len(students)
    total_skills = sum(1 for s in students if s[3] and s[3] != 'None')
    
    html += f"""
            <div class="stats">
                <strong>Total Students:</strong> {total_students} &nbsp;|&nbsp;
                <strong>Students with Skills:</strong> {total_skills}
            </div>
            <table>
                <tr>
                    <th>Registration No</th>
                    <th>Student Name</th>
                    <th>Branch</th>
                    <th>Skills</th>
                </tr>
    """
    
    for student in students:
        reg_no, name, branch, skills = student
        if skills and skills != 'None':
            skills_display = skills
        else:
            skills_display = "❌ No skills added yet"
        
        html += f"""
                <tr>
                    <td>{reg_no}</td>
                    <td><strong>{name}</strong></td>
                    <td>{branch}</td>
                    <td>{skills_display}</td>
                </tr>
        """
    
    html += """
            </table>
        </div>
    </body>
    </html>
    """
    
    return html

# ============ DASHBOARD WITH STATS (HTML) ============
@app.route('/dashboard')
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all stats
    cursor.execute("SELECT COUNT(*) FROM STUDENT")
    total_students = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM COMPANY")
    total_companies = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM PLACEMENT_DRIVE WHERE Drive_Status = 'Open'")
    open_drives = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM PLACEMENT_RESULT WHERE Offer_Status = 'Accepted'")
    placed_students = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM STUDENT_SKILL")
    total_skills = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()
    
    # Generate HTML dashboard
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Placement Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
            .container { max-width: 1200px; margin: auto; }
            h1 { text-align: center; color: #333; }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .stat-number {
                font-size: 36px;
                font-weight: bold;
                margin: 10px 0;
            }
            .stat-label {
                color: #666;
                font-size: 14px;
            }
            .back-btn {
                display: inline-block;
                margin: 20px 0;
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
            }
            .skills-btn {
                background-color: #28a745;
                margin-left: 10px;
            }
            .back-btn:hover { opacity: 0.8; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back-btn">← Back to Forms</a>
            <a href="/view_all_skills" class="back-btn skills-btn">📚 View All Skills</a>
            <h1>🎓 Placement Management Dashboard</h1>
            
            <div class="stats-grid">
                <div class="stat-card" style="border-top: 4px solid #007bff;">
                    <div class="stat-label">👨‍🎓 Total Students</div>
                    <div class="stat-number">""" + str(total_students) + """</div>
                </div>
                <div class="stat-card" style="border-top: 4px solid #28a745;">
                    <div class="stat-label">🏢 Companies</div>
                    <div class="stat-number">""" + str(total_companies) + """</div>
                </div>
                <div class="stat-card" style="border-top: 4px solid #ffc107;">
                    <div class="stat-label">📅 Open Drives</div>
                    <div class="stat-number">""" + str(open_drives) + """</div>
                </div>
                <div class="stat-card" style="border-top: 4px solid #17a2b8;">
                    <div class="stat-label">🎯 Placed Students</div>
                    <div class="stat-number">""" + str(placed_students) + """</div>
                </div>
                <div class="stat-card" style="border-top: 4px solid #6c757d;">
                    <div class="stat-label">💪 Total Skills</div>
                    <div class="stat-number">""" + str(total_skills) + """</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

if __name__ == '__main__':
    app.run(debug=True)