// quiz.js - Quiz functionaliteit voor afsluitquiz

console.log('quiz.js loaded - quiz functionality would be implemented here');

// Globale variabelen specifiek voor de afsluitende quiz
let currentQuizQuestionIndex = 0;
let quizQuestionsData = []; // Zal vragen van afsluitquiz.json bevatten
let quizAnswers = []; // Zal antwoorden van de gebruiker bevatten

/**
 * Laadt de data voor de afsluitende quiz uit afsluitquiz.json
 * en start de eerste vraag.
 */
async function loadMCQuiz() {
    console.log('loadMCQuiz aangeroepen');
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) {
        console.warn('Quiz container #quiz-container niet gevonden. Poging tot dynamisch aanmaken.');
        const section8Content = document.querySelector('#section8 .section-content');
        if (section8Content) {
            const newQuizContainer = document.createElement('div');
            newQuizContainer.id = 'quiz-container';
            const certSection = document.getElementById('certificaat-portfolio-container');
            section8Content.insertBefore(newQuizContainer, certSection);
             console.log('#quiz-container dynamisch aangemaakt voor certificaat sectie.');
        } else {
            console.error('Kritieke Fout: Sectie 8 content area niet gevonden.');
            return;
        }
    }
    document.getElementById('quiz-container').innerHTML = '<p>Quiz aan het laden...</p>';
    try {
        const res = await fetch('content/afsluitquiz.json');
        if (!res.ok) {
            throw new Error(`Afsluitquiz JSON niet gevonden (${res.status})`);
        }
        const loadedData = await res.json();
        if (!Array.isArray(loadedData) || loadedData.length === 0) {
             console.warn('Afsluitquiz JSON is leeg of ongeldig formaat.');
             document.getElementById('quiz-container').innerHTML = '<p style="color:red;">Fout: Quizdata is leeg of ongeldig.</p>';
             return;
        }
        quizQuestionsData = loadedData;
        let storedAnswers = JSON.parse(localStorage.getItem('mc_quiz_answers')) || [];
        quizAnswers = storedAnswers.filter(ans => quizQuestionsData.some(q => q.id === ans.id));
        localStorage.setItem('mc_quiz_answers', JSON.stringify(quizAnswers));

        currentQuizQuestionIndex = 0; 
        renderCurrentQuizQuestion();
    } catch (e) {
        console.error('Fout bij laden afsluitquiz:', e);
        if(document.getElementById('quiz-container')) document.getElementById('quiz-container').innerHTML = `<p style="color:red;">Kon afsluitquiz niet laden: ${e.message}</p>`;
    }
}

/**
 * Rendert de huidige quizvraag op basis van `currentQuizQuestionIndex`.
 * Toont de vraag, opties, en navigatieknoppen.
 */
