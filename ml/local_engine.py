import json
import random
import os
import pandas as pd

class LocalDietEngine:
    def __init__(self, food_db_path):
        self.food_db = self._load_food_db(food_db_path)

    def _load_food_db(self, path):
        """Load food database from CSV file"""
        if os.path.exists(path):
            try:
                df = pd.read_csv(path)
                print(f"✓ Loaded {len(df)} foods from CSV: {path}")
                return df.to_dict('records')
            except Exception as e:
                print(f"✗ Error loading CSV: {e}")
                return self._get_fallback_data()
        else:
            print(f"✗ CSV not found at {path}, using fallback data")
            return self._get_fallback_data()
    
    def _get_fallback_data(self):
        """Fallback data if CSV is not available"""
        return [
            {"FoodName": "Moong Dal", "Rasa": "Sweet", "Virya": "Cold", "VataEffect": "Pacifies", "PittaEffect": "Pacifies", "KaphaEffect": "Aggravates"},
            {"FoodName": "Rice", "Rasa": "Sweet", "Virya": "Cooling", "VataEffect": "Pacifies", "PittaEffect": "Pacifies", "KaphaEffect": "Aggravates"},
            {"FoodName": "Ghee", "Rasa": "Sweet", "Virya": "Cold", "VataEffect": "Pacifies", "PittaEffect": "Pacifies", "KaphaEffect": "Aggravates"},
            {"FoodName": "Ginger", "Rasa": "Pungent", "Virya": "Hot", "VataEffect": "Pacifies", "PittaEffect": "Aggravates", "KaphaEffect": "Pacifies"},
            {"FoodName": "Cucumber", "Rasa": "Sweet", "Virya": "Cold", "VataEffect": "Aggravates", "PittaEffect": "Pacifies", "KaphaEffect": "Aggravates"},
        ]

    def generate_diet_plan(self, user_profile):
        """
        Generate personalized Ayurvedic diet plan based on user's dosha imbalance
        
        Args:
            user_profile (dict): Contains vikriti, prakriti, age, gender
        
        Returns:
            dict: Complete diet plan with meals, recommendations, and rationale
        """
        vikriti = user_profile.get('vikriti', 'Vata')
        prakriti = user_profile.get('prakriti', '')
        
        print(f"\n🔍 Generating diet for Vikriti: {vikriti}")
        
        # Filter foods that PACIFY the imbalance
        recommended_foods = []
        avoid_foods = []
        
        # Determine which column to check based on vikriti
        effect_column = f'{vikriti}Effect'
        
        for food in self.food_db:
            food_name = food.get('FoodName', food.get('name', 'Unknown'))
            dosha_effect = food.get(effect_column, '')
            
            if dosha_effect == 'Pacifies':
                recommended_foods.append(food)
            elif dosha_effect == 'Aggravates':
                avoid_foods.append(food)
        
        print(f"✓ Found {len(recommended_foods)} foods that pacify {vikriti}")
        print(f"✓ Found {len(avoid_foods)} foods to avoid")
        
        # Fallback if no foods found
        if not recommended_foods:
            print("⚠ No recommended foods found, using fallback")
            recommended_foods = self.food_db[:5]
        
        # Generate 7-day meal plan
        meal_plan = self._create_meal_plan(recommended_foods, vikriti)
        
        # Get top recommended and avoid foods
        top_recommended = [f.get('FoodName', f.get('name', 'Unknown')) for f in recommended_foods[:15]]
        top_avoid = [f.get('FoodName', f.get('name', 'Unknown')) for f in avoid_foods[:10]]
        
        return {
            "doshaImbalance": vikriti,
            "prakriti": prakriti,
            "recommendedFoods": top_recommended,
            "avoidFoods": top_avoid,
            "mealPlan": meal_plan,
            "recipes": [],
            "rationale": self._get_rationale(vikriti),
            "guidelines": self._get_dietary_guidelines(vikriti)
        }

    def _create_meal_plan(self, recommended_foods, vikriti):
        """Create a 7-day meal plan with variety"""
        meal_plan = []
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Ensure we have enough variety
        if len(recommended_foods) < 3:
            recommended_foods = self.food_db[:10]
        
        for day in days:
            daily_meals = []
            
            # Select different foods for each meal to ensure variety
            breakfast_foods = random.sample(recommended_foods, min(2, len(recommended_foods)))
            lunch_foods = random.sample(recommended_foods, min(3, len(recommended_foods)))
            dinner_foods = random.sample(recommended_foods, min(2, len(recommended_foods)))
            
            # Breakfast
            daily_meals.append({
                "time": "08:00",
                "type": "Breakfast",
                "items": [
                    breakfast_foods[0].get('FoodName', breakfast_foods[0].get('name', 'Oats')),
                    "Herbal Tea" if vikriti == "Vata" else "Green Tea" if vikriti == "Pitta" else "Ginger Tea"
                ]
            })
            
            # Lunch (main meal)
            daily_meals.append({
                "time": "13:00",
                "type": "Lunch",
                "items": [
                    lunch_foods[0].get('FoodName', lunch_foods[0].get('name', 'Rice')),
                    lunch_foods[1].get('FoodName', lunch_foods[1].get('name', 'Dal')) if len(lunch_foods) > 1 else "Vegetables",
                    "Buttermilk" if vikriti != "Kapha" else "Warm Water"
                ]
            })
            
            # Dinner (lighter meal)
            daily_meals.append({
                "time": "19:00",
                "type": "Dinner",
                "items": [
                    dinner_foods[0].get('FoodName', dinner_foods[0].get('name', 'Soup')),
                    "Warm Milk" if vikriti == "Vata" else "Herbal Tea"
                ]
            })
            
            meal_plan.append({"day": day, "meals": daily_meals})
        
        return meal_plan

    def _get_rationale(self, vikriti):
        """Get explanation for diet recommendations"""
        rationales = {
            "Vata": "Selected foods to pacify Vata dosha. Focus on warm, moist, grounding, and nourishing foods. Avoid cold, dry, and light foods.",
            "Pitta": "Selected foods to pacify Pitta dosha. Focus on cooling, sweet, and calming foods. Avoid hot, spicy, and acidic foods.",
            "Kapha": "Selected foods to pacify Kapha dosha. Focus on light, warm, and stimulating foods. Avoid heavy, oily, and cold foods."
        }
        return rationales.get(vikriti, "Balanced diet for overall wellness")

    def _get_dietary_guidelines(self, vikriti):
        """Get specific dietary guidelines for each dosha"""
        guidelines = {
            "Vata": [
                "Eat warm, cooked foods",
                "Include healthy fats like ghee",
                "Favor sweet, sour, and salty tastes",
                "Eat at regular times",
                "Avoid raw, cold, and dry foods"
            ],
            "Pitta": [
                "Eat cooling foods",
                "Favor sweet, bitter, and astringent tastes",
                "Avoid spicy, sour, and salty foods",
                "Eat moderate portions",
                "Include plenty of fresh vegetables"
            ],
            "Kapha": [
                "Eat light, warm foods",
                "Favor pungent, bitter, and astringent tastes",
                "Avoid heavy, oily, and sweet foods",
                "Eat smaller portions",
                "Include warming spices"
            ]
        }
        return guidelines.get(vikriti, [])

    def _get_attributes(self, dosha):
        """Get food attributes for each dosha (legacy method)"""
        if dosha == 'Vata': return "Warm, Oily, Grounding"
        if dosha == 'Pitta': return "Cooling, Sweet, Calming"
        if dosha == 'Kapha': return "Light, Warm, Stimulating"
        return "Balanced"
