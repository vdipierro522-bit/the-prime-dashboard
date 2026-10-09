/* Dated records extend the original store without removing legacy fields. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrimeDaily = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = () => iso(new Date());
  const valid = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && iso(new Date(s+'T12:00:00')) === s;
  const add = (s,n) => { const d = new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return iso(d); };
  const distance = (a,b) => (Date.UTC(...a.split('-').map((v,i)=>Number(v)-(i===1?1:0))) - Date.UTC(...b.split('-').map((v,i)=>Number(v)-(i===1?1:0))))/86400000;
  const clone = x => JSON.parse(JSON.stringify(x));
  const uid = () => 'd-'+(globalThis.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(16).slice(2));
  function day(data,date,create=false) {
    if (!valid(date)) throw new Error('Data non valida.');
    if (!data.dailyRecords[date] && create) data.dailyRecords[date] = {tasks:[],priorities:[],rating:null,note:''};
    return data.dailyRecords[date] || {tasks:[],priorities:[],rating:null,note:''};
  }
  function migrate(data,anchor=today()) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Archivio non riconosciuto.');
    for (const k of ['tasks','goals','inbox','plannerBlocks']) {
      if (data[k] == null) data[k] = [];
      if (!Array.isArray(data[k])) throw new Error('Archivio non valido: '+k);
    }
    if (!data.dailyRecords) data.dailyRecords = {};
    if (!data.areaEntries) data.areaEntries = [];
    if (typeof data.dailyRecords !== 'object' || Array.isArray(data.dailyRecords) || !Array.isArray(data.areaEntries)) throw new Error('Storico non valido.');
    if (!valid(data.sprintStartDate)) data.sprintStartDate = anchor;
    if (!data.dailySchema) {
      // Undated legacy tasks belong only to the migration day. Earlier aggregate
      // history cannot establish titles or individual completion dates.
      const record = day(data,anchor,true);
      const known = new Set(record.tasks.map(t=>t.id));
      for (const task of data.tasks) {
        if (!known.has(task.id)) record.tasks.push({...clone(task),completed:!!task.completed});
      }
      record.priorities = record.tasks.slice(0,3).map(t=>t.id);
      data.dailySchema = 1;
      data.dailyMigratedOn = anchor;
    }
    return data;
  }
  function assign(data,date,task,priority=false) {
    const r = day(data,date,true);
    if (priority && !r.priorities.includes(task.id) && r.priorities.length >= 3) throw new Error('Hai già tre priorità. Rimuovine una prima di aggiungerne un’altra.');
    if (!r.tasks.some(t=>t.id===task.id)) r.tasks.push({...clone(task),completed:false});
    if (priority && !r.priorities.includes(task.id)) r.priorities.push(task.id);
    return r;
  }
  function toggle(data,date,id,anchor=today()) {
    if (date>anchor) throw new Error('Puoi completare le attività quando arriva il giorno.');
    const t = day(data,date,true).tasks.find(t=>t.id===id);
    if (!t) throw new Error('Attività non trovata.');
    t.completed = !t.completed;
    t.completedAt = t.completed ? new Date().toISOString() : null;
    return t;
  }
  function rate(data,date,rating,anchor=today()) {
    if (date>anchor) throw new Error('Puoi valutare il giorno quando arriva.');
    if (![null,'green','red'].includes(rating)) throw new Error('Valutazione non valida.');
    day(data,date,true).rating = rating;
  }
  function block(data,date) {
    const index = Math.max(0,Math.floor(distance(date,data.sprintStartDate)/90));
    const start = add(data.sprintStartDate,index*90);
    return {index,start,end:add(start,89),number:distance(date,start)+1};
  }
  function status(data,date,anchor=today()) {
    return date>anchor ? 'gray' : day(data,date).rating || 'gray';
  }
  return {iso,today,valid,add,distance,clone,uid,day,migrate,assign,toggle,rate,block,status};
});
