import { workoutData } from "./workoutData.js";
import { metaballAlert, metaballConfirm, metaballPrompt } from "./ui.js";

// -------------------------------
// DOM elements (workout.html)
// -------------------------------
const table = document.getElementById("exerciseTable");
const saveBtn = document.getElementById("saveWorkoutBtn");
const results = document.getElementById("workoutResults");
const myWorkoutsDiv = document.getElementById("myWorkouts");
const createWorkoutBtn = document.getElementById("createWorkoutBtn");
const activeWorkoutBox = document.getElementById("activeWorkoutBox");
const activeWorkoutName = document.getElementById("activeWorkoutName");
const exerciseSearchInput = document.getElementById("exerciseSearch");
const exerciseResultsList = document.getElementById("exerciseResults");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const deleteWorkoutBtn = document.getElementById("deleteWorkoutBtn");
const undoBtn = document.getElementById("undoBtn");

// -------------------------------
// State
// -------------------------------
let workoutItems = []; // raw sets for active workout
let currentWorkout = "";
let aioWorkouts = JSON.parse(localStorage.getItem("aioWorkouts")) || {};
let aioWorkoutPRs = JSON.parse(localStorage.getItem("aioWorkoutPRs")) || {};

const DRAFT_NAME_KEY = "aioWorkoutDraftName";
const DRAFT_ITEMS_KEY = "aioWorkoutDraftItems";

let undoStack = [];

// -------------------------------
// Undo helpers
// -------------------------------
function pushUndo() {
  // κρατάμε ένα snapshot ΠΡΙΝ την αλλαγή
  undoStack.push(JSON.parse(JSON.stringify(workoutItems)));
}

function applyUndo() {
  if (undoStack.length === 0) return;
  workoutItems = undoStack.pop();
  updateTable();
  saveDraft();
}

// -------------------------------
// Cancel / Delete / Undo buttons
// -------------------------------
if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
        metaballConfirm("Cancel and close this workout?", {
            type: "warning",
            title: "Cancel Workout",
            confirmText: "Close Workout",
            cancelText: "Keep Editing",
        }).then((ok) => {
            if (!ok) return;

            // ----- HARD RESET WORKOUT EDITOR -----
            currentWorkout = "";
            workoutItems = [];
            undoStack = [];
            clearDraft();

            // hide editor box
            activeWorkoutBox.style.display = "none";

            // clear UI
            updateActiveWorkoutBox();
            updateTable();
            results.innerHTML = "";

            metaballAlert("Workout closed.", { type: "info" });
        });
    });
}


if (deleteWorkoutBtn) {
  deleteWorkoutBtn.addEventListener("click", () => {
    metaballConfirm("Delete this workout permanently?", {
      type: "danger",
      title: "Delete workout",
      confirmText: "Delete",
      cancelText: "Cancel",
    }).then((ok) => {
      if (!ok) return;

      delete aioWorkouts[currentWorkout];
      localStorage.setItem("aioWorkouts", JSON.stringify(aioWorkouts));

      currentWorkout = "";
      workoutItems = [];
      undoStack = [];
      clearDraft();
      updateActiveWorkoutBox();
      updateTable();
      results.innerHTML = "";

      renderMyWorkouts();
      metaballAlert("Workout deleted.", { type: "success" });
    });
  });
}

if (undoBtn) {
  undoBtn.addEventListener("click", () => {
    applyUndo();
  });
}

// -------------------------------
// Helpers
// -------------------------------
function updateActiveWorkoutBox() {
  if (!currentWorkout) {
    activeWorkoutBox.style.display = "none";
    return;
  }
  activeWorkoutName.textContent = currentWorkout;
  activeWorkoutBox.style.display = "block";
}

function estimate1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

