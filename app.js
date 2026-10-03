/**
 * The Prime Dashboard — Core Application Logic
 * Clean, fast, zero-dependency, local-first architecture
 * Tailored for Vincenzo (Vince)
 */

// ==========================================================================
// 1. DATA STORE & LOCAL PERSISTENCE
// ==========================================================================

const STORAGE_KEY = 'PRIME_DASHBOARD_STORE_v1';

const DEFAULT_MOTIVATIONAL_QUOTES = [
  "“Disciplina oggi\n= libertà domani.”",
  "“Ingegneria, codice e corpo:\nzero alibi, solo esecuzione.”",
  "“Costruisci ExecutiveAI,\nallena il fisico, domina lo studio.”",
  "“Ogni serie alla sbarra e ogni riga\ndi codice costruiscono il tuo futuro.”",
  "“Zona 2, 8h di sonno, deep work:\nla costanza batte il talento.”",
  "“Meno overthinking sul sistema,\npiù focus sull'output reale.”",
  "“L'ammissione a ingegneria all'estero\nsi conquista con le ore di oggi.”"
];

const DEFAULT_STATE = {
  tasks: [
    { id: 't-1', title: 'Studiare Analisi', category: 'Studio', completed: true },
    { id: 't-2', title: 'Allenamento in palestra', category: 'Corpo', completed: false },
    { id: 't-3', title: 'Lavorare al progetto', category: 'Progetti', completed: false },
    { id: 't-4', title: 'Pianificare la settimana', category: 'Personale', completed: true },
    { id: 't-5', title: 'Leggere 20 pagine libro', category: 'Studio', completed: false }
  ],
  goals: [
    { id: 'g-1', title: 'Studiare con costanza', progress: 70, category: 'Studio', icon: 'target' },
    { id: 'g-2', title: 'Mantenere il benessere fisico', progress: 50, category: 'Corpo', icon: 'dumbbell' },
    { id: 'g-3', title: 'Completare il progetto', progress: 25, category: 'Progetti', icon: 'bars' }
  ],
  // Planner events for days: day index 0 (Lun) to 6 (Dom)
  plannerBlocks: [
    { id: 'p-1', dayIndex: 1, startTime: '07:00', endTime: '08:30', title: 'Routine mattutina', subtitle: 'Sveglia, colazione, mobilità', category: 'Neutral', icon: 'sun' },
    { id: 'p-2', dayIndex: 1, startTime: '09:00', endTime: '11:00', title: 'Studio', subtitle: 'Marketing', category: 'Studio', icon: 'book' },
    { id: 'p-3', dayIndex: 1, startTime: '11:30', endTime: '13:00', title: 'Studio', subtitle: 'Matematica', category: 'Studio', icon: 'book' },
    { id: 'p-4', dayIndex: 1, startTime: '13:00', endTime: '14:00', title: 'Pranzo', subtitle: '', category: 'Neutral', icon: 'utensils' },
    { id: 'p-5', dayIndex: 1, startTime: '14:00', endTime: '15:00', title: 'Riposo', subtitle: '', category: 'Neutral', icon: 'bed' },
    { id: 'p-6', dayIndex: 1, startTime: '15:00', endTime: '17:00', title: 'Palestra', subtitle: 'Spinta e Mobilità', category: 'Corpo', icon: 'dumbbell' },
    { id: 'p-7', dayIndex: 1, startTime: '17:30', endTime: '19:00', title: 'Progetto', subtitle: "Lavorare all'agent", category: 'Progetti', icon: 'laptop' },
    { id: 'p-8', dayIndex: 1, startTime: '20:30', endTime: '21:30', title: 'Inglese', subtitle: 'Pratica e Vocabolario', category: 'Personale', icon: 'book' }
  ],
  inbox: [
    { id: 'i-1', text: "Organizzare viaggio per l'estate", tag: 'Idea', timestamp: '10:24', processed: false },
    { id: 'i-2', text: 'Comprare regalo per Luca', tag: 'Task', timestamp: '09:12', processed: false },
    { id: 'i-3', text: 'Sto pensando di cambiare il mio laptop', tag: 'Pensiero', timestamp: '13 Mag', processed: false },
    { id: 'i-4', text: 'Devo controllare le scadenze universitarie', tag: 'Task', timestamp: '13 Mag', processed: false },
    { id: 'i-5', text: 'Sarebbe bello iniziare un podcast', tag: 'Idea', timestamp: '13 Mag', processed: false },
    { id: 'i-6', text: "Mi sento un po' stressato per l'esame", tag: 'Preoccupazione', timestamp: '13 Mag', processed: false },
    { id: 'i-7', text: 'Ricordati di chiamare la banca', tag: 'Task', timestamp: '12 Mag', processed: false },
    { id: 'i-8', text: 'Voglio imparare a fare video meglio', tag: 'Idea', timestamp: '12 Mag', processed: false }
  ],
  quoteIndex: 0,
  activePlannerDay: 1 // Default Martedì (1) like screenshot
};

