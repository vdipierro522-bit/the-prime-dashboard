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
  const searchable = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it-IT');
  function matches(item, filters={}) {
    if (filters.kind && filters.kind!=='all' && item.kind!==filters.kind) return false;
    if (filters.date && item.date!==filters.date) return false;
    if (filters.status && filters.status!=='all') {
      if (item.kind!=='task' || !!item.task.completed !== (filters.status==='done')) return false;
    }
    return searchable(item.task?.title ?? item.entry?.text).includes(searchable(filters.query).trim());
  }
  function journal(data,area,filters={}) {
    const items=[];
    for (const [date,record] of Object.entries(data.dailyRecords)) {
      if (!valid(date)) continue;
      for (const task of record.tasks) if (task.category===area) items.push({kind:'task',date,task});
    }
    for (const entry of data.areaEntries) {
      if (entry.area===area && !entry.archived && valid(entry.date)) items.push({kind:entry.kind,date:entry.date,entry});
    }
    return items.filter(item=>matches(item,filters)).sort((a,b)=>b.date.localeCompare(a.date));
  }
  function catalog(data,area,selected,filters={}) {
    const record=day(data,selected);
    return data.tasks.filter(t=>t.category===area && !t.archived).map(task=>({kind:'task',date:selected,task:{...task,completed:!!record.tasks.find(t=>t.id===task.id)?.completed},source:task})).filter(item=>matches(item,filters));
  }
  function writeEntry(data,input,editing={}) {
    const text=String(input.text||'').trim();
    if(!text) throw new Error('Scrivi il testo della voce.');
    if(!valid(input.date)) throw new Error('Data non valida.');
    if(!['Corpo','Studio','Progetti','Personale'].includes(input.area)) throw new Error('Area non valida.');
    if(!['task','idea','note'].includes(input.kind)) throw new Error('Tipo di voce non valido.');
    if(!['normal','high','low','home'].includes(input.priorityLevel)) throw new Error('Priorità non valida.');
    if(input.reminder && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminderTime||'')) throw new Error('Ora del promemoria non valida.');
    const meta={subject:String(input.subject||''),priorityLevel:input.priorityLevel,reminder:!!input.reminder,reminderTime:input.reminderTime||'09:00'};
    if(editing.taskId && input.kind!=='task' || editing.entryId && input.kind==='task') throw new Error('Conserva il tipo della voce esistente.');
    if(input.kind==='task') {
      const source=editing.taskId ? data.tasks.find(t=>t.id===editing.taskId) : null;
      const recordDate=editing.recordDate||input.date;
      if(editing.taskId && recordDate!==input.date) throw new Error('La data dell’attività esistente resta nello storico.');
      const existing=editing.taskId ? day(data,recordDate).tasks.find(t=>t.id===editing.taskId) : null;
      if(editing.taskId && !source && !existing) throw new Error('Attività non trovata.');
      const record=day(data,input.date),id=editing.taskId||uid(),priority=input.priorityLevel==='home';
      if(priority && !record.priorities.includes(id) && record.priorities.length>=3) throw new Error('Hai già tre priorità. Rimuovine una prima di aggiungerne un’altra.');
      const updates={title:text,category:input.area,...meta};
      if(editing.taskId) {
        if(source) Object.assign(source,updates);
        if(existing) Object.assign(existing,updates);
        if(priority && !existing) assign(data,input.date,{...(source||existing),id},true);
      } else {
        const task={id,...updates,completed:false};
        assign(data,input.date,task,priority);data.tasks.push(task);
      }
      const assigned=day(data,input.date,true);
      if(priority && !assigned.priorities.includes(id)) assigned.priorities.push(id);
      if(!priority) assigned.priorities=assigned.priorities.filter(x=>x!==id);
      return id;
    }
    if(input.priorityLevel==='home') throw new Error('Le priorità Home sono attività.');
    const updates={kind:input.kind,text,area:input.area,date:input.date,...meta};
    if(editing.entryId) {
      const entry=data.areaEntries.find(n=>n.id===editing.entryId);
      if(!entry) throw new Error('Voce non trovata.');
      Object.assign(entry,updates);return entry.id;
    }
    const entry={id:uid(),...updates};data.areaEntries.push(entry);return entry.id;
  }
  return {iso,today,valid,add,distance,clone,uid,day,migrate,assign,toggle,rate,block,status,journal,catalog,writeEntry};
});
