# E-learning Architectuur

Dit document biedt een diepgaand technisch overzicht van de e-learning module.

## 1. Architectuur & Dataflow

Deze e-learning is gebouwd op een dynamische architectuur waarbij de content en structuur volledig zijn losgekoppeld van de weergave. De `config.json` fungeert als de "Single Source of Truth".

### Initialisatie-volgorde:
1.  **`js/main.js` (`initializeElearning`)** wordt als eerste uitgevoerd bij het laden van de pagina.
2.  Het script haalt **`content/config.json`** op.
3.  Op basis van de `hoofdstukken`-array in de config, worden de globale variabelen `chapters` en `totalSections` gevuld in `js/script.js`.
4.  Vervolgens wordt de HTML-structuur dynamisch opgebouwd:
    *   De navigatie-items in de sidebar worden gegenereerd.
    *   De `<section>`-elementen voor elk hoofdstuk worden in de hoofdpagina geplaatst.
5.  Tot slot wordt de overige applicatielogica in `js/script.js` uitgevoerd (event listeners, voortgangsberekening, etc.).

---

## 2. Bestandsstructuur & Rollen

-   `/content/`: Bevat alle content en de centrale configuratie.
    -   **`config.json`**: **Het belangrijkste configuratiebestand.** Definieert de algemene titel, leerdoelen, en de volledige structuur van de hoofdstukken (bestandsnamen en titels).
    -   `hoofdstuk1.json` t/m `hoofdstukN.json`: Inhoud voor de reguliere hoofdstukken.
    -   `hoofdstuk_afsluiting.json`: De content voor het laatste, afsluitende hoofdstuk, dat een unieke structuur heeft.
    -   `afsluitquiz.json`: De vragen voor de eindquiz.
    -   `search_config.json`: Configuratie voor de zoekfunctionaliteit.
-   `/js/`: Bevat de logica van de applicatie.
    -   **`main.js`**: De "orkestrator". Start de applicatie, leest de configuratie en bouwt de dynamische UI.
    -   **`script.js`**: Bevat de algemene logica voor de gebruikersinterface, zoals navigatie (volgende/vorige), voortgangsupdates en het afhandelen van interacties.
    -   **`dynamicContent.js`**: Verantwoordelijk voor het laden en renderen van de specifieke content van een hoofdstuk wanneer dit wordt geactiveerd.
    -   `pdfGenerator.js`: Genereert het PDF-certificaat.
    -   `quiz.js`: Regelt de logica voor de eindquiz.
    -   `search.js`: Behandelt de zoekfunctionaliteit.
-   `/css/`: Bevat alle styling.
-   `index.html`: Dient als een "schil" met lege containers die dynamisch worden gevuld door `js/main.js`.

---

## 3. Content Structuur & JSON Schema's

### `config.json`
Het hart van de e-learning. De `hoofdstukken`-array bepaalt de volgorde en titels.

**⚠️ BELANGRIJK: Titel beheer gebeurt UITSLUITEND via config.json**
- De `titel` in config.json wordt automatisch gebruikt voor de browser tab, header en alle andere weergaves
- De `<title>` tag in index.html dient alleen als fallback voor als JavaScript faalt
- Wijzig NOOIT de HTML titel handmatig - het systeem overschrijft deze automatisch

```json
{
  "titel": "Leren leren",
  "leerdoelen": [...],
  "hoofdstukken": [
    { "file": "hoofdstuk1.json", "titel": "Introductie" },
    { "file": "hoofdstuk2.json", "titel": "Wat is AI eigenlijk?" },
    // ...meer hoofdstukken...
    { "file": "hoofdstuk_afsluiting.json", "titel": "Afsluiting" }
  ],
  "organisatie": "iXperium Health",
  // ... rest van de config ...
}
```

### `hoofdstukX.json` en Interacties
Elk hoofdstukbestand definieert de content en de interactieve elementen. De structuur scheidt de statische content (tekst, afbeeldingen) van de interacties (vragen, opdrachten).

**Basisstructuur:**
```json
{
  "title": "Titel van het Hoofdstuk",
  "hoofdstuk": "hoofdstuk1", // of een unieke identifier
  "content": [
    {
      "type": "text",
      "content": "Paragraaf met tekst..."
    },
    {
      "type": "image",
      "src": "images/voorbeeld.png",
      "alt": "Beschrijving van de afbeelding"
    }
  ],
  "interacties": [
    {
      "id": "h1_mc_1",
      "type": "mc",
      "title": "Titel van de Interactie",
      "question": "De vraag die gesteld wordt...",
      // ...andere velden specifiek voor het interactietype
    }
  ]
}
```

