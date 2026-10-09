const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const dir = path.join(__dirname,'..');
const C = require(path.join(dir,'daily-core.js'));
const original = {
  tasks:[{id:'a',title:'Studio',category:'Studio',completed:true},{id:'b',title:'Corpo',category:'Corpo',completed:false},{id:'c',title:'Progetto',category:'Progetti',completed:false},{id:'d',title:'Altro',category:'Personale',completed:true}],
  goals:[{id:'g',progress:23}],inbox:[{id:'i',text:'Una idea'}],plannerBlocks:[{id:'p',date:'2026-10-07',title:'Evento'}],
  history:{'2026-10-07':{t:4,c:2}},sprintStartDate:'2026-10-07',quoteIndex:4,calendarView:'month',unknownSetting:{retained:true}
};
const data=C.migrate(C.clone(original),'2026-10-09');
for(const key of Object.keys(original)) assert.deepEqual(data[key],original[key]);
assert.equal(C.day(data,'2026-10-09').tasks.length,4);
assert.equal(C.day(data,'2026-10-09').tasks[0].completed,true);
assert.equal(C.day(data,'2026-10-07').tasks.length,0);
assert.equal(C.day(data,'2026-10-09').priorities.length,3);
assert.throws(()=>C.assign(data,'2026-10-09',original.tasks[3],true),/tre priorità/);
C.assign(data,'2026-10-08',original.tasks[0],true);
assert.equal(C.day(data,'2026-10-08').tasks[0].completed,false);
C.toggle(data,'2026-10-08','a','2026-10-09');
C.rate(data,'2026-10-08','green','2026-10-09');
assert.equal(C.status(data,'2026-10-08','2026-10-09'),'green');
C.rate(data,'2026-10-09','red','2026-10-09');
assert.equal(C.status(data,'2026-10-09','2026-10-09'),'red');
assert.equal(C.status(data,'2026-10-10','2026-10-09'),'gray');
C.assign(data,'2026-10-10',original.tasks[0]);
assert.throws(()=>C.toggle(data,'2026-10-10','a','2026-10-09'),/quando arriva/);
assert.throws(()=>C.rate(data,'2026-10-10','green','2026-10-09'),/quando arriva/);
const loaded=C.migrate(C.clone(data),'2026-10-10');
assert.deepEqual(loaded,data);
assert.equal(C.day(loaded,'2026-10-08').tasks[0].completed,true);
assert.equal(C.day(loaded,'2026-10-10').tasks[0].completed,false);
assert.equal(C.block(data,'2026-10-07').number,1);
assert.equal(C.block(data,'2027-01-04').number,90);
assert.equal(C.block(data,'2027-01-05').number,1);
assert.equal(C.block(data,'2027-01-05').index,1);
assert.equal(C.distance('2026-10-26','2026-10-24'),2);
assert.equal(C.add('2026-12-31',1),'2027-01-01');
assert.equal(C.valid('2026-02-30'),false);
assert.throws(()=>C.migrate({tasks:{}}),/non valido/);

function storeContext(raw,fail=false) {
  const values = new Map(raw===null?[]:[['PRIME_DASHBOARD_STORE_v1',raw]]);
  const context={console,Date,Intl,setTimeout,clearTimeout,setInterval:()=>0,
    document:{addEventListener:()=>{}},
    localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fail)throw new Error('Quota');values.set(k,v);}},
  };
  vm.createContext(context);
  for(const f of ['calendar-core.js','app.js','calendar.js','daily-core.js','daily-app.js']) vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),context,{filename:f});
  vm.runInContext('DailyApp.prepareDOM=()=>{};',context);
  return {context,values,run:s=>vm.runInContext(s,context)};
}
const raw=JSON.stringify(original),ctx=storeContext(raw);
ctx.run('PrimeStore.init()');
assert.equal(ctx.values.get('PRIME_DASHBOARD_STORE_v1_before_daily_v1'),raw);
assert.equal(JSON.parse(ctx.values.get('PRIME_DASHBOARD_STORE_v1')).unknownSetting.retained,true);
ctx.run('PrimeStore.init()');
assert.equal(ctx.values.get('PRIME_DASHBOARD_STORE_v1_before_daily_v1'),raw);
ctx.values.set('PRIME_DASHBOARD_STORE_v1','different tab');
assert.throws(()=>ctx.run('PrimeStore.save()'),/altra scheda/);
assert.equal(ctx.values.get('PRIME_DASHBOARD_STORE_v1'),'different tab');
const broken=storeContext('{bad json');assert.throws(()=>broken.run('PrimeStore.init()'));
assert.equal(broken.values.get('PRIME_DASHBOARD_STORE_v1'),'{bad json');
const quota=storeContext(raw,true);assert.throws(()=>quota.run('PrimeStore.init()'),/Quota/);
assert.equal(quota.values.get('PRIME_DASHBOARD_STORE_v1'),raw);
const clean=storeContext(null);clean.run('PrimeStore.init()');
assert.equal(clean.run('PrimeStore.data.tasks.length'),0);
console.log('PASS: migration, original fields, backup, dated checkmarks, ratings, future guards, 90-day blocks, DST/year dates, reload, storage conflicts, malformed JSON, quota and empty first use.');
