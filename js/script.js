// Navigation and section handling
let currentSection = 1;
let totalSections = 0;

let chapters = [];

// Functie om de globale variabelen te initialiseren na het laden van de config
function initializeGlobals(config) {
    totalSections = config.hoofdstukken.length;
    chapters = config.hoofdstukken.map((hoofdstuk, index) => ({
        section: index + 1,
        title: hoofdstuk.titel,
        file: hoofdstuk.file
    }));
    
    // Make chapters globally available for fetchChapterData
    window.chapters = chapters;
    
    devLog('Global variables initialized:', { totalSections, chapters });
}

function updateProgress() {
    const progressPercentage = ((currentSection - 1) / (totalSections - 1)) * 100;
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    const progressText = document.getElementById('progress-percentage');
    if (progressText) {
        progressText.textContent = `${Math.round(progressPercentage)}%`;
    }
    document.querySelectorAll('.chapter-point').forEach((point, index) => {
        point.classList.remove('completed', 'active');
        if (index + 1 < currentSection) {
            point.classList.add('completed');
        } else if (index + 1 === currentSection) {
            point.classList.add('active');
        }
    });
}

function showSection(sectionNumber) {
    window.scrollTo(0, 0);
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    const targetSection = document.querySelector(`section[data-section="${sectionNumber}"]`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        currentSection = sectionNumber;
        updateProgress();
        document.querySelectorAll('.sidebar-chapter').forEach(ch => ch.classList.remove('active'));
        const activeSidebar = document.querySelector(`.sidebar-chapter[data-section="${sectionNumber}"]`);
        if (activeSidebar) activeSidebar.classList.add('active');

        // Navigatieknoppen tonen/verbergen
        const navButtons = targetSection.querySelector('.nav-buttons');
        if (navButtons) {
            const prevBtn = navButtons.querySelector('.btn-prev');
            const nextBtn = navButtons.querySelector('.btn-next');
            if (prevBtn) prevBtn.style.display = sectionNumber === 1 ? 'none' : '';
            if (nextBtn) nextBtn.style.display = sectionNumber === totalSections ? 'none' : '';
        }

        // Load dynamic text content for the new section
        if (typeof loadContentForSection === 'function') {
            loadContentForSection(currentSection); // This loads hoofdstukN.json or hoofdstuk_afsluiting.json
        }

        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            // initializeDragAndDrop() was here, but drag-drop init is now handled by dynamicContent.js
            // if (typeof initializeDragAndDrop === 'function') initializeDragAndDrop(); 
        }, 50);
    }
}

function nextSection() {
    if (currentSection < totalSections) {
        showSection(currentSection + 1);
    }
}

function prevSection() {
    if (currentSection > 1) {
        showSection(currentSection - 1);
    }
}

async function saveSelfAssessment(sectionNumber, selfAssessmentId) {
    // Vind alle assessment-select elementen voor dit specifieke selfassessment
    const containerId = sectionNumber === 'dev' 
        ? `dev-${selfAssessmentId}` 
        : `hoofdstuk${sectionNumber}-${selfAssessmentId}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Self assessment container ${containerId} not found`);
        return;
    }

    const selectElements = container.querySelectorAll('.assessment-select');
    let allAnswered = true;
    const assessmentData = {};

    selectElements.forEach(selectElement => {
        const selectId = selectElement.id;
        // Extract the criterion id from the select element id
        // Format: {criteriumId}-{sectionNumber}-{selfAssessmentId}
        const idParts = selectId.split('-');
        if (idParts.length >= 3) {
            const criteriumId = idParts[0]; // Take the first part as criterium id
            
            if (selectElement.value) {
                assessmentData[criteriumId] = selectElement.value;
            } else {
                allAnswered = false;
            }
        }
    });

    const feedbackEl = document.getElementById(`feedback-${sectionNumber}-${selfAssessmentId}`);

    if (!allAnswered) {
        if (feedbackEl) {
            feedbackEl.textContent = 'Beoordeel alstublieft alle competenties.';
            feedbackEl.className = 'feedback-message incorrect';
        }
        return;
    }
    localStorage.setItem(`selfassessment_${sectionNumber}_${selfAssessmentId}_done`, JSON.stringify(assessmentData));
    
    // Re-render de component om de 'opgeslagen' staat te tonen
    if (container && typeof window.renderInteraction === 'function') {
        setTimeout(async () => {
            const chapterData = sectionNumber === 'dev' 
                ? window.devChapterData 
                : await window.fetchChapterData(sectionNumber);
            if (chapterData && chapterData.interacties) {
                const freshInteractionData = chapterData.interacties.find(i => i.id === selfAssessmentId);
                if (freshInteractionData) {
                    window.renderInteraction(freshInteractionData, sectionNumber, container);
                }
            }
        }, 100);
    }
    
    if (sectionNumber !== 'dev') {
        await updateAllChapterProgress();
    }
}

// Reinstated saveReflection
async function saveReflection(sectionNumber, reflectionId) {
    const reflectionInput = document.getElementById(`${reflectionId}-input`); 
    if (!reflectionInput) {
        console.error(`Reflection input field with ID ${reflectionId}-input not found.`);
        const feedbackEl = document.getElementById(`feedback-${sectionNumber}-${reflectionId}`);
        if (feedbackEl) {
            feedbackEl.textContent = 'Fout: reflectieveld niet gevonden.';
            feedbackEl.className = 'feedback-message incorrect';
        }
        return false;
    }
    const answer = reflectionInput.value.trim();
    
    const interactionData = await getInteractionData(sectionNumber, reflectionId);
    const minLength = interactionData && interactionData.minLength ? interactionData.minLength : 10;
    const feedbackEl = document.getElementById(`feedback-${sectionNumber}-${reflectionId}`);

    if (answer.length < minLength) {
        if (feedbackEl) {
            feedbackEl.textContent = `Je antwoord moet minimaal ${minLength} tekens bevatten.`;
            feedbackEl.className = 'feedback-message incorrect';
        }
        return false;
    }
    const storageKey = `reflection_${sectionNumber}_${reflectionId}_answered`; 
    localStorage.setItem(storageKey, answer);

    // Re-render de component om de 'opgeslagen' staat te tonen
    const containerId = sectionNumber === 'dev' 
        ? `dev-${reflectionId}` 
        : `hoofdstuk${sectionNumber}-${reflectionId}`;
    const container = document.getElementById(containerId);

    if (container && typeof window.renderInteraction === 'function') {
        setTimeout(async () => {
            const chapterData = sectionNumber === 'dev' 
                ? window.devChapterData 
                : await window.fetchChapterData(sectionNumber);
            if (chapterData && chapterData.interacties) {
                const freshInteractionData = chapterData.interacties.find(i => i.id === reflectionId);
                if (freshInteractionData) {
                    window.renderInteraction(freshInteractionData, sectionNumber, container);
                }
            }
        }, 100);
    }
    
    if (sectionNumber !== 'dev') {
        await updateAllChapterProgress();
    }
    return true;
}

function saveMCScore(questionNumber, correct, total) {
    localStorage.setItem(`mc${questionNumber}_correct`, correct);
    localStorage.setItem(`mc${questionNumber}_total`, total);
    // De updateAllChapterProgress voor de afsluitquiz (H8) checkt mc_quiz_answers.
}