De `interacties`-array bevat objecten die de verschillende interactieve elementen van het hoofdstuk definiëren. De `id` van elke interactie moet uniek zijn.

**ID-structuur:** `{hoofdstuknummer}_{type}_{volgnummer}` (bijv. `h1_mc_1`)

---

## 4. Een Hoofdstuk Wijzigen, Toevoegen of Verwijderen

Dankzij de dynamische architectuur is het aanpassen van de structuur zeer eenvoudig:

1.  **Open `content/config.json`**.
2.  **Pas de `hoofdstukken`-array aan**:
    *   **Wijzigen**: Verander de `titel` van een object.
    *   **Toevoegen**: Voeg een nieuw object `{ "file": "nieuw_hoofdstuk.json", "titel": "Nieuwe Titel" }` toe op de gewenste positie. Maak het bijbehorende JSON-bestand aan in de `/content` map.
    *   **Verwijderen**: Verwijder een object uit de array.

De gehele applicatie (navigatie, secties, titels, voortgang) past zich automatisch aan. Er zijn **geen wijzigingen** in `index.html` of andere JavaScript-bestanden nodig.

---

## 5. Voortgang & Dataopslag (`localStorage`)

De voortgang en antwoorden van de gebruiker worden opgeslagen in `localStorage`. Dit stelt de gebruiker in staat om de cursus te verlaten en later terug te keren zonder de voortgang te verliezen.

-   **Voortgang per hoofdstuk:** De sleutel `chapterProgress` bevat een array die de status van elk hoofdstuk bijhoudt (0: niet gestart, 0.5: bezig, 1: voltooid).
-   **Antwoorden op interacties:** De antwoorden worden opgeslagen met een unieke sleutel die het type, hoofdstuknummer en interactie-ID combineert.
    -   `reflection_{id}_answered`: Tekst van het antwoord.
    -   `mc_{id}_answered`: Of de vraag beantwoord is.
    -   `mc_{id}_correct`: Of het antwoord correct was (1 of 0).
-   **Antwoorden op de eindquiz:** De sleutel `mc_quiz_answers` bevat een array met alle gegeven antwoorden op de quizvragen.

---

## 6. PDF Certificaat Generatie (`jsPDF`)

Het PDF-certificaat wordt volledig dynamisch gegenereerd door `pdfGenerator.js` met behulp van de jsPDF-bibliotheek. De generator haalt alle opgeslagen antwoorden uit `localStorage` op.

De PDF heeft de volgende opbouw:
1.  **Voorblad:** Met de titel van de cursus, naam van de student, organisatie, logo en datum.
2.  **Leerdoelen:** Een lijst van de leerdoelen uit `config.json`.
3.  **Resultaten Eindquiz:** Een overzicht van alle quizvragen, het gegeven antwoord (met kleurcodering voor goed/fout) en de feedback.
4.  **Portfolio per Hoofdstuk:** Voor elk hoofdstuk volgt een sectie met alle interacties en de door de gebruiker gegeven antwoorden.

Door deze dynamische opzet worden alle hoofdstukken en interacties automatisch meegenomen in het certificaat, ongeacht het aantal.

---

## 7. CSS Architectuur en Componenten

De styling is gecentraliseerd in `css/styles.css` en maakt gebruik van CSS-variabelen voor eenvoudige thematisering.

-   **:root Kleurenschema:**
    ```css
    :root {
      --primary-purple: #662483;
      --secondary-purple: #8A4A9E;
      /* ... en andere kleuren ... */
    }
    ```

-   **Belangrijkste herbruikbare componenten (klassen):**
    -   `.section`: De container voor een contentsectie.
    -   `.section-title`: De standaard titel voor een sectie.
    -   `.info-card`: Een uitgelicht blok met een paarse rand, voor quotes of belangrijke mededelingen.
    -   `.interactive-block`: De container voor een interactief element.
    -   `.accent-blok`: Een flexibel blok om tekst uit te lichten, zoals statistieken, weetjes of citaten. Kent varianten zoals `accent-blok--statistiek` en `accent-blok--weetje` die de styling aanpassen.
    -   `.resource-grid-container` & `.resource-card`: Voor het tonen van een grid met externe bronnen, inclusief logo en een (automatisch gegenereerde) QR-code.
    -   **Doos-in-doos structuur**: Door componenten (zoals een `resource-grid-container`) te nesten binnen de `content`-array van een `info-card`, kunnen complexe, visueel gegroepeerde blokken worden gemaakt.
    -   `.modules-list` & `.benefit-card`: Voor een grid-layout met kaarten (voor voordelen, modules, etc.).
    -   `.video-container-full-width` & `.video-wrapper`: Voor responsive video-embeds.