function groupRawSets(items) {
  const grouped = {};

  items.forEach((s) => {
    if (!grouped[s.name]) {
      grouped[s.name] = {
        name: s.name,
        group: s.group,
        sets: 0,
        totalReps: 0,
        totalVolume: 0,
        est1RM: 0,
        topSetText: "",
      };
    }

    const weight = Number(s.weight) || 0;
    const reps = Number(s.reps) || 0;
    const sets = Number(s.sets) || 0;

    const vol = weight * reps * sets;
    const est = estimate1RM(weight, reps);

    grouped[s.name].sets += sets;
    grouped[s.name].totalReps += reps * sets;
    grouped[s.name].totalVolume += vol;

    if (est > grouped[s.name].est1RM) {
      grouped[s.name].est1RM = est;
      grouped[s.name].topSetText = `${weight}kg × ${reps} (Est 1RM: ${est.toFixed(
        1
      )}kg)`;
    }
  });

  return Object.values(grouped);
}

function safeDiff(current, previous) {
  if (!previous || previous === 0 || !isFinite(previous)) return "New";
  const diff = ((current - previous) / previous) * 100;
  if (!isFinite(diff)) return "New";
  return diff.toFixed(1) + "%";
}

// -------------------------------
// Draft helpers (keep edit area active until Save/Delete)
// -------------------------------
function saveDraft() {
  if (!currentWorkout) return;
  try {
    localStorage.setItem(DRAFT_NAME_KEY, currentWorkout);
    localStorage.setItem(DRAFT_ITEMS_KEY, JSON.stringify(workoutItems));
  } catch (err) {
    console.error("Failed to save workout draft", err);
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_NAME_KEY);
  localStorage.removeItem(DRAFT_ITEMS_KEY);
}

function restoreDraft() {
  const draftName = localStorage.getItem(DRAFT_NAME_KEY);
  const draftItemsRaw = localStorage.getItem(DRAFT_ITEMS_KEY);
  if (!draftName || !draftItemsRaw) return;

  try {
    const draftItems = JSON.parse(draftItemsRaw);
    if (!Array.isArray(draftItems)) {
      clearDraft();
      return;
    }

    currentWorkout = draftName;
    workoutItems = draftItems;
    undoStack = [];
    updateActiveWorkoutBox();
    updateTable();

    metaballAlert(`Restored unsaved changes for "${currentWorkout}".`, {
      type: "info",
      title: "Unsaved workout restored",
    });
  } catch (err) {
    console.error("Failed to restore workout draft", err);
    clearDraft();
  }
}

// -------------------------------
// My Workouts List
// -------------------------------
function renderMyWorkouts() {
  myWorkoutsDiv.innerHTML = "";
  const names = Object.keys(aioWorkouts);

  if (!names.length) {
    myWorkoutsDiv.innerHTML = "<p>No saved workouts yet.</p>";
    return;
  }

  // latest first
  names.sort((a, b) => {
    const da = new Date(aioWorkouts[a].date || 0).getTime();
    const db = new Date(aioWorkouts[b].date || 0).getTime();
    return db - da;
  });

  names.forEach((name) => {
    const w = aioWorkouts[name];

    const card = document.createElement("div");
    card.classList.add("workout-card");

    const info = document.createElement("div");
    info.innerHTML = `
      <div class="workout-title">${name}</div>
      <div class="workout-date">${new Date(w.date).toLocaleDateString()}</div>
    `;

    const actions = document.createElement("div");
    actions.classList.add("workout-actions");

    const openBtn = document.createElement("button");
    openBtn.classList.add("open-btn");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => loadWorkout(name));

    const delBtn = document.createElement("button");
    delBtn.classList.add("del-btn");
    delBtn.textContent = "Delete";

    delBtn.addEventListener("click", () => {
      metaballConfirm("Delete workout?", {
        type: "danger",
        title: "Delete workout",
        confirmText: "Delete",
        cancelText: "Cancel",
      }).then((ok) => {
        if (!ok) return;

        // if deleting the active workout, reset editor
        if (currentWorkout === name) {
          currentWorkout = "";
          workoutItems = [];
          undoStack = [];
          clearDraft();
          updateActiveWorkoutBox();
          if (table) table.innerHTML = "";
          results.innerHTML = "";
        }

        card.classList.add("removing");
        setTimeout(() => {
          delete aioWorkouts[name];
          localStorage.setItem("aioWorkouts", JSON.stringify(aioWorkouts));
          renderMyWorkouts();
        }, 350);
      });
    });

    actions.append(openBtn, delBtn);
    card.append(info, actions);
    myWorkoutsDiv.appendChild(card);
  });
}

