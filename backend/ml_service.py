import json
import sys
import os

# Add the ml directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))

try:
    from recommendation_engine import AyurvedicRecommendationEngine
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback
    class AyurvedicRecommendationEngine:
        def __init__(self, model_path=None, food_data_path=None): 
            print("⚠ Using fallback Engine (Import Failed)")
        def generate_diet_chart(self, profile): 
            return {"error": "ML Engine not found"}

class MLService:
    def __init__(self):
        # Paths are handled internally by the Engine class defaults, 
        # but we can explicitly pass them if needed.
        # The Engine expects model at ../backend/model/model.pkl relative to itself
        # or we can pass absolute paths.
        
        base_dir = os.path.dirname(__file__)
        model_path = os.path.join(base_dir, 'model', 'model.pkl')
        food_path = os.path.join(base_dir, '..', 'ml', 'ayurvedic_food_data.csv')
        
        print(f"🔧 Initializing ML Service...")
        print(f"   Model: {model_path}")
        print(f"   Food: {food_path}")
        
        self.engine = AyurvedicRecommendationEngine(model_path, food_path)

    def generate_diet(self, patient_profile):
        print(f"\n📋 Generating diet for profile: {patient_profile}")
        
        # Ensure profile has necessary fields
        # If 'symptoms' is missing, try to infer or set default
        if 'symptoms' not in patient_profile:
            patient_profile['symptoms'] = "None"
            
        result = self.engine.generate_diet_chart(patient_profile)
        print(f"✅ Diet plan generated successfully")
        return result

# Global instance
ml_service = MLService()

# Test function
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 TESTING ML SERVICE")
    print("="*60)
    
    test_profiles = [
        {
            "prakriti": "Vata",
            "age": 35,
            "gender": "Male",
            "symptoms": "Joint Pain" 
        },
        {
            "prakriti": "Pitta",
            "age": 28,
            "gender": "Female",
            "symptoms": "Acidity"
        }
    ]
    
    for i, profile in enumerate(test_profiles, 1):
        print(f"\n{'='*60}")
        print(f"TEST {i}: {profile}")
        
        result = ml_service.generate_diet(profile)
        
        print(f"Dosha Imbalance: {result.get('doshaImbalance')}")
        print(f"Rec Foods: {len(result.get('recommendedFoods', []))}")