async function updateAllChapterProgress() {
    devLog('updateAllChapterProgress gestart');
    // Dynamisch genereren van chaptersToUpdate op basis van totalSections
    // Alle hoofdstukken behalve het laatste (afsluitend hoofdstuk)
    const chaptersToUpdate = Array.from({length: totalSections - 1}, (_, i) => i + 1);
    let chapterProgress = JSON.parse(localStorage.getItem('chapterProgress')) || Array(totalSections).fill(0);

    for (let i = 0; i < chaptersToUpdate.length; i++) {
        let h = chaptersToUpdate[i];
        let ingevuld = 0;
        let totaal = 0;
        try {
            const res = await fetch(`content/hoofdstuk${h}.json`);
            if (!res.ok) {
                console.warn(`Hoofdstuk ${h} JSON niet gevonden (${res.status})`);
                chapterProgress[h - 1] = 0;
                continue;
            }
            const data = await res.json();
            if (!data.interacties || data.interacties.length === 0) {
                chapterProgress[h - 1] = 1; 
                devLog(`Hoofdstuk ${h} heeft geen interacties, gemarkeerd als voltooid.`);
                continue;
            }
            totaal = data.interacties.length;
            for (const interactie of data.interacties) {
                if (interactie.type === 'reflection') {
                    if (localStorage.getItem(`reflection_${h}_${interactie.id}_answered`)) ingevuld++;
                } else if (interactie.type === 'mc') {
                    if (localStorage.getItem(`mc_${h}_${interactie.id}_answered`)) ingevuld++;
                } else if (interactie.type === 'dragdrop') {
                    if (localStorage.getItem(`dragdrop_${h}_${interactie.id}_correct`)) ingevuld++;
                } else if (interactie.type === 'selfassessment') {
                    if (localStorage.getItem(`selfassessment_${h}_${interactie.id}_done`)) ingevuld++;
                } else if (interactie.type === 'critical_analysis') {
                    if (localStorage.getItem(`critical_analysis_${h}_${interactie.id}_answered`)) ingevuld++;
                } else if (interactie.type === 'flashcard') {
                    if (localStorage.getItem(`flashcard_${h}_${interactie.id}_done`)) ingevuld++;
                } else if (interactie.type === 'braindump') {
                    if (localStorage.getItem(`braindump_${h}_${interactie.id}_completed`)) ingevuld++;
                }
            }
            if (totaal > 0) {
                if (ingevuld === totaal) chapterProgress[h - 1] = 1;
                else if (ingevuld > 0) chapterProgress[h - 1] = 0.5;
                else chapterProgress[h - 1] = 0;
            }
            devLog(`Hoofdstuk ${h}: Totaal Interacties: ${totaal}, Ingevuld: ${ingevuld}, Status: ${chapterProgress[h-1]}`);
        } catch (e) {
            console.error(`Fout bij verwerken voortgang H${h}:`, e);
            chapterProgress[h - 1] = 0;
        }
    }

    // Afsluitend hoofdstuk (laatste sectie): afsluitquiz
    let quizDone = false;
    try {
        const resQuiz = await fetch('content/afsluitquiz.json');
        if (resQuiz.ok) {
            const afsluitQuizData = await resQuiz.json();
            const quizAnswers = JSON.parse(localStorage.getItem('mc_quiz_answers') || '[]');
            if (Array.isArray(quizAnswers) && quizAnswers.length === afsluitQuizData.length && quizAnswers.every(a => a && typeof a.selected !== 'undefined')) {
                quizDone = true;
            }
        }
    } catch (e) { console.error('Fout bij verwerken afsluitquiz progress:', e); }
    chapterProgress[totalSections - 1] = quizDone ? 1 : 0; // Index voor laatste hoofdstuk
    devLog(`Hoofdstuk ${totalSections} (Afsluitquiz) Status: ${chapterProgress[totalSections - 1]}`);

    localStorage.setItem('chapterProgress', JSON.stringify(chapterProgress));
    devLog('Chapter progress opgeslagen:', chapterProgress);

    // Dynamisch genereren van chapterMeta op basis van totalSections
    const chapterMeta = Array.from({length: totalSections}, (_, i) => ({ section: i + 1 }));
    chapterMeta.forEach((ch, idx) => {
        const circle = document.getElementById(`circle-${ch.section}`);
        if (!circle) return;
        circle.classList.remove('completed', 'half');
        if (chapterProgress[idx] === 1) {
            circle.classList.add('completed');
        } else if (chapterProgress[idx] === 0.5) {
            circle.classList.add('half');
        }
    });

    let completed = chapterProgress.filter(p => p === 1).length;
    let half = chapterProgress.filter(p => p === 0.5).length;
    let percent = Math.round((completed + 0.5 * half) / totalSections * 100);
    const visual = document.getElementById('sidebarProgressVisual');
    if (visual) {
        visual.style.background = `conic-gradient(var(--primary-purple) 0% ${percent}%, var(--medium-gray) ${percent}% 100%)`;
    }
    const text = document.getElementById('sidebarProgressText');
    if (text) text.textContent = percent + '%';
    devLog('Sidebar progress UI geüpdatet.');
}

function setupSidebarNavigation() {
    const sidebarChapters = document.querySelectorAll('.sidebar-chapter');
    sidebarChapters.forEach(chapter => {
        chapter.addEventListener('click', function () {
            const sectionNumber = parseInt(this.getAttribute('data-section'));
            if (sectionNumber !== currentSection) {
                showSection(sectionNumber);
            }
            // Sidebar sluiten op mobiel na klik op hoofdstuk
            const sidebar = document.getElementById('sidebarNav');
            const floatingHamburger = document.getElementById('floatingHamburger');
            if (window.innerWidth <= 900 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
                if (floatingHamburger) floatingHamburger.classList.remove('active');
            }
        });
    });
}

function setupSidebarHamburger() {
    const sidebarHamburger = document.getElementById('sidebarHamburger');
    const floatingHamburger = document.getElementById('floatingHamburger');
    const sidebar = document.getElementById('sidebarNav');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar(event) {
        if (event) event.stopPropagation();
        sidebar.classList.toggle('open');
        document.body.classList.toggle('sidebar-open');
    }

    if (sidebarHamburger) sidebarHamburger.addEventListener('click', toggleSidebar);
    if (floatingHamburger) floatingHamburger.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

    document.addEventListener('click', function (event) {
        if (sidebar && sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnFloatingHamburger = floatingHamburger && floatingHamburger.contains(event.target);
            if (!isClickInsideSidebar && !isClickOnFloatingHamburger) {
                toggleSidebar();
            }
        }
    });
}

// De rest van de DOMContentLoaded logica verhuist naar een nieuwe functie
function runApplicationLogic() {
    // Initialiseer de zoekmodule nu de hoofdstukken bekend zijn
    if (typeof initSearchModule === 'function') {
        initSearchModule();
    } else {
        console.error("Zoekmodule kon niet worden geïnitialiseerd omdat de functie niet gevonden is.");
    }
    
    setupSidebarNavigation();
    setupSidebarHamburger();
    
    showSection(currentSection);

    updateAllChapterProgress();

    // Event handler voor Wis Alle Voortgang knop
    const clearBtn = document.getElementById('clearProgressBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllProgress);
    }

    // Voer migratie uit voordat andere initialisatie
    // migrateOldIdsToNewFormat(); // Deze migratie is waarschijnlijk niet meer nodig, kan later worden verwijderd.
}

// New global function to handle MC answer checking
async function checkMCAnswer(interactionId, selectedAnswerIndex, correctAnswerIndex, sectionNumber, mcElement, allOptions) {
    if (!mcElement || mcElement.classList.contains('answered')) return;

    const isCorrect = selectedAnswerIndex === correctAnswerIndex;
    const feedbackEl = mcElement.querySelector(`#feedback-${interactionId}`);
    
    // Visuele feedback op de gekozen optie
    allOptions.forEach(opt => {
        const optIndex = parseInt(opt.getAttribute('data-id'));
        if (optIndex === selectedAnswerIndex) {
            opt.classList.add('selected', isCorrect ? 'correct' : 'incorrect');
        }
        opt.style.pointerEvents = 'none'; // Maak alle opties niet-klikbaar
    });

    mcElement.classList.add('answered');

    // Haal de volledige interactiedata op voor de feedbacktekst
    const fullInteractionData = await getInteractionData(sectionNumber, interactionId);

    if (feedbackEl && fullInteractionData) {
        let feedbackText = '';
        if (fullInteractionData.feedbackCorrect && fullInteractionData.feedbackIncorrect) {
            feedbackText = isCorrect ? fullInteractionData.feedbackCorrect : fullInteractionData.feedbackIncorrect;
        } else if (fullInteractionData.feedback) {
            // Fallback voor de oude structuur
            feedbackText = isCorrect ? 'Correct!' : (fullInteractionData.feedback || 'Incorrect.');
        }
        feedbackEl.textContent = feedbackText || (isCorrect ? 'Correct!' : 'Incorrect.');
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
    }

    localStorage.setItem(`mc_${sectionNumber}_${interactionId}_answered`, 'true');
    localStorage.setItem(`mc_${sectionNumber}_${interactionId}_correct`, isCorrect ? '1' : '0');
    localStorage.setItem(`mc_${sectionNumber}_${interactionId}_selected`, selectedAnswerIndex.toString());

    if (sectionNumber !== 'dev') {
        await updateAllChapterProgress();
    }
}

