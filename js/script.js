// Navigation and section handling
let currentSection = 1;
const totalSections = 8;

// Define questions array in global scope
const questions = [
    {
        id: 'q1',
        correctAnswer: 4,
        feedback: 'Toenemende sportdeelname is geen belangrijke reden voor de inzet van zorgtechnologie. De belangrijkste redenen zijn vergrijzing, personeelstekorten en stijgende zorgkosten.',
        title: 'Hoofdstuk 8: Vraag 1'
    },
    {
        id: 'q2',
        correctAnswer: 4,
        feedback: 'Verdiepen is geen onderdeel van het basis V-model. De basis competenties zijn: Veranderen, Vinden, Vertrouwen, Vaardig gebruiken en Vertellen.',
        title: 'Hoofdstuk 8: Vraag 2'
    },
    {
        id: 'q3',
        correctAnswer: 2,
        feedback: 'Volgens het TAM-model is nuttigheid (perceived usefulness) de belangrijkste factor voor technologie acceptatie, gevolgd door gebruiksgemak (perceived ease of use).',
        title: 'Hoofdstuk 8: Vraag 3'
    },
    {
        id: 'mc2',
        correctAnswer: 2,
        feedback: 'De GGD AppStore is specifiek ontworpen om gezondheidsapps te beoordelen op gebruiksvriendelijkheid, privacy, betrouwbaarheid en onderbouwing. Het is een onafhankelijke bron die apps test volgens landelijke richtlijnen.',
        title: 'Hoofdstuk 7: Test je kennis'
    }
];

// --- Sidebar Navigatie Logica ---
const chapters = [
  { section: 1, title: 'Introductie' },
  { section: 2, title: 'Soorten Zorgtechnologie' },
  { section: 3, title: 'De Kracht van Technologie' },
  { section: 4, title: 'Kritisch Kijken' },
  { section: 5, title: 'Adoptie & Gedrag' },
  { section: 6, title: 'Jij aan Zet' },
  { section: 7, title: 'Vinden van Zorgtechnologie' },
  { section: 8, title: 'Afsluiting' }
];

function updateProgress() {
    const progressPercentage = ((currentSection - 1) / (totalSections - 1)) * 100;
    
    // Update progress fill
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Update percentage text
    const progressText = document.getElementById('progress-percentage');
    if (progressText) {
        progressText.textContent = `${Math.round(progressPercentage)}%`;
    }
    
    // Update chapter points
    document.querySelectorAll('.chapter-point').forEach((point, index) => {
        if (index + 1 < currentSection) {
            point.classList.add('completed');
            point.classList.remove('active');
        } else if (index + 1 === currentSection) {
            point.classList.add('active');
            point.classList.remove('completed');
        } else {
            point.classList.remove('completed', 'active');
        }
    });
}

function showSection(sectionNumber) {
    // First scroll to top immediately
    window.scrollTo(0, 0);
    
    // Hide all sections first
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Show the selected section
    const targetSection = document.querySelector(`section[data-section="${sectionNumber}"]`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    
    // Update current section and progress
    currentSection = sectionNumber;
    updateProgress();
    
    // Sidebar: update active state
    document.querySelectorAll('.sidebar-chapter').forEach(ch => ch.classList.remove('active'));
    const activeSidebar = document.querySelector(`.sidebar-chapter[data-section="${sectionNumber}"]`);
    if (activeSidebar) activeSidebar.classList.add('active');
    
    // Force scroll to top after a small delay to ensure DOM updates are complete
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });
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

