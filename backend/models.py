from sqlalchemy import Column, Integer, String, Float

from database import Base


class EmployeeLicense(Base):

    __tablename__ = "employee_licenses"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(String, index=True)

    software = Column(String)

    department = Column(String)

    days_since_last_use = Column(Integer)

    monthly_usage_hours = Column(Integer)

    monthly_logins = Column(Integer)

    sessions_last_30_days = Column(Integer)

    avg_session_minutes = Column(Integer)

    license_cost = Column(Float)

    license_needed = Column(Integer)