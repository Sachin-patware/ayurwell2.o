import pandas as pd
import random

# Ayurvedic properties
RASAS = ['Sweet', 'Sour', 'Salty', 'Pungent', 'Bitter', 'Astringent']
VIRYA = ['Heating', 'Cooling']
VIPAKA = ['Sweet', 'Sour', 'Pungent']
DOSHAS = ['Vata', 'Pitta', 'Kapha']

# Common food items to use as a base
FOOD_ITEMS = [
    "Rice", "Wheat", "Barley", "Quinoa", "Oats",
    "Mung Dal", "Lentils", "Chickpeas", "Black Beans", "Kidney Beans",
    "Milk", "Ghee", "Yogurt", "Paneer", "Butter",
    "Apple", "Banana", "Pomegranate", "Grapes", "Mango",
    "Spinach", "Kale", "Carrot", "Potato", "Sweet Potato",
    "Ginger", "Turmeric", "Cumin", "Coriander", "Black Pepper",
    "Almonds", "Walnuts", "Sunflower Seeds", "Pumpkin Seeds", "Sesame Seeds"
]

def generate_ayurvedic_data(n=100):
    data = []
    for i in range(n):
        food_name = random.choice(FOOD_ITEMS) + f"_{i}" # Unique names for synthetic expansion
        rasa = random.choice(RASAS)
        virya = random.choice(VIRYA)
        vipaka = random.choice(VIPAKA)
        
        # Simplified logic for Dosha effects based on properties (Rule-based generation)
        # This is a simplification for the synthetic dataset.
        
        # Vata is aggravated by Bitter, Astringent, Pungent; Pacified by Sweet, Sour, Salty
        vata_effect = "Pacifies" if rasa in ['Sweet', 'Sour', 'Salty'] else "Aggravates"
        
        # Pitta is aggravated by Pungent, Sour, Salty; Pacified by Sweet, Bitter, Astringent
        pitta_effect = "Pacifies" if rasa in ['Sweet', 'Bitter', 'Astringent'] and virya == 'Cooling' else "Aggravates"
        
        # Kapha is aggravated by Sweet, Sour, Salty; Pacified by Pungent, Bitter, Astringent
        kapha_effect = "Pacifies" if rasa in ['Pungent', 'Bitter', 'Astringent'] else "Aggravates"

        data.append({
            "FoodName": food_name.split('_')[0], # Keep base name clean
            "Rasa": rasa,
            "Virya": virya,
            "Vipaka": vipaka,
            "VataEffect": vata_effect,
            "PittaEffect": pitta_effect,
            "KaphaEffect": kapha_effect,
            "Calories": random.randint(50, 400), # Random nutritional info
            "Protein": random.randint(1, 20),
            "Carbs": random.randint(5, 50),
            "Fats": random.randint(0, 15)
        })
    
    return pd.DataFrame(data)

if __name__ == "__main__":
    df = generate_ayurvedic_data(200)
    df.to_csv("ayurvedic_food_data.csv", index=False)
    print("Synthetic Ayurvedic food data generated: ayurvedic_food_data.csv")
