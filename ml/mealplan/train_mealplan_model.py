import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os
import sys

# Import templates + wrapper
BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE)

from meal_plan_wrapper import MealPlanModel
from meal_plan_templates import TEMPLATES

# ---------------------
# Load YOUR dataset
# ---------------------
csv_path = os.path.join(BASE, "mealplan_dataset.csv")

print("Loading dataset:", csv_path)
df = pd.read_csv(csv_path)

# Check columns
required_cols = ["Age", "Gender", "Activity", "TargetPlan"]
for col in required_cols:
    if col not in df.columns:
        raise Exception(f"Missing required column: {col}")

# ---------------------
# Train model
# ---------------------
X = df[["Age", "Gender", "Activity"]]
y = df["TargetPlan"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

clf = DecisionTreeClassifier(max_depth=8)
clf.fit(X_train, y_train)

preds = clf.predict(X_test)
acc = accuracy_score(y_test, preds)

print("Accuracy:", acc)

# ---------------------
# Save the wrapped model
# ---------------------
output_dir = os.path.join(BASE, "model_output")
os.makedirs(output_dir, exist_ok=True)

model = MealPlanModel(classifier=clf, templates=TEMPLATES)
path = os.path.join(output_dir, "mealplan_model.pkl")

joblib.dump(model, path)
print("Saved MealPlan model at:", path)