// Helper function to get interaction data (needed for feedback messages)
async function getInteractionData(sectionNumber, interactionId) {
    // Speciaal geval voor de dev/test-pagina
    if (sectionNumber === 'dev' && window.devChapterData) {
        return window.devChapterData.interacties.find(i => i.id === interactionId);
    }
    try {
        // Gebruik de globale 'chapters' array om het juiste bestand te vinden
        const chapterInfo = chapters.find(c => c.section == sectionNumber);
        if (!chapterInfo) {
            console.error(`Could not find chapter file for section ${sectionNumber}`);
            return null;
        }
        const res = await fetch(`content/${chapterInfo.file}`);
        if (!res.ok) return null;
        const chapterData = await res.json();
        return chapterData.interacties.find(i => i.id === interactionId);
    } catch (e) {
        console.error("Error fetching interaction data", e);
        return null;
    }
}

async function clearAllProgress() {
    if (confirm("Weet je zeker dat je alle voortgang wilt wissen? Dit kan niet ongedaan worden gemaakt.")) {
        devLog("Clearing all progress...");
        const keysToClear = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('reflection_') || 
                key.startsWith('mc') || 
                key.startsWith('dragdrop_') || 
                key.startsWith('selfassessment_') || 
                key.startsWith('flashcard_') || 
                key.startsWith('braindump_') || 
                key === 'chapterProgress' ||
                key.endsWith('_answered') || 
                key.endsWith('_correct') || 
                key.endsWith('_done') ||
                key.endsWith('_completed') ||
                key.endsWith('_attempts') ||
                key.endsWith('_evaluations')) {
                keysToClear.push(key);
            }
        }
        
        keysToClear.forEach(key => {
            devLog(`Removing item: ${key}`);
            localStorage.removeItem(key);
        });
        
        document.querySelectorAll('textarea.reflection-input').forEach(ta => ta.value = '');
        
        document.querySelectorAll('.mc-question').forEach(el => {
            if (!el.closest('#quiz-container')) {
                el.classList.remove('answered');
                el.querySelectorAll('.mc-option').forEach(opt => {
                    opt.classList.remove('selected', 'correct', 'incorrect', 'disabled');
                    opt.style.cursor = '';
                });
                const feedbackInMc = el.querySelector('.feedback');
                if (feedbackInMc) {
                    feedbackInMc.textContent = '';
                    feedbackInMc.className = 'feedback';
                }
            }
        });

        document.querySelectorAll('.interactive-exercise[data-dragdrop-id]').forEach(ddExercise => {
            const section = ddExercise.dataset.sectionNumber;
            const id = ddExercise.dataset.dragdropId;
            const containerId = `hoofdstuk${section}-${id}`;
            if (typeof resetDragDrop === 'function') {
                 // Call resetDragDrop to handle UI and specific localStorage for this d&d instance.
                 // resetDragDrop itself will call updateAllChapterProgress, or it should be called after the loop.
                 // For now, let resetDragDrop handle its own update. If progress becomes an issue, we'll revisit.
                 resetDragDrop(parseInt(section), id, containerId); 
            } else {
                const dragContainer = ddExercise.querySelector('.drag-container');
                const dropTargets = ddExercise.querySelectorAll('.drop-target .draggable');
                if (dragContainer && dropTargets) { // Add null checks
                    dropTargets.forEach(item => dragContainer.appendChild(item));
                }
                ddExercise.querySelectorAll('.draggable').forEach(item => item.classList.remove('correct', 'incorrect'));
                const ddFeedback = ddExercise.querySelector('.dragdrop-feedback');
                if(ddFeedback) {
                    ddFeedback.textContent = '';
                    ddFeedback.className = 'dragdrop-feedback';
                }
                const resetButton = ddExercise.querySelector('.btn-reset-dragdrop');
                if(resetButton) resetButton.style.display = 'none';
                const checkButton = ddExercise.querySelector('.btn-check-dragdrop');
                if(checkButton) checkButton.disabled = false;
            }
        });

        document.querySelectorAll('.assessment-select').forEach(sel => sel.value = '');
        
        // Reset braindump interactions
        document.querySelectorAll('.braindump-container').forEach(container => {
            const textarea = container.querySelector('.braindump-textarea');
            if (textarea) textarea.value = '';
            
            const radioButtons = container.querySelectorAll('input[type="radio"]');
            radioButtons.forEach(radio => radio.checked = false);
            
            const feedback = container.querySelector('.feedback-message');
            if (feedback) feedback.remove();
        });
        
        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) {
            quizContainer.innerHTML = '<p>De quiz is gereset. Selecteer eventueel opnieuw de Afsluitende sectie om de quiz te starten.</p>';
            quizAnswers = []; 
            currentQuizQuestionIndex = 0;
        }

        devLog("All relevant localStorage items cleared and UI reset.");

        await updateAllChapterProgress(); 
        showSection(1); 
        alert("Alle voortgang is gewist.");
    }
}

// Reinstated Drag and Drop functions
function initializeSpecificDragDrop(containerSelector, sectionNumber, dragDropId, correctCombinations) {
    const container = document.getElementById(containerSelector);
    if (!container) {
        console.error(`DragDrop container #${containerSelector} not found in initializeSpecificDragDrop.`);
        return;
    }
    const draggables = container.querySelectorAll('.draggable');
    const dropTargets = container.querySelectorAll('.drop-target');
    
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
            setTimeout(() => this.classList.add('dragging'), 0);
        });
        draggable.addEventListener('dragend', function () {
            this.classList.remove('dragging');
        });
    });

    dropTargets.forEach(target => {
        target.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        target.addEventListener('dragleave', function () {
            this.classList.remove('dragover');
        });
        target.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggableElement = container.querySelector(`.draggable[data-id="${draggedId}"]`);
            
            // Zoek de specifieke container voor gesleepte items
            const droppedItemsContainer = this.querySelector('.dropped-items-container');
            if (draggableElement && droppedItemsContainer) {
                // Voeg het element toe aan de container, vervang niet
                droppedItemsContainer.appendChild(draggableElement);
            }
        });
    });
    
    const dragContainer = container.querySelector('.drag-container');
    if (dragContainer) {
        dragContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        dragContainer.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        dragContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const draggedId = e.dataTransfer.getData('text/plain');
            // Ensure we're only moving draggables that belong to this exercise
            const draggableElement = document.querySelector(`.draggable[data-id="${draggedId}"]`);
            if (draggableElement && draggableElement.closest('.interactive-exercise') === container.querySelector('.interactive-exercise')) {
                this.appendChild(draggableElement);
            }
        });
    }
}

