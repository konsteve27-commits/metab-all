// ===== auth.js (Metab-all) =====
// Local user profile & targets storage
// Χρησιμοποιείται από main.js, meals.js, my_meals.js κ.λπ.

// Κρατάμε το ίδιο key για πλήρη συμβατότητα με παλιό data
const STORAGE_KEY = "aioUserData";

// Αποθήκευση δεδομένων χρήστη στο localStorage
export function saveUserData(data) {
  try {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid user data object");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("✅ Metab-all: user data saved to localStorage");
  } catch (err) {
    console.error("❌ Metab-all: error saving user data:", err);
  }
}

// Ανάκτηση δεδομένων χρήστη από το localStorage
export function getUserData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data || typeof data !== "object") {
      console.warn("⚠️ Metab-all: stored user data is invalid");
      return null;
    }

    return data;
  } catch (err) {
    console.error("❌ Metab-all: error reading user data:", err);
    return null;
  }
}

// Διαγραφή (reset προφίλ / στόχων)
export function clearUserData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("🧹 Metab-all: user data cleared");
  } catch (err) {
    console.error("❌ Metab-all: error clearing user data:", err);
  }
}
