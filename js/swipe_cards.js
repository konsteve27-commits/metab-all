document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("swipeCardsContainer");
    const resetBtn = document.getElementById("resetTutorialBtn");
    const nextBtn = document.getElementById("nextCardBtn");

    let index = 0;

    // Tutorial data
    const cards = [
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
            text: "Build your meals by adding foods in grams and track your progress instantly."
        },
        {
            title: "3. Daily Totals",
            text: "See your daily totals and compare them to your goals using clear visual progress bars."
        },
        {
            title: "4. Workout Tracker",
            text: "Create workouts, log weights and sets, and track progress over time."
        },
        {
            title: "Tutorial Completed",
            text: "You are ready to use the platform. You will also find daily tips and ideas here."
        }
    ];

    // Create card element
    function createCard(data) {
        const el = document.createElement("div");
        el.className = "swipe-card";
        el.innerHTML = `
            <h4>${data.title}</h4>
            <p>${data.text}</p>
        `;
        return el;
    }

    // Render only current + next card
    function renderCards() {
        container.innerHTML = "";

        // top card
        if (cards[index]) {
            const current = createCard(cards[index]);
            current.dataset.card = "current";
            current.style.zIndex = 2;
            container.appendChild(current);
        }

        // next card (blurred preview)
        if (cards[index + 1]) {
            const next = createCard(cards[index + 1]);
            next.dataset.card = "next";
            next.style.zIndex = 1;
            next.classList.add("next-card");
            container.appendChild(next);
        }

        updateControls();
    }

    function updateControls() {
        if (index >= cards.length - 1) {
            nextBtn.textContent = "Finish";
        } else {
            nextBtn.textContent = "Next →";
        }
    }

    // Animate swipe and move to next card
    function goNext() {
        const topCard = container.querySelector('[data-card="current"]');
        if (!topCard) return;

        topCard.classList.add("swiped-left");

        setTimeout(() => {
            index++;
            renderCards();
        }, 300);
    }

    // Touch/drag logic
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

        const topCard = container.querySelector('[data-card="current"]');
        if (!topCard) return;

        currentX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
        const delta = currentX - startX;

        topCard.style.transition = "none";
        topCard.style.transform = `translateX(${delta}px) rotate(${delta / 15}deg)`;
    }

    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);

    function endDrag() {
        if (!dragging) return;
        dragging = false;

        const topCard = container.querySelector('[data-card="current"]');
        if (!topCard) return;

        const delta = currentX - startX;

        if (delta < -40) {
            goNext();
        } else {
            topCard.style.transition = "transform 0.25s ease-out";
            topCard.style.transform = "";
        }
    }

    // Buttons
    nextBtn.addEventListener("click", goNext);
    resetBtn.addEventListener("click", () => {
        index = 0;
        renderCards();
    });

    renderCards();
});
