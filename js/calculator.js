
export function calculateNeeds(data) {
  const { gender, age, weight, height, workouts, hours, intensity, goal } = data;

  // --- Basic safety checks ---
  const safeWeight = Number(weight) || 0;
  const safeHeight = Number(height) || 0;
  const safeAge = Number(age) || 0;
  const safeWorkouts = Number(workouts) || 0;
  const safeHours = Number(hours) || 0;

  // ===== BMR (Mifflin–St Jeor) =====
  const BMR =
    10 * safeWeight +
    6.25 * safeHeight -
    5 * safeAge +
    (gender === "male" ? 5 : -161);

  // ===== Activity Factor =====
  // base: sedentary
  let base = 1.2;
  const intFactor =
    intensity === "light"
      ? 1.1
      : intensity === "moderate"
      ? 1.25
      : 1.4; // intense as default else
  const exerciseFactor =
    1 + safeWorkouts * safeHours * 0.02 * intFactor;

  // Clamp activity to a realistic upper bound
  const activity = Math.min(base * exerciseFactor, 1.9);

  // Total Daily Energy Expenditure
  const TDEE = BMR * activity;

  // ===== Macros =====
  // Protein
  
let proteinFactor = 1.2; // default for light

if (intensity === "moderate") proteinFactor = 1.5;
if (intensity === "intense") proteinFactor = 1.8;

// adjust by goal
if (goal === "loss") proteinFactor += 0.1;
if (goal === "gain") proteinFactor += 0.15;
if (goal === "bulk") proteinFactor += 0.25;

const protein = Math.round(safeWeight * proteinFactor);

  // Fat: 25% of calories
  const fat = Math.round((0.25 * TDEE) / 9);
  // Carbs: remaining calories
  const carbs = Math.round(
    (TDEE - (protein * 4 + fat * 9)) / 4
  );
  // Fibre: simple gender-based rule
  const fibre = gender === "male" ? 35 : 25;

  const results = {
    calories: Math.round(TDEE),
    protein,
    carbs,
    fat,
    fibre,
  };


  return {
    BMR: Math.round(BMR),
    TDEE: Math.round(TDEE),
    maintain: Math.round(TDEE),
    lose: Math.round(TDEE * 0.85),
    gain: Math.round(TDEE * 1.15),
    protein,
    fat,
    carbs,
    fibre,
    activity,
  };
}
