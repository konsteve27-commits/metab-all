document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Λίστα σελίδων (βεβαιώσου ότι η σειρά είναι σωστή)
    const pages = [
        "index.html",
        "calories.html",
        "meals.html",
        "my_meals.html",
        "workout.html"
    ];

    // 2. Εύρεση τρέχουσας σελίδας
    let path = window.location.pathname;
    let currentPage = path.substring(path.lastIndexOf('/') + 1);

    if (currentPage === "" || currentPage === "/") {
        currentPage = "index.html";
    }

    let currentIndex = pages.indexOf(currentPage);
    if (currentIndex === -1) return;

    // 3. Μεταβλητές αφής
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    // 4. Ρυθμίσεις Ζώνης & Ευαισθησίας
    const minSwipeDistance = 50;     // Ελάχιστη οριζόντια απόσταση για swipe
    const maxVerticalDeviation = 40; // Μέγιστη επιτρεπτή απόκλιση πάνω/κάτω (για να μην είναι διαγώνιο)
    const bottomZoneHeight = 150;    // ΕΝΕΡΓΗ ΖΩΝΗ: Τα τελευταία 150 pixels της οθόνης

    function handleGesture() {
        // Έλεγχος 1: Ξεκίνησε το δάχτυλο στο κάτω μέρος της οθόνης;
        // Αν το touchStartY είναι μικρότερο από (Ύψος Οθόνης - 150px), ακυρώνουμε.
        if (touchStartY < (window.innerHeight - bottomZoneHeight)) {
            return; 
        }

        let xDistance = touchEndX - touchStartX;
        let yDistance = touchEndY - touchStartY;

        // Έλεγχος 2: Ήταν αρκετά μεγάλη η οριζόντια κίνηση;
        if (Math.abs(xDistance) < minSwipeDistance) return;

        // Έλεγχος 3: Μήπως ήταν πολύ διαγώνια η κίνηση;
        if (Math.abs(yDistance) > maxVerticalDeviation) return;

        // Εκτέλεση αλλαγής σελίδας
        if (xDistance < 0) {
            // Swipe Left -> Next Page
            if (currentIndex < pages.length - 1) {
                window.location.href = pages[currentIndex + 1];
            }
        } else {
            // Swipe Right -> Previous Page
            if (currentIndex > 0) {
                window.location.href = pages[currentIndex - 1];
            }
        }
    }

    // Listeners
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY; // Καταγράφουμε πού ακούμπησε
    }, false);

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleGesture();
    }, false);
});