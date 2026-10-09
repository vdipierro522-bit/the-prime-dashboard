# The Prime Dashboard

App originale: https://vdipierro522-bit.github.io/the-prime-dashboard/

## Home e Aree — 9 ottobre 2026

Home mostra una frase grande, tre priorità per la data selezionata, il tracker in blocchi di 90 giorni e una valutazione giornaliera. Frecce, selettore date e singoli blocchi aprono lo storico. I blocchi continuano la stessa cronologia senza azzerare i giorni precedenti. Verde = valutazione positiva; rosso = da migliorare; grigio = non valutata o futura. La valutazione è esplicita e indipendente dal numero di attività. I giorni futuri si possono pianificare, ma non completare o valutare in anticipo.

Aree contiene Corpo, Studio e Progetti, ciascuna con attività, idee e note modificabili. Le attività si possono assegnare al giorno selezionato e scegliere come priorità. Rimuovere una priorità conserva l’attività nel registro giornaliero. I completamenti restano con la spunta nel loro giorno. Appunti e valutazioni si salvano automaticamente. Le frasi includono richiami rispettosi al ricordo del padre.

Il Planner è rimosso dall’interfaccia e non viene più inizializzato. Gli eventi, le ricorrenze e le impostazioni già salvati restano intatti nell’archivio ed esportabili nel backup. Inbox e obiettivi precedenti rimangono accessibili da Aree. Scorciatoie: 1 Home, 2 Aree, 3 Inbox.

Aree mostra tre schede Corpo/Studio/Progetti con conteggi, un diario raggruppato per data e le attività salvate da assegnare ai giorni. Ricerca senza distinzione di maiuscole e accenti; filtri combinabili per attività/idee/note, completamento e giorno selezionato. I filtri operano nell’area aperta e non modificano i dati. Le spunte nel diario agiscono sulla data della riga, anche quando è diversa dal giorno selezionato. Idee e note ricevono la data scelta; gli appunti esistenti mantengono la propria data. Modificare una voce storica aggiorna solo quella giornata e il catalogo, lasciando le altre giornate intatte.

## Dati e migrazione

La chiave originale PRIME_DASHBOARD_STORE_v1 è invariata. Prima della migrazione viene copiata in PRIME_DASHBOARD_STORE_v1_before_daily_v1. Campi originali, configurazione, eventi, obiettivi, Inbox e storico aggregato sono conservati. dailyRecords, areaEntries, dailySchema, dailyMigratedOn e dailyQuoteIndex estendono lo stesso archivio.

Le attività precedenti prive di data sono conservate, con le spunte originali, nel giorno della migrazione. I conteggi storici non permettono di ricostruire titoli o date dei completamenti: per quei giorni è mostrato il conteggio originale. Nessuna attività passata viene inventata. Ogni assegnazione successiva crea una copia indipendente per quel giorno; le modifiche al catalogo non riscrivono gli altri giorni.

Il primo uso è vuoto, senza dati dimostrativi. JSON danneggiato, spazio esaurito o conflitti fra schede generano un avviso senza sostituire l’archivio con valori predefiniti. Le modifiche giornaliere fallite vengono annullate in memoria. Esportazione JSON disponibile da Aree. I dati restano nel browser dello stesso indirizzo e dispositivo; nessuna sincronizzazione fra dispositivi.

## Esecuzione e verifiche

App statica senza dipendenze: servire questa cartella con un server HTTP o usare GitHub Pages. Manifest e configurazione Pages sono conservati; i riferimenti ai file includono una versione per aggiornare la cache.

node tests/daily-store.cjs verifica conservazione dei campi originali, backup, migrazione idempotente, spunte giornaliere, tre priorità, valutazioni, blocchi di 90 giorni, cambio anno e ora legale, JSON invalido, spazio esaurito, conflitti fra schede e primo uso vuoto; verifica anche ricerca, filtri combinati, separazione delle aree e completamento giornaliero nel catalogo. daily-core.js contiene le regole; daily-app.js integra l’interfaccia con PrimeStore e UI originali.
