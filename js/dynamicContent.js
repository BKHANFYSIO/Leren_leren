const baseContentPath = 'content/';

// Make fetchChapterData globally available for use in other scripts
window.fetchChapterData = async function fetchChapterData(chapterNumber) {
    // Zoek het juiste hoofdstuk in de globale 'chapters' array
    const chapterInfo = chapters.find(c => c.section === chapterNumber);

    if (!chapterInfo) {
        console.error(`Informatie voor hoofdstuk ${chapterNumber} niet gevonden in de globale configuratie.`);
        console.error(`Available chapters:`, chapters.map(c => ({section: c.section, file: c.file})));
        return null;
    }

    const filePath = `${baseContentPath}${chapterInfo.file}`;

    try {
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching chapter data:', error);
        const errorContainer = document.getElementById(`hoofdstuk${chapterNumber}-error`);
        if (errorContainer) {
            errorContainer.innerHTML = `<p class="error-message">Kon hoofdstuk ${chapterNumber} data niet laden. Controleer het pad en de bestandsnaam: ${filePath}</p>`;
        }
        return null;
    }
}

function renderChapter(chapterNumber, data) {
    if (!data) {
        // If it's the final chapter and data is null, it might be because hoofdstuk_afsluiting.json is missing
        // or there was an issue fetching it. The error message in fetchChapterData should cover this.
        console.error(`No data provided for chapter ${chapterNumber}`);
        const mainContentContainer = document.getElementById(`section${chapterNumber}-content-container`);
        if (mainContentContainer) {
             mainContentContainer.innerHTML = `<p class="error-message">Inhoud voor dit hoofdstuk (section ${chapterNumber}) kon niet geladen worden. Controleer of het JSON-bestand (mogelijk hoofdstuk_afsluiting.json) bestaat en correct is.</p>`;
        }
        return;
    }

    const mainContentContainer = document.getElementById(`section${chapterNumber}-content-container`);
    if (!mainContentContainer) {
        console.error(`Main content container not found for section${chapterNumber}`);
        return;
    }
    mainContentContainer.innerHTML = ''; // Clear previous content

    // Update chapter title in the main section if it's part of JSON and not static
    // Example: const sectionTitleElement = document.querySelector(`#section${chapterNumber} > h2`);
    // if (sectionTitleElement && data.titel) { // Assuming 'titel' is the key in your JSON for the main chapter title
    //     sectionTitleElement.textContent = data.titel;
    // }

    let htmlContent = '';

    // Call chapter-specific rendering functions
    // Check if this is the last chapter (afsluiting)
    if (chapterNumber === totalSections) {
        // This is the afsluiting chapter, use special renderer
        htmlContent = renderAfsluitingContent(data);
    } else {
        // ALTIJD de generieke renderer gebruiken voor standaard hoofdstukken.
        htmlContent = renderGenericChapterContent(data.content, chapterNumber);
    }
    // Only set innerHTML if htmlContent is not empty. 
    // This is important for renderers like renderChapter8Content that modify existing DOM directly.
    if (htmlContent && htmlContent.trim() !== '') {
        mainContentContainer.innerHTML = htmlContent;
        // After rendering, find and generate all QR codes
        setTimeout(() => {
            if (chapterNumber === totalSections) {
                generateQRCodesForContent(data.afsluitQuizIntro.content, chapterNumber);
            } else {
                generateQRCodesForContent(data.content, chapterNumber);
            }
        }, 100);
    }



    // Initialize accordion functionality for all chapters
    initializeAccordions(chapterNumber);

    // Render interactions
    const interactionsContainer = document.getElementById(`section${chapterNumber}-interactions-container`) || mainContentContainer; // Use a dedicated container or fallback to main

    if (data.interacties && Array.isArray(data.interacties)) {
        // Toon de interactie-titel altijd, tenzij het het laatste hoofdstuk is.
        if (chapterNumber !== totalSections && data.interacties && data.interacties.length > 0) {
            const titelElement = document.createElement('h3');
            titelElement.className = 'interactive-header';
            titelElement.textContent = 'Interactieve opdrachten';
            interactionsContainer.appendChild(titelElement);
        }

        data.interacties.forEach(interaction => {
            // Create a unique container for each interaction if it doesn't exist
            let interactionElement = document.getElementById(`hoofdstuk${chapterNumber}-${interaction.id}`);
            if (!interactionElement) {
                interactionElement = document.createElement('div');
                interactionElement.id = `hoofdstuk${chapterNumber}-${interaction.id}`;
                interactionElement.className = `interaction-placeholder ${interaction.type}-interaction-placeholder`; // Add type-specific class
                interactionsContainer.appendChild(interactionElement);
            }
            // Pass chapterNumber to renderInteraction
            renderInteraction(interaction, chapterNumber, interactionElement);
        });
    }
}

// Initialize accordion functionality for all accordions in a chapter
function initializeAccordions(chapterNumber) {
    setTimeout(() => {
        const accordionToggles = document.querySelectorAll(`#section${chapterNumber} .accordion-toggle`);
        accordionToggles.forEach(toggle => {
            const targetId = toggle.getAttribute('data-accordion-target');
            const contentDiv = document.getElementById(targetId);
            
            if (contentDiv) {
                toggle.addEventListener('click', function() {
                    const isOpen = contentDiv.classList.toggle('open');
                    toggle.classList.toggle('open', isOpen);
                    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                    const triangle = toggle.querySelector('.triangle');
                    if (triangle) {
                        triangle.innerHTML = isOpen ? '&#9660;' : '&#9654;';
                    }
                });
            }
        });
    }, 100);
}

// renderInteraction now accepts chapterNumber and the direct container element
// Make renderInteraction globally available for use in other scripts
window.renderInteraction = function renderInteraction(interactionData, chapterNumber, container) {
    container.innerHTML = ''; // Clear existing content
    let interactionHTML = '';
    switch (interactionData.type) {
        case 'reflection':
            interactionHTML = renderReflectionInteraction(interactionData, chapterNumber);
            break;
        case 'mc':
            interactionHTML = renderMCInteraction(interactionData, chapterNumber);
            break;
        case 'dragdrop':
            interactionHTML = renderDragDropInteraction(interactionData, chapterNumber);
            break;
        case 'selfassessment':
            interactionHTML = renderSelfAssessmentInteraction(interactionData, chapterNumber);
            break;
        case 'critical_analysis':
            interactionHTML = renderCriticalAnalysisInteraction(interactionData, chapterNumber);
            break;
        case 'flashcard':
            interactionHTML = renderFlashcardContent(interactionData, chapterNumber);
            break;
        case 'braindump':
            interactionHTML = renderBraindumpInteraction(interactionData, chapterNumber);
            break;
        default:
            interactionHTML = `<p>Onbekend interactie type: ${interactionData.type}</p>`;
            console.warn(`Unknown interaction type: ${interactionData.type}`);
    }
    container.innerHTML = interactionHTML;

    // If the interaction was drag and drop, initialize it
    if (interactionData.type === 'dragdrop') {
        if (typeof initializeSpecificDragDrop === 'function') {
            initializeSpecificDragDrop(container.id, chapterNumber, interactionData.id, interactionData.correctCombinations || {});
        } else {
            console.error('initializeSpecificDragDrop function not found in js/script.js');
        }
    } else if (interactionData.type === 'mc') {
        // If the interaction was multiple choice, initialize its event listeners
        if (typeof initializeMCInteraction === 'function') {
            initializeMCInteraction(container.id, interactionData, chapterNumber);
        } else {
            console.error('initializeMCInteraction function not found in js/script.js');
        }
    } else if (interactionData.type === 'flashcard') {
        initializeFlashcardInteraction(interactionData, chapterNumber);
    } else if (interactionData.type === 'braindump') {
        if (typeof initializeBraindumpInteraction === 'function') {
            // Call async function without await to not block rendering
            initializeBraindumpInteraction(container.id, interactionData, chapterNumber).catch(error => {
                console.error('Error initializing braindump interaction:', error);
            });
        } else {
            console.error('initializeBraindumpInteraction function not found in js/script.js');
        }
    } else if (interactionData.type === 'reflection') {
        if (typeof initializeReflectionInteraction === 'function') {
            initializeReflectionInteraction(container.id, interactionData);
        } else {
            console.error('initializeReflectionInteraction function not found in js/script.js');
        }
    }
}

// Pass chapterNumber to renderReflectionInteraction
function renderReflectionInteraction(interactionData, chapterNumber) {
    const minLength = interactionData.minLength || 10;
    const maxLength = interactionData.maxLength || 1500;
    const placeholder = interactionData.placeholder || `Typ hier je antwoord (minimaal ${minLength}, maximaal ${maxLength} tekens)`;
    const iconSvg = '<svg viewBox="0 0 24 24" class="icon"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path></svg>';
    const blockTitle = "Reflectie";

    const storageKey = `reflection_${chapterNumber}_${interactionData.id}_answered`;
    const savedAnswer = localStorage.getItem(storageKey) || '';
    const isSaved = !!savedAnswer;

    // Verwerk newlines in de vraagtekst voor betere opmaak
    const processedQuestion = interactionData.vraag ? interactionData.vraag.replace(/\n/g, '<br>') : 'Geen vraag gespecificeerd.';

    return `
        <div class="interactive-block">
            <div class="interactive-block-header">
                ${iconSvg}
                <h4>${blockTitle}</h4>
            </div>
            <div class="interactive-block-content">
                <div class="reflection-container">
                    <p class="reflection-question">${processedQuestion}</p>
                    <textarea id="${interactionData.id}-input" 
                              class="reflection-input" 
                              minlength="${minLength}" 
                              maxlength="${maxLength}" 
                              placeholder="${placeholder}">${savedAnswer}</textarea>
                    <div class="reflection-footer">
                        <button class="btn btn-save-reflection${isSaved ? ' btn-opgeslagen' : ''}" onclick="saveReflection(${chapterNumber}, '${interactionData.id}')" ${isSaved ? 'disabled' : ''}>${isSaved ? 'Opgeslagen' : 'Opslaan'}</button>
                        <span id="${interactionData.id}-counter" class="char-counter"></span>
                    </div>
                    <div id="feedback-${chapterNumber}-${interactionData.id}" class="feedback-message"></div>
                </div>
            </div>
        </div>
    `;
}