const PrimeStore = {
  data: null,

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.save();
      }
    } catch (e) {
      console.warn("Storage load failed, using defaults:", e);
      this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    
    // Migrations
    if (!this.data.history) this.data.history = {};
    if (!this.data.sprintStartDate) {
      const now = new Date();
      this.data.sprintStartDate = now.toISOString().split('T')[0];
      this.save();
    }
  },

  updateDailyHistory() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = this.getTasks();
    if (!this.data.history) this.data.history = {};
    this.data.history[today] = {
      t: tasks.length,
      c: tasks.filter(t => t.completed).length
    };
    this.save();
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  },

  // Tasks API
  getTasks() {
    return this.data.tasks || [];
  },

  addTask(title, category = 'Studio') {
    const newTask = {
      id: 't-' + Date.now(),
      title: title.trim(),
      category: category,
      completed: false
    };
    this.data.tasks.push(newTask);
    this.save();
    return newTask;
  },

  updateTask(id, updates) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      this.save();
    }
    return task;
  },

  deleteTask(id) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.save();
  },

  // Goals API
  getGoals() {
    return this.data.goals || [];
  },

  updateGoal(id, progress) {
    const goal = this.data.goals.find(g => g.id === id);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, parseInt(progress, 10)));
      this.save();
    }
    return goal;
  },

  // Planner API
  getPlannerBlocks(dayIndex) {
    const blocks = (this.data.plannerBlocks || []).filter(b => b.dayIndex === dayIndex);
    // Sort chronologically by startTime
    return blocks.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  },

  addPlannerBlock(blockData) {
    const newBlock = {
      id: 'p-' + Date.now(),
      dayIndex: typeof blockData.dayIndex === 'number' ? blockData.dayIndex : this.data.activePlannerDay,
      startTime: blockData.startTime || '09:00',
      endTime: blockData.endTime || '',
      title: blockData.title.trim(),
      subtitle: (blockData.subtitle || '').trim(),
      category: blockData.category || 'Studio',
      icon: blockData.icon || this.getIconForCategory(blockData.category)
    };
    this.data.plannerBlocks.push(newBlock);
    this.save();
    return newBlock;
  },

  updatePlannerBlock(id, updates) {
    const block = this.data.plannerBlocks.find(b => b.id === id);
    if (block) {
      Object.assign(block, updates);
      if (updates.category && !updates.icon) {
        block.icon = this.getIconForCategory(updates.category);
      }
      this.save();
    }
    return block;
  },

  deletePlannerBlock(id) {
    this.data.plannerBlocks = this.data.plannerBlocks.filter(b => b.id !== id);
    this.save();
  },

  getIconForCategory(category) {
    switch (category) {
      case 'Studio': return 'book';
      case 'Corpo': return 'dumbbell';
      case 'Progetti': return 'laptop';
      case 'Personale': return 'book';
      default: return 'sun';
    }
  },

  // Inbox API
  getInboxItems(filter = 'all') {
    const items = this.data.inbox || [];
    if (!filter || filter === 'all') return items;
    return items.filter(item => (item.tag || '').toLowerCase() === filter.toLowerCase());
  },

  addInboxItem(text, tag = null) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const newItem = {
      id: 'i-' + Date.now(),
      text: text.trim(),
      tag: tag,
      timestamp: `${hours}:${mins}`,
      processed: false
    };
    this.data.inbox.unshift(newItem); // add to top
    this.save();
    return newItem;
  },

  updateInboxItem(id, updates) {
    const item = this.data.inbox.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
    }
    return item;
  },

  deleteInboxItem(id) {
    this.data.inbox = this.data.inbox.filter(i => i.id !== id);
    this.save();
  }
};


// ==========================================================================
// 2. ICONS & SVG HELPERS
// ==========================================================================

const SVG_ICONS = {
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  dumbbell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m2 6 4-4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path></svg>`,
  laptop: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>`,
  utensils: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path><path d="M15 11v11"></path><path d="M5 2v20"></path><path d="M2 2h6v5a3 3 0 0 1-6 0V2z"></path></svg>`,
  bed: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>`,
  target: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
  bars: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
};


// ==========================================================================
// 3. UI CONTROLLER & VIEW LOGIC
// ==========================================================================