// Multiple Choice functionality
function initializeMultipleChoice() {
    console.log('Initializing Multiple Choice questions...');
    // Add click handlers for all multiple choice options
    const mcOptions = document.querySelectorAll('.mc-option');
    console.log(`Found ${mcOptions.length} MC options`);
    mcOptions.forEach((option, index) => {
        // Zorg dat oude event listeners niet dubbel worden toegevoegd
        option.replaceWith(option.cloneNode(true));
    });
    // Herpak de opties na cloneNode
    const mcOptionsFresh = document.querySelectorAll('.mc-option');
    mcOptionsFresh.forEach((option, index) => {
        option.addEventListener('click', function(e) {
            // Check of deze optie al disabled is
            if (this.classList.contains('disabled')) return;
            // Get the question container and feedback element
            const questionContainer = this.closest('.mc-question');
            const feedbackElement = questionContainer.querySelector('.feedback');
            const questionId = feedbackElement.id.split('-')[0];
            // Find the question data
            const question = questions.find(q => q.id === questionId);
            if (!question) {
                console.error(`Question data not found for ID: ${questionId}`);
                return;
            }
            const selectedId = parseInt(this.getAttribute('data-id'));
            // Remove selected class from all options in this question
            questionContainer.querySelectorAll('.mc-option').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
            });
            // Add selected class to clicked option
            this.classList.add('selected');
            // Check if answer is correct
            const isCorrect = selectedId === question.correctAnswer;
            // Add correct/incorrect class
            this.classList.add(isCorrect ? 'correct' : 'incorrect');
            // Show feedback
            feedbackElement.textContent = question.feedback;
            feedbackElement.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
            // Save MC score (altijd met qX_ prefix)
            localStorage.setItem(`${questionId}_correct`, isCorrect ? 1 : 0);
            localStorage.setItem(`${questionId}_total`, 1);
            saveMCScore(questionId, isCorrect ? 1 : 0, 1);
            // Disable all options for this question
            questionContainer.querySelectorAll('.mc-option').forEach(opt => {
                opt.classList.add('disabled');
                opt.style.cursor = 'not-allowed';
            });
        });
        // Bij laden: als al beantwoord, direct disabled maken
        const questionContainer = option.closest('.mc-question');
        if (questionContainer) {
            const feedbackElement = questionContainer.querySelector('.feedback');
            const questionId = feedbackElement.id.split('-')[0];
            const alreadyAnswered = localStorage.getItem(`${questionId}_total`);
            if (alreadyAnswered) {
                option.classList.add('disabled');
                option.style.cursor = 'not-allowed';
            }
        }
    });
}

// --- Drag & Drop logica per hoofdstuk ---
function initializeDragAndDrop() {
    // Hoofdstuk 2
    const draggables2 = document.querySelectorAll('#section2 .draggable');
    const dropTargets2 = document.querySelectorAll('#section2 .drop-target');
    draggables2.forEach(draggable => {
        draggable.setAttribute('draggable', true);
        draggable.addEventListener('dragstart', function(e) {
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
        });
        draggable.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    dropTargets2.forEach(target => {
        target.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        target.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        target.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggable = document.querySelector('#section2 .draggable[data-id="' + draggedId + '"]');
            if (draggable && draggable.parentElement) {
                draggable.parentElement.removeChild(draggable);
            }
            this.appendChild(draggable);
            checkDragDropResults2();
        });
    });

    // Hoofdstuk 3
    const draggables3 = document.querySelectorAll('#section3 .draggable');
    const dropTargets3 = document.querySelectorAll('#section3 .drop-target');
    draggables3.forEach(draggable => {
        draggable.setAttribute('draggable', true);
        draggable.addEventListener('dragstart', function(e) {
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
        });
        draggable.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    dropTargets3.forEach(target => {
        target.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        target.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        target.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggable = document.querySelector('#section3 .draggable[data-id="' + draggedId + '"]');
            if (draggable && draggable.parentElement) {
                draggable.parentElement.removeChild(draggable);
            }
            this.appendChild(draggable);
            checkDragDropResults3();
        });
    });
}

