# Handleiding: Een nieuwe e-learning cursus opzetten

Deze handleiding beschrijft het proces voor het klonen en aanpassen van deze e-learning voor een nieuw onderwerp. De structuur is volledig dynamisch en ontworpen voor hergebruik.

## De Eenvoudige Werkwijze

Dankzij de dynamische architectuur is het opzetten van een nieuwe cursus of het aanpassen van de structuur zeer eenvoudig. Alle wijzigingen worden centraal geregeld vanuit de `/content` map. **Je hoeft geen code (HTML of JavaScript) aan te passen.**

1.  **Kopieer de projectmap** voor je nieuwe cursus.
2.  **Pas `content/config.json` aan.** Dit is het hart van de e-learning.
    *   **Pas de `titel` aan** - Dit wordt automatisch gebruikt voor de browser tab, header en alle andere titels in de e-learning
    *   Pas de `leerdoelen`, `organisatie`, etc. aan.
    *   Pas de `hoofdstukken` array aan om hoofdstukken toe te voegen, te verwijderen of de volgorde te wijzigen.
        *   **Toevoegen:** Voeg een object toe, bijv. `{ "file": "hoofdstukNieuw.json", "titel": "Nieuw Hoofdstuk" }`.
        *   **Verwijderen:** Haal een object uit de array.
        *   **Hernoemen:** Verander de `titel`.
3.  **Bewerk de hoofdstukbestanden.** Pas de inhoud van de JSON-bestanden in de `/content` map aan (bv. `hoofdstuk1.json`, etc.).
4.  **Test je wijzigingen.** Start een lokale webserver om het resultaat te bekijken. De navigatie, voortgang en content passen zich automatisch aan.

---

## ⚠️ Belangrijke Regel: Titelbeheer is Volledig Dynamisch

**De titel van de e-learning wordt ALLEEN gewijzigd via `content/config.json`**

- **Browser tab titel**: Wordt automatisch ingesteld door JavaScript uit config.json
- **Header titel**: Wordt automatisch ingesteld door JavaScript uit config.json  
- **Alle andere titels**: Komen automatisch uit config.json

**Wat je MOET doen:**
- ✅ Titel wijzigen in `content/config.json` onder `"titel": "Nieuwe Titel"`
- ✅ De wijziging wordt automatisch doorgevoerd in de hele e-learning

**Wat je NIET moet doen:**
- ❌ Titel handmatig aanpassen in `index.html`
- ❌ Titel aanpassen in JavaScript bestanden
- ❌ CSS aanpassen voor titels

Het systeem is ontworpen om de titel volledig centraal te beheren. Dit zorgt voor consistentie en maakt het klonen van de e-learning veel eenvoudiger.

---

## Aanbevolen Workflow: Werken met een AI Assistent

De snelste en meest consistente manier om een nieuwe cursus op te zetten is door een AI-assistent te gebruiken. We hebben hiervoor een set kant-en-klare prompts voorbereid die je kunt kopiëren en plakken.

Deze prompts begeleiden je door het hele proces, van het opzetten van de structuur tot het vullen van de content en de eindquiz.

- **Vind de prompts hier: [AI Prompts voor het beheren van de E-learning](./ai_prompts.md)**

---

## Technische Documentatie

Voor een diepgaand begrip van de technische werking, de bestandsstructuur, hoe de render-logica werkt en details over de CSS, raadpleeg je de architectuurdocumentatie.

- **Zie: [Architectuur Overzicht](./architecture.md)**

## 1. Structuur van de inhoud

