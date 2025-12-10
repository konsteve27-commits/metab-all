// ===== main.js (Metab-all) =====
// Handles: calorie & macro calculation, micronutrient needs,
// saving to localStorage and viewing / clearing saved data.

import { calculateNeeds } from "./calculator.js";
import { getMicronutrientNeeds, micronutrientSources, micronutrientBenefits } from "./micronutrients.js"; 
import { saveUserData, getUserData, clearUserData } from "./auth.js";
import { metaballAlert, metaballConfirm } from "./ui.js";


document.addEventListener("DOMContentLoaded", () => {
  const calculateBtn = document.getElementById("calculateBtn");
  const viewBtn = document.getElementById("viewDataBtn");
  const clearBtn = document.getElementById("clearDataBtn");
  const resultsDiv = document.getElementById("results");

  if (!calculateBtn || !resultsDiv) {
    console.error("❌ Metab-all: Missing calculator DOM elements.");
    return;
  }

  // ==========================
  // 1) CALCULATE & SAVE DATA
  // ==========================
  calculateBtn.addEventListener("click", () => {
    const data = {
      gender: document.getElementById("gender")?.value,
      age: parseFloat(document.getElementById("age")?.value),
      weight: parseFloat(document.getElementById("weight")?.value),
      height: parseFloat(document.getElementById("height")?.value),
      workouts: parseFloat(document.getElementById("workoutsPerWeek")?.value) || 0,
      hours: parseFloat(document.getElementById("hoursPerWorkout")?.value) || 0,
      intensity: document.getElementById("intensity")?.value,
      goal: document.getElementById("goal")?.value,
    };

if (!data.gender || !data.age || !data.weight || !data.height) {
  metaballAlert("Please fill in gender, age, weight and height.", {
    type: "warning",
    title: "Missing Information"
  });
  return;
}


    // === Calculate macros (Mifflin–St Jeor etc.) ===
    // NOTE: This call only returns calculated macros, not the adjusted ones based on goal.
    // The adjusted macros are calculated later below. This file's copy of calculateNeeds is used.
    const calc = calculateNeeds(data);

    // === Adjust calories based on goal ===
    let adjustedCalories;
    switch (data.goal) {
      case "loss":
        adjustedCalories = calc.TDEE * 0.8;
        break;
      case "gain":
        adjustedCalories = calc.TDEE * 1.1;
        break;
      case "bulk":
        adjustedCalories = calc.TDEE * 1.25;
        break;
      default:
        adjustedCalories = calc.TDEE;
    }

    // === Calculate micronutrients ===
    // This function returns the final RDA goals.
    // Νέα κλήση (Update main.js)
    const micros = getMicronutrientNeeds(data.gender, data.age, calc.activity, data.intensity);

    // === Build user data object for storage ===
    const userData = {
      gender: data.gender,
      age: data.age,
      weight: data.weight,
      height: data.height,
      workouts: data.workouts,
      hours: data.hours,
      intensity: data.intensity,
      goal: data.goal,
      macros: {
        calories: adjustedCalories,
        protein: calc.protein,
        carbs: calc.carbs,
        fat: calc.fat,
        fibre: calc.fibre,
      },
      micros,
      updatedAt: new Date().toISOString(),
    };

    // === Save everything to localStorage ===
    saveUserData(userData);
    console.log("✅ Metab-all: user data saved to localStorage");

    // === Build Micronutrient table HTML ===
    let microsHTML = `<table class="styled-table">
      <tr>
        <th>Micronutrient</th>
        <th>Amount</th>
        <th>Info</th>
      </tr>`;

    for (let [k, v] of Object.entries(micros)) {
      const unit = ["A", "D", "B12", "Folate"].includes(k) ? "μg" : "mg";
      microsHTML += `
        <tr>
          <td>${k}</td>
          <td>${v} ${unit}</td>
          <td><button class="info-btn" data-micro="${k}">❕</button></td>
        </tr>`;
    }
    microsHTML += `</table>`;

    // === Display results ===
    resultsDiv.style.display = "block";
    resultsDiv.innerHTML = `
      <h2>Results</h2>
      <p><strong>BMR:</strong> ${calc.BMR.toFixed(0)} kcal</p>
      <p><strong>TDEE:</strong> ${calc.TDEE.toFixed(0)} kcal</p>
      <p><strong>Adjusted for Goal:</strong> ${adjustedCalories.toFixed(0)} kcal</p>
      <hr>
      <h3>Recommended Macros</h3>
      <p>Protein: ${calc.protein} g</p>
      <p>Carbohydrates: ${calc.carbs} g</p>
      <p>Fat: ${calc.fat} g</p>
      <p>Fibre: ${calc.fibre} g</p>
      <hr>
      <h3>Micronutrients (RDA)</h3>
      ${microsHTML}
    `;
  });

  // ==========================
  // 2) VIEW SAVED DATA (MODIFIED FOR CONSISTENT UI)
  // ==========================
  if (viewBtn) {
    viewBtn.addEventListener("click", () => {
      const user = getUserData();
     if (!user) {
  metaballAlert("⚠️ No saved Metab-all data found.", {
    type: "warning",
    title: "No Saved Profile",
  });
  return;
}

      // --- 1. Replicate Micronutrient Table HTML ---
      let microsHTML = `<table class="styled-table">
        <tr>
            <th>Micronutrient</th>
            <th>Amount</th>
            <th>Info</th>
        </tr>`;

      for (let [k, v] of Object.entries(user.micros || {})) {
          const unit = ["A", "D", "B12", "Folate"].includes(k) ? "μg" : "mg";
          microsHTML += `
              <tr>
                  <td>${k}</td>
                  <td>${v} ${unit}</td>
                  <td><button class="info-btn" data-micro="${k}">❕</button></td>
              </tr>`;
      }
      microsHTML += `</table>`;


      // --- 2. Display results in the same format ---
      resultsDiv.style.display = "block";
      resultsDiv.innerHTML = `
        <h2>Saved Data</h2>
        <p><strong>Gender:</strong> ${user.gender}</p>
        <p><strong>Age:</strong> ${user.age}</p>
        <p><strong>Weight:</strong> ${user.weight} kg</p>
        <p><strong>Height:</strong> ${user.height} cm</p>
        <p><strong>Goal:</strong> ${user.goal}</p>
        <hr>
        <h3>Recommended Macros</h3>
        <p>Calories: ${user.macros.calories.toFixed(0)} kcal</p>
        <p>Protein: ${user.macros.protein} g</p>
        <p>Carbohydrates: ${user.macros.carbs} g</p>
        <p>Fat: ${user.macros.fat} g</p>
        <p>Fibre: ${user.macros.fibre} g</p>
        <hr>
        <h3>Micronutrients (RDA)</h3>
        ${microsHTML}
        <p style="font-size: 0.9rem; color: var(--color-muted); margin-top: 1rem;"><em>Last updated: ${new Date(user.updatedAt).toLocaleString()}</em></p>
      `;
    });
  }

// ==========================
// 3) CLEAR SAVED DATA
// ==========================
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    metaballConfirm("⚠️ Clear all saved Metab-all data?", {
      type: "danger",
      title: "Clear Metab-all Profile?",
      confirmText: "Clear Data",
      cancelText: "Cancel",
    }).then((ok) => {
      if (!ok) return;

      clearUserData();
      resultsDiv.style.display = "none";
      resultsDiv.innerHTML = "";

      metaballAlert("✅ All Metab-all data has been cleared.", {
        type: "success",
        title: "Profile Reset",
      });
    });
  });
}

