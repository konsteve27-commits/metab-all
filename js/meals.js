// ===== meals.js (Metab-all) =====
// Meal builder: auto-suggest, macros & micros, progress bars, save to localStorage

import { foodData } from "./foodData.js";
import { getUserData } from "./auth.js";
import { metaballAlert } from "./ui.js";


document.addEventListener("DOMContentLoaded", () => {
  // DOM references
  const foodInput = document.getElementById("foodInput");
  const suggestions = document.getElementById("suggestions");
  const gramsInput = document.getElementById("grams");
  const addFoodBtn = document.getElementById("addFoodBtn");
  const mealTable = document.getElementById("meal-table");
  const mealSummary = document.getElementById("meal-summary");
  const progressSection = document.getElementById("daily-progress");
  const saveMealBtn = document.getElementById("saveMealBtn");

  if (!foodInput || !gramsInput || !addFoodBtn || !mealTable) {
    console.error("❌ Metab-all: Missing meal builder DOM elements.");
    return;
  }

  // Load saved user targets
  const user = getUserData();
  const targets = user?.macros || null;

  let selectedFood = "";
  let activeIndex = -1;
  let mealItems = [];

  // ================================
  // AUTOCOMPLETE – FOOD SEARCH
  // ================================

  // Βασικό όνομα: αφαιρούμε ό,τι είναι σε () πριν κάνουμε matching
  function getBaseName(foodName) {
    // "Chicken Breast (cooked)" -> "chicken breast"
    return foodName.replace(/\s*\(.*?\)\s*/g, "").toLowerCase();
  }

  foodInput.addEventListener("input", () => {
    const term = foodInput.value.toLowerCase().trim();
    suggestions.innerHTML = "";
    activeIndex = -1;

    if (term.length < 2) return;

    const allFoods = Object.keys(foodData);

    // 1) ταιριάζουμε ΜΟΝΟ στο βασικό όνομα (χωρίς τις παρενθέσεις)
    let matches = allFoods.filter((f) => getBaseName(f).includes(term));

    // Προαιρετικό: βάζουμε πρώτα αυτά που αρχίζουν με τον όρο
    matches = matches.sort((a, b) => {
      const aBase = getBaseName(a);
      const bBase = getBaseName(b);
      const aStarts = aBase.startsWith(term) ? 0 : 1;
      const bStarts = bBase.startsWith(term) ? 0 : 1;
      return aStarts - bStarts || aBase.localeCompare(bBase);
    });

    matches = matches.slice(0, 10);

    matches.forEach((match) => {
      const div = document.createElement("div");
      div.classList.add("suggestion");
      div.textContent = match; // εμφανίζουμε το πλήρες όνομα (με τις παρενθέσεις)
      div.addEventListener("click", () => selectSuggestion(match));
      suggestions.appendChild(div);
    });
  });

  foodInput.addEventListener("keydown", (e) => {
    const items = Array.from(
      suggestions.querySelectorAll(".suggestion")
    );
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      activeIndex = (activeIndex + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      activeIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (e.key === "Enter" && activeIndex >= 0) {
      selectSuggestion(items[activeIndex].textContent);
    } else {
      return;
    }

    e.preventDefault();
    items.forEach((item, i) =>
      item.classList.toggle("active", i === activeIndex)
    );
  });

  function selectSuggestion(name) {
    foodInput.value = name;
    selectedFood = name;
    suggestions.innerHTML = "";
  }

  document.addEventListener("click", (e) => {
    if (!suggestions.contains(e.target) && e.target !== foodInput) {
      suggestions.innerHTML = "";
    }
  });


  // ================================
  // ADD FOOD TO MEAL
  // ================================
  addFoodBtn.addEventListener("click", () => {
    const food = selectedFood || foodInput.value.trim();
    const grams = parseFloat(gramsInput.value);

if (!foodData[food]) {
  metaballAlert("⚠️ Food not found.", {
    type: "warning",
    title: "Food search",
  });
  return;
}
if (!grams || grams <= 0) {
  metaballAlert("⚠️ Enter valid grams.", {
    type: "warning",
    title: "Invalid amount",
  });
  return;
}


    mealItems.push({ food, grams });

    // reset inputs
    foodInput.value = "";
    gramsInput.value = "";
    selectedFood = "";
    activeIndex = -1;
    suggestions.innerHTML = "";

    updateMealTable();
  });

  // ================================
  // REMOVE ITEM (event delegation)
  // ================================
  mealTable.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    if (Number.isNaN(index)) return;

    mealItems.splice(index, 1);
    updateMealTable();
  });

  // ================================
  // COMPUTE TOTALS (macros + micros)
  // ================================
  function computeMealTotals() {
    const totals = {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fibre: 0
    };
    const micros = {};

    mealItems.forEach((item) => {
      const data = foodData[item.food];
      if (!data) return;

      const ratio = item.grams / 100;

      totals.kcal += data.kcal * ratio;
      totals.protein += data.protein * ratio;
      totals.carbs += data.carbs * ratio;
      totals.fat += data.fat * ratio;
      totals.fibre += (data.fibre || 0) * ratio;

      // add micronutrients
      for (let key in data) {
        if (!["kcal", "protein", "carbs", "fat", "fibre"].includes(key)) {
          micros[key] = (micros[key] || 0) + data[key] * ratio;
        }
      }
    });

    return { totals, micros };
  }

  // ================================
  // UPDATE TABLE + PROGRESS
  // ================================
  function updateMealTable() {
    if (!user || !user.macros) {
      mealTable.innerHTML = `
        <div class="no-userdata">
          <p>⚠️ It looks like you haven’t set your daily nutrition goals yet.</p>
          <p>You can calculate your personalized targets 
          <a href="calories.html" class="link">here</a>.</p>
        </div>
      `;
      if (progressSection) progressSection.innerHTML = "";
      return;
    }

    if (mealItems.length === 0) {
      mealTable.innerHTML = "<p>No ingredients added yet.</p>";
      mealSummary.innerHTML = "";
      updateProgressBars(
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fibre: 0
        },
        {},
        targets
      );
      return;
    }

    const { totals, micros } = computeMealTotals();

    let html = `
      <table class="styled-table">
        <tr>
          <th>Food</th>
          <th>Grams</th>
          <th>kcal</th>
          <th>Protein</th>
          <th>Carbs</th>
          <th>Fat</th>
          <th>🗑</th>
        </tr>
    `;

    mealItems.forEach((item, i) => {
      const data = foodData[item.food];
      const ratio = item.grams / 100;

      html += `
        <tr>
          <td>${item.food}</td>
          <td>${item.grams}</td>
          <td>${(data.kcal * ratio).toFixed(1)}</td>
          <td>${(data.protein * ratio).toFixed(1)}</td>
          <td>${(data.carbs * ratio).toFixed(1)}</td>
          <td>${(data.fat * ratio).toFixed(1)}</td>
<td><button class="table-del" data-index="${i}"><span>✖</span></button></td>

        </tr>
      `;
    });

    html += "</table>";
    mealTable.innerHTML = html;

    // Simple summary
    mealSummary.innerHTML = `
      <p><strong>Total Calories:</strong> ${totals.kcal.toFixed(1)} kcal</p>
      <p><strong>Protein:</strong> ${totals.protein.toFixed(1)} g</p>
      <p><strong>Carbs:</strong> ${totals.carbs.toFixed(1)} g</p>
      <p><strong>Fat:</strong> ${totals.fat.toFixed(1)} g</p>
      <p><strong>Fibre:</strong> ${totals.fibre.toFixed(1)} g</p>
    `;

    // Update progress UI
    updateProgressBars(
      {
        calories: totals.kcal,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fibre: totals.fibre
      },
      micros,
      targets
    );
  }