- **/content/**
  - `config.json` — Algemene instellingen (titel, leerdoelen, organisatie, logo)
  - `hoofdstuk1.json`, `hoofdstuk2.json`, ... — Inhoud per hoofdstuk (tekst, interacties)
  - `hoofdstuk_afsluiting.json` — Afsluitende tekst, certificaatuitleg, tips
  - `afsluitquiz.json` — Vragen voor de afsluitende quiz die zit ingebed in hoofdstuk_afsluiting.json

## 2. Hoofdstukken en inhoud aanpassen

Het aanpassen van de structuur, zoals het toevoegen, verwijderen, hernoemen of veranderen van de volgorde van hoofdstukken, doe je **uitsluitend** in `content/config.json`. De applicatie past de navigatie, voortgangsberekening en content-lading automatisch aan.

- In elk hoofdstukbestand (`hoofdstuk1.json`, etc.) kun je de titel, inleidende tekst en de array `interacties` aanpassen.

### ID's voor interacties
Om ID-conflicten te voorkomen, gebruik je altijd het volgende format voor ID's:
```
{hoofdstuknummer}_{type}_{volgnummer}
```
Bijvoorbeeld:
- `h1_mc_1` (hoofdstuk 1, meerkeuzevraag, eerste vraag)
- `h2_reflection_3` (hoofdstuk 2, reflectie, derde vraag)
- `h3_dragdrop_2` (hoofdstuk 3, sleepvraag, tweede vraag)

Voor de afsluitquiz gebruik je het format:
```
quiz_mc_{volgnummer}
```
Bijvoorbeeld:
- `quiz_mc_1` (eerste quizvraag)
- `quiz_mc_2` (tweede quizvraag)

Voordelen van deze aanpak:
- Unieke ID's over alle hoofdstukken heen
- Duidelijke structuur die makkelijk te volgen is
- Voorkomt conflicten bij het klonen of aanpassen van de e-learning
- Maakt het makkelijker om interacties te vinden en te beheren

**Voorbeeld van een interactieblok in een hoofdstuk:**
```json
{
  "id": "h1_reflection_1",
  "type": "reflection",
  "vraag": "Welke technologie spreekt jou aan?"
}
```
**Ondersteunde types:**  
- `mc` (meerkeuzevraag)  
- `reflection` (open reflectie)  
- `dragdrop` (sleepvraag)  
- `selfassessment` (zelfbeoordeling)  
- `critical_analysis` (kritische analyse)  
- `flashcard` (flashcards voor begrippen of definities)
- ...en je kunt eenvoudig nieuwe types toevoegen.

## 3. Architectuur en Technische Details

### Overzicht
Deze e-learning bestaat uit N reguliere hoofdstukken plus 1 afsluitend hoofdstuk. Het totaal aantal secties is dus N+1.

### Bestandsstructuur
- `content/hoofdstuk1.json` t/m `content/hoofdstukN.json` - Reguliere hoofdstukken
- `content/hoofdstuk_afsluiting.json` - Speciaal afsluitend hoofdstuk (altijd de laatste sectie)
- `content/afsluitquiz.json` - Quiz vragen voor het afsluitende hoofdstuk
- `content/config.json` - Algemene configuratie

### Belangrijke conventies

#### Naamgeving hoofdstuk_afsluiting
Het laatste hoofdstuk heeft bewust een afwijkende naam (`hoofdstuk_afsluiting.json` i.p.v. `hoofdstuk[N+1].json`) omdat:
1. Het een fundamenteel andere structuur heeft (certificaat, portfolio info)
2. Het altijd het laatste hoofdstuk blijft, ongeacht het aantal reguliere hoofdstukken
3. Het semantisch duidelijk maakt dat dit het afsluitende deel is

#### Aanpassen aantal hoofdstukken
Bij het wijzigen van het aantal hoofdstukken:
1. Pas `totalSections` aan in `js/script.js` naar het nieuwe totaal (reguliere hoofdstukken + 1)
2. Voeg/verwijder hoofdstuk JSON bestanden
3. Pas de `chapters` array aan in `js/script.js`
4. Update de navigatie in `index.html` (sidebar chapters)
5. `hoofdstuk_afsluiting.json` blijft altijd het laatste hoofdstuk

**Voorbeeld**: Als je 5 reguliere hoofdstukken wilt:
- Maak `hoofdstuk1.json` t/m `hoofdstuk5.json`
- Behoud `hoofdstuk_afsluiting.json` als sectie 6
- Zet `totalSections = 6` in `script.js`

### Hoofdstuk laden - Technische details
- Reguliere hoofdstukken: Laden dynamisch op basis van de `file` property in `config.json`.
- Laatste hoofdstuk: Laadt altijd het laatste hoofdstuk uit de `hoofdstukken` array in `config.json`. Dit is doorgaans `hoofdstuk_afsluiting.json`.
- Detectie van het laatste hoofdstuk gebeurt automatisch (`if (chapterNumber === totalSections)`).

#### Render-logica
De weergave van de inhoud van een hoofdstuk wordt afgehandeld in `js/dynamicContent.js` en volgt een duidelijke, duurzame strategie:

1.  **Generieke Renderer voor Standaard Hoofdstukken**: Alle reguliere hoofdstukken worden weergegeven door één centrale functie: `renderGenericChapterContent`. Deze functie kan een breed scala aan content-componenten (zoals tekstblokken, info-kaarten, video's, etc.) verwerken op basis van de JSON-structuur.
    *   **Voordeel**: Als je een nieuw type contentblok wilt toevoegen, hoef je dit maar op één plek te implementeren, waarna het in alle hoofdstukken beschikbaar is.

2.  **Specifieke Renderer voor het Afsluitende Hoofdstuk**: Het laatste hoofdstuk (de "afsluiting") wordt altijd weergegeven door een aparte functie: `renderAfsluitingContent`.
    *   **Voordeel**: Dit hoofdstuk heeft unieke functionaliteit (zoals de quiz en certificaatgeneratie) die losstaat van de standaard content. Een eigen renderer houdt de code schoon en overzichtelijk.

Deze aanpak zorgt ervoor dat de e-learning makkelijk te onderhouden en uit te breiden is, zonder voor elk hoofdstuk aparte code te moeten schrijven.

### Speciale behandeling laatste hoofdstuk
- Gebruikt `renderAfsluitingContent()` functie (ongeacht het werkelijke nummer)
- Laadt ook `afsluitquiz.json` voor de eindtoets
- Bevat certificaat generatie functionaliteit
- Bevat portfolio tips en VRAAK criteria

## 4. Quizvragen aanpassen

- Open `content/afsluitquiz.json` en pas de quizvragen aan.
- Elke vraag heeft een `id`, `text`, `options`, `correctAnswer`, `feedback`, en `title`.
- De quiz wordt automatisch geladen wanneer het laatste hoofdstuk wordt geopend.

### Indexering van Meerkeuzevragen

Bij het werken met meerkeuzevragen (MC) wordt 0-based indexering gebruikt. Dit is de standaard in programmeertalen zoals JavaScript, waarbij het eerste element in een lijst (of array) index 0 heeft.

- Optie 1 is het eerste antwoord (index 0)
- Optie 2 is het tweede antwoord (index 1)
- Enzovoort

Dit is een belangrijke standaard om aan te houden voor consistentie en het voorkomen van fouten in de code.

**Belangrijk bij AI-generatie:**
Als je vragen door een AI laat genereren, zal deze standaard ook 0-gebaseerde indexering gebruiken. Je kunt de `correctAnswer` waarde dus direct overnemen zonder deze aan te hoeven passen.

**Voorbeeld van correcte indexering in JSON:**
```json
{
  "id": "quiz_mc_1",
  "text": "Wat is de hoofdstad van Nederland?",
  "options": [
    "Rotterdam",
    "Amsterdam",
    "Den Haag",
    "Utrecht"
  ],
  "correctAnswer": 1,  // Verwijst naar "Amsterdam" (tweede optie, index 1)
  "feedback": "Amsterdam is de hoofdstad van Nederland.",
  "title": "Afsluitquiz: Vraag 1"
}
```

## 5. Interacties toevoegen of wijzigen

- Voeg nieuwe interacties toe aan de `interacties` array in het juiste hoofdstuk-JSON.
- Gebruik unieke ID's per interactie volgens het format hierboven.
- Nieuwe interacties worden automatisch weergegeven in de e-learning én meegenomen in het PDF-certificaat.

### Interactie Types en Velden

#### Reflection (Reflectie)
```json
{
  "id": "h1_reflection_1",
  "type": "reflection",
  "vraag": "Reflectiervraag hier",
  "minLength": 10,
  "maxLength": 500,
  "placeholder": "Typ hier je antwoord"
}
```

#### MC (Meerkeuzevraag)
```json
{
  "id": "h1_mc_1", 
  "type": "mc",
  "titel": "Optionele titel",
  "vraag": "De vraag",
  "options": ["Optie 1", "Optie 2", "Optie 3", "Optie 4"],
  "correctAnswer": 1,  // 0-based index (verwijst naar "Optie 2")
  "feedback": "Feedback na beantwoording"
}
```

#### Drag & Drop
```json
{
  "id": "h2_dragdrop_1",
  "type": "dragdrop",
  "vraag": "Sleep de items naar de juiste categorie",
  "items": [
    {"id": "item1", "label": "Item 1"},
    {"id": "item2", "label": "Item 2"}
  ],
  "targets": [
    {"id": "target1", "label": "Categorie 1"},
    {"id": "target2", "label": "Categorie 2"}
  ],
  "correctCombinations": [
    {"targetId": "target1", "itemId": "item1"},
    {"targetId": "target2", "itemId": "item2"}
  ],
  "feedbackCorrect": "Goed gedaan!",
  "feedbackIncorrect": "Probeer het nog eens."
}
```

**Let op**: De `correctCombinations` structuur is veranderd van een object naar een array van objecten voor betere leesbaarheid in het certificaat.

#### Self Assessment
```json
{
  "id": "h6_selfassessment_1",
  "type": "selfassessment",
  "vraag": "Beoordeel je eigen competenties"
}
```

#### Critical Analysis
```json
{
  "id": "h4_critical_1",
  "type": "critical_analysis",
  "vraag": "Analyseer de volgende technologie",
  "dropdown": ["Optie 1", "Optie 2", "Optie 3"],
  "vragen": [
    {"id": "voordelen", "vraag": "Wat zijn de voordelen?"},
    {"id": "nadelen", "vraag": "Wat zijn de nadelen?"}
  ],
  "opslaanLabel": "Sla analyse op"
}
```

## 6. Voortgang en antwoorden

- Voortgang en antwoorden worden opgeslagen in localStorage met specifieke keys:
  - Reflecties: `reflection_{hoofdstuknummer}_{interactie_id}_answered`
  - MC vragen: 
    - `mc_{hoofdstuknummer}_{interactie_id}_answered` (of beantwoord)
    - `mc_{hoofdstuknummer}_{interactie_id}_correct` (1 of 0)
    - `mc_{hoofdstuknummer}_{interactie_id}_selected` (geselecteerde optie index)
  - Drag & Drop: `dragdrop_{hoofdstuknummer}_{interactie_id}_correct` (true/false)
  - Self Assessment: `selfassessment_{hoofdstuknummer}_{interactie_id}_done` (JSON object)
  - Critical Analysis: `critical_analysis_{hoofdstuknummer}_{interactie_id}_answered` (JSON object)
- Afsluitquiz: `mc_quiz_answers` (array met alle antwoorden)
- Hoofdstuk voortgang: `chapterProgress` (array met status per hoofdstuk: 0, 0.5, of 1)

### Voortgang statussen:
- `0` = Geen interacties voltooid
- `0.5` = Enkele interacties voltooid
- `1` = Alle interacties voltooid

## 7. Certificaat/PDF

De PDF wordt volledig dynamisch opgebouwd met de volgende structuur:

### Pagina 1: Voorblad
- Logo's (iXperium Health bovenaan, HAN onderaan)
- Titel van de e-learning
- Naam van de student
- Datum van afronding
- Subtiele paarse achtergrondkleur buiten het kader

### Pagina 2: Leerdoelen
- Lijst van alle leerdoelen uit `config.json`
- Automatische paginering bij lange lijsten

### Pagina 3+: Afsluitquiz resultaten
- Alle vragen uit `afsluitquiz.json`
- Per vraag:
  - Vraagstelling
  - Gegeven antwoord met kleurcodering (groen=goed, rood=fout)
  - Bij foute antwoorden: het correcte antwoord
  - Feedback tekst

### Volgende pagina's: Antwoorden per hoofdstuk
- Voor elk regulier hoofdstuk een eigen sectie
- Per interactie:
  - Vraagstelling
  - Type-specifieke weergave van het antwoord
  - Kleurcodering per type (blauw=reflectie, groen/rood=MC, etc.)
  - Bij drag & drop: tabel met juiste koppelingen
  - Bij self assessment: lijst met competenties en niveaus

### Technische details:
- Gebruikt jsPDF library
- Custom fonts (Helvetica)
- Automatische tekstwrapping
- Responsive tabelweergave voor drag & drop
- Paginanummering (Pagina X van Y)
- **Volledig flexibel**: Alle hoofdstukken worden automatisch meegenomen op basis van `totalSections`
- Geen hardcoded hoofdstuknummers in de PDF generatie

## 8. Nieuwe cursus maken (clonen)

1.  **Kopieer de hele map** van de e-learning.
2.  **Pas de JSON-bestanden in `/content/` aan** voor je nieuwe onderwerp.
    -   Pas `config.json` aan (titel, leerdoelen, hoofdstukken).
    -   Pas de inhoud van de `hoofdstuk...json` bestanden aan.
3.  **(Optioneel) Vervang het logo** in `/images/` en update het pad in `config.json`.
4.  **Test de e-learning** door deze te openen in de browser.
5.  **Klaar!** Alles werkt direct, inclusief voortgang, interacties en PDF. Je hoeft **geen code aan te passen**.

## 9. Tips

- Maak altijd een backup van de originele JSON-bestanden.
- Test de e-learning na elke wijziging.
- Gebruik duidelijke feedback bij quizvragen.
- Gebruik unieke ID's voor elke vraag/interactie volgens het format.
- Voeg gerust nieuwe interactietypes toe; de structuur is flexibel.
- Check de browser console voor foutmeldingen tijdens ontwikkeling.

## 10. Styling en Layout

**Algemene richtlijn voor styling:**

Gebruik altijd de bestaande CSS-classes uit `styles.css` voor álle contentblokken, interactieve elementen en layout in de e-learning. Dit geldt voor:
- Hoofdstukken (`.section`)
- Titels (`.section-title`)
- Informatieblokken (`.info-card`)
- Interactieve elementen (`.interactive-block`)
- Voordelen/modules (`.benefit-card` en `.modules-list`)
- En alle andere standaard componenten

De spacing, kleuren en layout zijn centraal geregeld in de CSS. Voeg dus géén eigen marges, paddings of afwijkende styling toe aan losse elementen. Door de juiste classes te gebruiken, blijft de uitstraling overal consistent en onderhoudbaar.

### Kleurenschema
De belangrijkste kleuren zijn gedefinieerd als CSS variabelen:
```css
:root {
  --primary-purple: #662483;    /* Hoofdkleur paars */
  --secondary-purple: #8A4A9E;  /* Secundair paars */
  --accent-purple: #F2E6F7;     /* Licht paars voor accenten */
  --white: #ffffff;
  --light-gray: #f8f9fa;
  --medium-gray: #e9ecef;
  --dark-gray: #343a40;
}
```

### Belangrijke Styling Classes
- **Hoofdstukken**: Gebruik de `.section` class voor hoofdstukcontainers
- **Titels**: Gebruik de `.section-title` class voor hoofdstuktitels
- **Informatieblokken**: Gebruik de `.info-card` class voor paarse informatieblokken
- **Interactieve elementen**: Gebruik de `.interactive-block` class voor interactieve elementen
- **Statistieken**: Gebruik de `.stat-card` class voor statistiek kaarten
- **Voordelen**: Gebruik de `.benefit-card` class voor voordeel kaarten

### Voorbeelden van Layout Structuren
1. **Informatieblok met titel**:
```html
<div class="info-card">
  <h4 class="info-card-title">Titel</h4>
  <div class="info-card-content">
    Inhoud hier
  </div>