async function checkDragDrop(containerTargetId, sectionNumber, dragDropId) {
    const container = document.getElementById(containerTargetId);
    if(!container) {
      console.error(`DragDrop container #${containerTargetId} not found in checkDragDrop.`);
      return;
    }
    
    // Gebruik getInteractionData om de data te krijgen, werkt ook voor 'dev' modus
    const ddData = await getInteractionData(sectionNumber, dragDropId);

    if (!ddData || !ddData.correctCombinations) {
        console.error(`Drag & drop data or correctCombinations not found for ${dragDropId}.`);
        return;
    }

    const correctCombinations = ddData.correctCombinations;

    let allCorrect = true;
    const interactiveExercise = container.querySelector('.interactive-exercise');
    const dropTargets = interactiveExercise.querySelectorAll('.drop-target');
    const allPlacedItems = new Set();

    // Valideer alle items in de drop targets
    dropTargets.forEach(target => {
        const targetId = target.getAttribute('data-id');
        const draggableElements = target.querySelectorAll('.draggable');
        
        draggableElements.forEach(item => {
            const itemId = item.getAttribute('data-id');
            allPlacedItems.add(itemId);
            
            // Vind de correcte combinatie voor dit item
            const correctCombination = correctCombinations.find(c => c.itemId === itemId);
            
            if (correctCombination && correctCombination.targetId === targetId) {
                item.classList.add('correct');
                item.classList.remove('incorrect');
            } else {
                allCorrect = false;
                item.classList.add('incorrect');
                item.classList.remove('correct');
            }
        });
    });

    // Controleer of alle items wel geplaatst zijn
    const initialItemsData = ddData.items || [];
    if (allPlacedItems.size !== initialItemsData.length) {
        allCorrect = false;
    }

    // Controleer of er geen items meer in de startcontainer zitten
    const itemsInDragContainer = interactiveExercise.querySelectorAll('.drag-container .draggable');
    if (itemsInDragContainer.length > 0) {
        allCorrect = false;
    }
    
    const feedbackEl = interactiveExercise.querySelector(`#feedback-${sectionNumber}-${dragDropId}`);
    const resetButton = interactiveExercise.querySelector('.btn-reset-dragdrop');
    const checkButton = interactiveExercise.querySelector('.btn-check-dragdrop');
    
    const storageKeyCorrect = `dragdrop_${sectionNumber}_${dragDropId}_correct`;
    const storageKeyState = `dragdrop_${sectionNumber}_${dragDropId}_state`;

    if (allCorrect) {
        if(feedbackEl) {
            feedbackEl.textContent = ddData.feedbackCorrect || 'Goed gedaan! Alles is correct.';
            feedbackEl.className = 'dragdrop-feedback correct';
        }
        localStorage.setItem(storageKeyCorrect, 'true');
        localStorage.setItem(storageKeyState, JSON.stringify(Array.from(allPlacedItems))); // Sla de succesvolle staat op
        if (resetButton) resetButton.style.display = 'none';
        if (checkButton) {
            checkButton.disabled = true;
            checkButton.textContent = 'Opgeslagen';
            checkButton.classList.add('btn-opgeslagen');
        }
        // Maak alle draggables en targets niet meer interactief
        interactiveExercise.querySelectorAll('.draggable').forEach(el => el.setAttribute('draggable', 'false'));
        // Event listeners moeten mogelijk ook worden verwijderd of gecontroleerd.
    } else {
        if(feedbackEl) {
            feedbackEl.textContent = ddData.feedbackIncorrect || 'Niet alle koppelingen zijn correct. Probeer het opnieuw.';
            feedbackEl.className = 'dragdrop-feedback incorrect';
        }
        localStorage.removeItem(storageKeyCorrect);
        localStorage.removeItem(storageKeyState); // Verwijder state als het niet correct is
        if (resetButton) resetButton.style.display = 'inline-block';
        if (checkButton) checkButton.disabled = false;
    }
    if (sectionNumber !== 'dev') {
        await updateAllChapterProgress();
    }
}

function resetDragDrop(sectionNumber, dragDropId, containerTargetId) {
    const container = document.getElementById(containerTargetId); // This is the placeholder div
    if (!container) {
        console.error(`DragDrop placeholder container #${containerTargetId} not found in resetDragDrop.`);
        return;
    }
    const interactiveExercise = container.querySelector('.interactive-exercise'); // Get the actual exercise div
    if (!interactiveExercise) {
        console.error(`DragDrop interactive exercise not found within #${containerTargetId}.`);
        return;
    }

    const dragContainer = interactiveExercise.querySelector('.drag-container');
    const dropTargets = interactiveExercise.querySelectorAll('.drop-target');
    const feedbackEl = interactiveExercise.querySelector(`#feedback-${sectionNumber}-${dragDropId}`);
    const resetButton = interactiveExercise.querySelector('.btn-reset-dragdrop');
    const checkButton = interactiveExercise.querySelector('.btn-check-dragdrop');
    
    if (!dragContainer) {
        console.error("Drag container not found in resetDragDrop for " + containerTargetId);
        return;
    }
    dragContainer.innerHTML = ''; // Clear it first

    // Clear items from drop targets by clearing their innerHTML for .dropped-items-container
    dropTargets.forEach(target => {
        const droppedItemsContainer = target.querySelector('.dropped-items-container');
        if (droppedItemsContainer) {
            droppedItemsContainer.innerHTML = '';
        }
    });
    
    const initialItemsString = interactiveExercise.dataset.initialItems;
    if (initialItemsString) {
        const initialItemsData = JSON.parse(initialItemsString);
        if(initialItemsData.length > 0) {
            initialItemsData.forEach(itemData => {
                const el = document.createElement('div');
                el.className = 'draggable';
                el.setAttribute('draggable', 'true');
                el.setAttribute('data-id', itemData.id);
                el.textContent = itemData.label;
                // Verwijder inline styles die door opslaan zijn toegevoegd
                el.style.pointerEvents = ''; 
                el.style.opacity = '';
                dragContainer.appendChild(el);
            });
            initializeSpecificDragDrop(container.id, sectionNumber, dragDropId, {}); 
        }
    } 
    // Fallback is niet meer echt nodig als dataset.initialItems goed gevuld wordt

    if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'dragdrop-feedback';
    }
    if (resetButton) resetButton.style.display = 'none';
    if (checkButton) {
        checkButton.disabled = false;
    }

    localStorage.removeItem(`dragdrop_${sectionNumber}_${dragDropId}_correct`);
    localStorage.removeItem(`dragdrop_${sectionNumber}_${dragDropId}_state`); // Verwijder ook de state
    if (sectionNumber !== 'dev') {
        updateAllChapterProgress();
    }
}

// Migratie functie voor oude ID's naar nieuwe format
async function migrateOldIdsToNewFormat() {
    const oldToNewIdMap = {};
    // Dynamisch genereren van chaptersToMigrate op basis van totalSections
    // Alle hoofdstukken behalve het laatste (afsluitend hoofdstuk)
    const chaptersToMigrate = Array.from({length: totalSections - 1}, (_, i) => i + 1);

    // Verzamel alle oude ID's en maak nieuwe
    for (const h of chaptersToMigrate) {
        try {
            const res = await fetch(`content/hoofdstuk${h}.json`);
            if (!res.ok) continue;
            const data = await res.json();
            if (!data.interacties) continue;

            data.interacties.forEach((interactie, index) => {
                const oldId = interactie.id;
                const newId = `h${h}_${interactie.type}_${index + 1}`;
                oldToNewIdMap[oldId] = newId;
            });
        } catch (e) {
            console.error(`Fout bij migreren hoofdstuk ${h}:`, e);
        }
    }

    // Migreer localStorage items
    const keysToMigrate = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('reflection_') || 
            key.startsWith('mc_') || 
            key.startsWith('dragdrop_') || 
            key.startsWith('selfassessment_') || 
            key.startsWith('flashcard_')) {
            keysToMigrate.push(key);
        }
    }

    // Migreer elke key
    keysToMigrate.forEach(oldKey => {
        const value = localStorage.getItem(oldKey);
        if (!value) return;

        // Bepaal het type en hoofdstuk uit de key
        const [type, section, oldId] = oldKey.split('_');
        if (!oldId || !oldToNewIdMap[oldId]) return;

        // Maak nieuwe key met nieuw ID
        const newKey = `${type}_${section}_${oldToNewIdMap[oldId]}`;
        
        // Sla op met nieuwe key
        localStorage.setItem(newKey, value);
        
        // Verwijder oude key niet direct, voor veiligheid
    });
}