function renderCurrentQuizQuestion() {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) { 
        console.error("renderCurrentQuizQuestion: quizContainer niet gevonden!");
        return;
    }
    if (quizQuestionsData.length === 0) {
        quizContainer.innerHTML = '<p>Geen vragen beschikbaar voor de quiz.</p>';
        return;
    }
    
    if (currentQuizQuestionIndex >= quizQuestionsData.length) {
        displayQuizResults();
        return;
    }

    const q = quizQuestionsData[currentQuizQuestionIndex];
    if (!q) {
        console.error(`Kon vraag data niet vinden voor index ${currentQuizQuestionIndex}`);
        quizContainer.innerHTML = `<p style=\"color:red;\">Fout: Kon vraag ${currentQuizQuestionIndex + 1} niet laden.</p>
                                   <button class=\"btn\" onclick=\"displayQuizResults()\">Toon Resultaten</button>`;
        return;
    }
    
    const existingAnswer = quizAnswers.find(a => a.id === q.id);
    const isAnswered = !!existingAnswer;

    if (!isAnswered) {
        // Shuffle opties per vraag, maar alleen als nog niet beantwoord
        // Maak een kopie om de originele data niet te wijzigen
        const optionsWithIndices = q.options.map((opt, originalIndex) => ({
            text: opt,
            originalIndex: originalIndex // 0-based
        }));

        // Shuffle de array
        for (let i = optionsWithIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsWithIndices[i], optionsWithIndices[j]] = [optionsWithIndices[j], optionsWithIndices[i]];
        }
        
        // Sla de geschudde volgorde op voor deze sessie
        q._shuffledOptions = optionsWithIndices;
    }
    
    // Gebruik de geschudde (of originele, indien al beantwoord) volgorde
    const optionsToRender = q._shuffledOptions || q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));

    const questionCounter = `<div class="question-counter">Vraag ${currentQuizQuestionIndex + 1} van ${quizQuestionsData.length}</div>`;
    const showOptionsBlockClass = !isAnswered ? 'initial-height' : '';

    let output = `
        <div class="quiz-header">
            <button class="btn btn-prev-quiz" ${currentQuizQuestionIndex === 0 ? 'disabled' : ''} onclick="prevQuizQuestion()">
                &larr; Vorige
            </button>
            <div class="question-counter-center">Vraag ${currentQuizQuestionIndex + 1} van ${quizQuestionsData.length}</div>
            <button class="btn btn-next-quiz" 
                ${(!isAnswered && currentQuizQuestionIndex < quizQuestionsData.length) ? 'disabled' : ''} 
                onclick="nextQuizQuestion()">
                ${(currentQuizQuestionIndex === quizQuestionsData.length - 1) ? 'Quiz voltooien' : 'Volgende'} &rarr;
            </button>
        </div>
        <div class="mc-question afsluitquiz-vraag ${isAnswered ? 'answered' : ''}" id="quizq-${q.id}" data-question-index="${currentQuizQuestionIndex}">
            
            <h4>${q.title || `Vraag ${currentQuizQuestionIndex + 1}`}</h4>
            <p>${q.text}</p>
            <div id="show-options-block" class="${showOptionsBlockClass}">
                ${!isAnswered ? `<button class="btn btn-show-options" id="show-options-btn">Toon antwoordopties</button>
                <div class="retrieval-tip-box">
                    <img src="images/icons/lightbulb-on.svg" alt="Tip icoon" class="tip-icon">
                    <div class="show-options-explainer">
                        <strong>Leer-tip:</strong> Het actief ophalen van het antwoord uit je geheugen (retrieval practice) zorgt voor sterkere verbindingen in je brein en een veel beter leerresultaat dan wanneer je het antwoord alleen herkent. Probeer het dus eerst zelf!
                    </div>
                </div>` : ''}
                <ul class="mc-options" id="mc-options-list" style="${!isAnswered ? 'display:none;' : ''}">
                    ${optionsToRender.map((o, renderedIndex) => {
                        let optionClasses = "mc-option";
                        if (isAnswered) {
                            optionClasses += " disabled"; 
                            // Vergelijk de originele index van de geselecteerde optie
                            if (existingAnswer.selectedOriginalIndex === o.originalIndex) {
                                optionClasses += " selected";
                                optionClasses += existingAnswer.correct ? " correct" : " incorrect";
                            }
                        }
                        // Sla de originele index op in het data-attribuut
                        return `<li class="${optionClasses}" data-question-id="${q.id}" data-original-index="${o.originalIndex}">${o.text}</li>`;
                    }).join('')}
                </ul>
            </div>
            <div class="feedback" id="feedback-quizq-${q.id}">${isAnswered && existingAnswer.feedback ? existingAnswer.feedback : ''}</div>
        </div>
    `;
    quizContainer.innerHTML = output;

    if (!isAnswered) {
        const showOptionsBtn = quizContainer.querySelector('#show-options-btn');
        const tipBox = quizContainer.querySelector('.retrieval-tip-box');
        if (showOptionsBtn && tipBox) {
            showOptionsBtn.addEventListener('click', function() {
                const optionsList = quizContainer.querySelector('#mc-options-list');
                if (optionsList) optionsList.style.display = '';
                showOptionsBtn.style.display = 'none';
                tipBox.style.display = 'none';
                const showOptionsBlock = quizContainer.querySelector('#show-options-block');
                if (showOptionsBlock) showOptionsBlock.classList.remove('initial-height');
            });
        }
        
        const options = quizContainer.querySelectorAll('.mc-option:not(.disabled)');
        options.forEach(option => {
            option.addEventListener('click', handleQuizOptionClick);
        });
    } else {
        const feedbackEl = quizContainer.querySelector(`#feedback-quizq-${q.id}`);
        if (feedbackEl && existingAnswer) {
           feedbackEl.className = 'feedback ' + (existingAnswer.correct ? 'correct' : 'incorrect');
        }
        const nextButton = quizContainer.querySelector('.btn-next-quiz');
        if (nextButton) nextButton.disabled = false;
    }
}

/**
 * Verwerkt een klik op een quiz-optie.
 * Controleert het antwoord, geeft feedback, en slaat de score op.
 */
