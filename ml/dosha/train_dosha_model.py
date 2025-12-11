import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics import accuracy_score, classification_report

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model_output')
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, "dosha_model.pkl")
DATASET_PATH = os.path.join(os.path.dirname(__file__), 'ayurvedic_ml_dataset_advanced.csv')

def train_model():
    print("🚀 Starting Advanced Model Training (Layer 1)...")
    
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Error: Dataset not found at {DATASET_PATH}")
        return

    # 1. Load Data
    print(f"Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)
    
    # 2. Define Features & Target
    # Features: Age (Num), Gender, Prakriti, ActivityLevel, SleepPattern, DietaryHabits, LifestyleFactor (Cat), Symptoms (Text)
    X = df[['Age', 'Gender', 'Prakriti', 'ActivityLevel', 'SleepPattern', 'DietaryHabits', 'LifestyleFactor', 'Symptoms']]
    y = df['DoshaImbalance']

    # 3. Preprocessing Pipeline
    print("Configuring preprocessing pipeline...")
    
    # Categorical Columns to OneHotEncode
    categorical_features = ['Gender', 'Prakriti', 'ActivityLevel', 'SleepPattern', 'DietaryHabits', 'LifestyleFactor']
    
    # Text Feature (Symptoms) -> CountVectorizer (Bag of Words) to capture multiple symptoms
    # We treat the semicolon-separated symptoms as a single text document
    
    # Text Feature (Symptoms) -> CountVectorizer (Bag of Words) to capture multiple symptoms
    # We treat the semicolon-separated symptoms as a single text document
    # Using token_pattern to split by semicolon (anything that is NOT a semicolon is a token)
    
    # We need a custom preprocessor to handle the mix
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
            ('symptoms', CountVectorizer(token_pattern=r'[^;]+'), 'Symptoms')
        ],
        remainder='passthrough' # Keep Age as is
    )

    # 4. Model Pipeline
    # RandomForest is robust for this mix of dense/sparse features
    model_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced'))
    ])

    # 5. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 6. Train
    print("Training RandomForest Classifier...")
    model_pipeline.fit(X_train, y_train)
    
    # 7. Evaluate
    y_pred = model_pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"✅Model Accuracy: {acc:.2f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # 8. Save
    # We save the WHOLE pipeline (including preprocessors) so inference is easy
    print(f"Saving full pipeline to {MODEL_PATH}...")
    joblib.dump(model_pipeline, MODEL_PATH)
    print("🎉 Training Complete! Full Pipeline Saved.")

if __name__ == "__main__":
    train_model()