// Pass chapterNumber to renderMCInteraction
function renderMCInteraction(interactionData, chapterNumber) {
    let optionsHtml = '';
    const storageKeyAnswered = `mc_${chapterNumber}_${interactionData.id}_answered`;
    const isSaved = localStorage.getItem(storageKeyAnswered) === 'true';

    let savedSelectionIndex = -1;
    let wasCorrect = false;

    if (isSaved) {
        const selectedIndexStr = localStorage.getItem(`mc_${chapterNumber}_${interactionData.id}_selected`);
        if (selectedIndexStr !== null) {
            savedSelectionIndex = parseInt(selectedIndexStr, 10);
        }
        wasCorrect = localStorage.getItem(`mc_${chapterNumber}_${interactionData.id}_correct`) === '1';
    }

    if (interactionData.options && Array.isArray(interactionData.options)) {
        optionsHtml = '<ul class="mc-options">';
        interactionData.options.forEach((option, index) => {
            let optionClasses = 'mc-option';
            if (isSaved) {
                optionClasses += ' disabled';
                if (index === savedSelectionIndex) {
                    optionClasses += ' selected';
                    optionClasses += wasCorrect ? ' correct' : ' incorrect';
                }
            }
            optionsHtml += `<li class="${optionClasses}" data-id="${index}">${option}</li>`;
        });
        optionsHtml += '</ul>';
    }

    const iconSvg = '<svg viewBox="0 0 24 24" class="icon"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>';
    const blockTitle = "Meerkeuze Vraag";
    const specificQuestionTitle = interactionData.titel ? `<h5 class="interaction-title">${interactionData.titel}</h5>` : '';
    
    let feedbackHtml = '';
    if(isSaved) {
        let feedbackText = '';
        if (interactionData.feedbackCorrect && interactionData.feedbackIncorrect) {
            feedbackText = wasCorrect ? interactionData.feedbackCorrect : interactionData.feedbackIncorrect;
        } else if (interactionData.feedback) {
            feedbackText = interactionData.feedback;
        }
        feedbackHtml = `<div id="feedback-${interactionData.id}" class="feedback ${wasCorrect ? 'correct' : 'incorrect'}">${feedbackText || ''}</div>`;
    } else {
        feedbackHtml = `<div id="feedback-${interactionData.id}" class="feedback"></div>`;
    }

    return `
        <div class="interactive-block">
            <div class="interactive-block-header">
                ${iconSvg}
                <h4>${blockTitle}</h4>
            </div>
            <div class="interactive-block-content">
                <div class="mc-interaction mc-question${isSaved ? ' answered' : ''}" id="mc-${interactionData.id}"> 
                    ${specificQuestionTitle}
                    <p class="interaction-question">${interactionData.vraag || 'Geen vraag gespecificeerd.'}</p>
                    ${optionsHtml}
                    ${feedbackHtml}
                </div>
            </div>
        </div>
    `;
}

// Pass chapterNumber to renderDragDropInteraction
function renderDragDropInteraction(interactionData, chapterNumber) {
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
    const storageKeyCorrect = `dragdrop_${chapterNumber}_${interactionData.id}_correct`;
    const storageKeyState = `dragdrop_${chapterNumber}_${interactionData.id}_state`;
    const isSavedCorrectly = localStorage.getItem(storageKeyCorrect) === 'true';
    let savedState = null;
    if (isSavedCorrectly) {
        try {
            savedState = JSON.parse(localStorage.getItem(storageKeyState));
        } catch (e) {
            console.error('Error parsing saved drag & drop state:', e);
            localStorage.removeItem(storageKeyCorrect);
            localStorage.removeItem(storageKeyState);
        }
    }

    let itemsHtml = '<div class="drag-container">';
    let items = interactionData.items && Array.isArray(interactionData.items) ? [...interactionData.items] : [];
    
    if (!savedState) {
        items = shuffle(items);
        items.forEach(item => {
            itemsHtml += `<div class="draggable" draggable="true" data-id="${item.id}"${isSavedCorrectly ? ' style="pointer-events:none;opacity:0.6;"' : ''}>${item.label}</div>`;
        });
    } else {
        const placedItemIds = savedState.map(s => s.itemId);
        items.filter(item => !placedItemIds.includes(item.id)).forEach(item => {
             itemsHtml += `<div class="draggable" draggable="${!isSavedCorrectly}" data-id="${item.id}"${isSavedCorrectly ? ' style="pointer-events:none;opacity:0.6;"' : ''}>${item.label}</div>`;
        });
    }
    itemsHtml += '</div>';

    let targetsHtml = '<div class="drop-targets">';
    if (interactionData.targets && Array.isArray(interactionData.targets)) {
        interactionData.targets.forEach(target => {
            let droppedItemHtml = '';
            if (savedState) {
                const stateForItemInTarget = savedState.find(s => s.targetId === target.id);
                if (stateForItemInTarget) {
                    const itemData = interactionData.items.find(i => i.id === stateForItemInTarget.itemId);
                    if (itemData) {
                        droppedItemHtml = `<div class="draggable correct" draggable="false" data-id="${itemData.id}" style="pointer-events:none;opacity:0.6;">${itemData.label}</div>`;
                    }
                }
            }
            targetsHtml += `
                <div class="drop-target" data-id="${target.id}">
                    <h5>${target.label}</h5>
                    <div class="dropped-items-container">${droppedItemHtml}</div> 
                </div>`;
        });
    }
    targetsHtml += '</div>';

    const containerId = `hoofdstuk${chapterNumber}-${interactionData.id}`;
    const iconSvg = '<svg viewBox="0 0 24 24" class="icon"><path d="M16 6l4 4-4 4-4-4 4-4zm0 8l4 4-4 4-4-4 4-4zM8 6l4 4-4 4-4-4 4-4zm0 8l4 4-4 4-4-4 4-4z"></path></svg>';
    const blockTitle = "Drag & Drop";
    const specificQuestionTitle = interactionData.vraag ? `<h5 class="interaction-title">${interactionData.vraag}</h5>` : '<h5 class="interaction-title">Drag & Drop Opdracht</h5>';
    const feedbackText = isSavedCorrectly && interactionData && interactionData.feedbackCorrect ? interactionData.feedbackCorrect : '';
    const feedbackClass = isSavedCorrectly ? 'correct' : '';

    return `
        <div class="interactive-block">
            <div class="interactive-block-header">
                ${iconSvg}
                <h4>${blockTitle}</h4>
            </div>
            <div class="interactive-block-content">
                <div class="interactive-exercise${isSavedCorrectly ? ' answered' : ''}" data-dragdrop-id="${interactionData.id}" data-initial-items='${JSON.stringify(interactionData.items)}' data-section-number="${chapterNumber}">
                    ${specificQuestionTitle}
                    ${itemsHtml}
                    ${targetsHtml}
                    <div class="dragdrop-feedback ${feedbackClass}" id="feedback-${chapterNumber}-${interactionData.id}">${feedbackText}</div>
                    <div class="dragdrop-buttons">
                        <button class="btn btn-check-dragdrop${isSavedCorrectly ? ' btn-opgeslagen' : ''}" onclick="checkDragDrop('${containerId}', ${chapterNumber}, '${interactionData.id}')"${isSavedCorrectly ? ' disabled' : ''}>${isSavedCorrectly ? 'Opgeslagen' : 'Controleer'}</button>
                        <button class="btn btn-reset-dragdrop" onclick="resetDragDrop(${chapterNumber}, '${interactionData.id}', '${containerId}')" style="display:${isSavedCorrectly ? 'none' : 'none'};">Reset</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Pass chapterNumber to renderSelfAssessmentInteraction
function renderSelfAssessmentInteraction(interactionData, chapterNumber) {
    const selfAssessmentId = interactionData.id;
    const storageKey = `selfassessment_${chapterNumber}_${selfAssessmentId}_done`;
    const isSaved = !!localStorage.getItem(storageKey);
    let savedData = {};
    if (isSaved) {
        try { savedData = JSON.parse(localStorage.getItem(storageKey)); } catch {}
    }

    // Gebruik criteria uit JSON data, of fallback naar oude hardcoded waarden
    const criteria = interactionData.criteria || [
        { item: 'Veranderen', schaal: '1 = Beginnend, 3 = Bekwaam' },
        { item: 'Vinden', schaal: '1 = Beginnend, 3 = Bekwaam' },
        { item: 'Vertrouwen', schaal: '1 = Beginnend, 3 = Bekwaam' },
        { item: 'Vaardig gebruiken', schaal: '1 = Beginnend, 3 = Bekwaam' },
        { item: 'Vertellen', schaal: '1 = Beginnend, 3 = Bekwaam' }
    ];

    // Bepaal schaal op basis van eerste criterium (alle criteria gebruiken dezelfde schaal)
    const schaalTekst = criteria.length > 0 ? criteria[0].schaal : '1 = Beginnend, 3 = Bekwaam';
    
    // Parse schaal om aantal opties en labels te bepalen
    const schaalParts = schaalTekst.split(',').map(part => part.trim());
    const schaalOptions = [];
    const schaalLabels = [];
    
    // Parse alle opties met labels
    const optieMatches = [];
    schaalParts.forEach(part => {
        const match = part.match(/^(\d+)\s*=\s*(.+)$/);
        if (match) {
            optieMatches.push({ nummer: parseInt(match[1]), label: match[2] });
        }
    });

    if (optieMatches.length >= 2) {
        // Sorteer opties op nummer om juiste volgorde te garanderen
        optieMatches.sort((a, b) => a.nummer - b.nummer);
        
        // Gebruik alle gevonden opties met hun labels
        optieMatches.forEach(match => {
            schaalOptions.push(match.nummer.toString());
            schaalLabels.push(`${match.nummer} = ${match.label}`);
        });
    } else {
        // Fallback als parsing mislukt
        schaalOptions.push('1', '2', '3');
        schaalLabels.push('1 = Beginnend', '2 = In ontwikkeling', '3 = Bekwaam');
    }

    let competencesHtml = '';
    criteria.forEach(criterium => {
        const item = criterium.item;
        const cleanItemId = item.toLowerCase().replace(/[^a-z0-9]/g, '');
        const selectId = `${cleanItemId}-${chapterNumber}-${selfAssessmentId}`;
        
        // Genereer opties dynamisch
        const optionsHtml = schaalOptions.map(value => {
            const isSelected = isSaved && savedData[cleanItemId] === value;
            const optionText = schaalLabels.find(label => label.startsWith(value)) || `${value}`;
            return `<option value="${value}"${isSelected ? ' selected' : ''}>${optionText}</option>`;
        }).join('');
        
        competencesHtml += `
        <div class="assessment-item">
          <label for="${selectId}">${item}:</label>
          <select id="${selectId}" class="assessment-select"${isSaved ? ' disabled' : ''}>
            <option value="">Kies een niveau</option>
            ${optionsHtml}
          </select>
        </div>`;
    });

    // Genereer dynamische assessment-scale
    const assessmentScaleHtml = schaalLabels.map(label => `<span>${label}</span>`).join('');

    const iconSvg = '<svg viewBox="0 0 24 24" class="icon"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zM8 8a4 4 0 118 0 4 4 0 01-8 0zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm10-5h-4v2h4v-2zm0-4h-4v2h4V7zm0-4h-4v2h4V3z"></path></svg>';
    const blockTitle = interactionData.titel || "Zelfevaluatie";
    const specificQuestionTitle = interactionData.vraag ? `<h5 class="interaction-title">${interactionData.vraag}</h5>` : '<h5 class="interaction-title">Zelfevaluatie Digitale Competenties</h5>';
    
    return `
        <div class="interactive-block">
            <div class="interactive-block-header">
                ${iconSvg}
                <h4>${blockTitle}</h4>
            </div>
            <div class="interactive-block-content">
                <div class="competency-assessment selfassessment-interaction">
                    ${specificQuestionTitle}
                    <div class="assessment-scale">
                        ${assessmentScaleHtml}
                    </div>
                    <div class="assessment-grid">
                        ${competencesHtml}
                    </div>
                    <button class="btn${isSaved ? ' btn-opgeslagen' : ''}" onclick="saveSelfAssessment(${chapterNumber}, '${selfAssessmentId}')"${isSaved ? ' disabled' : ''}>${isSaved ? 'Opgeslagen' : 'Opslaan'}</button>
                    <div id="feedback-${chapterNumber}-${selfAssessmentId}" class="feedback-message"></div>
                </div>
            </div>
        </div>
    `;
}

function renderCriticalAnalysisInteraction(interactionData, chapterNumber) {
    const storageKey = `critical_analysis_${chapterNumber}_${interactionData.id}_answered`;
    const isSaved = !!localStorage.getItem(storageKey);
    let savedData = {};
    if (isSaved) {
        try { 
            savedData = JSON.parse(localStorage.getItem(storageKey)); 
        } catch (e) {
            console.error('Error parsing saved critical analysis data:', e);
        }
    }
    const dropdownOptions = (interactionData.dropdown || []).map(opt => `<option value="${opt.replace(/"/g, '&quot;')}"${isSaved && savedData.technologie===opt ? ' selected' : ''}>${opt}</option>`).join('');
    const vragenHtml = (interactionData.vragen || []).map(v => {
        const savedValue = isSaved && savedData[v.id] ? savedData[v.id].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
        return `
      <div class="form-group">
        <label for="${v.id}-input">${v.vraag}</label>
        <textarea id="${v.id}-input" class="critical-analysis-input form-control" rows="3"${isSaved ? ' readonly' : ''}>${savedValue}</textarea>
      </div>
    `;
    }).join('');
    const iconSvg = '<svg viewBox="0 0 24 24" class="icon"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>';
    const blockTitle = "Kritische Analyse";
    
    // Verwerk markdown in de vraagtekst
    let processedQuestion = '';
    if (interactionData.vraag) {
        processedQuestion = interactionData.vraag
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Zet **text** om naar <strong>text</strong>
            .replace(/\n/g, '<br>'); // Zet newline karakters om naar <br>
    }
    const specificQuestionPrompt = processedQuestion ? `<p class="interaction-question">${processedQuestion}</p>` : '';

    return `
        <div class="interactive-block">
            <div class="interactive-block-header">
                ${iconSvg}
                <h4>${blockTitle}</h4>
            </div>
            <div class="interactive-block-content">
                <div class="critical-analysis-container">
                    ${specificQuestionPrompt}
                    <div class="form-group">
                        <label for="critical-analysis-select">Selecteer een prompt:</label>
                        <select id="critical-analysis-select" class="form-control"${isSaved ? ' disabled' : ''}>
                          <option value="">-- Maak een keuze --</option>
                          ${dropdownOptions}
                        </select>
                    </div>
                    ${vragenHtml}
                    <button class="btn left-align-btn${isSaved ? ' btn-opgeslagen' : ''}" onclick="saveCriticalAnalysis(${chapterNumber}, '${interactionData.id}')" ${isSaved ? ' disabled' : ''}>${isSaved ? 'Opgeslagen' : (interactionData.opslaanLabel || 'Opslaan')}</button>
                    <div id="feedback-${chapterNumber}-${interactionData.id}" class="feedback-message"></div>
                </div>
            </div>
        </div>
    `;
}

