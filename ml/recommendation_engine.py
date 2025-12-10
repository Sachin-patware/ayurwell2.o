import pandas as pd
import numpy as np
import joblib
import os
import json

class AyurvedicRecommendationEngine:
    def __init__(self, model_path=None, food_data_path=None):
        base_dir = os.path.dirname(__file__)

        if model_path is None:
            model_path = os.path.join(base_dir, '..', 'backend', 'model', 'model.pkl')

        if food_data_path is None:
            food_data_path = os.path.join(base_dir, 'ayurvedic_food_data.csv')

        self.model_path = model_path
        self.food_data_path = food_data_path

        self.model_pipeline = None
        self.food_df = None

        self._load_resources()

    # ---------------------------------------------------
    # LOAD MODEL + FOOD DATABASE
    # ---------------------------------------------------
    def _load_resources(self):
        # Load ML model
        if os.path.exists(self.model_path):
            print(f"Loading ML model from {self.model_path}")
            try:
                self.model_pipeline = joblib.load(self.model_path)
            except Exception as e:
                print(f"Failed to load model: {e}")
        else:
            print("Model not found!")

        # Load food data
        if os.path.exists(self.food_data_path):
            print(f"Loading Food Data {self.food_data_path}")
            self.food_df = pd.read_csv(self.food_data_path)
            self._preprocess_food_data()
        else:
            print("Food data not found!")
            self.food_df = pd.DataFrame()

    # ---------------------------------------------------
    # PREPROCESS FOOD DATA (DOSHA SCORES)
    # ---------------------------------------------------
    def _preprocess_food_data(self):
        effect_map = {"Pacifies": 1, "Neutral": 0, "Aggravates": -1}

        for dosha in ["Vata", "Pitta", "Kapha"]:
            col = f"{dosha}Effect"
            score_col = f"{dosha}Score"

            if col in self.food_df.columns:
                self.food_df[score_col] = self.food_df[col].map(effect_map).fillna(0)

        # Normalize nutrition (for ranking)
        for col in ["Calories", "Protein", "Carbs", "Fats"]:
            try:
                if col in self.food_df.columns:
                    self.food_df[col] = pd.to_numeric(self.food_df[col], errors="coerce").fillna(0)
                else:
                    self.food_df[col] = 0
            except:
                self.food_df[col] = 0

    # ---------------------------------------------------
    # ML DOSHA PREDICTION (LAYER 1)
    # ---------------------------------------------------
    def predict_dosha(self, profile):
        if not self.model_pipeline:
            print("Model not loaded… fallback = Vata")
            return profile.get("Prakriti", "Vata")

        try:
            # Add missing columns with defaults if model needs them and they aren't provided
            # But normally profile dict should match what model expects
            # We wrap in DataFrame
            input_df = pd.DataFrame([profile])
            return self.model_pipeline.predict(input_df)[0]
        except Exception as e:
            print(f"Prediction error: {e}")
            return "Vata"

    # ---------------------------------------------------
    # ADVANCED DOSHA COMPATIBILITY SCORE (DCS)
    # ---------------------------------------------------
    def calculate_food_score(self, row, dosha):
        score = 0

        # 1. Dosha Effect (Weight = 4)
        base = row.get(f"{dosha}Score", 0)
        score += base * 4

        # 2. Virya (Weight = 3)
        virya = str(row.get("Virya", ""))
        if dosha == "Pitta":
            if virya == "Cooling": score += 3
            elif virya == "Heating": score -= 3
        elif dosha in ["Vata", "Kapha"]:
            if virya == "Heating": score += 3
            elif virya == "Cooling": score -= 3

        # 3. Rasa (Weight = 2)
        rasa = str(row.get("Rasa", ""))

        beneficial = {
            "Vata": ["Sweet", "Sour", "Salty"],
            "Pitta": ["Sweet", "Bitter", "Astringent"],
            "Kapha": ["Pungent", "Bitter", "Astringent"]
        }

        if rasa in beneficial.get(dosha, []):
            score += 2
        else:
            score -= 2

        # 4. Nutritional balance (Weight = 1)
        # Lower calories often better except Vata
        calories = row.get("Calories", 0)
        if dosha == "Kapha" and calories > 250:
            score -= 1
        if dosha == "Pitta" and calories > 350:
            score -= 1
        if dosha == "Vata" and calories < 100:
            score -= 1

        return score

    # ---------------------------------------------------
    # RANK ALL FOODS (NO RANDOM)
    # ---------------------------------------------------
    def rank_foods(self, dosha):
        if self.food_df.empty:
            return [], [], pd.DataFrame()

        df = self.food_df.copy()
        
        # Ensure Dosha-specific score column exists, else default to 0
        if f"{dosha}Score" not in df.columns:
            # If complex dosha "Vata-Pitta", logic needs update. 
            # For now, if hypenated, just take first part for scoring or fallback.
            pass

        df["DCS"] = df.apply(lambda r: self.calculate_food_score(r, dosha), axis=1)
        df = df.sort_values("DCS", ascending=False)

        recommended = df[df["DCS"] > 0]["FoodName"].tolist()
        avoid = df[df["DCS"] < 0]["FoodName"].tolist()

        return recommended, avoid, df

    # ---------------------------------------------------
    # DETERMINISTIC MEAL PLAN (NO RANDOM)
    # ---------------------------------------------------
    def generate_meal_plan(self, ranked_df):
        if ranked_df.empty:
            return []

        ranked_df = ranked_df.reset_index(drop=True)

        # Use the *top structure* foods
        best_foods = ranked_df.head(30).copy()

        # Categorize based on macros
        def category(row):
            p = row["Protein"]
            c = row.get("Carbs", 0)
            # Simple heuristic
            if p >= 10: return "protein"
            if c >= 20: return "grain"
            return "veg"

        best_foods["category"] = best_foods.apply(category, axis=1)

        proteins = best_foods[best_foods["category"] == "protein"]
        grains = best_foods[best_foods["category"] == "grain"]
        vegs = best_foods[best_foods["category"] == "veg"]

        # Helper to safely take item by index (modulo wrap)
        def take(df, idx):
            if df.empty: return "Seasonal Veg"
            return df.iloc[idx % len(df)]["FoodName"]

        days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

        plan = []
        for i, d in enumerate(days):
            plan.append({
                "day": d,
                "meals": [
                    {
                        "time":"08:00",
                        "type":"Breakfast",
                        "desc": "Energizing start",
                        "items":[take(proteins, i), take(vegs, i+1)]
                    },
                    {
                        "time":"13:00",
                        "type":"Lunch",
                        "desc": "Substantial meal",
                        "items":[take(grains, i), take(proteins, i+2), take(vegs, i+3)]
                    },
                    {
                        "time":"19:00",
                        "type":"Dinner",
                        "desc": "Light & Easy",
                        "items":[take(proteins, i+4), take(vegs, i+5)]
                    },
                ]
            })

        return plan

    # ---------------------------------------------------
    # FINAL OUTPUT WRAPPER
    # ---------------------------------------------------
    def generate_diet_chart(self, user):
        # Step 1 — Prepare Profile
        ml_input = {
            "Age": user.get("age", 30),
            "Gender": user.get("gender", "Male"),
            "Prakriti": user.get("prakriti", "Vata"),
            "Symptoms": user.get("symptoms", "None"),
            "ActivityLevel": user.get("activityLevel", "Moderate"),
            "SleepPattern": user.get("sleepPattern", "Regular (7-8hr)"),
            "DietaryHabits": user.get("dietaryHabits", "Vegetarian"),
            "LifestyleFactor": user.get("lifestyle", "Balanced")
        }

        # Step 2 — Predict Dosha
        dosha = str(self.predict_dosha(ml_input))
        
        # Handle Combined Dosha (e.g. Vata-Pitta) -> Use Primary for Food Logic
        primary = dosha.split("-")[0]

        # Step 3 — Rank Foods
        recommended, avoid, ranked_df = self.rank_foods(primary)

        # Step 4 — Meal Plan
        meal_plan = self.generate_meal_plan(ranked_df)

        # Step 5 — Final JSON
        return {
            "doshaImbalance": dosha,
            "prakriti": ml_input["Prakriti"],
            "recommendedFoods": recommended[:20],
            "avoidFoods": avoid[:20],
            "mealPlan": meal_plan,
            "recipes": [],
            "rationale": f"Foods selected by Ayurvedic DCS scoring for {primary} dosha.",
            "guidelines": self._guidelines(primary)
        }

    # ---------------------------------------------------
    def _guidelines(self, dosha):
        GUIDE = {
            "Vata":["Warm heavy foods","Avoid raw salad","Eat at same times"],
            "Pitta":["Cooling sweet foods","Avoid spicy","Avoid oily"],
            "Kapha":["Warm light foods","Avoid sugar","Avoid dairy"]
        }
        return GUIDE.get(dosha, ["Eat fresh, seasonal foods.", "Listen to your body."])

if __name__ == "__main__":
    # Test
    engine = AyurvedicRecommendationEngine()
    test_user = {
        "age": 30,
        "gender": "Female",
        "prakriti": "Pitta",
        "symptoms": "Acidity"
    }
    print(json.dumps(engine.generate_diet_chart(test_user), indent=2))