De bedoeling is om altijd deze bestaande klassen te gebruiken om een consistente look & feel te garanderen.

---

## 8. CSS Bestandsorganisatie en Conventies

### CSS Bestandsstructuur
De styling is georganiseerd in een modulaire structuur voor optimale onderhoudbaarheid:

```
/css/
├── styles.css                    # Hoofdbestand met CSS-variabelen en globale stijlen
└── components/                   # Component-specifieke styling
    ├── afsluiting.css           # Afsluitende hoofdstuk styling
    ├── audio.css                # Audio spelers en gerelateerde componenten
    ├── buttons.css              # Knoppen, controls en interactieve elementen
    ├── cards.css                # Info-cards, benefit-cards, portfolio-booster-cards
    ├── content-blocks.css       # Accent-blokken (statistieken, weetjes, citaten) en accordions
    ├── footer.css               # Footer styling
    ├── header.css               # Header en titel styling
    ├── images.css               # Afbeeldingen, iconen en media
    ├── interactive.css          # Quiz, reflection, dragdrop, selfassessment
    ├── layout.css               # Algemene layout componenten en containers
    ├── leerdoelen.css           # Dynamische leerdoelen component
    ├── modal.css                # Modal dialogs en popups
    ├── navigation.css           # Sidebar, navigatie en voortgangsindicatoren
    ├── process-flow.css         # Stappenplannen en tijdlijnen
    ├── quiz.css                 # Quiz-specifieke styling
    ├── search.css               # Zoekfunctionaliteit
    ├── sidebar.css              # Sidebar-specifieke styling
    ├── stijlgids.css            # ONTWIKKELINGSHULPMIDDEL - alleen voor stijlgids.html
    └── video.css                # Video containers en embeds
```

### Dynamische Content Componenten

#### Leerdoelen Component (`leerdoelen-dynamic`)
Een volledig dynamisch component dat automatisch de leerdoelen uit `config.json` ophaalt en weergeeft:

**Implementatie:**
- **JavaScript**: `window.elearningConfig` globaal beschikbaar via `main.js`
- **Content Type**: `leerdoelen-dynamic` in `dynamicContent.js`
- **Styling**: `css/components/leerdoelen.css` 
- **Usage**: Voeg block toe aan hoofdstuk content

**JSON Structuur:**
```json
{
  "type": "leerdoelen-dynamic",
  "portfolio_tip": "Optionele portfolio tekst hier..."
}
```

**Parameters:**
- `portfolio_tip` (optioneel): Configureerbare portfolio/certificaat tekst
- Indien weggelaten: geen footer getoond (volledig flexibel voor andere organisaties)

**Voordelen:**
- ✅ **Herbruikbaar**: Automatische synchronisatie met config.json
- ✅ **Flexibel**: Portfolio tip configureerbaar per organisatie/onderwerp
- ✅ **Modulair**: Eigen CSS component bestand  
- ✅ **Responsive**: 2-kolom grid op desktop, 1-kolom op mobiel
- ✅ **Toegankelijk**: Focus states en checkmark animaties

### Belangrijke Conventies

#### ✅ Waar styling thuishoort:
- **Component-specifieke styling**: In het bijbehorende component-bestand
- **Algemene styling**: In `styles.css` (CSS-variabelen, globale stijlen)
- **Stijlgids styling**: Alleen in `stijlgids.css`

#### ❌ Wat NIET in stijlgids.css thuishoort:
- E-learning component styling
- Algemene UI elementen
- Content-specifieke styling

#### Naming Conventies:
- **Component classes**: Gebruik kebab-case (bijv. `.accent-blok`, `.info-card`)
- **Varianten**: Gebruik BEM-notatie (bijv. `.accent-blok--statistiek`)
- **States**: Gebruik BEM-notatie (bijv. `.button--active`, `.card--disabled`)

#### CSS Variabelen:
Alle kleuren, spacing en andere design tokens zijn gedefinieerd in `styles.css`:
```css
:root {
  --primary-purple: #662483;
  --secondary-purple: #8A4A9E;
  --accent-purple: #E6E6FA;
  --border-radius-standard: 8px;
  --border-radius-large: 12px;
  /* ... etc */
}
```

### Ontwikkelingsrichtlijnen

#### Bij het toevoegen van nieuwe styling:
1. **Identificeer het component type** (card, interactive, layout, etc.)
2. **Plaats styling in het juiste component-bestand**
3. **Gebruik bestaande CSS-variabelen** voor consistentie
4. **Test in de stijlgids** om te controleren of het correct wordt weergegeven

