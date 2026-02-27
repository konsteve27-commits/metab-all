// ===== my_meals.js (Metab-all) =====
import { getUserData } from "./auth.js";
import { metaballAlert, metaballConfirm } from "./ui.js";

export function initMyMeals() {
  const mealsContainer = document.getElementById("mealsContainer");
  const clearTodayBtn = document.getElementById("clearTodayBtn");
  const totalStats = document.getElementById("totalStats");
  const dailyDiv = document.getElementById("dailyProgress");
  const toggleBtn = document.getElementById("toggleLegendBtn");
  const legendWrapper = document.getElementById("legendWrapper");
  
  if (toggleBtn && legendWrapper) {
        toggleBtn.onclick = () => {
            const isHidden = legendWrapper.style.display === "none";
            legendWrapper.style.display = isHidden ? "block" : "none";
            toggleBtn.textContent = isHidden ? "Hide Color " : "Show Color";
            
            // Προαιρετικό: Scroll μέχρι το legend αν το ανοίγουμε
            if (isHidden) {
                legendWrapper.scrollIntoView({ behavior: 'smooth' });
            }
        };
    }
  
  if (!mealsContainer || !totalStats || !dailyDiv) {
    console.error("❌ Metab-all: Missing My Meals DOM elements.");
    return;
  }

  let mealLibrary = JSON.parse(localStorage.getItem("mealLibrary")) || {};
  const userData = getUserData();
  const macroTargets = userData?.macros || null;
  const microTargets = userData?.micros || null;

  function computeTotals() {
    const totals = {
      kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0,
      micros: { A: 0, B6: 0, B12: 0, C: 0, Ca: 0, D: 0, E: 0, Fe: 0, Folate: 0, K: 0, Mg: 0, Zn: 0 }
    };
    const microKeyMap = {
      iron: "Fe", calcium: "Ca", magnesium: "Mg", potassium: "K", zinc: "Zn",
      vitaminA: "A", vitaminB6: "B6", vitaminB12: "B12", vitaminC: "C",
      vitaminD: "D", vitaminE: "E", folate: "Folate"
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
          if (mapped && totals.micros[mapped] !== undefined) totals.micros[mapped] += m.micros[k];
        }
      }
    }
    return totals;
  }

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
        metaballConfirm(`Delete "${name}" from saved meals?`, { type: "danger", title: "Delete meal", confirmText: "Delete" }).then((ok) => {
          if (!ok) return;
          delete mealLibrary[name];
          localStorage.setItem("mealLibrary", JSON.stringify(mealLibrary));
          refreshUI();
          // Ενημέρωση Dashboard
          document.dispatchEvent(new CustomEvent('spaContentUpdate', { detail: { section: 'home' } }));
        });
      });
      mealsContainer.appendChild(div);
    });
  }

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

  function bar(label, value, target, unit = "", isMeetGoal = true) { 
    if (!target || target <= 0) target = 1;
    const percent = (value / target) * 100;
    const width = Math.min(120, percent); 
    let color = "#2ecc71"; 
    if (isMeetGoal) {
      if (percent < 40) color = "#e74c3c"; else if (percent < 100) color = "#f59e0b";
    } else {
      if (percent > 120) color = "#e74c3c"; else if (percent > 100) color = "#f59e0b";
    }
    return `
      <div class="progress-row">
        <div class="progress-name">${label}</div>
        <div class="progress-bar-container"><div class="progress-bar" style="width:${width}%; background:${color};"></div></div>
        <span class="progress-values">${value.toFixed(1)} / ${target.toFixed(1)}${unit ? " " + unit : ""} (${percent.toFixed(1)}%)</span>
      </div>`;
  }

  function renderBars() {
    const t = computeTotals();
    if (!macroTargets || !microTargets) {
      dailyDiv.innerHTML = `<p>⚠️ Daily targets not found. Set up your profile in the <a href="#calories" class="link">Calorie & Nutrient Calculator</a>.</p>`;
      return;
    }

    let html = `<h4>Daily Macros Progress</h4><div class="progress-section">`;
    html += bar("Calories", t.kcal, macroTargets.calories, "kcal", false); 
    html += bar("Protein", t.protein, macroTargets.protein, "g", true); 
    html += bar("Carbs", t.carbs, macroTargets.carbs, "g", false);
    html += bar("Fat", t.fat, macroTargets.fat, "g", false);
    html += bar("Fibre", t.fibre, macroTargets.fibre || 30, "g", true); 
    html += `</div><h4>Daily Micronutrients Progress</h4><div class="progress-section">`;

    const nameMap = {
      Fe: { unit: "mg", label: "Iron" }, Ca: { unit: "mg", label: "Calcium" }, Mg: { unit: "mg", label: "Magnesium" },
      K: { unit: "mg", label: "Potassium" }, Zn: { unit: "mg", label: "Zinc" }, A: { unit: "μg", label: "Vitamin A" },
      C: { unit: "mg", label: "Vitamin C" }, D: { unit: "μg", label: "Vitamin D" }, E: { unit: "mg", label: "Vitamin E" },
      B6: { unit: "mg", label: "Vitamin B6" }, B12: { unit: "μg", label: "Vitamin B12" }, Folate: { unit: "μg", label: "Folate" }
    };
    
    for (const k in t.micros) {
      const map = nameMap[k];
      if (!microTargets[k] || !map) continue;
      html += bar(map.label, t.micros[k], microTargets[k], map.unit, true); 
    }
    dailyDiv.innerHTML = html + `</div>`;
  }

  function refreshUI() {
    renderMeals();
    renderBars();
    renderTotals();
  }

  if (clearTodayBtn) {
    clearTodayBtn.onclick = () => { 
      metaballConfirm("Clear all meals for today?", { type: "danger" }).then((ok) => {
        if (ok) {
          mealLibrary = {};
          localStorage.setItem("mealLibrary", JSON.stringify({}));
          refreshUI();
          document.dispatchEvent(new CustomEvent('spaContentUpdate', { detail: { section: 'home' } }));
        }
      });
    };
  }

  refreshUI();
}

document.addEventListener('spaContentUpdate', (e) => {
    if (e.detail.section === 'my_meals') {
        initMyMeals();
    }
});