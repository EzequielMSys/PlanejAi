const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {};
vm.runInNewContext(fs.readFileSync('frontend/src/utils/mobileViewport.js','utf8').replace('export function','function')+';this.observe=observeMobileViewport',context);
test('mobile keyboard reacts to viewport shrink, restores on blur and removes listeners', () => {
  const viewport = new EventTarget(), document = new EventTarget();
  const props = new Map(), attributes = new Set();
  document.documentElement = { style: { setProperty:(k,v)=>props.set(k,v),removeProperty:k=>props.delete(k) }, toggleAttribute:(k,on)=>on?attributes.add(k):attributes.delete(k),removeAttribute:k=>attributes.delete(k) };
  let queued;
  viewport.height=800;
  const win={visualViewport:viewport,document,innerHeight:800,innerWidth:390,requestAnimationFrame:callback=>{queued=callback;return 1},cancelAnimationFrame:()=>{queued=null}};
  const stop=context.observe(win);
  assert.equal(props.get('--visible-viewport-height'),'800px');
  document.activeElement={matches:()=>true};viewport.height=350;viewport.dispatchEvent(new Event('resize'));queued();
  assert.ok(attributes.has('data-mobile-keyboard'));
  document.activeElement={matches:()=>false};document.dispatchEvent(new Event('focusout'));queued();
  assert.ok(!attributes.has('data-mobile-keyboard'));
  document.activeElement={matches:()=>true};viewport.scale=2;viewport.dispatchEvent(new Event('resize'));queued();
  assert.ok(!attributes.has('data-mobile-keyboard'), 'pinch zoom must not be mistaken for the keyboard');
  stop();assert.equal(props.size,0);
  viewport.dispatchEvent(new Event('resize'));assert.equal(queued,null);
});
test('browsers without visualViewport keep their native layout',()=>{
  assert.doesNotThrow(()=>context.observe({})());
});
