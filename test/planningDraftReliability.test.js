const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{createRequire,Module}=require('node:module');
const dir=path.resolve(__dirname,'../frontend'),req=createRequire(path.join(dir,'package.json'));
const {JSDOM}=req('jsdom');const dom=new JSDOM('<div id="root"></div>',{url:'https://draft.test/'});
for(const key of ['window','document','localStorage','HTMLElement','Node'])global[key]=dom.window[key];
Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});global.IS_REACT_ACT_ENVIRONMENT=true;
const React=req('react'),{createRoot}=req('react-dom/client');let hook,current,update;
const value={formData:{areas_foco:'Matemática',objetivo:'ENEM'},disponibilidade:['SEG','TER','QUA','QUI','SEX','SAB','DOM'].map(dia_semana=>({dia_semana,hora_inicio:'08:00',hora_fim:'18:00',ocupado:1})),step:1};
async function mount(){
 if(!hook){const b=await req('esbuild').build({stdin:{contents:"export {default} from './src/hooks/usePlanningDraft'",resolveDir:dir},bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});const filename=path.join(dir,'__planning_test.cjs'),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(dir);m._compile(b.outputFiles[0].text,filename);hook=m.exports.default}
 function Probe(){const[v,set]=React.useState(value);update=set;current=hook(v,true);return null}
 const root=createRoot(document.getElementById('root'));await React.act(async()=>root.render(React.createElement(Probe)));return()=>React.act(async()=>root.unmount());
}
test('planning edits survive remount, need explicit recovery and are cleared only after confirmation',async()=>{
 localStorage.clear();localStorage.setItem('user',JSON.stringify({id:101}));let close=await mount();
 await React.act(async()=>update({...value,formData:{...value.formData,areas_foco:'História'}}));
 assert.equal(current.status,'local');await close();close=await mount();
 try{assert.equal(current.offer.value.formData.areas_foco,'História');assert.equal(JSON.parse(localStorage.getItem('101:planning-draft:v1')).value.formData.areas_foco,'História');await React.act(async()=>current.clear());assert.equal(localStorage.getItem('101:planning-draft:v1'),null)}finally{await close()}
});
test('planning drafts from a different account are not offered',async()=>{
 localStorage.clear();localStorage.setItem('101:planning-draft:v1',JSON.stringify({version:1,value}));localStorage.setItem('user',JSON.stringify({id:202}));const close=await mount();try{assert.equal(current.offer,null)}finally{await close()}
});
test('unrecoverable storage failure warns on page exit and never claims a saved draft',async()=>{
 localStorage.clear();localStorage.setItem('user',JSON.stringify({id:101}));const close=await mount(),original=dom.window.Storage.prototype.setItem;
 try{dom.window.Storage.prototype.setItem=()=>{throw Error('quota')};await React.act(async()=>update({...value,step:2}));assert.equal(current.status,'unsaved');const event=new window.Event('beforeunload',{cancelable:true});window.dispatchEvent(event);assert.equal(event.defaultPrevented,true)}finally{dom.window.Storage.prototype.setItem=original;await close()}
});