// Function to initialize MC interactions (called from dynamicContent.js)
function initializeMCInteraction(containerId, interactionData, sectionNumber) {
    const mcContainer = document.getElementById(containerId);
    if (!mcContainer) {
        console.error(`MC container #${containerId} not found for initialization.`);
        return;
    }
    const options = mcContainer.querySelectorAll('li.mc-option');
    const mcElement = mcContainer.querySelector('.mc-interaction');

    options.forEach(option => {
        option.addEventListener('click', async function () {
            if (mcElement && mcElement.classList.contains('answered')) return;

            const selectedAnswerIndex = parseInt(this.getAttribute('data-id')); // Is nu 0-gebaseerd
            // Call checkMCAnswer with the correct 0-based index
            await checkMCAnswer(interactionData.id, selectedAnswerIndex, interactionData.correctAnswer, sectionNumber, mcElement, options);
        });
    });
}

async function saveCriticalAnalysis(sectionNumber, interactionId) {
    const select = document.getElementById('critical-analysis-select');
    const selectedTech = select ? select.value : '';
    const feedbackEl = document.getElementById(`feedback-${sectionNumber}-${interactionId}`);

    // Get interaction data to validate against
    const interactionDataForCritical = await getInteractionData(sectionNumber, interactionId);
    
    // Validate selectedTech - it might not be present if interactionData.dropdown is empty or not defined
    if (interactionDataForCritical?.dropdown?.length > 0 && !selectedTech) {
        if (feedbackEl) {
            feedbackEl.textContent = 'Selecteer een technologie.';
            feedbackEl.className = 'feedback-message incorrect';
        }
        return;
    }

    // Validate text areas based on interactionData.vragen
    let allQuestionsAnswered = true;
    const data = { technologie: selectedTech };

    if (interactionDataForCritical && interactionDataForCritical.vragen) {
        for (const vraag of interactionDataForCritical.vragen) {
            const inputElement = document.getElementById(`${vraag.id}-input`);
            const answer = inputElement ? inputElement.value.trim() : '';
                    devLog(`Checking field ${vraag.id}-input:`, answer);
        if (answer.length < 10) { // Assuming minLength 10 for all questions
            allQuestionsAnswered = false;
            devLog(`Field ${vraag.id} too short:`, answer.length);
                break;
            }
            data[vraag.id] = answer;
        }
    }

    if (!allQuestionsAnswered) {
        if (feedbackEl) {
            feedbackEl.textContent = 'Beantwoord alle vragen (minimaal 10 tekens per antwoord).';
            feedbackEl.className = 'feedback-message incorrect';
        }
        return;
    }

    devLog('Saving critical analysis data:', data);
    devLog('Storage key:', `critical_analysis_${sectionNumber}_${interactionId}_answered`);

    localStorage.setItem(`critical_analysis_${sectionNumber}_${interactionId}_answered`, JSON.stringify(data));
    if (feedbackEl) {
        feedbackEl.textContent = 'Opgeslagen!';
        feedbackEl.className = 'feedback-message correct';
    }

    // De container ID is anders in de dev-modus
    const containerId = sectionNumber === 'dev' 
        ? `dev-${interactionId}` 
        : `hoofdstuk${sectionNumber}-${interactionId}`;
    const container = document.getElementById(containerId);

    if (container && typeof window.renderInteraction === 'function') {
        setTimeout(async () => {
             // Haal de juiste data op (uit window.devChapterData of via fetch)
            const chapterData = sectionNumber === 'dev' 
                ? window.devChapterData 
                : await window.fetchChapterData(sectionNumber);

            if (chapterData && chapterData.interacties) {
                const freshInteractionData = chapterData.interacties.find(i => i.id === interactionId);
                if (freshInteractionData) {
                    window.renderInteraction(freshInteractionData, sectionNumber, container);
                }
            }
        }, 600);
    }
    if (sectionNumber !== 'dev') {
        updateAllChapterProgress();
    }
}

/**
 * Wist alle voortgang die specifiek is voor de 'Interacties Testen' modus.
 */
function clearDevProgress() {
    if (!confirm("Weet je zeker dat je de voortgang van deze testpagina wilt wissen?")) {
        return;
    }

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Zoek naar keys die het '_dev_' patroon bevatten.
        if (key.includes('_dev_')) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        devLog(`Removed dev key: ${key}`);
    });

    // Her-render de testpagina om de wijzigingen te tonen.
    const mainContainer = document.querySelector('main.container');
    if (window.devChapterData && mainContainer && typeof window.renderStandaloneChapter === 'function') {
        window.renderStandaloneChapter(window.devChapterData, mainContainer);
        alert("De voortgang van de testpagina is gewist.");
    } else {
        // Fallback als er iets misgaat
        window.location.reload();
    }
}

// Functie om de voortgangsbalk bij te werken
function updateProgressBar() {
    const chapters = document.querySelectorAll('.chapter-link');
    if (chapters.length === 0) return;

    const completedChapters = document.querySelectorAll('.chapter-link.completed').length;
    const totalChapters = chapters.length;
    const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    const progressRing = document.getElementById('progressRing');
    const sidebarProgressVisual = document.getElementById('sidebarProgressVisual');
    const sidebarProgressText = document.getElementById('sidebarProgressText');

    if (progressRing) {
        const circumference = 2 * Math.PI * progressRing.r.baseVal.value;
        const offset = circumference - (progress / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
    if (sidebarProgressVisual) {
        sidebarProgressVisual.style.width = `${progress}%`;
    }
    if (sidebarProgressText) {
        sidebarProgressText.textContent = `${Math.round(progress)}% voltooid`;
    }
}

// Event listener voor de "Wis Alle Voortgang" knop
document.getElementById('clearProgressBtn').addEventListener('click', () => {
    if (confirm('Weet je zeker dat je alle voortgang wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
        localStorage.clear();
        location.reload();
    }
});

// Modal "Hoe werkt deze site?"
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('howItWorksModal');
    const link = document.getElementById('elearningInfoLink');
    const closeButton = document.querySelector('.modal-close-button');

    // Zorg ervoor dat de modal altijd verborgen start
    if (modal) {
        modal.style.display = 'none';
    }

    // Functie om de modal te openen
    function openModal() {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Voorkom scrollen van de achtergrond
        }
    }

    // Functie om de modal te sluiten
    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Herstel scrollen
            // Markeer dat de modal is gezien
            localStorage.setItem('modalInfoSeen', 'true');
        }
    }

    // Controleer of dit het eerste bezoek is
    const hasSeenModal = localStorage.getItem('modalInfoSeen');
    if (!hasSeenModal) {
        // Wacht even voordat de modal wordt getoond (voor betere UX)
        setTimeout(() => {
            openModal();
        }, 1000); // 1 seconde vertraging
    }

    if (modal && link && closeButton) {
        // Event listener voor het handmatig openen van de modal
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        });

        // Event listener voor het sluiten via de X knop
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });

        // Event listener voor het sluiten door buiten de modal te klikken
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Event listener voor ESC toets
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    }
});

function initializeReflectionInteraction(containerId, interactionData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const textarea = container.querySelector('.reflection-input');
    const counter = container.querySelector('.char-counter');
    
    if (!textarea || !counter) return;

    const minLength = parseInt(textarea.getAttribute('minlength'), 10) || 10;
    const maxLength = parseInt(textarea.getAttribute('maxlength'), 10) || 1500;

    const updateCounter = () => {
        const currentLength = textarea.value.length;
        const remaining = maxLength - currentLength;

        if (currentLength < minLength) {
            counter.textContent = `Nog ${minLength - currentLength} tekens nodig`;
            counter.className = 'char-counter low';
        } else {
            counter.textContent = `${remaining} tekens over`;
            if (remaining < 0) {
                counter.className = 'char-counter error';
            } else if (remaining <= 50) {
                counter.className = 'char-counter warning';
            } else {
                counter.className = 'char-counter';
            }
        }
    };

    textarea.addEventListener('input', updateCounter);
    // Roep de functie direct aan om de initiële staat te tonen (voor opgeslagen antwoorden)
    updateCounter();
}

