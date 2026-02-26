// ===== main.js (Metab-all) =====
import { calculateNeeds } from "./calculator.js";
import { getMicronutrientNeeds, micronutrientSources, micronutrientBenefits } from "./micronutrients.js"; 
import { saveUserData, getUserData, clearUserData } from "./auth.js";
import { metaballAlert, metaballConfirm } from "./ui.js";

// === 1. DOM REFERENCES (Global στο module) ===
let calculateBtn, viewBtn, clearBtn, resultsDiv;

// === 2. ENTRY POINT (Καλείται από τον Router) ===
export function initCalories() {
    calculateBtn = document.getElementById("calculateBtn");
    viewBtn = document.getElementById("viewDataBtn");
    clearBtn = document.getElementById("clearDataBtn");
    resultsDiv = document.getElementById("results");

    if (!calculateBtn || !resultsDiv) {
        console.error("❌ Metab-all: Missing calculator DOM elements.");
        return;
    }

    // Κρύβουμε τα παλιά αποτελέσματα κάθε φορά που μπαίνουμε στη σελίδα
    resultsDiv.style.display = "none";
    resultsDiv.innerHTML = "";

    // Ενεργοποίηση Listeners
    setupEventListeners();
}

// Ο Router ακούει εδώ για να ξυπνήσει τη σελίδα
document.addEventListener('spaContentUpdate', (e) => {
    if (e.detail.section === 'calories') {
        initCalories();
    }
});

// === 3. EVENT SETUP ===
function setupEventListeners() {
    if (calculateBtn) calculateBtn.onclick = handleCalculate;
    if (viewBtn) viewBtn.onclick = handleViewData;
    if (clearBtn) clearBtn.onclick = handleClearData;

    // Event Delegation για τα κουμπιά "Info" στα μικροθρεπτικά
    if (resultsDiv && !resultsDiv.dataset.listenerActive) {
        resultsDiv.addEventListener('click', handleInfoClick);
        resultsDiv.dataset.listenerActive = "true";
    }
}

// === 4. ACTION HANDLERS ===
function handleCalculate() {
    // Σωστή δήλωση του αντικειμένου (Διορθώθηκε το συντακτικό λάθος)
    const data = {
        gender: document.getElementById("gender")?.value,
        name: document.getElementById("name")?.value || "",
        age: parseFloat(document.getElementById("age")?.value),
        weight: parseFloat(document.getElementById("weight")?.value),
        height: parseFloat(document.getElementById("height")?.value),
        workouts: parseFloat(document.getElementById("workoutsPerWeek")?.value) || 0,
        hours: parseFloat(document.getElementById("hoursPerWorkout")?.value) || 0,
        intensity: document.getElementById("intensity")?.value,
        goal: document.getElementById("goal")?.value
    };

    if (!data.gender || !data.age || !data.weight || !data.height) {
        metaballAlert("Please fill in gender, age, weight and height.", {
            type: "warning",
            title: "Missing Information"
        });
        return;
    }

    // Υπολογισμοί
    const calc = calculateNeeds(data);

    let adjustedCalories;
    switch (data.goal) {
        case "loss": adjustedCalories = calc.TDEE * 0.8; break;
        case "gain": adjustedCalories = calc.TDEE * 1.1; break;
        case "bulk": adjustedCalories = calc.TDEE * 1.25; break;
        default: adjustedCalories = calc.TDEE;
    }

    const micros = getMicronutrientNeeds(data.gender, data.age, calc.activity, data.intensity);

    const userData = {
        name: data.name, gender: data.gender, age: data.age, weight: data.weight,
        height: data.height, workouts: data.workouts, hours: data.hours,
        intensity: data.intensity, goal: data.goal,
        macros: {
            calories: adjustedCalories, protein: calc.protein,
            carbs: calc.carbs, fat: calc.fat, fibre: calc.fibre,
        },
        micros,
        updatedAt: new Date().toISOString(),
    };

    saveUserData(userData);

    // Δημιουργία HTML Πίνακα
    let microsHTML = `<table class="styled-table"><tr><th>Micronutrient</th><th>Amount</th><th>Info</th></tr>`;
    for (let [k, v] of Object.entries(micros)) {
        const unit = ["A", "D", "B12", "Folate"].includes(k) ? "μg" : "mg";
        microsHTML += `<tr><td>${k}</td><td>${v} ${unit}</td><td><button class="info-btn" data-micro="${k}">❕</button></td></tr>`;
    }
    microsHTML += `</table>`;

    // Εμφάνιση
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
    
    // Στέλνουμε update σήμα για να ενημερωθεί το Dashboard αν πάει εκεί ο χρήστης
    document.dispatchEvent(new CustomEvent('spaContentUpdate', { detail: { section: 'home' } }));
}

function handleViewData() {
    const user = getUserData();
    if (!user) {
        metaballAlert("⚠️ No saved Metab-all data found.", { type: "warning", title: "No Saved Profile" });
        return;
    }

    let microsHTML = `<table class="styled-table"><tr><th>Micronutrient</th><th>Amount</th><th>Info</th></tr>`;
    for (let [k, v] of Object.entries(user.micros || {})) {
        const unit = ["A", "D", "B12", "Folate"].includes(k) ? "μg" : "mg";
        microsHTML += `<tr><td>${k}</td><td>${v} ${unit}</td><td><button class="info-btn" data-micro="${k}">❕</button></td></tr>`;
    }
    microsHTML += `</table>`;

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
}

function handleClearData() {
    metaballConfirm("⚠️ Clear all saved Metab-all data?", {
        type: "danger", title: "Clear Metab-all Profile?", confirmText: "Clear Data", cancelText: "Cancel"
    }).then((ok) => {
        if (!ok) return;
        clearUserData();
        resultsDiv.style.display = "none";
        resultsDiv.innerHTML = "";
        
        // Καθαρίζουμε και τη φόρμα για σιγουριά
        document.querySelectorAll('#calories input, #calories select').forEach(el => el.value = '');

        metaballAlert("✅ All Metab-all data has been cleared.", { type: "success", title: "Profile Reset" });
        
        // Ενημερώνουμε το Dashboard ότι σβήστηκαν τα δεδομένα
        document.dispatchEvent(new CustomEvent('spaContentUpdate', { detail: { section: 'home' } }));
    });
}

function handleInfoClick(e) {
    const btn = e.target.closest('.info-btn');
    if (!btn) return;
    
    const triggerButton = btn; 
    const microKey = btn.dataset.micro;
    
    const nameMap = {
        A: "Vitamin A", C: "Vitamin C", D: "Vitamin D", E: "Vitamin E", 
        B6: "Vitamin B6", B12: "Vitamin B12", Folate: "Folate", Ca: "Calcium", 
        Fe: "Iron", Mg: "Magnesium", Zn: "Zinc", K: "Potassium"
    };

    const microName = nameMap[microKey] || microKey;
    const benefit = micronutrientBenefits[microKey] || "No information found for this micronutrient.";
    const source = micronutrientSources[microKey] || "No primary food sources found.";
    
    const messageHTML = `
        <p><strong>Importance:</strong> ${benefit}</p>
        <p style="margin-top: 10px;"><strong>Primary Food Sources:</strong> ${source}</p>
    `;

    metaballAlert(messageHTML, {
        type: 'info',
        title: `${microName} Info`,
    }).then(() => {
        if (triggerButton) {
            triggerButton.focus();
        }
    });
}