const DAYS_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAYS_FULL = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const MONTHS_ITA = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const UI = {
  activeTab: 'Home',
  activeInboxFilter: 'all',
  selectedInboxItem: null,

  init() {
    this.bindEvents();
    this.updateClock();
    setInterval(() => this.updateClock(), 15000);
    this.renderAll();
  },

  updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const clockEl = document.getElementById('statusClock');
    if (clockEl) {
      clockEl.textContent = `${hours}:${mins}`;
    }

    // Update Date Header
    const dayName = DAYS_FULL[(now.getDay() + 6) % 7];
    const dayNum = now.getDate();
    const monthName = MONTHS_ITA[now.getMonth()];
    const dateHeader = document.getElementById('homeCurrentDate');
    if (dateHeader) {
      dateHeader.textContent = `${dayName} ${dayNum} ${monthName}`;
    }
  },

  renderAll() {
    this.renderHome();
    this.renderPlanner();
    this.renderInbox();
  },

  // Switch between tabs
  switchTab(tabName) {
    this.activeTab = tabName;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update Screens
    document.querySelectorAll('.screen-view').forEach(screen => {
      screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(`screen${tabName}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // Scroll to top of content
    document.getElementById('mainContent').scrollTop = 0;

    // Configure Floating Action Button (FAB)
    const fab = document.getElementById('globalFabBtn');
    if (fab) {
      if (tabName === 'Planner') {
        fab.style.display = 'flex';
      } else if (tabName === 'Home') {
        fab.style.display = 'none'; // Home has mini add button inside card
      } else if (tabName === 'Inbox') {
        fab.style.display = 'none'; // Inbox has top big input field
      }
    }
  },

  // ------------------------------------------------------------------------
  // HOME SCREEN RENDERING
  // ------------------------------------------------------------------------
  renderHome() {
    this.renderHomeWeekStrip();
    this.renderQuote();
    this.renderTasks();
    this.renderGoals();

    // Aggiorna Sprint Badge
    const badge = document.getElementById('sprintBadge');
    if (badge && PrimeStore.data.sprintStartDate) {
       const start = new Date(PrimeStore.data.sprintStartDate);
       const now = new Date();
       const diffTime = Math.abs(now - start);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 
       badge.textContent = `Giorno ${diffDays}/90`;
    }
  },

  renderQuote() {
    const quoteEl = document.getElementById('quoteText');
    if (!quoteEl) return;
    const qIndex = (PrimeStore.data.quoteIndex || 0) % DEFAULT_MOTIVATIONAL_QUOTES.length;
    quoteEl.innerHTML = DEFAULT_MOTIVATIONAL_QUOTES[qIndex].replace('\n', '<br>');
  },

  renderHomeWeekStrip() {
    const strip = document.getElementById('homeWeekStrip');
    if (!strip) return;

    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const baseDays = [];
    const DAYS_LETTERS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isCurrent = d.toDateString() === now.toDateString();
      const isPast = d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const dStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      
      let dotClass = 'pending';
      let dotInner = '';

      if (isCurrent) {
        const tasks = PrimeStore.getTasks();
        const tot = tasks.length;
        const comp = tasks.filter(t=>t.completed).length;
        if (tot > 0 && comp === tot) {
           dotClass = 'completed';
           dotInner = SVG_ICONS.check;
        } else if (tot > 0) {
           dotClass = 'partial';
           dotInner = `<span style="font-size:9px; font-weight:800;">${comp}/${tot}</span>`;
        }
      } else if (isPast) {
        const h = PrimeStore.data.history ? PrimeStore.data.history[dStr] : null;
        if (h && h.t > 0) {
           if (h.c === h.t) {
             dotClass = 'completed';
             dotInner = SVG_ICONS.check;
           } else {
             dotClass = 'partial'; // Arancione anche per i giorni passati incompleti? Il prompt dice "arancioni quelli tipo 2/3"
             dotInner = `<span style="font-size:9px; font-weight:800;">${h.c}/${h.t}</span>`;
           }
        } else {
           dotClass = 'failed';
           dotInner = `<span style="font-size:12px; font-weight:800;">×</span>`;
        }
      }

      baseDays.push({
        letter: DAYS_LETTERS[i],
        num: d.getDate(),
        dotClass: dotClass,
        dotInner: dotInner,
        current: isCurrent
      });
    }

    strip.innerHTML = baseDays.map((d, index) => {
      const isCurrent = d.current ? 'current' : '';
      return `
        <div class="day-pill ${isCurrent}" data-day-index="${index}" onclick="UI.onSelectHomeDay(${index})">
          <span class="day-letter">${d.letter}</span>
          <span class="day-number">${d.num}</span>
          <div class="day-status-dot ${d.dotClass}">
            ${d.dotInner}
          </div>
        </div>
      `;
    }).join('');
  },

  onSelectHomeDay(index) {
    // Jump to Planner for this day
    PrimeStore.data.activePlannerDay = index;
    PrimeStore.save();
    this.switchTab('Planner');
    this.renderPlanner();
  },

  renderTasks() {
    PrimeStore.updateDailyHistory();
    this.renderHomeWeekStrip();

    const tasks = PrimeStore.getTasks();
    const taskList = document.getElementById('homeTaskList');
    const badge = document.getElementById('taskCounterBadge');
    if (!taskList) return;

    const completedCount = tasks.filter(t => t.completed).length;
    if (badge) {
      badge.textContent = `${completedCount}/${tasks.length}`;
    }

    if (tasks.length === 0) {
      taskList.innerHTML = `<div style="text-align:center; padding: 18px; color: var(--text-muted); font-size: 13px;">Nessuna task per oggi. Tocca il + per aggiungerne una.</div>`;
      return;
    }

    taskList.innerHTML = tasks.map(t => {
      const isDone = t.completed ? 'completed' : '';
      const catClass = `badge-${t.category.toLowerCase()}`;
      return `
        <div class="task-item ${isDone}" data-task-id="${t.id}">
          <button class="task-checkbox-btn" onclick="UI.toggleTask('${t.id}')">
            ${SVG_ICONS.check}
          </button>
          <span class="task-title" onclick="UI.editTaskModal('${t.id}')">${this.escapeHtml(t.title)}</span>
          <span class="category-badge ${catClass}">${t.category}</span>
        </div>
      `;
    }).join('');
  },

  toggleTask(id) {
    const tasks = PrimeStore.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      PrimeStore.save();
      
      // Collegamento automatico Task -> Obiettivo (Gamification leggera)
      const goals = PrimeStore.getGoals();
      const goal = goals.find(g => (g.category || '').toLowerCase() === (task.category || '').toLowerCase());
      
      if (goal) {
         if (task.completed) {
            goal.progress = Math.min(100, goal.progress + 1);
         } else {
            goal.progress = Math.max(0, goal.progress - 1);
         }
         PrimeStore.save();
         this.renderGoals();
      }

      this.renderTasks();
      this.showToast(task.completed ? "Task completata! 🎯" : "Task riaperta");
    }
  },

  renderGoals() {
    const goals = PrimeStore.getGoals().slice(0, 3);
    const container = document.getElementById('homeGoalsList');
    if (!container) return;

    container.innerHTML = goals.map(g => {
      const catLower = (g.category || 'Studio').toLowerCase();
      const iconKey = g.icon || 'target';
      const iconSvg = SVG_ICONS[iconKey] || SVG_ICONS.target;

      return `
        <div class="goal-item" onclick="UI.openGoalsModal()">
          <div class="goal-icon-box icon-${catLower}">
            ${iconSvg}
          </div>
          <div class="goal-content">
            <span class="goal-title">${this.escapeHtml(g.title)}</span>
            <div class="goal-progress-track">
              <div class="goal-progress-fill fill-${catLower}" style="width: ${g.progress}%"></div>
            </div>
          </div>
          <span class="goal-percent-text">${g.progress}%</span>
        </div>
      `;
    }).join('');
  },

  // ------------------------------------------------------------------------
  // PLANNER SCREEN RENDERING
  // ------------------------------------------------------------------------
  renderPlanner() {
    this.renderPlannerDaySelector();
    this.renderPlannerTimeline();
  },

  renderPlannerDaySelector() {
    const container = document.getElementById('plannerDaysSelector');
    if (!container) return;

    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const baseDays = [];
    const DAYS_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      baseDays.push({
        name: DAYS_NAMES_SHORT[i],
        num: d.getDate(),
        index: i
      });
    }
    
    // Vista settimanale
    baseDays.push({ name: 'Week', num: 'All', index: 7 });

    const activeIndex = PrimeStore.data.activePlannerDay;

    container.innerHTML = baseDays.map((d) => {
      const isActive = d.index === activeIndex ? 'active' : '';
      return `
        <div class="planner-day-pill ${isActive}" onclick="UI.selectPlannerDay(${d.index})">
          <span class="day-name">${d.name}</span>
          <span class="day-num">${d.num}</span>
        </div>
      `;
    }).join('');

    // Also populate modal day select dropdown (solo giorni reali 0-6)
    const daySelect = document.getElementById('plannerDaySelect');
    if (daySelect) {
      daySelect.innerHTML = baseDays.filter(d => d.index < 7).map((d) => `
        <option value="${d.index}" ${d.index === (activeIndex === 7 ? dayOfWeek : activeIndex) ? 'selected' : ''}>${d.name} ${d.num}</option>
      `).join('');
    }
  },

  selectPlannerDay(index) {
    PrimeStore.data.activePlannerDay = index;
    PrimeStore.save();
    this.renderPlanner();
  },

  renderPlannerTimeline() {
    const currentDay = PrimeStore.data.activePlannerDay;
    let blocks = [];
    if (currentDay === 7) {
      blocks = [...(PrimeStore.data.plannerBlocks || [])]
        .sort((a, b) => {
          if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
          return (a.startTime || '').localeCompare(b.startTime || '');
        });
    } else {
      blocks = PrimeStore.getPlannerBlocks(currentDay);
    }
    const container = document.getElementById('plannerTimelineList');
    const emptyState = document.getElementById('plannerEmptyState');
    if (!container) return;

    if (blocks.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = blocks.map(b => {
      const catClass = (b.category || 'Neutral').toLowerCase();
      const themeClass = `theme-${catClass}`;
      const iconKey = b.icon || 'sun';
      const iconSvg = SVG_ICONS[iconKey] || SVG_ICONS.sun;

      const timeRange = b.endTime ? `${b.startTime} – ${b.endTime}` : b.startTime;
      
      let subtitleHtml = '';
      if (currentDay === 7) {
         const dayName = DAYS_NAMES[b.dayIndex] || '';
         const subText = b.subtitle ? ` • ${this.escapeHtml(b.subtitle)}` : '';
         subtitleHtml = `<p class="timeline-card-sub"><strong style="color:var(--text-primary)">${dayName}</strong>${subText}</p>`;
      } else if (b.subtitle) {
         subtitleHtml = `<p class="timeline-card-sub">${this.escapeHtml(b.subtitle)}</p>`;
      }

      return `
        <div class="timeline-row ${themeClass}" data-block-id="${b.id}">
          <div class="timeline-time-col">${b.startTime}</div>
          <div class="timeline-axis-node">
            <div class="timeline-dot"></div>
            <div class="timeline-axis-line"></div>
          </div>
          <div class="timeline-card ${themeClass}" onclick="UI.editPlannerModal('${b.id}')">
            <div class="timeline-card-icon">
              ${iconSvg}
            </div>
            <div class="timeline-card-body">
              <h4 class="timeline-card-title">${this.escapeHtml(b.title)}</h4>
              ${subtitleHtml}
              ${b.endTime ? `<div class="timeline-card-time">${timeRange}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ------------------------------------------------------------------------
  // INBOX SCREEN RENDERING
  // ------------------------------------------------------------------------
  renderInbox() {
    let items = PrimeStore.getInboxItems(this.activeInboxFilter === 'Archivio' ? 'all' : this.activeInboxFilter);
    
    if (this.activeInboxFilter === 'Archivio') {
       items = items.filter(i => i.processed);
    } else {
       items = items.filter(i => !i.processed);
    }

    const container = document.getElementById('inboxItemsList');
    const emptyState = document.getElementById('inboxEmptyState');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = items.map(item => {
      const tagClass = item.tag ? `tag-${item.tag.toLowerCase()}` : '';
      const tagText = item.tag ? this.formatInboxTag(item.tag) : '';
      const processedClass = item.processed ? 'processed' : '';

      return `
        <div class="inbox-item-row ${processedClass}" data-inbox-id="${item.id}">
          <button class="inbox-check-btn" onclick="UI.toggleInboxItem('${item.id}')"></button>
          <span class="inbox-item-text" onclick="UI.openInboxActionSheet('${item.id}')">${this.escapeHtml(item.text)}</span>
          ${item.tag ? `<span class="inbox-tag ${tagClass}">${tagText}</span>` : ''}
          <span class="inbox-time-text">${item.timestamp}</span>
          <button class="inbox-menu-btn" onclick="UI.openInboxActionSheet('${item.id}')" title="Opzioni">···</button>
        </div>
      `;
    }).join('');
  },

  formatInboxTag(tag) {
    switch (tag) {
      case 'Idea': return '💡 Idea';
      case 'Task': return '📍 Task';
      case 'Pensiero': return 'Pensiero';
      case 'Preoccupazione': return 'Preoccupazione';
      case 'Altro': return 'Altro';
      default: return tag;
    }
  },

  toggleInboxItem(id) {
    const item = PrimeStore.data.inbox.find(i => i.id === id);
    if (item) {
      item.processed = !item.processed;
      PrimeStore.save();
      this.renderInbox();
      this.showToast(item.processed ? "Archiviato come completato" : "Ripristinato");
    }
  },

  // ------------------------------------------------------------------------
  // MODALS & ACTIONS
  // ------------------------------------------------------------------------

  // Task Modal (Home)
  openAddTaskModal() {
    const modal = document.getElementById('taskModal');
    const titleEl = document.getElementById('taskModalTitle');
    const input = document.getElementById('taskTitleInput');
    const idInput = document.getElementById('taskIdInput');
    const delBtn = document.getElementById('deleteTaskBtn');

    titleEl.textContent = 'Nuova Task di Oggi';
    idInput.value = '';
    input.value = '';
    delBtn.style.display = 'none';

    modal.classList.add('show');
    setTimeout(() => input.focus(), 150);
  },

  editTaskModal(id) {
    const task = PrimeStore.getTasks().find(t => t.id === id);
    if (!task) return;

    const modal = document.getElementById('taskModal');
    const titleEl = document.getElementById('taskModalTitle');
    const input = document.getElementById('taskTitleInput');
    const idInput = document.getElementById('taskIdInput');
    const delBtn = document.getElementById('deleteTaskBtn');

    titleEl.textContent = 'Modifica Task';
    idInput.value = task.id;
    input.value = task.title;
    delBtn.style.display = 'block';

    const radio = document.querySelector(`input[name="taskCategory"][value="${task.category}"]`);
    if (radio) radio.checked = true;

    modal.classList.add('show');
    setTimeout(() => input.focus(), 150);
  },

  // Planner Modal
  openAddPlannerModal(prefillTitle = '') {
    const modal = document.getElementById('plannerModal');
    const titleHeader = document.getElementById('plannerModalTitle');
    const idInput = document.getElementById('plannerBlockIdInput');
    const titleInput = document.getElementById('plannerTitleInput');
    const subInput = document.getElementById('plannerSubtitleInput');
    const startInput = document.getElementById('plannerStartTimeInput');
    const endInput = document.getElementById('plannerEndTimeInput');
    const delBtn = document.getElementById('deletePlannerBtn');
    const daySelect = document.getElementById('plannerDaySelect');

    titleHeader.textContent = 'Nuovo Blocco Planner';
    idInput.value = '';
    titleInput.value = prefillTitle;
    subInput.value = '';
    startInput.value = '10:00';
    endInput.value = '11:30';
    delBtn.style.display = 'none';

    if (daySelect) daySelect.value = PrimeStore.data.activePlannerDay;

    modal.classList.add('show');
    setTimeout(() => titleInput.focus(), 150);
  },

  editPlannerModal(id) {
    const block = PrimeStore.data.plannerBlocks.find(b => b.id === id);
    if (!block) return;

    const modal = document.getElementById('plannerModal');
    const titleHeader = document.getElementById('plannerModalTitle');
    const idInput = document.getElementById('plannerBlockIdInput');
    const titleInput = document.getElementById('plannerTitleInput');
    const subInput = document.getElementById('plannerSubtitleInput');
    const startInput = document.getElementById('plannerStartTimeInput');
    const endInput = document.getElementById('plannerEndTimeInput');
    const delBtn = document.getElementById('deletePlannerBtn');
    const daySelect = document.getElementById('plannerDaySelect');

    titleHeader.textContent = 'Modifica Blocco';
    idInput.value = block.id;
    titleInput.value = block.title;
    subInput.value = block.subtitle || '';
    startInput.value = block.startTime || '09:00';
    endInput.value = block.endTime || '';
    delBtn.style.display = 'block';

    if (daySelect) daySelect.value = block.dayIndex;

    const catRadio = document.querySelector(`input[name="plannerCategory"][value="${block.category}"]`);
    if (catRadio) catRadio.checked = true;

    modal.classList.add('show');
  },

  // Goals Modal
  openGoalsModal() {
    const modal = document.getElementById('goalsModal');
    const list = document.getElementById('goalsModalList');
    const goals = PrimeStore.getGoals();

    list.innerHTML = goals.map(g => `
      <div class="goal-manage-card">
        <div class="goal-manage-header">
          <strong style="color:#ffffff; font-size:14px;">${this.escapeHtml(g.title)}</strong>
          <span id="goalLabel_${g.id}" style="color:var(--text-secondary); font-size:13px; font-weight:600;">${g.progress}%</span>
        </div>
        <div class="goal-slider-row">
          <input 
            type="range" 
            class="goal-slider" 
            min="0" 
            max="100" 
            value="${g.progress}" 
            oninput="UI.onGoalSliderChange('${g.id}', this.value)"
          />
        </div>
      </div>
    `).join('');

    modal.classList.add('show');
  },

  onGoalSliderChange(id, value) {
    const label = document.getElementById(`goalLabel_${id}`);
    if (label) label.textContent = `${value}%`;
    PrimeStore.updateGoal(id, value);
    this.renderGoals();
  },

  // Inbox Action Sheet
  openInboxActionSheet(id) {
    const item = PrimeStore.data.inbox.find(i => i.id === id);
    if (!item) return;

    this.selectedInboxItem = item;
    const sheet = document.getElementById('inboxActionSheet');
    const preview = document.getElementById('actionSheetItemPreview');

    preview.textContent = `“${item.text}”`;
    sheet.classList.add('show');
  },

  closeAllModals() {
    document.querySelectorAll('.prime-modal-backdrop').forEach(modal => {
      modal.classList.remove('show');
    });
  },

  // ------------------------------------------------------------------------
  // TOAST FEEDBACK NOTIFICATIONS
  // ------------------------------------------------------------------------
  showToast(msg) {
    const toast = document.getElementById('primeToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // ------------------------------------------------------------------------
  // EVENT BINDINGS
  // ------------------------------------------------------------------------
  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Desktop view toggle (between Mobile Frame and Wide Mode)
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    if (viewToggleBtn) {
      viewToggleBtn.addEventListener('click', () => {
        const viewport = document.getElementById('appViewport');
        viewport.classList.toggle('wide-mode');
        const isWide = viewport.classList.contains('wide-mode');
        viewToggleBtn.querySelector('.toggle-text').textContent = isWide ? 'Mobile' : 'Fit';
      });
    }

    // Motivational Quote Click to Shuffle
    const motivationalCard = document.getElementById('motivationalCard');
    const quoteText = document.getElementById('quoteText');
    const refreshBtn = document.getElementById('motivationalRefreshBtn');

    const cycleQuote = () => {
      PrimeStore.data.quoteIndex = (PrimeStore.data.quoteIndex + 1) % DEFAULT_MOTIVATIONAL_QUOTES.length;
      PrimeStore.save();
      quoteText.innerHTML = DEFAULT_MOTIVATIONAL_QUOTES[PrimeStore.data.quoteIndex].replace('\n', '<br>');
      this.showToast("Nuovo focus caricato ✨");
    };

    if (motivationalCard) motivationalCard.addEventListener('click', cycleQuote);
    if (refreshBtn) refreshBtn.addEventListener('click', cycleQuote);

    // Mini Add Task Button (Home)
    const openAddTaskBtn = document.getElementById('openAddTaskModalBtn');
    if (openAddTaskBtn) {
      openAddTaskBtn.addEventListener('click', () => this.openAddTaskModal());
    }

    // Task Form Submit
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('taskIdInput').value;
        const title = document.getElementById('taskTitleInput').value.trim();
        const category = document.querySelector('input[name="taskCategory"]:checked')?.value || 'Studio';

        if (!title) return;

        if (id) {
          PrimeStore.updateTask(id, { title, category });
          this.showToast("Task aggiornata");
        } else {
          PrimeStore.addTask(title, category);
          this.showToast("Task aggiunta alla Home!");
        }

        this.closeAllModals();
        this.renderTasks();
      });
    }

    // Delete Task Button
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    if (deleteTaskBtn) {
      deleteTaskBtn.addEventListener('click', () => {
        const id = document.getElementById('taskIdInput').value;
        if (id) {
          PrimeStore.deleteTask(id);
          this.closeAllModals();
          this.renderTasks();
          this.showToast("Task rimossa");
        }
      });
    }

    // Planner Today Button
    const plannerTodayBtn = document.getElementById('plannerTodayBtn');
    if (plannerTodayBtn) {
      plannerTodayBtn.addEventListener('click', () => {
        const todayDay = 1; // Default Martedì 14 as per reference
        PrimeStore.data.activePlannerDay = todayDay;
        PrimeStore.save();
        this.renderPlanner();
        this.showToast("Tornato a Oggi");
      });
    }

    // Global FAB Button (+)
    const fabBtn = document.getElementById('globalFabBtn');
    if (fabBtn) {
      fabBtn.addEventListener('click', () => {
        if (this.activeTab === 'Planner') {
          this.openAddPlannerModal();
        } else {
          this.openAddTaskModal();
        }
      });
    }

    // Planner Form Submit
    const plannerForm = document.getElementById('plannerForm');
    if (plannerForm) {
      plannerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('plannerBlockIdInput').value;
        const title = document.getElementById('plannerTitleInput').value.trim();
        const subtitle = document.getElementById('plannerSubtitleInput').value.trim();
        const startTime = document.getElementById('plannerStartTimeInput').value;
        const endTime = document.getElementById('plannerEndTimeInput').value;
        const dayIndex = parseInt(document.getElementById('plannerDaySelect').value, 10);
        const category = document.querySelector('input[name="plannerCategory"]:checked')?.value || 'Studio';

        if (!title) return;

        if (id) {
          PrimeStore.updatePlannerBlock(id, { title, subtitle, startTime, endTime, dayIndex, category });
          this.showToast("Blocco aggiornato");
        } else {
          PrimeStore.addPlannerBlock({ title, subtitle, startTime, endTime, dayIndex, category });
          this.showToast("Blocco aggiunto al Planner!");
        }

        this.closeAllModals();
        this.renderPlanner();
      });
    }

    // Delete Planner Block Button
    const deletePlannerBtn = document.getElementById('deletePlannerBtn');
    if (deletePlannerBtn) {
      deletePlannerBtn.addEventListener('click', () => {
        const id = document.getElementById('plannerBlockIdInput').value;
        if (id) {
          PrimeStore.deletePlannerBlock(id);
          this.closeAllModals();
          this.renderPlanner();
          this.showToast("Blocco eliminato");
        }
      });
    }

    // Goals Modal Buttons
    const openGoalsBtn = document.getElementById('openGoalsModalBtn');
    if (openGoalsBtn) {
      openGoalsBtn.addEventListener('click', () => this.openGoalsModal());
    }

    // Inbox Quick Capture Form
    const inboxForm = document.getElementById('inboxQuickForm');
    const inboxInput = document.getElementById('inboxQuickInput');
    if (inboxForm && inboxInput) {
      inboxForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = inboxInput.value.trim();
        if (!text) return;

        // Auto-tag detect if starts with idea, task, etc., else no tag required
        PrimeStore.addInboxItem(text);
        inboxInput.value = '';
        this.renderInbox();
        this.showToast("Appunto scaricato nella Inbox ✉️");
      });
    }

    // Inbox Filters Pills
    const filterPillsContainer = document.getElementById('inboxFilterPills');
    if (filterPillsContainer) {
      filterPillsContainer.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          filterPillsContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.activeInboxFilter = pill.dataset.filter;
          this.renderInbox();
        });
      });
    }

    // Inbox Action Sheet: CONVERTI IN TASK
    const actionConvertToTask = document.getElementById('actionConvertToTask');
    if (actionConvertToTask) {
      actionConvertToTask.addEventListener('click', () => {
        if (!this.selectedInboxItem) return;
        const item = this.selectedInboxItem;

        // Add to Home tasks
        PrimeStore.addTask(item.text, 'Studio');
        // Mark inbox item as tagged or processed
        PrimeStore.updateInboxItem(item.id, { tag: 'Task', processed: true });

        this.closeAllModals();
        this.renderAll();
        this.showToast("⚡ Convertito in Task di oggi!");
        
        // Seamlessly switch to Home view so Vince sees it immediately
        setTimeout(() => this.switchTab('Home'), 400);
      });
    }

    // Inbox Action Sheet: AGGIUNGI AL PLANNER
    const actionAddToPlanner = document.getElementById('actionAddToPlanner');
    if (actionAddToPlanner) {
      actionAddToPlanner.addEventListener('click', () => {
        if (!this.selectedInboxItem) return;
        const text = this.selectedInboxItem.text;
        this.closeAllModals();
        this.switchTab('Planner');
        setTimeout(() => {
          this.openAddPlannerModal(text);
        }, 200);
      });
    }

    // Inbox Action Sheet: CLASSIFICA COME (TAG)
    const tagQuickSelectGroup = document.getElementById('tagQuickSelectGroup');
    if (tagQuickSelectGroup) {
      tagQuickSelectGroup.querySelectorAll('.tag-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this.selectedInboxItem) return;
          const newTag = btn.dataset.tag;
          PrimeStore.updateInboxItem(this.selectedInboxItem.id, { tag: newTag });
          this.closeAllModals();
          this.renderInbox();
          this.showToast(`Classificato come ${newTag}`);
        });
      });
    }

    // Inbox Action Sheet: MODIFICA TESTO
    const actionEditItem = document.getElementById('actionEditItem');
    if (actionEditItem) {
      actionEditItem.addEventListener('click', () => {
        if (!this.selectedInboxItem) return;
        const currentText = this.selectedInboxItem.text;
        const newText = prompt("Modifica testo dell'appunto:", currentText);
        if (newText && newText.trim()) {
          PrimeStore.updateInboxItem(this.selectedInboxItem.id, { text: newText.trim() });
          this.closeAllModals();
          this.renderInbox();
          this.showToast("Appunto modificato");
        }
      });
    }

    // Inbox Action Sheet: ELIMINA
    const actionDeleteItem = document.getElementById('actionDeleteItem');
    if (actionDeleteItem) {
      actionDeleteItem.addEventListener('click', () => {
        if (!this.selectedInboxItem) return;
        PrimeStore.deleteInboxItem(this.selectedInboxItem.id);
        this.closeAllModals();
        this.renderInbox();
        this.showToast("Eliminato dall'Inbox");
      });
    }

    // Modal Close buttons & Backdrop clicks
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.querySelectorAll('.prime-modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAllModals();
        }
      });
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
      // If not focusing an input: 1, 2, 3 switch tabs
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      if (!isInput) {
        if (e.key === '1') this.switchTab('Home');
        if (e.key === '2') this.switchTab('Planner');
        if (e.key === '3') this.switchTab('Inbox');
      }
    });
  }
};


// ==========================================================================
// 4. APPLICATION INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  PrimeStore.init();
  UI.init();
  console.log("🚀 The Prime Dashboard initialized successfully.");
});
