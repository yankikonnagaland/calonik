import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGrad } from "react-native-svg";

/* ================== HSL → rgba helper (for Tailwind tokens) ================== */
function hsl(h: number, s: number, l: number, a = 1): string {
  const _s = s / 100, _l = l / 100;
  const c = (1 - Math.abs(2 * _l - 1)) * _s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = _l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return `rgba(${R},${G},${B},${a})`;
}

/* ================== Tailwind dark tokens (exact) ================== */
const TOK = {
  background: hsl(222.2, 84, 4.9),
  foreground: hsl(210, 40, 98),
  card: hsl(222.2, 84, 4.9),
  cardFg: hsl(210, 40, 98),
  primary: hsl(210, 40, 98),
  primaryFg: hsl(222.2, 47.4, 11.2),
  secondary: hsl(217.2, 32.6, 17.5),
  secondaryFg: hsl(210, 40, 98),
  muted: hsl(217.2, 32.6, 17.5),
  mutedFg: hsl(215, 20.2, 65.1),
  accent: hsl(217.2, 32.6, 17.5),
  accentFg: hsl(210, 40, 98),
  destructive: hsl(0, 62.8, 30.6),
  destructiveFg: hsl(210, 40, 98),
  border: hsl(217.2, 32.6, 17.5),
  input: hsl(217.2, 32.6, 17.5),
  ring: hsl(212.7, 26.8, 83.9),
  dateBtnBg: "#9333ea",
  dateBtnBorder: hsl(270, 83, 75),
  headerGradA: "rgba(16,185,129,0.10)",
  headerGradB: "rgba(59,130,246,0.10)",
  donutA: "#10B981",
  donutB: "#3B82F6",
  donutC: "#8B5CF6",
  mint: "#5eead4",
  amber: "#fbbf24",
  cyan: "#22d3ee",
  violet: "#a78bfa",
};

/* ================== Types & helpers ================== */
type Macros = { calories: number; protein: number; fat: number; carbs: number; fiber: number; grams: number };
type Food = { id: string; name: string; base: Macros; units: string[]; unitToGrams?: Record<string, number> };

const CATALOG: Food[] = [
  { id: "roti", name: "Roti", base: { calories: 110, protein: 3, fat: 3, carbs: 18, fiber: 2, grams: 40 }, units: ["piece", "grams"], unitToGrams: { piece: 40 } },
  { id: "milk", name: "Milk (toned)", base: { calories: 60, protein: 3, fat: 3, carbs: 5, fiber: 0, grams: 100 }, units: ["ml", "cup", "grams"], unitToGrams: { cup: 240, ml: 1 } },
  { id: "chicken", name: "Chicken Breast (cooked)", base: { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, grams: 100 }, units: ["grams", "piece"], unitToGrams: { piece: 120 } },
];

const searchFoods = (q: string) => (q.trim() ? CATALOG.filter(f => f.name.toLowerCase().includes(q.toLowerCase())) : []);
const scaleMacros = (base: Macros, g: number) => {
  const k = g / (base.grams || 1);
  const r = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: Math.round(base.calories * k),
    protein: r(base.protein * k),
    fat: r(base.fat * k),
    carbs: r(base.carbs * k),
    fiber: r(base.fiber * k),
    grams: Math.round(g),
  };
};
const gramsFor = (qty: number, u: string, f: Food | null) =>
  !f ? 0 : (u === "grams" || u === "g" || u === "ml") ? qty : (f.unitToGrams?.[u] ?? 1) * qty;

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/* ================== Reusable shells ================== */
const Card: React.FC<{ children: React.ReactNode; style?: any; title?: string; iconLeft?: React.ReactNode }> = ({ children, style, title, iconLeft }) => (
  <View style={[styles.card, style]}>
    {title && (
      <View style={styles.rowCenter}>
        {iconLeft}
        <Text style={[styles.h6, { marginLeft: iconLeft ? 8 : 0 }]}>{title}</Text>
      </View>
    )}
    {children}
  </View>
);

