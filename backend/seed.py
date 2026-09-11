import random

from database import SessionLocal, engine, Base
from models import EmployeeLicense


# Create database tables
Base.metadata.create_all(bind=engine)


# Number of records
NUM_RECORDS = 2000


softwares = [
    "Adobe",
    "Figma",
    "Salesforce",
    "Microsoft 365",
    "AutoCAD"
]

departments = [
    "Engineering",
    "Design",
    "Marketing",
    "Sales",
    "Finance",
    "HR"
]

license_costs = {
    "Adobe": 60,
    "Figma": 45,
    "Salesforce": 80,
    "Microsoft 365": 30,
    "AutoCAD": 70
}


# Create database session
db = SessionLocal()


try:

    # Clear old data
    db.query(EmployeeLicense).delete()

    # Generate employees
    for i in range(NUM_RECORDS):

        employee_id = f"E{i + 1:04d}"

        software = random.choice(softwares)
        department = random.choice(departments)

        days_since_last_use = random.randint(0, 180)
        monthly_usage_hours = random.randint(0, 60)
        monthly_logins = random.randint(0, 40)
        sessions_last_30_days = random.randint(0, 50)
        avg_session_minutes = random.randint(5, 180)

        license_cost = license_costs[software]

        # Calculate usage score
        usage_score = (
            (180 - days_since_last_use) * 0.30
            + monthly_usage_hours * 0.30
            + monthly_logins * 0.15
            + sessions_last_30_days * 0.15
            + avg_session_minutes * 0.10
        )

        # Add randomness
        usage_score += random.uniform(-15, 15)

        # Target
        if usage_score >= 55:
            license_needed = 1
        else:
            license_needed = 0

        employee = EmployeeLicense(
            employee_id=employee_id,
            software=software,
            department=department,
            days_since_last_use=days_since_last_use,
            monthly_usage_hours=monthly_usage_hours,
            monthly_logins=monthly_logins,
            sessions_last_30_days=sessions_last_30_days,
            avg_session_minutes=avg_session_minutes,
            license_cost=license_cost,
            license_needed=license_needed
        )

        db.add(employee)

    db.commit()

    print("====================================")
    print("Database seeding completed!")
    print("Records inserted:", NUM_RECORDS)
    print("====================================")


except Exception as e:

    db.rollback()

    print("Error:", e)


finally:

    db.close()