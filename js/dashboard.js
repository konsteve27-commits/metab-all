// ===== dashboard.js (Metab-all) =====
import { getUserData } from "./auth.js";
import { metaballAlert, metaballConfirm } from "./ui.js";

export function updateDashboard() {
    // DOM references
    const profileCard = document.getElementById("card-profile");
    const workoutCard = document.getElementById("card-workout");
    const myMealsCard = document.getElementById("card-my-meals");

    // Load Data from localStorage
    const user = getUserData();
    const mealLibrary = JSON.parse(localStorage.getItem("mealLibrary")) || {};
    const aioWorkouts = JSON.parse(localStorage.getItem("aioWorkouts")) || {};
    const aioWorkoutPRs = JSON.parse(localStorage.getItem("aioWorkoutPRs")) || {};

    // --- Helper function for Progress Bar HTML ---
    function getProgressBar(value, target, unit, meetGoal = false) {
        if (!target || target <= 0) return '';
        const percent = (value / target) * 100;
        const width = Math.min(100, percent); 
        
        let color = "#2ecc71"; 
        if (meetGoal) {
            if (percent < 50) color = "#e74c3c";
            else if (percent < 100) color = "#f59e0b";
        } else {
            if (percent > 110) color = "#e74c3c";
            else if (percent > 100) color = "#f59e0b";
        }

        return `
            <div class="progress-bar-container" style="height: 8px; margin-top: 5px;">
                <div class="progress-bar" style="width:${width}%; background:${color}; box-shadow: none;"></div>
            </div>
            <span style="font-size: 0.75rem; color: #9ca3af; margin-top: 3px; display: block;">
                ${value.toFixed(0)}${unit} / ${target.toFixed(0)}${unit}
            </span>
        `;
    }

    // Αν δεν υπάρχει χρήστης, δείξε τα defaults και σταμάτα
    if (!user) {
        updateProfileCardDefault(profileCard);
        updateMyMealsCardDefault(myMealsCard);
        updateWorkoutCardDefault(workoutCard);
        return;
    }

    // --- Εσωτερικές συναρτήσεις Update ---
    function updateProfileCard() {
        if (!profileCard || !user.macros) {
            updateProfileCardDefault(profileCard);
            return;
        }
        const greetingName = user.name ? user.name.split(' ')[0] : 'User';
        const goalMap = { loss: "Fat Loss", gain: "Lean Gain", bulk: "Bulk", maintain: "Maintenance" };
        const contentHTML = `
            <div class="profile-details">
                <h4 style="font-size: 1.25rem;">Hello, ${greetingName}!</h4>
                <p><strong>Age:</strong> ${user.age} y.o.</p>
                <p><strong>Weight:</strong> ${user.weight} kg</p>
                <p><strong>Target Goal:</strong> ${goalMap[user.goal]}</p>
            </div>
            <p style="margin-top: 10px; font-weight: 600; color: var(--color-accent);">Update Profile &rarr;</p>
        `;
        const contentWrapper = profileCard.querySelector('.card-content-wrapper');
        if (contentWrapper) contentWrapper.innerHTML = contentHTML;
    }

    function updateProfileCardDefault(card) {
        if (!card) return;
        const contentWrapper = card.querySelector('.card-content-wrapper');
        if (contentWrapper) {
            contentWrapper.innerHTML = `
                <div class="profile-details">
                    <h4 style="font-size: 1.25rem;">Welcome to Metab-all!</h4>
                    <p>Tap here to calculate your goals.</p>
                </div>
                <p style="margin-top: 10px; font-weight: 600; color: var(--color-accent);">Start Calculation &rarr;</p>
            `;
        }
    }

    function updateMyMealsCard() {
        if (!myMealsCard || !user.macros) {
            updateMyMealsCardDefault(myMealsCard);
            return;
        }
        let totalKcal = 0; let totalMeals = 0;
        for (const mealName in mealLibrary) {
            const m = mealLibrary[mealName];
            if (m.totals) { totalKcal += m.totals.kcal || 0; totalMeals++; }
        }
        const targetKcal = user.macros.calories;
        if (totalMeals > 0) {
            myMealsCard.innerHTML = `
                <span class="card-icon" style="color: #60a5fa;">SUM</span>
                <h4>Meals Logged</h4>
                <p><strong>Meals:</strong> ${totalMeals}</p>
                <p><strong>Total Kcal:</strong> ${totalKcal.toFixed(0)}</p>
                ${getProgressBar(totalKcal, targetKcal, 'kcal', false)}
                <p style="margin-top: 10px; font-weight: 600;">View Full Progress &rarr;</p>
            `;
        } else {
            updateMyMealsCardDefault(myMealsCard);
        }
    }

    function updateMyMealsCardDefault(card) {
        if (!card) return;
        card.innerHTML = `
            <span class="card-icon" style="color: #60a5fa;">SUM</span>
            <h4>Daily Progress</h4>
            <p>Start logging meals to see progress.</p>
            <p style="margin-top: 10px; font-weight: 600;">View Totals &rarr;</p>
        `;
    }

    function updateWorkoutCard() {
        if (!workoutCard) return;
        const workoutNames = Object.keys(aioWorkouts);
        let latestWorkoutName = "N/A";
        if (workoutNames.length > 0) {
            const sorted = workoutNames.map(name => ({
                name, date: new Date(aioWorkouts[name].date),
            })).sort((a, b) => b.date.getTime() - a.date.getTime());
            latestWorkoutName = sorted[0].name;
        }
        workoutCard.innerHTML = `
            <span class="card-icon" style="color: #f97373;">TRN</span>
            <h4>Workout Tracker</h4>
            <p><strong>Latest:</strong> ${latestWorkoutName}</p>
            <p><strong>PRs:</strong> ${Object.keys(aioWorkoutPRs).length} Total</p>
            <p style="margin-top: 10px; font-weight: 600;">Go to Tracker &rarr;</p>
        `;
    }

    function updateWorkoutCardDefault(card) {
        if (!card) return;
        card.innerHTML = `
           <span class="card-icon" style="color: #f97373;">TRN</span>
           <h4>Workout Tracker</h4>
           <p>Track your strength & volume.</p>
           <p style="margin-top: 10px; font-weight: 600;">Go to Tracker &rarr;</p>
       `;
    }

    // Εκτέλεση όλων των updates
    updateProfileCard();
    updateMyMealsCard();
    updateWorkoutCard();
}

