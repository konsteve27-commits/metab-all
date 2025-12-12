import { facts } from "./facts.js";
import { getUserData } from "./auth.js"; 

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
    
    // ----------------------------------------------------------------------
    // --- ΔΙΟΡΘΩΣΗ: ΔΥΝΑΜΙΚΗ ΛΟΓΙΚΗ ΓΙΑ ΤΟ ΜΕΓΕΘΟΣ ΤΟΥ ΙΣΤΟΡΙΚΟΥ ---
    
    // ΡΥΘΜΙΣΗ: Πόσο μεγάλο ποσοστό των συνολικών facts θέλουμε να θυμόμαστε
    // για να μην επαναλαμβάνονται άμεσα. (0.75 = 75%)
    const HISTORY_PERCENTAGE = 0.75; // <-- Αλλάξτε αυτό το ποσοστό (π.χ. 0.5, 0.9)
    
    // Υπολογίζουμε το προτιμώμενο μέγεθος με βάση το ποσοστό
    const calculatedHistorySize = Math.round(facts.length * HISTORY_PERCENTAGE); 
    
    // Ο τελικός περιορισμός: το μικρότερο μεταξύ του υπολογισμένου και του (συνολικού facts - 1)
    // Αυτό εξασφαλίζει ότι το ιστορικό δεν θα υπερβεί το μέγιστο μέγεθος, αφήνοντας
    // θεωρητικά τουλάχιστον μία κάρτα εκτός ιστορικού.
    const HISTORY_SIZE = Math.min(calculatedHistorySize, facts.length > 0 ? facts.length - 1 : 0); 
    // ----------------------------------------------------------------------

    // ΝΕΑ ΚΑΤΑΣΤΑΣΗ: Κρατάμε τον δείκτη της τρέχουσας και της επόμενης κάρτας
    let currentFactIndex = -1; 
    let nextFactIndex = -1;

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
    // ΛΟΓΙΚΗ ΓΙΑ ΜΗ ΕΠΑΝΑΛΗΨΗ ΣΥΜΒΟΥΛΩΝ & HISTORY
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

    // Η ενημέρωση του ιστορικού γίνεται πλέον ΜΟΝΟ στο goNext()
    function updateFactHistory(newFactIndex) {
        let history = loadFactHistory();
        const indexNum = Number(newFactIndex);
        
        // Αφαίρεση αν υπάρχει ήδη και προσθήκη στην αρχή
        history = history.filter(index => index !== indexNum);
        history.unshift(indexNum);
        
        // --- Χρησιμοποιούμε το δυναμικά υπολογισμένο HISTORY_SIZE ---
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

    // Τροποποιημένο: Τώρα επιστρέφει το index ΧΩΡΙΣ να ενημερώνει το history
    function getNextRandomIndexOnly() {
        const history = loadFactHistory();
        const allIndices = Array.from({ length: facts.length }, (_, i) => i);
        
        // Εύρεση διαθέσιμων δεικτών (που δεν είναι στο ιστορικό)
        let availableIndices = allIndices.filter(index => !history.includes(index));
        let selectedIndex;

        if (availableIndices.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            selectedIndex = availableIndices[randomIndex];
        } else {
            // Εφεδρική λύση: αν έχουν εξαντληθεί, επιλέγουμε τυχαία.
            const randomIndex = Math.floor(Math.random() * allIndices.length);
            selectedIndex = allIndices[randomIndex];
        }
        
        return selectedIndex;
    }
    
    // -------------------------------
    // GET CURRENT + NEXT CARD DATA
    // -------------------------------
    function getCurrentCardData() {
        if (tutorialMode) {
            return tutorial[index];
        }
        
        // Daily Feed Mode: Επιστροφή της κάρτας που έχει οριστεί ως current
        if (currentFactIndex === -1) {
            // Σφάλμα αρχικοποίησης
            return { title: "Error", text: "Restarting feed..." }; 
        }

        return facts[currentFactIndex];
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
                text: "Swipe to discover your next valuable tip or update." 
            };
        }

        // Daily Feed Mode: Χρησιμοποιούμε την κάρτα που έχει οριστεί ως preview.
        if (nextFactIndex === -1) {
             // Δεν θα έπρεπε να συμβεί αν η αρχικοποίηση είναι σωστή
            return { title: "Daily Insight", text: "Swipe to discover your next valuable tip or update." };
        }
        
        return facts[nextFactIndex];
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
    // RENDER ONLY 2 CARDS 
    // -------------------------------
    function renderCards() {
        container.innerHTML = "";
        
        // 1. Ρύθμιση της δυναμικής κεφαλίδας
        if (cardHeaderTitle) {
            if (tutorialMode) {
                cardHeaderTitle.textContent = "Metab-all Tutorial";
            } else {
                cardHeaderTitle.textContent = "Daily Feed"; 
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
                    localStorage.setItem(TUTORIAL_KEY, "true"); 
                    
                    // TRANSITION TO FEED MODE
                    currentFactIndex = getNextRandomIndexOnly();
                    updateFactHistory(currentFactIndex);
                    nextFactIndex = getNextRandomIndexOnly();
                }
            } else {
                // ΚΥΡΙΑ ΛΟΓΙΚΗ ΓΙΑ ΤΟ DAILY FEED: Προάγουμε το preview σε current
                currentFactIndex = nextFactIndex;
                updateFactHistory(currentFactIndex); // Ενημερώνουμε το history για την νέα current κάρτα
                
                // Υπολογίζουμε τη νέα κάρτα preview (τη μεθεπόμενη)
                nextFactIndex = getNextRandomIndexOnly(); 
            }

            renderCards();
        }, 280);
    }

    // -------------------------------
    // DRAG / SWIPE LOGIC
    // -------------------------------
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    container.addEventListener("mousedown", startDrag);
    container.addEventListener("touchstart", startDrag);

    function startDrag(e) {
        dragging = true;
        // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε το event.clientX/touches[0].clientX για σωστή μέτρηση
        startX = e.type === "mousedown" ? e.clientX : e.touches[0].clientX; 
        
        // ΔΙΟΡΘΩΣΗ: Πρέπει να σταματήσουμε την μετάβαση (transition) στο startDrag 
        // ώστε να δουλέψει σωστά το drag.
        const top = container.querySelector('[data-card="current"]');
        if (top) {
            top.style.transition = "none";
        }
    }

    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag);

    function drag(e) {
        if (!dragging) return;

        const top = container.querySelector('[data-card="current"]');
        if (!top) return;

        currentX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;

        const delta = currentX - startX;
        
        // ΔΙΟΡΘΩΣΗ: Το transition είναι πλέον απενεργοποιημένο
        top.style.transform = `translateX(${delta}px) rotate(${delta / 15}deg)`;
        
        // Δυναμική σκιά για εφέ ανύψωσης (Tinder-style)
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
        
        // Επαναφορά του transition για την animation
        top.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out, box-shadow 0.15s ease-out"; 
        top.style.boxShadow = ''; // Επαναφορά της σκιάς στην κανονική τιμή (αφήνουμε το CSS)

        if (delta < -40) {
            goNext();
        } else {
            top.style.transform = ""; // Επαναφορά στην αρχική θέση
        }
    }

    // Buttons
    nextBtn.addEventListener("click", goNext);
    resetBtn.addEventListener("click", () => {
        index = 0;
        tutorialMode = true;
        // ΝΕΟ: Διαγραφή του status ολοκλήρωσης
        localStorage.removeItem(TUTORIAL_KEY); 
        // Reset feed mode state
        currentFactIndex = -1;
        nextFactIndex = -1;
        renderCards();
    });

    // -------------------------------
    // INITIALIZATION LOGIC
    // -------------------------------

    if (!tutorialMode) {
        index = tutorial.length - 1; 
        
        // Αρχική ρύθμιση για το Daily Feed Mode
        currentFactIndex = getNextRandomIndexOnly();
        updateFactHistory(currentFactIndex); // Commit the first fact to history
        nextFactIndex = getNextRandomIndexOnly(); // Pre-calculate the second fact
    }
    
    renderCards();
});