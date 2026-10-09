/* Home / Aree on the original Prime Dashboard, preserving its archive. */
'use strict';
const DAILY_QUOTES = [
  'Non puoi cambiare il passato, ma puoi costruire un futuro di cui tuo padre sarebbe orgoglioso.',
  'Non devi fare tutto. Scegli ciò che conta e comincia da lì.',
  'La disciplina di oggi costruisce la libertà di domani.',
  'Un passo concreto vale più di un piano perfetto.',
  'Il ricordo di tuo padre può accompagnarti, un giorno alla volta.',
  'Puoi custodire il legame con tuo padre e costruire il tuo cammino, con i tuoi tempi.',
  'Il tuo valore non dipende da quanto riesci a fare oggi.',
  'Non serve sentirti pronto. Serve fare il primo gesto.',
  'Studia per capire. Allenati per crescere. Costruisci per imparare.',
  'Anche una giornata difficile può contenere un piccolo passo avanti.',
  'Essere costante significa anche imparare a ripartire.',
  'Onorare il ricordo di tuo padre può voler dire anche prenderti cura di te.',
  'Novanta giorni. Una direzione. Una scelta concreta ogni giorno.',
  'Quello che fai con attenzione oggi diventa una capacità domani.',
  'Fermati, scegli tre priorità, dedica la tua energia alla prima.',
  'Porta con te ciò che ami. Lascia spazio alla persona che stai diventando.'
];

