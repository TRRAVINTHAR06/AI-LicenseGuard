from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime
from database import Base


class LicenseReclamation(Base):

    __tablename__ = "license_reclamations"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(String, index=True)

    status = Column(String, default="PENDING")

    notification_sent = Column(Integer, default=0)

    employee_response = Column(String, default="NO_RESPONSE")

    reclaimed_at = Column(DateTime, nullable=True)

    reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)