</div>
```

2. **Interactief element**:
```html
<div class="interactive-block">
  <div class="interactive-block-header">
    <svg class="icon">...</svg>
    <h4>Titel</h4>
  </div>
  <div class="interactive-block-content">
    Inhoud hier
  </div>
</div>
```

### Responsive Design
De e-learning is volledig responsive. Belangrijke breakpoints:
- Desktop: > 900px
- Tablet: 768px - 900px
- Mobiel: < 768px

De sidebar wordt automatisch een hamburger menu op mobiel.

### Aanpassen van de Styling
1. **Kleuren aanpassen**:
   - Pas de CSS variabelen in `:root` aan in `styles.css`
   - Behoud de structuur van de variabelen

2. **Layout aanpassen**:
   - Gebruik de bestaande classes
   - Voeg nieuwe classes toe indien nodig
   - Test op verschillende schermgroottes

3. **Nieuwe componenten**:
   - Volg de bestaande naming conventions
   - Gebruik de bestaande kleurvariabelen
   - Zorg voor responsive design

### Best Practices
- Gebruik altijd de bestaande CSS classes waar mogelijk
- Voeg nieuwe styling toe aan `styles.css`
- Test de styling op verschillende schermgroottes
- Behoud de bestaande kleurstructuur
- Gebruik de juiste HTML structuur voor nieuwe elementen

### Herbruikbare componenten: Benefit Cards en modules-list

Voor het tonen van een reeks modules of voordelen in een hoofdstuk gebruik je altijd de volgende structuur:

- Gebruik `<div class="modules-list">` als container voor de kaarten.
- Elke kaart krijgt `<div class="benefit-card">` als class.
- De spacing tussen de kaarten wordt automatisch geregeld via de CSS (Flexbox + gap).
- Voeg geen extra marges toe aan de kaarten zelf; de CSS regelt dit centraal.

**Voorbeeld:**
```html
<div class="modules-list">
  <div class="benefit-card">
    <h3>Module 1</h3>
    <div class="benefit-content">Beschrijving...</div>
  </div>
  <div class="benefit-card">
    <h3>Module 2</h3>
    <div class="benefit-content">Beschrijving...</div>
  </div>
