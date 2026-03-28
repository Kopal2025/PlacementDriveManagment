import pandas as pd
import mysql.connector
import os

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'kopalg_2025',  # Your password
    'database': 'placement_db'
}

def import_companies(df):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    count = 0
    
    print("📥 Importing COMPANIES...")
    
    for _, row in df.iterrows():
        try:
            cursor.execute("""
                INSERT INTO COMPANY 
                (Company_ID, Company_Name, Industry_Type, HR_Name, HR_Email, Contact_Number)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                str(row['Company_ID']),  # Now VARCHAR, keep as string
                str(row['Company_Name']),
                str(row['Industry_Type']),
                str(row['HR_Name']),
                str(row['HR_Email']),
                str(row['Contact_Number']) if pd.notna(row.get('Contact_Number')) else ''
            ))
            count += 1
        except Exception as e:
            print(f"   ❌ Error with {row.get('Company_Name')}: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"   ✅ Imported {count} companies\n")

def import_students(df):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    count = 0
    
    print("📥 Importing STUDENTS...")
    
    for idx, row in df.iterrows():
        try:
            cursor.execute("""
                INSERT INTO STUDENT 
                (Registration_No, Name, Branch, CGPA, Email, Phone, Backlog_Status, Resume_Link, Graduation_Year)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                str(row['Registration_No']),
                str(row['Name']),
                str(row['Branch']),
                float(row['CGPA']),
                str(row['Email']),
                str(row['Phone']) if pd.notna(row.get('Phone')) else '',
                str(row['Backlog_Status']),
                str(row['Resume_Link']) if pd.notna(row.get('Resume_Link')) else '',
                int(row['Graduation_Year'])
            ))
            count += 1
            if (idx + 1) % 100 == 0:
                print(f"   ... {count} students imported")
        except Exception as e:
            print(f"   ❌ Error with {row.get('Registration_No')}: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"   ✅ Imported {count} students\n")

def import_skills(df):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    count = 0
    
    print("📥 Importing STUDENT_SKILLS...")
    
    for _, row in df.iterrows():
        try:
            cursor.execute("""
                INSERT INTO STUDENT_SKILL (Registration_No, Skill_Name)
                VALUES (%s, %s)
            """, (
                str(row['Registration_No']),
                str(row['Skill_Name'])
            ))
            count += 1
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"   ✅ Imported {count} skills\n")

def import_drives(df):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    count = 0
    
    print("📥 Importing PLACEMENT_DRIVES...")
    
    for _, row in df.iterrows():
        try:
            cursor.execute("""
                INSERT INTO PLACEMENT_DRIVE 
                (Drive_ID, Company_ID, Job_Role, Package, Drive_Date, Venue, Min_CGPA, Eligible_Branch, Drive_Status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                str(row['Drive_ID']),  # VARCHAR, keep as string
                str(row['Company_ID']),  # VARCHAR, keep as string
                str(row['Job_Role']),
                float(row['Package']),
                str(row['Drive_Date']),
                str(row['Venue']),
                float(row['Min_CGPA']),
                str(row['Eligible_Branch']),
                str(row['Drive_Status']) if pd.notna(row.get('Drive_Status')) else 'Open'
            ))
            count += 1
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"   ✅ Imported {count} drives\n")

def import_applications(df):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    count = 0
    
    print("📥 Importing APPLICATIONS...")
    
    for _, row in df.iterrows():
        try:
            cursor.execute("""
                INSERT INTO APPLICATION 
                (Application_ID, Registration_No, Drive_ID, Application_Status)
                VALUES (%s, %s, %s, %s)
            """, (
                str(row['Application_ID']),  # VARCHAR like 'A001'
                str(row['Registration_No']),
                str(row['Drive_ID']),  # VARCHAR like 'D001'
                str(row['Application_Status']) if pd.notna(row.get('Application_Status')) else 'Applied'
            ))
            count += 1
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"   ✅ Imported {count} applications\n")

def import_results(df):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    count = 0
    
    print("📥 Importing PLACEMENT_RESULTS...")
    
    for _, row in df.iterrows():
        try:
            cursor.execute("""
                INSERT INTO PLACEMENT_RESULT 
                (Result_ID, Registration_No, Company_ID, Package_Offered, Offer_Status)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                str(row['Result_ID']),  # VARCHAR like 'R001'
                str(row['Registration_No']),
                str(row['Company_ID']),  # VARCHAR like 'C001'
                float(row['Package_Offered']),
                str(row['Offer_Status']) if pd.notna(row.get('Offer_Status')) else 'Pending'
            ))
            count += 1
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print(f"   ✅ Imported {count} results\n")

def main():
    print("\n" + "="*50)
    print("📊 PLACEMENT DATABASE IMPORT TOOL")
    print("="*50 + "\n")
    
    excel_file = input("📁 Enter Excel file name (or press Enter for 'placement_data.xlsx'): ").strip()
    if not excel_file:
        excel_file = "placement_data.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"\n❌ File '{excel_file}' not found!")
        print(f"   Current folder: {os.getcwd()}")
        return
    
    print(f"\n✅ Found file: {excel_file}\n")
    
    try:
        xl = pd.ExcelFile(excel_file)
        sheets = xl.sheet_names
        print(f"📑 Sheets found: {', '.join(sheets)}\n")
        
        # Import in correct order
        if 'COMPANY' in sheets:
            df = pd.read_excel(excel_file, sheet_name='COMPANY')
            import_companies(df)
        
        if 'STUDENT' in sheets:
            df = pd.read_excel(excel_file, sheet_name='STUDENT')
            import_students(df)
        
        if 'STUDENT_SKILL' in sheets:
            df = pd.read_excel(excel_file, sheet_name='STUDENT_SKILL')
            import_skills(df)
        
        if 'PLACEMENT_DRIVE' in sheets:
            df = pd.read_excel(excel_file, sheet_name='PLACEMENT_DRIVE')
            import_drives(df)
        
        if 'APPLICATION' in sheets:
            df = pd.read_excel(excel_file, sheet_name='APPLICATION')
            import_applications(df)
        
        if 'PLACEMENT_RESULT' in sheets:
            df = pd.read_excel(excel_file, sheet_name='PLACEMENT_RESULT')
            import_results(df)
        
        print("="*50)
        print("🎉 IMPORT COMPLETED!")
        print("="*50)
        
        # Verify counts
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        print("\n📊 FINAL DATABASE COUNTS:")
        cursor.execute("SELECT COUNT(*) FROM STUDENT")
        print(f"   Students: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM COMPANY")
        print(f"   Companies: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM PLACEMENT_DRIVE")
        print(f"   Drives: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM APPLICATION")
        print(f"   Applications: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM PLACEMENT_RESULT")
        print(f"   Results: {cursor.fetchone()[0]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    # Clean database first
    print("🧹 Cleaning database before import...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute("DELETE FROM PLACEMENT_RESULT")
    cursor.execute("DELETE FROM APPLICATION")
    cursor.execute("DELETE FROM PLACEMENT_DRIVE")
    cursor.execute("DELETE FROM STUDENT_SKILL")
    cursor.execute("DELETE FROM STUDENT")
    cursor.execute("DELETE FROM COMPANY")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Database cleaned!\n")
    
    main()