const DailyApp = {
  C: PrimeDaily, selected: PrimeDaily.today(), area: 'Corpo', lastRaw: null,
  query: '', kind: 'all', completion: 'all', dateScope: 'all', areaView: 'journal', filtersOpen: false, closedDays: new Set(),
  e: s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  fmt(date,options={day:'numeric',month:'long',year:'numeric'}) { return new Intl.DateTimeFormat('it-IT',options).format(new Date(date+'T12:00:00')); },
  boot() {
    this.installStore();
    this.installUI();
  },
  installStore() {
    const app = this;
    PrimeStore.init = function () {
      const raw = localStorage.getItem(STORAGE_KEY);
      let data = raw ? JSON.parse(raw) : {tasks:[],goals:[],inbox:[],plannerBlocks:[],quoteIndex:0};
      if (raw && !data.dailySchema && !localStorage.getItem(STORAGE_KEY+'_before_daily_v1')) {
        localStorage.setItem(STORAGE_KEY+'_before_daily_v1',raw);
      }
      data = app.C.migrate(data);
      this.data = data;
      app.lastRaw = raw;
      this.save();
      app.prepareDOM();
    };
    PrimeStore.save = function () {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current !== app.lastRaw) throw new Error('L’archivio è cambiato in un’altra scheda. Ricarica prima di continuare.');
      const next = JSON.stringify(this.data);
      localStorage.setItem(STORAGE_KEY,next);
      app.lastRaw = next;
      return true;
    };
    PrimeStore.updateDailyHistory = () => {}; // Keep legacy aggregates intact.
    PrimeStore.getTasks = () => app.C.day(PrimeStore.data,app.selected).tasks;
    PrimeStore.addTask = function (title,category='Studio') {
      const task = {id:app.C.uid(),title:title.trim(),category,completed:false};
      const record = app.C.day(this.data,app.selected);
      const previous = app.C.clone(this.data);
      try {
        this.data.tasks.push(task);
        app.C.assign(this.data,app.selected,task,record.priorities.length<3);
        this.save();
        return task;
      } catch (err) { this.data=previous; throw err; }
    };
    PrimeStore.updateTask = function(id,updates) {
      const t = app.C.day(this.data,app.selected,true).tasks.find(t=>t.id===id);
      if(t) { Object.assign(t,updates); this.save(); } return t;
    };
    PrimeStore.deleteTask = function(id) {
      const r=app.C.day(this.data,app.selected,true);
      r.priorities=r.priorities.filter(x=>x!==id);
      this.save();
    };
  },
  icon(name,cls='') {
    const paths={home:'<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',folder:'<path d="M3 7V4h7l3 3h8v14H3Z"/>',Corpo:'<path d="M3 9v6m4-10v14m10-14v14m4-10v6M7 12h10M3 7h4v10H3Zm14 0h4v10h-4Z"/>',Studio:'<path d="M12 5v16M12 6C8 3 4 3 2 4v16c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Z"/>',Progetti:'<rect x="4" y="3" width="16" height="14" rx="2"/><path d="m4 17-3 4h22l-3-4M9 21h6"/>',back:'<path d="m15 4-8 8 8 8"/>',chevron:'<path d="m9 5 7 7-7 7"/>',up:'<path d="m5 15 7-7 7 7"/>',plus:'<path d="M12 4v16M4 12h16"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',more:'<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>',calendar:'<rect x="3" y="5" width="18" height="17" rx="2"/><path d="M7 2v6m10-6v6M3 11h18M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2"/>',flag:'<path d="M5 22V3c5-4 9 4 15 0v11c-6 4-10-4-15 0"/>',bell:'<path d="M4 18h16l-2-4V9a6 6 0 0 0-12 0v5Zm6 3h4"/>',search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>'};
    return `<svg class="prime-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.folder}</svg>`;
  },
  areaInfo(area) {
    return {Corpo:{desc:'Allenamento, alimentazione, mobilità, salute.',short:'Allenamento, alimentazione, mobilità',subjects:['Allenamento','Alimentazione','Mobilità','Salute','Altro']},Studio:{desc:'Scuola, apprendimento, competenze.',short:'Scuola, appunti, competenze',subjects:['Matematica','Fisica','Inglese','Scuola','Altro']},Progetti:{desc:'Idee, sviluppo, ingegneria, Aura Vision.',short:'Idee, sviluppo, ingegneria',subjects:['AURA','Sviluppo','Ingegneria','Idee','Altro']},Personale:{desc:'Le tue attività personali.',short:'Personale',subjects:['Personale','Altro']}}[area]||{desc:area,short:area,subjects:['Altro']};
  },
  installUI() {
    const app=this;
    UI.updateClock=()=>{};UI.renderHome=()=>app.renderHome();UI.renderTasks=()=>app.renderHome();UI.renderHomeWeekStrip=()=>{};UI.renderQuote=()=>app.renderHome();UI.renderGoals=()=>{};
    UI.renderAll=function(){app.renderHome();app.renderAreas();app.renderDetail();this.renderInbox();};
    UI.switchTab=function(name){
      if(name==='Areas')name='Aree';
      if(!['Home','Aree','AreaDetail','Inbox'].includes(name))name='Aree';
      this.activeTab=name;
      document.querySelectorAll('.screen-view').forEach(el=>el.classList.toggle('active',el.id==='screen'+name));
      document.querySelectorAll('.nav-tab-item').forEach(el=>{const active=el.dataset.tab===name||(el.dataset.tab==='Aree'&&['AreaDetail','Inbox'].includes(name));el.classList.toggle('active',active);el.setAttribute('aria-current',active?'page':'false');});
      document.getElementById('bottomNavBar').hidden=name==='AreaDetail';
      document.getElementById('appViewport').classList.toggle('focused-screen',name==='AreaDetail');
      document.getElementById('mainContent').scrollTop=0;document.getElementById('globalFabBtn').style.display='none';
      if(name==='Home')app.renderHome();if(name==='Aree')app.renderAreas();if(name==='AreaDetail')app.renderDetail();
    };
    UI.openAddTaskModal=()=>app.openEditor('task',{priority:true});
    const init=UI.init;UI.init=function(){init.call(this);app.bind();this.switchTab('Home');};
  },
  prepareDOM() {
    document.getElementById('screenHome').innerHTML='';
    for(const name of ['Aree','AreaDetail']) {const el=document.createElement('section');el.id='screen'+name;el.className='screen-view';document.getElementById('mainContent').append(el);}
    document.getElementById('bottomNavBar').innerHTML=`<button class="nav-tab-item active" data-tab="Home" id="navTabHome" aria-current="page">${this.icon('home')}<span>Home</span></button><button class="nav-tab-item" data-tab="Aree" id="navTabAree">${this.icon('folder')}<span>Aree</span></button>`;
    const back=document.createElement('button');back.className='icon-button legacy-back';back.dataset.action='back';back.innerHTML=this.icon('back')+' Aree';document.getElementById('screenInbox').prepend(back);
    const dialog=document.createElement('dialog');dialog.id='dailyEditor';dialog.className='entry-editor';
    dialog.innerHTML=`<form id="dailyForm"><header class="editor-header"><button class="icon-button" type="button" data-action="cancel" aria-label="Annulla">${this.icon('back')}</button><h2 id="dailyEditorTitle">Nuova voce</h2><button class="save-button" type="submit">Salva</button></header><div class="entry-kind-tabs" role="group" aria-label="Tipo di voce">${[['task','Attività'],['idea','Idea'],['note','Nota']].map(([kind,label])=>`<button type="button" data-editor-kind="${kind}" aria-pressed="false">${label}</button>`).join('')}</div><label class="visually-hidden" for="dailyText">Testo</label><textarea id="dailyText" class="entry-text" placeholder="Scrivi la tua voce…" required maxlength="4000"></textarea><fieldset class="editor-area-field"><legend>Area</legend><div class="editor-areas">${['Corpo','Studio','Progetti'].map(a=>`<button type="button" class="editor-area theme-${a.toLowerCase()}" data-editor-area="${a}" aria-pressed="false">${this.icon(a)}<span>${a}</span></button>`).join('')}</div><select id="dailyArea" aria-label="Area" hidden><option>Corpo</option><option>Studio</option><option>Progetti</option><option>Personale</option></select><p id="personalAreaHint" hidden>Area attuale: Personale. Puoi scegliere una delle tre aree.</p></fieldset><label class="subject-field" for="dailySubject">Materia / Categoria</label><select class="editor-select" id="dailySubject"></select><div class="editor-metadata"><div class="metadata-row">${this.icon('calendar')}<label for="dailyDatePreset">Data</label><select class="editor-select" id="dailyDatePreset"><option value="today">Oggi</option><option value="yesterday">Ieri</option><option value="tomorrow">Domani</option><option value="custom">Altra data</option></select></div><label class="visually-hidden" for="dailyTaskDate">Giorno</label><input class="editor-select custom-date" id="dailyTaskDate" type="date" required hidden><div class="metadata-row">${this.icon('flag')}<label for="dailyPriority">Priorità</label><select class="editor-select" id="dailyPriority"><option value="normal">Normale</option><option value="high">Alta</option><option value="low">Bassa</option><option value="home">Principale (Home)</option></select></div><div class="metadata-row">${this.icon('bell')}<label for="dailyReminder">Promemoria</label><input id="dailyReminder" class="reminder-switch" type="checkbox"></div><div id="reminderDetails" hidden><label for="dailyReminderTime">Ora</label><input class="editor-select" type="time" id="dailyReminderTime" value="09:00"><small>Compare in app quando è aperta.</small></div></div><p id="dailyEditorError" role="alert"></p><div class="editor-bottom"><p id="dailyEditorHelp">Le voci vengono salvate automaticamente nella tua giornata di diario.</p></div></form>`;
    document.body.append(dialog);
    for(const [id,cls] of [['dayReview','day-review-dialog'],['areaTools','action-dialog'],['itemActions','action-dialog']]){const el=document.createElement('dialog');el.id=id;el.className=cls;document.body.append(el);}
    const alert=document.createElement('div');alert.id='dailyAlert';alert.className='daily-alert';alert.hidden=true;alert.setAttribute('role','alert');document.body.append(alert);
  },
  fail(err) {const el=document.getElementById('dailyAlert');el.hidden=false;el.textContent=err.message+' Le modifiche non sono state salvate.';},
  mutate(fn) {
    const before=this.C.clone(PrimeStore.data),selected=this.selected;
    try{fn(PrimeStore.data);PrimeStore.save();document.getElementById('dailyAlert').hidden=true;UI.renderAll();return true;}
    catch(err){PrimeStore.data=before;this.selected=selected;this.fail(err);return false;}
  },
  dateName(date) {
    const now=this.C.today();return date===now?'Oggi':date===this.C.add(now,-1)?'Ieri':this.fmt(date,{day:'numeric',month:'long',...(date.slice(0,4)!==now.slice(0,4)?{year:'numeric'}:{})});
  },
  quoteHTML(quote) {
    const text=this.e(quote),phrase='di cui tuo padre sarebbe orgoglioso.';
    return text.includes(phrase)?text.replace(phrase,`<em>${phrase}</em>`):text.replace(/tuo padre/g,'<em>tuo padre</em>');
  },
  areaCards(full=true) {
    const data=PrimeStore.data,r=this.C.day(data,this.selected);
    return ['Corpo','Studio','Progetti'].map(area=>{
      const info=this.areaInfo(area),tasks=r.tasks.filter(t=>t.category===area),done=tasks.filter(t=>t.completed).length;
      const counts=[data.tasks.filter(t=>t.category===area&&!t.archived).length,...['idea','note'].map(kind=>data.areaEntries.filter(n=>n.area===area&&n.kind===kind&&!n.archived).length)];
      return `<button class="${full?'overview-card':'shortcut-card'} theme-${area.toLowerCase()}" data-area="${area}"><span class="area-card-heading"><span class="area-icon">${this.icon(area)}</span><span class="area-card-copy"><strong>${area}</strong><small>${full?info.desc:info.short}</small></span>${full?this.icon('chevron','area-chevron'):''}</span>${full?`<span class="area-progress"><span class="progress-track"><span style="width:${tasks.length?done/tasks.length*100:0}%"></span></span><small>${done}/${tasks.length}</small></span><span class="area-counts">${counts.map((n,i)=>`<span><b>${n}</b><small>${['Attività','Idee','Note'][i]}</small></span>`).join('')}</span>`:''}</button>`;
    }).join('');
  },
  taskRow(task,date=this.selected,home=false) {
    const e=this.e,kind=home?task.category:'Attività';
    return `<div class="diary-row ${task.completed?'is-done':''}"><input type="checkbox" class="task-check" data-toggle="${e(task.id)}" data-toggle-date="${date}" aria-label="Completa ${e(task.title)}" ${task.completed?'checked':''} ${date>this.C.today()?'disabled':''}><button class="row-copy" data-edit-record="${e(task.id)}" data-record-date="${date}">${e(task.title)}${task.reminder?this.icon('bell','row-reminder'):''}</button><span class="type-badge ${home?'category-'+task.category.toLowerCase():'type-task'}">${e(kind)}</span>${home?'':`<button class="icon-button row-more" data-item-task="${e(task.id)}" data-record-date="${date}" aria-label="Opzioni ${e(task.title)}">${this.icon('more')}</button>`}</div>`;
  },
  renderHome() {
    if(!PrimeStore.data)return;
    const C=this.C,data=PrimeStore.data,r=C.day(data,this.selected),b=C.block(data,this.selected),now=C.today();
    const tasks=r.priorities.map(id=>r.tasks.find(t=>t.id===id)).filter(Boolean),quote=DAILY_QUOTES[(data.dailyQuoteIndex||0)%DAILY_QUOTES.length];
    const hour=new Date().getHours(),greeting=hour<12?'Buongiorno':hour<18?'Buon pomeriggio':'Buonasera';
    const blocks=Array.from({length:90},(_,i)=>{const date=C.add(b.start,i),status=C.status(data,date);return `<button class="day-block ${status} ${date===now?'today-block':''}" data-review-date="${date}" title="${this.fmt(date)}" aria-label="${this.fmt(date)} · ${status==='green'?'Giornata positiva':status==='red'?'Da migliorare':'Non valutata'}"></button>`;}).join('');
    document.getElementById('screenHome').innerHTML=`<header class="home-heading"><div><h1>${greeting}, Vince <span>👋</span></h1><p>${this.fmt(this.selected,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><button class="sun-button" data-action="review" aria-label="Valuta la giornata e cambia data">${this.icon('sun')}</button></header><section class="tracker-card"><div class="card-title-row"><h2>I miei 90 giorni</h2><span class="day-counter"><b>${Math.max(0,b.number)}</b>/90</span></div><div class="day-blocks" aria-label="Tracker di 90 giorni">${blocks}</div></section><button class="quote-card" data-action="quote" aria-label="Cambia frase motivazionale"><blockquote>“${this.quoteHTML(quote)}”</blockquote></button><section class="priority-card"><div class="card-title-row"><h2>Task principali ${this.selected===now?'di oggi':'del giorno'}</h2><span class="priority-counter">${tasks.filter(t=>t.completed).length}/3</span><button class="icon-button add-priority" data-action="priority" aria-label="Aggiungi una priorità">${this.icon('plus')}</button></div>${tasks.map(t=>this.taskRow(t,this.selected,true)).join('')}${Array.from({length:3-tasks.length},()=>'<button class="empty-priority" data-action="priority"><span class="empty-circle"></span>Scegli una priorità</button>').join('')}</section><div class="home-shortcuts" aria-label="Apri un’area">${this.areaCards(false)}</div>`;
  },
  renderAreas() {
    if(!PrimeStore.data)return;
    document.getElementById('screenAree').innerHTML=`<header class="overview-heading"><div><h1>Aree</h1><p>Le tue idee, task e appunti.</p></div><button class="icon-button" data-action="tools" aria-label="Opzioni e dati salvati">${this.icon('more')}</button></header><div class="overview-cards">${this.areaCards()}</div>`;
  },
  openArea(area) {
    if(this.area!==area){this.query='';this.kind='all';this.completion='all';this.dateScope='all';this.filtersOpen=false;}
    this.area=area;this.areaView='journal';UI.switchTab('AreaDetail');
  },
  renderDetail() {
    if(!PrimeStore.data)return;
    const info=this.areaInfo(this.area);
    document.getElementById('screenAreaDetail').innerHTML=`<div class="detail-topbar"><button class="icon-button" data-action="back" aria-label="Torna alle Aree">${this.icon('back')}</button><button class="icon-button" data-action="tools" aria-label="Opzioni area">${this.icon('more')}</button></div><header class="detail-heading theme-${this.area.toLowerCase()}"><span class="area-icon">${this.icon(this.area)}</span><div><h1>${this.area}</h1><p>${info.desc}</p></div></header><div class="type-tabs" role="group" aria-label="Filtra per tipo">${[['all','Tutte'],['task','Attività'],['idea','Idee'],['note','Note']].map(([k,l])=>`<button data-kind="${k}" aria-pressed="${this.kind===k}">${l}</button>`).join('')}</div><form class="quick-entry" id="areaQuickForm"><input type="text" id="areaQuickText" placeholder="Scrivi una nuova voce…" aria-label="Nuova voce"><button type="submit" aria-label="Aggiungi una voce">${this.icon('plus')}</button></form>${this.filtersOpen?`<div class="search-tools"><div><input id="areaSearch" type="search" placeholder="Cerca nell’area…" aria-label="Cerca nell’area" value="${this.e(this.query)}"><button class="icon-button" data-action="close-search" aria-label="Chiudi ricerca">${this.icon('close')}</button></div><div class="search-filter-row"><select id="areaCompletion" aria-label="Filtra per completamento">${[['all','Tutti gli stati'],['open','Da completare'],['done','Completate']].map(([v,l])=>`<option value="${v}" ${v===this.completion?'selected':''}>${l}</option>`).join('')}</select><select id="areaDateScope" aria-label="Filtra per data"><option value="all" ${this.dateScope==='all'?'selected':''}>Tutte le date</option><option value="selected" ${this.dateScope==='selected'?'selected':''}>Data scelta</option></select><input id="areaSelectedDate" type="date" aria-label="Data del diario" value="${this.selected}"><button data-action="reset-filters">Azzera</button></div></div>`:''}<div id="areaResults"></div>`;
    this.renderAreaResults();
  },
  renderAreaResults() {
    const data=PrimeStore.data,filters={query:this.query,status:this.completion,kind:this.kind,date:this.dateScope==='selected'?this.selected:null};
    if(this.areaView==='catalog') {
      const items=this.C.catalog(data,this.area,this.selected,{query:this.query,status:this.completion}),r=this.C.day(data,this.selected);
      document.getElementById('areaResults').innerHTML=`<div class="catalog-heading"><h2>Attività salvate</h2><button class="icon-button" data-action="journal" aria-label="Torna al diario">${this.icon('back')}</button></div><p class="muted-text">Scegli quelle da portare nel ${this.dateName(this.selected).toLowerCase()}.</p><section class="diary-day">${items.map(({source})=>`<div class="diary-row"><span class="empty-circle"></span><span class="row-copy">${this.e(source.title)}</span><button class="type-badge type-task" data-schedule="${this.e(source.id)}">${r.tasks.some(t=>t.id===source.id)?'Nel giorno ✓':'+ Nel giorno'}</button><button class="icon-button row-more" data-catalog-task="${this.e(source.id)}" aria-label="Opzioni ${this.e(source.title)}">${this.icon('more')}</button></div>`).join('')||'<p class="empty-copy">Nessuna attività trovata.</p>'}</section>`;
      return;
    }
    const items=this.C.journal(data,this.area,filters),dates=[...new Set(items.map(x=>x.date))];
    if(!items.length)dates.push(this.dateScope==='selected'?this.selected:this.C.today());
    document.getElementById('areaResults').innerHTML=`${this.query||this.completion!=='all'?`<p class="search-count" role="status">${items.length} voci trovate</p>`:''}${dates.map(date=>{
      const group=items.filter(x=>x.date===date),closed=this.closedDays.has(date);
      return `<section class="diary-day"><button class="day-group-heading" data-collapse-date="${date}" aria-expanded="${!closed}"><h2>${this.dateName(date)}</h2>${this.icon('up')}</button><div class="day-rows" ${closed?'hidden':''}>${group.map(item=>item.kind==='task'?this.taskRow(item.task,date):`<div class="diary-row"><span class="empty-circle decorative-circle" aria-hidden="true"></span><button class="row-copy" data-edit-entry="${this.e(item.entry.id)}">${this.e(item.entry.text)}${item.entry.reminder?this.icon('bell','row-reminder'):''}</button><span class="type-badge type-${item.kind}">${item.kind==='idea'?'Idea':'Nota'}</span><button class="icon-button row-more" data-item-entry="${this.e(item.entry.id)}" aria-label="Opzioni ${this.e(item.entry.text)}">${this.icon('more')}</button></div>`).join('')||'<p class="empty-copy">Nessuna voce. Aggiungi un’attività, un’idea o una nota.</p>'}</div></section>`;
    }).join('')}`;
  },
  navigate(date) {if(!this.C.valid(date))return;this.selected=date;this.renderHome();this.renderAreas();this.renderDetail();},
  openReview(date=this.selected) {
    this.navigate(date);this.renderReview();document.getElementById('dayReview').showModal();
  },
  renderReview() {
    const r=this.C.day(PrimeStore.data,this.selected),future=this.selected>this.C.today(),b=this.C.block(PrimeStore.data,this.selected);
    document.getElementById('dayReview').innerHTML=`<header class="sheet-header"><h2>La tua giornata</h2><button class="icon-button" data-action="close-review" aria-label="Chiudi giornata">${this.icon('close')}</button></header><div class="review-date"><button class="icon-button" data-action="prev" aria-label="Giorno precedente">${this.icon('back')}</button><input type="date" id="dailySelectedDate" value="${this.selected}" aria-label="Data selezionata"><button class="icon-button" data-action="next" aria-label="Giorno successivo">${this.icon('chevron')}</button><button class="small-button" data-action="today">Oggi</button></div><p class="muted-text">Blocco ${b.index+1} · ${this.fmt(b.start,{day:'numeric',month:'short'})} — ${this.fmt(b.end,{day:'numeric',month:'short',year:'numeric'})}</p><div class="block-nav"><button class="small-button" data-action="block-prev" ${b.index===0?'disabled':''}>← 90 giorni</button><button class="small-button" data-action="block-next">90 giorni →</button></div><h3>Come è andata?</h3><div class="rating-buttons">${[['green','✓ Positiva'],['red','Da migliorare'],['gray','Non valutata']].map(([v,l])=>`<button data-rating="${v}" class="rating-${v}" aria-pressed="${v==='gray'?!r.rating:r.rating===v}" ${future?'disabled':''}>${l}</button>`).join('')}</div><label class="reflection-label" for="dailyReflection">${future?'Una nota per questo giorno':'Una cosa da portare a domani'}</label><textarea id="dailyReflection" maxlength="4000" placeholder="Anche una sola riga.">${this.e(r.note)}</textarea><p id="dailySaveState" class="muted-text" role="status">${future?'Puoi pianificare. Le spunte saranno disponibili quel giorno.':'Le modifiche vengono salvate in questo browser.'}</p><h3>Attività del giorno</h3>${r.tasks.map(t=>this.taskRow(t,this.selected)).join('')||'<p class="empty-copy">Nessuna attività in questa data.</p>'}${PrimeStore.data.history?.[this.selected]&&!PrimeStore.data.dailyRecords[this.selected]?`<p class="muted-text">Storico precedente: ${this.e(PrimeStore.data.history[this.selected].c)}/${this.e(PrimeStore.data.history[this.selected].t)} completate. I titoli non erano registrati.</p>`:''}`;
  },
  setEditorKind(kind) {
    this.editing.kind=kind;
    document.querySelectorAll('[data-editor-kind]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.editorKind===kind);b.disabled=!!(this.editing.task||this.editing.entry)&&b.dataset.editorKind!==kind;});
    const home=document.querySelector('#dailyPriority option[value="home"]');home.disabled=kind!=='task';
    if(kind!=='task'&&document.getElementById('dailyPriority').value==='home')document.getElementById('dailyPriority').value='normal';
  },
  setEditorArea(area,subject) {
    document.getElementById('dailyArea').value=area;
    document.querySelectorAll('[data-editor-area]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.editorArea===area));
    document.getElementById('personalAreaHint').hidden=area!=='Personale';
    const subjects=this.areaInfo(area).subjects.slice();if(subject&&!subjects.includes(subject))subjects.push(subject);
    document.getElementById('dailySubject').innerHTML=subjects.map(s=>`<option ${subject===s?'selected':''}>${this.e(s)}</option>`).join('');
  },
  openEditor(kind,options={}) {
    if(document.getElementById('dayReview').open)document.getElementById('dayReview').close();
    this.editing={kind,...options};const task=options.task,entry=options.entry,item=task||entry||{},date=options.date||entry?.date||this.selected;
    document.getElementById('dailyEditorTitle').textContent=task||entry?'Modifica voce':'Nuova voce';
    document.getElementById('dailyText').value=task?.title||entry?.text||options.text||'';
    document.getElementById('dailyTaskDate').value=date;document.getElementById('dailyTaskDate').disabled=!!task;
    const preset=date===this.C.today()?'today':date===this.C.add(this.C.today(),-1)?'yesterday':date===this.C.add(this.C.today(),1)?'tomorrow':'custom';
    document.getElementById('dailyDatePreset').value=preset;document.getElementById('dailyDatePreset').disabled=!!task;document.getElementById('dailyTaskDate').hidden=preset!=='custom';
    const home=options.priority||task&&this.C.day(PrimeStore.data,date).priorities.includes(task.id);
    document.getElementById('dailyPriority').value=home?'home':(item.priorityLevel==='home'?'normal':item.priorityLevel||'normal');
    document.getElementById('dailyReminder').checked=!!item.reminder;document.getElementById('dailyReminderTime').value=item.reminderTime||'09:00';document.getElementById('reminderDetails').hidden=!item.reminder;
    document.getElementById('dailyEditorError').textContent='';
    document.getElementById('dailyEditorHelp').textContent=task?'La modifica riguarda questa giornata. Le altre spunte restano nello storico.':'Le voci vengono salvate automaticamente nella tua giornata di diario.';
    this.setEditorArea(task?.category||entry?.area||this.area,item.subject);this.setEditorKind(kind);
    document.getElementById('dailyEditor').showModal();
    // Keep the mobile keyboard closed until the user chooses the text field.
    document.querySelector('#dailyEditor [data-action="cancel"]').focus();
  },
  openTools() {
    const el=document.getElementById('areaTools');
    el.innerHTML=`<header class="sheet-header"><h2>Opzioni</h2><button class="icon-button" data-action="close-tools" aria-label="Chiudi opzioni">${this.icon('close')}</button></header><button data-action="search">${this.icon('search')}Cerca e filtra</button><button data-action="catalog">Attività salvate</button><button data-action="inbox">Inbox precedente (${PrimeStore.data.inbox.length})</button><button data-action="goals">Obiettivi salvati</button><button data-action="backup">Esporta backup</button><p class="muted-text">Dati e spunte salvati in questo browser.</p>`;el.showModal();
  },
  openItem(options) {
    options.date=options.date||options.entry?.date||this.selected;
    this.itemAction=options;const r=this.C.day(PrimeStore.data,options.date||this.selected),task=options.task,entry=options.entry,priority=task&&r.priorities.includes(task.id),el=document.getElementById('itemActions');
    el.innerHTML=`<header class="sheet-header"><h2>${this.e(task?.title||entry?.text)}</h2><button class="icon-button" data-action="close-item" aria-label="Chiudi opzioni voce">${this.icon('close')}</button></header><button data-action="edit-item">Modifica</button>${task?`<button data-action="item-priority">${priority?'Rimuovi dalle priorità':'Scegli come priorità Home'}</button>${options.catalog?'<button data-action="item-schedule">Aggiungi al giorno scelto</button>':''}`:''}<p class="muted-text">${this.fmt(options.date||this.selected)}</p>`;el.showModal();
  },
  exportBackup() {const blob=new Blob([JSON.stringify(PrimeStore.data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='prime-dashboard-'+this.C.today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
  bind() {
    document.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.area)return this.openArea(b.dataset.area);
      if(b.dataset.reviewDate)return this.openReview(b.dataset.reviewDate);
      if(b.dataset.editorKind)return this.setEditorKind(b.dataset.editorKind);
      if(b.dataset.editorArea)return this.setEditorArea(b.dataset.editorArea);
      if(b.dataset.kind){this.kind=b.dataset.kind;this.areaView='journal';this.renderDetail();return;}
      if(b.dataset.collapseDate){const date=b.dataset.collapseDate;this.closedDays.has(date)?this.closedDays.delete(date):this.closedDays.add(date);this.renderAreaResults();return;}
      if(b.dataset.editRecord){const date=b.dataset.recordDate,task=this.C.day(PrimeStore.data,date).tasks.find(t=>t.id===b.dataset.editRecord);return this.openEditor('task',{task,date});}
      if(b.dataset.editEntry){const entry=PrimeStore.data.areaEntries.find(n=>n.id===b.dataset.editEntry);return this.openEditor(entry.kind,{entry});}
      if(b.dataset.itemTask){const date=b.dataset.recordDate,task=this.C.day(PrimeStore.data,date).tasks.find(t=>t.id===b.dataset.itemTask);return this.openItem({task,date});}
      if(b.dataset.itemEntry)return this.openItem({entry:PrimeStore.data.areaEntries.find(n=>n.id===b.dataset.itemEntry)});
      if(b.dataset.catalogTask)return this.openItem({task:PrimeStore.data.tasks.find(t=>t.id===b.dataset.catalogTask),catalog:true,date:this.selected});
      if(b.dataset.schedule)return this.mutate(data=>this.C.assign(data,this.selected,data.tasks.find(t=>t.id===b.dataset.schedule)));
      if(b.dataset.rating){this.mutate(data=>this.C.rate(data,this.selected,b.dataset.rating==='gray'?null:b.dataset.rating));this.renderReview();return;}
      const action=b.dataset.action;
      if(['prev','next','today','block-prev','block-next'].includes(action)){
        const block=this.C.block(PrimeStore.data,this.selected),date=action==='today'?this.C.today():action.startsWith('block')?this.C.add(block.start,action==='block-prev'?-90:90):this.C.add(this.selected,action==='prev'?-1:1);
        this.navigate(date);if(document.getElementById('dayReview').open)this.renderReview();return;
      }
      if(action==='review')this.openReview();
      if(action==='quote')this.mutate(data=>{data.dailyQuoteIndex=((data.dailyQuoteIndex||0)+1)%DAILY_QUOTES.length;});
      if(action==='priority')this.openEditor('task',{priority:true});
      if(action==='cancel')document.getElementById('dailyEditor').close();
      if(action==='back')UI.switchTab('Aree');
      if(action==='tools')this.openTools();
      if(action==='close-tools')document.getElementById('areaTools').close();
      if(action==='close-item')document.getElementById('itemActions').close();
      if(action==='close-review')document.getElementById('dayReview').close();
      if(['search','catalog','inbox','goals','backup'].includes(action)){
        document.getElementById('areaTools').close();
        if(action==='search'){this.filtersOpen=true;UI.switchTab('AreaDetail');document.getElementById('areaSearch').focus();}
        if(action==='catalog'){this.areaView='catalog';UI.switchTab('AreaDetail');}
        if(action==='inbox')UI.switchTab('Inbox');if(action==='goals')UI.openGoalsModal();if(action==='backup')this.exportBackup();
      }
      if(action==='close-search'){this.filtersOpen=false;this.query='';this.completion='all';this.dateScope='all';this.renderDetail();}
      if(action==='reset-filters'){this.query='';this.kind='all';this.completion='all';this.dateScope='all';this.renderDetail();}
      if(action==='journal'){this.areaView='journal';this.renderDetail();}
      if(action==='edit-item'){const item=this.itemAction;document.getElementById('itemActions').close();this.openEditor(item.task?'task':item.entry.kind,item);}
      if(action==='item-priority'||action==='item-schedule'){
        const item=this.itemAction;document.getElementById('itemActions').close();
        this.mutate(data=>{const r=this.C.day(data,item.date,true);if(action==='item-priority'&&r.priorities.includes(item.task.id))r.priorities=r.priorities.filter(x=>x!==item.task.id);else this.C.assign(data,item.date,item.task,action==='item-priority');});
        if(document.getElementById('dayReview').open)this.renderReview();
      }
    });
    document.addEventListener('input',e=>{
      if(e.target.id==='areaSearch'){this.query=e.target.value;this.renderAreaResults();}
      if(e.target.id==='dailyReflection'){
        const before=this.C.clone(PrimeStore.data);
        try{this.C.day(PrimeStore.data,this.selected,true).note=e.target.value;PrimeStore.save();document.getElementById('dailySaveState').textContent='Note salvate.';document.getElementById('dailyAlert').hidden=true;}catch(err){PrimeStore.data=before;this.fail(err);}
      }
    });
    document.addEventListener('change',e=>{
      const id=e.target.id;
      if(id==='dailySelectedDate'||id==='areaSelectedDate'){this.navigate(e.target.value);if(document.getElementById('dayReview').open)this.renderReview();}
      if(id==='areaCompletion'){this.completion=e.target.value;this.renderAreaResults();}
      if(id==='areaDateScope'){this.dateScope=e.target.value;this.renderAreaResults();}
      if(e.target.dataset.toggle){this.mutate(data=>this.C.toggle(data,e.target.dataset.toggleDate,e.target.dataset.toggle));if(document.getElementById('dayReview').open)this.renderReview();}
      if(id==='dailyReminder')document.getElementById('reminderDetails').hidden=!e.target.checked;
      if(id==='dailyDatePreset'){const preset=e.target.value;document.getElementById('dailyTaskDate').hidden=preset!=='custom';if(preset!=='custom')document.getElementById('dailyTaskDate').value=this.C.add(this.C.today(),preset==='yesterday'?-1:preset==='tomorrow'?1:0);}
    });
    document.addEventListener('submit',e=>{
      if(e.target.id==='areaQuickForm'){e.preventDefault();return this.openEditor(this.kind==='all'?'task':this.kind,{text:document.getElementById('areaQuickText').value});}
      if(e.target.id!=='dailyForm')return;
      e.preventDefault();const edit=this.editing,input={kind:edit.kind,text:document.getElementById('dailyText').value,area:document.getElementById('dailyArea').value,date:document.getElementById('dailyTaskDate').value,subject:document.getElementById('dailySubject').value,priorityLevel:document.getElementById('dailyPriority').value,reminder:document.getElementById('dailyReminder').checked,reminderTime:document.getElementById('dailyReminderTime').value};
      const ok=this.mutate(data=>{this.C.writeEntry(data,input,{taskId:edit.task?.id,recordDate:edit.date||this.selected,entryId:edit.entry?.id});this.selected=input.date;});
      if(ok){document.getElementById('dailyEditor').close();UI.showToast('Voce salvata nel diario.');}
      else document.getElementById('dailyEditorError').textContent=document.getElementById('dailyAlert').textContent;
    });
    window.addEventListener('storage',e=>{
      if(e.key!==STORAGE_KEY||!e.newValue)return;
      if(document.getElementById('dailyEditor').open||['dailyReflection','areaQuickText'].includes(document.activeElement?.id)){this.fail(new Error('L’archivio è cambiato in un’altra scheda. Ricarica prima di continuare.'));return;}
      try{PrimeStore.data=this.C.migrate(JSON.parse(e.newValue));this.lastRaw=e.newValue;UI.renderAll();if(document.getElementById('dayReview').open)this.renderReview();}catch(err){this.fail(err);}
    });
    this.lastToday=this.C.today();this.reminded=new Set();
    setInterval(()=>{const now=this.C.today();if(now!==this.lastToday){if(this.selected===this.lastToday&&!document.getElementById('dailyEditor').open&&!document.getElementById('dayReview').open)this.navigate(now);this.lastToday=now;}this.checkReminders();},60000);
    this.checkReminders();
  },
  checkReminders() {
    if(document.hidden)return;const now=new Date(),time=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'),date=this.C.today();
    for(const area of ['Corpo','Studio','Progetti'])for(const item of this.C.journal(PrimeStore.data,area,{date})){
      const value=item.task||item.entry,key=date+'-'+value.id;
      if(value.reminder&&value.reminderTime<=time&&!value.completed&&!this.reminded.has(key)){this.reminded.add(key);UI.showToast('Promemoria: '+(value.title||value.text));return;}
    }
  }
};
DailyApp.boot();