</div>
```

**Let op:**
Gebruik altijd de bestaande classes uit `styles.css` voor alle standaard componenten (zoals `.info-card`, `.interactive-block`, `.section`, etc.) voor een uniforme uitstraling.

## 11. Samengestelde contentblokken toevoegen (zoals contactinformatie of locaties)

Soms wil je in een hoofdstuk een extra blok toevoegen met bijvoorbeeld contactinformatie, locaties of een lijst van activiteiten. Dit wijkt af van de standaard tekst- of interactieblokken. Hieronder vind je een voorbeeld en uitleg hoe je dit correct toevoegt.

### JSON-voorbeeld voor een locatieblok
```json
"ixperium_health": {
  "titel": "iXperium Health",
  "tekst": "iXperium Health is het Centre of Expertise voor zorgtechnologie van de HAN. Hier werken we samen met het werkveld aan innovatieve oplossingen in de zorg. We hebben specifieke expertise op het gebied van AI en kunnen je helpen met al je vragen over het gebruik van AI in de zorgpraktijk.",
  "locaties": {
    "titel": "Onze Locaties",
    "beschrijving": "In ons iXperium Health lab hebben we verschillende zorgtechnologieën beschikbaar waar AI een belangrijke rol in speelt. Je kunt hier experimenteren met deze technologieën en leren hoe je ze effectief kunt inzetten in je toekomstige praktijk.",
    "lijst": [
      {
        "naam": "iXperium Health Lab",
        "beschrijving": "Onze lokalen zijn speciaal ingericht voor het testen en ervaren van zorgtechnologie. Je kunt hier veilig experimenteren en leren hoe je deze technologieën kunt inzetten in je toekomstige praktijk.",
        "activiteiten": [
          "Experimenteren met AI-gestuurde zorgtechnologie",
          "Vragen stellen over het gebruik van AI in de zorg",
          "Leren van experts op het gebied van AI en zorgtechnologie",
          "Praten met andere studenten over hun ervaringen"
        ]
      }
    ]
  }
}
```

### Let op bij toevoegen van nieuwe blokken
- Zorg dat je de structuur van het JSON-blok volgt zoals hierboven.
- Voeg altijd een titel, beschrijving en indien van toepassing een lijst met subitems toe.
- Controleer of de frontend (meestal `js/dynamicContent.js`) deze structuur ondersteunt. Zo niet, pas de renderfunctie aan zodat alle velden (titel, beschrijving, lijst, activiteiten) worden weergegeven.
- Test altijd in de browser of alles zichtbaar is zoals bedoeld.

### Checklist voor samengestelde blokken
1. Is de JSON-structuur gelijk aan het voorbeeld?
2. Is de renderlogica in de frontend aangepast als je een nieuwe structuur toevoegt?
3. Worden alle velden (titel, beschrijving, lijst, activiteiten) getoond?
4. Is de weergave getest in de browser?

**Tip:** Voeg bij twijfel een screenshot toe van de gewenste weergave in de documentatie.

## 12. Stapsgewijze Aanpak met Cursor

Bij het werken met Cursor is het vaak effectiever om het proces van het toevoegen van een nieuw hoofdstuk op te splitsen in meerdere, kleinere prompts:

### Stap 1: Basis Structuur
```
Ik wil een nieuw hoofdstuk toevoegen aan de elearning over [onderwerp]. 
Help me met:
1. Een passende titel
2. De basis JSON structuur
3. De belangrijkste secties
```

### Stap 2: Inhoud
```
Voor het hoofdstuk over [onderwerp], help me met:
1. De inhoudelijke tekst voor elke sectie
2. Passende voorbeelden
3. Visuele elementen
```

### Stap 3: Interacties
```
Voor het hoofdstuk over [onderwerp], help me met:
1. Passende interacties ontwerpen
2. De juiste ID's volgens het format hX_type_nummer
3. Feedback mechanismen
```

### Stap 4: Technische Integratie
```
Help me met het technisch integreren van hoofdstuk X:
1. Aanpassingen in dynamicContent.js
2. Updates in script.js (totalSections, chapters array)
3. Navigatie updates in index.html
```

## 13. Veelvoorkomende Problemen en Oplossingen

### Hoofdstuk wordt niet geladen
- Check of het JSON bestand de juiste naam heeft
- Controleer of `totalSections` is aangepast
- Kijk of de case is toegevoegd in `dynamicContent.js`

### Interactie wordt niet weergegeven
- Controleer of het ID uniek is
- Check of het type correct is gespeld
- Kijk of alle verplichte velden aanwezig zijn

### Voortgang wordt niet opgeslagen
- Check de browser console voor errors
- Controleer of localStorage niet vol is
- Kijk of de ID's consistent zijn

### PDF generatie faalt
- Check of alle hoofdstukken correct laden
- Controleer of er speciale karakters in antwoorden staan
- Kijk of de browser PDF generatie ondersteunt

### Drag & Drop werkt niet in PDF
- Controleer de structuur van `correctCombinations` (moet een array zijn)
- Check of alle item en target ID's kloppen
- Kijk of de labels correct zijn ingevuld

## 14. Debugging en Development

### Browser Console
- Open met F12 of rechtermuisknop > Inspecteren
- Check de Console tab voor foutmeldingen
- Gebruik de Network tab om te zien welke bestanden laden

### LocalStorage bekijken
1. Open Developer Tools (F12)
2. Ga naar Application/Storage tab
3. Klik op Local Storage
4. Bekijk de opgeslagen waarden

### Test Modus
- Er is een `debug.js` bestand voor extra logging
- Dit wordt automatisch geladen en toont extra informatie in de console

### Voortgang resetten
- Gebruik de "Wis alle voortgang" knop in de UI
- Of via console: `localStorage.clear()`

### Test Commando's in Console
```javascript
// Check voortgang
console.log(localStorage.getItem('chapterProgress'));