const SmallSummaryTile = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <View style={styles.tile}>
    <View style={[styles.tileAccent, { backgroundColor: accent }]} />
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={[styles.tileValue, { color: accent }]}>{value}</Text>
  </View>
);

/* ================== Custom dark Unit dropdown (modal) ================== */
function UnitSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={frc.selectBox}>
        <Text style={frc.selectText}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={TOK.mutedFg} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={frc.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={frc.modalSheet}>
            <Text style={frc.modalTitle}>Select unit</Text>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[frc.modalItem, value === opt && frc.modalItemActive]}
                onPress={() => { onChange(opt); setOpen(false); }}
              >
                <Text style={[frc.modalItemText, value === opt && frc.modalItemTextActive]}>{opt}</Text>
                {value === opt && <Ionicons name="checkmark" size={16} color={TOK.ring} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ================== Food Result Card (2×2 + Fiber full width) ================== */
const UI = {
  inner: hsl(222, 84, 7),
  input: TOK.input,
  title: TOK.foreground,
  label: TOK.mutedFg,
  tileBorder: "rgba(255,255,255,0.06)",
  blue: ["#0F2A66", "#0C1F4A"] as const,
  green: ["#0F3D2D", "#0B2C21"] as const,
  orange: ["#3B2713", "#2A1C0D"] as const,
  red: ["#3A1618", "#2A1012"] as const,
  btnA: "#2575FC",
  btnB: "#20C997",
} as const;

const MacroTile = ({ title, value, colors }: { title: string; value: string; colors: readonly [string, string] }) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={frc.tileHalf}>
    <Text style={frc.tileValue}>{value}</Text>
    <Text style={frc.tileLabel}>{title}</Text>
  </LinearGradient>
);
const MacroTileFull = ({ title, value, colors }: { title: string; value: string; colors: readonly [string, string] }) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={frc.tileFull}>
    <Text style={frc.tileValue}>{value}</Text>
    <Text style={frc.tileLabel}>{title}</Text>
  </LinearGradient>
);

type FoodResultProps = {
  name: string;
  units: string[];
  unit: string;
  setUnit: (v: string) => void;
  qty: string;
  setQty: (v: string) => void;
  macros: { calories: number; protein: number; carbs: number; fat: number; fiber: number } | null;
  onAdd: () => void;
};
const FoodResultCard = ({ name, units, unit, setUnit, qty, setQty, macros, onAdd }: FoodResultProps) => (
  <View style={frc.wrap}>
    <Text style={frc.title}>{name}</Text>

    {/* Quantity + Unit */}
    <View style={frc.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={frc.label}>Quantity</Text>
        <TextInput
          keyboardType="numeric"
          value={qty}
          onChangeText={setQty}
          style={frc.input}
          placeholder="1"
          placeholderTextColor={UI.label}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={frc.label}>Unit</Text>
        <UnitSelect value={unit} onChange={setUnit} options={units} />
      </View>
    </View>

    {/* 2×2 grid + Fiber full width */}
    <View style={frc.grid}>
      <MacroTile title="Calories" value={macros ? `${macros.calories}` : "—"} colors={UI.blue} />
      <MacroTile title="Protein"  value={macros ? `${macros.protein}g` : "—"} colors={UI.green} />
      <MacroTile title="Carbs"    value={macros ? `${macros.carbs}g`   : "—"} colors={UI.orange} />
      <MacroTile title="Fat"      value={macros ? `${macros.fat}g`     : "—"} colors={UI.red} />
    </View>
    <View style={{ marginTop: 6 }}>
      <MacroTileFull title="Fiber" value={macros ? `${macros.fiber}g` : "—"} colors={UI.blue} />
    </View>

    <TouchableOpacity activeOpacity={0.9} onPress={onAdd} style={{ marginTop: 14 }}>
      <LinearGradient colors={[UI.btnA, UI.btnB] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={frc.addBtn}>
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={frc.addText}>  Add {qty} {unit} to Meal</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

/* ================== Donut ================== */
function CalorieDonut({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, (current / Math.max(target, 1)) * 100);
  const radius = 16;
  const c = 2 * Math.PI * radius;
  const dashOffset = c - (pct / 100) * c;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 48, height: 48 }}>
        <Svg width="100%" height="100%" viewBox="0 0 40 40" style={{ transform: [{ rotate: "-90deg" }] }}>
          <Defs>
            <SvgGrad id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={TOK.donutA} />
              <Stop offset="50%" stopColor={TOK.donutB} />
              <Stop offset="100%" stopColor={TOK.donutC} />
            </SvgGrad>
          </Defs>
          <Circle cx="20" cy="20" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="none" />
          <Circle cx="20" cy="20" r={radius} stroke="url(#grad)" strokeWidth="3" fill="none" strokeDasharray={c} strokeDashoffset={dashOffset} strokeLinecap="round" />
        </Svg>
        <View style={{ position: "absolute", inset: 0, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: TOK.mutedFg, fontSize: 11, fontWeight: "700" }}>{Math.round(pct)}%</Text>
        </View>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ color: TOK.mutedFg, fontSize: 11, fontWeight: "600" }}>Goal</Text>
        <Text style={{ color: TOK.foreground, fontSize: 12, fontWeight: "700" }}>{Math.round(current)}/{target}</Text>
      </View>
    </View>
  );
}

