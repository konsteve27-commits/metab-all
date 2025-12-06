// ===== my_meals.js (Metab-all) =====
// Shows saved meals (from meals.js), computes daily totals
// and compares them to the user's Metab-all targets.

import { getUserData } from "./auth.js";
import { metaballAlert, metaballConfirm } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM
  const mealsContainer = document.getElementById("mealsContainer");
  const clearTodayBtn = document.getElementById("clearTodayBtn");
  const totalStats = document.getElementById("totalStats");
  const dailyDiv = document.getElementById("dailyProgress");

  if (!mealsContainer || !totalStats || !dailyDiv) {
    console.error("❌ Metab-all: Missing My Meals DOM elements.");
    return;
  }

  // Load saved meals (treated as "today" until cleared)
  let mealLibrary = JSON.parse(localStorage.getItem("mealLibrary")) || {};

  // User targets from Metab-all calculator
  const userData = getUserData();
  const macroTargets = userData?.macros || null;
  const microTargets = userData?.micros || null;

  // ================================
  // COMPUTE TOTALS
  // ================================
  function computeTotals() {
    const totals = {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fibre: 0,
      micros: {
        A: 0,
        B6: 0,
        B12: 0,
        C: 0,
        Ca: 0,
        D: 0,
        E: 0,
        Fe: 0,
        Folate: 0,
        K: 0,
        Mg: 0,
        Zn: 0
      }
    };

    const microKeyMap = {
      iron: "Fe",
      calcium: "Ca",
      magnesium: "Mg",
      potassium: "K",
      zinc: "Zn",
      vitaminA: "A",
      vitaminB6: "B6",
      vitaminB12: "B12",
      vitaminC: "C",
      vitaminD: "D",
      vitaminE: "E",
      folate: "Folate"
    };

    for (const mealName in mealLibrary) {
      const m = mealLibrary[mealName];
      if (!m || !m.totals) continue;

      totals.kcal += m.totals.kcal || 0;
      totals.protein += m.totals.protein || 0;
      totals.carbs += m.totals.carbs || 0;
      totals.fat += m.totals.fat || 0;
      totals.fibre += m.totals.fibre || 0;

      if (m.micros) {
        for (const k in m.micros) {
          const mapped = microKeyMap[k];
          if (mapped && totals.micros[mapped] !== undefined) {
            totals.micros[mapped] += m.micros[k];
          }
        }
      }
    }

    return totals;
  }

  // ================================
  // RENDER MEALS LIST
  // ================================
  function renderMeals() {
    mealsContainer.innerHTML = "";

    const entries = Object.entries(mealLibrary);
    if (!entries.length) {
      mealsContainer.innerHTML = "<p>No saved meals yet.</p>";
      return;
    }

    entries.forEach(([name, meal]) => {
      const div = document.createElement("div");
      div.className = "meal-entry";

      div.innerHTML = `
        <div class="meal-info">
          <h4>${name}</h4>
          <p><strong>Calories:</strong> ${meal.totals.kcal.toFixed(1)} kcal</p>
          <p><strong>Protein:</strong> ${meal.totals.protein.toFixed(1)} g</p>
          <p><strong>Carbs:</strong> ${meal.totals.carbs.toFixed(1)} g</p>
          <p><strong>Fat:</strong> ${meal.totals.fat.toFixed(1)} g</p>
          <p><strong>Fibre:</strong> ${meal.totals.fibre.toFixed(1)} g</p>
        </div>
        <button class="delete-btn" type="button">✖</button>
      `;

      div.querySelector(".delete-btn").addEventListener("click", () => {
       metaballConfirm(`Delete "${name}" from saved meals?`, {
  type: "danger",
  title: "Delete meal",
  confirmText: "Delete",
}).then((ok) => {
  if (!ok) return;
  delete mealLibrary[name];
  localStorage.setItem("mealLibrary", JSON.stringify(mealLibrary));
  refreshUI();
});
      });

      mealsContainer.appendChild(div);
    });
  }

  // ================================
  // RENDER SUMMARY BOX
  // ================================
  function renderTotals() {
    const t = computeTotals();

    totalStats.innerHTML = `
      <h3>Total Nutrients</h3>
      <p><strong>Calories:</strong> ${t.kcal.toFixed(1)} kcal</p>
      <p><strong>Protein:</strong> ${t.protein.toFixed(1)} g</p>
      <p><strong>Carbs:</strong> ${t.carbs.toFixed(1)} g</p>
      <p><strong>Fat:</strong> ${t.fat.toFixed(1)} g</p>
      <p><strong>Fibre:</strong> ${t.fibre.toFixed(1)} g</p>
    `;
  }

  // ================================
  // PROGRESS BARS
  // ================================
  function bar(label, value, target, unit = "") {
    if (!target || target <= 0) target = 1;
    const percent = (value / target) * 100;
    const width = Math.min(100, percent);
    const color = percent >= 100 ? "#e74c3c" : "#2ecc71";

    return `
      <div class="progress-row">
        <div class="progress-name">${label}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width:${width}%; background:${color};"></div>
        </div>
        <span class="progress-values">
          ${value.toFixed(1)} / ${target.toFixed(1)}${unit ? " " + unit : ""} (${percent.toFixed(1)}%)
        </span>
      </div>
    `;
  }

  function renderBars() {
    const t = computeTotals();

    // No targets → show message
    if (!macroTargets || !microTargets) {
      dailyDiv.innerHTML = `
        <p>
          ⚠️ Daily targets not found. Set up your profile in the
          <a href="calories.html" class="link">Calorie & Nutrient Calculator</a>.
        </p>
      `;
      return;
    }

    let html = `<h4>Daily Macros Progress</h4>`;

    html += bar("Calories", t.kcal, macroTargets.calories, "kcal");
    html += bar("Protein", t.protein, macroTargets.protein, "g");
    html += bar("Carbs", t.carbs, macroTargets.carbs, "g");
    html += bar("Fat", t.fat, macroTargets.fat, "g");
    html += bar("Fibre", t.fibre, macroTargets.fibre || 30, "g");

    html += `<h4>Daily Micronutrients Progress</h4>`;

    const units = {
      A: "μg",
      B6: "mg",
      B12: "μg",
      C: "mg",
      Ca: "mg",
      D: "μg",
      E: "mg",
      Fe: "mg",
      Folate: "μg",
      K: "mg",
      Mg: "mg",
      Zn: "mg"
    };

    for (const k in t.micros) {
      if (!microTargets[k]) continue;
      const value = t.micros[k];
      const target = microTargets[k];
      const unit = units[k] || "";
      html += bar(k, value, target, unit);
    }

    dailyDiv.innerHTML = html;
  }

  // ================================
  // CLEAR TODAY
  // ================================
  if (clearTodayBtn) {
    clearTodayBtn.addEventListener("click", () => {
      metaballConfirm("Clear all saved meals for today?", {
  type: "danger",
  title: "Clear today",
  confirmText: "Clear",
}).then((ok) => {
  if (!ok) return;
  mealLibrary = {};
  localStorage.setItem("mealLibrary", JSON.stringify({}));
  refreshUI();
});


    });
  }

  // ================================
  // REFRESH UI
  // ================================
  function refreshUI() {
    renderMeals();
    renderTotals();
    renderBars();
  }

  refreshUI();
});