// Check specifieke interactie
console.log(localStorage.getItem('reflection_1_h1_reflection_1_answered'));

// Check quiz antwoorden
console.log(JSON.parse(localStorage.getItem('mc_quiz_answers')));
```

## 15. Verdere Documentatie

Voor meer technische details, zie ook:
- `/documentatie/architecture.md` - Technische architectuur
- `/documentatie/changelog.md` - Wijzigingen en updates
- `/content/README.md` - Uitleg over content bestanden
- `/.cursor/rules/` - Ontwikkelrichtlijnen voor AI assistentie

## 16. Server Starten

Om de e-learning lokaal te testen:

### Python (aanbevolen)
```bash
python -m http.server 8000
```

### Node.js
```bash
npx http-server -p 8000
```

### VS Code
Gebruik de Live Server extensie

Navigeer dan naar `http://localhost:8000` in je browser.

## 17. Specifieke Structuur voor Afsluitend Hoofdstuk

Het afsluitende hoofdstuk (`hoofdstuk_afsluiting.json`) heeft een unieke structuur die verschilt van de reguliere hoofdstukken. Dit is bewust zo ontworpen omdat het hoofdstuk speciale functionaliteit bevat zoals certificaatgeneratie en portfolio-integratie.

### Structuur van hoofdstuk_afsluiting.json
```json
{
  "titel": "Jouw Certificaat en Groeipad",
  "introductie": "Inleidende tekst over het afronden van de e-learning",
  "overCertificaat": {
    "titel": "Wat kun je met dit certificaat?",
    "tekst": "Uitleg over het gebruik van het certificaat met markdown opmaak"
  },
  "stimulansHerhalingLeren": {
    "titel": "De kracht van herhaling en verdieping",
    "tekst": "Tekst over het belang van herhaling en leren"
  },
  "portfolioIntegratie": {
    "titel": "Certificaat gebruiken in je eJournal/Portfolio",
    "tip": "Praktische tip voor het bewaren van certificaten",
    "vraakUitleg": "Uitleg over het gebruik in portfolio met verwijzing naar VRAAK"
  },
  "vraakCriteria": {
    "titel": "VRAAK Criteria",
    "introductie": "Introductie over VRAAK criteria",
    "criteria": [
      {
        "naam": "Criterium naam",
        "beschrijving": "Criterium beschrijving"
      }
    ]
  },
  "verderKijkenDanCertificaten": {
    "titel": "Kijk verder dan het certificaat",
    "tekst": "Motiverende tekst over verdere ontwikkeling",
    "suggesties": [
      {
        "titel": "Suggestie titel",
        "tekst": "Suggestie beschrijving"
      }
    ]
  }
}
```

