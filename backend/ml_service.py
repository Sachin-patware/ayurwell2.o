from services.recommendation_engine import AyurvedicRecommendationEngine

class MLService:
    def __init__(self):
        print(f"🔧 Initializing ML Service...")
        # The new engine handles its own model loading from backend/model/
        self.engine = AyurvedicRecommendationEngine()

    def generate_diet(self, patient_profile):
        print(f"\n📋 Generating diet for profile: {patient_profile}")
        
        # Ensure profile has necessary fields
        if 'symptoms' not in patient_profile:
            patient_profile['symptoms'] = "None"
            
        result = self.engine.generate_diet_chart(patient_profile)
        print(f"Diet plan generated successfully")
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