// Global function to load content for the currently active section
// This function will be called by your existing navigation logic (nextSection, prevSection, sidebar click)
async function loadContentForSection(sectionNumber) {
    // Check if section number is valid (between 1 and totalSections)
    if (sectionNumber >= 1 && sectionNumber <= totalSections) {
        const data = await fetchChapterData(sectionNumber);
        if (data) {
            renderChapter(sectionNumber, data);
            // If your existing script.js has a function to initialize interactions after content load, call it here.
            // e.g., if (typeof initializeSectionInteractions === 'function') { initializeSectionInteractions(sectionNumber); }
        } else {
            const mainContentContainer = document.getElementById(`section${sectionNumber}-content-container`);
            if (mainContentContainer) {
                 mainContentContainer.innerHTML = `<p class="error-message">Inhoud voor dit hoofdstuk kon niet geladen worden.</p>`;
            }
        }
    }
}

// Example of how your script.js might call this:
// When a section becomes active:
// currentSection = newSectionNumber;
// loadContentForSection(currentSection);

// Initial load for the first active section (assuming section 1 is active on page load)
// This needs to be coordinated with how your existing script.js determines the initial active section.
// document.addEventListener('DOMContentLoaded', () => {
//     const initiallyActiveSection = document.querySelector('.section.active');
//     if (initiallyActiveSection) {
//         const sectionNumber = parseInt(initiallyActiveSection.dataset.section, 10);
//         if (!isNaN(sectionNumber)) {
//             loadContentForSection(sectionNumber);
//         }
//     }
// });

devLog('dynamicContent.js loaded');