function setupDataManagement() {
    const exportBtn = document.getElementById("exportDataBtn");
    const importBtn = document.getElementById("importDataBtn");
    const importFile = document.getElementById("importFile");

    if (!exportBtn || !importBtn || !importFile) return;

    // --- 1. EXPORT LOGIC ---
    exportBtn.onclick = () => {
        const fullData = {
            aioUserData: JSON.parse(localStorage.getItem("aioUserData")),
            mealLibrary: JSON.parse(localStorage.getItem("mealLibrary")),
            aioWorkouts: JSON.parse(localStorage.getItem("aioWorkouts")),
            aioWorkoutPRs: JSON.parse(localStorage.getItem("aioWorkoutPRs")),
            version: "1.0",
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `metaball_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        metaballAlert("✅ Your data has been exported successfully.", { type: "success", title: "Export Complete" });
    };

    // --- 2. IMPORT LOGIC ---
    importBtn.onclick = () => {
        // Κάνουμε reset την τιμή, ώστε να δουλεύει ακόμα κι αν ανεβάσουμε το ΙΔΙΟ αρχείο 2 φορές σερί
        importFile.value = ""; 
        importFile.click();
    };

    importFile.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // Επιβεβαίωση πριν το overwrite
                metaballConfirm("This will replace all your current profile, meals, and workouts. Are you sure?", {
                    type: "warning",
                    title: "Confirm Import",
                    confirmText: "Overwrite Data"
                }).then((ok) => {
                    if (!ok) {
                        importFile.value = ""; // Reset
                        return;
                    }

                    // Αποθήκευση στο localStorage
                    if (importedData.aioUserData) localStorage.setItem("aioUserData", JSON.stringify(importedData.aioUserData));
                    if (importedData.mealLibrary) localStorage.setItem("mealLibrary", JSON.stringify(importedData.mealLibrary));
                    if (importedData.aioWorkouts) localStorage.setItem("aioWorkouts", JSON.stringify(importedData.aioWorkouts));
                    if (importedData.aioWorkoutPRs) localStorage.setItem("aioWorkoutPRs", JSON.stringify(importedData.aioWorkoutPRs));

                    metaballAlert("✅ Import successful! The application will now reload.", { type: "success" }).then(() => {
                        window.location.reload();
                    });
                });
            } catch (err) {
                metaballAlert("❌ Invalid JSON file. Please use a file previously exported from Metab-all.", { type: "danger" });
            }
        };
        reader.readAsText(file);
    };
}


// 1. Αρχικό φόρτωμα: Τρέχουμε το UI update ΚΑΙ το setup των κουμπιών data
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    setupDataManagement(); // Τρέχει μόνο μία φορά εδώ
});

// 2. Όταν ο Router δείχνει 'home', ανανεώνουμε μόνο τα νούμερα στις κάρτες
document.addEventListener('spaContentUpdate', (e) => {
    if (e.detail.section === 'home') {
        updateDashboard(); 
        // ΔΕΝ ξανακαλούμε το setupDataManagement εδώ
    }
});