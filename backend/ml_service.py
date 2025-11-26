import json
import sys
import os

# Add the ml directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))

try:
    from local_engine import LocalDietEngine
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback if path setup fails
    class LocalDietEngine:
        def __init__(self, db_path): 
            print("⚠ Using fallback LocalDietEngine")
        def generate_diet_plan(self, profile): 
            return {"error": "ML Engine not found"}

class MLService:
    def __init__(self):
        # Point to the actual CSV file
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'ml', 'ayurvedic_food_data.csv')
        print(f"🔧 Initializing ML Service with CSV: {csv_path}")
        self.engine = LocalDietEngine(csv_path)

    def generate_diet(self, patient_profile):

        print(f"\n📋 Generating diet for profile: {patient_profile}")
        result = self.engine.generate_diet_plan(patient_profile)
        print(f"✅ Diet plan generated successfully")
        return result

# Global instance
ml_service = MLService()

# Test function
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 TESTING ML SERVICE")
    print("="*60)
    
    # Test with different doshas
    test_profiles = [
        {
            "vikriti": "Vata",
            "prakriti": "Vata-Pitta",
            "age": 35,
            "gender": "Male"
        },
        {
            "vikriti": "Pitta",
            "prakriti": "Pitta",
            "age": 28,
            "gender": "Female"
        },
        {
            "vikriti": "Kapha",
            "prakriti": "Kapha",
            "age": 42,
            "gender": "Male"
        }
    ]
    
    for i, profile in enumerate(test_profiles, 1):
        print(f"\n{'='*60}")
        print(f"TEST {i}: {profile['vikriti']} Imbalance")
        print(f"{'='*60}")
        
        result = ml_service.generate_diet(profile)
        
        print(f"\n📊 RESULTS:")
        print(f"   Dosha Imbalance: {result.get('doshaImbalance')}")
        print(f"   Recommended Foods ({len(result.get('recommendedFoods', []))}): {', '.join(result.get('recommendedFoods', [])[:5])}...")
        print(f"   Avoid Foods ({len(result.get('avoidFoods', []))}): {', '.join(result.get('avoidFoods', [])[:5])}...")
        print(f"   Meal Plan Days: {len(result.get('mealPlan', []))}")
        print(f"   Rationale: {result.get('rationale')}")
        
        # Show sample day
        if result.get('mealPlan'):
            sample_day = result['mealPlan'][0]
            print(f"\n   📅 Sample Day ({sample_day['day']}):")
            for meal in sample_day['meals']:
                print(f"      {meal['time']} - {meal['type']}: {', '.join(meal['items'])}")
    
    print(f"\n{'='*60}")
    print("✅ ALL TESTS COMPLETED")
    print(f"{'='*60}\n")
