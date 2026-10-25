const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{createRequire,Module}=require('node:module');
const dir=path.resolve(__dirname,'../frontend'),req=createRequire(path.join(dir,'package.json')),memory=new Map();
global.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
let api;async function load(){if(!api){const build=await req('esbuild').build({stdin:{contents:"export * from './src/utils/searchExperience'",resolveDir:dir},bundle:true,write:false,platform:'node',format:'cjs'});const filename=path.join(dir,'__search_experience_test.cjs'),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(dir);m._compile(build.outputFiles[0].text,filename);api=m.exports}return api}
test('search highlighting preserves accents, original text and literal markup',async()=>{
 const {highlightParts}=await load();const source='Uma ação própria: <img src=x onerror=alert(1)>.';const parts=highlightParts(source,'acao');assert.equal(parts.filter(p=>p.match)[0].text,'ação');assert.equal(parts.map(p=>p.text).join(''),source);assert.equal(highlightParts('açaí, ACAI','acai').filter(p=>p.match).length,2);assert.equal(highlightParts('Texto','').map(p=>p.text).join(''),'Texto');
});
test('recent search storage is bounded, deduplicated, account scoped and fails safely',async()=>{
 const api=await load();memory.clear();localStorage.setItem('user',JSON.stringify({id:7}));for(let i=0;i<12;i++)api.rememberSearch('Tema '+i,'anotacoes');assert.equal(api.readRecentSearches().length,8);api.rememberSearch('Tema 11','anotacoes');assert.equal(api.readRecentSearches().filter(item=>item.q==='Tema 11').length,1);
 localStorage.setItem('user',JSON.stringify({id:8}));assert.deepEqual(api.readRecentSearches(),[]);api.rememberSearch('Física','materiais');api.clearRecentSearches();localStorage.setItem('user',JSON.stringify({id:7}));assert.equal(api.readRecentSearches().length,8);
 const original=localStorage.setItem;try{localStorage.setItem=()=>{throw Error('quota')};assert.equal(api.rememberSearch('Mais um tema','todos'),false)}finally{localStorage.setItem=original}
});
