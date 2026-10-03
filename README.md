# 🏛️ The Prime Dashboard

Una web app personale minimale, elegante e ultra-focalizzata progettata per **Vincenzo (Vince)** per eliminare il sovraccarico cognitivo e rispondere in un istante a tre domande fondamentali:

1. **Home** → *Cosa devo fare oggi?* (Massimo 3–5 task essenziali, mini obiettivi, zero distrazioni)
2. **Planner** → *Quando lo faccio?* (Timeline verticale a blocchi orari per giorno della settimana)
3. **Inbox** → *Cosa ho in testa?* (Brain dump immediato senza attrito, convertibile in Task o Blocco Planner con un tap)

---

## 🎨 Principi di Design & Fedeltà Visiva

* **Dark Mode Assoluta**: Palette studiata su toni grafite/OLED `#090b0e` con contrasto calibrato.
* **Colori a bassa saturazione**:
  * 📚 **Studio**: Verde Smeraldo / Wine Accent
  * 🏃‍♂️ **Corpo**: Blu Oceano
  * 💼 **Progetti**: Viola Ametista
  * ⚡ **Personale**: Oro / Ambra caldo
* **Bottom Navigation Premium**: Barra fissa con alone radiale blu (*spotlight glow*) sull'icona attiva.
* **Mobile-First & Desktop Ready**: Design curato come un'app iOS nativa con frame elegante su desktop (e tasto rapido `Fit`/`Mobile` per visualizzazione espansa).
* **Zero Bloat**: Nessun grafico dispersivo, niente streak, niente punti o gamification. Solo pura esecuzione.

---

## ⚡ Interazioni Chiave

* **Inbox → Task**: Apri il menu `···` di qualsiasi pensiero nell'Inbox e premi **"Converti in task di oggi"** per vederla comparire istantaneamente nella Home.
* **Inbox → Planner**: Premi **"Aggiungi al Planner"** per programmare orario e giorno della settimana direttamente nella timeline.
* **Classificazione Opzionale**: Nell'Inbox scrivi e premi Invio immediatamente senza dover scegliere prima una categoria. Puoi classificarlo in un secondo momento (`Idea`, `Task`, `Pensiero`, `Preoccupazione`, `Altro`).
* **Scorciatoie da Tastiera**:
  * Tasti `1`, `2`, `3` per passare all'istante tra **Home**, **Planner** e **Inbox**.
  * Tasto `Esc` per chiudere qualsiasi modale.

---

## 💾 Persistenza & Architettura Locale

L'app salva in tempo reale qualsiasi modifica in `localStorage` attraverso il modulo `PrimeStore`.

### Predisposizione per Backend / Database
Il modulo `PrimeStore` in [app.js](file:///C:/Users/vincy/.gemini/antigravity/scratch/the-prime-dashboard/app.js) è strutturato a metodi atomici (`getTasks()`, `addTask()`, `updateTask()`, `getPlannerBlocks()`, `getInboxItems()`). Per collegare in futuro un server FastAPI, Supabase, Firebase o SQLite, basterà sostituire le chiamate locali con fetch asincrone agli endpoint API.

---

## 🚀 Come Utilizzare l'App

Puoi aprire l'app direttamente facendo doppio click su [index.html](file:///C:/Users/vincy/.gemini/antigravity/scratch/the-prime-dashboard/index.html) in qualsiasi browser (Chrome, Edge, Safari), oppure servirla tramite un server locale leggero:

```bash
# Con Python
python -m http.server 3000

# Oppure con npx serve
npx serve .
```
