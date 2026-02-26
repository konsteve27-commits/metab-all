// js/router.js

function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const sections = document.querySelectorAll('.spa-page');
    const navLinks = document.querySelectorAll('.nav-link');

    let found = false;
    sections.forEach(section => {
        if (section.id === hash) {
            section.style.display = 'block';
            found = true;
        } else {
            section.style.display = 'none';
        }
    });

    if (!found) {
        const homeSection = document.getElementById('home');
        if (homeSection) homeSection.style.display = 'block';
    }

    navLinks.forEach(link => {
        const target = link.getAttribute('data-section');
        link.classList.toggle('active', target === hash);
    });

    window.scrollTo(0, 0);

    // ΣΤΡΑΤΗΓΙΚΗ ΚΙΝΗΣΗ: Στέλνουμε ένα σήμα σε όλη την εφαρμογή 
    // ότι η "σελίδα" άλλαξε, ώστε να ενημερωθούν τα JS
    document.dispatchEvent(new CustomEvent('spaContentUpdate', { 
        detail: { section: hash } 
    }));
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

// Διαχείριση κλικ για τα links που έχουν data-section
document.addEventListener('click', e => {
    const link = e.target.closest('[data-section]');
    if (link) {
        const section = link.getAttribute('data-section');
        // Απλά αλλάζουμε το hash, το handleRoute θα πιαστεί από το hashchange
        window.location.hash = section;
    }
});
handleRoute();