### Belangrijke verschillen met reguliere hoofdstukken:
1. **Geen interacties array**: In tegenstelling tot reguliere hoofdstukken bevat dit bestand geen `interacties` array. De quiz wordt apart geladen uit `afsluitquiz.json`.
2. **Speciale secties**: Het bevat unieke secties zoals `stimulansHerhalingLeren`, `portfolioIntegratie` en `verderKijkenDanCertificaten`.
3. **Focus op certificaat en groei**: De structuur is gericht op het certificaat als hulpmiddel voor verdere ontwikkeling, niet alleen als eindpunt.
4. **VRAAK criteria**: Bevat uitgebreide informatie over de VRAAK criteria voor portfolio-opbouw.

### Bij het klonen of aanpassen:
1. Behoud altijd de basisstructuur zoals hierboven beschreven
2. Pas alleen de inhoudelijke teksten aan
3. Voeg geen nieuwe hoofdsecties toe zonder de code aan te passen
4. Behoud de bestaande sectienamen en structuur
5. Zorg dat alle verplichte velden aanwezig blijven
6. Let op: markdown opmaak wordt ondersteund in de tekstvelden

### Technische integratie:
- Het afsluitende hoofdstuk wordt altijd als laatste geladen
- Het gebruikt `renderAfsluitingContent()` in `dynamicContent.js`
- De quiz wordt automatisch geladen uit `afsluitquiz.json`
- Het certificaat wordt gegenereerd op basis van alle verzamelde antwoorden
- De VRAAK criteria worden als een uitklapbare accordion weergegeven

### Veelvoorkomende problemen:
1. **Ontbrekende velden**: Als een verplicht veld ontbreekt, kan het certificaat niet worden gegenereerd
2. **Verkeerde structuur**: Afwijkingen van de structuur kunnen leiden tot fouten in de weergave
3. **Quiz integratie**: De quiz moet apart worden aangepast in `afsluitquiz.json`
4. **Markdown rendering**: Gebruik `\n` voor nieuwe regels en `\n\n` voor nieuwe paragrafen

### Best practices:
1. Maak een backup van het originele bestand
2. Test na elke wijziging of het certificaat nog correct wordt gegenereerd
3. Controleer of alle secties correct worden weergegeven
4. Behoud de markdown formatting in teksten (bijvoorbeeld `**vetgedrukt**` voor belangrijke punten)
5. Gebruik consistente naamgeving in suggesties en criteria
6. Houd de teksten motiverend en gericht op groei

## 18. Flexibel Werken met het Afsluitend Hoofdstuk

### De structuur is NIET vast - pas aan wat je nodig hebt!

Het afsluitende hoofdstuk (`hoofdstuk_afsluiting.json`) kan volledig aangepast worden aan jouw behoeften. Deze gids laat zien HOE je wijzigingen doorvoert, niet wat je moet behouden.

### Basis principe
Het afsluitende hoofdstuk bestaat uit:
1. Een JSON bestand (`hoofdstuk_afsluiting.json`) met jouw gewenste structuur
2. Een render functie (`renderAfsluitingContent()`) die de JSON omzet naar HTML
3. HTML containers in `index.html` waar de content geplaatst wordt

### Secties verwijderen

#### Stap 1: Verwijder uit JSON
Stel je wilt `stimulansHerhalingLeren` verwijderen:
```json
{
  "titel": "Jouw Certificaat",
  "introductie": "...",
  "overCertificaat": { ... },
  // stimulansHerhalingLeren verwijderd!
  "portfolioIntegratie": { ... },
  // etc...
}
```

#### Stap 2: Verwijder uit renderAfsluitingContent()
Zoek in `dynamicContent.js` naar:
```javascript
// Verwijder dit hele blok:
if (content.stimulansHerhalingLeren) {
    html += `...`;
}
```

### Nieuwe secties toevoegen

#### Stap 1: Voeg toe aan JSON
```json
{
  // ... bestaande secties ...
  "praktijkvoorbeelden": {
    "titel": "Voorbeelden uit de Praktijk",
    "voorbeelden": [
      {
        "naam": "Casus 1",
        "beschrijving": "Een fysiotherapeut gebruikt VR voor..."
      }
    ]
  }
}
```

#### Stap 2: Voeg rendering toe
In `renderAfsluitingContent()` voeg je toe waar je de sectie wilt:
```javascript
// Nieuwe sectie toevoegen
if (content.praktijkvoorbeelden) {
    html += `
        <div class="info-card">
            <h3 class="info-card-title">${content.praktijkvoorbeelden.titel}</h3>
            <div class="info-card-content">
    `;
    
    // Loop door voorbeelden
    content.praktijkvoorbeelden.voorbeelden.forEach(vb => {
        html += `
            <div class="voorbeeld-card">
                <h4>${vb.naam}</h4>
                <p>${vb.beschrijving}</p>
            </div>
        `;
    });
    
    html += `</div></div>`;
}
```

### Structuur fundamenteel wijzigen

#### Optie 1: Minimale structuur (alleen certificaat)
```json
{
  "titel": "Download je Certificaat",
  "instructie": "Vul je naam in en download je certificaat."
}
```

Pas `renderAfsluitingContent()` aan:
```javascript
function renderAfsluitingContent(content) {
    // Simpele versie
    const titelEl = document.getElementById('afsluiting-titel');
    if (titelEl) titelEl.textContent = content.titel;
    
    const introEl = document.getElementById('afsluiting-intro');
    if (introEl) introEl.textContent = content.instructie;
    
    // Verberg de portfolio container want die gebruiken we niet
    const portfolioContainer = document.getElementById('certificaat-portfolio-container');
    if (portfolioContainer) portfolioContainer.style.display = 'none';
}
```

