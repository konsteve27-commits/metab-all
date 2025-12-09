// ui.js – Metab-all UI helpers (custom alerts / confirms)

let dialogRoot;
let panelEl;
let accentEl;
let titleEl;
let messageEl;
let confirmBtn;
let cancelBtn;
let backdropEl;
let inputWrapper;
let inputEl;


let currentResolver = null;
let currentMode = "alert"; // "alert" | "confirm"

function createDialog() {
  if (dialogRoot) return;

  dialogRoot = document.createElement("div");
  dialogRoot.id = "metaball-dialog";
  dialogRoot.className = "mb-dialog";
  dialogRoot.setAttribute("aria-hidden", "true");

dialogRoot.innerHTML = `
  <div class="mb-dialog__backdrop"></div>
  <div class="mb-dialog__panel" role="alertdialog" aria-modal="true">
    <div class="mb-dialog__accent" aria-hidden="true">⚡</div>
    <div class="mb-dialog__body">
      <h3 class="mb-dialog__title">Metab-all</h3>
      <p class="mb-dialog__message"></p>
      <div class="mb-dialog__field" style="margin-top: 0.75rem; display: none;">
        <input type="text" class="mb-dialog__input" />
      </div>
    </div>
    <div class="mb-dialog__actions">
      <button type="button" class="btn mb-dialog__btn-cancel">Cancel</button>
      <button type="button" class="btn mb-dialog__btn-confirm">OK</button>
    </div>
  </div>
`;


  document.body.appendChild(dialogRoot);

panelEl = dialogRoot.querySelector(".mb-dialog__panel");
accentEl = dialogRoot.querySelector(".mb-dialog__accent");
titleEl = dialogRoot.querySelector(".mb-dialog__title");
messageEl = dialogRoot.querySelector(".mb-dialog__message");
inputWrapper = dialogRoot.querySelector(".mb-dialog__field");
inputEl = dialogRoot.querySelector(".mb-dialog__input");
confirmBtn = dialogRoot.querySelector(".mb-dialog__btn-confirm");
cancelBtn = dialogRoot.querySelector(".mb-dialog__btn-cancel");
backdropEl = dialogRoot.querySelector(".mb-dialog__backdrop");


  // Event handlers
  confirmBtn.addEventListener("click", () => closeDialog(true));
  cancelBtn.addEventListener("click", () => closeDialog(false));
  backdropEl.addEventListener("click", () => closeDialog(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialogRoot.classList.contains("is-open")) {
      closeDialog(false);
    }
  });
}

function openDialog(message, options = {}) {
  if (document.readyState === "loading") {
    return new Promise((resolve) => {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          resolve(openDialog(message, options));
        },
        { once: true }
      );
    });
  }

  createDialog();

  const {
    type = "info",           // info | success | warning | danger
    title = null,
    mode = "alert",          // alert | confirm
    confirmText = "OK",
    cancelText = "Cancel",
  } = options;

  currentMode = mode;

  // καθάρισε παλιές κλάσεις variant
  dialogRoot.classList.remove(
    "mb-dialog--info",
    "mb-dialog--success",
    "mb-dialog--warning",
    "mb-dialog--danger"
  );
  dialogRoot.classList.add(`mb-dialog--${type}`);

  // icon ανάλογα με type
  const iconMap = {
    info: "💡",
    success: "✅",
    warning: "⚠️",
    danger: "🧨",
  };
  accentEl.textContent = iconMap[type] || "💡";

  titleEl.textContent =
    title ||
    (type === "success"
      ? "All good!"
      : type === "danger"
      ? "Are you sure?"
      : type === "warning"
      ? "Heads up"
      : "Metab-all");

  messageEl.textContent = message;

  confirmBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;

 // Αν είναι απλό alert -> κρύψε Cancel, αλλιώς (confirm/prompt) δείξ' το
cancelBtn.style.display = mode === "alert" ? "none" : "inline-flex";
// prompt mode -> δείξε input
if (inputWrapper && inputEl) {
  if (mode === "prompt") {
    inputWrapper.style.display = "block";
    inputEl.value = options.defaultValue || "";
    setTimeout(() => inputEl.focus(), 30);
  } else {
    inputWrapper.style.display = "none";
    inputEl.value = "";
  }
}


dialogRoot.classList.add("is-open");
dialogRoot.setAttribute("aria-hidden", "false");
document.body.classList.add("mb-dialog-open");
document.documentElement.classList.add("mb-dialog-open");

  // μικρό focus για keyboard users
  setTimeout(() => {
    confirmBtn.focus();
  }, 10);

  return new Promise((resolve) => {
    currentResolver = resolve;
  });
}

function closeDialog(result) {
  if (!dialogRoot || !dialogRoot.classList.contains("is-open")) return;

dialogRoot.classList.remove("is-open");
dialogRoot.setAttribute("aria-hidden", "true");
document.body.classList.remove("mb-dialog-open");
document.documentElement.classList.remove("mb-dialog-open");


  if (currentResolver) {
  let value;

  if (currentMode === "alert") {
    value = true;
  } else if (currentMode === "confirm") {
    value = !!result;
  } else if (currentMode === "prompt") {
    if (!result) {
      value = null; // cancel
    } else {
      const v = inputEl ? inputEl.value.trim() : "";
      value = v || null;
    }
  } else {
    value = true;
  }

  currentResolver(value);
}


  currentResolver = null;
  currentMode = "alert";
}

// Public API
export function metaballAlert(message, options = {}) {
  return openDialog(message, { ...options, mode: "alert" });
}

export function metaballConfirm(message, options = {}) {
  return openDialog(message, { ...options, mode: "confirm" });
}
export function metaballPrompt(message, options = {}) {
  return openDialog(message, { ...options, mode: "prompt" });
}