function handleQuizOptionClick() {
    const questionId = this.getAttribute('data-question-id');
    const originalOptionIndex = parseInt(this.getAttribute('data-original-index')); // 0-based
    const questionDiv = this.closest('.mc-question');
    const questionData = quizQuestionsData.find(q => q.id === questionId);

    if (questionDiv.classList.contains('answered') || !questionData) return;

    questionDiv.querySelectorAll('.mc-option').forEach(opt => {
        opt.removeEventListener('click', handleQuizOptionClick);
        opt.classList.add('disabled');
    });

    const isCorrect = originalOptionIndex === questionData.correctAnswer;
    this.classList.add('selected');
    this.classList.add(isCorrect ? 'correct' : 'incorrect');

    const feedbackEl = questionDiv.querySelector('.feedback');
    const feedbackText = isCorrect ? questionData.feedbackCorrect : questionData.feedbackIncorrect;
    feedbackEl.textContent = feedbackText;
    feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
    
    questionDiv.classList.add('answered');
    
    let answerIndex = quizAnswers.findIndex(a => a.id === questionId);
    const answerObj = { 
        id: questionId, 
        selectedOriginalIndex: originalOptionIndex, // Sla de originele index op
        correct: isCorrect, 
        feedback: feedbackText, 
        questionText: questionData.text, 
        options: (questionData._shuffledOptions || questionData.options.map((o, i) => ({ text: o, originalIndex: i }))).map(o => o.text),
        title: questionData.title 
    };
    if (answerIndex > -1) {
        quizAnswers[answerIndex] = answerObj;
    } else {
        quizAnswers.push(answerObj);
    }
    localStorage.setItem('mc_quiz_answers', JSON.stringify(quizAnswers));

    const nextButton = document.querySelector('.btn-next-quiz');
    if (nextButton) nextButton.disabled = false;
    
    if (typeof updateAllChapterProgress === 'function') {
        updateAllChapterProgress(); 
    }
}

/**
 * Navigeert naar de volgende quizvraag.
 */
function nextQuizQuestion() {
    const allQuestionsAnswered = quizQuestionsData.every(q => quizAnswers.some(a => a.id === q.id && typeof a.selectedOriginalIndex !== 'undefined'));
    if (currentQuizQuestionIndex < quizQuestionsData.length - 1) {
        currentQuizQuestionIndex++;
        renderCurrentQuizQuestion();
    } else if (allQuestionsAnswered || currentQuizQuestionIndex === quizQuestionsData.length - 1) {
        displayQuizResults();
    } else {
         console.warn("NextQuizQuestion called on last question, but not all answered. Showing results.");
         displayQuizResults();
    }
}

/**
 * Navigeert naar de vorige quizvraag.
 */
function prevQuizQuestion() {
    if (currentQuizQuestionIndex > 0) {
        currentQuizQuestionIndex--;
        renderCurrentQuizQuestion();
    }
}

/**
 * Toont de eindresultaten van de quiz.
 */
function displayQuizResults() {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) { console.error("displayQuizResults: quizContainer niet gevonden!"); return; }

    let score = 0;
    quizAnswers.forEach(ans => {
        if (quizQuestionsData.some(q => q.id === ans.id) && ans.correct) {
            score++;
        }
    });
    const totalQuizQuestions = quizQuestionsData.length;
    const percentage = totalQuizQuestions > 0 ? (score / totalQuizQuestions) * 100 : 0;
    
    let feedbackMessage = '';
    let feedbackColor = '';
    let feedbackClass = '';
    
    if (percentage >= 80) {
        feedbackMessage = "Uitstekend, je beheerst de stof zeer goed! <strong>Tip voor je lange termijngeheugen:</strong> kom over een week of twee nog eens terug om te kijken wat er is blijven hangen. Gespreid herhalen is de sleutel tot duurzame kennis.";
        feedbackColor = '#28a745'; // Green
        feedbackClass = 'results-excellent';
    } else if (percentage >= 60) {
        feedbackMessage = "Goed gedaan! Je hebt een solide begrip van de basis. Voor een nog dieper inzicht is het aan te raden om de hoofdstukken die je lastig vond nog eens door te nemen.";
        feedbackColor = '#28a745'; // Green
        feedbackClass = 'results-passed';
    } else {
        feedbackMessage = "Je hebt een begin gemaakt, maar om de stof echt te beheersen, is het zeer verstandig om de e-learning nog een keer grondig te doorlopen. Focus op de onderdelen waar je moeite mee had.";
        feedbackColor = '#dc3545'; // Red
        feedbackClass = 'results-failed';
    }

    let resultsHTML = `
        <div id="quiz-results-container" class="${feedbackClass}">
            <div class="results-header">
                <h2>Afsluitende Quiz - Resultaten</h2>
            </div>
            <div class="results-summary">
                <div class="score-text">
                    <p>Je hebt <strong>${score} van de ${totalQuizQuestions}</strong> vragen correct beantwoord.</p>
                    <p class="score-percentage" style="color: ${feedbackColor};">${percentage.toFixed(0)}%</p>
                    <p class="quiz-results-feedback" style="color: ${feedbackColor};">${feedbackMessage}</p>
                </div>
            </div>
            <div class="quiz-actions">
                <button class="btn btn-restart-quiz" onclick="restartQuiz()">
                    <img src="images/icons/restart-icon.svg" alt="" class="btn-icon"> Quiz Herstarten
                </button>
                ${totalQuizQuestions > 0 ? `<button class="btn btn-review-answers" onclick="reviewQuizQuestion(0)"><img src="images/icons/review-icon.svg" alt="" class="btn-icon">Antwoorden terugkijken</button>` : ''}
            </div>
        </div>
        <div id="quiz-review-details-container"></div>
    `;
    quizContainer.innerHTML = resultsHTML;
    if (typeof updateAllChapterProgress === 'function') {
        updateAllChapterProgress(); 
    }
}