// Braindump Interaction Functions
async function saveBraindump(chapterNumber, braindumpId) {
    const textareaId = `${braindumpId}-textarea`;
    const textarea = document.getElementById(textareaId);
    
    if (!textarea) {
        console.error(`Braindump textarea with ID ${textareaId} not found.`);
        return;
    }
    
    const braindumpText = textarea.value.trim();
    
    // Minimale validatie
    if (braindumpText.length < 20) {
        alert('Je braindump moet minimaal 20 tekens bevatten.');
        return;
    }
    
    // Controleer of er een evaluatie is geselecteerd
    const evaluationRadios = document.querySelectorAll(`input[name="${braindumpId}-evaluation"]:checked`);
    if (evaluationRadios.length === 0) {
        alert('Selecteer eerst hoe goed je de inhoud kon reproduceren.');
        return;
    }
    
    const selectedEvaluation = evaluationRadios[0].value;
    
    // Haal bestaande data op
    const storageKeyAttempts = `braindump_${chapterNumber}_${braindumpId}_attempts`;
    const storageKeyEvaluations = `braindump_${chapterNumber}_${braindumpId}_evaluations`;
    const storageKeyCompleted = `braindump_${chapterNumber}_${braindumpId}_completed`;
    
    const attempts = JSON.parse(localStorage.getItem(storageKeyAttempts) || '[]');
    const evaluations = JSON.parse(localStorage.getItem(storageKeyEvaluations) || '[]');
    
    // Voeg nieuwe poging toe
    attempts.push(braindumpText);
    evaluations.push({
        attempt: attempts.length,
        evaluation: selectedEvaluation,
        timestamp: new Date().toISOString()
    });
    
    // Sla data op
    localStorage.setItem(storageKeyAttempts, JSON.stringify(attempts));
    localStorage.setItem(storageKeyEvaluations, JSON.stringify(evaluations));
    localStorage.setItem(storageKeyCompleted, 'true');
    
    // Update UI direct zonder re-render
    const saveBtn = document.getElementById(`${braindumpId}-save-btn`);
    const textareaElement = document.getElementById(textareaId);
    const evaluationOptions = document.querySelectorAll(`input[name="${braindumpId}-evaluation"]`);
    
    if (saveBtn) {
        saveBtn.textContent = 'Opgeslagen';
        saveBtn.classList.add('btn-opgeslagen');
        saveBtn.disabled = true;
    }
    
    if (textareaElement) {
        textareaElement.readOnly = true;
    }
    
    // Disable evaluation radio buttons
    evaluationOptions.forEach(radio => {
        radio.disabled = true;
    });
    
    // Add feedback message
    const containerId = chapterNumber === 'dev' 
        ? `dev-${braindumpId}` 
        : `hoofdstuk${chapterNumber}-${braindumpId}`;
    const container = document.getElementById(containerId);
    
    if (container) {
        // Remove existing feedback if any
        const existingFeedback = container.querySelector('.feedback-message');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Add new feedback
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-message';
        feedbackDiv.style.cssText = 'display: block; margin-top: 1rem; padding: 1rem; background-color: var(--info-background); border-radius: 4px;';
        
        const evaluationLabels = {
            'good': 'Goed - Ik wist het meeste nog',
            'fair': 'Matig - Ik wist de helft nog',
            'poor': 'Slecht - Ik wist weinig nog'
        };
        
        const evalText = evaluationLabels[selectedEvaluation] || selectedEvaluation;
        feedbackDiv.innerHTML = `<strong>Je evaluatie:</strong> ${evalText}<br><em>Poging ${attempts.length} opgeslagen.</em>`;
        
        // Insert feedback after evaluation section
        const evaluationSection = container.querySelector('.braindump-evaluation');
        if (evaluationSection) {
            evaluationSection.parentNode.insertBefore(feedbackDiv, evaluationSection.nextSibling);
        }
    }
    
    if (chapterNumber !== 'dev') {
        await updateAllChapterProgress();
    }
}

function retryBraindump(chapterNumber, braindumpId) {
    // Reset de opgeslagen 'completed' status maar behoud de pogingen geschiedenis
    const storageKeyCompleted = `braindump_${chapterNumber}_${braindumpId}_completed`;
    localStorage.removeItem(storageKeyCompleted);
    
    // Update UI direct zonder re-render
    const saveBtn = document.getElementById(`${braindumpId}-save-btn`);
    const textareaElement = document.getElementById(`${braindumpId}-textarea`);
    const evaluationOptions = document.querySelectorAll(`input[name="${braindumpId}-evaluation"]`);
    
    if (saveBtn) {
        saveBtn.textContent = 'Evaluatie Opslaan';
        saveBtn.classList.remove('btn-opgeslagen');
        saveBtn.disabled = false;
    }
    
    if (textareaElement) {
        textareaElement.value = '';
        textareaElement.readOnly = false;
    }
    
    // Enable evaluation radio buttons and uncheck them
    evaluationOptions.forEach(radio => {
        radio.disabled = false;
        radio.checked = false;
    });
    
    // Remove feedback message
    const containerId = chapterNumber === 'dev' 
        ? `dev-${braindumpId}` 
        : `hoofdstuk${chapterNumber}-${braindumpId}`;
    const container = document.getElementById(containerId);
    
    if (container) {
        const existingFeedback = container.querySelector('.feedback-message');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }
    
    // Update attempts info
    const attemptsInfo = container?.querySelector('.braindump-attempts-info');
    if (attemptsInfo) {
        const storageKeyAttempts = `braindump_${chapterNumber}_${braindumpId}_attempts`;
        const attempts = JSON.parse(localStorage.getItem(storageKeyAttempts) || '[]');
        attemptsInfo.textContent = `Poging ${attempts.length + 1} van onbeperkt`;
    }
}

