// ===== main.js (Metab-all) =====
// Handles: calorie & macro calculation, micronutrient needs,
// saving to localStorage and viewing / clearing saved data.

import { calculateNeeds } from "./calculator.js";
import { getMicronutrientNeeds, micronutrientSources } from "./micronutrients.js";
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
  });
  return;
}


    // === Calculate macros (Mifflin–St Jeor etc.) ===
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
    const micros = getMicronutrientNeeds(data.gender, data.age, calc.activity);

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
    console.log("✅ Metab-all: User data saved:", userData);

    // === Build Micronutrient table HTML ===
    let microsHTML = `<table>
      <tr>
        <th>Micronutrient</th>
        <th>Amount</th>
        <th>Info</th>
      </tr>`;

    for (let [k, v] of Object.entries(micros)) {
      const unit = ["A", "D", "B12", "Folate"].includes(k) ? "μg" : "mg";
      const source = micronutrientSources[k] || "No data available";
      microsHTML += `
        <tr>
          <td>${k}</td>
          <td>${v} ${unit}</td>
          <td><button class="info-btn" title="${source}">❕</button></td>
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
  // 2) VIEW SAVED DATA
  // ==========================
  if (viewBtn) {
    viewBtn.addEventListener("click", () => {
      const user = getUserData();
     if (!user) {
  metaballAlert("⚠️ No saved Metab-all data found.", {
    type: "warning",
    title: "No saved profile",
  });
  return;
}

      const microsHTML = Object.entries(user.micros || {})
        .map(([key, value]) => `<li>${key}: ${value}</li>`)
        .join("");

      resultsDiv.style.display = "block";
      resultsDiv.innerHTML = `
        <h2>Saved Data</h2>
        <p><strong>Gender:</strong> ${user.gender}</p>
        <p><strong>Age:</strong> ${user.age}</p>
        <p><strong>Weight:</strong> ${user.weight} kg</p>
        <p><strong>Height:</strong> ${user.height} cm</p>
        <p><strong>Goal:</strong> ${user.goal}</p>
        <hr>
        <h3>Macros</h3>
        <p>Calories: ${user.macros.calories.toFixed(0)} kcal</p>
        <p>Protein: ${user.macros.protein} g</p>
        <p>Carbs: ${user.macros.carbs} g</p>
        <p>Fat: ${user.macros.fat} g</p>
        <p>Fibre: ${user.macros.fibre} g</p>
        <hr>
        <h3>Micronutrients</h3>
        <ul>${microsHTML}</ul>
        <p><em>Last updated: ${new Date(user.updatedAt).toLocaleString()}</em></p>
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
      title: "Clear Metab-all profile?",
      confirmText: "Clear data",
      cancelText: "Cancel",
    }).then((ok) => {
      if (!ok) return;

      clearUserData();
      resultsDiv.style.display = "none";
      resultsDiv.innerHTML = "";

      metaballAlert("✅ All Metab-all data has been cleared.", {
        type: "success",
        title: "Profile reset",
      });
    });
  });
}


});
