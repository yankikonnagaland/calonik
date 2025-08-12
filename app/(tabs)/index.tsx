import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Mock search results
const mockFoodResults = [
  {
    name: "Apple",
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fats: 0.2,
    fiber: 2.4,
    units: ["grams", "pieces"],
  },
  {
    name: "Rice",
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fats: 0.3,
    fiber: 0.4,
    units: ["grams", "cups", "bowls"],
  },
];

export default function FoodTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("grams");
  const [quantity, setQuantity] = useState("1");
  const [todaySummary, setTodaySummary] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    weight: 75,
  });

  const handleSearch = () => {
    const results = mockFoodResults.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleAddFood = (food: any) => {
    const qty = parseFloat(quantity) || 1;
    setTodaySummary((prev) => ({
      calories: prev.calories + food.calories * qty,
      protein: prev.protein + food.protein * qty,
      carbs: prev.carbs + food.carbs * qty,
      fats: prev.fats + food.fats * qty,
      fiber: prev.fiber + food.fiber * qty,
      weight: prev.weight,
    }));
    setSearchQuery("");
    setSearchResults([]);
  };

  const MacroBox = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.macroBox}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Food Search Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Food Search</Text>
        <TextInput
          style={styles.input}
          placeholder="Search food..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>

        {searchResults.map((food, idx) => (
          <View key={idx} style={{ marginTop: 16 }}>
            <Text style={styles.foodName}>{food.name}</Text>
            <View style={styles.foodRow}>
              <TextInput
                style={styles.quantityInput}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <View style={styles.unitPickerWrapper}>
                <Picker
                  selectedValue={selectedUnit}
                  onValueChange={(itemValue) => setSelectedUnit(itemValue)}
                  dropdownIconColor="#fff"
                  style={styles.unitPicker}
                  itemStyle={{ backgroundColor: "#111", color: "#fff" }}
                >
                  {food.units.map((unit: string) => (
                    <Picker.Item
                      key={unit}
                      label={unit}
                      value={unit}
                      color="#fff"
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.macroGrid}>
              <MacroBox label="Calories" value={`${food.calories}`} />
              <MacroBox label="Protein" value={`${food.protein}g`} />
              <MacroBox label="Carbs" value={`${food.carbs}g`} />
              <MacroBox label="Fats" value={`${food.fats}g`} />
              <MacroBox label="Fiber" value={`${food.fiber}g`} />
            </View>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => handleAddFood(food)}
            >
              <Text style={styles.addBtnText}>Add to meal</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f1115",
    flex: 1,
  },
  sectionCard: {
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#141824",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1c1f2b",
    color: "#fff",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  searchBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  foodName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },
  foodRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: "#1c1f2b",
    color: "#fff",
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
  },
  unitPickerWrapper: {
    flex: 1,
    backgroundColor: "#1c1f2b",
    borderRadius: 6,
    overflow: "hidden",
  },
  unitPicker: {
    color: "#fff",
    height: 44,
    backgroundColor: "#1c1f2b",
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  macroBox: {
    width: "48%",
    backgroundColor: "#1c1f2b",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  macroLabel: {
    color: "#999",
    fontSize: 12,
  },
  macroValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  addBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
