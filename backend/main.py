import pandas as pd

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from models import EmployeeLicense
from ml_model import model
from datetime import datetime
from reclamation import LicenseReclamation

# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="AI LicenseGuard API",
    description="AI-powered software license management system",
    version="1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# Home API
@app.get("/")
def home():
    return {
        "message": "AI LicenseGuard API is running!"
    }


# Get all employees
@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):

    employees = db.query(EmployeeLicense).all()

    return employees


# Get employee by ID
@app.get("/employees/{employee_id}")
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db)
):

    employee = (
        db.query(EmployeeLicense)
        .filter(EmployeeLicense.employee_id == employee_id)
        .first()
    )

    if employee is None:
        return {
            "message": "Employee not found"
        }

    return employee
# ==========================================
# AI LICENSE PREDICTION
# ==========================================

@app.get("/predict/{employee_id}")
def predict_license(
    employee_id: str,
    db: Session = Depends(get_db)
):

    # Find employee
    employee = (
        db.query(EmployeeLicense)
        .filter(EmployeeLicense.employee_id == employee_id)
        .first()
    )

    if employee is None:
        return {
            "message": "Employee not found"
        }

    # Create input data for AI model
    employee_data = pd.DataFrame([{
        "days_since_last_use": employee.days_since_last_use,
        "monthly_usage_hours": employee.monthly_usage_hours,
        "monthly_logins": employee.monthly_logins,
        "sessions_last_30_days": employee.sessions_last_30_days,
        "avg_session_minutes": employee.avg_session_minutes,
        "license_cost": employee.license_cost,
        "software": employee.software,
        "department": employee.department
    }])

    # Get prediction probability
    probability = model.predict_proba(employee_data)[0][1]

    # Recommendation
    if probability < 0.10:
        recommendation = "RECLAIM CANDIDATE"

    elif probability < 0.30:
        recommendation = "REVIEW"

    else:
        recommendation = "KEEP LICENSE"

    return {
        "employee_id": employee.employee_id,
        "software": employee.software,
        "department": employee.department,
        "license_needed_probability": round(probability * 100, 2),
        "recommendation": recommendation
    }
# ==========================================
# DASHBOARD SUMMARY
# ==========================================

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    employees = db.query(EmployeeLicense).all()

    total_employees = len(employees)

    keep_count = 0
    reclaim_count = 0
    review_count = 0
    potential_savings = 0

    for employee in employees:

        employee_data = pd.DataFrame([{
            "days_since_last_use": employee.days_since_last_use,
            "monthly_usage_hours": employee.monthly_usage_hours,
            "monthly_logins": employee.monthly_logins,
            "sessions_last_30_days": employee.sessions_last_30_days,
            "avg_session_minutes": employee.avg_session_minutes,
            "license_cost": employee.license_cost,
            "software": employee.software,
            "department": employee.department
        }])

        probability = model.predict_proba(
            employee_data
        )[0][1]

        if probability < 0.10:

            reclaim_count += 1
            potential_savings += employee.license_cost

        elif probability < 0.30:

            review_count += 1

        else:

            keep_count += 1

    return {
        "total_employees": total_employees,
        "keep_license": keep_count,
        "reclaim_candidates": reclaim_count,
        "review": review_count,
        "potential_monthly_savings": potential_savings
    }
# ==========================================
# SAVINGS ANALYSIS
# ==========================================

@app.get("/savings")
def get_savings(db: Session = Depends(get_db)):

    employees = db.query(EmployeeLicense).all()

    total_savings = 0

    software_savings = {}
    department_savings = {}

    for employee in employees:

        employee_data = pd.DataFrame([{
            "days_since_last_use": employee.days_since_last_use,
            "monthly_usage_hours": employee.monthly_usage_hours,
            "monthly_logins": employee.monthly_logins,
            "sessions_last_30_days": employee.sessions_last_30_days,
            "avg_session_minutes": employee.avg_session_minutes,
            "license_cost": employee.license_cost,
            "software": employee.software,
            "department": employee.department
        }])

        probability = model.predict_proba(employee_data)[0][1]

        # Reclaim candidate
        if probability < 0.10:

            total_savings += employee.license_cost

            # Software savings
            if employee.software not in software_savings:
                software_savings[employee.software] = 0

            software_savings[employee.software] += employee.license_cost

            # Department savings
            if employee.department not in department_savings:
                department_savings[employee.department] = 0

            department_savings[employee.department] += employee.license_cost

    yearly_savings = total_savings * 12

    return {
        "monthly_savings": round(total_savings, 2),
        "yearly_savings": round(yearly_savings, 2),
        "software_savings": software_savings,
        "department_savings": department_savings
    }
# ==========================================
# AUTONOMOUS LICENSE RECLAMATION
# ==========================================


