/* Google Calendar-style Planner. Other Dashboard screens keep their own UI. */
'use strict';
const Calendar = {
  C: PrimeCalendar,
  hidden: new Set(),
  menuOpen: false,
  pickerOpen: false,
  labels: { day: 'Giorno', three: '3 giorni', week: 'Settimana', month: 'Mese', agenda: 'Programma' },
  categories: ['Studio', 'Corpo', 'Progetti', 'Personale', 'Neutral'],
  colors: { Studio: '#81c995', Corpo: '#a8c7fa', Progetti: '#d7aefb', Personale: '#fdd663', Neutral: '#c4c7c5' },
  init() {
    const previous = localStorage.getItem(STORAGE_KEY);
    if (!PrimeStore.data.calendarSchema && previous) {
      try { localStorage.setItem(STORAGE_KEY + '_before_calendar', previous); }
      catch (e) { UI.showToast('Impossibile conservare una copia del Planner precedente.'); }
    }
    this.C.migrate(PrimeStore.data);
    PrimeStore.save();
    this.selected = PrimeStore.data.calendarDate;
    this.view = PrimeStore.data.calendarView;
    setInterval(() => this.refreshNow(), 60000);
  },
  el(id) { return document.getElementById(id); },
  format(date, options) { return new Intl.DateTimeFormat('it-IT', options).format(this.C.parse(date)); },
  icon(name) {
    const paths = { menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>', calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>' };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
  },
  setActive(active) {
    this.el('appViewport').classList.toggle('calendar-active', active);
    this.el('mainContent').classList.toggle('calendar-main', active);
    this.el('globalFabBtn').setAttribute('aria-label', active ? 'Crea evento' : 'Aggiungi elemento');
    if (active) { this.render(); this.scrollToMorning(); }
    else { this.menuOpen = false; this.pickerOpen = false; }
  },
  dates() {
    if (this.view === 'week') return Array.from({ length: 7 }, (_, i) => this.C.add(this.C.monday(this.selected), i));
    if (this.view === 'three') return Array.from({ length: 3 }, (_, i) => this.C.add(this.selected, i));
    return [this.selected];
  },
  eventList(date) { return this.C.events(PrimeStore.data.plannerBlocks, date, [...this.hidden]); },
  persist() {
    PrimeStore.data.calendarDate = this.selected;
    PrimeStore.data.calendarView = this.view;
    PrimeStore.data.activePlannerDay = this.C.weekday(this.selected);
    PrimeStore.save();
  },
  chooseDate(date, changeView = false) {
    if (!this.C.validDate(date)) return;
    this.selected = date;
    if (changeView) this.view = 'day';
    this.pickerOpen = false;
    this.persist(); this.render(); this.scrollToMorning();
  },
  selectDayIndex(index) {
    if (index === 7) this.changeView('week');
    else this.chooseDate(this.C.add(this.C.monday(this.C.today()), index), true);
  },
  changeView(view) {
    if (!this.labels[view]) return;
    this.view = view; this.menuOpen = false;
    this.persist(); this.render(); this.scrollToMorning();
  },
  navigate(direction) {
    this.selected = this.view === 'month' ? this.C.shiftMonth(this.selected, direction) : this.C.add(this.selected, direction * (this.view === 'week' || this.view === 'agenda' ? 7 : this.view === 'three' ? 3 : 1));
    this.persist(); this.render(); this.scrollToMorning();
  },
  render() {
    const root = this.el('calendarRoot');
    if (!root) return;
    const oldScroll = this.el('calendarScroll')?.scrollTop;
    const month = this.format(this.selected, { month: 'long' });
    const year = this.C.parse(this.selected).getFullYear();
    const dates = this.dates();
    const range = this.view === 'month' ? String(year) : this.view === 'agenda' ? 'I prossimi 30 giorni' : `${this.format(dates[0], { day: 'numeric', month: 'short' })}${dates.length > 1 ? ' – ' + this.format(dates.at(-1), { day: 'numeric', month: 'short' }) : ''} · ${year}`;
    root.innerHTML = `<header class="cal-toolbar">
      <button class="cal-icon-btn" data-cal="menu" aria-label="Menu calendario" aria-expanded="${this.menuOpen}">${this.icon('menu')}</button>
      <button class="cal-month-title" data-cal="picker" aria-label="Scegli data" aria-expanded="${this.pickerOpen}">${month}<span class="cal-header-year">${year}</span>${this.icon('down')}</button>
      <button class="cal-today" data-cal="today" aria-label="Vai a oggi">${this.icon('calendar')}<span>${this.C.parse(this.C.today()).getDate()}</span></button>
    </header>
    <div class="cal-navigation"><div class="cal-navigation-range"><button class="cal-icon-btn" data-cal="prev" aria-label="Periodo precedente">${this.icon('left')}</button><span>${range}</span><button class="cal-icon-btn" data-cal="next" aria-label="Periodo successivo">${this.icon('right')}</button></div><select id="calendarViewSelect" aria-label="Vista calendario">${Object.entries(this.labels).map(([v, l]) => `<option value="${v}" ${v === this.view ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    ${this.pickerOpen ? this.renderPicker() : ''}
    ${['day', 'three', 'week'].includes(this.view) ? this.renderTimeGrid(dates) : this.view === 'month' ? this.renderMonth() : this.renderAgenda()}
    ${this.menuOpen ? this.renderMenu() : ''}`;
    const scroll = this.el('calendarScroll');
    if (scroll && oldScroll !== undefined) scroll.scrollTop = oldScroll;
  },
  renderMenu() {
    return `<div class="cal-drawer-shade" data-cal="close-menu"></div><aside class="cal-drawer" aria-label="Menu calendario"><div class="cal-drawer-title">Planner<button class="cal-icon-btn" data-cal="close-menu" aria-label="Chiudi menu">${this.icon('close')}</button></div><div class="cal-menu-views">${Object.entries(this.labels).map(([v, l]) => `<button data-cal="view" data-view="${v}" class="${v === this.view ? 'selected' : ''}">${l}</button>`).join('')}</div><div class="cal-drawer-label">I miei calendari</div>${this.categories.map(cat => `<label class="cal-filter"><input type="checkbox" data-category="${cat}" ${this.hidden.has(cat) ? '' : 'checked'} style="accent-color:${this.colors[cat]}">${cat === 'Neutral' ? 'Altro' : cat}</label>`).join('')}</aside>`;
  },
  renderPicker() {
    return `<div class="cal-date-picker"><label for="calendarDateInput">Vai alla data</label><input type="date" id="calendarDateInput" value="${this.selected}"><div class="cal-mini-week">${DAYS_NAMES.map(d => `<span>${d[0]}</span>`).join('')}</div><div class="cal-mini-days">${this.C.monthDays(this.selected).map(date => `<button data-cal="date" data-date="${date}" class="${date === this.C.today() ? 'today' : ''} ${date === this.selected ? 'selected' : ''} ${date.slice(0, 7) !== this.selected.slice(0, 7) ? 'outside' : ''}" aria-label="${this.format(date, { dateStyle: 'full' })}">${this.C.parse(date).getDate()}</button>`).join('')}</div></div>`;
  },
  eventButton(block, date, className, style = '') {
    const color = this.colors[block.category] || this.colors.Neutral;
    const title = UI.escapeHtml(block.title || 'Evento');
    const range = block.allDay ? 'Tutto il giorno' : `${block.startTime || '09:00'}${block.endTime ? ' – ' + block.endTime : ''}`;
    return `<button type="button" class="${className}" data-cal="edit" data-id="${UI.escapeHtml(String(block.id))}" data-date="${date}" aria-label="${title}, ${range}" style="--event-color:${color};${style}"><strong>${title}</strong><span>${range}</span>${className === 'cal-event' && block.subtitle ? `<small>${UI.escapeHtml(block.subtitle)}</small>` : ''}</button>`;
  },
  renderTimeGrid(dates) {
    const count = dates.length;
    const today = this.C.today();
    const days = dates.map(date => `<button class="cal-day-heading ${date === today ? 'today' : ''}" data-cal="day" data-date="${date}" aria-label="${this.format(date, { dateStyle: 'full' })}"><span>${DAYS_NAMES[this.C.weekday(date)]}</span><strong>${this.C.parse(date).getDate()}</strong></button>`).join('');
    const allDay = dates.map(date => `<div class="cal-all-day-column">${this.eventList(date).filter(b => b.allDay).map(b => this.eventButton(b, date, 'cal-all-day-event')).join('')}</div>`).join('');
    const columns = dates.map(date => {
      const blocks = this.C.layout(this.eventList(date).filter(b => !b.allDay));
      const slots = Array.from({ length: 48 }, (_, i) => `<button class="cal-slot" data-cal="slot" data-date="${date}" data-minute="${i * 30}" aria-label="Crea evento ${this.format(date, { weekday: 'long', day: 'numeric' })} alle ${this.C.time(i * 30)}"></button>`).join('');
      const events = blocks.map(({ block, start, end, column, columns }) => this.eventButton(block, date, 'cal-event', `top:${start / 60 * 64}px;height:${Math.max(22, (end - start) / 60 * 64 - 2)}px;left:calc(${column / columns * 100}% + 2px);width:calc(${100 / columns}% - 4px)`)).join('');
      const now = new Date();
      const line = date === today ? `<div class="cal-now-line" style="top:${(now.getHours() * 60 + now.getMinutes()) / 60 * 64}px"><i></i></div>` : '';
      return `<div class="cal-day-column ${date === today ? 'is-today' : ''}" data-date="${date}">${slots}${events}${line}</div>`;
    }).join('');
    return `<div class="cal-time-view ${count === 7 ? 'cal-seven' : ''}" style="--days:${count}"><div class="cal-days-header"><div class="cal-timezone">GMT${new Intl.DateTimeFormat('en', { timeZoneName: 'shortOffset' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value.replace('GMT', '') || ''}</div>${days}</div><div class="cal-all-day"><div class="cal-all-day-label">Tutto il<br>giorno</div>${allDay}</div><div class="cal-time-scroll" id="calendarScroll"><div class="cal-hours">${Array.from({ length: 24 }, (_, h) => `<div class="cal-hour"><span>${String(h).padStart(2, '0')}</span></div>`).join('')}</div><div class="cal-time-columns">${columns}</div></div></div>`;
  },
  renderMonth() {
    const currentMonth = this.selected.slice(0, 7);
    const days = this.C.monthDays(this.selected);
    return `<div class="cal-month-view" id="calendarScroll"><div class="cal-month-weekdays">${DAYS_NAMES.map(d => `<span>${d}</span>`).join('')}</div><div class="cal-month-grid">${days.map(date => {
      const list = this.eventList(date);
      return `<div class="cal-month-cell ${date.slice(0, 7) !== currentMonth ? 'outside' : ''}"><button class="cal-month-date ${date === this.C.today() ? 'today' : ''}" data-cal="day" data-date="${date}" aria-label="${this.format(date, { dateStyle: 'full' })}">${this.C.parse(date).getDate()}</button><div class="cal-month-events">${list.slice(0, 3).map(b => this.eventButton(b, date, 'cal-month-event')).join('')}${list.length > 3 ? `<button class="cal-more-events" data-cal="day" data-date="${date}">+${list.length - 3} altri</button>` : ''}</div><button class="cal-month-add" data-cal="slot" data-date="${date}" data-minute="540" aria-label="Crea evento il ${this.format(date, { day: 'numeric', month: 'long' })}">+</button></div>`;
    }).join('')}</div></div>`;
  },
  renderAgenda() {
    const dates = Array.from({ length: 30 }, (_, i) => this.C.add(this.selected, i));
    const rows = dates.filter(date => this.eventList(date).length).map(date => `<section class="cal-agenda-day"><button class="cal-agenda-date ${date === this.C.today() ? 'today' : ''}" data-cal="day" data-date="${date}"><span>${this.format(date, { weekday: 'short' })}</span><strong>${this.C.parse(date).getDate()}</strong><small>${this.format(date, { month: 'short' })}</small></button><div class="cal-agenda-events">${this.eventList(date).map(b => this.eventButton(b, date, 'cal-agenda-event')).join('')}</div></section>`).join('');
    return `<div class="cal-agenda-scroll" id="calendarScroll">${rows || '<div class="cal-agenda-empty">Nessun evento nei prossimi 30 giorni.<br>Tocca + per creare un evento.</div>'}</div>`;
  },
  refreshNow() {
    if (UI.activeTab !== 'Planner') return;
    const today = this.C.today();
    const column = this.el('calendarRoot').querySelector(`.cal-day-column[data-date="${today}"]`);
    const line = column?.querySelector('.cal-now-line');
    if (line) { const now = new Date(); line.style.top = `${(now.getHours() * 60 + now.getMinutes()) / 60 * 64}px`; }
  },
  scrollToMorning() {
    const scroll = this.el('calendarScroll');
    if (scroll) scroll.scrollTop = ['day', 'three', 'week'].includes(this.view) ? 7 * 64 : 0;
  },
  syncAllDay() {
    const allDay = this.el('plannerAllDayInput').checked;
    this.el('plannerTimeRow').hidden = allDay;
    for (const id of ['plannerStartTimeInput', 'plannerEndTimeInput']) { this.el(id).required = !allDay; this.el(id).disabled = allDay; }
  },
  openEvent(id, options = {}) {
    const b = id ? PrimeStore.data.plannerBlocks.find(b => b.id === id) : null;
    if (id && !b) return;
    const date = b?.date || options.date || this.selected;
    const start = Math.min(1410, options.minute ?? 600);
    this.el('plannerModalTitle').textContent = b ? 'Modifica evento' : 'Nuovo evento';
    this.el('plannerBlockIdInput').value = id || '';
    this.el('plannerTitleInput').value = b?.title || options.title || '';
    this.el('plannerSubtitleInput').value = b?.subtitle || '';
    this.el('plannerDaySelect').value = date;
    this.el('plannerStartTimeInput').value = b?.startTime || this.C.time(start);
    this.el('plannerEndTimeInput').value = b?.endTime || this.C.time(Math.min(1439, start + 60));
    this.el('plannerAllDayInput').checked = !!b?.allDay;
    this.el('plannerCategoryInput').value = b?.category || 'Studio';
    this.el('plannerRepeatInput').value = b?.repeat || 'none';
    this.el('plannerSeriesNote').hidden = b?.repeat !== 'weekly';
    this.el('plannerFormError').hidden = true;
    this.el('deletePlannerBtn').style.display = b ? 'block' : 'none';
    this.syncAllDay();
    this.el('plannerModal').classList.add('show');
    setTimeout(() => this.el('plannerTitleInput').focus(), 150);
  },
  saveEvent(event) {
    event.preventDefault();
    const title = this.el('plannerTitleInput').value.trim();
    const date = this.el('plannerDaySelect').value;
    const allDay = this.el('plannerAllDayInput').checked;
    const startTime = this.el('plannerStartTimeInput').value;
    const endTime = this.el('plannerEndTimeInput').value;
    if (!title || !this.C.validDate(date)) return this.formError('Inserisci un titolo e una data valida.');
    if (!allDay && (this.C.minutes(startTime) === null || this.C.minutes(endTime) === null || this.C.minutes(endTime) <= this.C.minutes(startTime))) return this.formError('L’ora di fine deve essere successiva all’ora di inizio.');
    const block = { title, date, dayIndex: this.C.weekday(date), subtitle: this.el('plannerSubtitleInput').value.trim(), startTime, endTime, allDay, repeat: this.el('plannerRepeatInput').value, category: this.el('plannerCategoryInput').value };
    const id = this.el('plannerBlockIdInput').value;
    if (id) PrimeStore.updatePlannerBlock(id, block); else PrimeStore.addPlannerBlock(block);
    this.selected = date; this.persist();
    UI.closeAllModals(); this.render(); UI.showToast(id ? 'Evento aggiornato' : 'Evento creato');
  },
  formError(text) { this.el('plannerFormError').textContent = text; this.el('plannerFormError').hidden = false; },
  bindEvents() {
    this.el('calendarRoot').addEventListener('click', e => {
      const button = e.target.closest('[data-cal]');
      if (!button) return;
      const action = button.dataset.cal;
      if (action === 'menu' || action === 'close-menu') { this.menuOpen = action === 'menu' ? !this.menuOpen : false; this.pickerOpen = false; this.render(); }
      if (action === 'picker') { this.pickerOpen = !this.pickerOpen; this.render(); }
      if (action === 'today') this.chooseDate(this.C.today());
      if (action === 'prev' || action === 'next') this.navigate(action === 'prev' ? -1 : 1);
      if (action === 'view') this.changeView(button.dataset.view);
      if (action === 'day' || action === 'date') this.chooseDate(button.dataset.date, action === 'day');
      if (action === 'slot') this.openEvent(null, { date: button.dataset.date, minute: Number(button.dataset.minute) });
      if (action === 'edit') this.openEvent(button.dataset.id);
    });
    this.el('calendarRoot').addEventListener('change', e => {
      if (e.target.id === 'calendarViewSelect') this.changeView(e.target.value);
      if (e.target.id === 'calendarDateInput') this.chooseDate(e.target.value);
      if (e.target.dataset.category) { const cat = e.target.dataset.category; if (e.target.checked) this.hidden.delete(cat); else this.hidden.add(cat); this.render(); }
    });
    this.el('plannerAllDayInput').addEventListener('change', () => this.syncAllDay());
    this.el('plannerRepeatInput').addEventListener('change', e => { this.el('plannerSeriesNote').hidden = e.target.value !== 'weekly'; });
    this.el('plannerForm').addEventListener('submit', e => this.saveEvent(e));
    this.el('deletePlannerBtn').addEventListener('click', () => {
      const id = this.el('plannerBlockIdInput').value;
      if (!id) return;
      PrimeStore.deletePlannerBlock(id); UI.closeAllModals(); this.render(); UI.showToast('Evento eliminato');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && (this.menuOpen || this.pickerOpen)) { this.menuOpen = this.pickerOpen = false; this.render(); }
    });
  }
};