#### Bij het wijzigen van bestaande styling:
1. **Controleer eerst de stijlgids** om de impact te zien
2. **Gebruik CSS-variabelen** voor thematisering
3. **Test op verschillende schermformaten** (responsive design)

#### Stijlgids als ontwikkelingshulpmiddel:
- `stijlgids.html` toont alle beschikbare componenten
- Gebruik dit voor het testen van nieuwe styling
- Alle wijzigingen zijn direct zichtbaar

---

## 9. Development & Debugging

-   **Browser Console (F12):** De eerste plek om te kijken voor foutmeldingen.
-   **LocalStorage Inspecteren:** In de Developer Tools (F12), ga naar het `Application` (of `Opslag`) tabblad en selecteer `Local Storage` om alle opgeslagen data te bekijken.
-   **Voortgang Wissen:**
    -   Gebruik de "Wis alle voortgang" knop in de UI.
    -   Of voer `localStorage.clear()` uit in de console om direct alle opgeslagen data te verwijderen.
-   **Test Commando's in de Console:**
    ```javascript
    // Check de voortgangsarray
    console.log(JSON.parse(localStorage.getItem('chapterProgress')));

    // Check een specifiek antwoord
    console.log(localStorage.getItem('reflection_h1_reflection_1_answered'));
    ```

## Dynamische Content

De content van de e-learning wordt dynamisch geladen uit JSON-bestanden in de `/content` map.

-   `content/config.json`: Bevat de algemene configuratie, zoals de titel van de e-learning en een lijst van alle hoofdstukken met hun bestandsnamen.
-   `content/hoofdstukX.json`: Elk hoofdstuk heeft zijn eigen JSON-bestand met de specifieke content-onderdelen en interacties.
-   `js/main.js`: Leest `config.json` en bouwt de basis-UI (sidebar, secties).
-   `js/dynamicContent.js`: Bevat de logica om de content van een specifiek hoofdstuk op te halen en te renderen in de juiste sectie.
-   `js/script.js`: Bevat de hoofd-applicatielogica, zoals navigatie tussen secties.

## CSS Loading Strategie

### Performance-geoptimaliseerde CSS Loading
Alle CSS component bestanden worden geladen via `<link>` tags in `index.html` voor optimale performance:

**Voordelen van deze aanpak:**
- **Parallelle downloads**: Browser kan alle CSS bestanden tegelijkertijd downloaden
- **Snellere rendering**: Browser kan eerder beginnen met het renderen van de pagina
- **Eenvoudiger debugging**: Alle CSS referenties zijn direct zichtbaar in de HTML
- **Minder cascading complexiteit**: Geen nested @import statements

### ⚠️ Belangrijke Regel: CSS Referenties
**ALLE CSS component bestanden worden ALLEEN geladen via `<link>` tags in index.html**

- ❌ **Voeg GEEN @import statements toe aan styles.css**
- ✅ **Voeg nieuwe CSS bestanden toe aan de component lijst in index.html**
- ✅ **Houd de alfabetische volgorde aan voor overzicht**

### Bestandsrollen:
- **`styles.css`**: Bevat alleen CSS variabelen (:root) en algemene body/html styling
- **`components/*.css`**: Specifieke component styling die via index.html wordt geladen

### Code Opmerkingen:
Beide bestanden bevatten duidelijke waarschuwingen om toekomstige dubbele referenties te voorkomen:
- `styles.css`: Waarschuwing tegen het toevoegen van @import statements
- `index.html`: Uitleg van de CSS loading strategie

---

## Developer Mode

Om het testen van interactieve componenten te vergemakkelijken, is er een "Developer Mode" ingebouwd die alleen beschikbaar is wanneer de applicatie lokaal wordt gedraaid (`localhost` of `127.0.0.1`).

-   **Activatie**: De modus wordt automatisch ingeschakeld op basis van de `hostname`.
-   **Knop**: In de header verschijnt een knop "Interacties Testen".
-   **Content**: Als op de knop wordt geklikt, wordt de content van `content/voorbeeld_interacties.json` geladen. Dit bestand bevat voorbeelden van alle beschikbare interactietypes (`mc`, `reflection`, `dragdrop`, etc.).
-   **Implementatie**:
    -   `js/main.js` (`initializeDevMode`): Detecteert de lokale omgeving, maakt de knop zichtbaar en voegt een event listener toe.
    -   `js/dynamicContent.js` (`renderStandaloneChapter`): Een speciale functie om een hoofdstuk te renderen buiten de standaard paginastructuur, specifiek voor deze modus.
    -   Een "Terug"-knop wordt toegevoegd aan de header om de pagina te herladen en terug te keren naar de normale e-learningweergave. 