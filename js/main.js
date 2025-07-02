// Helper functie voor development logging
window.devLog = function(...args) {
    const isDevelopmentMode = document.body.classList.contains('development-mode');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDevelopmentMode || isLocalhost) {
        console.log(...args);
    }
}

// Wacht tot de DOM geladen is
document.addEventListener('DOMContentLoaded', function() {
    // Initialisatie logica kan hier toegevoegd worden indien nodig
});

async function initializeElearning() {
    try {
        const response = await fetch('content/config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();

        // Maak config globaal beschikbaar voor dynamische content
        window.elearningConfig = config;

        // Initialiseer globale variabelen voor andere scripts
        if (typeof initializeGlobals === 'function') {
            initializeGlobals(config);
        }

        // Bouw de UI
        populateUI(config);

        // Start de rest van de applicatie-logica (uit script.js)
        if (typeof runApplicationLogic === 'function') {
            runApplicationLogic();
        }

    } catch (error) {
        console.error('Fout bij het initialiseren van de e-learning:', error);
        // Toon een foutmelding aan de gebruiker
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.innerHTML = '<p class="error-message">De e-learning kon niet worden geladen. Controleer de configuratie en probeer het opnieuw.</p>';
        }
    }
}

function populateUI(config) {
    const sidebarChaptersContainer = document.getElementById('sidebarChapters');
    const mainContainer = document.querySelector('main.container');
    const headerTitle = document.querySelector('.header-title');

    // Update de algemene e-learning titel in de header en document title
    if (config.titel) {
        if (headerTitle) {
            headerTitle.textContent = config.titel;
        }
        document.title = config.titel;
    }

    if (!sidebarChaptersContainer || !mainContainer) {
        console.error('Essentiële containers voor UI-populatie niet gevonden.');
        return;
    }

    // Leegmaken van de hardcoded content
    sidebarChaptersContainer.innerHTML = '';
    mainContainer.innerHTML = '';

    // Bouw de UI op basis van de config
    config.hoofdstukken.forEach((hoofdstuk, index) => {
        const sectionNumber = index + 1;

        // Bouw sidebar item
        const li = document.createElement('li');
        li.className = 'sidebar-chapter';
        li.setAttribute('data-section', sectionNumber);
        li.innerHTML = `
            <span class="chapter-circle" id="circle-${sectionNumber}">${sectionNumber}</span>
            <span class="chapter-title" title="${hoofdstuk.titel}">${hoofdstuk.titel}</span>
        `;
        sidebarChaptersContainer.appendChild(li);

        // Bouw content section - EENZELFDE STRUCTUUR VOOR ALLE SECTIES
        const section = document.createElement('section');
        section.id = `section${sectionNumber}`;
        section.className = 'section';

        // Voeg de .active class toe aan de eerste sectie
        if (sectionNumber === 1) {
            section.classList.add('active');
        }

        // Voeg een speciale class toe aan de laatste (afsluiting) sectie
        if (sectionNumber === config.hoofdstukken.length) {
            section.classList.add('afsluiting-section');
        }

        section.setAttribute('data-section', sectionNumber);

        const h2 = document.createElement('h2');
        h2.textContent = hoofdstuk.titel;
        h2.className = 'chapter-main-title';
        section.appendChild(h2);

        const contentContainer = document.createElement('div');
        contentContainer.className = 'section-content';
        contentContainer.id = `section${sectionNumber}-content-container`;
        section.appendChild(contentContainer);

        const errorContainer = document.createElement('div');
        errorContainer.id = `hoofdstuk${sectionNumber}-error`;
        section.appendChild(errorContainer);

        // Navigatie knoppen
        const navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';

        if (sectionNumber > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-prev';
            prevButton.textContent = 'Vorige';
            prevButton.onclick = () => prevSection();
            navButtons.appendChild(prevButton);
        }

        if (sectionNumber < config.hoofdstukken.length) {
            const nextButton = document.createElement('button');
            nextButton.className = 'btn btn-next';
            nextButton.textContent = 'Volgende';
            nextButton.onclick = () => nextSection();
            navButtons.appendChild(nextButton);
        }

        if (sectionNumber === 1) {
            navButtons.style.justifyContent = 'flex-end';
        } else if (sectionNumber === config.hoofdstukken.length) {
            navButtons.style.justifyContent = 'flex-start';
        }
        
        section.appendChild(navButtons);
        mainContainer.appendChild(section);
    });
}