// ==========================
// 4) MICRONUTRIENT INFO BUTTONS (Click Handler)
// This listener handles clicks from both CALCULATE and VIEW SAVED DATA tables.
// ==========================
resultsDiv.addEventListener('click', (e) => {
    const btn = e.target.closest('.info-btn');
    if (!btn) return;
    
    // *** ΝΕΑ ΛΟΓΙΚΗ: Αποθήκευση του κουμπιού που πατήθηκε ***
    const triggerButton = btn; 
    
    const microKey = btn.dataset.micro;
    
    // Map names for pop-up display
    const nameMap = {
        A: "Vitamin A", C: "Vitamin C", D: "Vitamin D", E: "Vitamin E", 
        B6: "Vitamin B6", B12: "Vitamin B12", Folate: "Folate", Ca: "Calcium", 
        Fe: "Iron", Mg: "Magnesium", Zn: "Zinc", K: "Potassium"
    };

    const microName = nameMap[microKey] || microKey;
    const benefit = micronutrientBenefits[microKey] || "No information found for this micronutrient.";
    const source = micronutrientSources[microKey] || "No primary food sources found.";
    
    // Using simple HTML format for the message, now supported by the updated ui.js
    const messageHTML = `
        <p><strong>Importance:</strong> ${benefit}</p>
        <p style="margin-top: 10px;"><strong>Primary Food Sources:</strong> ${source}</p>
    `;

    // Καλούμε το metaballAlert και, όταν η υπόσχεση ολοκληρωθεί (το modal κλείσει):
    metaballAlert(messageHTML, {
        type: 'info',
        title: `${microName} Info`,
    }).then(() => {
        // *** ΕΦΑΡΜΟΓΗ ΤΗΣ ΛΥΣΗΣ: Επαναφορά της εστίασης στο κουμπί ***
        if (triggerButton) {
            triggerButton.focus();
        }
    });
});

}); // End of DOMContentLoaded