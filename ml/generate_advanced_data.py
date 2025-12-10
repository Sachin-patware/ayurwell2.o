import pandas as pd
import random
import os

# Configuration
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'ayurvedic_ml_dataset_advanced.csv')
NUM_SAMPLES = 2000

# Feature Domain Definitions
GENDERS = ["Male", "Female"]
PRAKRITI_TYPES = ["Vata", "Pitta", "Kapha", "Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Tridosha"]
VIKRITI_TYPES = ["Vata", "Pitta", "Kapha", "Vata-Pitta", "Pitta-Kapha", "Vata-Kapha"]
ACTIVITY_LEVELS = ["Sedentary", "Moderate", "Active", "Very Active"]
SLEEP_PATTERNS = ["Regular (7-8hr)", "Irregular", "Insomnia", "Excessive (>9hr)", "Disturbed"]
DIETARY_HABITS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Irregular Meals", "Spicy/Oily Heavy", "Sweet/Dairy Heavy"]

# Symptom & Lifestyle Mapping (Causal Logic)
# Format: (Feature Value) -> {Probable Dosha Imbalance contribution}
SYMPTOMS_MAP = {
    "Vata": ["Dry Skin", "Constipation", "Anxiety", "Insomnia", "Joint Pain", "Cold Hands", "Bloating", "Fatigue", "Light Sleep"],
    "Pitta": ["Acidity", "Anger", "Inflammation", "Skin Rashes", "Excessive Heat", "Migraine", "Burning Sensation", "Red Eyes", "Loose Stools"],
    "Kapha": ["Lethargy", "Weight Gain", "Congestion", "Depression", "Oily Skin", "Slow Digestion", "Excessive Sleep", "Water Retention", "Sinusitis"]
}

LIFESTYLE_CAUSES = {
    # Vata Causes
    "Irregular Sleep": "Vata", "Excess Travel": "Vata", "High Stress": "Vata", "Skipping Meals": "Vata",
    # Pitta Causes
    "High Alcohol": "Pitta", "Smoking": "Pitta", "Overworking": "Pitta", "Spicy Food": "Pitta",
    # Kapha Causes
    "Sedentary": "Kapha", "Daytime Sleep": "Kapha", "Overeating": "Kapha", "Heavy/Sweet Food": "Kapha"
}

def get_weighted_imbalance(prakriti, symptoms_list, lifestyle):
    """
    Determine the most likely Dosha Imbalance based on inputs using a scoring system.
    """
    scores = {"Vata": 0, "Pitta": 0, "Kapha": 0}
    
    # 1. Prakriti Effect (Constitution predisposes imbalance)
    # If you are Vata, you are more likely to get Vata imbalance
    for dosha in ["Vata", "Pitta", "Kapha"]:
        if dosha in prakriti:
            scores[dosha] += 1
            
    # 2. Symptom Effect (Strongest Indicator)
    for sym in symptoms_list:
        if sym in SYMPTOMS_MAP["Vata"]: scores["Vata"] += 3
        if sym in SYMPTOMS_MAP["Pitta"]: scores["Pitta"] += 3
        if sym in SYMPTOMS_MAP["Kapha"]: scores["Kapha"] += 3
        
    # 3. Lifestyle Effect
    if lifestyle in LIFESTYLE_CAUSES:
        caused_dosha = LIFESTYLE_CAUSES[lifestyle]
        scores[caused_dosha] += 2
        
    # Determine Winner
    # Sort doshas by score desc
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    winner, score1 = sorted_scores[0]
    runner_up, score2 = sorted_scores[1]
    
    # Logic for Dual Dosha
    if score2 > 0 and score1 - score2 <= 2: # Close call
        # e.g. Vata (10), Pitta (9) -> Vata-Pitta
        # Sort alphabetically for consistency
        d1, d2 = sorted([winner, runner_up])
        return f"{d1}-{d2}"
    
    return winner

def generate_data():
    data = []
    print(f"Generating {NUM_SAMPLES} synthetic records...")
    
    for _ in range(NUM_SAMPLES):
        # random basic attributes
        age = random.randint(18, 85)
        gender = random.choice(GENDERS)
        prakriti = random.choice(PRAKRITI_TYPES)
        activity = random.choice(ACTIVITY_LEVELS)
        sleep = random.choice(SLEEP_PATTERNS)
        diet = random.choice(DIETARY_HABITS)
        
        # Select random symptoms (1 to 3 symptoms)
        # We allow mixing symptoms from different doshas to create realistic complex cases
        all_symptoms = SYMPTOMS_MAP["Vata"] + SYMPTOMS_MAP["Pitta"] + SYMPTOMS_MAP["Kapha"]
        num_symptoms = random.randint(1, 3)
        selected_symptoms = random.sample(all_symptoms, num_symptoms)
        primary_symptom = selected_symptoms[0] # Use this for simpler CSV column if needed, but we save all
        
        # Select Lifestyle Factor
        lifestyle_factors = list(LIFESTYLE_CAUSES.keys()) + ["Balanced", "Active", "None"]
        lifestyle = random.choice(lifestyle_factors)
        
        # Calculate Ground Truth Label
        imbalance_label = get_weighted_imbalance(prakriti, selected_symptoms, lifestyle)
        
        data.append({
            "Age": age,
            "Gender": gender,
            "Prakriti": prakriti,
            "ActivityLevel": activity,
            "SleepPattern": sleep,
            "DietaryHabits": diet,
            "LifestyleFactor": lifestyle,
            "Symptoms": ";".join(selected_symptoms), # delimited string
            "DoshaImbalance": imbalance_label
        })
        
    df = pd.DataFrame(data)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"✅ Advanced Dataset Saved: {OUTPUT_FILE} ({len(df)} rows)")

if __name__ == "__main__":
    generate_data()