// Generic chapter renderer for chapters without specific render functions
function renderGenericChapterContent(content, chapterNumber, parentBlockId = '') {
    let html = '';
    // De content voor de generieke renderer is nu een array
    if (!Array.isArray(content)) {
        console.error('Content for generic renderer is not an array for chapter', chapterNumber);
        return '<p>Content-formaat is onjuist voor dit hoofdstuk.</p>';
    }

    const createListHtml = (itemsArray, listClass = 'points-list') => {
        if (!Array.isArray(itemsArray) || itemsArray.length === 0) return '';
        let listHtml = `<ul class="${listClass}">`;
        itemsArray.forEach(item => {
            if (typeof item === 'string') {
                listHtml += `<li>${item}</li>`;
            } else if (typeof item === 'object' && item.tekst) {
                listHtml += `<li><strong>${item.titel}:</strong> ${item.tekst}</li>`;
            }
        });
        listHtml += '</ul>';
        return listHtml;
    };

    content.forEach((block, blockIndex) => {
        const currentBlockId = `${parentBlockId}block${blockIndex}`;
        if (!block || !block.type) return;

        switch (block.type) {
            case 'divider':
                html += '<hr class="component-divider">';
                break;
            case 'info-card':
                let cardContentHtml = '';
                
                // Handle 'tekst' property
                if (block.tekst) {
                    cardContentHtml += `<p>${block.tekst.replace(/\n/g, '<br>')}</p>`;
                }

                // Handle 'items' array
                if (block.items && Array.isArray(block.items)) {
                    cardContentHtml += `<ul class="points-list">`;
                    block.items.forEach(item => {
                        if (item.titel && item.tekst) {
                            cardContentHtml += `<li><strong>${item.titel}:</strong> ${item.tekst}</li>`;
                        } else if (item.letter && item.beschrijving) { // For R.O.C.K. card
                            cardContentHtml += `<li><strong>${item.letter}:</strong> ${item.beschrijving}</li>`;
                        } else if (typeof item === 'string') {
                            cardContentHtml += `<li>${item}</li>`;
                        }
                    });
                    cardContentHtml += `</ul>`;
                }

                // Handle 'andere_valkuilen' object
                if (block.andere_valkuilen && typeof block.andere_valkuilen === 'object') {
                    if (block.andere_valkuilen.titel) {
                        cardContentHtml += `<h5 class="info-card-subtitle">${block.andere_valkuilen.titel}</h5>`;
                    }
                    if (block.andere_valkuilen.items && Array.isArray(block.andere_valkuilen.items)) {
                        cardContentHtml += `<ul class="points-list">`;
                        block.andere_valkuilen.items.forEach(item => {
                            if (item.titel && item.tekst) {
                                cardContentHtml += `<li><strong>${item.titel}:</strong> ${item.tekst}</li>`;
                            }
                        });
                        cardContentHtml += `</ul>`;
                    }
                    if (block.andere_valkuilen.afsluitende_tekst) {
                        cardContentHtml += `<p class="info-card-footer-text">${block.andere_valkuilen.afsluitende_tekst}</p>`;
                    }
                }

                // Recursief renderen van geneste content
                if (block.content && Array.isArray(block.content)) {
                    cardContentHtml += renderGenericChapterContent(block.content, chapterNumber, `${currentBlockId}-`);
                }

                html += `
                    <div class="info-card ${block.classes || ''}">
                        ${block.titel ? `<h4 class="info-card-title">${block.titel}</h4>` : ''}
                        <div class="info-card-content">
                            ${cardContentHtml}
                        </div>
                    </div>
                `;
                break;
            case 'section-title':
                // Helper function to create a URL-friendly slug from a title
                const createSlug = (text) => {
                    if (!text) return '';
                    return text.toLowerCase()
                        .replace(/&/g, 'en') // Replace & with 'en'
                        .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
                        .trim() // Trim whitespace from start and end
                        .replace(/\s+/g, '-') // Replace spaces with -
                        .replace(/--+/g, '-'); // Replace multiple - with single -
                };
                const id = createSlug(block.titel);
                html += `<h2 class="section-title" id="${id}">${block.titel}</h2>`;
                break;
            case 'content-subtitle':
                html += `<h3 class="content-subtitle">${block.titel}</h3>`;
                break;
            case 'content-text':
                html += `<p class="content-text">${block.tekst.replace(/\n/g, '<br>')}</p>`;
                break;
            case 'scenario-container-horizontal':
                 html += `<div class="scenario-container-horizontal">`;
                 block.scenarios.forEach(scenario => {
                     html += `
                         <div class="info-card scenario-card">
                             <h4>${scenario.titel || ''}</h4>
                             <p>${scenario.beschrijving ? scenario.beschrijving.replace(/\n/g, '<br>') : ''}</p>
                             ${scenario.punten && scenario.punten.length > 0 ? `<ul>${scenario.punten.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
                             ${scenario.conclusie ? `<p class="conclusie"><strong>${scenario.conclusie.replace(/\n/g, '<br>')}</strong></p>` : ''}
                         </div>`;
                 });
                 html += `</div>`;
                 break;
            case 'dual-content-block':
                html += `<div class="dual-content-container">`;
                
                // Nieuwe flexibele structuur: content_left en content_right
                if (block.content_left || block.content_right) {
                    if (block.content_left) {
                        html += `<div class="content-block left-content">`;
                        if (Array.isArray(block.content_left)) {
                            html += renderGenericChapterContent(block.content_left, chapterNumber, `${currentBlockId}-left-`);
                        } else if (block.content_left.type) {
                            html += renderGenericChapterContent([block.content_left], chapterNumber, `${currentBlockId}-left-`);
                        } else if (block.content_left.tekst) {
                            // Legacy support voor oude tekststructuur
                            html += `<p>${block.content_left.tekst.replace(/\n/g, '<br>')}</p>`;
                        }
                        html += `</div>`;
                    }
                    
                    if (block.content_right) {
                        html += `<div class="content-block right-content">`;
                        if (Array.isArray(block.content_right)) {
                            html += renderGenericChapterContent(block.content_right, chapterNumber, `${currentBlockId}-right-`);
                        } else if (block.content_right.type) {
                            html += renderGenericChapterContent([block.content_right], chapterNumber, `${currentBlockId}-right-`);
                        } else if (block.content_right.tekst) {
                            // Legacy support voor oude tekststructuur
                            html += `<p>${block.content_right.tekst.replace(/\n/g, '<br>')}</p>`;
                        }
                        html += `</div>`;
                    }
                } else if (block.blokken) {
                    // Legacy support: oude structuur met blokken array
                    block.blokken.forEach(b => {
                        html += `
                            <div class="content-block info-card ${b.type}-block">
                                ${b.titel ? `<h4 class="section-subtitle block-title">${b.titel}</h4>` : ''}
                                ${b.tekst_voor_statistiek ? `<p>${b.tekst_voor_statistiek}</p>` : ''}
                                ${b.focus_tekst ? `<p class="focus-text"><strong>${b.focus_tekst}</strong></p>` : ''}
                                ${b.tekst_na_statistiek ? `<p>${b.tekst_na_statistiek}</p>` : ''}
                                ${b.tekst && b.type === 'fun_fact' ? `<p>${b.tekst.replace(/\n/g, '<br>')}</p>`: ''}
                            </div>
                        `;
                    });
                }
                
                html += `</div>`;
                break;
            case 'accent-blok':
                let bronHtml = '';
                if (block.bron) {
                    if (block.bron.url) {
                        bronHtml = `<a href="${block.bron.url}" target="_blank" class="accent-blok-bron">${block.bron.naam}</a>`;
                    } else {
                        bronHtml = `<span class="accent-blok-bron">${block.bron.naam}</span>`;
                    }
                }
                html += `
                    <div class="accent-blok accent-blok--${block.variant || 'default'}">
                        ${block.titel ? `<h4 class="accent-blok-titel">${block.titel}</h4>` : ''}
                        <div class="accent-blok-content">
                            <p>${block.tekst}</p>
                            ${bronHtml ? `<footer class="accent-blok-footer">${bronHtml}</footer>` : ''}
                        </div>
                    </div>
                `;
                break;
            case 'ethical-reflection-grid':
                html += `<div class="ethical-reflection-grid">`;
                block.kaarten.forEach(kaart => {
                    html += `
                        <div class="ethical-card">
                            ${kaart.titel ? `<h4>${kaart.titel}</h4>` : ''}
                            ${kaart.beschrijving ? `<p>${kaart.beschrijving.replace(/\n/g, '<br>')}</p>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
                break;

             case 'process-flow':
                    html += `
                        <div class="process-flow-container">
                            <h3 class="process-flow-title">${block.titel}</h3>
                            <div class="process-flow">
                                ${block.items.map(item => `
                                    <div class="process-flow-item">
                                        <div class="process-flow-year">${item.stap}</div>
                                        <div class="process-flow-content">
                                            <h4>${item.titel}</h4>
                                            <p>${item.beschrijving}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                    break;
            case 'video-grid':
                const kolommenClass = block.kolommen === 2 ? 'video-grid-container-2-col' : 'video-grid-container-3-col';
                html += `
                    ${block.titel ? `<h3 class="section-title">${block.titel}</h3>` : ''}
                    <div class="video-grid-container ${kolommenClass}">
                        ${block.items.map(item => {
                            let embedUrl = '';
                            if (item.link && item.link.includes('youtu')) {
                                const match = item.link.match(/(?:youtu.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
                                if (match && match[1]) {
                                    embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                                }
                            }
                            const metaHtml = (item.bron || item.duur) ? `<div class="video-meta">${[item.bron, item.duur].filter(Boolean).join(' | ')}</div>` : '';

                            return `
                                <div class="video-grid-item">
                                    ${embedUrl ? `<div class='video-wrapper'><iframe src='${embedUrl}' title='${item.titel}' allowfullscreen></iframe></div>` : ''}
                                    <p class="video-title">${item.titel}</p>
                                    <p>${item.beschrijving}</p>
                                    ${metaHtml}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                break;
            case 'audio-grid':
                const audioKolommenClass = block.kolommen === 1 ? 'audio-grid-container-1-col' : 
                                          block.kolommen === 2 ? 'audio-grid-container-2-col' : 'audio-grid-container-3-col';
                html += `
                    ${block.titel ? `<h3 class="section-title">${block.titel}</h3>` : ''}
                    <div class="audio-grid-container ${audioKolommenClass}">
                        ${block.items.map(item => {
                            const metaHtml = (item.bron || item.duur) ? `<div class="audio-meta">${[item.bron, item.duur].filter(Boolean).join(' | ')}</div>` : '';

                            return `
                                <div class="audio-grid-item">
                                    <h4 class="audio-title">${item.titel}</h4>
                                    <p>${item.beschrijving}</p>
                                    <div class="audio-player">
                                        <audio controls>
                                            <source src="${item.bron}" type="audio/wav">
                                            Je browser ondersteunt geen audio element.
                                        </audio>
                                    </div>
                                    ${metaHtml}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                break;
            case 'info-card-list':
                html += `
                    <div class="info-card">
                        <h4 class="info-card-title">${block.titel}</h4>
                        <div class="info-card-content">
                            <p>${block.inhoud.replace(/\n/g, '<br>')}</p>
                            <ul class="points-list">
                                ${block.lijst.map(item => `
                                    <li><strong>${item.titel}:</strong> ${item.tekst}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;
                break;
            case 'benefits-grid':
                if (block.titel) {
                    html += `<h3 class="grid-title">${block.titel}</h3>`;
                }
                html += `<div class="benefits-grid ${block.classes || ''}">`;
                html += block.items.map(item => `
                    <div class="benefit-card ${item.classes || ''}">
                        <h3>
                            ${item.icoon ? `<img src="images/icons/${item.icoon}.svg" class="icon" alt="">` : ''}
                            ${item.titel}
                        </h3>
                        <div class="benefit-content">
                            <p>${item.tekst || item.beschrijving}</p>
                        </div>
                    </div>
                `).join('');
                html += '</div>';
                break;
            case 'card-grid':
                html += `<div class="benefits-grid">`;
                block.items.forEach(item => {
                    html += `
                        <div class="benefit-card">
                            <h3>${item.titel || ''}</h3>
                            <div class="benefit-content">
                                <p>${item.beschrijving || ''}</p>
                                ${item.voorbeeld ? `
                                    <div class="example-box">
                                        <h4>${item.voorbeeld.titel || 'Voorbeeld'}</h4>
                                        <p>${item.voorbeeld.tekst || ''}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                break;
            case 'competency-grid':
                html += `
                    <section class="competency-section">
                        ${block.titel ? `<h3 class="content-subtitle">${block.titel}</h3>` : ''}
                        <p>${block.intro || ''}</p>
                        <div class="competency-grid">
                            ${block.termen.map(term => `
                                <div class="competency-card">
                                    <h4>${term.term}</h4>
                                    <p>${term.uitleg}</p>
                                    <div class="example-box"><p>${term.praktisch}</p></div>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                `;
                break;
            case 'resource-grid-container':
                const gridId = `ch${chapterNumber}-${currentBlockId}`;
                html += `
                    <div class="tech-resources">
                        ${block.titel ? `<h3>${block.titel}</h3>` : ''}
                        <div class="resource-grid">
                            ${block.items.map((item, itemIndex) => {
                                const qrId = `qr-${gridId}-item${itemIndex}`;
                                return `
                                <div class="resource-card">
                                    ${item.logo ? `<img src="${item.logo}" alt="${item.titel} Logo" class="resource-logo">` : ''}
                                    <h4>${item.titel}</h4>
                                    <p>${item.beschrijving}</p>
                                    ${item.link ? `<div id="${qrId}" class="qr-code-container"></div>` : ''}
                                    ${item.link ? `<a href="${item.link}" class="btn" target="_blank">Bezoek platform</a>` : ''}
                                </div>
                                `
                            }).join('')}
                        </div>
                    </div>
                `;
                
                // Generate QR codes after the HTML is rendered
                setTimeout(() => {
                    block.items.forEach((item, itemIndex) => {
                        if (item.link) {
                            const qrId = `qr-${gridId}-item${itemIndex}`;
                            const qrContainer = document.getElementById(qrId);
                            if (qrContainer) {
                                // Clear container first to avoid duplicates on re-render
                                qrContainer.innerHTML = '';
                                new QRCode(qrContainer, {
                                    text: item.link,
                                    width: 128,
                                    height: 128,
                                    colorDark: "#662483", // HAN paars
                                    colorLight: "#ffffff",
                                    correctLevel: QRCode.CorrectLevel.H
                                });
                            }
                        }
                    });
                }, 100);
                break;
            case 'table-container-group':
                if (block.intro) {
                    html += `<div class="info-card"><div class="info-card-content"><p>${block.intro}</p></div></div>`;
                }
                if(block.tables) {
                    block.tables.forEach(tabel => {
                        html += `<div class="table-container">`;
                        if (tabel.titel) {
                            html += `<div class="table-title">${tabel.titel}</div>`;
                        }
                        html += `<table class="content-table">`;
                        if (Array.isArray(tabel.headers)) {
                            html += '<thead><tr>';
                            tabel.headers.forEach(header => { html += `<th>${header}</th>`; });
                            html += '</tr></thead>';
                        }
                        if (Array.isArray(tabel.rows)) {
                            html += '<tbody>';
                            tabel.rows.forEach(row => {
                                html += '<tr>';
                                row.forEach(cell => { html += `<td>${cell}</td>`; });
                                html += '</tr>';
                            });
                            html += '</tbody>';
                        }
                        html += `</table></div>`;
                    });
                }
                 if (block.note) {
                    html += `<div class="note">${block.note}</div>`;
                }
                break;
            case 'icon-card-grid':
                 html += '<div class="icon-card-grid">';
                 block.themes.forEach(theme => {
                     // Dynamische veldnamen ondersteuning
                     let dynamicFields = '';
                     
                     // Dynamische velden via configuratie
                     if (theme.dynamische_velden && Array.isArray(theme.dynamische_velden)) {
                         theme.dynamische_velden.forEach(veld => {
                             if (theme[veld.veldnaam]) {
                                 let labelHtml = '';
                                 if (veld.label) {
                                     labelHtml = `<strong>${veld.label}:</strong> `;
                                 }
                                 dynamicFields += `<div class="icon-dynamic-field">${labelHtml}<span>${theme[veld.veldnaam]}</span></div>`;
                             }
                         });
                     }
                     
                     html += `
                        <div class="icon-card">
                            ${theme.subtitel ? `<h4 class="icon-subtitle">${theme.subtitel}</h4>` : ''}
                            ${theme.icoon ? `<div class="icon-image"><img src="${theme.icoon}" alt="${theme.titel || ''} icoon"></div>` : ''}
                            <h3>${theme.titel || ''}</h3>
                            <div class="icon-content">
                                ${dynamicFields}
                            </div>
                        </div>
                    `;
                 });
                 html += '</div>';
                 break;
            case 'image-grid':
                html += `<div class="image-grid-container columns-${block.kolommen || 3}">`;
                
                // Support beide 'items' en 'afbeeldingen' voor backward compatibility
                const images = block.items || block.afbeeldingen || [];
                
                images.forEach(img => {
                    let captionHtml = '';
                    if (img.onderschrift || img.bron) {
                        captionHtml += '<figcaption class="image-caption">';
                        if (img.onderschrift) {
                            captionHtml += `<span class="caption-text">${img.onderschrift}</span>`;
                        }
                        if (img.bron) {
                            if (img.bron.url) {
                                captionHtml += `<a href="${img.bron.url}" target="_blank" class="caption-source">${img.bron.naam}</a>`;
                            } else {
                                captionHtml += `<span class="caption-source">${img.bron.naam}</span>`;
                            }
                        }
                        captionHtml += '</figcaption>';
                    }

                    html += `
                        <figure class="image-container">
                            <img src="${img.src}" alt="${img.alt}">
                            ${captionHtml}
                        </figure>
                    `;
                });
                html += '</div>';
                break;
            case 'split-screen-image-text':
                // Support both `image` and `afbeelding` keys for backwards compatibility
                const imageData = block.image || block.afbeelding;
                const textContent = block.content || block.tekst_content;
                
                let splitCaptionHtml = '';
                if (imageData.caption || imageData.onderschrift || imageData.bron) {
                    splitCaptionHtml += '<figcaption>';
                    
                    // Handle caption field
                    if (imageData.caption) {
                        splitCaptionHtml += imageData.caption;
                    } else {
                        // Legacy support
                        if (imageData.onderschrift) {
                            splitCaptionHtml += `<span class="caption-text">${imageData.onderschrift}</span>`;
                        }
                        if (imageData.bron) {
                            if (imageData.bron.url) {
                                splitCaptionHtml += `<a href="${imageData.bron.url}" target="_blank" class="caption-source">${imageData.bron.naam}</a>`;
                            } else {
                                splitCaptionHtml += `<span class="caption-source">${imageData.bron.naam}</span>`;
                            }
                        }
                    }
                    splitCaptionHtml += '</figcaption>';
                }

                // Generate clickable class and data attributes
                const clickableClass = imageData.clickable ? 'clickable' : '';
                const clickableAttributes = imageData.clickable ? 
                    `data-popup-src="${imageData.src}" data-popup-alt="${imageData.alt || ''}" data-popup-caption="${splitCaptionHtml.replace(/"/g, '&quot;')}"` : '';

                // Process text content
                let textContentHtml = '';
                const imageIconSvg = block.tekst_content && block.tekst_content.icon_type === 'image' ? 
                    `<span class="component-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></span>` : '';

                if (block.tekst_content && typeof block.tekst_content === 'object' && block.tekst_content.paragrafen) {
                    textContentHtml += block.tekst_content.titel ? `<h3>${imageIconSvg}${block.tekst_content.titel}</h3>` : '';
                    textContentHtml += block.tekst_content.paragrafen.map(p => `<p>${p}</p>`).join('');
                } else if (Array.isArray(textContent)) { // Voor oude JSON die nog een array direct bevatte
                    textContent.forEach(item => {
                        if (typeof item === 'string') {
                            textContentHtml += `<p>${item}</p>`;
                        } else if (item.type === 'content-text') {
                            textContentHtml += `<p>${item.tekst.replace(/\n/g, '<br>')}</p>`;
                        } else {
                            // Render other content types recursively
                            textContentHtml += renderGenericChapterContent([item], chapterNumber, `${currentBlockId}-text-`);
                        }
                    });
                } else if (typeof textContent === 'string') {
                    textContentHtml = `<p>${textContent}</p>`;
                }

                html += `
                    <div class="img-split-screen ${block.classes || ''}">
                        <div class="image-content">
                            <figure class="image-container">
                                <img src="${imageData.src}" 
                                     alt="${imageData.alt || ''}" 
                                     class="${clickableClass}"
                                     ${clickableAttributes}>
                                ${splitCaptionHtml}
                            </figure>
                        </div>
                        <div class="text-content">
                            ${textContentHtml}
                        </div>
                    </div>
                `;
                break;
            case 'stats-card-grid':
                html += `<div class="stats-container">`;
                block.kaarten.forEach(kaart => {
                    let bronHtml = '';
                    if (kaart.bron) {
                        if (kaart.bron.url) {
                            bronHtml = `<a href="${kaart.bron.url}" target="_blank" class="stat-source">${kaart.bron.naam}</a>`;
                        } else {
                            bronHtml = `<span class="stat-source">${kaart.bron.naam}</span>`;
                        }
                    }

                    const isCompact = block.layout === 'compact';
                    const cardClass = isCompact ? 'stat-card--compact' : '';
                    
                    let cardContentHtml = '';
                    if(isCompact) {
                        // Compact layout HTML structure
                        cardContentHtml = `
                            <div class="stat-card-header-compact">
                                ${kaart.afbeelding ? `<div class="stat-image"><img src="${kaart.afbeelding}" alt="${kaart.titel || ''}"></div>` : ''}
                                ${kaart.titel ? `<h3 class="stat-title">${kaart.titel}</h3>` : ''}
                            </div>
                            <div class="stat-card-body-compact">
                                ${kaart.getal ? `<div class="stat-number">${kaart.getal}</div>` : ''}
                                ${kaart.label ? `<p class="stat-label">${kaart.label}</p>` : ''}
                            </div>
                        `;
                    } else {
                        // Default layout HTML structure
                        cardContentHtml = `
                            ${kaart.titel ? `<h3 class="stat-title">${kaart.titel}</h3>` : ''}
                            ${kaart.afbeelding ? `<div class="stat-image"><img src="${kaart.afbeelding}" alt="${kaart.titel || ''}"></div>` : ''}
                            ${kaart.getal ? `<div class="stat-number">${kaart.getal}</div>` : ''}
                            ${kaart.label ? `<p class="stat-label">${kaart.label}</p>` : ''}
                        `;
                    }

                    html += `
                        <div class="stat-card ${cardClass}">
                            <div class="stat-card-content">
                                ${cardContentHtml}
                            </div>
                            ${bronHtml ? `<div class="stat-card-footer">${bronHtml}</div>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
                break;
            case 'video-full-width':
                let embedUrl = '';
                if (block.link && block.link.includes('youtu')) {
                    const match = block.link.match(/(?:youtu.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
                    if (match && match[1]) {
                        embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                    }
                }
                html += `
                    <div class="video-container-full-width">
                        ${embedUrl ? `<div class='video-wrapper'><iframe src='${embedUrl}' title='${block.titel}' allowfullscreen></iframe></div>` : ''}
                        ${block.titel ? `<p class="video-title">${block.titel}</p>` : ''}
                    </div>
                `;
                break;
            case 'image-block':
                let captionHtml = '';
                if (block.onderschrift || block.bron) {
                    captionHtml += '<figcaption>';
                    if (block.onderschrift) {
                        captionHtml += `<span class="caption-text">${block.onderschrift}</span>`;
                    }
                    if (block.bron) {
                        if (block.bron.url) {
                            captionHtml += `<a href="${block.bron.url}" target="_blank" class="caption-source">${block.bron.naam}</a>`;
                        } else {
                            captionHtml += `<span class="caption-source">${block.bron.naam}</span>`;
                        }
                    }
                    captionHtml += '</figcaption>';
                }

                html += `
                    <figure class="image-container ${block.classes || ''}">
                        <img src="${block.src}" alt="${block.alt || ''}">
                        ${captionHtml}
                    </figure>
                `;
                break;
            case 'benefit-card':
                html += `
                    <div class="benefit-card">
                        <h3>${block.titel}</h3>
                        <div class="benefit-content">${block.beschrijving.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
                break;
            case 'leerdoelen-dynamic':
                // Haal leerdoelen op uit de globale config
                const leerdoelen = window.elearningConfig && Array.isArray(window.elearningConfig.leerdoelen) 
                    ? window.elearningConfig.leerdoelen 
                    : [];
                
                // Portfolio tip is optioneel en configureerbaar
                const portfolioTip = block.portfolio_tip || '';
                const footerHtml = portfolioTip ? `
                    <div class="leerdoelen-footer">
                        <p class="leerdoelen-note">
                            💡 <strong>Portfolio tip:</strong> ${portfolioTip}
                        </p>
                    </div>
                ` : '';
                
                html += `
                    <div class="leerdoelen-container">
                        <div class="leerdoelen-header">
                            <h3 class="leerdoelen-title">Na deze module kun je:</h3>
                        </div>
                        <div class="leerdoelen-grid">
                            ${leerdoelen.map((leerdoel, index) => `
                                <div class="leerdoel-item">
                                    <div class="leerdoel-checkmark">✓</div>
                                    <div class="leerdoel-content">
                                        <p>${leerdoel}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${footerHtml}
                    </div>
                `;
                break;
            case 'ethical-reflection-grid':
                html += `<div class="ethical-reflection-grid">`;
                block.kaarten.forEach(kaart => {
                    html += `
                        <div class="ethical-card">
                            ${kaart.titel ? `<h4>${kaart.titel}</h4>` : ''}
                            ${kaart.beschrijving ? `<p>${kaart.beschrijving.replace(/\n/g, '<br>')}</p>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
                break;
            case 'concept-cards':
                html += `<div class="concept-cards">`;
                block.items.forEach(item => {
                    html += `
                        <div class="concept-card">
                            ${item.titel ? `<h4>${item.titel}</h4>` : ''}
                            ${item.nederlands ? `<div class="concept-dutch">${item.nederlands}</div>` : ''}
                            ${item.uitleg ? `<p>${item.uitleg}</p>` : ''}
                            ${item.voorbeeld ? `<div class="example">${item.voorbeeld}</div>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
                break;
            case 'accordion':
                const accordionId = `accordion-${chapterNumber}-${currentBlockId}`;
                const toggleId = `accordion-toggle-${chapterNumber}-${currentBlockId}`;
                const contentId = `accordion-content-${chapterNumber}-${currentBlockId}`;
                
                let accordionContentHtml = '';
                if (block.introductie) {
                    accordionContentHtml += `<p>${block.introductie}</p>`;
                }

                if (block.content && Array.isArray(block.content)) {
                    // Controleer of de content generieke componenten zijn (hebben een 'type' property)
                    if (block.content[0] && block.content[0].type) {
                        accordionContentHtml += renderGenericChapterContent(block.content, chapterNumber, `${currentBlockId}-`);
                    } else { // Fallback naar de originele lijst-weergave
                        accordionContentHtml += `
                            <ol class="accordion-list">
                                ${block.content.map(item => `
                                    <li>
                                        <strong>${item.titel || item.naam}:</strong> ${item.beschrijving}
                                        ${item.subpunten && item.subpunten.length > 0 ? `
                                            <ul class="accordion-subpunten">
                                                ${item.subpunten.map(sub => `<li>${sub}</li>`).join('')}
                                            </ul>
                                        ` : ''}
                                    </li>
                                `).join('')}
                            </ol>
                        `;
                    }
                }
                
                html += `
                    <div class="accordion">
                        <button class="accordion-toggle" id="${toggleId}" aria-expanded="false" data-accordion-target="${contentId}">
                            <span class="triangle">&#9654;</span> ${block.titel}
                        </button>
                        <div class="accordion-content" id="${contentId}">
                            ${accordionContentHtml}
                        </div>
                    </div>
                `;
                break;
            case 'video-split-screen':
                let videoEmbedUrl = '';
                if (block.video && block.video.link && block.video.link.includes('youtu')) {
                    const match = block.video.link.match(/(?:youtu.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
                    if (match && match[1]) {
                        videoEmbedUrl = `https://www.youtube.com/embed/${match[1]}`;
                    }
                }
                const videoIconSvg = block.tekst_content && block.tekst_content.icon_type === 'video' ? 
                    `<span class="component-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>` : '';

                html += `
                    <div class="video-split-screen">
                        <div class="video-content">
                            ${videoEmbedUrl ? `<div class='video-wrapper'><iframe src='${videoEmbedUrl}' title='${block.video.titel || 'Embedded YouTube video'}' allowfullscreen></iframe></div>` : '<p>Video kon niet geladen worden.</p>'}
                        </div>
                        <div class="text-content">
                            ${block.tekst_content.titel ? `<h3>${videoIconSvg}${block.tekst_content.titel}</h3>` : ''}
                            ${block.tekst_content.paragrafen && Array.isArray(block.tekst_content.paragrafen) ? block.tekst_content.paragrafen.map(p => `<p>${p}</p>`).join('') : ''}
                        </div>
                    </div>
                `;
                break;
            case 'stats-card-grid':
                html += `<div class="stats-container">`;
                block.kaarten.forEach(kaart => {
                    let bronHtml = '';
                    if (kaart.bron) {
                        if (kaart.bron.url) {
                            bronHtml = `<a href="${kaart.bron.url}" target="_blank" class="stat-source">${kaart.bron.naam}</a>`;
                        } else {
                            bronHtml = `<span class="stat-source">${kaart.bron.naam}</span>`;
                        }
                    }

                    const isCompact = block.layout === 'compact';
                    const cardClass = isCompact ? 'stat-card--compact' : '';
                    
                    let cardContentHtml = '';
                    if(isCompact) {
                        // Compact layout HTML structure
                        cardContentHtml = `
                            <div class="stat-card-header-compact">
                                ${kaart.afbeelding ? `<div class="stat-image"><img src="${kaart.afbeelding}" alt="${kaart.titel || ''}"></div>` : ''}
                                ${kaart.titel ? `<h3 class="stat-title">${kaart.titel}</h3>` : ''}
                            </div>
                            <div class="stat-card-body-compact">
                                ${kaart.getal ? `<div class="stat-number">${kaart.getal}</div>` : ''}
                                ${kaart.label ? `<p class="stat-label">${kaart.label}</p>` : ''}
                            </div>
                        `;
                    } else {
                        // Default layout HTML structure
                        cardContentHtml = `
                            ${kaart.titel ? `<h3 class="stat-title">${kaart.titel}</h3>` : ''}
                            ${kaart.afbeelding ? `<div class="stat-image"><img src="${kaart.afbeelding}" alt="${kaart.titel || ''}"></div>` : ''}
                            ${kaart.getal ? `<div class="stat-number">${kaart.getal}</div>` : ''}
                            ${kaart.label ? `<p class="stat-label">${kaart.label}</p>` : ''}
                        `;
                    }

                    html += `
                        <div class="stat-card ${cardClass}">
                            <div class="stat-card-content">
                                ${cardContentHtml}
                            </div>
                            ${bronHtml ? `<div class="stat-card-footer">${bronHtml}</div>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
                break;
        }
    });
    return html;
}

function generateQRCodesForContent(content, chapterNumber, parentBlockId = '') {
    if (!Array.isArray(content)) return;

    content.forEach((block, blockIndex) => {
        const currentBlockId = `${parentBlockId}block${blockIndex}`;
        
        if (block.type === 'resource-grid-container') {
            const gridId = `ch${chapterNumber}-${currentBlockId}`;
            block.items.forEach((item, itemIndex) => {
                if (item.link) {
                    const qrId = `qr-${gridId}-item${itemIndex}`;
                    const qrContainer = document.getElementById(qrId);
                    if (qrContainer && qrContainer.innerHTML === '') {
                        new QRCode(qrContainer, {
                            text: item.link,
                            width: 128,
                            height: 128,
                            colorDark: "#662483",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    }
                }
            });
        }

        // Recursively call for nested content, e.g., in info-cards
        if (block.content && Array.isArray(block.content)) {
            generateQRCodesForContent(block.content, chapterNumber, `${currentBlockId}-`);
        }
    });
}

function renderAfsluitingContent(content) {
    devLog('Rendering Afsluiting content with data:', content);
    let html = '';

    // "Wat ga je hier doen?" kaart
    if (content.introductieBlok) {
        html += `
            <div class="info-card">
                <h3 class="info-card-title">${content.introductieBlok.titel}</h3>
                <div class="info-card-content">
                    <p>${content.introductieBlok.tekst.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
    }

    // "Afsluitende quiz" kaart
    if (content.afsluitQuizIntro) {
        html += `
            <div class="info-card">
                <h3 class="info-card-title">${content.afsluitQuizIntro.titel}</h3>
                <div class="info-card-content">
                    <p>${content.afsluitQuizIntro.tekst.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
    }

    // Functionele container voor de quiz
    html += '<div id="quiz-container"></div>';
    html += '<hr style="margin: 40px 0;">';
    
    // Wrapper voor Certificaat en Portfolio secties
    html += '<div class="certificaat-portfolio-wrapper">';
    html += '<h2 class="section-title">Certificaat en Portfolio</h2>';

    // "Wat kun je met dit certificaat?" sectie
    if (content.overCertificaat) {
        html += `
            <div class="info-card purple-kader">
                <h3 class="info-card-title">${content.overCertificaat.titel}</h3>
                <div class="info-card-content">
                    <p>${content.overCertificaat.tekst.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
    }

    html += '<div class="certificaat-download-link" style="text-align: center; margin-top: 20px;">';
    html += '<a href="#" onclick="generatePDF(); return false;" class="button button-primary">Download Certificaat</a>';
    html += '</div>';

    if (content.portfolioVragen && Array.isArray(content.portfolioVragen) && content.portfolioVragen.length > 0) {
        html += `<h3 class="section-title" style="margin-top: 40px;">Reflectievragen voor je portfolio</h3>`;
        html += `<p class="intro-text">${content.portfolioIntro || 'Beantwoord de volgende vragen ter voorbereiding op een portfolio-gesprek:'}</p>`;
        html += `<div class="portfolio-vragen-container">`;
        content.portfolioVragen.forEach((vraag, index) => {
            html += `
                <div class="portfolio-vraag-item">
                    <h4>Vraag ${index + 1}: ${vraag.vraag}</h4>
                    <p>${vraag.uitleg}</p>
                </div>
            `;
        });
        html += `</div>`;
    }
    
    html += '</div>'; // Close certificaat-portfolio-wrapper

    // "Bronvermelding" sectie
    if (content.bronvermelding && Array.isArray(content.bronvermelding)) {
        html += `<h3 class="section-title" style="margin-top: 40px;">Bronvermelding</h3>`;
        html += `<ul class="bronvermelding-list">`;
        content.bronvermelding.forEach(bron => {
            html += `<li>${bron}</li>`;
        });
        html += `</ul>`;
    }


    // Footer for afsluiting chapter
    html += `
        <footer class="footer">
            <div class="footer-content">
                <p>&copy; ${new Date().getFullYear()} Hogeschool van Arnhem en Nijmegen (HAN). Alle rechten voorbehouden.</p>
            </div>
        </footer>
    `;

    return html;
}

function renderFlashcardContent(interactie, chapterNumber) {
    const baseId = `flashcard_${chapterNumber}_${interactie.id}`;
    // Herhalingen ophalen uit localStorage
    let herhalingen = JSON.parse(localStorage.getItem(`${baseId}_herhalingen`) || '{}');
    let run = parseInt(localStorage.getItem(`${baseId}_run`) || '1');
    let laatsteSet = JSON.parse(localStorage.getItem(`${baseId}_laatsteSet`) || '[]');
    let laatsteType = localStorage.getItem(`${baseId}_laatsteType`) || 'all';
    let setAfgerond = localStorage.getItem(`${baseId}_setAfgerond`) === 'true';

    // Info-uitleg HTML (standaard ingeklapt)
    const uitlegId = `${baseId}_uitleg`;
    const infoIcon = `<span class="flashcard-info-icon" id="${baseId}_infoicon" title="Uitleg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg></span>`;
    const uitlegBlok = `<div class="info-card flashcard-uitleg" id="${uitlegId}" style="display:none; margin-bottom:12px;">
      <div class="info-card-content">
        De flashcards zijn bedoeld om je te helpen belangrijke begrippen actief te oefenen. Je kunt de set zo vaak herhalen als je wilt, net zolang tot je alles goed weet. Na elke ronde kun je kiezen om alleen de kaarten te herhalen die je nog niet wist, of om alles opnieuw te doen. Jouw voortgang en het aantal herhalingen worden automatisch opgeslagen en meegenomen in je certificaat. Het doel is niet om alles in één keer goed te hebben, maar om te leren door te herhalen!
      </div>
    </div>`;

    // UI opbouw
    let html = `<div class="interactive-block flashcard-container" id="${baseId}">
        <div class="interactive-block-header">
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
            <h4 style="display:inline-block; margin-right:8px;">${interactie.titel}</h4>${infoIcon}
        </div>
        ${uitlegBlok}
        <div class="interactive-block-content flashcard-content" id="${baseId}_content">`;

    // Kaart X van Y rechtsboven
    html += `<div style="display:flex; justify-content: flex-end; align-items:center; margin-bottom: 8px;">
        <span id="${baseId}_kaartinfo" class="flashcard-kaartinfo"></span>
    </div>`;

    // Flashcard zelf
    html += `<div class="flashcard-stack" id="${baseId}_stack"></div>`;

    // Feedback
    html += `<div class="flashcard-feedback" id="${baseId}_feedback"></div>`;

    // Herhaal-knoppen (alleen tonen als set afgerond)
    html += `<div class="flashcard-repeat-controls" id="${baseId}_repeatcontrols" style="display:none; margin-top:1.5rem; gap:1rem;">
        <button class="btn btn-primary" id="${baseId}_repeat_incorrect">Herhaal alleen de vragen die ik niet wist</button>
        <button class="btn btn-secondary" id="${baseId}_repeat_all">Herhaal hele set</button>
    </div>`;

    html += `</div></div>`;
    return html;
}

function initializeFlashcardInteraction(interactie, chapterNumber) {
    const baseId = `flashcard_${chapterNumber}_${interactie.id}`;
    const total = interactie.cards.length;
    let herhalingen = JSON.parse(localStorage.getItem(`${baseId}_herhalingen`) || '{}');
    let run = parseInt(localStorage.getItem(`${baseId}_run`) || '1');
    let laatsteSet = JSON.parse(localStorage.getItem(`${baseId}_laatsteSet`) || '[]');
    let laatsteType = localStorage.getItem(`${baseId}_laatsteType`) || 'all';
    let setAfgerond = localStorage.getItem(`${baseId}_setAfgerond`) === 'true';
    let kaartenTeDoen = interactie.cards.map((c, i) => i);
    if (setAfgerond && laatsteType === 'incorrect' && laatsteSet.length > 0) {
        kaartenTeDoen = laatsteSet;
    }
    let huidigeKaart = 0;
    let incorrecteKaarten = [];
    let antwoordenDezeRun = [];

    const stack = document.getElementById(`${baseId}_stack`);
    const kaartinfo = document.getElementById(`${baseId}_kaartinfo`);
    const feedback = document.getElementById(`${baseId}_feedback`);
    const repeatControls = document.getElementById(`${baseId}_repeatcontrols`);
    const contentDiv = document.getElementById(`${baseId}_content`);

    function toonKaart(idx) {
        const kaartIndex = kaartenTeDoen[idx];
        // Mapping voor correcte veldnamen uit JSON
        let card = interactie.cards[kaartIndex];
        // Ondersteun zowel oude als nieuwe structuur
        const voorkant = card.voorzijde || card.term;
        const achterkant = card.achterzijde || card.uitleg;
        function getHerhalingLabel(n) {
            if (!n || n === 1) return '';
            if (n === 2) return '1e herhaling';
            if (n === 3) return '2e herhaling';
            return (n-1) + 'e herhaling';
        }
        const herhalingTekst = getHerhalingLabel(herhalingen[kaartIndex] ? herhalingen[kaartIndex] : 1);
        stack.innerHTML = `
            <div class="flashcard" id="${baseId}_card_${kaartIndex}">
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <p>${voorkant}</p>
                    </div>
                    <div class="flashcard-back">
                        ${herhalingTekst ? `<div class=\"flashcard-repeat-label\">${herhalingTekst}</div>` : ''}
                        <p class="flashcard-answer-text">${achterkant}</p>
                        <div class="flashcard-answer-buttons">
                            <button class="btn btn-success" data-flashcard-know="true">Ik wist het</button>
                            <button class="btn btn-danger" data-flashcard-know="false">Ik wist het niet</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        kaartinfo.textContent = `Kaart ${idx+1} van ${kaartenTeDoen.length}`;
        feedback.textContent = '';
        
        // Flip functionaliteit
        const cardDiv = document.getElementById(`${baseId}_card_${kaartIndex}`);
        if (cardDiv) {
            cardDiv.addEventListener('click', function(e) {
                if (!e.target.closest('.flashcard-answer-buttons')) {
                    this.classList.toggle('flipped');
                }
            });
        }
        
        // Antwoordknoppen
        const answerButtons = stack.querySelector('.flashcard-answer-buttons');
        if (answerButtons) {
            answerButtons.addEventListener('click', function(e) {
                const btn = e.target.closest('button[data-flashcard-know]');
                if (!btn) return;
                const wistHet = btn.getAttribute('data-flashcard-know') === 'true';
                // Herhalingen bijhouden
                herhalingen[kaartIndex] = (herhalingen[kaartIndex] || 1);
                antwoordenDezeRun.push({kaart: kaartIndex, correct: wistHet});
                if (!wistHet) incorrecteKaarten.push(kaartIndex);
                // Volgende kaart of set klaar
                huidigeKaart++;
                if (huidigeKaart < kaartenTeDoen.length) {
                    toonKaart(huidigeKaart);
                } else {
                    // Set afgerond
                    setAfgerond = true;
                    localStorage.setItem(`${baseId}_setAfgerond`, 'true');
                    laatsteSet = incorrecteKaarten;
                    laatsteType = 'incorrect';
                    localStorage.setItem(`${baseId}_laatsteSet`, JSON.stringify(incorrecteKaarten));
                    localStorage.setItem(`${baseId}_laatsteType`, 'incorrect');
                    // Herhalingen ophogen voor alle kaarten in deze run
                    antwoordenDezeRun.forEach(a => {
                        herhalingen[a.kaart] = (herhalingen[a.kaart] || 1) + 1;
                    });
                    localStorage.setItem(`${baseId}_herhalingen`, JSON.stringify(herhalingen));
                    localStorage.setItem(`${baseId}_run`, (run+1).toString());
                    // Voortgang: markeer als minimaal 1x gedaan
                    if (!localStorage.getItem(`${baseId}_done`)) {
                        localStorage.setItem(`${baseId}_done`, 'true');
                        if (typeof updateAllChapterProgress === 'function') updateAllChapterProgress();
                    }
                    feedback.textContent = 'Set afgerond! Kies een herhaaloptie.';
                    repeatControls.style.display = 'flex';
                }
            });
        }
    }

    // Herhaal alleen niet-wist
    document.getElementById(`${baseId}_repeat_incorrect`).onclick = function() {
        if (laatsteSet.length === 0) {
            feedback.textContent = 'Je hebt alle kaarten goed!';
            return;
        }
        kaartenTeDoen = laatsteSet;
        huidigeKaart = 0;
        incorrecteKaarten = [];
        antwoordenDezeRun = [];
        setAfgerond = false;
        localStorage.setItem(`${baseId}_setAfgerond`, 'false');
        localStorage.setItem(`${baseId}_laatsteType`, 'incorrect');
        repeatControls.style.display = 'none';
        toonKaart(huidigeKaart);
    };
    // Herhaal alles
    document.getElementById(`${baseId}_repeat_all`).onclick = function() {
        kaartenTeDoen = interactie.cards.map((c, i) => i);
        huidigeKaart = 0;
        incorrecteKaarten = [];
        antwoordenDezeRun = [];
        setAfgerond = false;
        localStorage.setItem(`${baseId}_setAfgerond`, 'false');
        localStorage.setItem(`${baseId}_laatsteType`, 'all');
        repeatControls.style.display = 'none';
        toonKaart(huidigeKaart);
    };

    // Init: als set niet afgerond, start bij juiste kaart
    if (!setAfgerond) {
        toonKaart(huidigeKaart);
    } else {
        repeatControls.style.display = 'flex';
        feedback.textContent = 'Set afgerond! Kies een herhaaloptie.';
    }

    // Info-uitleg toggling
    const infoIcon = document.getElementById(`${baseId}_infoicon`);
    const uitlegBlok = document.getElementById(`${baseId}_uitleg`);
    if (infoIcon && uitlegBlok) {
        infoIcon.style.cursor = 'pointer';
        infoIcon.addEventListener('click', function() {
            uitlegBlok.style.display = uitlegBlok.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Functie om alle flashcards op dezelfde hoogte in te stellen
    function normalizeFlashcardHeights() {
        // Wacht even tot alle content geladen is
        setTimeout(() => {
            const tempContainer = document.createElement('div');
            tempContainer.style.visibility = 'hidden';
            tempContainer.style.position = 'absolute';
            tempContainer.style.top = '-9999px';
            document.body.appendChild(tempContainer);

            let maxHeight = 0;
            const heights = [];

            // Meet de natuurlijke hoogte van elke kaart
            interactie.cards.forEach((card, index) => {
                const voorkant = card.voorzijde || card.term;
                const achterkant = card.achterzijde || card.uitleg;
                const herhalingTekst = herhalingen[index] ? `${herhalingen[index]-1}e herhaling` : '';
                
                tempContainer.innerHTML = `
                    <div class="flashcard" style="width: ${stack.offsetWidth}px;">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <p>${voorkant}</p>
                            </div>
                            <div class="flashcard-back">
                                ${herhalingTekst ? `<div class="flashcard-repeat-label">${herhalingTekst}</div>` : ''}
                                <p class="flashcard-answer-text">${achterkant}</p>
                                <div class="flashcard-answer-buttons">
                                    <button class="btn btn-success">Ik wist het</button>
                                    <button class="btn btn-danger">Ik wist het niet</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                const tempCard = tempContainer.querySelector('.flashcard');
                const frontHeight = tempCard.querySelector('.flashcard-front').scrollHeight + 80; // padding
                const backHeight = tempCard.querySelector('.flashcard-back').scrollHeight + 80; // padding
                const cardHeight = Math.max(frontHeight, backHeight);
                heights.push(cardHeight);
                maxHeight = Math.max(maxHeight, cardHeight);
            });

            document.body.removeChild(tempContainer);

            // Stel de uniforme hoogte in via CSS custom property
            const flashcardContainer = document.getElementById(baseId);
            if (flashcardContainer && maxHeight > 0) {
                flashcardContainer.style.setProperty('--uniform-flashcard-height', `${maxHeight}px`);
                
                // Voeg CSS toe om de uniforme hoogte te gebruiken
                const style = document.createElement('style');
                style.textContent = `
                    #${baseId} .flashcard {
                        height: var(--uniform-flashcard-height) !important;
                        min-height: unset !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }, 100);
    }

    // Roep de functie aan bij initialisatie
    normalizeFlashcardHeights();

    // Herroep bij window resize voor responsive gedrag
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(normalizeFlashcardHeights, 250);
    });
}

/**
 * Rendert een 'losstaand' hoofdstuk, onafhankelijk van de standaard sectie-structuur.
 * Gebruikt voor de developer-modus en potentieel andere features.
 * @param {object} chapterData - De JSON data van het hoofdstuk.
 * @param {HTMLElement} targetContainer - De container waarin de content gerenderd moet worden.
 */
// Make renderStandaloneChapter globally available for use in other scripts
window.renderStandaloneChapter = function renderStandaloneChapter(chapterData, targetContainer) {
    if (!chapterData || !targetContainer) {
        console.error('Ontbrekende data of container voor renderStandaloneChapter');
        return;
    }

    targetContainer.innerHTML = ''; // Maak de container leeg

    // Gebruik de 'title' property uit de JSON
    const h2 = document.createElement('h2');
    h2.textContent = chapterData.title; // Gebruik de standaard 'title' property
    h2.className = 'chapter-main-title'; // Pas eventueel class aan
    targetContainer.appendChild(h2);

    // Render de content-onderdelen uit de 'content' array
    if (chapterData.content && Array.isArray(chapterData.content)) {
        const contentHtml = renderGenericChapterContent(chapterData.content, 'dev');
        targetContainer.innerHTML += contentHtml;
    }
    
    // Render de interacties
    if (chapterData.interacties && Array.isArray(chapterData.interacties)) {
        chapterData.interacties.forEach(interaction => {
            const interactionContainer = document.createElement('div');
            interactionContainer.id = `dev-${interaction.id}`;
            targetContainer.appendChild(interactionContainer);
            // We gebruiken 'dev' als chapterNumber-placeholder
            renderInteraction(interaction, 'dev', interactionContainer);
        });
    }
}

// Pass chapterNumber to renderBraindumpInteraction
function renderBraindumpInteraction(interactionData, chapterNumber) {
    const braindumpId = interactionData.id;
    const storageKeyAttempts = `braindump_${chapterNumber}_${braindumpId}_attempts`;
    const storageKeyEvaluations = `braindump_${chapterNumber}_${braindumpId}_evaluations`;
    const storageKeyCompleted = `braindump_${chapterNumber}_${braindumpId}_completed`;
    
    // Haal opgeslagen data op
    const attempts = JSON.parse(localStorage.getItem(storageKeyAttempts) || '[]');
    const evaluations = JSON.parse(localStorage.getItem(storageKeyEvaluations) || '[]');
    const isCompleted = localStorage.getItem(storageKeyCompleted) === 'true';
    
    // Aantal pogingen
    const attemptCount = attempts.length;
    // Als not completed, toon lege textarea voor nieuwe poging
    const currentAttempt = isCompleted && attemptCount > 0 ? attempts[attemptCount - 1] : '';
    
    // Controleer of er al een evaluatie is voor de huidige poging
    const hasEvaluation = evaluations.length > 0 && isCompleted;
    const lastEvaluation = hasEvaluation ? evaluations[evaluations.length - 1] : null;
    
    // ChatGPT prompt URL - we'll build this dynamically in the initialization function
    const chatGptPrompt = interactionData.chatgpt_prompt || 'Geef feedback op deze braindump over leerstrategieën. Wees constructief en specifiek.';
    const chatGptUrl = `#`; // Placeholder, will be updated dynamically
    
    const iconSvg = '<svg viewBox="0 0 24 24" class="icon"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>';
    const blockTitle = interactionData.titel || "Braindump";
    const specificQuestionTitle = interactionData.vraag ? `<h5 class="interaction-title">${interactionData.vraag}</h5>` : '';
    
    // Evaluatie opties
    const evaluationOptions = ['good', 'fair', 'poor'];
    const evaluationLabels = {
        'good': 'Goed - Ik wist het meeste nog',
        'fair': 'Matig - Ik wist de helft nog',
        'poor': 'Slecht - Ik wist weinig nog'
    };
    
    const evaluationHTML = evaluationOptions.map(option => {
        // Als not completed, geen radio button checked
        const checked = isCompleted && lastEvaluation && lastEvaluation.evaluation === option ? 'checked' : '';
        const disabled = isCompleted ? 'disabled' : '';
        return `
            <div class="braindump-evaluation-option ${option}">
                <input type="radio" 
                       id="${braindumpId}-eval-${option}" 
                       name="${braindumpId}-evaluation" 
                       value="${option}" 
                       ${checked} 
                       ${disabled}>
                <label for="${braindumpId}-eval-${option}">${evaluationLabels[option]}</label>
            </div>
        `;
    }).join('');
    
    // Feedback na evaluatie - alleen tonen als completed en heeft evaluatie
    let feedbackHTML = '';
    if (isCompleted && hasEvaluation) {
        const evalText = evaluationLabels[lastEvaluation.evaluation] || lastEvaluation.evaluation;
        feedbackHTML = `
            <div class="feedback-message" style="display: block; margin-top: 1rem; padding: 1rem; background-color: var(--info-background); border-radius: 4px;">
                <strong>Je evaluatie:</strong> ${evalText}<br>
                <em>Poging ${attemptCount} opgeslagen.</em>
            </div>
        `;
    }
    
    return `
        <div class="interactive-block">
            <div class="interactive-block-header">
                ${iconSvg}
                <h4>${blockTitle}</h4>
            </div>
            <div class="interactive-block-content">
                <div class="braindump-container${isCompleted ? ' braindump-completed' : ''}">
                    ${specificQuestionTitle}
                    
                    <div class="braindump-instruction-compact">
                        <div class="braindump-instruction-header">
                            <span class="braindump-instruction-text">Schrijf uit je hoofd op wat je nog weet over dit onderwerp.</span>
                            <button type="button" class="braindump-instruction-toggle" title="Meer informatie" onclick="toggleBraindumpInstruction('${braindumpId}')">i</button>
                        </div>
                        <div class="braindump-instruction-details" id="${braindumpId}-instruction-details" style="display: none;">
                            ${interactionData.instructie || 'Schrijf uit je hoofd op wat je nog weet over dit onderwerp. Kijk niet terug naar de tekst.'}
                        </div>
                    </div>
                    
                    ${!isCompleted ? `
                    <div class="braindump-section-selector">
                        <div class="braindump-selector-header" onclick="toggleBraindumpSections('${braindumpId}')">
                            <h6 class="braindump-selector-title">📝 Selecteer secties</h6>
                            <button type="button" class="braindump-selector-toggle" id="${braindumpId}-section-toggle">▼</button>
                        </div>
                        <div class="braindump-section-options" id="${braindumpId}-section-options">
                            <label class="braindump-section-option all-option">
                                <input type="checkbox" class="braindump-section-checkbox" value="all">
                                <span class="braindump-section-label">📚 Hele hoofdstuk</span>
                            </label>
                            <div class="braindump-section-list" id="${braindumpId}-section-list">
                                <!-- Secties worden hier dynamisch geladen -->
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="braindump-textarea-container">
                        <textarea 
                            id="${braindumpId}-textarea" 
                            class="braindump-textarea" 
                            placeholder="Typ hier je braindump..."
                            maxlength="5000"
                            ${isCompleted ? 'readonly' : ''}
                        >${currentAttempt}</textarea>
                        <div class="braindump-textarea-footer">
                            <span id="${braindumpId}-counter" class="char-counter"></span>
                        </div>
                    </div>
                    
                    <div class="braindump-control-section">
                        <div class="braindump-control-instruction">
                            <strong>Controle:</strong> ${interactionData.controle_instructie || 'Scroll nu terug door het hoofdstuk en vergelijk je antwoord met de inhoud. Deze vergelijking zorgt voor elaboratie en dieper leren - je verbindt je eigen gedachten met de geleerde stof.'}
                        </div>
                        <div class="braindump-ai-control">
                            <div class="braindump-ai-header">
                                <h6 class="braindump-ai-title">🤖 Controleer je braindump met AI</h6>
                                <button type="button" class="braindump-ai-toggle" title="Meer informatie" onclick="toggleBraindumpAI('${braindumpId}')">i</button>
                            </div>
                            <div class="braindump-ai-details" id="${braindumpId}-ai-details" style="display: none;">
                                <p>Je kunt je braindump laten controleren door een AI. Selecteer de gewenste secties, vul je braindump in, klik op <b>Kopieer prompt</b> en plak deze in je favoriete AI-chatbot.</p>
                                <p><strong>Belangrijk:</strong> AI-feedback is alleen nuttig als je zelf goed nadenkt over de feedback. Ga in gesprek met de chatbot over het onderwerp - stel vragen, vraag om verduidelijking, en gebruik het als een leerpartner in plaats van alleen een corrector.</p>
                            </div>
                        </div>
                        <div class="braindump-actions">
                            <button type="button" class="btn btn-copy-prompt" id="${braindumpId}-copy-prompt-btn">📋 Kopieer prompt</button>
                            <a href="https://chatgpt.com/" target="_blank" class="btn btn-ai-link">🤖 ChatGPT</a>
                            <a href="https://gemini.google.com/" target="_blank" class="btn btn-ai-link">🌟 Gemini</a>
                            <a href="https://claude.ai/" target="_blank" class="btn btn-ai-link">🧠 Claude</a>
                            <span class="copy-prompt-feedback" id="${braindumpId}-copy-feedback" style="display:none;margin-left:1rem;color:var(--success-text);font-weight:500;">Prompt gekopieerd!</span>
                        </div>
                        
                        <div class="braindump-evaluation">
                            <div class="braindump-evaluation-title">Hoe goed kon je de inhoud reproduceren?</div>
                            <div class="braindump-evaluation-options">
                                ${evaluationHTML}
                            </div>
                        </div>
                        
                        ${feedbackHTML}
                    </div>
                    
                    <div class="braindump-footer">
                        <div class="braindump-attempts-info">
                            ${isCompleted && attemptCount > 0 ? `Poging ${attemptCount} opgeslagen` : `Poging ${attemptCount + 1} van onbeperkt`}
                        </div>
                        <div class="braindump-footer-buttons">
                            <button class="btn${isCompleted ? ' btn-opgeslagen' : ''}" 
                                    id="${braindumpId}-save-btn" 
                                    ${isCompleted ? 'disabled' : ''}
                                    onclick="saveBraindump('${chapterNumber}', '${braindumpId}')">
                                ${isCompleted ? 'Opgeslagen' : 'Braindump Opslaan'}
                            </button>
                            <button class="btn btn-secondary" 
                                    id="${braindumpId}-retry-btn" 
                                    onclick="retryBraindump('${chapterNumber}', '${braindumpId}')">
                                Opnieuw Proberen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
