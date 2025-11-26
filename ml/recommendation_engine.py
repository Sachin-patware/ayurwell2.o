import pandas as pd

class DietRecommender:
    def __init__(self, data_path="ml/ayurvedic_food_data.csv"):
        try:
            self.df = pd.read_csv(data_path)
        except FileNotFoundError:
            print("Data file not found. Please run data_generator.py first.")
            self.df = pd.DataFrame()

    def recommend_diet(self, prakriti, vikriti):
        """
        Recommends diet based on Vikriti (current imbalance).
        If Vikriti is balanced, falls back to Prakriti.
        """
        target_dosha = vikriti if vikriti else prakriti
        
        recommendations = []
        
        if not self.df.empty:
            # Filter foods that PACIFY the aggravated Dosha
            if target_dosha == 'Vata':
                recommendations = self.df[self.df['VataEffect'] == 'Pacifies']
            elif target_dosha == 'Pitta':
                recommendations = self.df[self.df['PittaEffect'] == 'Pacifies']
            elif target_dosha == 'Kapha':
                recommendations = self.df[self.df['KaphaEffect'] == 'Pacifies']
            
            # Sort by some nutritional value or random shuffle for variety
            return recommendations.sample(min(len(recommendations), 10)).to_dict(orient='records')
        
        return []

if __name__ == "__main__":
    recommender = DietRecommender("ayurvedic_food_data.csv") # Adjust path for local run
    plan = recommender.recommend_diet("Vata", "Pitta")
    print("Recommended Diet for High Pitta:", plan)
