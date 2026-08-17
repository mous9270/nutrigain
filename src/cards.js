// Nutrient values per 100g (approximate, for gameplay)
// carbs/protein/fibre in g, vitA in µg, vitB (B-complex proxy, mg),
// vitC in mg, calcium/potassium in mg, water in %, energy in kcal
export const CARDS = [
  { id: 1, name: "Banana", type: "fruit", carbs: 23, protein: 1.1, vitA: 3, vitB: 0.4, vitC: 8.7, calcium: 5, potassium: 358, water: 75, energy: 89, fibre: 2.6 },
  { id: 2, name: "Apple", type: "fruit", carbs: 14, protein: 0.3, vitA: 3, vitB: 0.05, vitC: 4.6, calcium: 6, potassium: 107, water: 86, energy: 52, fibre: 2.4 },
  { id: 3, name: "Mango", type: "fruit", carbs: 15, protein: 0.8, vitA: 54, vitB: 0.12, vitC: 36, calcium: 11, potassium: 168, water: 83, energy: 60, fibre: 1.6 },
  { id: 4, name: "Orange", type: "fruit", carbs: 12, protein: 0.9, vitA: 11, vitB: 0.06, vitC: 53, calcium: 40, potassium: 181, water: 87, energy: 47, fibre: 2.4 },
  { id: 5, name: "Guava", type: "fruit", carbs: 14, protein: 2.6, vitA: 31, vitB: 0.11, vitC: 228, calcium: 18, potassium: 417, water: 81, energy: 68, fibre: 5.4 },
  { id: 6, name: "Papaya", type: "fruit", carbs: 11, protein: 0.5, vitA: 47, vitB: 0.04, vitC: 61, calcium: 20, potassium: 182, water: 88, energy: 43, fibre: 1.7 },
  { id: 7, name: "Grapes", type: "fruit", carbs: 18, protein: 0.7, vitA: 3, vitB: 0.09, vitC: 3.2, calcium: 10, potassium: 191, water: 81, energy: 69, fibre: 0.9 },
  { id: 8, name: "Pomegranate", type: "fruit", carbs: 19, protein: 1.7, vitA: 0, vitB: 0.08, vitC: 10, calcium: 10, potassium: 236, water: 78, energy: 83, fibre: 4.0 },
  { id: 9, name: "Watermelon", type: "fruit", carbs: 8, protein: 0.6, vitA: 28, vitB: 0.05, vitC: 8.1, calcium: 7, potassium: 112, water: 91, energy: 30, fibre: 0.4 },
  { id: 10, name: "Pineapple", type: "fruit", carbs: 13, protein: 0.5, vitA: 3, vitB: 0.11, vitC: 48, calcium: 13, potassium: 109, water: 86, energy: 50, fibre: 1.4 },
  { id: 11, name: "Spinach", type: "veg", carbs: 3.6, protein: 2.9, vitA: 469, vitB: 0.2, vitC: 28, calcium: 99, potassium: 558, water: 91, energy: 23, fibre: 2.2 },
  { id: 12, name: "Carrot", type: "veg", carbs: 10, protein: 0.9, vitA: 835, vitB: 0.14, vitC: 5.9, calcium: 33, potassium: 320, water: 88, energy: 41, fibre: 2.8 },
  { id: 13, name: "Potato", type: "veg", carbs: 17, protein: 2.0, vitA: 0, vitB: 0.3, vitC: 19.7, calcium: 12, potassium: 425, water: 79, energy: 77, fibre: 2.2 },
  { id: 14, name: "Broccoli", type: "veg", carbs: 7, protein: 2.8, vitA: 31, vitB: 0.18, vitC: 89, calcium: 47, potassium: 316, water: 89, energy: 34, fibre: 2.6 },
  { id: 15, name: "Tomato", type: "veg", carbs: 3.9, protein: 0.9, vitA: 42, vitB: 0.08, vitC: 14, calcium: 10, potassium: 237, water: 94, energy: 18, fibre: 1.2 },
  { id: 16, name: "Sweet Potato", type: "veg", carbs: 20, protein: 1.6, vitA: 709, vitB: 0.21, vitC: 2.4, calcium: 30, potassium: 337, water: 77, energy: 86, fibre: 3.0 },
  { id: 17, name: "Cucumber", type: "veg", carbs: 3.6, protein: 0.7, vitA: 5, vitB: 0.04, vitC: 2.8, calcium: 16, potassium: 147, water: 95, energy: 15, fibre: 0.5 },
  { id: 18, name: "Peas", type: "veg", carbs: 14, protein: 5.4, vitA: 38, vitB: 0.27, vitC: 40, calcium: 25, potassium: 244, water: 79, energy: 81, fibre: 5.7 },
  { id: 19, name: "Beetroot", type: "veg", carbs: 10, protein: 1.6, vitA: 2, vitB: 0.07, vitC: 4.9, calcium: 16, potassium: 325, water: 88, energy: 43, fibre: 2.8 },
  { id: 20, name: "Cauliflower", type: "veg", carbs: 5, protein: 1.9, vitA: 0, vitB: 0.2, vitC: 48, calcium: 22, potassium: 299, water: 92, energy: 25, fibre: 2.0 },
];

export const CATEGORIES = [
  "carbs", "protein", "vitA", "vitB", "vitC",
  "calcium", "potassium", "water", "energy", "fibre",
];

export const CATEGORY_LABELS = {
  carbs: "Carbohydrates (g)",
  protein: "Protein (g)",
  vitA: "Vitamin A (µg)",
  vitB: "Vitamin B (mg)",
  vitC: "Vitamin C (mg)",
  calcium: "Calcium (mg)",
  potassium: "Potassium (mg)",
  water: "Water (%)",
  energy: "Energy (kcal)",
  fibre: "Fibre (g)",
};
