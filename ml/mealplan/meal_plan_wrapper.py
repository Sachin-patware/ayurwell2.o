import json

class MealPlanModel:
    def __init__(self, classifier, templates):
        self.classifier = classifier
        self.templates = templates

    def predict(self, X):
        """
        X = pandas.DataFrame with columns:
        ["Age", "Gender", "Activity", "Dosha"]
        """
        result = []
        preds = self.classifier.predict(X)

        for p in preds:
            result.append(self.templates[int(p)])

        return result
