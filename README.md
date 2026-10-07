# 🏛️ The Prime Dashboard

Una web app personale minimale, elegante e ultra-focalizzata progettata per **Vincenzo (Vince)** per eliminare il sovraccarico cognitivo e rispondere in un istante a tre domande fondamentali:

1. **Home** → *Cosa devo fare oggi?* (Massimo 3–5 task essenziali, mini obiettivi, zero distrazioni)
2. **Planner** → *Quando lo faccio?* (Calendario scuro con viste giorno, 3 giorni, settimana, mese e programma)
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

### Planner calendario — 7 ottobre 2026

Il Planner riprende il calendario scuro di Google Calendar: griglia a 24 ore, settimana da lunedì a domenica, eventi colorati per calendario, indicatore dell'ora attuale, selezione della data e navigazione tra periodi. Tocca uno spazio libero o il pulsante + per creare un evento; tocca un evento per modificarlo o eliminarlo. Sono disponibili eventi per tutto il giorno e serie settimanali. Le modifiche e l'eliminazione di una serie riguardano l'intera serie, come indicato nel modulo.

Gli eventi hanno una data reale; gli eventi sovrapposti sono affiancati. Nel menu puoi cambiare vista e mostrare o nascondere Studio, Corpo, Progetti, Personale e Altro. Il calendario resta interno all'app e non è collegato al servizio Google Calendar.

La chiave `PRIME_DASHBOARD_STORE_v1` è mantenuta. Al primo caricamento viene conservata una copia sotto `PRIME_DASHBOARD_STORE_v1_before_calendar`. I vecchi blocchi che contenevano soltanto il giorno della settimana ricevono la data corrispondente nella settimana del primo caricamento; non vengono automaticamente trasformati in serie ricorrenti. Task, obiettivi, Inbox e gli altri campi sono preservati. I dati continuano a essere salvati nel browser di ciascun dispositivo.

Verificato: creazione, modifica, eliminazione, validazione degli orari, migrazione, backup precedente, navigazione fra mesi/anni, sovrapposizioni, eventi giornalieri e settimanali, filtri, ricaricamento, collegamenti da Home e Inbox. Cinque viste controllate a 320, 360, 390, 430, 768 e 1280 pixel.

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
