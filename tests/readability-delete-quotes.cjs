const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const C=require('../daily-core.js');
const fixture=()=>C.migrate({tasks:[{id:'same',title:'Da eliminare',category:'Studio',completed:true},{id:'keep',title:'Conservare',category:'Corpo',completed:false}],inbox:[{id:'same',text:'Inbox indipendente'}],goals:[{id:'same',progress:19}],plannerBlocks:[],history:{'2026-10-01':{t:5,c:3}},unknown:{retained:true},areaEntries:[{id:'same',kind:'note',text:'Nota indipendente',area:'Progetti',date:'2026-10-07'},{id:'idea',kind:'idea',text:'Idea',area:'Studio',date:'2026-10-08'}]},'2026-10-09');
const data=fixture();C.assign(data,'2026-10-08',data.tasks[0],true);C.toggle(data,'2026-10-08','same','2026-10-09');C.rate(data,'2026-10-08','green','2026-10-09');C.day(data,'2026-10-08').note='Riflessione da conservare';
const unrelated=C.clone(data),keepByDate=Object.fromEntries(Object.entries(data.dailyRecords).map(([date,r])=>[date,r.tasks.filter(t=>t.id!=='same')]));
C.deleteEntry(data,{kind:'task',id:'same'});
assert.equal(data.tasks.some(t=>t.id==='same'),false);
for(const [date,r] of Object.entries(data.dailyRecords)){
  assert.deepEqual(r.tasks,keepByDate[date]);assert.equal(r.priorities.includes('same'),false);
  assert.equal(r.rating,unrelated.dailyRecords[date].rating);assert.equal(r.note,unrelated.dailyRecords[date].note);
}
for(const key of ['inbox','goals','history','areaEntries','unknown'])assert.deepEqual(data[key],unrelated[key]);
assert.equal(C.journal(data,'Studio').some(i=>i.task?.id==='same'),false);
const afterTask=C.clone(data);assert.throws(()=>C.deleteEntry(data,{kind:'task',id:'missing'}),/non trovata/);assert.deepEqual(data,afterTask);
assert.throws(()=>C.deleteEntry(data,{kind:'idea',id:'same'}),/non trovata/);assert.deepEqual(data,afterTask);
C.deleteEntry(data,{kind:'note',id:'same'});assert.equal(data.areaEntries.some(e=>e.id==='same'),false);
C.deleteEntry(data,{kind:'idea',id:'idea'});assert.equal(data.areaEntries.length,0);
assert.deepEqual(C.migrate(C.clone(data),'2026-10-10'),data);
// A task existing only in an old daily snapshot must also be removable.
const historical=fixture();historical.tasks=[];C.deleteEntry(historical,{kind:'task',id:'same'});assert.equal(C.day(historical,'2026-10-09').tasks.some(t=>t.id==='same'),false);
console.log('PASS: permanent deletion of task catalog and all dated copies/priorities, notes, ideas, orphan snapshots, reload, ratings/reflections and unrelated records preserved.');

const quotes=fixture(),before=C.clone(quotes);
assert.equal(C.quoteDay(quotes,'2026-10-09'),0);
assert.equal(C.quoteDay(quotes,'2026-10-09'),0);
for(let i=1;i<=30;i++)assert.equal(C.nextQuote(quotes,'2026-10-09'),i%30);
assert.equal(C.nextQuote(quotes,'2026-10-09'),1);
assert.equal(C.quoteDay(C.clone(quotes),'2026-10-09'),1);
assert.equal(C.quoteDay(quotes,'2026-10-10'),2);
assert.equal(C.quoteDay(quotes,'2026-10-12'),4);
assert.equal(C.quoteIndex(quotes,'2026-10-09'),1);
assert.equal(C.quoteDay(quotes,'2026-10-26'),18);
assert.equal(C.quoteDay(quotes,'2026-11-09'),2);
for(const key of Object.keys(before))assert.deepEqual(quotes[key],before[key]);
assert.throws(()=>C.quoteDay(quotes,'2026-02-30'),/non valida/);
assert.throws(()=>C.quoteDay({brutalQuotes:{startDate:'bad',indices:{}}},'2026-10-09'),/non valido/);
console.log('PASS: stable daily quotes, saved manual selection, 30-to-1 wrap, advancing from manual selection, skipped days and DST, older days stable, existing fields preserved.');

// Exercise the actual confirmation/cancellation and save handlers with a fake
// document and a disposable in-memory store, never the user's browser archive.
const values=new Map([['PRIME_DASHBOARD_STORE_v1',JSON.stringify(fixture())]]),elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{open:false,hidden:true,textContent:'',close(){this.open=false;},showModal(){this.open=true;},setAttribute(){},querySelector(){return{focus(){}};}});return elements.get(id);};
const ctx={console,Date,Intl,setTimeout:()=>0,clearTimeout,setInterval:()=>0,document:{addEventListener(){},getElementById:element},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}};
vm.createContext(ctx);for(const file of ['app.js','daily-core.js','daily-app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const run=code=>vm.runInContext(code,ctx);
run('DailyApp.prepareDOM=()=>{};UI.renderAll=()=>{};UI.showToast=()=>{};PrimeStore.init();DailyApp.itemAction={task:PrimeStore.data.tasks[0]};');
assert.equal(run('DAILY_QUOTES.length'),30);assert.equal(run('DAILY_QUOTES[0]'),'Smettila di raccontarti stronzate. Sai esattamente cosa devi fare. Fallo.');
assert.equal(run('DAILY_QUOTES[29]'),'Fra un anno potrai aver costruito qualcosa di concreto oppure aver accumulato altre mille scuse. Decidi, cazzo.');
const saved=values.get('PRIME_DASHBOARD_STORE_v1');
run('DailyApp.askDelete()');assert.equal(element('deleteConfirm').open,true);assert.match(element('deleteConfirm').innerHTML,/tutte le giornate dello storico/);
run('DailyApp.cancelDelete();DailyApp.confirmDelete()');assert.equal(values.get('PRIME_DASHBOARD_STORE_v1'),saved);
run('DailyApp.askDelete();DailyApp.confirmDelete()');assert.equal(element('deleteConfirm').open,false);assert.equal(JSON.parse(values.get('PRIME_DASHBOARD_STORE_v1')).tasks.some(t=>t.id==='same'),false);
// A failed save must keep the entry and confirmation, with an explicit error.
run('DailyApp.itemAction={entry:PrimeStore.data.areaEntries[0]};DailyApp.askDelete();PrimeStore.save=()=>{throw new Error("Quota");};');
const beforeFailure=run('JSON.stringify(PrimeStore.data)');run('DailyApp.confirmDelete()');
assert.equal(run('JSON.stringify(PrimeStore.data)'),beforeFailure);assert.equal(element('deleteConfirm').open,true);assert.match(element('deleteConfirmError').textContent,/Quota/);
run('DailyApp.cancelDelete()');assert.equal(element('deleteConfirm').open,false);
console.log('PASS: actual confirmation open/cancel/confirm handlers, persistence, no confirm after cancel, save-failure rollback and error; exactly 30 active quotes.');
