# Stijlgids voor AI - E-learning Content

Dit document is de handleiding voor het structureren van content naar een valide JSON-formaat voor onze e-learning. Gebruik dit document in combinatie met `documentatie/voorbeeld_hoofdstuk.json` om nieuwe hoofdstukken te genereren.

---

## Hoofdstukstructuur

Elk hoofdstuk volgt een vaste, gestructureerde opbouw:

### 1. Hoofdstuk Opening
- **Verplicht:** Start altijd met een `info-card` (vaak met `classes: "welcome-card"`) als algemene inleiding

### SPECIAAL VOOR HOOFDSTUK 1 (Introductie hoofdstuk):
⚠️ **KRITIEKE COMPONENTEN - NIET VERWIJDEREN:**
- **`leerdoelen-dynamic`**: Verplichte component die automatisch alle leerdoelen uit config.json toont
- **"Klaar voor de start?" sectie**: Verplichte afsluiting van hoofdstuk 1 die studenten voorbereid op de rest van de e-learning

Deze componenten zijn essentieel voor de leerervaring en mogen nooit worden weggelaten of vervangen bij het aanpassen van hoofdstuk 1.

### 2. Sectie Structuur
Elke sectie binnen een hoofdstuk volgt dit patroon:
- **`section-title`** - Naam van de nieuwe sectie
- **`content-text`** - Introductietekst die context geeft (sterk aanbevolen)
- **Content componenten** - Een of meerdere complexe componenten (grids, video's, tabellen, etc.)

### 3. Divider Regels (Visuele Scheiding)
Gebruik `{ "type": "divider" }` voor optimale visuele structuur:
- **Tussen meerdere componenten:** Plaats dividers TUSSEN content componenten binnen een sectie
- **Niet bij enkele component:** Als er maar één component na content-text staat, geen divider
- **Niet aan sectie-einde:** Geen divider na het laatste component van een sectie (de volgende section-title geeft al visuele scheiding)
- **Wel na complexe sequenties:** Als je meerdere gerelateerde componenten hebt, gebruik dividers voor duidelijkheid

### 4. Content-Text Gebruik
- **Voor introductie:** Gebruik `content-text` direct na `section-title` om context te geven
- **Voor uitleg:** Plaats `content-text` vóór complexe componenten (grids, video's) ter introductie
- **Voor tussentekst:** Gebruik `content-text` tussen componenten voor extra uitleg

### Voorbeeld Structuur:
```
info-card (hoofdstuk opening)
section-title (sectie 1)
content-text (intro sectie 1)
content-subtitle (subsectie A)
content-text (uitleg subsectie A)
component A (bijv. card-grid)
divider
content-subtitle (subsectie B)
content-text (uitleg subsectie B)
component B (bijv. video-grid)
section-title (sectie 2)
content-text (intro sectie 2)
component C (enige component, dus geen divider)
```

### 5. Hoofdstuk Omvang (Belangrijk)
**Doel:** Hoofdstukken beheersbaar en aantrekkelijk houden voor studenten.

**Richtlijnen:**
- **Flexibele sectie-indeling:** 2-6 hoofdsecties (section-titles) per hoofdstuk - aantal moet passen bij de inhoud
- **Indicatieve leestijd:** 5-12 minuten (huidige hoofdstukken ~5-6 min, max 2x langer mogelijk)
- **Eén hoofdthema:** Focus op één centraal onderwerp per hoofdstuk
- **Hapklare brokken:** Voorkom cognitieve overbelasting bij studenten

**Praktische toepassing:**
- Als een hoofdstuk te lang wordt, splits het op in meerdere hoofdstukken
- Gebruik de info-card opening om het hoofdthema helder te definiëren  
- Zorg dat elke sectie logisch bijdraagt aan het hoofdthema
- Denk aan de aandachtsspanne: liever 2 korte, krachtige hoofdstukken dan 1 lange

---

## Content Componenten (`content` array)

### 1. Info Card
- **Type:** `info-card`
- **Gebruik:** Voor uitgelichte informatie. Verplicht als eerste element. Ook voor samenvattingen of waarschuwingen.
- **Variaties:** Gebruik de `classes` property: `welcome-card`, `warning-card`, `purple-kader`.

#### Info Card Varianten - Wanneer Gebruik Je Wat?

**Basis Info Card:** Voor eenvoudige uitgelichte informatie
- **Gebruik voor:** Welkomsteksten, korte samenvattingen, eenvoudige waarschuwingen
- **Structuur:** Alleen `titel` en `tekst`
```json
{
  "type": "info-card",
  "classes": "welcome-card",
  "titel": "Titel van de kaart",
  "tekst": "De hoofdtekst van de kaart."
}
```

**Info Card met Items:** Voor gestructureerde lijsten
- **Gebruik voor:** Stappenplannen, criteria, lijsten van voordelen/nadelen, gestructureerde waarschuwingen
- **Structuur:** `titel` + `items` array
```json
{
  "type": "info-card",
  "classes": "warning-card",
  "titel": "De belangrijkste valkuil: Privacy en Patiëntgegevens",
  "items": [
    { "titel": "ABSOLUTE NO-GO", "tekst": "Gebruik NOOIT persoonlijk identificeerbare patiëntinformatie in een publieke AI-tool zoals ChatGPT." },
    { "titel": "Waarom?", "tekst": "Het is een ernstige schending van de privacywetgeving (AVG) en je beroepsethiek." },
    { "titel": "Wat dan wel?", "tekst": "Gebruik altijd geanonimiseerde of volledig fictieve casussen voor je prompts." },
    { "titel": "Onthoud", "tekst": "De AI is een hulpmiddel, geen collega. Behandel het als een openbaar forum." }
  ]
}
```

**Info Card met Andere Valkuilen:** Voor uitgebreide waarschuwingen met subcategorieën
- **Gebruik voor:** Complexe risico's met subcategorieën, wanneer je wilt verwijzen naar andere hoofdstukken
- **Structuur:** `titel` + `items` + `andere_valkuilen` + optioneel `afsluitende_tekst`
```json
{
  "type": "info-card",
  "classes": "warning-card",
  "titel": "De belangrijkste valkuil: Privacy en Patiëntgegevens",
  "items": [
    { "titel": "ABSOLUTE NO-GO", "tekst": "Gebruik NOOIT persoonlijk identificeerbare patiëntinformatie in een publieke AI-tool zoals ChatGPT." },
    { "titel": "Waarom?", "tekst": "Het is een ernstige schending van de privacywetgeving (AVG) en je beroepsethiek." },
    { "titel": "Wat dan wel?", "tekst": "Gebruik altijd geanonimiseerde of volledig fictieve casussen voor je prompts." },
    { "titel": "Onthoud", "tekst": "De AI is een hulpmiddel, geen collega. Behandel het als een openbaar forum." }
  ],
  "andere_valkuilen": {
    "titel": "Andere belangrijke valkuilen zijn:",
    "items": [
      { "titel": "Verificatie", "tekst": "AI kan fouten maken of informatie verzinnen (\"hallucineren\"). Controleer cruciale feiten altijd met betrouwbare bronnen." },
      { "titel": "Kritische blik", "tekst": "Vertrouw niet blindelings op de output. Gebruik de informatie als startpunt en pas altijd je eigen klinische redeneervaardigheden toe." }
    ],
    "afsluitende_tekst": "<br><strong>Belangrijk:</strong> In hoofdstuk 6 gaan we dieper in op de risico's en professionele verantwoordelijkheden, zoals het omgaan met privacy en het herkennen van 'hallucinaties'."
  }
}
```

**Wanneer afsluitende tekst toevoegen:**
- Als je wilt doorverwijzen naar een ander hoofdstuk
- Als je een samenvattende conclusie wilt geven
- Als je extra context wilt toevoegen die niet in de bullet points past

### 2. Sectietitel
- **Type:** `section-title`
- **Gebruik:** Om een nieuw onderwerp aan te kondigen.
- **JSON Structuur:**
  ```json
  {
    "type": "section-title",
    "titel": "Titel van de Sectie"
  }
  ```

### 3. Tekstparagraaf
- **Type:** `content-text`
- **Gebruik:** Voor standaard, lopende tekst.
- **Tekstformattering:**
  - **Lijsten:** Gebruik altijd proper HTML `<ul><li>` in plaats van sterretjes (*). Bijvoorbeeld: `<ul><li><strong>Titel:</strong> beschrijving</li></ul>`
  - **Vetgedrukte tekst:** Gebruik `<strong>` tags in plaats van sterretjes rond woorden. Bijvoorbeeld: `<strong>Belangrijk punt</strong>`
- **JSON Structuur:**
  ```json
  {
    "type": "content-text",
    "tekst": "Dit is een alinea met uitleg."
  }
  ```

### 4. Subsectie Titel
- **Type:** `content-subtitle`
- **Gebruik:** Voor subsecties binnen een hoofdsectie. Zit qua hiërarchie tussen section-title en content-text in.
- **Visueel:** Paarse kleur, kleiner dan section-title, groter dan gewone tekst.
- **JSON Structuur:**
  ```json
  {
    "type": "content-subtitle",
    "titel": "Privacygevoeligheid & AVG"
  }
  ```

### 5. Info Card met Lijst
- **Type:** `info-card-list`
- **Gebruik:** Combineert een inleidende tekst met een gestructureerde lijst.
- **JSON Structuur:**
  ```json
  {
    "type": "info-card-list",
    "titel": "Titel",
    "inhoud": "Inleidende tekst.",
    "lijst": [{ "titel": "Punt 1", "tekst": "Beschrijving." }]
  }
  ```

### 6. Accordion (Uitklapbare Content)
- **Type:** `accordion`
- **Gebruik:** Voor uitklapbare content die veel ruimte inneemt, zoals criteria, FAQ's of gedetailleerde uitleg die gebruikers op verzoek kunnen bekijken.
- **Eigenschappen:** 
  - `titel`: De titel van de accordion (zichtbaar op de knop)
  - `introductie`: Optionele introductietekst die in de uitgeklapte content verschijnt
  - `content`: Array van items, elk met `titel`, `beschrijving` en optioneel `subpunten`
- **JSON Structuur:**
  ```json
  {
    "type": "accordion",
    "titel": "Klik om uit te klappen",
    "introductie": "Optionele introductie tekst die bovenaan in de accordion staat.",
    "content": [
      {
        "titel": "Item 1",
        "beschrijving": "Uitgebreide beschrijving van item 1.",
        "subpunten": ["Subpunt A", "Subpunt B", "Subpunt C"]
      },
      {
        "titel": "Item 2", 
        "beschrijving": "Beschrijving van item 2 zonder subpunten."
      }
    ]
  }
  ```

### 7. Tabel
- **Type:** `table-container-group`
- **Gebruik:** Voor het tonen van gestructureerde data in een of meerdere tabellen.
- **JSON Structuur:**
  ```json
  {
    "type": "table-container-group",
    "intro": "Optionele introductie.",
    "tables": [
      { "titel": "Tabel Titel", "headers": ["Header 1"], "rows": [["Cel 1"]] }
    ],
    "note": "Optionele notitie."
  }
  ```

### 8. Benefit Card
- **Type:** `benefit-card` (als los item) of `benefits-grid` (als container)
- **Gebruik:** Een veelzijdige kaart om voordelen, kenmerken, modules of andere uitgelichte content te tonen.
- **Twee Weergavemethoden:**

  1. **Gestapelde Weergave (Onder elkaar):**
     - **Hoe:** Plaats individuele `benefit-card` componenten binnen de `content` array van een `info-card`. De `info-card` fungeert als witte container en de kaarten worden automatisch onder elkaar geplaatst.
     - **Wanneer:** Ideaal voor een verticale lijst van modules of stappen (zie Hoofdstuk 1 & 3).
     - **JSON Structuur (Gestapeld):**
       ```json
       {
         "type": "info-card",
         "content": [
           { 
             "type": "benefit-card",
             "titel": "Module 1: De Basis",
             "beschrijving": "Een introductie tot de concepten."
           }
         ]
       }
       ```

  2. **Grid Weergave (Naast elkaar):**
     - **Hoe:** Gebruik de `benefits-grid` container. Deze plaatst de `items` automatisch in een responsief grid.
     - **Wanneer:** Perfect voor het vergelijken van voordelen of het tonen van meerdere gerelateerde items naast elkaar.
     - **Kleurvariant:** Geef een `item` de class `benefit-card--purple` voor een paarse achtergrond.
     - **JSON Structuur (Grid):**
       ```json
       {
         "type": "benefits-grid",
         "titel": "Optionele titel boven het grid",
         "items": [
           { 
             "titel": "Voordeel A", 
             "icoon": "check-circle", 
             "tekst": "Beschrijving van dit voordeel."
           },
           { 
             "titel": "Voordeel B (uitgelicht)", 
             "classes": "benefit-card--purple",
             "icoon": "lightbulb-on", 
             "tekst": "Deze kaart heeft een andere kleur."
           }
         ]
       }
       ```

### 9. Icon Card Grid
- **Type:** `icon-card-grid`
- **Gebruik:** Een grid van kaarten, elk ondersteund door een visueel icoon.
- **JSON Structuur:**
  ```json
  {
    "type": "icon-card-grid",
    "themes": [{ "icoon": "path/to/icon.svg", "titel": "Kaart Titel", "inhoud": "Beschrijving." }]
  }
  ```

### 10. Competentie Grid
- **Type:** `competency-grid`
- **Gebruik:** Voor het uitleggen van competenties of termen met een praktijkvoorbeeld.
- **JSON Structuur:**
  ```json
  {
    "type": "competency-grid",
    "titel": "Titel van het Grid",
    "intro": "Inleidende tekst.",
    "termen": [{ "term": "Term A", "uitleg": "Uitleg.", "praktisch": "Praktijkvoorbeeld." }]
  }
  ```

### 11. Video Grid
- **Type:** `video-grid`
- **Gebruik:** Voor het embedden van YouTube video's.
- **JSON Structuur:**
  ```json
  {
    "type": "video-grid",
    "titel": "Titel van Grid",
    "items": [{ "titel": "Video Titel", "beschrijving": "Beschrijving.", "bron": "YouTube", "duur": "5 min", "link": "https://..." }]
  }
  ```

### 12. Audio Grid
- **Type:** `audio-grid`
- **Gebruik:** Voor het tonen van audio-bestanden zoals podcasts, muziek of AI-gegenereerde audio.
- **JSON Structuur:**
  ```json
  {
    "type": "audio-grid",
    "kolommen": 1,
    "items": [
      {
        "titel": "Audio Titel",
        "beschrijving": "Beschrijving van de audio.",
        "bron": "ElevenLabs",
        "duur": "2:30",
        "src": "audio/bestandsnaam.wav"
      }
    ]
  }
  ```

### 13. Enkele Video
- **Type:** `video-full-width`
- **Gebruik:** Voor het tonen van één enkele, responsive video.
- **JSON Structuur:**
  ```json
  {
    "type": "video-full-width",
    "titel": "Optionele titel onder de video",
    "link": "https://youtube.com/watch?v=..."
  }
  ```

### 13b. Video Split Screen
- **Type:** `video-split-screen`
- **Gebruik:** Voor het tonen van een video naast een tekstblok. Op brede schermen staan ze naast elkaar, op smallere schermen onder elkaar.
- **JSON Structuur:**
  ```json
  {
    "type": "video-split-screen",
    "video": {
      "link": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "titel": "Voorbeeldvideo: Wat is AI?"
    },
    "tekst_content": [
      "Dit is een voorbeeld van een video naast een tekstblok. Op brede schermen staan ze naast elkaar, op smallere schermen onder elkaar.",
      "Gebruik dit component als je een uitlegvideo wilt combineren met een toelichtende tekst."
    ]
  }
  ```

### 14. Afbeelding
- **Type:** `image-block`
- **Gebruik:** Voor het tonen van een standaard afbeelding.
- **Variaties:** Gebruik de `classes` property voor speciale opmaak: `img-polaroid`.
- **JSON Structuur:**
  ```json
  {
    "type": "image-block",
    "classes": "img-polaroid",
    "src": "path/to/image.png",
    "alt": "Beschrijving van de afbeelding",
    "onderschrift": "Optioneel onderschrift.",
    "bron": {
        "naam": "Naam van de bron",
        "url": "https://optionele-link.nl"
    }
  }
  ```

### 15. Resource Grid
- **Type:** `resource-grid-container`
- **Gebruik:** Een grid om te linken naar externe tools, bronnen of platforms, elk met een logo.
- **JSON Structuur:**
  ```json
  {
    "type": "resource-grid-container",
    "titel": "Titel van Grid",
    "items": [{ "logo": "path/to/logo.png", "titel": "Resource Naam", "beschrijving": "Beschrijving.", "link": "https://..." }]
  }
  ```

### 16. Processtappen / Tijdlijn
- **Type:** `process-flow`
- **Gebruik:** Om stappen in een proces of tijdlijn weer te geven.
- **JSON Structuur:**
  ```json
  {
    "type": "process-flow",
    "titel": "Titel van Proces",
    "items": [{ "stap": "Stap 1", "titel": "Fase 1", "beschrijving": "Beschrijving." }]
  }
  ```

### 17. Twee-koloms Blok
- **Type:** `dual-content-block`
- **Gebruik:** Voor het naast elkaar plaatsen van twee blokken, zoals een statistiek en een 'wist-je-dat'.
- **JSON Structuur:**
  ```json
  {
    "type": "dual-content-block",
    "blokken": [
      { "type": "statistiek", "titel": "Statistiek", "focus_tekst": "80%", "tekst_na_statistiek": "Uitleg." },
      { "type": "fun_fact", "titel": "Wist je dat?", "tekst": "Leuk feitje." }
    ]
  }
  ```

### 18. Accent Blok
- **Type:** `accent-blok`
- **Gebruik:** Een flexibel blok om tekst uit te lichten, zoals statistieken, weetjes of citaten.
- **Variaties:** Gebruik de `variant` property. Mogelijke waarden zijn `statistiek`, `weetje`, `citaat`, of `default`.
- **JSON Structuur:**
  ```json
  {
    "type": "accent-blok",
    "variant": "citaat",
    "titel": "Optionele Titel",
    "tekst": "De hoofdtekst van het accent blok.",
    "bron": {
      "naam": "Naam van de bron",
      "url": "https://optionele-link-naar-bron.nl"
    }
  }
  ```

### 19. Afbeelding & Tekst (Gesplitst Scherm)
- **Type:** `split-screen-image-text`
- **Gebruik:** Om een afbeelding naast een blok tekst te plaatsen. Ideaal voor het uitdiepen van een visueel concept.
- **JSON Structuur:**
  ```json
  {
    "type": "split-screen-image-text",
    "afbeelding": {
      "src": "path/to/image.png",
      "alt": "Beschrijving van de afbeelding",
      "onderschrift": "Optioneel onderschrift",
      "bron": {
        "naam": "Naam van de bron",
        "url": "https://optionele-link.nl"
      }
    },
    "tekst_content": [
      "Eerste paragraaf van de tekst.",
      "Tweede paragraaf van de tekst."
    ]
  }
  ```

### 20. Afbeeldingen Grid
- **Type:** `image-grid`
- **Gebruik:** Om een reeks afbeeldingen netjes in een grid van 2 of 3 kolommen te tonen.
- **JSON Structuur:**
  ```json
  {
    "type": "image-grid",
    "kolommen": 3,
    "afbeeldingen": [
      { 
        "src": "path/to/image1.png", 
        "alt": "Afbeelding 1",
        "onderschrift": "Optioneel onderschrift.",
        "bron": {
            "naam": "Naam van de bron",
            "url": "https://optionele-link.nl"
        }
      }
    ]
  }
  ```

### 21. Statistieken Grid
- **Type:** `stats-card-grid`
- **Gebruik:** Een opvallend grid om belangrijke statistieken, cijfers of KPI's te tonen. Elke kaart kan nu ook een bronvermelding bevatten.
- **Eigenschappen:**
  - **`titel` (string):** De titel van de statistiek.
  - **`afbeelding` (string):** Het pad naar het icoon of afbeelding.
  - **`getal` (string):** Het belangrijke getal of cijfer.
  - **`label` (string):** Een beschrijvend label onder het getal.
  - **`bron` (object, optioneel):** Een object voor bronvermelding.
    - **`naam` (string):** De naam van de bron.
    - **`url` (string, optioneel):** De URL naar de bron.
  - **`layout` (string, optioneel):** Voeg `"layout": "compact"` toe voor een compacte weergave waarbij de afbeelding links van de titel staat. Zonder deze eigenschap wordt de standaard layout gebruikt.
- **JSON Structuur:**
  ```json
  {
    "type": "stats-card-grid",
    "kaarten": [
      { 
        "titel": "Titel van de statistiek", 
        "afbeelding": "path/to/icon.svg", 
        "getal": "80%", 
        "label": "Beschrijvend label onder het getal",
        "bron": {
            "naam": "Naam van de bron",
            "url": "https://optionele-link.nl"
        }
      }
    ]
  }
  ```

#### JSON Voorbeeld (Standaard Layout)

```json
{
  "type": "stats-card-grid",
  "kaarten": [
    {
      "titel": "Wereldwijde Adoptie",
      "afbeelding": "images/icons/brain.svg",
      "getal": "78%",
      "label": "Van bedrijven wereldwijd gebruikt al AI.",
      "bron": {
        "naam": "Bron C",
        "url": "https://voorbeeld.com"
      }
    }
  ]
}
```

#### JSON Voorbeeld (Compact Layout)

```json
{
  "type": "stats-card-grid",
  "layout": "compact",
  "kaarten": [
    {
      "titel": "Actieve Gebruikers",
      "afbeelding": "images/icons/check-circle.svg",
      "getal": "150+",
      "label": "Totaal aantal actieve gebruikers op het platform.",
      "bron": {
        "naam": "Interne data"
      }
    }
  ]
}
```

### 22. Ethische Reflectie Grid
- **Type:** `ethical-reflection-grid`
- **Gebruik:** Voor het presenteren van ethische dilemma's of reflectiepunten in een grid. Ideaal voor het aanzetten tot nadenken over complexe onderwerpen.
- **JSON Structuur:**
  ```json
  {
    "type": "ethical-reflection-grid",
    "kaarten": [
      { "titel": "Dilemma 1", "beschrijving": "Beschrijving van het dilemma." },
      { "titel": "Reflectiepunt 2", "beschrijving": "Uitleg van het reflectiepunt." }
    ]
  }
  ```

### 23. Horizontale Scenario Kaarten
- **Type:** `scenario-container-horizontal`
- **Gebruik:** Voor het tonen van meerdere "stel je voor..." of casus-scenario's naast elkaar.
- **JSON Structuur:**
  ```json
  {
    "type": "scenario-container-horizontal",
    "scenarios": [
        { "titel": "Scenario 1", "beschrijving": "Beschrijving...", "punten": ["Punt A", "Punt B"], "conclusie": "Conclusie van scenario."}
    ]
  }
  ```

### 24. Concept Cards
- **Type:** `concept-cards`
- **Gebruik:** Voor het uitleggen van specifieke begrippen of jargon, inclusief vertaling en voorbeeld.
- **JSON Structuur:**
  ```json
  {
    "type": "concept-cards",
    "items": [
      {
        "titel": "Hallucinatie",
        "nederlands": "Een 'verzinsel' van de AI",
        "uitleg": "Wanneer een AI feitelijk onjuiste of onzinnige informatie presenteert alsof het een feit is.",
        "voorbeeld": "Vraag: 'Wie was de eerste mens op Mars?' AI Antwoord: 'Neil Armstrong landde op Mars in 1978.'"
      }
    ]
  }
  ```

### 25. Divider (Visuele Scheiding)
- **Type:** `divider`
- **Gebruik:** Voor visuele scheiding tussen content componenten binnen een sectie. Zie hoofdstukstructuur voor exacte regels.
- **JSON Structuur:**
  ```json
  {
    "type": "divider"
  }
  ```

### 26. Uitgelichte Afbeelding met Kaarten (Complex)
- **Types:** Geen specifieke types meer nodig
- **Gebruik:** Voor complexe layouts kun je de bestaande componenten combineren met de 'doos-in-doos' structuur.
- **JSON Structuur:** Gebruik `info-card` met `content` array om componenten te nesten.

**Nota:** Voor het weergeven van modellen en diagrammen kun je de bestaande componenten combineren: gebruik `image-grid` voor de afbeelding en `info-card` met `card-grid` of `competency-grid` voor de uitleg. Dit geeft meer flexibiliteit en volgt de 'doos-in-doos' structuur. 