// -------------------------------
// Create New Workout
// -------------------------------
if (createWorkoutBtn) {
  createWorkoutBtn.addEventListener("click", () => {
    metaballPrompt("Name your workout:", {
      type: "info",
      title: "Create workout",
      confirmText: "Create",
      cancelText: "Cancel",
      defaultValue: "",
    }).then((name) => {
      if (!name) return; // cancel ή κενό

      clearDraft();
      currentWorkout = name.trim();
      workoutItems = [];
      undoStack = [];

      aioWorkouts[currentWorkout] = {
        date: new Date().toISOString(),
        rawSets: [],
        grouped: [],
      };

      updateActiveWorkoutBox();
      updateTable();
      saveDraft();
      renderMyWorkouts();

      metaballAlert(`✅ Workout "${currentWorkout}" created.`, {
        type: "success",
        title: "Workout created",
      });
    });
  });
}

// -------------------------------
// Load Workout
// -------------------------------
function loadWorkout(name) {
  const data = aioWorkouts[name];
  if (!data) return;

  clearDraft();
  currentWorkout = name;
  workoutItems = JSON.parse(JSON.stringify(data.rawSets || []));
  undoStack = [];

  updateActiveWorkoutBox();
  updateTable();
  saveDraft();
  results.innerHTML = "";

  metaballAlert(`Loaded "${name}"`, {
    type: "info",
    title: "Workout loaded",
  });
}

// -------------------------------
// Exercise Search (global, by name)
// -------------------------------
function addExerciseToWorkout(ex) {
  if (!currentWorkout) {
    metaballAlert("Please create or open a workout first.", {
      type: "warning",
      title: "No active workout",
    });
    return;
  }

  pushUndo();
  workoutItems.push({
    name: ex.name,
    group: ex.muscle,
    weight: "",
    reps: "",
    sets: "",
  });

  updateTable();
  saveDraft();
}

if (exerciseSearchInput && exerciseResultsList) {
  exerciseSearchInput.addEventListener("input", () => {
    const query = exerciseSearchInput.value.trim().toLowerCase();
    exerciseResultsList.innerHTML = "";
    exerciseResultsList.classList.remove("is-open");

    if (!query) return;

    const matches = workoutData.filter((ex) =>
      ex.name.toLowerCase().includes(query)
    );

    if (!matches.length) return;

    exerciseResultsList.classList.add("is-open");

    matches.forEach((ex) => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.textContent = `${ex.name} (${ex.muscle})`;

      div.addEventListener("click", () => {
        addExerciseToWorkout(ex);
        exerciseSearchInput.value = "";
        exerciseResultsList.innerHTML = "";
        exerciseResultsList.classList.remove("is-open");
      });

      exerciseResultsList.appendChild(div);
    });
  });
}

// -------------------------------
// Table Rendering
// -------------------------------
function updateTable() {
  if (!table) return;

  if (!workoutItems.length) {
    table.innerHTML = "";
    return;
  }

  let html = `
    <table class="styled-table">
      <tr>
        <th>Exercise</th>
        <th>Group</th>
        <th>Weight</th>
        <th>Reps</th>
        <th>Sets</th>
        <th>🗑</th>
      </tr>`;

  workoutItems.forEach((ex, i) => {
    html += `
      <tr>
        <td>${ex.name}</td>
        <td>${ex.group}</td>
        <td><input type="number" inputmode="numeric" pattern="[0-9]*" value="${ex.weight}" data-i="${i}" data-field="weight"></td>
        <td><input type="number" inputmode="numeric" pattern="[0-9]*" value="${ex.reps}" data-i="${i}" data-field="reps"></td>
        <td><input type="number" inputmode="numeric" pattern="[0-9]*" value="${ex.sets}" data-i="${i}" data-field="sets"></td>
        <td><button class="table-del" data-index="${i}"><span>✖</span></button></td>
      </tr>`;
  });

  html += "</table>";
  table.innerHTML = `<div class="table-wrapper">${html}</div>`;
}