/**
 * Herstart de quiz vanaf het begin.
 */
function restartQuiz() {
    quizAnswers = [];
    localStorage.removeItem('mc_quiz_answers'); 
    currentQuizQuestionIndex = 0;
    if (quizQuestionsData.length === 0) { 
        loadMCQuiz(); 
    } else {
        renderCurrentQuizQuestion();
    }
}

/**
 * Toont een specifieke vraag met het antwoord van de gebruiker om na te kijken.
 * @param {number} questionIndex - De index van de vraag die bekeken moet worden.
 */
function reviewQuizQuestion(questionIndex) {
    currentQuizQuestionIndex = questionIndex; 
    const quizContainer = document.getElementById('quiz-container'); 
    const reviewDetailContainer = document.getElementById('quiz-review-details-container');

    if (!reviewDetailContainer) { 
        console.error("reviewQuizQuestion: quiz-review-details-container niet gevonden!"); 
        if(quizContainer) quizContainer.innerHTML += "<p style='color:red'>Kan review details niet laden.</p>";
        return; 
    }

    if (!quizQuestionsData || questionIndex < 0 || questionIndex >= quizQuestionsData.length) {
        reviewDetailContainer.innerHTML = `<p>Kan deze vraag niet voor terugkijken laden.</p>`;
        return;
    }

    const q = quizQuestionsData[questionIndex];
    const userAnswer = quizAnswers.find(a => a.id === q.id);
    const isCorrect = userAnswer ? userAnswer.correct : false;

    let output = `
        <div class="quiz-header">
            <button class="btn" onclick="reviewQuizQuestion(${questionIndex - 1})" ${questionIndex === 0 ? 'disabled' : ''}>&larr; Vorige</button>
            <div class="question-counter-center">Terugkijken: Vraag ${questionIndex + 1} van ${quizQuestionsData.length}</div>
            <button class="btn" onclick="reviewQuizQuestion(${questionIndex + 1})" ${questionIndex === quizQuestionsData.length - 1 ? 'disabled' : ''}>Volgende &rarr;</button>
        </div>
        <div class="mc-question afsluitquiz-vraag answered review-mode" id="review-quizq-${q.id}">
            <h4>Hoofdstuk: ${q.title}</h4>
            <p><strong>Vraag:</strong> ${q.text}</p>
            <ul class="mc-options review-options">
                ${q.options.map((opt, i) => { // i is hier de originele index (0-based)
                    let classes = 'mc-option disabled'; 
                    let icon = '';

                    if (userAnswer && userAnswer.selectedOriginalIndex === i) {
                        classes += ' selected';
                        classes += userAnswer.correct ? ' correct' : ' incorrect';
                        icon = userAnswer.correct ? '<img src="images/icons/check-circle.svg" class="option-icon correct-icon" alt="Correct">' : '<img src="images/icons/x-circle.svg" class="option-icon incorrect-icon" alt="Incorrect">' ;
                    } else if (q.correctAnswer === i) {
                        classes += ' correct-unselected'; 
                        icon = '<img src="images/icons/check-circle-outline.svg" class="option-icon correct-icon-outline" alt="Correct Answer">';
                    }
                    return `<li class="${classes}">${icon} ${opt}</li>`;
                }).join('')}
            </ul>
            <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>Feedback:</strong> ${(userAnswer && userAnswer.feedback) || (isCorrect ? q.feedbackCorrect : q.feedbackIncorrect) || "Geen feedback beschikbaar."}
            </div>
        </div>
    `;
    reviewDetailContainer.innerHTML = output; 
} 