// Hoofdstuk 2: Categoriseer de Voorbeelden
function checkDragDropResults2() {
    const dropTargets = document.querySelectorAll('#section2 .drop-target');
    let correctCount = 0;
    let totalPlaced = 0;
    // Juiste combinaties:
    // 1: Fysio.ai, 2: Blazepods, 3: Corpus VR, 4: Physitrack
    const correctCombinations = {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4'
    };
    dropTargets.forEach(target => {
        const targetId = target.getAttribute('data-id');
        const draggable = target.querySelector('.draggable');
        if (draggable) {
            totalPlaced++;
            const draggableId = draggable.getAttribute('data-id');
            if (correctCombinations[targetId] === draggableId) {
                correctCount++;
                draggable.classList.add('correct');
                draggable.classList.remove('incorrect');
            } else {
                draggable.classList.add('incorrect');
                draggable.classList.remove('correct');
            }
        }
    });
    // Feedback
    let feedback = document.getElementById('dragdrop2-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'dragdrop2-feedback';
        feedback.className = 'dragdrop-feedback';
        dropTargets[dropTargets.length-1].after(feedback);
    }
    if (totalPlaced === dropTargets.length) {
        if (correctCount === totalPlaced) {
            feedback.innerHTML = "Goed gedaan! Je hebt alle voorbeelden correct gecategoriseerd.";
            feedback.classList.remove('incorrect');
            feedback.classList.add('correct');
        } else {
            feedback.innerHTML = "Niet alle voorbeelden zijn correct geplaatst. Probeer het opnieuw.";
            feedback.classList.remove('correct');
            feedback.classList.add('incorrect');
        }
        saveDragDropScore2(correctCount, totalPlaced);
    } else {
        feedback.innerHTML = '';
    }
}
function saveDragDropScore2(correct, total) {
    localStorage.setItem('dragdrop2_correct', correct);
    localStorage.setItem('dragdrop2_total', total);
    updateAllChapterProgress();
}

// Hoofdstuk 3: Koppel technologie aan voordelen
function checkDragDropResults3() {
    const dropTargets = document.querySelectorAll('#section3 .drop-target');
    let correctCount = 0;
    let totalPlaced = 0;
    // Juiste combinaties:
    // 1: Bewegingsanalyse-apps (Fysio.ai), 2: Virtual Reality (Corpus VR), 3: eHealth Platforms (Physitrack)
    const correctCombinations = {
        '1': '1', // Bewegingsanalyse-apps <-> Verhoogde therapietrouw
        '2': '2', // Virtual Reality <-> Objectieve bewegingsanalyse
        '3': '3'  // eHealth Platforms <-> Motiverende gameomgeving
    };
    dropTargets.forEach(target => {
        const targetId = target.getAttribute('data-id');
        const draggable = target.querySelector('.draggable');
        if (draggable) {
            totalPlaced++;
            const draggableId = draggable.getAttribute('data-id');
            if (correctCombinations[targetId] === draggableId) {
                correctCount++;
                draggable.classList.add('correct');
                draggable.classList.remove('incorrect');
            } else {
                draggable.classList.add('incorrect');
                draggable.classList.remove('correct');
            }
        }
    });
    // Feedback
    let feedback = document.getElementById('dragdrop3-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'dragdrop3-feedback';
        feedback.className = 'dragdrop-feedback';
        dropTargets[dropTargets.length-1].after(feedback);
    }
    if (totalPlaced === dropTargets.length) {
        if (correctCount === totalPlaced) {
            feedback.innerHTML = "Goed gedaan! Je hebt alle technologieën correct gekoppeld aan de voordelen.";
            feedback.classList.remove('incorrect');
            feedback.classList.add('correct');
        } else {
            feedback.innerHTML = "Niet alle koppelingen zijn correct. Probeer het opnieuw.";
            feedback.classList.remove('correct');
            feedback.classList.add('incorrect');
        }
        saveDragDropScore3(correctCount, totalPlaced);
    } else {
        feedback.innerHTML = '';
    }
}
function saveDragDropScore3(correct, total) {
    localStorage.setItem('dragdrop3_correct', correct);
    localStorage.setItem('dragdrop3_total', total);
    updateAllChapterProgress();
}