/* ================== Screen ================== */
export default function Index(): React.ReactElement {
  // goals
  const [targetCalories, setTargetCalories] = useState(2000);
  const [caloriesOut, setCaloriesOut] = useState(0);
  const [weight] = useState(75.4);

  // date & logs
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [foodLogs, setFoodLogs] = useState<Record<string, Array<{ name: string; grams: number; calories: number; protein: number; fat: number; carbs: number; fiber: number }>>>({});
  const dayFoods = foodLogs[selectedDate.toDateString()] || [];
  const consumed = dayFoods.reduce((s, f) => s + (f.calories || 0), 0);
  const totalProtein = dayFoods.reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs = dayFoods.reduce((s, f) => s + (f.carbs || 0), 0);
  const totalFat = dayFoods.reduce((s, f) => s + (f.fat || 0), 0);
  const totalFiber = dayFoods.reduce((s, f) => s + (f.fiber || 0), 0);
  const net = consumed - caloriesOut;

  // search state
  const [query, setQuery] = useState("");
  const results = useMemo<Food[]>(() => searchFoods(query), [query]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("grams");
  const scaled = useMemo(() => (selectedFood ? scaleMacros(selectedFood.base, gramsFor(Number(qty || 0), unit, selectedFood)) : null), [selectedFood, qty, unit]);

  const addToToday = () => {
    if (!selectedFood || !scaled) return;
    setFoodLogs(prev => {
      const key = selectedDate.toDateString();
      const arr = prev[key]?.slice() || [];
      arr.push({
        name: selectedFood.name,
        grams: scaled.grams,
        calories: scaled.calories,
        protein: scaled.protein,
        fat: scaled.fat,
        carbs: scaled.carbs,
        fiber: scaled.fiber
      });
      return { ...prev, [key]: arr };
    });
    // clear selection + search
    setSelectedFood(null);
    setQty("1");
    setUnit("grams");
    setQuery("");
  };

  // camera mocks (hooked later to AI)
  const pickImage = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (lib.status !== "granted") { Alert.alert("Permission needed", "Allow Photos to pick an image."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled) { setSelectedFood(CATALOG[0]); setQty("1"); setUnit("piece"); }
  };
  const openCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (cam.status !== "granted") { Alert.alert("Permission needed", "Allow Camera to capture."); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!res.canceled) { setSelectedFood(CATALOG[1]); setQty("240"); setUnit("ml"); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={[styles.card, { padding: 14, backgroundColor: TOK.card, overflow: "hidden" }]}>
        <LinearGradient colors={[TOK.headerGradA, TOK.headerGradB] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.rowBetween, { alignItems: "center" }]}>
          <Text style={[styles.h6, { fontSize: 16 }]}>Food Tracker</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8}}>
            <CalorieDonut current={consumed} target={targetCalories} />
            <TouchableOpacity onPress={()=>{}} style={styles.dateBtn} activeOpacity={0.9}>
              <Ionicons name="calendar" size={14} color="#fff" />
              <Text style={styles.dateBtnText}> {selectedDate.toLocaleDateString(undefined,{ month:"short", day:"numeric" })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Daily Goal */}
      <Card style={{ marginTop: 12 }}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.h6}>Daily Goal</Text>
            <Text style={styles.h4}>{consumed} / {targetCalories} cal</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
           
          </View>
        </View>
      </Card>

      {/* Date section — bordered */}
      <Card style={[{ marginTop: 12 }, styles.sectionCard]}>
        <View style={styles.rowBetween}>
          <TouchableOpacity onPress={()=>setSelectedDate(addDays(selectedDate,-1))} style={styles.iconBtn}><Text style={styles.iconTxt}>◀</Text></TouchableOpacity>
          <Text style={styles.h6}>{selectedDate.toLocaleDateString(undefined,{ weekday:"short", month:"short", day:"numeric" })}</Text>
          <View style={{ flexDirection:"row" }}>
            <TouchableOpacity onPress={()=>setSelectedDate(new Date())} style={[styles.chip, { marginRight:8 }]}><Text style={styles.chipTxt}>Today</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setSelectedDate(addDays(selectedDate,1))} style={styles.iconBtn}><Text style={styles.iconTxt}>▶</Text></TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Food Search — bordered (TALLER) */}
      <Card
        style={[{ marginTop: 12 }, styles.sectionCard, styles.tallCard]}
        title="Food Search"
        iconLeft={<Ionicons name="search" size={16} color={TOK.mutedFg} />}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={TOK.mutedFg} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search (e.g., roti, milk, chicken)" placeholderTextColor={TOK.mutedFg} style={styles.searchInput}/>
          {query.length>0 && (<TouchableOpacity onPress={()=>setQuery("")}><Ionicons name="close" size={18} color={TOK.mutedFg} /></TouchableOpacity>)}
        </View>

        {results.length>0 && (
          <View style={{ paddingVertical:8, flexDirection:"row" }}>
            {results.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={()=>{ setSelectedFood(item); setUnit(item.units[0]||"grams"); setQty("1"); }}
                style={styles.result}
              >
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.muted}>{item.base.calories} kcal / {item.base.grams}g</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedFood && (
          <View style={{ marginTop: 12 }}>
            <FoodResultCard
              name={selectedFood.name}
              units={selectedFood.units?.length ? selectedFood.units : ["grams"]}
              unit={unit}
              setUnit={setUnit}
              qty={qty}
              setQty={setQty}
              macros={ scaled ? { calories: scaled.calories, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat, fiber: scaled.fiber } : null }
              onAdd={addToToday}
            />
          </View>
        )}
      </Card>

      {/* === CONDITIONAL MID SUMMARY (shows only when a food is selected) === */}
      {selectedFood && scaled && (
        <View style={[styles.sectionCard, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Selected Food Summary</Text>
          <View style={styles.summaryGridAlt}>
            <MacroTile title="Calories" value={`${scaled.calories}`} colors={UI.blue} />
            <MacroTile title="Protein"  value={`${scaled.protein}g`} colors={UI.green} />
            <MacroTile title="Carbs"    value={`${scaled.carbs}g`} colors={UI.orange} />
            <MacroTile title="Fats"     value={`${scaled.fat}g`} colors={UI.red} />
          </View>
          <View style={{ marginTop: 6 }}>
            <MacroTileFull title="Fiber" value={`${scaled.fiber}g`} colors={UI.blue} />
          </View>
        </View>
      )}

      {/* AI Food Camera — bordered (TALLER + SPACED TEXT) */}
      <Card
        style={[{ marginTop: 14 }, styles.sectionCard, styles.tallCard]}
        title="AI Food Camera"
        iconLeft={<MaterialCommunityIcons name="camera-outline" size={18} color={TOK.mutedFg} />}
      >
        <Text style={styles.helpText}>
          Snap or upload a photo to identify items & macros.
        </Text>
        <View style={styles.btnRow}>
          <TouchableOpacity onPress={openCamera} style={[styles.btn, { marginRight: 22 }]}>
            <LinearGradient colors={["#6ea8ff", "#3a6df0"] as const} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.btnBg} />
            <View style={styles.btnContent}><Ionicons name="camera" size={18} color="#fff"/><Text style={styles.btnText}> Open Camera</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.btn}>
            <LinearGradient colors={["#8b5cf6", TOK.violet] as const} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.btnBg} />
            <View style={styles.btnContent}><Ionicons name="image" size={18} color="#fff"/><Text style={styles.btnText}> Upload Photo</Text></View>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Top small summary set (chips style) */}
      <Card style={{ marginTop: 12 }}>
        <Text style={styles.h6}>Today's Nutrition Summary</Text>
        <View style={styles.tileRow}>
          <SmallSummaryTile label="Calories In"  value={`${consumed} cal`} accent={TOK.mint} />
          <SmallSummaryTile label="Calories Out" value={`${caloriesOut} cal`} accent={TOK.amber} />
          <SmallSummaryTile label="Net Calories" value={`${net} cal`} accent={TOK.cyan} />
          <SmallSummaryTile label="Weight"       value={`${weight.toFixed(1)} kg`} accent={TOK.violet} />
        </View>
      </Card>

      {/* Food items list — bordered */}
      <Card style={[{ marginTop: 12, marginBottom: 24 }, styles.sectionCard]}>
        <Text style={styles.h6}>Food items — {selectedDate.toLocaleDateString()}</Text>
        {dayFoods.length===0 ? (
          <Text style={styles.muted}>No foods logged yet.</Text>
        ) : (
          dayFoods.map((f,i)=>(
            <View key={i} style={styles.foodRow}>
              <Text style={styles.text}>{f.name} · {f.grams}g</Text>
              <Text style={[styles.text,{ fontWeight:"700" }]}>{f.calories} kcal</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

/* ================== Styles ================== */
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: TOK.background },

  card: {
    backgroundColor: TOK.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOK.border,
    padding: 14,
  },

  sectionCard: {
    borderColor: TOK.ring,
    borderWidth: 1.2,
    backgroundColor: TOK.card,
    borderRadius: 20,
    padding: 13,
  },

  /* --- Taller cards + better spacing --- */
  tallCard: {
    padding: 17,      // more inner padding than the default 16
    minHeight: 150,   // ensures card feels substantial
  },
  helpText: {
    color: TOK.mutedFg,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10, // clear space before buttons
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  text: { color: TOK.foreground },
  muted: { color: TOK.mutedFg, fontSize: 12 },
  h6: { color: TOK.foreground, fontWeight: "700", fontSize: 18 },
  h4: { color: TOK.foreground, fontWeight: "800", fontSize: 22 },
  sectionTitle: { color: TOK.foreground, fontSize: 16, fontWeight: "700", marginBottom: 10 },

  rowCenter: { flexDirection:"row", alignItems:"center", marginBottom:6 },
  rowBetween: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },

  dateBtn: {
    flexDirection:"row", alignItems:"center",
    backgroundColor: TOK.dateBtnBg,
    borderColor: TOK.dateBtnBorder,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8, paddingVertical: 7, borderRadius: 10,
  },
  dateBtnText: { color:"#fff", fontWeight:"800", fontSize: 12 },

  input: {
    backgroundColor: TOK.input,
    color: TOK.foreground,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: TOK.border,
    minWidth: 70,
  },
  searchBar: {
    flexDirection:"row", alignItems:"center",
    backgroundColor: TOK.input,
    borderRadius: 14,
    borderWidth: 1, borderColor: TOK.border,
    paddingHorizontal:14, height: 48, marginTop:8,
  },
  searchInput: { flex:1, color: TOK.foreground, fontSize:14 },

  result: {
    backgroundColor: hsl(222.2, 32, 10),
    borderWidth: 1, borderColor: TOK.border,
    borderRadius:12, padding:14, minWidth:200, marginRight:10
  },
  resultTitle: { color: TOK.foreground, fontWeight:"800", fontSize:16
   },

  chip: {
    backgroundColor:TOK.secondary, borderColor:TOK.border, borderWidth:StyleSheet.hairlineWidth,
    paddingHorizontal:10, paddingVertical:6, borderRadius:10
  },
  chipTxt: { color:TOK.foreground, fontWeight:"600" },
  iconBtn: {
    paddingHorizontal:12, paddingVertical:6, backgroundColor:TOK.secondary,
    borderRadius:10, borderWidth:StyleSheet.hairlineWidth, borderColor:TOK.border
  },
  iconTxt: { color:TOK.foreground, fontWeight:"700" },

  tileRow: { flexDirection:"row", flexWrap:"wrap", marginTop:12 },
  tile: {
    flexGrow:1, flexBasis:"48%", backgroundColor:TOK.secondary,
    borderRadius:14, padding:14, marginRight:10, marginBottom:12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: TOK.border, position:"relative"
  },
  tileAccent: { position:"absolute", top:0, left:0, right:0, height:2, opacity:0.45 },
  tileLabel: { color: TOK.mutedFg, fontSize:12 },
  tileValue: { color: TOK.foreground, fontSize:22, fontWeight:"900" },

  foodRow: { flexDirection:"row", justifyContent:"space-between", paddingVertical:12 },

  btn: { borderRadius:12, overflow:"hidden" },
  btnBg: { ...StyleSheet.absoluteFillObject, opacity:0.25 },
  btnContent: { paddingVertical:15, paddingHorizontal:13, flexDirection:"row", alignItems:"center", justifyContent:"center" },
  btnText: { color:"#fff", fontWeight:"800", fontSize:16 },

  summaryGridAlt: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

/* ================== Food Result Card styles ================== */
const frc = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: UI.inner,
    borderWidth: 1.2,
    borderColor: TOK.ring,
  },
  title: { color: UI.title, fontWeight: "900", fontSize: 22, marginBottom: 8 },
  row: { flexDirection: "row", marginTop: 6 },
  label: { color: UI.label, marginBottom: 6, fontSize: 13 },

  input: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: UI.input,
    color: UI.title,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    fontSize: 18,
  },

  selectBox: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: UI.input,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: UI.title, fontSize: 18, fontWeight: "700" },

  grid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tileHalf: {
    width: "100%",
    height: 96,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: UI.tileBorder,
    marginBottom: 10,
  },
  tileFull: {
    width: "100%",
    height: 72,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: UI.tileBorder,
  },
  tileValue: { color: TOK.foreground, fontWeight: "900", fontSize: 22 },
  tileLabel: { color: TOK.mutedFg, marginTop: 4, fontSize: 13 },

  addBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  addText: { color: "#fff", fontWeight: "700" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modalSheet: { backgroundColor: TOK.background, borderRadius: 16, borderWidth: 1, borderColor: TOK.border, paddingVertical: 10 },
  modalTitle: { color: TOK.mutedFg, fontWeight: "700", fontSize: 14, paddingHorizontal: 14, paddingBottom: 6, opacity: 0.9 },
  modalItem: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalItemActive: { backgroundColor: "rgba(124,156,255,0.12)" },
  modalItemText: { color: TOK.foreground, fontSize: 16 },
  modalItemTextActive: { color: TOK.ring, fontWeight: "700" },
});