#### Optie 2: Uitgebreide structuur met nieuwe features
```json
{
  "titel": "Jouw Leerresultaten",
  "statistieken": {
    "aantalInteracties": 15,
    "tijdBesteed": "2 uur",
    "score": 85
  },
  "badges": [
    {
      "naam": "Eerste Hoofdstuk",
      "icon": "🏆"
    }
  ],
  "vervolgcursussen": [
    {
      "titel": "Gevorderde Zorgtechnologie",
      "link": "https://..."
    }
  ]
}
```

### Volgorde van secties wijzigen

De volgorde in de JSON hoeft NIET de volgorde op het scherm te zijn. Je bepaalt de volgorde in `renderAfsluitingContent()`:

```javascript
// Eerst VRAAK criteria (ook al staat het laatste in JSON)
if (content.vraakCriteria) { ... }

// Dan pas de introductie
if (content.introductie) { ... }

// Etc.
```

### Verschillende versies voor verschillende doelgroepen

Je kunt conditionele rendering toevoegen:
```javascript
// Check een setting of parameter
const isStudent = localStorage.getItem('userType') === 'student';

if (isStudent && content.studentenInfo) {
    html += renderStudentSection(content.studentenInfo);
} else if (!isStudent && content.docentenInfo) {
    html += renderDocentSection(content.docentenInfo);
}
```

### Layout alternatieven

#### Tabs in plaats van accordions
```javascript
if (content.vraakCriteria) {
    html += `
        <div class="tabs-container">
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="vraak">VRAAK Criteria</button>
                <button class="tab-btn" data-tab="tips">Tips</button>
            </div>
            <div class="tab-content">
                <!-- Tab inhoud -->
            </div>
        </div>
    `;
}
```

#### Kaarten in plaats van lijsten
```javascript
content.suggesties.forEach(s => {
    html += `
        <div class="card-grid">
            <div class="suggestion-card">
                <div class="card-icon">💡</div>
                <h4>${s.titel}</h4>
                <p>${s.tekst}</p>
                <button class="btn-small">Meer info</button>
            </div>
        </div>
    `;
});
```

### Dynamische content op basis van prestaties

```javascript
// Haal quiz score op
const quizScore = parseInt(localStorage.getItem('quizScore') || '0');

// Toon verschillende content op basis van score
if (quizScore >= 80) {
    html += `<div class="congrats">Uitstekend gedaan! Je beheerst de stof goed.</div>`;
} else if (quizScore >= 60) {
    html += `<div class="encourage">Goed bezig! Overweeg enkele onderwerpen te herhalen.</div>`;
} else {
    html += `<div class="retry">Het lijkt erop dat herhaling nuttig zou zijn.</div>`;
}
```

### Test checklist na structuurwijzigingen

Na elke wijziging, controleer:
- [ ] JSON is valide (gebruik een JSON validator)
- [ ] Alle referenced IDs in HTML bestaan nog
- [ ] Console toont geen errors
- [ ] Quiz laadt nog steeds
- [ ] Certificaat genereert correct
- [ ] Mobiele weergave werkt nog

### Backup strategie

```powershell
# Maak een gedateerde backup voor grote wijzigingen
$date = Get-Date -Format "yyyy-MM-dd"
Copy-Item -Path "content\hoofdstuk_afsluiting.json" -Destination "content\backup\hoofdstuk_afsluiting_$date.json"
Copy-Item -Path "js\dynamicContent.js" -Destination "js\backup\dynamicContent_$date.js"
```

### Samenvatting
- **Alles is aanpasbaar** - geen enkele structuur is verplicht
- **Begin klein** - test elke wijziging direct
- **Denk in componenten** - elke sectie is een losstaand blok
- **Documenteer je wijzigingen** - voor jezelf en anderen

De structuur die er nu is, is slechts een voorbeeld. Voel je vrij om het volledig aan te passen aan jouw specifieke behoeften!

### Zoekfunctionaliteit en Nieuwe Lijststructuren

De e-learning module bevat een zoekfunctionaliteit die het mogelijk maakt om door alle content te zoeken. Deze functionaliteit is afhankelijk van de structuur van de JSON-bestanden in de `/content/` map.

**BELANGRIJK:** Als je bij het aanpassen van de inhoud of het maken van een nieuwe module nieuwe JSON-structuren introduceert waarbij arrays worden gebruikt om lijsten (bijvoorbeeld opsommingen, bullet points, etc.) weer te geven, moet je een extra stap uitvoeren om ervoor te zorgen dat de zoekfunctie correct naar deze lijstitems kan scrollen en deze kan markeren.

#### Wat zijn lijstitems?

Lijstitems zijn elementen die onderdeel zijn van een array in de JSON-structuur en die in de UI worden weergegeven als:
- Opsommingstekens (bullets)
- Genummerde lijsten  
- Sets van opties (bijvoorbeeld bij meerkeuzevragen)
- Collecties van voorbeelden, criteria, stappen, etc.

#### Automatische detectie via configuratiebestand

De zoekfunctionaliteit gebruikt een extern configuratiebestand om te bepalen welke JSON-sleutels duiden op lijsten. Dit configuratiebestand bevindt zich in:

**`content/search_config.json`**

Dit bestand bevat een lijst van alle bekende "list keys" - JSON-sleutelnamen die aangeven dat de bijbehorende waarde een lijst/array is:

```json
{
  "knownListKeys": [
    "items", 
    "subitems", 
    "statistieken", 
    "bullets", 
    "steps", 
    "options", 
    "antwoorden", 
    "questions", 
    "leerdoelen", 
    "concepten",
    "... meer sleutels ..."
  ]
}
```

#### Nieuwe lijststructuren toevoegen

**Eenvoudige methode (aanbevolen):**
1. Open `content/search_config.json`
2. Voeg je nieuwe sleutelnaam toe aan de `knownListKeys` array
3. Sla het bestand op

**Voorbeeld:** Als je een nieuwe JSON-structuur hebt met een veld genaamd `kenmerken` dat een array bevat:

