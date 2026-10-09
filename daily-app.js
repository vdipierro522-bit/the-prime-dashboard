/* Home / Aree layer on the original Prime Dashboard and calendar. */
'use strict';
const DAILY_QUOTES = [
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
  installUI() {
    const app=this;
    UI.updateClock = () => {};
    UI.renderHome = () => app.renderHome();
    UI.renderTasks = () => app.renderHome();
    UI.renderHomeWeekStrip = () => {};
    UI.renderQuote = () => app.renderHome();
    UI.renderGoals = () => {};
    UI.renderAll = function () { app.renderHome(); app.renderAreas(); Calendar.render(); this.renderInbox(); };
    UI.switchTab = function(tabName) {
      if(tabName==='Areas') tabName='Aree';
      this.activeTab=tabName;
      document.querySelectorAll('.screen-view').forEach(el=>el.classList.toggle('active',el.id==='screen'+tabName));
      document.querySelectorAll('.nav-tab-item').forEach(el=>{
        const active=el.dataset.tab===tabName || (el.dataset.tab==='Aree' && ['Planner','Inbox'].includes(tabName));
        el.classList.toggle('active',active); el.setAttribute('aria-current',active?'page':'false');
      });
      document.getElementById('mainContent').scrollTop=0;
      Calendar.setActive(tabName==='Planner');
      document.getElementById('globalFabBtn').style.display=tabName==='Planner'?'flex':'none';
      if(tabName==='Home') app.renderHome();
      if(tabName==='Aree') app.renderAreas();
    };
    UI.openAddTaskModal = () => app.openEditor('task',{priority:true});
    const oldInit=UI.init;
    UI.init=function(){oldInit.call(this); app.bind(); this.switchTab('Home');};
  },
  prepareDOM() {
    const home=document.getElementById('screenHome'); home.classList.add('daily-home'); home.innerHTML='';
    const areas=document.createElement('section'); areas.id='screenAree'; areas.className='screen-view';
    document.getElementById('mainContent').append(areas);
    document.getElementById('bottomNavBar').innerHTML='<button class="nav-tab-item active" data-tab="Home" id="navTabHome" aria-current="page">⌂<span>Home</span></button><button class="nav-tab-item" data-tab="Aree" id="navTabAree">▦<span>Aree</span></button>';
    for(const name of ['Planner','Inbox']) {
      const back=document.createElement('button'); back.className='daily-button areas-back'; back.dataset.action='back'; back.textContent='← Aree';
      document.getElementById('screen'+name).prepend(back);
    }
    const dialog=document.createElement('dialog'); dialog.id='dailyEditor'; dialog.className='daily-dialog';
    dialog.innerHTML='<form id="dailyForm"><h2 id="dailyEditorTitle">Nuova attività</h2><label>Testo<textarea class="daily-textarea" id="dailyText" required maxlength="4000"></textarea></label><label>Area<select class="daily-select" id="dailyArea"><option>Corpo</option><option>Studio</option><option>Progetti</option><option>Personale</option></select></label><label id="dailyDateLabel">Giorno<input type="date" class="daily-input" id="dailyTaskDate" required></label><p id="dailyEditorHelp"></p><p id="dailyEditorError" class="daily-dialog-error" role="alert"></p><div class="daily-actions"><button class="daily-button" type="button" data-action="cancel">Annulla</button><button class="daily-button" type="submit">Salva</button></div></form>';
    document.body.append(dialog);
    const alert=document.createElement('div'); alert.id='dailyAlert'; alert.className='daily-alert'; alert.hidden=true; alert.setAttribute('role','alert'); document.body.append(alert);
  },
  fail(err) {const alert=document.getElementById('dailyAlert'); alert.hidden=false; alert.textContent=err.message+' Le modifiche non sono state salvate. Puoi esportare una copia da Aree.';},
  mutate(fn) {
    const before=this.C.clone(PrimeStore.data);
    try {fn(PrimeStore.data); PrimeStore.save(); document.getElementById('dailyAlert').hidden=true; this.renderHome(); this.renderAreas(); return true;}
    catch(err) {PrimeStore.data=before; this.fail(err); return false;}
  },
  taskHTML(task,priority=false) {
    return `<div class="daily-task ${task.completed?'done':''}"><input type="checkbox" class="daily-check" aria-label="Completa ${this.e(task.title)}" data-toggle="${this.e(task.id)}" ${task.completed?'checked':''} ${this.selected>this.C.today()?'disabled':''}><div class="task-copy"><strong>${this.e(task.title)}</strong><small>${this.e(task.category)}${task.completed?' · completata':''}</small></div>${priority?`<button class="daily-button subtle" data-remove="${this.e(task.id)}" aria-label="Rimuovi ${this.e(task.title)} dalle priorità">×</button>`:''}</div>`;
  },
  renderHome() {
    if(!PrimeStore.data) return;
    const C=this.C,data=PrimeStore.data,r=C.day(data,this.selected),b=C.block(data,this.selected),now=C.today(),future=this.selected>now;
    const priorities=r.priorities.map(id=>r.tasks.find(t=>t.id===id)).filter(Boolean),extras=r.tasks.filter(t=>!r.priorities.includes(t.id));
    const quote=DAILY_QUOTES[(data.dailyQuoteIndex||0)%DAILY_QUOTES.length];
    const blocks=Array.from({length:90},(_,i)=>{
      const date=C.add(b.start,i),status=C.status(data,date),legacy=data.history?.[date];
      const label=`${this.fmt(date)} · ${status==='green'?'Giornata positiva':status==='red'?'Da migliorare':date>now?'Giorno futuro':'Non valutata'}${legacy&&!data.dailyRecords[date]?` · storico precedente: ${legacy.c}/${legacy.t} completate`:''}`;
      return `<button class="day-block ${status} ${date===this.selected?'selected':''} ${date===now?'is-today':''}" data-date="${date}" title="${this.e(label)}" aria-label="${this.e(label)}" aria-pressed="${date===this.selected}"></button>`;
    }).join('');
    document.getElementById('screenHome').innerHTML=`
      <header class="daily-head"><div><p class="eyebrow">Prime Dashboard</p><h1>${this.selected===now?'Un giorno alla volta.':this.fmt(this.selected,{weekday:'long',day:'numeric',month:'long'})}</h1></div><div class="daily-datebar"><button class="daily-button" data-action="prev" aria-label="Giorno precedente">←</button><input class="daily-input" id="dailySelectedDate" type="date" value="${this.selected}" aria-label="Data selezionata"><button class="daily-button" data-action="next" aria-label="Giorno successivo">→</button><button class="daily-button" data-action="today">Oggi</button></div></header>
      <blockquote class="daily-quote"><p>${this.e(quote)}</p><button class="daily-button subtle" data-action="quote">Altra frase ↗</button></blockquote>
      <div class="daily-grid"><section><div class="section-head"><h2>Le tue tre priorità</h2><small>${priorities.filter(t=>t.completed).length}/${priorities.length} completate</small></div><div class="priority-list">${priorities.map(t=>this.taskHTML(t,true)).join('')}${Array.from({length:3-priorities.length},(_,i)=>`<div class="empty-priority"><span>0${priorities.length+i+1}</span><button class="daily-button subtle" data-action="priority">Scegli una priorità</button></div>`).join('')}</div><p class="daily-muted">${this.fmt(this.selected,{weekday:'long',day:'numeric',month:'long'})} · ${r.tasks.filter(t=>t.completed).length} attività completate</p>${extras.length?`<details class="daily-extra"><summary>Altre attività del giorno (${extras.length})</summary>${extras.map(t=>this.taskHTML(t)).join('')}</details>`:''}${data.history?.[this.selected]&&!data.dailyRecords[this.selected]?`<p class="daily-muted">Storico precedente: ${this.e(data.history[this.selected].c)} / ${this.e(data.history[this.selected].t)} completate. I titoli non erano registrati.</p>`:''}</section>
      <section><div class="tracker-head"><div><h2>${b.number<1?'Prima dell’inizio':`Giorno ${b.number}/90`} <span class="daily-muted">Blocco ${b.index+1} · ${this.fmt(b.start,{day:'numeric',month:'short'})} — ${this.fmt(b.end,{day:'numeric',month:'short',year:'numeric'})}</span></h2></div><div class="tracker-controls"><button class="daily-button" data-action="block-prev" aria-label="Blocco precedente" ${b.index===0?'disabled':''}>←</button><button class="daily-button" data-action="block-next" aria-label="Blocco successivo">→</button></div></div><div class="day-blocks" aria-label="Tracker di 90 giorni">${blocks}</div><div class="tracker-legend"><span><i class="green"></i>Positiva</span><span><i class="red"></i>Da migliorare</span><span><i></i>Non valutata / futura</span></div>
      <div class="daily-review"><h3>Come è andata questa giornata?</h3><div class="daily-actions"><button class="daily-button" data-rating="green" aria-pressed="${r.rating==='green'}" ${future?'disabled':''}>✓ Positiva</button><button class="daily-button red" data-rating="red" aria-pressed="${r.rating==='red'}" ${future?'disabled':''}>↗ Da migliorare</button><button class="daily-button subtle" data-rating="gray" aria-pressed="${!r.rating}" ${future?'disabled':''}>Non valutata</button></div><label class="review-field" for="dailyReflection">${future?'Una nota per questo giorno':'Una cosa da portare a domani'}<textarea class="daily-textarea" id="dailyReflection" placeholder="Anche una sola riga." maxlength="4000">${this.e(r.note)}</textarea></label><div class="daily-save-state" id="dailySaveState" role="status">${future?'Le spunte e la valutazione saranno disponibili quel giorno.':'Le modifiche vengono salvate in questo browser.'}</div></div></section></div>`;
  },
  renderAreas() {
    if(!PrimeStore.data) return;
    const data=PrimeStore.data,r=this.C.day(data,this.selected);
    const activities=data.tasks.filter(t=>t.category===this.area && !t.archived);
    const entries=kind=>data.areaEntries.filter(n=>n.area===this.area && n.kind===kind && !n.archived);
    const notes=kind=>entries(kind).map(n=>`<article class="area-entry">${this.e(n.text)}<footer><small class="daily-muted">${this.fmt(n.date,{day:'numeric',month:'short'})}</small><button class="daily-button subtle" data-edit-entry="${this.e(n.id)}">Modifica</button></footer></article>`).join('') || `<p class="daily-muted">${kind==='idea'?'Le idee possono aspettare qui.':'Appunti, dettagli e prossimi passi.'}</p>`;
    document.getElementById('screenAree').innerHTML=`<header class="area-heading"><p class="eyebrow">Prime Dashboard / Aree</p><h1>Metti ogni cosa al suo posto.</h1><p>Corpo, Studio, Progetti. Scegli cosa portare nel tuo giorno.</p></header><div class="area-tabs" role="group" aria-label="Scegli area">${['Corpo','Studio','Progetti'].map(a=>`<button class="daily-button" data-area="${a}" aria-pressed="${a===this.area}">${a}</button>`).join('')}</div><p class="daily-muted">Giorno selezionato: ${this.fmt(this.selected)} · <button class="daily-button subtle" data-action="back-home">Cambia data in Home ↗</button></p><div class="area-panels"><section class="area-panel"><div class="section-head"><h2>Attività</h2><button class="daily-button" data-action="activity">+ Aggiungi</button></div>${activities.map(t=>{
      const assigned=r.tasks.find(d=>d.id===t.id),priority=r.priorities.includes(t.id);
      return `<div class="daily-task area-activity ${assigned?.completed?'done':''}">${assigned?`<input type="checkbox" class="daily-check" aria-label="Completa ${this.e(t.title)}" data-toggle="${this.e(t.id)}" ${assigned.completed?'checked':''} ${this.selected>this.C.today()?'disabled':''}>`:''}<div class="task-copy"><strong>${this.e(t.title)}</strong><small>${assigned?(assigned.completed?'Completata nel giorno selezionato':'Nel giorno selezionato'):'Da pianificare'}</small></div><div class="daily-actions"><button class="daily-button" data-assign="${this.e(t.id)}" ${priority?'disabled':''}>${priority?'Priorità ✓':'Priorità'}</button>${!assigned?`<button class="daily-button subtle" data-schedule="${this.e(t.id)}">Nel giorno</button>`:''}<button class="daily-button subtle" data-edit-task="${this.e(t.id)}">Modifica</button></div></div>`;
    }).join('')||'<p class="daily-muted">Una sola attività concreta è un buon inizio.</p>'}</section><div><section class="area-panel"><div class="section-head"><h2>Idee</h2><button class="daily-button" data-action="idea">+ Aggiungi</button></div>${notes('idea')}</section><section class="area-panel"><div class="section-head"><h2>Note</h2><button class="daily-button" data-action="note">+ Aggiungi</button></div>${notes('note')}</section></div></div>
      <div class="area-tools"><button class="daily-button" data-action="planner">Planner</button><button class="daily-button" data-action="inbox">Inbox precedente (${data.inbox.length})</button><button class="daily-button" data-action="goals">Obiettivi salvati</button><button class="daily-button" data-action="backup">Esporta backup</button></div><p class="daily-muted">Dati salvati in questo browser. Lo storico resta legato alle date.</p>${data.tasks.some(t=>!['Corpo','Studio','Progetti'].includes(t.category)&&!t.archived)?`<details class="daily-extra"><summary>Altre attività salvate</summary>${data.tasks.filter(t=>!['Corpo','Studio','Progetti'].includes(t.category)&&!t.archived).map(t=>`<div class="daily-task"><div class="task-copy"><strong>${this.e(t.title)}</strong><small>${this.e(t.category)}</small></div><button class="daily-button" data-assign="${this.e(t.id)}">Priorità</button><button class="daily-button subtle" data-edit-task="${this.e(t.id)}">Modifica</button></div>`).join('')}</details>`:''}`;
  },
  navigate(date) {if(!this.C.valid(date)) return; this.selected=date; this.renderHome(); this.renderAreas();},
  openEditor(kind,options={}) {
    this.editing={kind,...options};
    const task=options.task,entry=options.entry;
    document.getElementById('dailyEditorTitle').textContent=task?'Modifica attività':entry?'Modifica appunto':kind==='task'?(options.priority?'Nuova priorità':'Nuova attività'):kind==='idea'?'Nuova idea':'Nuova nota';
    document.getElementById('dailyText').value=task?.title||entry?.text||'';
    document.getElementById('dailyArea').value=task?.category||entry?.area||this.area;
    document.getElementById('dailyTaskDate').value=this.selected;
    document.getElementById('dailyDateLabel').hidden=kind!=='task'||!!task;
    document.getElementById('dailyEditorHelp').textContent=task?'La modifica aggiorna il catalogo e il giorno selezionato. Gli altri giorni restano nello storico.':kind==='task'?'L’attività viene salvata anche nell’area scelta.':'Questo appunto rimane nell’area scelta.';
    document.getElementById('dailyEditorError').textContent='';
    document.getElementById('dailyEditor').showModal();
    document.getElementById('dailyText').focus();
  },
  bind() {
    document.addEventListener('click',e=>{
      const button=e.target.closest('button'); if(!button) return;
      if(button.dataset.date) return this.navigate(button.dataset.date);
      if(button.dataset.area) {this.area=button.dataset.area; this.renderAreas();return;}
      if(button.dataset.rating) return this.mutate(data=>this.C.rate(data,this.selected,button.dataset.rating==='gray'?null:button.dataset.rating));
      if(button.dataset.remove) return this.mutate(data=>{const r=this.C.day(data,this.selected,true);r.priorities=r.priorities.filter(id=>id!==button.dataset.remove);});
      if(button.dataset.assign||button.dataset.schedule) return this.mutate(data=>this.C.assign(data,this.selected,data.tasks.find(t=>t.id===(button.dataset.assign||button.dataset.schedule)),!!button.dataset.assign));
      if(button.dataset.editTask) return this.openEditor('task',{task:PrimeStore.data.tasks.find(t=>t.id===button.dataset.editTask)});
      if(button.dataset.editEntry) {const entry=PrimeStore.data.areaEntries.find(t=>t.id===button.dataset.editEntry);return this.openEditor(entry.kind,{entry});}
      const action=button.dataset.action;
      if(action==='prev'||action==='next') this.navigate(this.C.add(this.selected,action==='prev'?-1:1));
      if(action==='today') this.navigate(this.C.today());
      if(action==='block-prev'||action==='block-next') {const b=this.C.block(PrimeStore.data,this.selected);this.navigate(this.C.add(b.start,action==='block-prev'?-90:90));}
      if(action==='quote') this.mutate(data=>{data.dailyQuoteIndex=((data.dailyQuoteIndex||0)+1)%DAILY_QUOTES.length;});
      if(action==='priority') this.openEditor('task',{priority:true});
      if(action==='activity') this.openEditor('task');
      if(action==='idea'||action==='note') this.openEditor(action);
      if(action==='cancel') document.getElementById('dailyEditor').close();
      if(action==='back') UI.switchTab('Aree');
      if(action==='back-home') UI.switchTab('Home');
      if(action==='planner') UI.switchTab('Planner');
      if(action==='inbox') UI.switchTab('Inbox');
      if(action==='goals') UI.openGoalsModal();
      if(action==='backup') {
        const blob=new Blob([JSON.stringify(PrimeStore.data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download='prime-dashboard-'+this.C.today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    });
    document.addEventListener('input',e=>{
      if(e.target.id!=='dailyReflection') return;
      const before=this.C.clone(PrimeStore.data);
      try{this.C.day(PrimeStore.data,this.selected,true).note=e.target.value;PrimeStore.save();document.getElementById('dailySaveState').textContent='Note salvate.';document.getElementById('dailyAlert').hidden=true;}
      catch(err){PrimeStore.data=before;this.fail(err);}
    });
    document.addEventListener('change',e=>{
      if(e.target.id==='dailySelectedDate') this.navigate(e.target.value);
      if(e.target.dataset.toggle) this.mutate(data=>this.C.toggle(data,this.selected,e.target.dataset.toggle));
      if(e.target.id==='dailyReflection') {
        const before=this.C.clone(PrimeStore.data);
        try{this.C.day(PrimeStore.data,this.selected,true).note=e.target.value;PrimeStore.save();document.getElementById('dailySaveState').textContent='Note salvate.';document.getElementById('dailyAlert').hidden=true;}
        catch(err){PrimeStore.data=before;this.fail(err);}
      }
    });
    document.getElementById('dailyForm').addEventListener('submit',e=>{
      e.preventDefault();const text=document.getElementById('dailyText').value.trim(),area=document.getElementById('dailyArea').value,date=document.getElementById('dailyTaskDate').value,edit=this.editing;
      if(!text) return;
      const ok=this.mutate(data=>{
        if(edit.task) {
          const task=data.tasks.find(t=>t.id===edit.task.id);task.title=text;task.category=area;
          const snapshot=this.C.day(data,this.selected).tasks.find(t=>t.id===task.id);if(snapshot){snapshot.title=text;snapshot.category=area;}
        } else if(edit.kind==='task') {
          const task={id:this.C.uid(),title:text,category:area,completed:false};
          this.C.assign(data,date,task,!!edit.priority);data.tasks.push(task);this.selected=date;
        } else if(edit.entry) {const entry=data.areaEntries.find(n=>n.id===edit.entry.id);entry.text=text;entry.area=area;}
        else data.areaEntries.push({id:this.C.uid(),kind:edit.kind,text,area,date:this.C.today()});
      });
      if(ok) {document.getElementById('dailyEditor').close();UI.showToast('Salvato.');}
      else document.getElementById('dailyEditorError').textContent=document.getElementById('dailyAlert').textContent;
    });
    window.addEventListener('storage',e=>{
      if(e.key!==STORAGE_KEY||!e.newValue) return;
      // Do not replace an unfinished note or dialog from another tab.
      if(document.getElementById('dailyEditor').open||document.activeElement?.id==='dailyReflection') {this.fail(new Error('L’archivio è cambiato in un’altra scheda. Ricarica prima di continuare.'));return;}
      try{const data=this.C.migrate(JSON.parse(e.newValue));PrimeStore.data=data;this.lastRaw=e.newValue;UI.renderAll();}catch(err){this.fail(err);}
    });
    document.addEventListener('visibilitychange',()=>{if(!document.hidden && this.selected===this.lastToday){this.selected=this.C.today();this.lastToday=this.selected;this.renderHome();this.renderAreas();}});
    this.lastToday=this.C.today();
    setInterval(()=>{
      const now=this.C.today();
      if(now===this.lastToday) return;
      if(this.selected===this.lastToday && !document.getElementById('dailyEditor').open) this.navigate(now);
      this.lastToday=now;
    },60000);
  }
};
DailyApp.boot();