async function initializeDevMode() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const devButton = document.getElementById('dev-mode-button');
        const styleguideButton = document.getElementById('styleguide-button');
        const promptsButton = document.getElementById('prompts-button');
        
        if (devButton) {
            devButton.style.display = 'inline-block';
            devButton.addEventListener('click', async () => {
                try {
                    const response = await fetch('content/voorbeeld_interacties.json');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const chapterData = await response.json();
                    
                    // Sla de data globaal op voor de testomgeving
                    window.devChapterData = chapterData;

                    const mainContainer = document.querySelector('main.container');
                    const sidebar = document.querySelector('.sidebar-nav');
                    const header = document.querySelector('header');
                    
                    // Verberg de normale content en sidebar
                    mainContainer.setAttribute('data-original-content', mainContainer.innerHTML);
                    sidebar.style.display = 'none';

                    // Verwijder eventuele oude knoppen voordat we nieuwe toevoegen
                    header.querySelectorAll('.dev-mode-btn').forEach(btn => btn.remove());

                    // Toon een "Terug" knop in de header
                    const backButton = document.createElement('button');
                    backButton.textContent = 'Terug naar E-learning';
                    backButton.className = 'button button-primary dev-mode-btn';
                    backButton.onclick = () => window.location.reload();
                    header.appendChild(backButton);

                    // Toon een "Wis Voortgang" knop in de header
                    const clearButton = document.createElement('button');
                    clearButton.textContent = 'Wis Test Voortgang';
                    clearButton.className = 'button button-secondary dev-mode-btn';
                    clearButton.style.marginLeft = '10px';
                    clearButton.onclick = () => clearDevProgress();
                    header.appendChild(clearButton);
                    
                    // Render de dev content
                    renderStandaloneChapter(chapterData, mainContainer);

                } catch (error) {
                    console.error('Fout bij laden van interactievoorbeelden:', error);
                }
            });
        }
        
        if (styleguideButton) {
            styleguideButton.style.display = 'inline-block';
            styleguideButton.addEventListener('click', () => {
                window.open('stijlgids.html', '_blank');
            });
        }
        
        if (promptsButton) {
            promptsButton.style.display = 'inline-block';
            promptsButton.addEventListener('click', () => {
                window.open('prompts.html', '_blank');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeElearning();
    initializeDevMode();
    initializeImagePopups();
});

// Image popup functionality
function initializeImagePopups() {
    // Create popup overlay if it doesn't exist
    let popupOverlay = document.getElementById('image-popup-overlay');
    if (!popupOverlay) {
        popupOverlay = document.createElement('div');
        popupOverlay.id = 'image-popup-overlay';
        popupOverlay.className = 'image-popup-overlay';
        popupOverlay.innerHTML = `
            <div class="image-popup-content">
                <button class="image-popup-close" onclick="closeImagePopup()">&times;</button>
                <img id="popup-image" src="" alt="">
                <div id="popup-caption" class="image-popup-caption"></div>
            </div>
        `;
        document.body.appendChild(popupOverlay);
    }

    // Add click event listeners to clickable images
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('clickable')) {
            e.preventDefault();
            openImagePopup(
                e.target.dataset.popupSrc || e.target.src,
                e.target.dataset.popupAlt || e.target.alt,
                e.target.dataset.popupCaption || ''
            );
        }
    });

    // Close popup when clicking outside the image
    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            closeImagePopup();
        }
    });

    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
            closeImagePopup();
        }
    });
}

function openImagePopup(src, alt, caption) {
    const popupOverlay = document.getElementById('image-popup-overlay');
    const popupImage = document.getElementById('popup-image');
    const popupCaption = document.getElementById('popup-caption');

    if (popupOverlay && popupImage && popupCaption) {
        popupImage.src = src;
        popupImage.alt = alt;
        popupCaption.innerHTML = caption;
        
        // Prevent body scrolling when popup is open
        document.body.style.overflow = 'hidden';
        
        // Show popup with animation
        popupOverlay.classList.add('active');
    }
}

function closeImagePopup() {
    const popupOverlay = document.getElementById('image-popup-overlay');
    
    if (popupOverlay && popupOverlay.classList.contains('active')) {
        // Restore body scrolling
        document.body.style.overflow = '';
        
        // Hide popup with animation
        popupOverlay.classList.remove('active');
        
        // Clear image src after animation to save memory
        setTimeout(() => {
            const popupImage = document.getElementById('popup-image');
            if (popupImage) {
                popupImage.src = '';
            }
        }, 300);
    }
}