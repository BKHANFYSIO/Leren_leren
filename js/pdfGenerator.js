// pdfGenerator.js - PDF Certificate generator functionality

console.log('pdfGenerator.js loaded - PDF functionality would be implemented here');

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Marges
    const topMargin = 48;
    const bottomMargin = 48;
    const sideMargin = 48;

    // Load config data
    const config = await fetch('content/config.json').then(r => r.json());

    // --- 1. Voorpagina ---
    const nameInput = document.getElementById('student-name');
    const studentName = nameInput ? nameInput.value.trim() : '';
    if (!studentName) {
        alert('Vul je naam in om het certificaat te genereren.');
        if (nameInput) nameInput.focus();
        return;
    }
    const today = new Date();
    const datum = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;

    // Subtiele achtergrondkleur ALLEEN voor de buitenkant van de eerste pagina
    doc.setFillColor('#F8F6FF');
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    // Witte achtergrond binnen de groene lijn
    doc.setFillColor('#FFFFFF');
    doc.rect(sideMargin, topMargin, pageWidth-2*sideMargin, pageHeight-2*topMargin, 'F');

    // Groene kader
    doc.setDrawColor(config.stijl.primairKleur);
    doc.setLineWidth(2);
    doc.rect(sideMargin, topMargin, pageWidth-2*sideMargin, pageHeight-2*topMargin);

    // --- Rest van de pagina's hebben standaard witte achtergrond ---
    // Verwijder alle eerdere setFillColor('#F8F6FF') en rect(0, 0, pageWidth, pageHeight, 'F') voor andere pagina's

    // Logo's
    const hanLogo = 'images/Blijvende_afb/HAN_logo1a.png';
    const ixLogo = config.logo;
    // Helper voor aspect ratio
    async function addImageToDoc(imgPath, x, y, maxW, maxH, alignCenter = false) {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = function() {
                let w = img.width;
                let h = img.height;
                const ratio = Math.min(maxW / w, maxH / h);
                w = w * ratio;
                h = h * ratio;
                let drawX = x;
                if (alignCenter) drawX = x - w / 2;
                doc.addImage(img, 'PNG', drawX, y, w, h);
                resolve();
            };
            img.src = imgPath;
        });
    }

    // iXperium-logo bovenaan, gecentreerd, groter en met marge tot bovenrand
    const ixLogoMaxW = pageWidth * 0.45;
    const ixLogoMaxH = 80;
    let y = topMargin + 18;
    await addImageToDoc(ixLogo, pageWidth/2, y, ixLogoMaxW, ixLogoMaxH, true);
    y += ixLogoMaxH + 32; // Meer ruimte onder het logo

    // Titel (met automatische regelafbreking)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(config.stijl.primairKleur);
    const splitTitle = doc.splitTextToSize(config.titel, pageWidth-2*sideMargin-40);
    doc.text(splitTitle, pageWidth/2, y, { align: 'center' });
    y += splitTitle.length * 28 + 24; // Meer ruimte na de titel

    // Toelichting
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    doc.setTextColor('#000');
    doc.text('Hierbij wordt verklaard dat', pageWidth/2, y, { align: 'center' });
    y += 28; // Grotere marge na toelichting

    // NAAM - extra groot, vet, met veel witruimte boven en onder
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    y += 24; // Extra witruimte boven de naam
    doc.text(studentName, pageWidth/2, y, { align: 'center' });
    y += 40; // Extra witruimte onder de naam

    // Ondertekst
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('de e-learning module heeft doorlopen en actief heeft gewerkt aan de leerdoelen op de volgende pagina.', pageWidth/2, y, { align: 'center', maxWidth: pageWidth-2*sideMargin-40 });
    y += 32;

    // Datum netjes boven de ondermarge
    // let dateY = pageHeight - bottomMargin - 70;
    // doc.setFontSize(12);
    // doc.text(`Datum: ${datum}`, pageWidth/2, dateY, { align: 'center' });

    // HAN-logo onderaan, gecentreerd en groot, maar altijd binnen de rand
    const hanLogoMaxW = pageWidth * 0.5;
    const hanLogoMaxH = 60;
    const hanLogoY = pageHeight - bottomMargin - hanLogoMaxH - 18;
    // Datum netjes boven het HAN-logo
    const dateYHan = hanLogoY - 24;
    doc.setFontSize(12);
    doc.text(`Datum: ${datum}`, pageWidth/2, dateYHan, { align: 'center' });
    await addImageToDoc(hanLogo, pageWidth/2, hanLogoY, hanLogoMaxW, hanLogoMaxH, true);

    // Copyright netjes onder het HAN-logo
    doc.setFontSize(10);
    doc.setTextColor('#888');
    doc.text(`© ${new Date().getFullYear()} ${config.organisatie}`, pageWidth/2, pageHeight - bottomMargin + 18, { align: 'center' });
    doc.setTextColor('#000');

    // Variabele voor totaal aantal pagina's, wordt later bijgewerkt
    let totalPagesPlaceholder = 'totalPagesPlaceholder';

    // --- 2. Leerdoelen en reflectie ---
    doc.addPage();
    doc.setFillColor('#FFFFFF');
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    let pageNum = 2;
    let yPos2 = topMargin + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(config.stijl.primairKleur);
    doc.text('Leerdoelen bij deze elearning:', sideMargin, yPos2);
    yPos2 += 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#000');
    config.leerdoelen.forEach((leerdoel, index) => {
        if (yPos2 > pageHeight-bottomMargin-60) {
            doc.addPage();
            // Subtiele achtergrondkleur voor elke nieuwe pagina
            doc.setFillColor('#FFFFFF');
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            yPos2 = topMargin + 18;
            pageNum++;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`Leerdoel ${index + 1}:`, sideMargin, yPos2);
        yPos2 += 15;
        doc.setFont('helvetica', 'normal');
        const split = doc.splitTextToSize(leerdoel, pageWidth-2*sideMargin-20);
        doc.text(split, sideMargin+20, yPos2);
        yPos2 += split.length * 18 + 10;
    });
    doc.setFontSize(9);
    doc.setTextColor('#888');
    doc.text(`Pagina 2 van ${totalPagesPlaceholder}`, pageWidth-sideMargin-10, pageHeight-bottomMargin+8, { align: 'right' });

    // --- 3. Quizoverzicht (afsluitquiz) ---
    doc.addPage();
    doc.setFillColor('#FFFFFF');
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pageNum = 3;
    let yPos3 = topMargin + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(config.stijl.primairKleur);
    doc.text('Afsluitende Quiz: Jouw Antwoorden', sideMargin, yPos3);
    yPos3 += 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor('#222');
    // Laad quizdata en antwoorden
    const afsluitQuiz = await fetch('content/afsluitquiz.json').then(r => r.json());
    const quizAns = JSON.parse(localStorage.getItem('mc_quiz_answers') || '[]');
    afsluitQuiz.forEach((q, idx) => {
        if (yPos3 > pageHeight-bottomMargin-120) { 
            doc.addPage(); 
            // Subtiele achtergrondkleur voor elke nieuwe pagina
            doc.setFillColor('#FFFFFF');
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            yPos3 = topMargin + 18; 
            pageNum++; 
        }
        // Vraag
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor('#222');
        const splitQ = doc.splitTextToSize(`${idx+1}. ${q.text}`, pageWidth-2*sideMargin-20);
        doc.text(splitQ, sideMargin, yPos3);
        yPos3 += splitQ.length * 16 + 2;
        // Antwoord
        let ans = quizAns.find(a => a.id === q.id);
        let correct = ans && ans.correct;
        let antwoordText = ans && typeof ans.selectedOriginalIndex !== 'undefined' && q.options ? (q.options[ans.selectedOriginalIndex] || 'Ongeldige optie') : '[Geen antwoord ingevuld]';
        
        // Combineer label en antwoord voor afbreking
        const volledigeAntwoordTekst = `Jouw antwoord: ${antwoordText} (${correct ? 'Goed' : 'Fout'})`;
        const splitA = doc.splitTextToSize(volledigeAntwoordTekst, pageWidth-2*sideMargin-20);
        
        let kleur = correct ? '#e8f5e9' : '#ffebee';
        let textKleur = correct ? '#2e7d32' : '#c62828';
        doc.setFillColor(kleur);
        doc.setDrawColor('#fff');
        doc.rect(sideMargin, yPos3-8, pageWidth-2*sideMargin, splitA.length*18+12, 'F');
        doc.setTextColor(textKleur);
        
        // Teken de afgebroken tekst (vetgedrukt deel wordt nu als normale tekst getekend binnen de afbreking)
        doc.setFont('helvetica', 'normal'); // Kan bold zijn als je dat specifiek instelt per deel
        doc.text(splitA, sideMargin+10, yPos3+8);
        yPos3 += splitA.length * 18 + 18;

        // Juiste antwoord tonen bij fout
        if(ans && !correct && typeof q.correctAnswer === 'number' && q.options && q.options[q.correctAnswer-1]) {
            doc.setFillColor('#ffffff');
            doc.setDrawColor('#28a745');
            const correctAntwoordLabel = 'Correct antwoord: ';
            const correctAntwoordWaarde = q.options[q.correctAnswer-1];
            const volledigeCorrectAntwoordTekst = `${correctAntwoordLabel}${correctAntwoordWaarde}`;
            const splitC = doc.splitTextToSize(volledigeCorrectAntwoordTekst, pageWidth-2*sideMargin-20);
            doc.rect(sideMargin, yPos3-8, pageWidth-2*sideMargin, splitC.length*18+12, 'S');
            doc.setTextColor('#28a745');
            
            doc.setFont('helvetica', 'normal'); // Idem, kan bold zijn als je dat specifiek instelt
            doc.text(splitC, sideMargin+10, yPos3+8);
            yPos3 += splitC.length * 18 + 18;
        }
        // Feedback
        if(q.feedback) {
            doc.setFontSize(11);
            doc.setTextColor('#555');
            const splitF = doc.splitTextToSize(q.feedback, pageWidth-2*sideMargin-20);
            doc.text(splitF, sideMargin+10, yPos3+4);
            yPos3 += splitF.length * 15 + 10;
            doc.setFontSize(12);
        }
        yPos3 += 8;
    });
    doc.setFontSize(9);
    doc.setTextColor('#888');
    doc.text(`Pagina 3 van ${totalPagesPlaceholder}`, pageWidth-sideMargin-10, pageHeight-bottomMargin+8, { align: 'right' });

    // --- 4. Antwoorden per hoofdstuk ---
    // Voor elk hoofdstuk: laad json, toon titel, loop door interacties
    const hoofdstukken = [];
    // Dynamisch hoofdstukken array vullen op basis van totalSections
    // Alle hoofdstukken behalve het laatste (afsluitend hoofdstuk)
    for (let i = 1; i < totalSections; i++) {
        hoofdstukken.push(i);
    }
    for (let h of hoofdstukken) {
        const hoofdstukData = await fetch(`content/hoofdstuk${h}.json`).then(r => r.json());
        doc.addPage();
        doc.setFillColor('#FFFFFF');
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        pageNum++;
        let yH = topMargin + 18;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.setTextColor(config.stijl.primairKleur);
        
        // Hoofdstuktitel uit de globale 'chapters' array halen
        const chapterInfo = chapters.find(c => c.section === h);
        const hoofdstukTitel = `Hoofdstuk ${h}: ${chapterInfo ? chapterInfo.title : 'Onbekende Titel'}`;
        const splitHoofdstukTitel = doc.splitTextToSize(hoofdstukTitel, pageWidth-2*sideMargin-20);
        doc.text(splitHoofdstukTitel, sideMargin, yH);
        yH += splitHoofdstukTitel.length * 20 + 8;
        
        if(hoofdstukData.interacties && hoofdstukData.interacties.length > 0) {
            for(const interactie of hoofdstukData.interacties) {
                if (yH > pageHeight-bottomMargin-120) { 
                    doc.addPage(); 
                    // Subtiele achtergrondkleur voor elke nieuwe pagina
                    doc.setFillColor('#FFFFFF');
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                    yH = topMargin + 18; 
                    pageNum++; 
                }
                // Vraag
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.setTextColor('#222');
                const splitQ = doc.splitTextToSize(interactie.vraag || '', pageWidth-2*sideMargin-20);
                doc.text(splitQ, sideMargin, yH);
                yH += splitQ.length * 16 + 2;
                // Antwoord ophalen per type
                let antwoordBlok = '';
                let kleurBlok = '#e3f2fd';
                let textKleurBlok = '#1565c0';
                let feedback = '';
                let juisteAntwoord = '';
                let antwoordBlokTableRows = null;
                if(interactie.type === 'reflection') {
                    let ans = localStorage.getItem(`reflection_${h}_${interactie.id}_answered`) || '[Geen antwoord ingevuld]';
                    // Split en teken "Jouw reflectie:" in bold en de rest normaal
                    const reflectieText = 'Jouw reflectie: ';
                    const restVanReflectie = ans;
                    const volledigeReflectieTekst = reflectieText + restVanReflectie;
                    const splitA_reflectie = doc.splitTextToSize(volledigeReflectieTekst, pageWidth-2*sideMargin-20);
                    doc.setFillColor(kleurBlok);
                    doc.setDrawColor('#fff');
                    doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitA_reflectie.length*18+12, 'F');
                    doc.setTextColor(textKleurBlok);
                    doc.setFont('helvetica', 'normal'); // Kan bold zijn als je dat specifiek instelt
                    doc.text(splitA_reflectie, sideMargin+10, yH+8);
                    yH += splitA_reflectie.length * 18 + 18;
                    continue; // Sla verdere rendering van deze reflectie over
                } else if(interactie.type === 'mc') {
                    let ansSaved = localStorage.getItem(`mc_${h}_${interactie.id}_answered`);
                    let correct = localStorage.getItem(`mc_${h}_${interactie.id}_correct`) === '1';
                    let ansIdx = null;
                    if(ansSaved) {
                        // Gebruik de opgeslagen geselecteerde optie index
                        const storedIndex = localStorage.getItem(`mc_${h}_${interactie.id}_selected`);
                        if (storedIndex !== null) {
                           ansIdx = parseInt(storedIndex, 10); // Dit is al 0-gebaseerd
                        }
                    }
                    let optie = (ansIdx !== null && interactie.options && interactie.options[ansIdx]) ? interactie.options[ansIdx] : '[Geen antwoord ingevuld]';
                    
                    const jouwAntwoordLabel = 'Jouw antwoord: ';
                    const jouwAntwoordStatus = ` (${correct ? 'Goed' : 'Fout'})`;
                    const volledigeJouwAntwoordTekst = `${jouwAntwoordLabel}${optie}${jouwAntwoordStatus}`;
                    
                    kleurBlok = correct ? '#e8f5e9' : '#ffebee';
                    textKleurBlok = correct ? '#2e7d32' : '#c62828';
                    const splitA_mc = doc.splitTextToSize(volledigeJouwAntwoordTekst, pageWidth-2*sideMargin-20);
                    doc.setFillColor(kleurBlok);
                    doc.setDrawColor('#fff');
                    doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitA_mc.length*18+12, 'F');
                    doc.setTextColor(textKleurBlok);
                    doc.setFont('helvetica', 'normal'); // Kan bold zijn als je dat specifiek instelt
                    doc.text(splitA_mc, sideMargin+10, yH+8);
                    yH += splitA_mc.length * 18 + 18;

                    if(!correct && typeof interactie.correctAnswer === 'number' && interactie.options && interactie.options[interactie.correctAnswer-1]) {
                        const correctAntwoordLabelPDF = 'Correct antwoord: ';
                        const correctAntwoordWaardePDF = interactie.options[interactie.correctAnswer-1];
                        const volledigeCorrectAntwoordTekstPDF = `${correctAntwoordLabelPDF}${correctAntwoordWaardePDF}`;
                        const splitC_mc = doc.splitTextToSize(volledigeCorrectAntwoordTekstPDF, pageWidth-2*sideMargin-20);
                        doc.setFillColor('#ffffff');
                        doc.setDrawColor('#28a745');
                        doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitC_mc.length*18+12, 'S');
                        doc.setTextColor('#28a745');
                        doc.setFont('helvetica', 'normal'); // Kan bold zijn als je dat specifiek instelt
                        doc.text(splitC_mc, sideMargin+10, yH+8);
                        yH += splitC_mc.length * 18 + 18;
                    }
                    feedback = interactie.feedback || '';
                    yH += 24; // Extra witruimte na MC blok
                    continue;
                } else if(interactie.type === 'dragdrop') {
                    console.log('dragdrop:', {
                        targets: interactie.targets,
                        items: interactie.items,
                        correctCombinations: interactie.correctCombinations
                    });
                    let correct = localStorage.getItem(`dragdrop_${h}_${interactie.id}_correct`) === 'true';
                    if (correct && interactie.targets && interactie.items && interactie.correctCombinations && interactie.targets.length && interactie.items.length && interactie.correctCombinations.length) {
                        // Maak een lookup voor item labels
                        const itemLabelMap = {};
                        interactie.items.forEach(item => { itemLabelMap[item.id] = item.label; });
                        // Bouw tabelrijen
                        const tableRows = interactie.correctCombinations.map(pair => {
                            let target = interactie.targets.find(t => t.id === pair.targetId);
                            let targetLabel = target ? target.label.replace(/<[^>]*>/g, '') : pair.targetId;
                            let itemLabel = itemLabelMap[pair.itemId] || pair.itemId;
                            return { targetLabel, itemLabel };
                        });
                        kleurBlok = '#e8f5e9';
                        textKleurBlok = '#2e7d32';
                        feedback = interactie.feedbackCorrect || '';
                        // Bereken maximale breedtes voor beide kolommen
                        const availableWidth = pageWidth - 2*sideMargin - 40; // Totale beschikbare breedte
                        const columnGap = 20; // Ruimte tussen kolommen
                        const maxColWidth = (availableWidth - columnGap) / 2; // Maximale breedte per kolom

                        // Bereken werkelijke hoogtes voor elke rij
                        const rowHeights = tableRows.map(row => {
                            const leftSplit = doc.splitTextToSize(row.targetLabel, maxColWidth);
                            const rightSplit = doc.splitTextToSize(row.itemLabel, maxColWidth);
                            return Math.max(leftSplit.length, rightSplit.length) * 18; // 18pt per regel
                        });

                        const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + 40; // +40 voor header en padding

                        // Teken kader
                        doc.setFillColor(kleurBlok);
                        doc.setDrawColor('#fff');
                        doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, totalHeight, 'F');
                        
                        // Header
                        doc.setTextColor(textKleurBlok);
                        doc.setFont('helvetica', 'bold');
                        doc.text('Juiste koppelingen:', sideMargin+10, yH+8);
                        doc.setFont('helvetica', 'normal');

                        // Teken rijen
                        let currentY = yH + 28;
                        tableRows.forEach((row, index) => {
                            // Links
                            const leftSplit = doc.splitTextToSize(row.targetLabel, maxColWidth);
                            doc.text(leftSplit, sideMargin+10, currentY);

                            // Rechts
                            const rightSplit = doc.splitTextToSize(row.itemLabel, maxColWidth);
                            doc.text(rightSplit, sideMargin + maxColWidth + columnGap + 10, currentY);

                            currentY += rowHeights[index] + 5; // 5pt extra ruimte tussen rijen
                        });

                        yH += totalHeight + 10;
                    } else {
                        let antwoordBlok = correct ? 'Alle koppelingen zijn correct, maar de data voor de tabel ontbreekt.' : 'Niet alle koppelingen zijn correct.';
                        kleurBlok = correct ? '#e8f5e9' : '#ffebee';
                        textKleurBlok = correct ? '#2e7d32' : '#c62828';
                        feedback = correct ? (interactie.feedbackCorrect || '') : (interactie.feedbackIncorrect || '');
                        const splitA = doc.splitTextToSize(antwoordBlok, pageWidth-2*sideMargin-20);
                        doc.setFillColor(kleurBlok);
                        doc.setDrawColor('#fff');
                        doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitA.length*18+12, 'F');
                        doc.setTextColor(textKleurBlok);
                        doc.setFont('helvetica', 'normal');
                        doc.text(splitA, sideMargin+10, yH+8);
                        yH += splitA.length * 18 + 18;
                    }
                } else if(interactie.type === 'selfassessment') {
                    let ans = localStorage.getItem(`selfassessment_${h}_${interactie.id}_done`);
                    // Dynamische mapping voor betekenis
                    const niveauLabels = { '1': 'Beginnend', '2': 'In ontwikkeling', '3': 'Bekwaam' };
                    const competenties = ['Veranderen', 'Vinden', 'Vertrouwen', 'Vaardig gebruiken', 'Vertellen'];
                    if(ans) {
                        try {
                            let obj = JSON.parse(ans);
                            kleurBlok = '#fffbe0'; textKleurBlok = '#b8860b';
                            // Bereken hoogte nauwkeuriger: 1 regel voor titel + 1 per competentie
                            let regels = 1 + competenties.length;
                            const hoogte = regels * 22 + 8; // minder extra ruimte
                            // Teken kader
                            doc.setFillColor(kleurBlok);
                            doc.setDrawColor('#fff');
                            doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, hoogte, 'F');
                            doc.setTextColor(textKleurBlok);
                            // Titel vet
                            doc.setFont('helvetica', 'bold');
                            doc.text('Jouw zelfbeoordeling:', sideMargin+10, yH+8);
                            let yCurrent = yH+8+22;
                            // Elke competentie onder elkaar, met bullet, naam vet, niveau normaal
                            competenties.forEach(comp => {
                                doc.setFont('helvetica', 'bold');
                                const compText = '\u2022 ' + comp + ':';
                                doc.text(compText, sideMargin+10, yCurrent); // Bullet + competentie
                                // Meet breedte in bold
                                const compWidth = doc.getTextWidth(compText);
                                doc.setFont('helvetica', 'normal');
                                let waarde = obj[comp.toLowerCase().replace(' ', '')] || obj[comp] || '';
                                let betekenis = niveauLabels[waarde] || '[Niet ingevuld]';
                                doc.text(betekenis, sideMargin+10+compWidth+4, yCurrent); // 4pt extra ruimte
                                yCurrent += 22;
                            });
                            yH += hoogte + 10;
                        } catch {}
                    } else {
                        antwoordBlok = '[Geen antwoord ingevuld]';
                        kleurBlok = '#fffde7'; textKleurBlok = '#f9a825';
                        const splitA = doc.splitTextToSize(antwoordBlok, pageWidth-2*sideMargin-20);
                        doc.setFillColor(kleurBlok);
                        doc.setDrawColor('#fff');
                        doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitA.length*18+12, 'F');
                        doc.setTextColor(textKleurBlok);
                        doc.setFont('helvetica', 'normal');
                        doc.text(splitA, sideMargin+10, yH+8);
                        yH += splitA.length * 18 + 24;
                    }
                    continue;
                } else if(interactie.type === 'braindump') {
                    const attemptsData = localStorage.getItem(`braindump_${h}_${interactie.id}_attempts`);
                    const evaluationsData = localStorage.getItem(`braindump_${h}_${interactie.id}_evaluations`);
                    const isCompleted = localStorage.getItem(`braindump_${h}_${interactie.id}_completed`) === 'true';
                    
                    if (attemptsData && evaluationsData && isCompleted) {
                        try {
                            const attempts = JSON.parse(attemptsData);
                            const evaluations = JSON.parse(evaluationsData);
                            
                            kleurBlok = '#fff3e0'; // Oranje achtergrond voor braindump
                            textKleurBlok = '#e65100'; // Donkeroranje tekst
                            
                            // Toon laatste poging en evaluatie
                            const lastAttempt = attempts[attempts.length - 1] || '[Geen tekst]';
                            const lastEvaluation = evaluations[evaluations.length - 1];
                            
                            const evaluationLabels = {
                                'good': 'Goed - Ik wist het meeste nog',
                                'fair': 'Matig - Ik wist de helft nog',
                                'poor': 'Slecht - Ik wist weinig nog'
                            };
                            
                            const evalText = evaluationLabels[lastEvaluation?.evaluation] || lastEvaluation?.evaluation || 'Geen evaluatie';
                            
                            // Bereken benodigde hoogte
                            const braindumpLabel = 'Je braindump: ';
                            const evaluatieLabel = `Je evaluatie: `;
                            const pogingLabel = `Poging ${attempts.length} van ${attempts.length}: `;
                            
                            const splitBraindump = doc.splitTextToSize(lastAttempt, pageWidth-2*sideMargin-20);
                            const splitEvaluatie = doc.splitTextToSize(evalText, pageWidth-2*sideMargin-20);
                            const splitPoging = doc.splitTextToSize(pogingLabel, pageWidth-2*sideMargin-20);
                            
                            const totalHeight = (splitBraindump.length + splitEvaluatie.length + splitPoging.length + 3) * 18 + 40;
                            
                            // Teken kader
                            doc.setFillColor(kleurBlok);
                            doc.setDrawColor('#fff');
                            doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, totalHeight, 'F');
                            doc.setTextColor(textKleurBlok);
                            
                            // Poging info
                            doc.setFont('helvetica', 'bold');
                            doc.text(pogingLabel, sideMargin+10, yH+8);
                            yH += splitPoging.length * 18 + 10;
                            
                            // Braindump tekst
                            doc.setFont('helvetica', 'bold');
                            doc.text(braindumpLabel, sideMargin+10, yH+8);
                            doc.setFont('helvetica', 'normal');
                            doc.text(splitBraindump, sideMargin+10, yH+8+18);
                            yH += splitBraindump.length * 18 + 25;
                            
                            // Evaluatie
                            doc.setFont('helvetica', 'bold');
                            doc.text(evaluatieLabel, sideMargin+10, yH+8);
                            doc.setFont('helvetica', 'normal');
                            doc.text(splitEvaluatie, sideMargin+10, yH+8+18);
                            yH += splitEvaluatie.length * 18 + 25;
                            
                        } catch (e) {
                            console.error('Error parsing braindump data:', e);
                            const errorText = 'Error bij het laden van braindump data';
                            const splitError = doc.splitTextToSize(errorText, pageWidth-2*sideMargin-20);
                            doc.setFillColor('#ffebee');
                            doc.setDrawColor('#fff');
                            doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitError.length*18+12, 'F');
                            doc.setTextColor('#c62828');
                            doc.setFont('helvetica', 'normal');
                            doc.text(splitError, sideMargin+10, yH+8);
                            yH += splitError.length * 18 + 18;
                        }
                    } else {
                        const noDataText = '[Braindump niet voltooid]';
                        kleurBlok = '#fffde7';
                        textKleurBlok = '#f9a825';
                        const splitError = doc.splitTextToSize(noDataText, pageWidth-2*sideMargin-20);
                        doc.setFillColor(kleurBlok);
                        doc.setDrawColor('#fff');
                        doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitError.length*18+12, 'F');
                        doc.setTextColor(textKleurBlok);
                        doc.setFont('helvetica', 'normal');
                        doc.text(splitError, sideMargin+10, yH+8);
                        yH += splitError.length * 18 + 24;
                    }
                    continue;
                } else if(interactie.type === 'critical_analysis') {
                    let ans = localStorage.getItem(`critical_analysis_${h}_${interactie.id}_answered`);
                    if(ans) {
                        try {
                            let obj = JSON.parse(ans);
                            // Toon elk veld met subtitel, titels vet
                            let yStart = yH;
                            let analyseTitel = 'Jouw analyse:';
                            kleurBlok = '#e3f2fd'; // Lichte blauwe achtergrond
                            textKleurBlok = '#1565c0'; // Donkerblauwe tekst
                            doc.setFillColor(kleurBlok);
                            doc.setDrawColor('#fff');
                            // Bepaal voorlopige hoogte
                            let yCurrent = yH+8+18;
                            let totalLines = 1;
                            let maxWidth = pageWidth-2*sideMargin-20;
                            // Bepaal breedte van de langste subtitel
                            const labels = ['Technologie: ', 'Sterke punten: ', 'Uitdagingen: ', 'Implementatie: '];
                            let maxLabelWidth = Math.max(...labels.map(l => doc.getTextWidth(l)));
                            // Bereken hoogte voor alle velden
                            if(obj.technologie) {
                                const techLabel = 'Technologie: ';
                                const splitTech = doc.splitTextToSize(obj.technologie, maxWidth-maxLabelWidth);
                                totalLines += splitTech.length;
                                yCurrent += splitTech.length * 18 + 6;
                            }
                            if(obj.sterkePunten) {
                                const sterkeLabel = 'Sterke punten: ';
                                const splitSterke = doc.splitTextToSize(obj.sterkePunten, maxWidth-maxLabelWidth);
                                totalLines += splitSterke.length;
                                yCurrent += splitSterke.length * 18 + 6;
                            }
                            if(obj.uitdagingen) {
                                const uitdagingenLabel = 'Uitdagingen: ';
                                const splitUitdagingen = doc.splitTextToSize(obj.uitdagingen, maxWidth-maxLabelWidth);
                                totalLines += splitUitdagingen.length;
                                yCurrent += splitUitdagingen.length * 18 + 6;
                            }
                            if(obj.implementatie) {
                                const implementatieLabel = 'Implementatie: ';
                                const splitImpl = doc.splitTextToSize(obj.implementatie, maxWidth-maxLabelWidth);
                                totalLines += splitImpl.length;
                                yCurrent += splitImpl.length * 18 + 6;
                            }
                            const totaleHoogte = yCurrent - yH + 10;
                            doc.setFillColor(kleurBlok);
                            doc.setDrawColor('#fff');
                            doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, totaleHoogte, 'F');
                            doc.setTextColor(textKleurBlok);
                            doc.setFont('helvetica', 'bold');
                            doc.text(analyseTitel, sideMargin+10, yH+8);
                            yCurrent = yH+8+18;
                            doc.setFont('helvetica', 'normal');
                            if(obj.technologie) {
                                const techLabel = 'Technologie: ';
                                doc.setFont('helvetica', 'bold');
                                doc.text(techLabel, sideMargin+10, yCurrent);
                                doc.setFont('helvetica', 'normal');
                                const splitTech = doc.splitTextToSize(obj.technologie, maxWidth-maxLabelWidth);
                                doc.text(splitTech, sideMargin+10+maxLabelWidth, yCurrent);
                                yCurrent += splitTech.length * 18 + 6;
                            }
                            if(obj.sterkePunten) {
                                const sterkeLabel = 'Sterke punten: ';
                                doc.setFont('helvetica', 'bold');
                                doc.text(sterkeLabel, sideMargin+10, yCurrent);
                                doc.setFont('helvetica', 'normal');
                                const splitSterke = doc.splitTextToSize(obj.sterkePunten, maxWidth-maxLabelWidth);
                                doc.text(splitSterke, sideMargin+10+maxLabelWidth, yCurrent);
                                yCurrent += splitSterke.length * 18 + 6;
                            }
                            if(obj.uitdagingen) {
                                const uitdagingenLabel = 'Uitdagingen: ';
                                doc.setFont('helvetica', 'bold');
                                doc.text(uitdagingenLabel, sideMargin+10, yCurrent);
                                doc.setFont('helvetica', 'normal');
                                const splitUitdagingen = doc.splitTextToSize(obj.uitdagingen, maxWidth-maxLabelWidth);
                                doc.text(splitUitdagingen, sideMargin+10+maxLabelWidth, yCurrent);
                                yCurrent += splitUitdagingen.length * 18 + 6;
                            }
                            if(obj.implementatie) {
                                const implementatieLabel = 'Implementatie: ';
                                doc.setFont('helvetica', 'bold');
                                doc.text(implementatieLabel, sideMargin+10, yCurrent);
                                doc.setFont('helvetica', 'normal');
                                const splitImpl = doc.splitTextToSize(obj.implementatie, maxWidth-maxLabelWidth);
                                doc.text(splitImpl, sideMargin+10+maxLabelWidth, yCurrent);
                                yCurrent += splitImpl.length * 18 + 6;
                            }
                            yH += totaleHoogte + 24; // Extra witruimte na blok
                        } catch {}
                    } else {
                        antwoordBlok = '[Geen antwoord ingevuld]';
                        kleurBlok = '#ede7f6'; textKleurBlok = '#6a1b9a';
                        const splitA = doc.splitTextToSize(antwoordBlok, pageWidth-2*sideMargin-20);
                        doc.setFillColor(kleurBlok);
                        doc.setDrawColor('#fff');
                        doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitA.length*18+12, 'F');
                        doc.setTextColor(textKleurBlok);
                        doc.setFont('helvetica', 'normal');
                        doc.text(splitA, sideMargin+10, yH+8);
                        yH += splitA.length * 18 + 24; // Extra witruimte na blok
                    }
                    continue;
                } else if(interactie.type === 'flashcard') {
                    // Haal flashcard data uit localStorage
                    const baseId = `flashcard_${h}_${interactie.id}`;
                    let herhalingen = {};
                    try { herhalingen = JSON.parse(localStorage.getItem(`${baseId}_herhalingen`) || '{}'); } catch {}
                    let laatsteSet = [];
                    try { laatsteSet = JSON.parse(localStorage.getItem(`${baseId}_laatsteSet`) || '[]'); } catch {}
                    let laatsteType = localStorage.getItem(`${baseId}_laatsteType`) || 'all';
                    let setAfgerond = localStorage.getItem(`${baseId}_setAfgerond`) === 'true';
                    let run = parseInt(localStorage.getItem(`${baseId}_run`) || '1');
                    // Per kaart: voorkant, achterkant, laatste antwoord, aantal keer gedaan
                    const kaarten = interactie.cards || [];
                    if (kaarten.length > 0) {
                        // Tabel header
                        const col1 = 'Voorzijde';
                        const col2 = 'Achterzijde';
                        const col3 = 'Laatste antwoord';
                        const col4 = 'Aantal keer gedaan';
                        const tableWidth = pageWidth-2*sideMargin-20;
                        const colPx = [0, 0, 0, 0];
                        colPx[0] = Math.round(tableWidth * 0.28);
                        colPx[1] = Math.round(tableWidth * 0.38);
                        colPx[2] = Math.round(tableWidth * 0.18);
                        colPx[3] = Math.round(tableWidth * 0.12);
                        let yTable = yH;
                        // Header: bepaal benodigde hoogte per kolom
                        const headerLines = [
                            doc.splitTextToSize(col1, colPx[0]-10),
                            doc.splitTextToSize(col2, colPx[1]-10),
                            doc.splitTextToSize(col3, colPx[2]-10),
                            doc.splitTextToSize(col4, colPx[3]-10)
                        ];
                        const maxHeaderLines = Math.max(...headerLines.map(lines => lines.length));
                        const headerHeight = maxHeaderLines * 14 + 10; // 14pt per regel, 10pt extra padding
                        // Header tekenen
                        doc.setFillColor('#ede7f6');
                        doc.setDrawColor('#8A4A9E');
                        doc.rect(sideMargin, yTable, tableWidth, headerHeight, 'F');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(12);
                        doc.setTextColor('#662483');
                        doc.text(headerLines[0], sideMargin+8, yTable+16, {maxWidth: colPx[0]-10});
                        doc.text(headerLines[1], sideMargin+colPx[0]+8, yTable+16, {maxWidth: colPx[1]-10});
                        doc.text(headerLines[2], sideMargin+colPx[0]+colPx[1]+8, yTable+16, {maxWidth: colPx[2]-10});
                        doc.text(headerLines[3], sideMargin+colPx[0]+colPx[1]+colPx[2]+8, yTable+16, {maxWidth: colPx[3]-10});
                        yTable += headerHeight;
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(11);
                        doc.setTextColor('#222');
                        // Rijen
                        kaarten.forEach((kaart, idx) => {
                            // Tekst splitsen per kolom
                            const voorzijdeLines = doc.splitTextToSize(kaart.voorzijde, colPx[0]-10);
                            const achterzijdeLines = doc.splitTextToSize(kaart.achterzijde, colPx[1]-10);
                            let laatsteAntw = '-';
                            let aantal = herhalingen[idx] ? herhalingen[idx] : 1;
                            if (setAfgerond && laatsteType === 'incorrect' && laatsteSet.includes(idx)) {
                                laatsteAntw = 'Ik wist het niet';
                            } else if (setAfgerond) {
                                laatsteAntw = 'Ik wist het';
                            } else {
                                laatsteAntw = '-';
                            }
                            const laatsteAntwLines = doc.splitTextToSize(laatsteAntw, colPx[2]-10);
                            const aantalLines = [aantal.toString()];
                            // Bepaal het max aantal regels voor deze rij
                            const maxLines = Math.max(voorzijdeLines.length, achterzijdeLines.length, laatsteAntwLines.length, aantalLines.length);
                            const rowHeight = maxLines * 14 + 10; // 14pt per regel, 10pt extra padding
                            if (yTable > pageHeight-bottomMargin-rowHeight-20) {
                                doc.addPage();
                                doc.setFillColor('#FFFFFF');
                                doc.rect(0, 0, pageWidth, pageHeight, 'F');
                                yTable = topMargin + 18;
                            }
                            // Rij tekenen
                            doc.setFillColor('#f8f9fa');
                            doc.setDrawColor('#e9ecef');
                            doc.rect(sideMargin, yTable, tableWidth, rowHeight, 'F');
                            doc.setTextColor('#222');
                            // Tekst per kolom verticaal uitlijnen bovenaan
                            doc.text(voorzijdeLines, sideMargin+8, yTable+16, {maxWidth: colPx[0]-10});
                            doc.text(achterzijdeLines, sideMargin+colPx[0]+8, yTable+16, {maxWidth: colPx[1]-10});
                            doc.text(laatsteAntwLines, sideMargin+colPx[0]+colPx[1]+8, yTable+16, {maxWidth: colPx[2]-10});
                            doc.text(aantalLines, sideMargin+colPx[0]+colPx[1]+colPx[2]+8, yTable+16, {maxWidth: colPx[3]-10});
                            yTable += rowHeight;
                        });
                        yH = yTable + 20; // Extra witruimte onder de tabel
                        continue;
                    }
                }
                // Antwoordblok
                const splitA = doc.splitTextToSize(antwoordBlok || '', pageWidth-2*sideMargin-20);
                doc.setFillColor(kleurBlok);
                doc.setDrawColor('#fff');
                doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, (antwoordBlokTableRows ? (antwoordBlokTableRows.length*18+38) : (splitA.length*18+12)), 'F');
                doc.setTextColor(textKleurBlok);
                doc.setFont('helvetica', 'normal');
                if (antwoordBlokTableRows) {
                    // Tabel header
                    doc.text('Juiste koppelingen:', sideMargin+10, yH+8);
                    let rowY = yH+28;
                    const leftColWidth = Math.max(...antwoordBlokTableRows.map(r => doc.getTextWidth(r.targetLabel))) + 10;
                    const rightColStart = sideMargin + leftColWidth + 30;
                    antwoordBlokTableRows.forEach(row => {
                        doc.text(row.targetLabel, sideMargin+10, rowY, { maxWidth: leftColWidth });
                        doc.text(row.itemLabel, rightColStart, rowY, { maxWidth: pageWidth - rightColStart - sideMargin - 10 });
                        rowY += 18;
                    });
                    yH += 28 + antwoordBlokTableRows.length * 18;
                } else {
                    doc.text(splitA, sideMargin+10, yH+8);
                    yH += splitA.length * 18 + 18;
                }
                // Juiste antwoord (indien van toepassing)
                if(juisteAntwoord) {
                    const splitC = doc.splitTextToSize(juisteAntwoord, pageWidth-2*sideMargin-20);
                    doc.setFillColor('#ffffff');
                    doc.setDrawColor('#28a745');
                    doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, splitC.length*18+12, 'S');
                    doc.setTextColor('#28a745');
                    doc.text(splitC, sideMargin+10, yH+8);
                    yH += splitC.length * 18 + 18;
                }
                // Feedback (indien aanwezig)
                if(feedback) {
                    // Teken feedback in groen kader
                    const splitF = doc.splitTextToSize(feedback, pageWidth-2*sideMargin-20);
                    const feedbackHoogte = splitF.length * 18 + 12;
                    doc.setFillColor('#e8f5e9');
                    doc.setDrawColor('#fff');
                    doc.rect(sideMargin, yH-8, pageWidth-2*sideMargin, feedbackHoogte, 'F');
                    doc.setTextColor('#2e7d32');
                    doc.setFont('helvetica', 'normal');
                    doc.text(splitF, sideMargin+10, yH+8);
                    yH += feedbackHoogte + 10;
                }
                yH += 10;
            }
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor('#888');
            doc.text('Geen interacties in dit hoofdstuk.', sideMargin, yH);
        }
        doc.setFontSize(9);
        doc.setTextColor('#888');
        doc.text(`Pagina ${pageNum} van ${totalPagesPlaceholder}`, pageWidth-sideMargin-10, pageHeight-bottomMargin+8, { align: 'right' });
    }

    // Update totaal aantal pagina's en vervang placeholder in alle voetteksten
    const totalActualPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalActualPages; i++) { // Begin vanaf pagina 2
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor('#888');
        // Tekst opnieuw schrijven om de placeholder te overschrijven
        doc.setFillColor('#FFFFFF'); // Witte kleur
        doc.rect(pageWidth - sideMargin - 70, pageHeight - bottomMargin, 70, 12, 'F'); // Wit vlak over oude paginanummering

        doc.text(`Pagina ${i} van ${totalActualPages}`, pageWidth-sideMargin-10, pageHeight-bottomMargin+8, { align: 'right' });
    }

    // --- 4. Downloaden ---
    // Bestandsnaam: certificaat_NAAM_TITEL.pdf
    let safeName = studentName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
    let safeTitle = config.titel.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
    if (safeTitle.length > 40) safeTitle = safeTitle.substring(0, 40);
    doc.save(`certificaat_${safeName}_${safeTitle}.pdf`);
} 