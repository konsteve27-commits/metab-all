// ===== micronutrients.js (Metab-all) =====
//
// getMicronutrientNeeds(gender, age, activity)
//  - επιστρέφει RDA / AI για βασικά μικροθρεπτικά
//  - προσαρμόζει ελαφρώς ανάλογα με τη δραστηριότητα
//
// micronutrientSources
//  - σύντομη περιγραφή βασικής τροφικής πηγής για tooltip / title
//

// Main function – returns adjusted RDA values
export function getMicronutrientNeeds(gender, age, activity) {
  const RDA = {
    male: {
      "18-30": {
        A: 900,
        C: 90,
        D: 15,
        E: 15,
        B6: 1.3,
        B12: 2.4,
        Folate: 400,
        Ca: 1000,
        Fe: 8,
        Mg: 400,
        Zn: 11,
        K: 3400
      },
      "31-50": {
        A: 900,
        C: 90,
        D: 15,
        E: 15,
        B6: 1.3,
        B12: 2.4,
        Folate: 400,
        Ca: 1000,
        Fe: 8,
        Mg: 420,
        Zn: 11,
        K: 3400
      },
      "51+": {
        A: 900,
        C: 90,
        D: 20,
        E: 15,
        B6: 1.7,
        B12: 2.4,
        Folate: 400,
        Ca: 1000,
        Fe: 8,
        Mg: 420,
        Zn: 11,
        K: 3400
      }
    },
    female: {
      "18-30": {
        A: 700,
        C: 75,
        D: 15,
        E: 15,
        B6: 1.3,
        B12: 2.4,
        Folate: 400,
        Ca: 1000,
        Fe: 18,
        Mg: 310,
        Zn: 8,
        K: 2600
      },
      "31-50": {
        A: 700,
        C: 75,
        D: 15,
        E: 15,
        B6: 1.3,
        B12: 2.4,
        Folate: 400,
        Ca: 1000,
        Fe: 18,
        Mg: 320,
        Zn: 8,
        K: 2600
      },
      "51+": {
        A: 700,
        C: 75,
        D: 20,
        E: 15,
        B6: 1.5,
        B12: 2.4,
        Folate: 400,
        Ca: 1200,
        Fe: 8,
        Mg: 320,
        Zn: 8,
        K: 2600
      }
    }
  };

  function getAgeGroup(a) {
    const ageNum = Number(a) || 0;
    if (ageNum <= 30) return "18-30";
    if (ageNum <= 50) return "31-50";
    return "51+";
  }

  const normalizedGender =
    gender === "male" || gender === "female" ? gender : "male";
  const ageGroup = getAgeGroup(age);

  const baseRDA =
    RDA[normalizedGender] && RDA[normalizedGender][ageGroup]
      ? RDA[normalizedGender][ageGroup]
      : RDA.male["18-30"];

  // Αντιγράφουμε για να μην πειράζουμε το RDA object
  const needs = { ...baseRDA };

  // Adjust based on activity
  // activity ~ 1.2–1.9 από calculator.js
  const adj =
    activity > 1.55 ? 1.15 : activity > 1.4 ? 1.1 : 1.0;

  for (let k in needs) {
    needs[k] = Math.round(needs[k] * adj);
  }

  return needs;
}

// ===== Food sources (for info buttons / tooltips) =====
export const micronutrientSources = {
  A: "Carrots – ~8350 μg vit. A / 100 g",
  C: "Guava – ~228 mg vit. C / 100 g",
  D: "Salmon – ~10 μg vit. D / 100 g",
  E: "Sunflower seeds – ~35 mg vit. E / 100 g",
  B6: "Chickpeas – ~1.1 mg vit. B6 / 100 g",
  B12: "Beef liver – ~83 μg vit. B12 / 100 g",
  Folate: "Spinach – ~194 μg folate / 100 g",
  Ca: "Parmesan cheese – ~1184 mg calcium / 100 g",
  Fe: "Clams – ~28 mg iron / 100 g",
  Mg: "Pumpkin seeds – ~535 mg magnesium / 100 g",
  Zn: "Oysters – ~78 mg zinc / 100 g",
  K: "Dried apricots – ~1160 mg potassium / 100 g"
};
