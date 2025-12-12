// konsteve27-commits/metab-all/metab-all-48f41db8cb935963160130e2d93cc1c7d89773e1/js/swipe_cards.js

import { facts } from "./facts.js";
import { getUserData } from "./auth.js"; // Εισαγωγή getUserData για εξατομικευμένες κάρτες

// ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Ολοκλήρωση Tutorial και Μετάβαση στο calories.html
// Την ορίζουμε στο window για να καλείται από τον inline onclick του HTML
window.completeTutorialAndNavigate = function() {
    const TUTORIAL_KEY = 'metaballTutorialCompleted';
    localStorage.setItem(TUTORIAL_KEY, "true"); 
    window.location.href = "calories.html";
};


document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("swipeCardsContainer");
    const resetBtn = document.getElementById("resetTutorialBtn");
    const nextBtn = document.getElementById("nextCardBtn");
    
    // Εντοπισμός της κεφαλίδας
    const cardHeaderTitle = document.getElementById("cardHeaderTitle"); 
    
    // ==========================================
    // CONSTANTS & INITIAL STATE
    // ==========================================
    const TUTORIAL_KEY = 'metaballTutorialCompleted';
    const HISTORY_KEY = 'swipeCardFactHistory';
    const HISTORY_SIZE = 5;

    // Tutorial steps in correct order
    const tutorial = [
        {
            title: "Welcome to Metab-all",
            text: "This short tutorial will guide you through the essential features. Swipe left or press Next to continue."
        },
        {
            // Επαναφορά του στυλ: Πράσινος κύκλος
            title: '<strong style="display: inline-flex; align-items: center; justify-content: center; width: 1.4rem; height: 1.4rem; border-radius: 999px; background: rgba(34, 197, 94, 0.15); color: #22c55e; font-size: 0.9rem; margin-right: 0.4rem;">✔</strong> Calorie Calculator',
            text: "Enter your details to calculate BMR, TDEE, and personalized nutrition targets."
        },
        {
            title: '<strong style="display: inline-flex; align-items: center; justify-content: center; width: 1.4rem; height: 1.4rem; border-radius: 999px; background: rgba(34, 197, 94, 0.15); color: #22c55e; font-size: 0.9rem; margin-right: 0.4rem;">✔</strong> Meal Creator',
            text: "Add foods in grams and instantly get macro and micro analysis."
        },
        {
            title: '<strong style="display: inline-flex; align-items: center; justify-content: center; width: 1.4rem; height: 1.4rem; border-radius: 999px; background: rgba(34, 197, 94, 0.15); color: #22c55e; font-size: 0.9rem; margin-right: 0.4rem;">✔</strong> Daily Totals',
            text: "Track daily intakes and compare them with your goals."
        },
        {
            title: '<strong style="display: inline-flex; align-items: center; justify-content: center; width: 1.4rem; height: 1.4rem; border-radius: 999px; background: rgba(34, 197, 94, 0.15); color: #22c55e; font-size: 0.9rem; margin-right: 0.4rem;">✔</strong> Workout Tracker',
            text: "Create workouts, log sets, track volume, and monitor strength progression."
        },
        {
            title: "Ready to Start?",
            // Τροποποιημένο κείμενο με link που καλεί τη συνάρτηση completeTutorialAndNavigate()
            text: `You are ready to use the platform. <br><br>
                   <a class="hero-btn primary" href="#" onclick="completeTutorialAndNavigate(); return false;" 
                   style="margin-top: 10px; display: inline-flex; text-decoration: none; padding: 0.7rem 1.6rem;">Start with Calories &rarr;</a>
                   <p style="font-size: 0.9rem; margin-top: 15px;">
                   (From now on you will see daily tips and updates here.)
                   </p>
                   `
        }
    ];

    // ΝΕΟ: Έλεγχος αν το tutorial έχει ολοκληρωθεί
    let tutorialMode = localStorage.getItem(TUTORIAL_KEY) !== "true";
    // Το index πρέπει να ξεκινάει από 0 ανεξάρτητα από το tutorialMode για να δουλεύει η λογική
    let index = 0;
    
    // ==========================================
    // ΛΟΓΙΚΗ ΓΙΑ ΜΗ ΕΠΑΝΑΛΗΨΗ ΣΥΜΒΟΥΛΩΝ 
    // ==========================================
    function loadFactHistory() {
        try {
            const historyJson = localStorage.getItem(HISTORY_KEY);
            // Τα facts στο facts.js είναι array, οπότε χρησιμοποιούμε indices 0, 1, 2...
            return historyJson ? JSON.parse(historyJson).map(Number) : [];
        } catch (e) {
            return [];
        }
    }

    function updateFactHistory(newFactIndex) {
        let history = loadFactHistory();
        const indexNum = Number(newFactIndex);
        // Αφαίρεση αν υπάρχει ήδη και προσθήκη στην αρχή
        history = history.filter(index => index !== indexNum);
        history.unshift(indexNum);
        
        // Διατήρηση μόνο των HISTORY_SIZE τελευταίων
        if (history.length > HISTORY_SIZE) {
            history.length = HISTORY_SIZE;
        }

        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
             // Silently fail or log error
        }
    }

    function getRandomFactIndex() {
        const history = loadFactHistory();
        const allIndices = Array.from({ length: facts.length }, (_, i) => i);
        
        // Εύρεση διαθέσιμων δεικτών (που δεν είναι στο ιστορικό)
        let availableIndices = allIndices.filter(index => !history.includes(index));
        let selectedIndex;

        if (availableIndices.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            selectedIndex = availableIndices[randomIndex];
        } else {
            // Εφεδρική λύση
            const randomIndex = Math.floor(Math.random() * allIndices.length);
            selectedIndex = allIndices[randomIndex];
        }
        
        // Ενημέρωση ιστορικού
        updateFactHistory(selectedIndex);

        return selectedIndex;
    }
    
    // -------------------------------
    // GET CURRENT + NEXT CARD DATA
    // -------------------------------
    function getCurrentCardData() {
        if (tutorialMode) {
            return tutorial[index];
        }
        
        // --- ΕΔΩ ΘΑ ΜΠΕΙ Η ΛΟΓΙΚΗ ΕΞΑΤΟΜΙΚΕΥΜΕΝΩΝ ΚΑΡΤΩΝ ΣΤΟ ΕΠΟΜΕΝΟ ΒΗΜΑ ---
        const randomIdx = getRandomFactIndex();
        return facts[randomIdx];
    }

    function getNextCardData() {
        if (tutorialMode) {
            // next tutorial step?
            if (index + 1 < tutorial.length) {
                return tutorial[index + 1];
            }

            // tutorial finished → next is a dynamic tip preview
            return {
                title: "Daily Insight",
                text: "Swipe to discover your next valuable tip or update." // ΝΕΟ κείμενο preview
            };
        }

        // random fact mode (preview): just pick a random one for the preview
        const randomIdx = Math.floor(Math.random() * facts.length);
        return facts[randomIdx];
    }

   // -------------------------------
    // CREATE CARD ELEMENT 
    // -------------------------------
    function createCard(data, type = "current") {
        const el = document.createElement("div");
        el.className = "swipe-card";
        el.dataset.card = type;
        
        // NEW LOGIC: Add image wrapper if imageUrl exists
        const imageHtml = data.imageUrl 
            ? `<div class="card-image-wrapper"><img src="${data.imageUrl}" alt="${data.title}"></div>`
            : ''; 

        el.innerHTML = `
            <h4>${data.title}</h4>
            <p>${data.text}</p>
            ${imageHtml}
        `;
        return el;
    }
    // -------------------------------
    // RENDER ONLY 2 CARDS (Τροποποιημένο για Dynamic Header)
    // -------------------------------
    function renderCards() {
        container.innerHTML = "";
        
        // 1. Ρύθμιση της δυναμικής κεφαλίδας
        if (cardHeaderTitle) {
            if (tutorialMode) {
                cardHeaderTitle.textContent = "Metab-all Tutorial";
            } else {
                cardHeaderTitle.textContent = "Daily Feed"; // ΝΕΟ: Feed Mode
            }
        }

        const currentData = getCurrentCardData();
        const nextData = getNextCardData();

        const currentCard = createCard(currentData, "current");
        currentCard.style.zIndex = 2;

        const nextCard = createCard(nextData, "next");
        nextCard.classList.add("next-card");
        nextCard.style.zIndex = 1;

        container.appendChild(currentCard);
        container.appendChild(nextCard);

        updateButton();
    }

    // -------------------------------
    // UPDATE BUTTON LABEL & RESET
    // -------------------------------
    function updateButton() {
        if (tutorialMode && index >= tutorial.length - 1) {
            nextBtn.textContent = "Finish";
            resetBtn.style.display = 'block'; 
        } else if (tutorialMode) {
            nextBtn.textContent = "Next →";
            resetBtn.style.display = 'block';
        } else {
            nextBtn.textContent = "Next →";
            resetBtn.style.display = 'block'; 
        }
    }

    // -------------------------------
    // ANIMATE AND ADVANCE
    // -------------------------------
    function goNext() {
        const top = container.querySelector('[data-card="current"]');
        if (!top) return;

        top.classList.add("swiped-left");

        setTimeout(() => {
            if (tutorialMode) {
                index++;

                if (index >= tutorial.length) {
                    tutorialMode = false; 
                    // ΝΕΟ: Σήμανση ολοκλήρωσης του tutorial στο localStorage (Για swipe/Finish button)
                    localStorage.setItem(TUTORIAL_KEY, "true"); 
                }
            }

            renderCards();
        }, 280);
    }

    // -------------------------------
    // DRAG / SWIPE LOGIC (Τροποποιημένο για Tinder-Style)
    // -------------------------------
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    container.addEventListener("mousedown", startDrag);
    container.addEventListener("touchstart", startDrag);

    function startDrag(e) {
        dragging = true;
        startX = e.type === "mousedown" ? e.clientX : e.touches[0].clientX;
    }

    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag);

    function drag(e) {
        if (!dragging) return;

        const top = container.querySelector('[data-card="current"]');
        if (!top) return;

        currentX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;

        const delta = currentX - startX;
        top.style.transition = "none";
        top.style.transform = `translateX(${delta}px) rotate(${delta / 15}deg)`;
        
        // ΝΕΟ: Δυναμική σκιά για εφέ ανύψωσης (Tinder-style)
        const opacityFactor = Math.min(1, Math.abs(delta / 100));
        const shadowColor = `rgba(34, 197, 94, ${Math.min(0.5, opacityFactor * 0.5)})`; 
        top.style.boxShadow = `0 18px 50px rgba(0,0,0,0.5), 0 0 40px ${shadowColor}`;
    }

    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);

    function endDrag() {
        if (!dragging) return;
        dragging = false;

        const delta = currentX - startX;
        const top = container.querySelector('[data-card="current"]');

        if (!top) return;
        
        // Επαναφορά της σκιάς στην κανονική τιμή (αφήνουμε το CSS)
        top.style.boxShadow = '';

        if (delta < -40) {
            goNext();
        } else {
            top.style.transition = "transform 0.25s ease-out";
            top.style.transform = "";
        }
    }

    // Buttons
    nextBtn.addEventListener("click", goNext);
    resetBtn.addEventListener("click", () => {
        index = 0;
        tutorialMode = true;
        // ΝΕΟ: Διαγραφή του status ολοκλήρωσης
        localStorage.removeItem(TUTORIAL_KEY); 
        renderCards();
    });

    // ΝΕΟ: Αν το tutorial έχει ολοκληρωθεί, ξεκινάμε κατευθείαν στο feed.
    if (!tutorialMode) {
        index = tutorial.length - 1; 
    }
    
    renderCards();
});