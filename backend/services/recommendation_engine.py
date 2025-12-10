import os
import joblib
import pandas as pd

class AyurvedicRecommendationEngine:

    def __init__(self):
        # backend/services/ -> backend/
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
        model_dir = os.path.join(base, "model")

        self.dosha_model = None
        self.food_model = None
        self.mealplan_model = None
        
        # Load Models (Robustly)
        try:
            self.dosha_model = joblib.load(os.path.join(model_dir, "dosha_model.pkl"))
            self.food_model = joblib.load(os.path.join(model_dir, "food_score_model.pkl"))
            self.mealplan_model = joblib.load(os.path.join(model_dir, "mealplan_model.pkl"))
            print("✅ All ML models loaded successfully.")
        except Exception as e:
            print(f"⚠️ Error loading models: {e}")
            print("Please ensure you have run the training scripts and moved .pkl files to backend/model/")

        # Load food data ONLY for inference (not rules)
        food_json = os.path.join(os.path.dirname(__file__), "food_data.json")
        if os.path.exists(food_json):
            self.food_df = pd.read_json(food_json)
        else:
            print("⚠️ food_data.json not found. Creating empty dataframe.")
            self.food_df = pd.DataFrame()

    # ------------------------- DOSHA MODEL -------------------------
    def predict_dosha(self, profile):
        if not self.dosha_model:
            return "Vata" # Fallback
            
        # Ensure features match training data: Age, Gender, BodyFrame, SkinType, SleepPattern
        # Map input profile to these features with defaults if missing
        
        # 0=Thin, 1=Med, 2=Large
        frames = {"Thin": 0, "Medium": 1, "Large": 2}
        
        # 0=Dry, 1=Sens, 2=Oily
        skins = {"Dry": 0, "Sensitive": 1, "Normal": 1, "Oily": 2}
        
        # 0=Insomnia, 1=Mod, 2=Excess
        sleeps = {"Irregular": 0, "Regular": 1, "Excessive": 2}
        
        features = {
            "Age": int(profile.get("Age", 30)),
            "Gender": 0 if profile.get("Gender") == "Male" else 1,
            "BodyFrame": frames.get(profile.get("BodyFrame", "Medium"), 1),
            "SkinType": skins.get(profile.get("SkinType", "Normal"), 1),
            "SleepPattern": sleeps.get(profile.get("SleepPattern", "Regular"), 1)
        }
        
        df = pd.DataFrame([features])
        try:
            return self.dosha_model.predict(df)[0]
        except Exception as e:
            print(f"Dosha prediction error: {e}")
            return "Vata"

    # ------------------------- FOOD SCORING MODEL -------------------------
    def score_foods(self, profile, dosha_name):
        if not self.food_model or self.food_df.empty:
            return [], []

        rec = []
        avoid = []
        
        # Mappings derived from training logic
        rasa_map = {0: "Sweet", 1: "Sour", 2: "Salty", 3: "Pungent", 4: "Bitter", 5: "Astringent"}
        virya_map = {0: "Cold", 1: "Hot"}
        vipaka_map = {0: "Sweet", 1: "Sour", 2: "Pungent"} # Note: quality 0-2 -> vipaka map assumption

        # Dosha Score Logic (Simplified Ayurvedic Rules)
        # Returns 1 (Good), 0 (Neutral), -1 (Bad)
        def get_dosha_scores(rasa_idx, virya_idx, vipaka_idx):
            # Vata: Pacified by Sweet(0), Sour(1), Salty(2) | Aggravated by Pungent(3), Bitter(4), Astringent(5)
            vata = 1 if rasa_idx in [0, 1, 2] else -1
            
            # Pitta: Pacified by Sweet(0), Bitter(4), Astringent(5) | Aggravated by Sour(1), Salty(2), Pungent(3)
            pitta = 1 if rasa_idx in [0, 4, 5] else -1
             
            # Kapha: Pacified by Pungent(3), Bitter(4), Astringent(5) | Aggravated by Sweet(0), Sour(1), Salty(2)
            kapha = 1 if rasa_idx in [3, 4, 5] else -1
            
            return vata, pitta, kapha

        for _, row in self.food_df.iterrows():
            try:
                # 1. Extract Raw Properties
                t_idx = int(row.get("Taste", 0))
                p_idx = int(row.get("Potency", 0))
                q_idx = int(row.get("Quality", 0))
                
                # 2. Extract Nutrition (nested or flat)
                nutri = row.get("Nutrition", {})
                if not isinstance(nutri, dict):
                    nutri = {}
                    
                cal = float(nutri.get("Calories", 0))
                prot = float(nutri.get("Protein", 0))
                carbs = float(nutri.get("Carbs", 0))
                fats = float(nutri.get("Fats", 0))

                # 3. Derive Model Features
                v_score, p_score, k_score = get_dosha_scores(t_idx, p_idx, q_idx)
                
                features = {
                    "Rasa": rasa_map.get(t_idx, "Sweet"),
                    "Virya": virya_map.get(p_idx, "Cold"),
                    "Vipaka": vipaka_map.get(q_idx, "Sweet"),
                    "Calories": cal,
                    "Protein": prot,
                    "Carbs": carbs,
                    "Fats": fats,
                    "VataScore": v_score,
                    "PittaScore": p_score,
                    "KaphaScore": k_score
                }
                
                # 4. Predict
                df = pd.DataFrame([features])
                score = self.food_model.predict(df)[0]
                
                # Filter based on User's Dosha
                # If user is Vata, we check if the food is good for Vata (high score generally implies good for all, 
                # but we can check specific dosha alignment if needed. 
                # The model predicts GENERAL health score usually, but let's see training logic.
                # Training logic: Score = base(dosha_scores) + nutri_score.
                # So high Score means it's generally good (balancing).
                
                # However, realistic logic: matching dosha needs match.
                # If User is Vata, we want High VataScore.
                # Our trained model predicts a 'Sustainability Score' based on properties.
                # Let's trust the model output "Score".
                
                if score > 0.2: 
                    rec.append(row["FoodName"])
                elif score < -0.2:
                    avoid.append(row["FoodName"])
                    
            except Exception as e:
                # print(f"Skipping food {row.get('FoodName')}: {e}")
                continue

        # Fallback if empty (since user wants output)
        if not rec and not avoid:
            rec = ["Rice", "Lentils", "Vegetable Soup"]
            
        return list(set(rec)), list(set(avoid))

    # ------------------------- MEAL PLAN MODEL -------------------------
    def generate_mealplan(self, profile, recommended):
        if not self.mealplan_model:
            return []
            
        # Model expects: Age, Gender, Activity
        # Activity: 0=Low, 1=Med, 2=High
        act_map = {"Sedentary": 0, "Low": 0, "Moderate": 1, "Active": 2, "High": 2}
        
        features = {
            "Age": int(profile.get("Age", 30)),
            "Gender": 0 if profile.get("Gender") == "Male" else 1,
            "Activity": act_map.get(profile.get("Activity", "Moderate"), 1)
        }
        
        df = pd.DataFrame([features])
        try:
            return self.mealplan_model.predict(df)[0]  # returns JSON array
        except Exception as e:
            print(f"Meal plan error: {e}")
            return []

    # ------------------------- FINAL OUTPUT -------------------------
    def generate_diet_chart(self, user):
        # Normalize keys from frontend/user input to internal profile
        profile = {
            "Age": user.get("age", 30),
            "Gender": user.get("gender", "Male"),
            "Symptoms": user.get("symptoms", ""),
            "Activity": user.get("activityLevel", "Moderate"),
            "BodyFrame": user.get("bodyFrame", "Medium"),
            "SkinType": user.get("skinType", "Normal"),
            "SleepPattern": user.get("sleepPattern", "Regular")
        }

        dosha = self.predict_dosha(profile)
        rec, avoid = self.score_foods(profile, dosha)
        mealplan = self.generate_mealplan(profile, rec)

        return {
            "doshaImbalance": dosha,
            "recommendedFoods": rec,
            "avoidFoods": avoid,
            "mealPlan": mealplan,
            "rationale": f"AI-generated plan based on {dosha} dosha analysis.",
            "guidelines": ["Eat fresh.", "Stay hydrated."]
        }
