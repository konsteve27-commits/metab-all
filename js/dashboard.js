// ===== dashboard.js (Metab-all) =====
import { getUserData } from "./auth.js";

// 1. Τυλίγουμε όλο τον κώδικα σε μια συνάρτηση export
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

// 2. LISTENERS
// Αρχικό φόρτωμα
document.addEventListener("DOMContentLoaded", updateDashboard);

// Ανανέωση όταν ο Router δείχνει 'home'
document.addEventListener('spaContentUpdate', (e) => {
    if (e.detail.section === 'home') {
        updateDashboard();
    }
});