// Reflection questions
function saveReflection(sectionNumber) {
    const reflectionInput = document.getElementById(`reflection${sectionNumber}`);
    const answer = reflectionInput.value.trim();
    
    if (answer.length < 50) {
        alert('Je antwoord moet minimaal 50 tekens bevatten.');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem(`reflection_${sectionNumber}`, answer);
    
    // Show confirmation
    alert('Je reflectie is opgeslagen!');
}

// Save scores
function saveMCScore(questionNumber, correct, total) {
    localStorage.setItem(`mc${questionNumber}_correct`, correct);
    localStorage.setItem(`mc${questionNumber}_total`, total);
    
    // Update total MC score
    const mc1Correct = parseInt(localStorage.getItem('mc1_correct') || 0);
    const mc2Correct = parseInt(localStorage.getItem('mc2_correct') || 0);
    localStorage.setItem('mc_correct', mc1Correct + mc2Correct);
    localStorage.setItem('mc_total', 2);
}

function updateAllChapterProgress() {
  let chapterProgress = Array(chapters.length).fill(0);
  // Hoofdstuk 1: reflectie ingevuld = compleet
  if (localStorage.getItem('reflection_1')) chapterProgress[0] = 1;
  // Hoofdstuk 2: reflectie én dragdrop2 (beide = 1, één = 0.5)
  let h2 = 0;
  if (localStorage.getItem('reflection_2')) h2++;
  const dragdrop2 = parseInt(localStorage.getItem('dragdrop2_correct') || 0);
  if (dragdrop2 > 0) h2++;
  if (h2 === 2) chapterProgress[1] = 1;
  else if (h2 === 1) chapterProgress[1] = 0.5;
  // Hoofdstuk 3: reflectie én dragdrop3 (beide = 1, één = 0.5)
  let h3 = 0;
  if (localStorage.getItem('reflection_3')) h3++;
  const dragdrop3 = parseInt(localStorage.getItem('dragdrop3_correct') || 0);
  if (dragdrop3 > 0) h3++;
  if (h3 === 2) chapterProgress[2] = 1;
  else if (h3 === 1) chapterProgress[2] = 0.5;
  // ... bestaande code voor hoofdstuk 4 t/m 8 ...
  let h4 = 0;
  if (localStorage.getItem('reflection_4')) h4++;
  // Verbeterde check voor critical_analysis
  let analysis = null;
  try {
    analysis = JSON.parse(localStorage.getItem('critical_analysis'));
  } catch (e) { analysis = null; }
  if (analysis && analysis.tech && analysis.strengths && analysis.challenges && analysis.implementation) h4++;
  if (h4 === 2) chapterProgress[3] = 1;
  else if (h4 > 0) chapterProgress[3] = 0.5;
  if (localStorage.getItem('reflection_5')) chapterProgress[4] = 1;
  let h6 = 0;
  if (localStorage.getItem('reflection_6')) h6++;
  if (localStorage.getItem('self_assessment')) h6++;
  if (h6 === 2) chapterProgress[5] = 1;
  else if (h6 === 1) chapterProgress[5] = 0.5;
  let h7 = 0;
  if (localStorage.getItem('reflection_7')) h7++;
  if (localStorage.getItem('mc2_correct')) h7++;
  if (h7 === 2) chapterProgress[6] = 1;
  else if (h7 === 1) chapterProgress[6] = 0.5;
  const section8 = document.getElementById('section8');
  if (section8) {
    const answered = section8.querySelectorAll('.mc-option.selected').length;
    if (answered === 3) chapterProgress[7] = 1;
    else if (answered > 0) chapterProgress[7] = 0.5;
  }
  localStorage.setItem('chapterProgress', JSON.stringify(chapterProgress));
  updateSidebarProgress();
}

// Roep updateAllChapterProgress aan na elke relevante actie:
// Reflectie
const origSaveReflection = saveReflection;
saveReflection = function(sectionNumber) {
  origSaveReflection(sectionNumber);
  updateAllChapterProgress();
};
// MC
const origSaveMCScore = saveMCScore;
saveMCScore = function(questionNumber, correct, total) {
  origSaveMCScore(questionNumber, correct, total);
  updateAllChapterProgress();
};

function updateSidebarProgress() {
  // Simuleer voortgang per hoofdstuk (vervang door echte logica)
  // 0 = niet begonnen, 0.5 = deels, 1 = compleet
  let chapterProgress = JSON.parse(localStorage.getItem('chapterProgress')) || Array(chapters.length).fill(0);
  let completed = chapterProgress.filter(p => p === 1).length;
  let half = chapterProgress.filter(p => p === 0.5).length;
  let total = chapters.length;
  let percent = Math.round((completed + 0.5 * half) / total * 100);

  // Update cirkels
  chapters.forEach((ch, idx) => {
    const circle = document.getElementById(`circle-${ch.section}`);
    circle.classList.remove('completed', 'half');
    if (chapterProgress[idx] === 1) {
      circle.classList.add('completed');
    } else if (chapterProgress[idx] === 0.5) {
      circle.classList.add('half');
    }
  });

  // Update visuele voortgang
  const visual = document.getElementById('sidebarProgressVisual');
  if (visual) {
    visual.style.background = `conic-gradient(var(--primary-color) 0% ${percent}%, var(--medium-gray) ${percent}% 100%)`;
  }
  const text = document.getElementById('sidebarProgressText');
  if (text) text.textContent = percent + '%';
}

function setChapterProgress(section, value) {
  let chapterProgress = JSON.parse(localStorage.getItem('chapterProgress')) || Array(chapters.length).fill(0);
  chapterProgress[section - 1] = value;
  localStorage.setItem('chapterProgress', JSON.stringify(chapterProgress));
  updateSidebarProgress();
}

function setupSidebarNavigation() {
  const sidebarChapters = document.querySelectorAll('.sidebar-chapter');
  sidebarChapters.forEach(chapter => {
    chapter.addEventListener('click', function() {
      const section = parseInt(this.getAttribute('data-section'));
      showSection(section);
      // Close sidebar on mobile after selecting a chapter
      if (window.innerWidth <= 900) {
        const sidebar = document.getElementById('sidebarNav');
        if (sidebar) sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      }
    });
  });
}

function setupSidebarHamburger() {
  console.log('Setting up sidebar hamburger...'); // Debug log
  const sidebarHamburger = document.getElementById('sidebarHamburger');
  const floatingHamburger = document.getElementById('floatingHamburger'); // Get the floating button
  const sidebar = document.getElementById('sidebarNav');

  if (!sidebar) {
    console.error('Sidebar element #sidebarNav not found!');
    return;
  }

  function toggleSidebar(event) {
    console.log('Toggle sidebar triggered by:', event.currentTarget.id); // Debug log
    sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
  }

  if (sidebarHamburger) {
      console.log('Found sidebarHamburger, adding listener.'); // Debug log
      sidebarHamburger.addEventListener('click', toggleSidebar);
  } else {
      console.warn('Sidebar hamburger element #sidebarHamburger not found.'); // Debug log
  }

  if (floatingHamburger) {
      console.log('Found floatingHamburger, adding listener.'); // Debug log
      floatingHamburger.addEventListener('click', toggleSidebar); // Add listener to floating button
  } else {
      console.warn('Floating hamburger element #floatingHamburger not found.'); // Debug log
  }

  // Sluit sidebar bij klik buiten (mobiel)
  document.addEventListener('click', function(e) {
    // Check if sidebar exists and is open, and if the click was outside
    if (sidebar && sidebar.classList.contains('open') && window.innerWidth <= 900) {
        // Check if the click target is NOT the sidebar or inside it,
        // AND NOT one of the hamburger buttons or inside them.
        const isClickInsideSidebar = sidebar.contains(e.target);
        const isClickOnSidebarHamburger = sidebarHamburger && sidebarHamburger.contains(e.target);
        const isClickOnFloatingHamburger = floatingHamburger && floatingHamburger.contains(e.target);

        if (!isClickInsideSidebar && !isClickOnSidebarHamburger && !isClickOnFloatingHamburger) {
            console.log('Click outside detected, closing sidebar.'); // Debug log
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
       }
    }
  });
}

// --- SINGLE DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded - Initializing all components');

  // Initialize basic navigation first
  setupSidebarNavigation(); // Sets up clicks on chapter titles
  setupSidebarHamburger();  // Sets up clicks on BOTH hamburger buttons

  // Initialize interactive elements
  initializeMultipleChoice();
  initializeDragAndDrop();

  // Set initial state
  updateSidebarProgress(); // Calculate initial progress display
  showSection(1);          // Show the first section
  updateAllChapterProgress(); // Ensure progress reflects any loaded data

  console.log('All initializations complete.');
});