async function initializeBraindumpInteraction(containerId, interactionData, chapterNumber) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Braindump container #${containerId} not found for initialization.`);
        return;
    }
    
    const braindumpId = interactionData.id;
    const textarea = container.querySelector(`#${braindumpId}-textarea`);
    
    // Check if already completed
    const storageKeyCompleted = `braindump_${chapterNumber}_${braindumpId}_completed`;
    const isCompleted = localStorage.getItem(storageKeyCompleted) === 'true';
    
    // Haal hoofdstuk content op voor ChatGPT prompt
    let chapterContent = '';
    let chapterData = null;
    try {
        if (chapterNumber !== 'dev') {
            chapterData = await window.fetchChapterData(chapterNumber);
            if (chapterData && chapterData.content) {
                // Extract text content from JSON structure
                chapterContent = extractTextFromContent(chapterData.content);
            }
        }
    } catch (error) {
        console.error('Error fetching chapter content for ChatGPT prompt:', error);
    }
    
    if (textarea) {
        // Update ChatGPT link dynamisch wanneer de inhoud verandert
        const updateChatGPTLink = () => {
            const chatGptLink = container.querySelector('.braindump-chatgpt-link');
            if (chatGptLink) {
                const currentText = textarea.value.trim();
                // Gebruik altijd de volledige promptstructuur
                let selectedContent = chapterContent;
                const sectionCheckboxes = container.querySelectorAll('.braindump-section-checkbox:checked');
                if (sectionCheckboxes.length > 0 && chapterData) {
                    const selectedIndexes = Array.from(sectionCheckboxes).map(cb => cb.value);
                    selectedContent = getSelectedSectionContent(chapterData, selectedIndexes);
                }
                const fullPrompt = buildBraindumpPrompt(interactionData, selectedContent, currentText);
                const encodedPrompt = encodeURIComponent(fullPrompt);
                chatGptLink.href = `https://chatgpt.com/?q=${encodedPrompt}`;
            }
        };
        
        textarea.addEventListener('input', updateChatGPTLink);
        
        // Update link initieel
        updateChatGPTLink();
        
        // Update link ook wanneer sectie-selectie verandert
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('braindump-section-checkbox')) {
                updateChatGPTLink();
                
                // Handle "Hele hoofdstuk" checkbox logic
                if (e.target.value === 'all') {
                    const sectionCheckboxes = container.querySelectorAll('.braindump-section-checkbox:not([value="all"])');
                    sectionCheckboxes.forEach(cb => {
                        cb.checked = e.target.checked;
                        cb.disabled = e.target.checked;
                    });
                } else {
                    // Individual section checkbox changed
                    const allCheckbox = container.querySelector('.braindump-section-checkbox[value="all"]');
                    if (allCheckbox && allCheckbox.checked) {
                        allCheckbox.checked = false;
                        const sectionCheckboxes = container.querySelectorAll('.braindump-section-checkbox:not([value="all"])');
                        sectionCheckboxes.forEach(cb => {
                            cb.disabled = false;
                        });
                    }
                }
            }
        });
    }
    
    // Load en render secties als nog niet completed
    if (!isCompleted && chapterData) {
        const sectionList = container.querySelector(`#${braindumpId}-section-list`);
        if (sectionList) {
            const sections = prepareBraindumpSections(chapterData);
            
            sections.forEach((section, index) => {
                const sectionHTML = `
                    <label class="braindump-section-option">
                        <input type="checkbox" class="braindump-section-checkbox" value="${index}">
                        <span class="braindump-section-label">📝 ${section.title}</span>
                    </label>
                `;
                sectionList.innerHTML += sectionHTML;
            });
            // Synchroniseer direct de checkboxes met de "Hele hoofdstuk" selectie
            const allCheckbox = container.querySelector('.braindump-section-checkbox[value="all"]');
            if (allCheckbox && allCheckbox.checked) {
                const sectionCheckboxes = container.querySelectorAll('.braindump-section-checkbox:not([value="all"])');
                sectionCheckboxes.forEach(cb => {
                    cb.checked = true;
                    cb.disabled = true;
                });
            }
            
            // Collapse sectie-selector op mobiel
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                const optionsElement = container.querySelector(`#${braindumpId}-section-options`);
                const toggleButton = container.querySelector(`#${braindumpId}-section-toggle`);
                if (optionsElement && toggleButton) {
                    optionsElement.classList.add('collapsed');
                    toggleButton.classList.add('collapsed');
                    toggleButton.textContent = '▶';
                }
            } else {
                // Desktop: standaard uitgeklapt
                const optionsElement = container.querySelector(`#${braindumpId}-section-options`);
                const toggleButton = container.querySelector(`#${braindumpId}-section-toggle`);
                if (optionsElement && toggleButton) {
                    optionsElement.classList.remove('collapsed');
                    toggleButton.classList.remove('collapsed');
                    toggleButton.textContent = '▼';
                }
            }
        }
    }
    
    // Initialize save button state
    const saveBtn = container.querySelector(`#${braindumpId}-save-btn`);
    if (saveBtn) {
        if (isCompleted) {
            saveBtn.textContent = 'Opgeslagen';
            saveBtn.classList.add('btn-opgeslagen');
            saveBtn.disabled = true;
        } else {
            saveBtn.textContent = 'Evaluatie Opslaan';
            saveBtn.classList.remove('btn-opgeslagen');
            saveBtn.disabled = true; // Start disabled until text and evaluation are provided
        }
    }
    
    // Combined event listener for both textarea and evaluation radio buttons
    const updateSaveButtonState = () => {
        const saveBtn = container.querySelector(`#${braindumpId}-save-btn`);
        const textareaElement = container.querySelector(`#${braindumpId}-textarea`);
        const evaluationSelected = container.querySelector(`input[name="${braindumpId}-evaluation"]:checked`);
        
        if (saveBtn && textareaElement && evaluationSelected) {
            const hasEnoughText = textareaElement.value.trim().length >= 20;
            if (hasEnoughText) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Evaluatie Opslaan';
                saveBtn.classList.remove('btn-opgeslagen');
            } else {
                saveBtn.disabled = true;
            }
        } else if (saveBtn) {
            saveBtn.disabled = true;
        }
    };
    
    // Character counter functionality
    const updateCharacterCounter = () => {
        const textareaElement = container.querySelector(`#${braindumpId}-textarea`);
        const counterElement = container.querySelector(`#${braindumpId}-counter`);
        
        if (textareaElement && counterElement) {
            const currentLength = textareaElement.value.length;
            const maxLength = 5000;
            const remaining = maxLength - currentLength;
            
            if (currentLength < 20) {
                counterElement.textContent = `Nog ${20 - currentLength} tekens nodig (minimaal 20)`;
                counterElement.className = 'char-counter low';
            } else {
                counterElement.textContent = `${remaining} tekens over`;
                if (remaining < 0) {
                    counterElement.className = 'char-counter error';
                } else if (remaining <= 100) {
                    counterElement.className = 'char-counter warning';
                } else {
                    counterElement.className = 'char-counter';
                }
            }
        }
    };
    
    // Add event listeners
    if (textarea && !isCompleted) {
        textarea.addEventListener('input', updateSaveButtonState);
        textarea.addEventListener('input', updateCharacterCounter);
        // Initialize counter on load
        updateCharacterCounter();
    }
    
    const evaluationRadios = container.querySelectorAll(`input[name="${braindumpId}-evaluation"]`);
    evaluationRadios.forEach(radio => {
        radio.addEventListener('change', updateSaveButtonState);
    });
    
    // Eventlistener voor kopieerknop prompt
    const copyBtn = container.querySelector(`#${braindumpId}-copy-prompt-btn`);
    const feedbackSpan = container.querySelector(`#${braindumpId}-copy-feedback`);
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            // Gebruik altijd de actuele prompt
            let selectedContent = chapterContent;
            const sectionCheckboxes = container.querySelectorAll('.braindump-section-checkbox:checked');
            if (sectionCheckboxes.length > 0 && chapterData) {
                const selectedIndexes = Array.from(sectionCheckboxes).map(cb => cb.value);
                selectedContent = getSelectedSectionContent(chapterData, selectedIndexes);
            }
            const fullPrompt = buildBraindumpPrompt(interactionData, selectedContent, textarea.value.trim());
            navigator.clipboard.writeText(fullPrompt).then(() => {
                if (feedbackSpan) {
                    feedbackSpan.style.display = 'inline';
                    setTimeout(() => { feedbackSpan.style.display = 'none'; }, 1800);
                }
            });
        });
    }
}

// Helper functies voor braindump sectie-selectie
function extractSectionsFromContent(content) {
    const sections = [];
    let currentSection = { title: "Begin van hoofdstuk", content: [] };
    
    if (!Array.isArray(content)) return sections;
    
    content.forEach(item => {
        if (item.type === 'section-title') {
            // Nieuwe sectie gevonden
            if (currentSection.content.length > 0) {
                sections.push(currentSection);
            }
            currentSection = { 
                title: item.titel, 
                content: [item] 
            };
        } else {
            // Voeg content toe aan huidige sectie
            currentSection.content.push(item);
        }
    });
    
    // Laatste sectie toevoegen
    if (currentSection.content.length > 0) {
        sections.push(currentSection);
    }
    
    return sections;
}

function filterContentForBraindump(content) {
    if (!Array.isArray(content)) return [];
    
    return content.filter(item => {
        // Altijd uitgesloten types
        if (BRAINDUMP_CONFIG.auto_exclude_content_types.includes(item.type)) {
            return false;
        }
        
        // Configureerbare uitsluitingen
        const excludes = BRAINDUMP_CONFIG.configurable_excludes;
        if (excludes.videos && item.type === 'video-grid') return false;
        if (excludes.audio && item.type === 'audio-block') return false;
        if (excludes.images && item.type === 'image-gallery') return false;
        if (excludes.interactions && item.type.includes('interaction')) return false;
        
        return true;
    });
}

