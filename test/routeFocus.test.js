const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const req=createRequire(path.resolve(__dirname,'../frontend/package.json')),{JSDOM}=req('jsdom');
const source=fs.readFileSync(path.resolve(__dirname,'../frontend/src/utils/routeFocus.js'),'utf8');const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function page(html){const dom=new JSDOM(html,{pretendToBeVisual:true});global.window=dom.window;global.document=dom.window.document;return dom}
test('route focus waits for a visible lazy heading and skips a hidden old page',async()=>{
 const dom=page('<main><div style="display:none"><h1>Anterior</h1></div></main>'),{focusRouteContent}=await modulePromise;const stop=focusRouteContent();
 try{const title=document.createElement('h1');title.textContent='Próxima página';document.querySelector('main').appendChild(title);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(document.activeElement,title);assert.equal(title.getAttribute('tabindex'),'-1')}finally{stop();dom.window.close()}
});
test('route focus does not interrupt someone typing into the new page',async()=>{
 const dom=page('<main><h1>Entrar</h1><input aria-label="Email"></main>'),{focusRouteContent}=await modulePromise;const input=document.querySelector('input');input.focus();const stop=focusRouteContent();
 try{assert.equal(document.activeElement,input)}finally{stop();dom.window.close()}
});
test('cancelled route focus does not move focus after another navigation',async()=>{
 const dom=page('<main></main>'),{focusRouteContent}=await modulePromise;const stop=focusRouteContent();stop();const title=document.createElement('h1');document.querySelector('main').appendChild(title);await new Promise(resolve=>setTimeout(resolve,0));assert.notEqual(document.activeElement,title);dom.window.close();
});