// ================================
// PROGRESS BARS (Macros + Micros)
// ================================
function updateProgressBars(mealTotals, mealMicros, dailyGoals) {
    if (!dailyGoals || !progressSection) return;

    // Μακροθρεπτικά που πρέπει να εκπληρωθούν (στόχος = minimum)
    const meetGoalsMacros = ["protein", "fibre"];
    
    const macroData = [
      {
        key: "calories",
        label: "Calories",
        value: mealTotals.calories,
        target: dailyGoals.calories,
        unit: "kcal"
      },
      {
        key: "protein",
        label: "Protein",
        value: mealTotals.protein,
        target: dailyGoals.protein,
        unit: "g"
      },
      {
        key: "carbs",
        label: "Carbs",
        value: mealTotals.carbs,
        target: dailyGoals.carbs,
        unit: "g"
      },
      {
        key: "fat",
        label: "Fat",
        value: mealTotals.fat,
        target: dailyGoals.fat,
        unit: "g"
      },
      {
        key: "fibre",
        label: "Fibre",
        value: mealTotals.fibre,
        target: dailyGoals.fibre || 30,
        unit: "g"
      }
    ];

    let html = `
      <h3 class="section-title">Daily Macros Progress</h3>
      <div class="progress-section">
    `;

    macroData.forEach((m) => {
      if (!m.target || m.target <= 0) return;
      const percent = ((m.value / m.target) * 100).toFixed(1);
      const limited = Math.min(parseFloat(percent), 120);
      
      let color = "#2ecc71"; // Default Green
      const p = parseFloat(percent);

      if (meetGoalsMacros.includes(m.key)) {
        // Logic for Protein/Fibre:
        if (p < 40) {
          color = "#e74c3c"; // RED if < 80% (Critical Undershoot)
        } else if (p < 100) {
          color = "#f59e0b"; // ORANGE if 80% <= percent < 100% (Near Miss)
        }
        // Green if >= 100%
      } else {
        // Logic for Calories/Carbs/Fat:
        if (p > 120) {
          color = "#e74c3c"; // RED if > 120% (Critical Overshoot)
        } else if (p > 100) {
          color = "#f59e0b"; // ORANGE if 100% < percent <= 120% (Slight Overshoot)
        }
        // Green if <= 100%
      }


      html += `
        <div class="progress-row">
          <div class="progress-name">${m.label}</div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width:${limited}%; background:${color};"></div>
          </div>
          <div class="progress-values">
            ${m.value.toFixed(1)} / ${m.target.toFixed(1)} ${m.unit} (${percent}%)
          </div>
        </div>
      `;
    });

    // === Micronutrients ===
    const microTargets = user?.micros || null;
    if (microTargets) {
      const nameMap = {
        Fe: { foodKey: "iron", unit: "mg", label: "Iron" },
        Ca: { foodKey: "calcium", unit: "mg", label: "Calcium" },
        Mg: { foodKey: "magnesium", unit: "mg", label: "Magnesium" },
        K: { foodKey: "potassium", unit: "mg", label: "Potassium" },
        Zn: { foodKey: "zinc", unit: "mg", label: "Zinc" },
        A: { foodKey: "vitaminA", unit: "μg", label: "Vitamin A" },
        C: { foodKey: "vitaminC", unit: "mg", label: "Vitamin C" },
        D: { foodKey: "vitaminD", unit: "μg", label: "Vitamin D" },
        E: { foodKey: "vitaminE", unit: "mg", label: "Vitamin E" },
        B6: { foodKey: "vitaminB6", unit: "mg", label: "Vitamin B6" },
        B12: { foodKey: "vitaminB12", unit: "μg", label: "Vitamin B12" },
        Folate: { foodKey: "folate", unit: "μg", label: "Folate" }
      };

      html += `
        <h3 class="section-title">Micronutrient Progress</h3>
        <div class="progress-section">
      `;

      Object.keys(microTargets).forEach((k) => {
        const map = nameMap[k];
        if (!map) return;

        const value = mealMicros[map.foodKey] || 0;
        const target = microTargets[k];
        if (!target || target <= 0) return;

        const percent = ((value / target) * 100).toFixed(1);
        const limited = Math.min(parseFloat(percent), 120);
        const p = parseFloat(percent);
        
        // Λογική Micros (Meet Goal):
        let color = "#2ecc71"; // Default Green
        if (p < 40) {
          color = "#e74c3c"; // RED if < 80% (Critical Undershoot)
        } else if (p < 100) {
          color = "#f59e0b"; // ORANGE if 80% <= percent < 100% (Near Miss)
        }

        html += `
          <div class="progress-row">
            <div class="progress-name">${map.label}</div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width:${limited}%; background:${color};"></div>
            </div>
            <div class="progress-values">
              ${value.toFixed(1)} / ${target.toFixed(1)} ${map.unit} (${percent}%)
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `</div>`;
    progressSection.innerHTML = html;
  }
  // ================================
  // SAVE MEAL TO LOCALSTORAGE
  // ================================
  if (saveMealBtn) {
    saveMealBtn.addEventListener("click", () => {
     if (mealItems.length === 0) {
  metaballAlert("⚠️ Add some ingredients before saving a meal.", {
    type: "warning",
    title: "Empty meal",
  });
  return;
}


      const { totals, micros } = computeMealTotals();

      const mealLibrary =
        JSON.parse(localStorage.getItem("mealLibrary")) || {};

      const mealNumber = Object.keys(mealLibrary).length + 1;
      const mealName = `Meal ${mealNumber}`;

      mealLibrary[mealName] = {
        name: mealName,
        items: [...mealItems],
        totals,
        micros
      };

      localStorage.setItem("mealLibrary", JSON.stringify(mealLibrary));

      metaballAlert(`✅ ${mealName} saved successfully!`, {
  type: "success",
  title: "Meal saved",
});


      // Clear current meal
      mealItems = [];
      updateMealTable();
    });
  }

  // Initial UI state
  updateMealTable();
});
