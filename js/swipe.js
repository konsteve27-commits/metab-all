// ===== js/swipe.js =====

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Ορισμός της σειράς των σελίδων
    const pages = [
        "index.html",
        "calories.html",
        "meals.html",
        "my_meals.html",
        "workout.html"
    ];

    // 2. Εύρεση της τρέχουσας σελίδας
    let path = window.location.pathname;
    let currentPage = path.substring(path.lastIndexOf('/') + 1);

    // Αν είμαστε στο root (π.χ. metab-all.com/), θεωρούμε ότι είναι το index.html
    if (currentPage === "" || currentPage === "/") {
        currentPage = "index.html";
    }

    let currentIndex = pages.indexOf(currentPage);
    
    // Αν για κάποιο λόγο δεν βρεθεί η σελίδα, σταματάμε
    if (currentIndex === -1) return;

    // 3. Logic για το Touch Event
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50; // Ελάχιστα pixels για να θεωρηθεί swipe

    function handleGesture() {
        let distance = touchEndX - touchStartX;

        if (Math.abs(distance) < minSwipeDistance) return; // Πολύ μικρή κίνηση, αγνόησέ την

        if (distance < 0) {
            // Swipe Left (δάχτυλο προς τα αριστερά) -> ΕΠΟΜΕΝΗ ΣΕΛΙΔΑ
            if (currentIndex < pages.length - 1) {
                window.location.href = pages[currentIndex + 1];
            }
        } else {
            // Swipe Right (δάχτυλο προς τα δεξιά) -> ΠΡΟΗΓΟΥΜΕΝΗ ΣΕΛΙΔΑ
            if (currentIndex > 0) {
                window.location.href = pages[currentIndex - 1];
            }
        }
    }

    // 4. Listeners
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
    }, false);
});