# Find unused licenses
@app.get("/reclamation/candidates")
def get_reclamation_candidates(
    db: Session = Depends(get_db)
):

    employees = (
        db.query(EmployeeLicense)
        .filter(EmployeeLicense.days_since_last_use >= 90)
        .all()
    )

    candidates = []

    for employee in employees:

        existing = (
            db.query(LicenseReclamation)
            .filter(
                LicenseReclamation.employee_id ==
                employee.employee_id
            )
            .first()
        )

        if existing is None:

            reclamation = LicenseReclamation(
                employee_id=employee.employee_id,
                status="PENDING",
                notification_sent=0,
                employee_response="NO_RESPONSE",
                reason="Unused for 90+ days"
            )

            db.add(reclamation)

        candidates.append({
            "employee_id": employee.employee_id,
            "software": employee.software,
            "department": employee.department,
            "days_since_last_use": employee.days_since_last_use,
            "license_cost": employee.license_cost,
            "status": "RECLAMATION CANDIDATE"
        })

    db.commit()

    return {
        "total_candidates": len(candidates),
        "candidates": candidates
    }


# Send notification
@app.post("/reclamation/notify/{employee_id}")
def notify_employee(
    employee_id: str,
    db: Session = Depends(get_db)
):

    employee = (
        db.query(EmployeeLicense)
        .filter(
            EmployeeLicense.employee_id == employee_id
        )
        .first()
    )

    if employee is None:
        return {
            "message": "Employee not found"
        }

    reclamation = (
        db.query(LicenseReclamation)
        .filter(
            LicenseReclamation.employee_id == employee_id
        )
        .first()
    )

    if reclamation is None:

        reclamation = LicenseReclamation(
            employee_id=employee_id,
            status="PENDING",
            notification_sent=1,
            employee_response="NO_RESPONSE",
            reason="Unused for 90+ days"
        )

        db.add(reclamation)

    else:

        reclamation.notification_sent = 1

    db.commit()

    return {
        "employee_id": employee_id,
        "software": employee.software,
        "message": (
            f"Are you still using {employee.software}? "
            "If not, the license will be reclaimed."
        ),
        "status": "NOTIFICATION_SENT"
    }


# Employee response
@app.post("/reclamation/response/{employee_id}")
def employee_response(
    employee_id: str,
    response: str,
    db: Session = Depends(get_db)
):

    reclamation = (
        db.query(LicenseReclamation)
        .filter(
            LicenseReclamation.employee_id == employee_id
        )
        .first()
    )

    if reclamation is None:

        return {
            "message": "Reclamation record not found"
        }

    response = response.upper()

    if response not in ["YES", "NO"]:
        return {
            "message": "Response must be YES or NO"
        }

    reclamation.employee_response = response

    if response == "NO":

        reclamation.status = "RECLAIMED"
        reclamation.reclaimed_at = datetime.utcnow()
        reclamation.reason = "Employee no longer needs the license"

    else:

        reclamation.status = "KEEP"

    db.commit()

    return {
        "employee_id": employee_id,
        "response": response,
        "license_status": reclamation.status
    }


# Automatically reclaim a license
@app.post("/reclamation/reclaim/{employee_id}")
def reclaim_license(
    employee_id: str,
    db: Session = Depends(get_db)
):

    employee = (
        db.query(EmployeeLicense)
        .filter(
            EmployeeLicense.employee_id == employee_id
        )
        .first()
    )

    if employee is None:
        return {
            "message": "Employee not found"
        }

    reclamation = (
        db.query(LicenseReclamation)
        .filter(
            LicenseReclamation.employee_id == employee_id
        )
        .first()
    )

    if reclamation is None:

        reclamation = LicenseReclamation(
            employee_id=employee_id
        )

        db.add(reclamation)

    reclamation.status = "RECLAIMED"
    reclamation.reclaimed_at = datetime.utcnow()
    reclamation.reason = "License automatically reclaimed"

    db.commit()

    return {
        "employee_id": employee_id,
        "software": employee.software,
        "license_cost": employee.license_cost,
        "status": "RECLAIMED",
        "monthly_savings": employee.license_cost
    }


# Employee leaving company or changing role
@app.post("/reclamation/employee-status/{employee_id}")
def employee_status(
    employee_id: str,
    status: str,
    db: Session = Depends(get_db)
):

    employee = (
        db.query(EmployeeLicense)
        .filter(
            EmployeeLicense.employee_id == employee_id
        )
        .first()
    )

    if employee is None:
        return {
            "message": "Employee not found"
        }

    status = status.upper()

    if status not in ["ACTIVE", "LEFT_COMPANY", "ROLE_CHANGED"]:
        return {
            "message": (
                "Status must be ACTIVE, "
                "LEFT_COMPANY or ROLE_CHANGED"
            )
        }

    if status in ["LEFT_COMPANY", "ROLE_CHANGED"]:

        reclamation = (
            db.query(LicenseReclamation)
            .filter(
                LicenseReclamation.employee_id == employee_id
            )
            .first()
        )

        if reclamation is None:

            reclamation = LicenseReclamation(
                employee_id=employee_id
            )

            db.add(reclamation)

        reclamation.status = "RECLAIMED"
        reclamation.reclaimed_at = datetime.utcnow()
        reclamation.reason = status

        db.commit()

        return {
            "employee_id": employee_id,
            "employee_status": status,
            "license_status": "RECLAIMED",
            "monthly_savings": employee.license_cost
        }

    return {
        "employee_id": employee_id,
        "employee_status": "ACTIVE",
        "license_status": "ACTIVE"
    }