// search.js - Search functionality

console.log('search.js loaded - search functionality would be implemented here');

function initSearchModule() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResults');
    let searchableData = [];
    let searchConfig = null; // Voor het laden van search configuratie

    // Probeer globale variabelen uit script.js te gebruiken
    // Deze moeten beschikbaar zijn omdat script.js eerder wordt geladen.
    const chaptersInfo = typeof chapters !== 'undefined' ? chapters : [];
    const totalChapterSections = typeof totalSections !== 'undefined' ? totalSections : 0;

    // Tooltip functionaliteit voor info-icoon
    const infoIcon = document.getElementById('searchInfoIcon');
    const infoTooltip = document.getElementById('searchInfoTooltip');
    if (infoIcon && infoTooltip) {
        function showTooltip() {
            infoTooltip.style.display = 'block';
        }
        function hideTooltip() {
            infoTooltip.style.display = 'none';
        }
        infoIcon.addEventListener('click', (e) => {
            if (infoTooltip.style.display === 'block') {
                hideTooltip();
            } else {
                showTooltip();
            }
        });
        // Sluit tooltip bij klik buiten
        document.addEventListener('click', (e) => {
            if (infoTooltip.style.display === 'block' && !infoTooltip.contains(e.target) && e.target !== infoIcon) {
                hideTooltip();
            }
        });
    }

    // Hulpfunctie om recursief alle strings uit een object/array te halen
    function extractStringsFromObject(obj, basePath = '', depth = 0, maxDepth = 7) {
        let strings = [];
        if (depth > maxDepth) return strings;

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const currentPathSegment = basePath ? `${basePath}${key}` : key;
                if (typeof obj[key] === 'string') {
                    if (key !== 'id' && key !== 'type' && key !== 'afbeelding' && key !== 'file' &&
                        key !== 'jsonFileName' && key !== 'sectionTitle' &&
                        !key.toLowerCase().includes('path') &&
                        !key.toLowerCase().includes('url') &&
                        !key.toLowerCase().includes('image') &&
                        !key.toLowerCase().includes('icon')) {
                        
                        let arrayKeyNameFromPath = null;
                        if (basePath.includes('[')) { // Check if part of an array item path
                            const match = basePath.match(/([^.[]+)\[\d+\]\.?$/); // Matches 'arrayName[index].' or 'arrayName[index]'
                            if (match && match[1]) {
                                arrayKeyNameFromPath = match[1];
                            }
                        }
                        
                        strings.push({
                            path: currentPathSegment,
                            text: obj[key],
                            // arrayKeyName wordt nu bepaald op basis van het pad, niet alleen directe ouder
                            arrayKeyName: arrayKeyNameFromPath 
                        });
                    }
                } else if (Array.isArray(obj[key])) {
                    const arrayName = key; // De naam van de array zelf
                    obj[key].forEach((item, index) => {
                        const itemPathInArray = `${currentPathSegment}[${index}]`;
                        if (typeof item === 'string') {
                            strings.push({
                                path: itemPathInArray,
                                text: item,
                                arrayKeyName: arrayName // Dit item is een direct kind van de array
                            });
                        } else if (typeof item === 'object' && item !== null) {
                            // Roep recursief aan, geef het pad mee inclusief de array naam en index
                            // De arrayKeyName voor diepere items wordt afgeleid van het pad in de stringverwerking hierboven.
                            strings = strings.concat(extractStringsFromObject(item, `${itemPathInArray}.`, depth + 1, maxDepth));
                        }
                    });
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    strings = strings.concat(extractStringsFromObject(obj[key], `${currentPathSegment}.`, depth + 1, maxDepth));
                }
            }
        }
        return strings;
    }

    // Initialiseer de zoekfunctionaliteit
    async function initializeSearch() {
        try {
            // Laad eerst de search configuratie
            await loadSearchConfig();
            
            // Bereid de doorzoekbare data voor
            await prepareSearchableData();
            
            // Stel event listeners in
            setupSearchEventListeners();
            
            devLog('Zoekfunctionaliteit succesvol geïnitialiseerd');
        } catch (error) {
            console.error('Fout bij initialiseren zoekfunctionaliteit:', error);
        }
    }

    // Laad de search configuratie
    async function loadSearchConfig() {
        try {
            const response = await fetch('content/search_config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            searchConfig = await response.json();
            devLog('Search configuratie geladen:', searchConfig);
        } catch (error) {
            console.error('Fout bij laden search configuratie, gebruik fallback:', error);
            // Fallback configuratie
            searchConfig = {
                knownListKeys: [
                    "items", "subitems", "statistieken", "bullets", "steps", 
                    "options", "antwoorden", "questions", "leerdoelen", "concepten", 
                    "adviezen", "competenties", "indicatoren", "voorbeelden", 
                    "scenario's", "criteria", "voorwaarden", "topics", "features", 
                    "stappen", "aspecten", "factoren", "toepassingen", "kenmerken", 
                    "voordelen", "nadelen", "uitdagingen", "punten", "locaties"
                ]
            };
        }
    }

    async function prepareSearchableData() {
        if (chaptersInfo.length === 0 || totalChapterSections === 0) {
            console.error("Zoekfunctie: 'chapters' of 'totalSections' globale variabelen niet gevonden of leeg.");
            if (searchResultsContainer) searchResultsContainer.innerHTML = '<p class="error-message">Zoekfunctie kon niet initialiseren.</p>';
            return;
        }

        try {
            const chapterFilePromises = chaptersInfo.map(chapterConfig => {
                const fileName = chapterConfig.section === totalChapterSections 
                                 ? 'hoofdstuk_afsluiting.json' 
                                 : `hoofdstuk${chapterConfig.section}.json`;
                return fetch(`content/${fileName}`)
                    .then(res => {
                        if (!res.ok) {
                            console.warn(`Kon ${fileName} niet laden: ${res.statusText}`);
                            return null; 
                        }
                        return res.json();
                    })
                    .then(data => (data ? { ...data, sectionTitle: chapterConfig.title, sectionNumber: chapterConfig.section, jsonFileName: fileName } : null));
            });

            const chaptersDataWithInfo = (await Promise.all(chapterFilePromises)).filter(ch => ch !== null);
            
            searchableData = []; 
            const knownListKeys = searchConfig.knownListKeys;

            chaptersDataWithInfo.forEach((chapterObject) => {
                if (!chapterObject) return;
                const titleToUse = chapterObject.sectionTitle;
                const sectionId = `section${chapterObject.sectionNumber}`;
                const baseId = `ch${chapterObject.sectionNumber}`;

                // Altijd de hoofdtitel toevoegen indien aanwezig en verschillend
                if (chapterObject.titel && chapterObject.titel.toLowerCase() !== titleToUse.toLowerCase()) {
                    searchableData.push({
                        id: `${baseId}_maintitle`,
                        displayTitle: titleToUse,
                        sectionId,
                        text: chapterObject.titel.toLowerCase(),
                        originalText: chapterObject.titel,
                        type: 'main_title',
                        isListItem: false,
                        itemPath: 'titel' // Aangepast van 'title' naar 'titel' als dat de key is
                    });
                }

                // Specifieke behandeling voor hoofdstuk_afsluiting.json
                if (chapterObject.jsonFileName === 'hoofdstuk_afsluiting.json') {
                    // Extraheer direct strings uit het hoofobject, met uitzondering van reeds verwerkte/specifieke keys
                    const exclusionKeys = ['titel', 'sectionTitle', 'sectionNumber', 'jsonFileName', 'afsluitQuizIntro']; // Voeg hier eventueel meer keys toe die niet direct doorzoekbaar moeten zijn
                    const afsluitingContentObject = {};
                    for (const key in chapterObject) {
                        if (Object.prototype.hasOwnProperty.call(chapterObject, key) && !exclusionKeys.includes(key)) {
                            afsluitingContentObject[key] = chapterObject[key];
                        }
                    }
                    const contentStrings = extractStringsFromObject(afsluitingContentObject, ''); // Lege basePath, want we zitten al in het relevante deel
                    contentStrings.forEach((item, idx) => {
                        if (item.text && item.text.trim() !== '') {
                            const isListItem = item.arrayKeyName !== null && knownListKeys.includes(item.arrayKeyName);
                            searchableData.push({
                                id: `${baseId}_afsluiting_${item.path.replace(/\\W/g, '_').substring(0,50)}_${idx}`,
                                displayTitle: titleToUse,
                                sectionId,
                                text: item.text.toLowerCase(),
                                originalText: item.text,
                                type: 'afsluiting_content',
                                isListItem: isListItem,
                                itemPath: item.path
                            });
                        }
                    });
                     // Optioneel: apart de afsluitQuizIntro indexeren als dat wenselijk is
                    if (chapterObject.afsluitQuizIntro && typeof chapterObject.afsluitQuizIntro === 'object') {
                        const quizIntroStrings = extractStringsFromObject(chapterObject.afsluitQuizIntro, 'afsluitQuizIntro.');
                        quizIntroStrings.forEach((item, idx) => {
                            if (item.text && item.text.trim() !== '') {
                                searchableData.push({
                                    id: `${baseId}_quizintro_${item.path.replace(/\\W/g, '_').substring(0,50)}_${idx}`,
                                    displayTitle: titleToUse,
                                    sectionId,
                                    text: item.text.toLowerCase(),
                                    originalText: item.text,
                                    type: 'quiz_intro_content',
                                    isListItem: false, // quiz intro is wss geen lijstitem
                                    itemPath: item.path
                                });
                            }
                        });
                    }

                } else if (chapterObject.content && typeof chapterObject.content === 'object') { // Voor reguliere hoofdstukken
                    const contentStrings = extractStringsFromObject(chapterObject.content, 'content.');
                    contentStrings.forEach((item, idx) => {
                        if (item.text && item.text.trim() !== '') {
                            const isListItem = item.arrayKeyName !== null && knownListKeys.includes(item.arrayKeyName);
                            searchableData.push({
                                id: `${baseId}_content_${item.path.replace(/\W/g, '_').substring(0,60)}_${idx}`,
                                displayTitle: titleToUse, 
                                sectionId, 
                                text: item.text.toLowerCase(), 
                                originalText: item.text, 
                                type: 'generic_content',
                                isListItem: isListItem,
                                itemPath: item.path
                            });
                        }
                    });
                }
                
                if (chapterObject.interacties && Array.isArray(chapterObject.interacties)) {
                    chapterObject.interacties.forEach((interactie, intIdx) => {
                        const interactieId = interactie.id || `gen_int_${intIdx}`;
                        const interactieBaseId = `${baseId}_int_${interactieId}`;
                        let interactieTeksten = [];

                        // Helper om interactie-elementen toe te voegen
                        const addInteractionText = (text, type, itemPath, isListItem = false) => {
                            if (text && typeof text === 'string' && text.trim() !== '') {
                                interactieTeksten.push({ text, type, itemPath, isListItem });
                            }
                        };

                        addInteractionText(interactie.titel, 'interaction_title', `interacties[${intIdx}].titel`);
                        addInteractionText(interactie.vraag, 'interaction_question', `interacties[${intIdx}].vraag`);
                        addInteractionText(interactie.instruction, 'interaction_instruction', `interacties[${intIdx}].instruction`);
                        addInteractionText(interactie.scenario, 'interaction_scenario', `interacties[${intIdx}].scenario`);
                        addInteractionText(interactie.statement, 'interaction_statement', `interacties[${intIdx}].statement`);

                        if (Array.isArray(interactie.options)) {
                            interactie.options.forEach((opt, optIdx) => {
                                if (typeof opt === 'string') {
                                    addInteractionText(opt, 'interaction_option', `interacties[${intIdx}].options[${optIdx}]`, true);
                                } else if (typeof opt === 'object' && opt.text) {
                                    addInteractionText(opt.text, 'interaction_option', `interacties[${intIdx}].options[${optIdx}].text`, true);
                                }
                            });
                        }

                        if (Array.isArray(interactie.vragen)) {
                            interactie.vragen.forEach((vraag, vraagIdx) => {
                                if (typeof vraag === 'string') {
                                    addInteractionText(vraag, 'interaction_subquestion', `interacties[${intIdx}].vragen[${vraagIdx}]`, true);
                                } else if (typeof vraag === 'object' && vraag.vraag) {
                                    addInteractionText(vraag.vraag, 'interaction_subquestion', `interacties[${intIdx}].vragen[${vraagIdx}].vraag`, true);
                                }
                            });
                        }

                        // Feedback wordt niet opgeslagen in doorzoekbare data

                        interactieTeksten.forEach((tekstItem, itemIdx) => {
                            searchableData.push({
                                id: `${interactieBaseId}_${itemIdx}`,
                                displayTitle: titleToUse,
                                sectionId,
                                text: tekstItem.text.toLowerCase(),
                                originalText: tekstItem.text,
                                type: tekstItem.type,
                                isListItem: tekstItem.isListItem,
                                itemPath: tekstItem.itemPath
                            });
                        });
                    });
                }
            });

            devLog(`Doorzoekbare data voorbereid: ${searchableData.length} items`);
        } catch (error) {
            console.error("Fout tijdens voorbereiden zoekdata:", error);
            if (searchResultsContainer) searchResultsContainer.innerHTML = '<p class="error-message">Fout bij initialiseren zoekfunctie.</p>';
        }
    }

    function handleSearchInput(event) {
        const query = event.target.value.toLowerCase().trim();
        if (!searchResultsContainer || !searchInput) return;
        if (query.length < 2) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none';
            return;
        }
        const results = searchableData.filter(item => item.text.includes(query));
        displayResults(results, query);
        if (results.length > 0 || query.length >=2 ) searchResultsContainer.style.display = 'block';
        else searchResultsContainer.style.display = 'none';
    }

    function displayResults(results, query) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = ''; 
        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<p class="no-results">Geen resultaten gevonden.</p>';
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'search-results-list';
        results.forEach(result => {
            const li = document.createElement('li');
            li.className = 'search-result-item';
            const titleSpan = document.createElement('span');
            titleSpan.className = 'result-title';
            titleSpan.textContent = result.displayTitle; 
            const snippetSpan = document.createElement('span');
            snippetSpan.className = 'result-snippet';
            let snippet = result.originalText;
            const queryIndex = result.text.indexOf(query); // query is de lowercase zoekterm
            const context = 100;
            if (queryIndex !== -1 && result.originalText.length > (query.length + 20)) {
                const start = Math.max(0, queryIndex - Math.floor(context/2));
                const end = Math.min(result.originalText.length, queryIndex + query.length + Math.ceil(context/2));
                snippet = (start > 0 ? '... ' : '') + result.originalText.substring(start, end) + (end < result.originalText.length ? ' ...' : '');
            }
            const cleanSnippetForFragment = snippet.replace(/^\.\.\. | \.\.\.$/g, '').trim();
            snippetSpan.innerHTML = highlightQuery(snippet, query);
            li.appendChild(titleSpan);
            li.appendChild(snippetSpan);
            li.addEventListener('click', () => {
                const sectionElement = document.getElementById(result.sectionId);
                if (sectionElement) {
                    const sectionNumberInt = parseInt(result.sectionId.replace('section', ''), 10);
                    
                    devLog(`Zoekresultaat geklikt:`, result);

                    if (typeof showSection === 'function') showSection(sectionNumberInt);
                    else if (typeof setActiveSection === 'function') setActiveSection(sectionNumberInt);
                    else {
                        console.warn("Navigatiefuncties (showSection/setActiveSection) niet gevonden. Handmatige fallback.");
                        document.querySelectorAll('.section.active').forEach(sec => sec.classList.remove('active'));
                        sectionElement.classList.add('active');
                        sectionElement.style.display = 'block';
                        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }

                    setTimeout(() => {
                        // --- Open accordion indien de tekst erin staat ---
                        if (
                            result.sectionId === `section${totalChapterSections}` &&
                            result.itemPath &&
                            result.itemPath.includes('content')
                        ) {
                            // Zoek dynamisch naar accordion in afsluitende hoofdstuk
                            const sectionElement = document.getElementById(result.sectionId);
                            if (sectionElement) {
                                const accordionToggle = sectionElement.querySelector('.accordion-toggle');
                                const accordionContent = sectionElement.querySelector('.accordion-content');
                                if (accordionToggle && accordionContent && !accordionContent.classList.contains('open')) {
                                    devLog("Accordion wordt geopend (vanwege itemPath: " + result.itemPath + ")...");
                                    accordionContent.classList.add('open');
                                    accordionToggle.classList.add('open');
                                    accordionToggle.setAttribute('aria-expanded', 'true');
                                    const triangle = accordionToggle.querySelector('.triangle');
                                    if (triangle) triangle.innerHTML = '&#9660;'; // Pijltje naar beneden
                                }
                            }
                        }

                        let textForFragment = '';
                        let prefixForFragment = '';
                        let suffixForFragment = '';
                        let useSimpleTextFragment = false;

                        const MAX_LIST_ITEM_FRAGMENT_LENGTH = 150;
                        const MIN_LIST_ITEM_FRAGMENT_LENGTH = 10; // Iets korter gemaakt voor meer flexibiliteit
                        const MIN_TEXT_LENGTH_WITH_CONTEXT = 5; 
                        const MIN_TEXT_LENGTH_NO_CONTEXT = 8; // Iets korter gemaakt

                        if (result.isListItem) {
                            devLog("Resultaat is een lijstitem. Gebruik volledige originalText als text fragment, met minimale bewerking.");
                            textForFragment = result.originalText.trim(); // Begin met de volledige, getrimde tekst
                            useSimpleTextFragment = true;
                            const queryLower = query.toLowerCase();
                            const originalTextLower = result.originalText.toLowerCase();
                            const queryInOriginalIdx = originalTextLower.indexOf(queryLower);

                            // Probeer de zoekterm te centreren als het te lang is, maar houd het simpel.
                            // De browser is best goed in het vinden van de tekst als het fragment lang genoeg is.
                            if (textForFragment.length > MAX_LIST_ITEM_FRAGMENT_LENGTH) {
                                if (queryInOriginalIdx !== -1) {
                                    const targetLength = Math.max(query.length + 20, MIN_LIST_ITEM_FRAGMENT_LENGTH); // Zorg dat het fragment lang genoeg is
                                    const startOffset = Math.max(0, queryInOriginalIdx - Math.floor(targetLength / 3));
                                    let proposedEnd = startOffset + targetLength;
                                    if (proposedEnd > textForFragment.length) {
                                        proposedEnd = textForFragment.length;
                                        // Als we aan het einde zijn, probeer dan meer van het begin te pakken
                                        // startOffset = Math.max(0, proposedEnd - targetLength);
                                    }
                                    textForFragment = result.originalText.substring(startOffset, proposedEnd).trim();
                                    
                                    // Als de query er niet meer in zit door het afkappen, neem dan een stuk vanaf het begin.
                                    if (textForFragment.toLowerCase().indexOf(queryLower) === -1) {
                                        textForFragment = result.originalText.substring(0, MAX_LIST_ITEM_FRAGMENT_LENGTH).trim();
                                    }

                                } else {
                                    // Query niet gevonden (onwaarschijnlijk, maar fallback)
                                    textForFragment = textForFragment.substring(0, MAX_LIST_ITEM_FRAGMENT_LENGTH).trim();
                                }
                            }
                            // Zorg ervoor dat het fragment niet te kort wordt na het trimmen en afkappen
                            if (textForFragment.length < MIN_LIST_ITEM_FRAGMENT_LENGTH && result.originalText.length >= MIN_LIST_ITEM_FRAGMENT_LENGTH) {
                                textForFragment = result.originalText.substring(0, Math.min(result.originalText.length, MAX_LIST_ITEM_FRAGMENT_LENGTH)).trim();
                            }
                            // Essentieel: voor list items gebruiken we GEEN prefix/suffix in de Text Fragment URL.
                            // De browser moet het exacte (of een significant deel van het) list item vinden.
                            prefixForFragment = ''; 
                            suffixForFragment = '';

                        } else {
                            devLog("Resultaat is GEEN lijstitem. Gebruik prefix/suffix strategie.");
                            // Gebruik de bestaande logica voor prefix/suffix
                            const queryLower = query.toLowerCase();
                            const snippetLower = cleanSnippetForFragment.toLowerCase(); // cleanSnippetForFragment is beschikbaar van buiten de timeout
                            const queryInSnippetIdx = snippetLower.indexOf(queryLower);

                            if (queryInSnippetIdx !== -1) {
                                const CONTEXT_CHARS = 25;
                                prefixForFragment = cleanSnippetForFragment.substring(Math.max(0, queryInSnippetIdx - CONTEXT_CHARS), queryInSnippetIdx).trim();
                                textForFragment = cleanSnippetForFragment.substring(queryInSnippetIdx, queryInSnippetIdx + query.length); // De zoekterm zelf
                                suffixForFragment = cleanSnippetForFragment.substring(queryInSnippetIdx + query.length, Math.min(cleanSnippetForFragment.length, queryInSnippetIdx + query.length + CONTEXT_CHARS)).trim();
                                
                                let combinedLength = (prefixForFragment + textForFragment + suffixForFragment).length;
                                const MAX_REGULAR_FRAGMENT_LENGTH = 100;
                                if (combinedLength > MAX_REGULAR_FRAGMENT_LENGTH) {
                                    const excess = combinedLength - MAX_REGULAR_FRAGMENT_LENGTH;
                                    const trimFromEnds = Math.floor(excess / 2);
                                    prefixForFragment = prefixForFragment.length > trimFromEnds ? prefixForFragment.substring(trimFromEnds) : '';
                                    suffixForFragment = suffixForFragment.length > trimFromEnds ? suffixForFragment.substring(0, suffixForFragment.length - trimFromEnds) : '';
                                }
                                prefixForFragment = prefixForFragment.replace(/^\W+|\W+$/g, '').replace(/\s+/g, ' ').trim();
                                suffixForFragment = suffixForFragment.replace(/^\W+|\W+$/g, '').replace(/\s+/g, ' ').trim();
                                textForFragment = textForFragment.trim();
                            } else {
                                textForFragment = cleanSnippetForFragment.length > MAX_REGULAR_FRAGMENT_LENGTH ? cleanSnippetForFragment.substring(0, MAX_REGULAR_FRAGMENT_LENGTH).trim() : cleanSnippetForFragment.trim();
                            }
                        }
                        
                        devLog(`Voorbereid voor Text Fragment: isListItem=${result.isListItem}, useSimple=${useSimpleTextFragment}, prefix="${prefixForFragment}", text="${textForFragment}", suffix="${suffixForFragment}"`);

                        const targetSection = document.getElementById(result.sectionId);
                        let canUseFragment = false;
                        if (useSimpleTextFragment) {
                            // Voor list items, vereisen we dat de textForFragment lang genoeg is
                            // en dat de originele tekst ook daadwerkelijk die tekst bevat (wat gegarandeerd zou moeten zijn)
                            canUseFragment = targetSection && textForFragment.length >= MIN_LIST_ITEM_FRAGMENT_LENGTH && result.originalText.toLowerCase().includes(textForFragment.toLowerCase());
                        } else {
                            canUseFragment = targetSection && 
                                             ( (prefixForFragment && suffixForFragment && textForFragment.length >= MIN_TEXT_LENGTH_WITH_CONTEXT) || 
                                               (!prefixForFragment && !suffixForFragment && textForFragment.length >= MIN_TEXT_LENGTH_NO_CONTEXT) );
                        }

                        if (canUseFragment) {
                            try {
                                let fragmentParams = `text=${encodeURIComponent(textForFragment)}`;
                                // Alleen prefix en suffix toevoegen als het GEEN simple fragment (list item) is
                                if (!useSimpleTextFragment && prefixForFragment) {
                                    fragmentParams = `prefix=${encodeURIComponent(prefixForFragment)}&${fragmentParams}`;
                                }
                                if (!useSimpleTextFragment && suffixForFragment) {
                                    fragmentParams += `&suffix=${encodeURIComponent(suffixForFragment)}`;
                                }
                                const fragmentUrl = `#${result.sectionId}:~:${fragmentParams}`;
                                devLog("Proberen te navigeren naar Text Fragment URL:", fragmentUrl);
                                window.location.hash = fragmentUrl;
                            } catch (e) {
                                devLog(`Kon geen Text Fragment URL maken:`, e, {result, textForFragment, prefixForFragment, suffixForFragment});
                                history.pushState(null, '', `#${result.sectionId}`);
                                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        } else if (targetSection) {
                            devLog("Condities voor Text Fragment niet voldaan. Scrollen naar begin van sectie:", result.sectionId, {canUseFragment, textLength: textForFragment.length, prefix: prefixForFragment, suffix: suffixForFragment});
                            history.pushState(null, '', `#${result.sectionId}`);
                            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 300);
                }
                searchResultsContainer.style.display = 'none';
                if (searchInput) searchInput.value = '';
            });
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
    }

    function highlightQuery(text, query) {
        if (!text || !query) return text || '';
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegExp(string) {
        if (!string) return '';
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    document.addEventListener('click', function(event) {
        if (searchInput && searchResultsContainer) {
            if (!searchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
                searchResultsContainer.style.display = 'none';
            }
        }
    });

    if (searchInput && searchInput.value.length >=2) {
        setTimeout(() => {
            if (searchableData.length > 0) handleSearchInput({ target: searchInput });
            else {
                const checkDataInterval = setInterval(() => {
                    if (searchableData.length > 0) {
                        clearInterval(checkDataInterval);
                        handleSearchInput({ target: searchInput });
                    }
                }, 200);
            }
        }, 500);
    }
    initializeSearch();

    // Stel event listeners in voor de zoekfunctionaliteit
    function setupSearchEventListeners() {
        if (searchInput) {
            searchInput.addEventListener('input', handleSearchInput);
        } else {
            console.error("Zoekveld (searchInput) niet gevonden.");
        }
    }
}