// Voorbeeld: markeer hoofdstuk als half of compleet (vervang door echte logica)
// setChapterProgress(1, 1); // Hoofdstuk 1 compleet
// setChapterProgress(2, 0.5); // Hoofdstuk 2 half
// setChapterProgress(3, 0); // Hoofdstuk 3 niet begonnen

async function generatePDF() {
    const studentName = document.getElementById('student-name').value.trim();
    
    if (!studentName) {
        alert('Vul alstublieft uw naam in voordat u het certificaat genereert.');
        return;
    }

    // Laad het logo als base64 (async)
    async function getLogoBase64() {
        const response = await fetch('images/logo-health-transparant1.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }
    const logoBase64 = await getLogoBase64();

    // Kleuren
    const purple = '#662483';
    const accent = '#F2E6F7';
    const gray = '#e9ecef';

    // Maak een nieuwe jsPDF instantie
    const doc = new jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // --- CERTIFICAAT PAGINA ---
    // Logo bovenaan
    doc.addImage(logoBase64, 'PNG', 100, 12, 90, 28, undefined, 'FAST');

    // Paarse lijn onder logo
    doc.setDrawColor(purple);
    doc.setLineWidth(2);
    doc.line(40, 45, 250, 45);

    // Titel
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(purple);
    doc.setFontSize(32);
    doc.text('Certificaat van Voltooiing', 148.5, 65, { align: 'center' });

    // Subtitel
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);
    doc.text('Basis E-learning Zorgtechnologie', 148.5, 80, { align: 'center' });

    // Paarse lijn onder subtitel
    doc.setDrawColor(purple);
    doc.setLineWidth(1);
    doc.line(70, 86, 227, 86);

    // Naam student
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(purple);
    doc.text(studentName, 148.5, 105, { align: 'center' });

    // Certificaattekst
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(44, 62, 80);
    const description = 'heeft aangetoond zich verdiept te hebben in de basis van zorgtechnologie voor de fysiotherapie door het succesvol afronden van deze e-learning.';
    doc.text(description, 148.5, 120, { align: 'center', maxWidth: 220 });

    // Datum
    const date = new Date().toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text(`Datum: ${date}`, 148.5, 135, { align: 'center' });

    // Handtekeningregel
    doc.setDrawColor(gray);
    doc.setLineWidth(0.5);
    doc.line(110, 155, 187, 155);
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text('iXperium Health - HAN', 148.5, 162, { align: 'center' });

    // --- BIJLAGEN ---
    doc.addPage('a4', 'p'); // Portrait orientation for attachments

    // Logo klein linksboven
    doc.addImage(logoBase64, 'PNG', 15, 10, 40, 13, undefined, 'FAST');

    // Titel bijlagen
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(purple);
    doc.text('Bijlagen', 105, 25, { align: 'center' });
    doc.setDrawColor(purple);
    doc.setLineWidth(1);
    doc.line(20, 30, 190, 30);

    let yPos = 40; // Starting Y position for content
    const lineHeight = 7; // Line height for text

    // 1. Leerdoelen
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(purple);
    doc.text('Leerdoelen', 20, yPos);
    yPos += lineHeight;
    yPos += 2; // Extra ruimte vóór lijn
    doc.setDrawColor(gray);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 4; // Extra ruimte na lijn

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    const leerdoelen = [
        'De relevantie en urgentie van zorgtechnologie voor de fysiotherapie uitleggen, gekoppeld aan maatschappelijke uitdagingen.',
        'Concrete voorbeelden van zorgtechnologie herkennen en hun potentiële toepassing benoemen.',
        'De belangrijkste voordelen van zorgtechnologie in de fysiotherapie benoemen.',
        'Kritisch nadenken over de selectie en implementatie van zorgtechnologie.',
        'Het Technology Acceptance Model (TAM) uitleggen en de link leggen met gedragsverandering.',
        'Het V-model voor digitale competenties in de zorg uitleggen en de relevantie erkennen.',
        'Betrouwbare bronnen voor zorgtechnologie informatie vinden.',
        'Reflecteren op je eigen houding en vaardigheden t.o.v. zorgtechnologie.'
    ];
    leerdoelen.forEach(doel => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        const splitDoel = doc.splitTextToSize('• ' + doel, 170);
        doc.text(splitDoel, 20, yPos);
        yPos += (splitDoel.length * 6);
    });

    // 2. Reflecties
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(purple);
    doc.text('Reflecties', 20, yPos);
    yPos += lineHeight;
    yPos += 2; // Extra ruimte vóór lijn
    doc.setDrawColor(gray);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 4; // Extra ruimte na lijn
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    for (let i = 1; i <= 7; i++) {
        const reflection = localStorage.getItem(`reflection_${i}`);
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(purple);
        doc.text(`Reflectie hoofdstuk ${i}:`, 20, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        if (reflection) {
            doc.setTextColor(44, 62, 80);
            const splitReflection = doc.splitTextToSize(reflection, 170);
            doc.text(splitReflection, 20, yPos);
            yPos += (splitReflection.length * 6) + 5;
        } else {
            doc.setTextColor('#ff9800');
            doc.text('Geen antwoord gegeven door student', 20, yPos);
            yPos += lineHeight + 2;
        }
    }

    // 3. Multiple Choice Scores
    yPos += lineHeight;
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(purple);
    doc.text('Multiple Choice Resultaten', 20, yPos);
    yPos += lineHeight;
    yPos += 2; // Extra ruimte vóór lijn
    doc.setDrawColor(gray);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 4; // Extra ruimte na lijn
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    questions.forEach((q, index) => {
        const correct = parseInt(localStorage.getItem(`${q.id}_correct`));
        const total = parseInt(localStorage.getItem(`${q.id}_total`));
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(purple);
        const title = q.title || `Vraag ${index + 1}`;
        doc.text(title, 20, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        if (!isNaN(correct) && !isNaN(total)) {
            doc.setTextColor(44, 62, 80);
            doc.text(`${correct}/${total} correct`, 28, yPos);
            yPos += lineHeight;
        } else {
            doc.setTextColor('#ff9800');
            doc.text('Geen antwoord gegeven door student', 28, yPos);
            yPos += lineHeight;
        }
    });

    // 4. Drag & Drop Scores
    yPos += lineHeight;
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(purple);
    doc.text('Drag & Drop Resultaten', 20, yPos);
    yPos += lineHeight;
    yPos += 2; // Extra ruimte vóór lijn
    doc.setDrawColor(gray);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 4; // Extra ruimte na lijn
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    // Dragdrop 2
    const dragdrop2Correct = parseInt(localStorage.getItem('dragdrop2_correct'));
    const dragdrop2Total = parseInt(localStorage.getItem('dragdrop2_total'));
    if (yPos > 270) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(purple);
    doc.text('Categoriseer de Voorbeelden:', 20, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    if (!isNaN(dragdrop2Correct) && !isNaN(dragdrop2Total)) {
        doc.setTextColor(44, 62, 80);
        doc.text(`${dragdrop2Correct}/${dragdrop2Total} correct`, 28, yPos);
        yPos += lineHeight;
    } else {
        doc.setTextColor('#ff9800');
        doc.text('Geen antwoord gegeven door student', 28, yPos);
        yPos += lineHeight;
    }
    // Dragdrop 3
    const dragdrop3Correct = parseInt(localStorage.getItem('dragdrop3_correct'));
    const dragdrop3Total = parseInt(localStorage.getItem('dragdrop3_total'));
    if (yPos > 270) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(purple);
    doc.text('Koppel Technologie aan Voordelen:', 20, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    if (!isNaN(dragdrop3Correct) && !isNaN(dragdrop3Total)) {
        doc.setTextColor(44, 62, 80);
        doc.text(`${dragdrop3Correct}/${dragdrop3Total} correct`, 28, yPos);
        yPos += lineHeight;
    } else {
        doc.setTextColor('#ff9800');
        doc.text('Geen antwoord gegeven door student', 28, yPos);
        yPos += lineHeight;
    }

    // 5. Zelfbeoordeling Basis V-Competenties
    yPos += lineHeight;
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(purple);
    doc.text('Zelfbeoordeling Basis V-Competenties (Hoofdstuk 6)', 20, yPos);
    yPos += lineHeight;
    yPos += 2; // Extra ruimte vóór lijn
    doc.setDrawColor(gray);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 4; // Extra ruimte na lijn
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let selfAssessment = null;
    try {
        selfAssessment = JSON.parse(localStorage.getItem('self_assessment'));
    } catch (e) { selfAssessment = null; }
    if (selfAssessment && typeof selfAssessment === 'object' && Object.keys(selfAssessment).length === 5) {
        const labels = {
            veranderen: 'Veranderen',
            vinden: 'Vinden',
            vertrouwen: 'Vertrouwen',
            vaardig: 'Vaardig gebruiken',
            vertellen: 'Vertellen'
        };
        const valueLabels = {
            '1': '1 - Beginnend',
            '2': '2 - In ontwikkeling',
            '3': '3 - Bekwaam'
        };
        for (const key of Object.keys(labels)) {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(purple);
            doc.text(labels[key] + ':', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(44, 62, 80);
            const val = selfAssessment[key];
            doc.text(valueLabels[val] || '-', 60, yPos);
            yPos += lineHeight;
        }
    } else {
        doc.setTextColor('#ff9800');
        doc.text('Geen antwoord gegeven door student', 20, yPos);
        yPos += lineHeight;
    }

    // 2b. Kritische Analyse
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(purple);
    doc.text('Kritische Analyse (Hoofdstuk 4)', 20, yPos);
    yPos += lineHeight;
    yPos += 2; // Extra ruimte vóór lijn
    doc.setDrawColor(gray);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 4; // Extra ruimte na lijn
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    let analysis = null;
    try {
        analysis = JSON.parse(localStorage.getItem('critical_analysis'));
    } catch (e) { analysis = null; }
    if (analysis && analysis.tech && analysis.strengths && analysis.challenges && analysis.implementation) {
        const techLabels = {
            'fysio-ai': 'Fysio.ai',
            'blazepods': 'Blazepods',
            'corpus-vr': 'Corpus VR',
            'physitrack': 'Physitrack'
        };
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(purple);
        doc.text('Gekozen technologie:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(44, 62, 80);
        doc.text(techLabels[analysis.tech] || analysis.tech, 70, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(purple);
        doc.text('Sterke punten:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(44, 62, 80);
        const splitStrengths = doc.splitTextToSize(analysis.strengths, 160);
        doc.text(splitStrengths, 20, yPos + lineHeight - 3);
        yPos += (splitStrengths.length * 6) + 2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(purple);
        doc.text('Uitdagingen:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(44, 62, 80);
        const splitChallenges = doc.splitTextToSize(analysis.challenges, 160);
        doc.text(splitChallenges, 20, yPos + lineHeight - 3);
        yPos += (splitChallenges.length * 6) + 2;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(purple);
        doc.text('Implementatie:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(44, 62, 80);
        const splitImplementation = doc.splitTextToSize(analysis.implementation, 160);
        doc.text(splitImplementation, 20, yPos + lineHeight - 3);
        yPos += (splitImplementation.length * 6) + 2;
    } else {
        doc.setTextColor('#ff9800');
        doc.text('Geen analyse ingevuld door student', 20, yPos);
        yPos += lineHeight;
    }

    // Download het PDF bestand
    doc.save(`Certificaat_Zorgtechnologie_${studentName.replace(/\s+/g, '_')}.pdf`);
}

function saveSelfAssessment() {
    const veranderen = document.getElementById('veranderen').value;
    const vinden = document.getElementById('vinden').value;
    const vertrouwen = document.getElementById('vertrouwen').value;
    const vaardig = document.getElementById('vaardig').value;
    const vertellen = document.getElementById('vertellen').value;
    if (!veranderen || !vinden || !vertrouwen || !vaardig || !vertellen) {
        alert('Beantwoord alle competenties voordat je opslaat.');
        return;
    }
    const assessment = {
        veranderen,
        vinden,
        vertrouwen,
        vaardig,
        vertellen
    };
    localStorage.setItem('self_assessment', JSON.stringify(assessment));
    alert('Je zelfbeoordeling is opgeslagen!');
    updateAllChapterProgress && updateAllChapterProgress();
}

function saveAnalysis() {
    const tech = document.getElementById('tech-choice').value;
    const strengths = document.getElementById('strengths').value.trim();
    const challenges = document.getElementById('challenges').value.trim();
    const implementation = document.getElementById('implementation').value.trim();
    if (!tech || !strengths || !challenges || !implementation) {
        alert('Beantwoord alle vragen voordat je opslaat.');
        return;
    }
    const analysis = {
        tech,
        strengths,
        challenges,
        implementation
    };
    localStorage.setItem('critical_analysis', JSON.stringify(analysis));
    alert('Je analyse is opgeslagen!');
    updateAllChapterProgress && updateAllChapterProgress();
}