// Auto-select input text when focused
if (table) {
  table.addEventListener("focusin", (e) => {
    if (e.target.tagName === "INPUT") {
      e.target.select();
    }
  });

  // Input Handling (sanitized) + autosave + undo
  table.addEventListener("input", (e) => {
    const i = e.target.dataset.i;
    const f = e.target.dataset.field;

    if (i !== undefined && f) {
      pushUndo();

      let val = parseFloat(e.target.value);
      if (!isFinite(val) || val < 0) val = 0;
      if (f === "reps" && val > 60) val = 60;
      if (f === "sets" && val > 20) val = 20;
      workoutItems[i][f] = val;
      e.target.value = val;
      saveDraft();
    }
  });

  // Delete row + autosave + undo
  table.addEventListener("click", (e) => {
    const btn = e.target.closest(".table-del");
    if (!btn) return;

    const index = parseInt(btn.dataset.index, 10);
    if (Number.isNaN(index)) return;

    pushUndo();
    workoutItems.splice(index, 1);
    updateTable();
    saveDraft();
  });
}

// -------------------------------
// SAVE WORKOUT (PR + Progress)
// -------------------------------
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    if (!currentWorkout) {
      metaballAlert("Please create or open a workout before saving.", {
        type: "warning",
        title: "No active workout",
      });
      return;
    }

    if (!workoutItems.length) {
      metaballAlert("Add at least one exercise/set before saving.", {
        type: "warning",
        title: "Empty workout",
      });
      return;
    }

    const prev = aioWorkouts[currentWorkout] || null;
    const grouped = groupRawSets(workoutItems);

    const progress = grouped.map((ex) => {
      const prevEx = prev?.grouped?.find((p) => p.name === ex.name) || null;

      const strength = safeDiff(ex.est1RM, prevEx?.est1RM);
      const volume = safeDiff(ex.totalVolume, prevEx?.totalVolume);

      // PR tracking (all-time per exercise name)
      let isPR = false;
      if (!aioWorkoutPRs[ex.name]) {
        aioWorkoutPRs[ex.name] = ex.est1RM;
      } else if (ex.est1RM > aioWorkoutPRs[ex.name]) {
        aioWorkoutPRs[ex.name] = ex.est1RM;
        isPR = true;
      }

      return { ...ex, strength, volume, isPR };
    });

    results.innerHTML = `
      <h2>Strength & Volume Progress</h2>
      <div class="table-wrapper">
        <table class="styled-table">
          <tr>
            <th>Exercise</th>
            <th>1RM Progress</th>
            <th>Volume Progress</th>
            <th>Top Set</th>
            <th>PR</th>
          </tr>
          ${progress
            .map(
              (ex) => `
            <tr>
              <td>${ex.name}</td>
              <td>${ex.strength}</td>
              <td>${ex.volume}</td>
              <td>${ex.topSetText}</td>
              <td>${ex.isPR ? "🏆" : "-"}</td>
            </tr>`
            )
            .join("")}
        </table>
      </div>
    `;

    aioWorkouts[currentWorkout] = {
      date: new Date().toISOString(),
      rawSets: JSON.parse(JSON.stringify(workoutItems)),
      grouped,
    };

    localStorage.setItem("aioWorkouts", JSON.stringify(aioWorkouts));
    localStorage.setItem("aioWorkoutPRs", JSON.stringify(aioWorkoutPRs));

    clearDraft();          // επίσημο save
    undoStack = [];        // νέο “καθαρό” σημείο
    metaballAlert(`✅ Updated "${currentWorkout}" in Metab-all`, {
      type: "success",
      title: "Workout updated",
    });

    renderMyWorkouts();
  });
}

// -------------------------------
// Initial render + draft restore
// -------------------------------
restoreDraft();
renderMyWorkouts();