```json
{
  "technologie_overzicht": {
    "titel": "Nieuwe Technologie",
    "kenmerken": [
      "Gebruiksvriendelijk",
      "Veilig", 
      "Kosteneffectief"
    ]
  }
}
```

Dan voeg je `"kenmerken"` toe aan de lijst in `search_config.json`:

```json
{
  "knownListKeys": [
    "items", 
    "subitems", 
    "statistieken", 
    "bullets",
    "kenmerken"
  ]
}
```

#### Fallback mechanisme

Als het `search_config.json` bestand niet kan worden geladen (bijvoorbeeld bij een serverfout), gebruikt de zoekfunctionaliteit automatisch een ingebouwde fallback lijst met de meest voorkomende sleutels. Dit zorgt ervoor dat de zoekfunctionaliteit blijft werken, ook als er iets mis gaat met het configuratiebestand.

#### Voor ontwikkelaars

De zoekfunctionaliteit laadt het configuratiebestand asynchroon bij het opstarten via:
- `loadSearchConfig()` functie in `js/search.js`
- Automatische fallback bij laadfouten
- Gebruik van `searchConfig.knownListKeys` in plaats van hardcoded array

#### Voordelen van deze aanpak

1. **Eenvoudig onderhoud**: Geen JavaScript-kennis vereist
2. **Geen code-aanpassingen**: Alles via configuratiebestanden
3. **Veilig**: Fallback mechanisme voorkomt crashes
4. **Flexibel**: Makkelijk uit te breiden voor nieuwe projecten
5. **Gedeeld**: Configuratie staat bij de content, niet in de code

### Layout & Structuur - Hoofdstukopbouw

De standaard layout voor hoofdstukken is zoals in Hoofdstuk 1: alle content (zoals info-cards, scenario's, tabellen, etc.) komt direct in de hoofdcontainer of in een brede `.content-block`. Hierdoor loopt de content verder door naar links en rechts en is deze breder dan wanneer je `<section class="section">` gebruikt.

Gebruik `<section class="section">` **alleen** als je bewust een smallere, gecentreerde layout wilt voor een bepaald onderdeel.

**Voorbeeld standaard layout (zoals H1):**
```html
<div class="content-block">
  <div class="info-card">...</div>
  <div class="info-card">...</div>
  <!-- etc. -->
</div>
```

**Voorbeeld smallere sectie:**
```html
<section class="section">
  <h2 class="section-title">Titel van de sectie</h2>
  <div class="section-content">
    <!-- Inhoud -->
  </div>
</section>
```

**Let op:**
- Gebruik de standaard layout voor alle hoofdcontent van een hoofdstuk.
- Gebruik `<section class="section">` alleen voor onderdelen die extra focus of een smallere opmaak nodig hebben.

### Accordion Component (Uitklapbaar paneel)

Het `accordion` component is een flexibel uitklapbaar paneel dat gebruikt kan worden om content te verbergen tot de gebruiker erop klikt. Dit is ideaal voor optionele informatie, achtergrondmateriaal, of, zoals in Hoofdstuk 1, een podcast.

**Belangrijkste feature:** De `content` array van een accordeon kan elke ander standaard content-component bevatten. Je kunt er dus tekstblokken, afbeeldingen, video's en zelfs audio-spelers in nesten.

**JSON Voorbeeld (tekstblok met audiospeler in een accordeon):**
```json
{
  "type": "accordion",
  "titel": "Podcast: Beluister de introductie van dit hoofdstuk",
  "content": [
    {
      "type": "content-text",
      "tekst": "Liever luisteren dan lezen, of de stof van dit hoofdstuk nog eens rustig herhalen? Beluister dan de introductie als podcast."
    },
    {
      "type": "audio-grid",
      "kolommen": 1,
      "items": [
        {
          "id": "h1_audio_1",
          "titel": "Podcast: Introductie op AI in de Fysiotherapie",
          "beschrijving": "Een audio-versie van de introductie op deze e-learning.",
          "bron": "audio/H1-introductie-podcast.wav",
          "meta": ""
        }
      ]
    }
  ]
}
```

<div class="icon-card">
    <div class="icon-subtitle">Hier de titel (optioneel)</div>
    <div class="icon-image">
        <img src="images/Blijvende_afb/Test_logo_showcase.png" alt="Test Logo">
    </div>
    <h3>Icon Kaart (Grid Component)</h3>
    <div class="icon-content">
        <p><strong>Positief voorbeeld:</strong> Een beschrijving van een positief aspect van het thema.</p>
        <p><strong>Uitdaging:</strong> Een beschrijving van een uitdaging binnen het thema.</p>
        <div class="reflection-prompt">
            <p>Een reflectievraag om de gebruiker aan het denken te zetten.</p>
        </div>
    </div>
</div>
<p>Gebruik <code>.icon-card-grid &gt; .icon-card</code>.</p>

- **Reflectievragen:** Elk hoofdstuk (behalve de afsluiting) moet eindigen met een reflectie-interactie. Dit is een vast onderdeel van de didactische opbouw.

### Belangrijke Technische Aandachtspunten

- **ID's:** Gebruik het format `{hoofdstuknummer}_{type}_{volgnummer}` voor alle contentblokken en interacties. Voorbeeld: `h1_mc_1`, `h3_reflection_1`.
- **Afbeeldingen:** Plaats alle afbeeldingen in de `/images` map. Optimaliseer de bestandsgrootte voor snelle laadtijden.
- **Styling:** Maak uitsluitend gebruik van de bestaande CSS-classes die gedefinieerd zijn in `stijlgids.html` en de bestanden in `/css/components`. Voeg geen inline styles toe.
- **Reflectievragen (Lengte):** Bij het toevoegen van een nieuwe reflectievraag, voeg **geen** `minLength` of `maxLength` toe in de JSON. Het systeem past automatisch de standaardwaarden toe (minimaal 10, maximaal 1500 tekens). Voeg deze eigenschappen alleen toe als er een specifieke, expliciet gewenste afwijking van de standaard nodig is.

## 3. Testen en Valideren

Nadat je wijzigingen hebt doorgevoerd, is het cruciaal om de e-learning lokaal te testen.