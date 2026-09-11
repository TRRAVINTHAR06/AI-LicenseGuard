import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier

from database import SessionLocal
from models import EmployeeLicense


# ==========================================
# LOAD DATA FROM DATABASE
# ==========================================

db = SessionLocal()

employees = db.query(EmployeeLicense).all()

data = []

for employee in employees:
    data.append({
        "days_since_last_use": employee.days_since_last_use,
        "monthly_usage_hours": employee.monthly_usage_hours,
        "monthly_logins": employee.monthly_logins,
        "sessions_last_30_days": employee.sessions_last_30_days,
        "avg_session_minutes": employee.avg_session_minutes,
        "license_cost": employee.license_cost,
        "software": employee.software,
        "department": employee.department,
        "license_needed": employee.license_needed
    })

db.close()


# ==========================================
# CREATE DATAFRAME
# ==========================================

df = pd.DataFrame(data)


# ==========================================
# FEATURES
# ==========================================

features = [
    "days_since_last_use",
    "monthly_usage_hours",
    "monthly_logins",
    "sessions_last_30_days",
    "avg_session_minutes",
    "license_cost",
    "software",
    "department"
]

X = df[features]
y = df["license_needed"]


# ==========================================
# FEATURE TYPES
# ==========================================

numeric_features = [
    "days_since_last_use",
    "monthly_usage_hours",
    "monthly_logins",
    "sessions_last_30_days",
    "avg_session_minutes",
    "license_cost"
]

categorical_features = [
    "software",
    "department"
]


# ==========================================
# PREPROCESSOR
# ==========================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            "passthrough",
            numeric_features
        ),
        (
            "cat",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        )
    ]
)


# ==========================================
# RANDOM FOREST MODEL
# ==========================================

model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            RandomForestClassifier(
                n_estimators=200,
                random_state=42
            )
        )
    ]
)


# ==========================================
# TRAIN MODEL
# ==========================================

model.fit(X, y)

print("AI LicenseGuard model loaded and trained!")