document.addEventListener('DOMContentLoaded', () => {
    
    const pages = [
        "index.html",
        "calories.html",
        "meals.html",
        "my_meals.html",
        "workout.html"
    ];

    let path = window.location.pathname;
    let currentPage = path.substring(path.lastIndexOf('/') + 1);

    if (currentPage === "" || currentPage === "/") {
        currentPage = "index.html";
    }

    let currentIndex = pages.indexOf(currentPage);
    if (currentIndex === -1) return;

    // Μεταβλητές για τις συντεταγμένες
    let touchStartX = 0;
    let touchStartY = 0; // ΝΕΟ: Κρατάμε και το ύψος
    let touchEndX = 0;
    let touchEndY = 0;   // ΝΕΟ: Κρατάμε και το ύψος

    // Ρυθμίσεις ευαισθησίας
    const minSwipeDistance = 50;  // Πρέπει να σύρεις τουλάχιστον 50px οριζόντια
    const maxVerticalDistance = 10; // ΝΕΟ: Απαγορεύεται να κουνηθείς πάνω/κάτω περισσότερο από 30px

    function handleGesture() {
        let xDistance = touchEndX - touchStartX;
        let yDistance = touchEndY - touchStartY;

        // 1. Έλεγχος: Ήταν αρκετά μεγάλη η οριζόντια κίνηση;
        if (Math.abs(xDistance) < minSwipeDistance) return;

        // 2. Έλεγχος: Μήπως κουνήθηκε πολύ πάνω-κάτω (διαγώνια/scroll);
        // Αν η κάθετη κίνηση είναι μεγαλύτερη από το όριο (30px), ακυρώνουμε το swipe.
        if (Math.abs(yDistance) > maxVerticalDistance) return;

        // 3. Έλεγχος ασφαλείας: Η οριζόντια κίνηση πρέπει να είναι μεγαλύτερη από την κάθετη
        if (Math.abs(yDistance) >= Math.abs(xDistance)) return;

        // Αν περάσουν όλοι οι έλεγχοι, κάνουμε την αλλαγή
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

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY; // Καταγραφή αρχικού Υ
    }, false);

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;   // Καταγραφή τελικού Υ
        handleGesture();
    }, false);

});
