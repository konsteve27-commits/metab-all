// ===== micronutrients.js (Metab-all) =====
//
// getMicronutrientNeeds(gender, age, activity, intensity)
//  - Returns RDA / AI for key micronutrients
//  - Adjusts based on calculated activity AND user-defined intensity.
//
// ... (rest of file description)

// Main function – returns adjusted RDA values
export function getMicronutrientNeeds(gender, age, activity, intensity) { // MODIFIED: Added intensity
  const RDA = {
    // ... (RDA object remains the same) ...
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

  // Create copy to not mutate RDA object
  const needs = { ...baseRDA };

  // ===== NEW ADJUSTMENT LOGIC (Based on Intensity) =====
  let intensityAdjustment = 0;
  if (intensity === "moderate") {
    intensityAdjustment = 0.10; // 10% for Moderate
  } else if (intensity === "intense") {
    intensityAdjustment = 0.20; // 20% for Intense (higher metabolic demand)
  }
  
  // Use a final factor based on activity factor for more granularity,
  // but cap the max adjustment at 20%
  const activityAdjustment = (activity - 1.2) * 0.1; // Scale 0-0.07

  // Final multiplier, limited to 1.20 (20% total increase)
  const adj = Math.min(1 + intensityAdjustment + activityAdjustment, 1.20); 

  for (let k in needs) {
    // Micronutrients vital for energy (B-vits, Mg, Fe, K, Zn) get the full boost
    if (['B6', 'B12', 'Mg', 'Fe', 'Zn', 'K', 'C'].includes(k)) {
        needs[k] = Math.round(needs[k] * adj);
    } 
    // Other micros (A, D, E, Ca, Folate) get a smaller, constant boost max 10%
    else {
        needs[k] = Math.round(needs[k] * Math.min(adj, 1.10));
    }
  }

  return needs;
}

// ===== Food sources (for info buttons / tooltips) =====
export const micronutrientSources = {
  A: "Carrots – ~8350 μg vit. A / 100 g",
  C: "Red Peppers – ~128 mg vit. C / 100 g",
  D: "Salmon – ~10 μg vit. D / 100 g",
  E: "Sunflower Seeds – ~35 mg vit. E / 100 g",
  B6: "Chickpeas – ~1.1 mg vit. B6 / 100 g",
  B12: "Beef Liver – ~83 μg vit. B12 / 100 g",
  Folate: "Spinach – ~194 μg Folate / 100 g",
  Ca: "Parmesan Cheese – ~1184 mg Calcium / 100 g",
  Fe: "Clams – ~28 mg Iron / 100 g",
  Mg: "Pumpkin Seeds – ~535 mg Magnesium / 100 g",
  Zn: "Oysters – ~78 mg Zinc / 100 g",
  K: "Dried Apricots – ~1160 mg Potassium / 100 g"
};

// ===== Micronutrient Benefits (for info pop-up) =====
export const micronutrientBenefits = {
  A: "Essential for visual acuity, maintaining immune defenses, and cellular integrity.",
  C: "A powerful antioxidant vital for collagen synthesis and enhancing iron absorption.",
  D: "Crucial for calcium homeostasis, promoting skeletal strength, and modulating immune response.",
  E: "Functions as a primary fat-soluble antioxidant, protecting cell membranes from oxidative stress.",
  B6: "Key factor in protein metabolism, supporting neurotransmitter synthesis, and red blood cell formation.",
  B12: "Required for neurological health, cognitive function, and essential for red blood cell production.",
  Folate: "Fundamental for DNA and RNA synthesis and cell replication, critical during rapid growth.",
  Ca: "The main structural component of bone density. Necessary for muscle contraction and nerve signal transmission.",
  Fe: "Central component of hemoglobin, absolutely necessary for oxygen transport throughout tissues.",
  Mg: "Involved in numerous enzymatic reactions, regulating muscle/nerve signaling, and energy (ATP) production.",
  Zn: "Essential for robust immune system activity, protein synthesis, and efficient wound healing.",
  K: "A primary electrolyte vital for fluid balance, regulating blood pressure, and ensuring cardiac rhythm stability."
};