function prepareBraindumpSections(chapterData) {
    let sections = extractSectionsFromContent(chapterData.content);
    
    // 1. Automatische filtering op basis van configuratie
    sections = sections.filter(section => {
        // Sluit "Begin van hoofdstuk" uit (introductie content)
        if (section.title === "Begin van hoofdstuk") {
            return false;
        }
        
        // Controleer section titel patronen
        const shouldExclude = BRAINDUMP_CONFIG.exclude_section_patterns.some(pattern => 
            pattern.test(section.title)
        );
        return !shouldExclude;
    });
    
    // 2. Content type filtering per sectie
    sections = sections.map(section => ({
        ...section,
        content: filterContentForBraindump(section.content)
    }));
    
    // 3. Verwijder lege secties
    sections = sections.filter(section => section.content.length > 0);
    
    return sections;
}

function getSelectedSectionContent(chapterData, selectedSectionIndexes) {
    if (!selectedSectionIndexes || selectedSectionIndexes.length === 0) {
        return extractTextFromContent(chapterData.content);
    }
    
    const sections = prepareBraindumpSections(chapterData);
    
    if (selectedSectionIndexes.includes('all')) {
        return extractTextFromContent(chapterData.content);
    }
    
    const selectedContent = [];
    selectedSectionIndexes.forEach(index => {
        const sectionIndex = parseInt(index);
        if (sections[sectionIndex]) {
            selectedContent.push(...sections[sectionIndex].content);
        }
    });
    
    return extractTextFromContent(selectedContent);
}

// Helper functie om tekst uit content structuur te extraheren
function extractTextFromContent(content) {
    let text = '';
    
    if (!Array.isArray(content)) return text;
    
    content.forEach(item => {
        switch (item.type) {
            case 'content-text':
            case 'section-title':
            case 'content-subtitle':
                if (item.tekst) text += item.tekst + '\n\n';
                if (item.titel) text += item.titel + '\n\n';
                break;
            case 'info-card':
                if (item.titel) text += item.titel + '\n';
                if (item.tekst) text += item.tekst + '\n';
                if (item.items) {
                    item.items.forEach(subItem => {
                        if (subItem.titel) text += subItem.titel + ': ';
                        if (subItem.tekst) text += subItem.tekst + '\n';
                    });
                }
                text += '\n';
                break;
            case 'benefits-grid':
                if (item.items) {
                    item.items.forEach(benefit => {
                        if (benefit.titel) text += benefit.titel + ': ';
                        if (benefit.tekst) text += benefit.tekst + '\n';
                    });
                }
                text += '\n';
                break;
            case 'accordion':
                if (item.titel) text += item.titel + '\n';
                if (item.content) {
                    item.content.forEach(accordionItem => {
                        if (accordionItem.titel) text += accordionItem.titel + ': ';
                        if (accordionItem.beschrijving) text += accordionItem.beschrijving + '\n';
                    });
                }
                text += '\n';
                break;
        }
    });
    
    return text.trim();
}

devLog('script.js loaded');

// Centrale configuratie voor braindump sectie filtering
const BRAINDUMP_CONFIG = {
    // Automatisch uitgesloten (altijd)
    auto_exclude_content_types: [
        'divider'  // Scheidingslijnen zijn niet inhoudelijk
    ],
    
    // Configureerbare uitsluitingen (makkelijk aan/uit te zetten)
    configurable_excludes: {
        videos: true,           // Zet op false om video's toe te staan
        audio: false,           // Zet op true om audio uit te sluiten
        images: false,          // Zet op true om afbeeldingen uit te sluiten
        interactions: true      // Altijd true - interacties horen niet in braindump
    },
    
    // Sectie titel patronen om uit te sluiten
    exclude_section_patterns: [
        /interacties?$/i,       // Secties die eindigen op "interactie(s)"
        /oefeningen?$/i         // Secties die eindigen op "oefening(en)"
    ]
};

function buildBraindumpPrompt(interactionData, chapterContent, studentText) {
    // Korte inleiding uit de bestaande prompt (indien aanwezig)
    const basePrompt = interactionData.chatgpt_prompt || '';
    
    // Uitgebreide instructie
    const instructie = `

**Context:**  
De onderstaande tekst is afkomstig uit een e-learning over effectief leren. De student heeft een braindump gemaakt op basis van de geselecteerde secties.

**Doel van de braindump:**  
De student probeert de inhoud van het hoofdstuk zo goed mogelijk uit het eigen geheugen op te halen, zonder terug te kijken in de tekst. Dit is een bewezen effectieve leerstrategie om kennis beter te onthouden en te verdiepen.

**Jouw rol als AI:**  
Jij bent een leercoach. Geef constructieve, motiverende en concrete feedback op de braindump van de student.
- Benoem wat de student al goed heeft opgehaald uit het geheugen.
- Wijs op eventuele hiaten of onduidelijkheden in het antwoord.
- Geef praktische tips om het leren en onthouden verder te verbeteren.

**Focus op inhoud:**  
De feedback moet uitsluitend gericht zijn op de inhoud van de informatie uit het hoofdstuk. Aspecten als vormgeving, structuur, spelling of grammatica zijn van secundair belang en dienen niet of slechts zeer beknopt behandeld te worden. Houd er rekening mee dat de input ook gesproken kan zijn.

**Gewenste outputstructuur:**  
Geef een gestructureerde analyse met:
1. Sterke punten
2. Verbeterpunten
3. Suggesties voor verdieping
4. Eindbeoordeling (expert/gevorderd/beginner)

**Hoofdstuk inhoud om mee te vergelijken:**
${chapterContent}

**Mijn braindump:**
${studentText}
`;
    
    return `${basePrompt}\n${instructie}`;
}

// Braindump Instruction Toggle Function
function toggleBraindumpInstruction(braindumpId) {
    const detailsElement = document.getElementById(`${braindumpId}-instruction-details`);
    const toggleButton = document.querySelector(`#${braindumpId}-instruction-details`).previousElementSibling.querySelector('.braindump-instruction-toggle');
    
    if (detailsElement) {
        const isVisible = detailsElement.style.display !== 'none';
        detailsElement.style.display = isVisible ? 'none' : 'block';
        
        if (toggleButton) {
            toggleButton.textContent = isVisible ? 'i' : '−';
            toggleButton.title = isVisible ? 'Meer informatie' : 'Minder informatie';
        }
    }
}

// Braindump Section Toggle Function
function toggleBraindumpSections(braindumpId) {
    const optionsElement = document.getElementById(`${braindumpId}-section-options`);
    const toggleButton = document.getElementById(`${braindumpId}-section-toggle`);
    
    if (optionsElement && toggleButton) {
        const isCollapsed = optionsElement.classList.contains('collapsed');
        
        if (isCollapsed) {
            optionsElement.classList.remove('collapsed');
            toggleButton.classList.remove('collapsed');
            toggleButton.textContent = '▼';
        } else {
            optionsElement.classList.add('collapsed');
            toggleButton.classList.add('collapsed');
            toggleButton.textContent = '▶';
        }
    }
}

// Braindump AI Toggle Function
function toggleBraindumpAI(braindumpId) {
    const detailsElement = document.getElementById(`${braindumpId}-ai-details`);
    const toggleButton = document.querySelector(`#${braindumpId}-ai-details`).previousElementSibling.querySelector('.braindump-ai-toggle');
    
    if (detailsElement) {
        const isVisible = detailsElement.style.display !== 'none';
        detailsElement.style.display = isVisible ? 'none' : 'block';
        
        if (toggleButton) {
            toggleButton.textContent = isVisible ? 'i' : '−';
            toggleButton.title = isVisible ? 'Meer informatie' : 'Minder informatie';
        }
    }
}



