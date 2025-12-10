import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "model_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

csv_path = os.path.join(BASE_DIR, "food_data.csv")   # <-- rename CSV to food_data.csv

# -----------------------------
# Load food dataset
# -----------------------------
print("Loading food dataset...")
df = pd.read_csv(csv_path)

# -----------------------------
# Convert Ayurvedic effects to scores
# -----------------------------
effect_map = {"Pacifies": 1, "Neutral": 0, "Aggravates": -1}

df["VataScore"]  = df["VataEffect"].map(effect_map)
df["PittaScore"] = df["PittaEffect"].map(effect_map)
df["KaphaScore"] = df["KaphaEffect"].map(effect_map)

# -----------------------------
# GENERATE TARGET SCORE FOR MODEL
# Score is Ayurvedic compatibility
# -----------------------------
def compute_score(row):
    # Weighted Ayurvedic logic
    # Strongest → Dosha effect scores
    v = row["VataScore"]
    p = row["PittaScore"]
    k = row["KaphaScore"]
    
    # Nutrition impact
    calories = row["Calories"]
    protein = row["Protein"]
    carbs = row["Carbs"]
    fats = row["Fats"]
    
    # Base score (dosha effect)
    base = v + p + k  # represents Ayurvedic balancing
    
    # Nutrition adjustment
    nutri_score = (protein * 0.4) - (fats * 0.2) - (calories * 0.01)

    final = base + nutri_score
    return np.clip(final, -1, 1)

df["Score"] = df.apply(compute_score, axis=1)

print("Sample computed scores:")
print(df[["FoodName", "Score"]].head())

# -----------------------------
# MODEL FEATURES
# -----------------------------
features = [
    "Rasa", "Virya", "Vipaka",
    "Calories", "Protein", "Carbs", "Fats",
    "VataScore", "PittaScore", "KaphaScore"
]

X = df[features]
y = df["Score"]

# -----------------------------
# Encoding categorical + model
# -----------------------------
categorical = ["Rasa", "Virya", "Vipaka"]
numeric = ["Calories", "Protein", "Carbs", "Fats", "VataScore", "PittaScore", "KaphaScore"]

preprocess = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
    ("num", "passthrough", numeric)
])

model = RandomForestRegressor(n_estimators=300, random_state=42)

pipeline = Pipeline([
    ("prep", preprocess),
    ("model", model)
])

# -----------------------------
# Train/Test split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("Training model...")
pipeline.fit(X_train, y_train)

# -----------------------------
# Evaluate
# -----------------------------
preds = pipeline.predict(X_test)
mse = mean_squared_error(y_test, preds)
print(f"Validation MSE: {mse:.4f}")

# -----------------------------
# SAVE MODEL
# -----------------------------
out_path = os.path.join(OUTPUT_DIR, "food_score_model.pkl")
joblib.dump(pipeline, out_path)

print(f"Food Score Model saved at: {out_path}")
