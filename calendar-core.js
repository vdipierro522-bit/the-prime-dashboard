/* Date and event calculations shared by the Planner and its checks. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrimeCalendar = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => new Date(`${s}T12:00:00`);
  const today = () => iso(new Date());
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(parse(s)) && iso(parse(s)) === s;
  const add = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const weekday = s => (parse(s).getDay() + 6) % 7;
  const monday = s => add(s, -weekday(s));
  const minutes = s => { const m = /^(\d{2}):(\d{2})$/.exec(s || ''); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
  const time = n => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
  function shiftMonth(s, n) {
    const d = parse(s), day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, end)); return iso(d);
  }
  function monthDays(s) {
    const d = parse(s); d.setDate(1);
    const start = monday(iso(d));
    return Array.from({ length: 42 }, (_, i) => add(start, i));
  }
  function migrate(data, anchor = today()) {
    const start = monday(anchor);
    data.plannerBlocks = data.plannerBlocks || [];
    for (const b of data.plannerBlocks) {
      if (!validDate(b.date)) b.date = add(start, Math.max(0, Math.min(6, Number(b.dayIndex) || 0)));
      b.dayIndex = weekday(b.date);
    }
    if (!validDate(data.calendarDate)) data.calendarDate = anchor;
    if (!['day', 'three', 'week', 'month', 'agenda'].includes(data.calendarView)) data.calendarView = 'week';
    data.calendarSchema = 1;
    return data;
  }
  function occurs(b, date) {
    if (b.date === date) return true;
    return b.repeat === 'weekly' && date >= b.date && weekday(date) === weekday(b.date) && !(b.exceptions || []).includes(date);
  }
  function events(blocks, date, hidden = []) {
    return blocks.filter(b => !hidden.includes(b.category || 'Neutral') && occurs(b, date))
      .sort((a, b) => Number(!!b.allDay) - Number(!!a.allDay) || (a.startTime || '').localeCompare(b.startTime || ''));
  }
  function bounds(b) {
    const start = minutes(b.startTime) ?? 540;
    const end = minutes(b.endTime);
    return { start, end: end !== null && end > start ? end : Math.min(1440, start + 60) };
  }
  // Partition overlapping intervals into columns; adjacent events share a column.
  function layout(blocks) {
    const sorted = blocks.map(b => ({ block: b, ...bounds(b) })).sort((a, b) => a.start - b.start || b.end - a.end);
    let group = [], groupEnd = -1;
    const out = [];
    function flush() {
      const ends = [];
      for (const item of group) {
        let column = ends.findIndex(end => end <= item.start);
        if (column < 0) column = ends.length;
        ends[column] = item.end;
        item.column = column;
      }
      for (const item of group) out.push({ ...item, columns: ends.length });
      group = [];
    }
    for (const item of sorted) {
      if (group.length && item.start >= groupEnd) { flush(); groupEnd = -1; }
      group.push(item); groupEnd = Math.max(groupEnd, item.end);
    }
    flush(); return out;
  }
  return { iso, parse, today, validDate, add, weekday, monday, minutes, time, shiftMonth, monthDays, migrate, occurs, events, bounds, layout };
});
