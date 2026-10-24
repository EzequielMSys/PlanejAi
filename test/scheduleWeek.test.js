const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {createRequire, Module} = require('node:module');
const requireFrontend = createRequire(path.resolve('frontend/package.json'));
let helpers;
test.before(async () => {
  const result = await requireFrontend('esbuild').build({entryPoints:['frontend/src/utils/scheduleWeek.js'],bundle:true,write:false,platform:'node',format:'cjs'});
  const filename = path.resolve('frontend/week-test.cjs');
  const compiled = new Module(filename);
  compiled._compile(result.outputFiles[0].text,filename);
  helpers = compiled.exports;
});
test('calendar arithmetic crosses month, leap year and year boundaries without timezone drift', () => {
  assert.equal(helpers.shiftDate('2024-02-28',1),'2024-02-29');
  assert.equal(helpers.shiftDate('2026-12-31',1),'2027-01-01');
  assert.equal(helpers.mondayOf('2027-01-03'),'2026-12-28');
  assert.equal(helpers.mondayOf('2027-01-04'),'2027-01-04');
});
test('week selection clamps to plan bounds and handles an empty plan', () => {
  const days = [{data_estudo:'2026-11-03'},{data_estudo:'2026-10-24T00:00:00Z'}];
  assert.equal(helpers.scheduleWeeks(days,'2026-10-01').initial,'2026-10-19');
  assert.equal(helpers.scheduleWeeks(days,'2026-12-01').initial,'2026-11-02');
  assert.equal(helpers.scheduleWeeks(days,'2026-10-28').initial,'2026-10-26');
  assert.equal(helpers.scheduleWeeks([],'2026-10-24').initial,'2026-10-19');
});
test('weekly totals include every same-day entry, preserve dates and leave source data untouched', () => {
  const days = [{id:1,data_estudo:'2026-10-24T00:00:00Z',tempo_previsto:'25'}, {id:2,data_estudo:'2026-10-24',tempo_previsto:20}, {id:3,data_estudo:'2026-10-26',tempo_previsto:60}];
  const original = JSON.stringify(days);
  const week = helpers.weekDays(days,'2026-10-19');
  assert.equal(week.length,7);
  assert.equal(week[5].date,'2026-10-24');
  assert.equal(week[5].minutes,45);
  assert.deepEqual(week[5].entries.map(day => day.id),[1,2]);
  assert.equal(week[0].entries.length,0);
  assert.equal(week.reduce((total,day) => total+day.minutes,0),45);
  assert.equal(JSON.stringify(days),original);
});
test('missing or invalid dates cannot create a phantom session on the current day', () => {
  const days=[{tempo_previsto:50},{data_estudo:'2026-02-31',tempo_previsto:30},{data_estudo:'2026-99-99',tempo_previsto:20}];
  assert.equal(helpers.scheduleWeeks(days,'2026-10-24').dated.length,0);
  assert.equal(helpers.weekDays(days,'2026-10-19').reduce((total,day)=>total+day.entries.length,0),0);
});
