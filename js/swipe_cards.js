import { facts } from "./facts.js";

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("swipeCardsContainer");
    const resetBtn = document.getElementById("resetTutorialBtn");
    const nextBtn = document.getElementById("nextCardBtn");

    // Tutorial steps in correct order
    const tutorial = [
        {
            title: "Welcome to Metab-all",
            text: "This short tutorial will guide you through the essential features. Swipe left or press Next to continue."
        },
        {
            title: "1. Calorie Calculator",
            text: "Enter your details to calculate BMR, TDEE, and personalized nutrition targets."
        },
        {
            title: "2. Meal Creator",
            text: "Add foods in grams and instantly get macro and micro analysis."
        },
        {
            title: "3. Daily Totals",
            text: "Track daily intakes and compare them with your goals."
        },
        {
            title: "4. Workout Tracker",
            text: "Create workouts, log sets, track volume, and monitor strength progression."
        },
        {
            title: "Tutorial Completed",
            text: "You are ready to use the platform. From now on you will see daily tips and random facts."
        }
    ];

    let index = 0;
    let tutorialMode = true;

    // -------------------------------
    // GET CURRENT + NEXT CARD DATA
    // -------------------------------
    function getCurrentCardData() {
        if (tutorialMode) {
            return tutorial[index];
        }

        // Random fact mode
        const randomIdx = Math.floor(Math.random() * facts.length);
        return facts[randomIdx];
    }

    function getNextCardData() {
        if (tutorialMode) {
            // next tutorial step?
            if (index + 1 < tutorial.length) {
                return tutorial[index + 1];
            }

            // tutorial finished → next is random fact
            return {
                title: "Daily Tip",
                text: "Swipe to get a random fact."
            };
        }

        // random fact mode
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
        el.innerHTML = `
            <h4>${data.title}</h4>
            <p>${data.text}</p>
        `;
        return el;
    }

    // -------------------------------
    // RENDER ONLY 2 CARDS
    // -------------------------------
    function renderCards() {
        container.innerHTML = "";

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
    // UPDATE BUTTON LABEL
    // -------------------------------
    function updateButton() {
        if (tutorialMode && index >= tutorial.length - 1) {
            nextBtn.textContent = "Finish";
        } else {
            nextBtn.textContent = "Next →";
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
                    tutorialMode = false; // switch to random facts
                }
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
    }

    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);

    function endDrag() {
        if (!dragging) return;
        dragging = false;

        const delta = currentX - startX;
        const top = container.querySelector('[data-card="current"]');

        if (!top) return;

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
        renderCards();
    });

    renderCards();
});
