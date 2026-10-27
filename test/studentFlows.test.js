const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire, Module } = require('node:module');
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const requireFrontend = createRequire(path.join(frontendDir, 'package.json'));
const { JSDOM, VirtualConsole } = requireFrontend('jsdom');
const dom = new JSDOM('<!doctype html><html lang="pt-BR"><head><title>PlanejAI</title></head><body><div id="root"></div></body></html>', { url: 'http://planejai.test/', virtualConsole: new VirtualConsole(), pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Element', 'SVGElement', 'Node', 'MutationObserver', 'getComputedStyle']) global[key] = key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.confirm = () => false;
global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
let setupCompleteFixture = true;
global.fetch = async url => ({ ok: true, status: 200, json: async () => String(url).endsWith('/api/perfil')
  ? { perfil: setupCompleteFixture ? { areas_foco: 'Matemática' } : null, disponibilidade: setupCompleteFixture ? [{ dia_semana: 'SEG' }] : [] }
  : { status: 'OK', database: 'connected' } });
const React = requireFrontend('react');
const { act } = React;
const { createRoot } = requireFrontend('react-dom/client');
const { MemoryRouter } = requireFrontend('react-router-dom');
const axios = requireFrontend('axios');
const axe = requireFrontend('axe-core');
let bundle;
let requests = [];
let failChat = false;
let guidedRecords=[],guidedWriteFailure=false;

let chatHistoryFixture=[];
let readingHighlightsFixture=[],highlightSaveFailure=false,conversationsFixture=[],conversationSaveFailure=false,chatPlainReply=false;
let conversationSaveDeferred=false,resolveConversationSave;
let reviewSaveFailure=false;
let cardLibraryFixture=[],cardReadFailure=false,cardWriteFailure=false,cardConflict=false;
let cardHistoryFixture=[],cardHistoryFailure=false;
let cardCollectionsFixture=[],cardMembershipsFixture=[];
let failScheduleLoad = false;
let failExamLoad = false;
let supportMode = '';
let materialCatalogFixture = false;
let dashboardLearningFixture = null;
let dailySchedulesFixture = [];
let evolutionFixture = [];
let continuityFixture = null;
let continuityFailure = false;
let reviewQueueFixture = [];
let postponeFailure = false;
let onboardingProfileFixture = null;
let incompleteAccount = false;
let failLearningLoad = false;
let essayMode = '';
let deferredEssay;
let searchMode = '';
let deferredSearch;
let journalFailure = false;
let journalDoubt = false;
let journalResolved = 0;
let closingFailure=false;
let notesWriteFailure=false;
let returnsFixture=null;
let returnsFailure=false;
let personalFailure=false;
let intentMode='',deferredIntent;
let directoryOtherAccount=false;
let planningWriteFailure=false;
let deskItems=[{id:31,tipo:'anotacao',id_origem:9,titulo:'Leis de Newton',trecho:'Um exemplo meu',disponivel:true},{id:32,tipo:'duvida',id_origem:71,titulo:'Força e velocidade',disponivel:true}];
let journalSteps = [{id:11,tipo:'explicacao',texto:'Primeira versão preservada',criado_em:'2026-10-20T12:00:00'}, {id:12,tipo:'explicacao',texto:'Segunda versão com exemplo',criado_em:'2026-10-25T12:00:00'}];
const person = role => ({ id: 900001, id_usuario: 900001, nome: 'Estudante de teste', email: 'fixture@example.invalid', tipo: role, ativo: 1 });
async function fixture(config) {
  const url = `${config.baseURL || ''}${config.url || ''}`.replace(/\/$/, '');
  requests.push({ url, method: config.method, data: config.data, params:config.params, cache:config.cache });
  if(url.includes('/aprendizagem/percursos')){
    const end=url.split('/percursos')[1]||'';
    const body=typeof config.data==='string'?JSON.parse(config.data):config.data;
    if(config.method==='get'){
      if(end==='/hoje')return {preparation:null,evidence:null};
      if(end==='/laboratorio/catalogo')return require('../src/services/studyLabCatalog').cards();
      if(end==='/projetos/modelos'){const paths=require('../src/services/personalLearningPaths');return {templates:paths.templates,stages:paths.stages,criteria:paths.criteria};}
      if(end==='/estrategias/sugestoes')return [];
      if(end==='/portfolio/opcoes')return require('../src/services/researchPortfolioService').options(900001,config.params?.q||'',{execute:async()=>[guidedRecords.filter(r=>['projeto','estrategia','evidencia'].includes(r.kind)).map(r=>({id:r.id,tipo:r.kind,dados:r}))]});
      if(end==='/fontes/opcoes')return guidedRecords.filter(r=>['evidencia','laboratorio','projeto'].includes(r.kind)).flatMap(r=>(r.kind==='projeto'?r.entries:r.attempts).map(a=>({type:'caminho',record:r.id,step:a.id,title:r.title})));

      if(!end)return guidedRecords.filter(r=>r.kind===config.params?.tipo).map(r=>({...r,attempts:Array.isArray(r.attempts)?r.attempts.length:0}));
      if(end.endsWith('/revisao-final'))return {evidence:[],doubts:[]};
      return guidedRecords.find(r=>r.id===end.slice(1));
    }
    if(guidedWriteFailure)throw new axios.AxiosError('offline','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Não foi possível confirmar o envio.'}});
    if(end==='/fontes/conferir'){const original=guidedRecords.find(r=>r.id===body.record),entry=(original?.entries||original?.attempts||[]).find(a=>a.id===body.step);if(!entry)throw Error('origin missing');return {...body,title:original.title,snippet:entry.text,href:'/meu-entendimento?ciclo='+original.id};}
    if(end.endsWith('/lumi')&&body.mode==='defence'){
      const r=guidedRecords.find(r=>r.id===end.split('/')[1]),experiments=require('../src/services/learningExperiments');
      const context=experiments.context(r,body),feedback={claro:'Você relacionou potência e duração.',lacuna:'A comparação precisa explicitar as condições.',pergunta:body.request==='hint'?'Compare o mesmo intervalo de tempo.':'Que condição precisa permanecer igual nesta comparação?',proximoPasso:'Examinar as condições.',incerteza:'Só examinei o contexto escolhido.'};
      return {feedback,receipt:JSON.stringify({owner:'900001',record:r.id,attempt:context.chosen[0].id,hash:require('node:crypto').createHash('sha256').update(JSON.stringify(context.chosen[0].text)).digest('hex'),purpose:'defence',request:body.request||'question',feedback})};
    }
    const sourceDb={execute:async(sql,v)=>[[...guidedRecords.filter(r=>r.id===v[0]).map(r=>({id:r.id,versao:r.version,tipo:r.kind,dados:r}))]]};
    if(end.endsWith('/coerencia/previa')){const r=guidedRecords.find(r=>r.id===end.split('/')[1]);return require('../src/services/projectWorkspaceService').preview(900001,r,body,sourceDb);}
    if(end==='/portfolio/origem')return require('../src/services/researchPortfolioService').resolve(900001,body,sourceDb);
    if(end==='/portfolio'&&config.method==='post'){const r={id:body.key,version:1,kind:'portfolio',...await require('../src/services/researchPortfolioService').create(900001,body,sourceDb)};guidedRecords.push(r);return r;}
    if(config.method==='post'&&(end==='/prova'||end==='/evidencia'||end==='/laboratorio'||end==='/estrategia'||end==='/projeto')){
      const kind=end.slice(1),record={...body,id:body.key,version:1,kind,...(kind==='prova'?require('../src/services/guidedStudyService')._test.createPreparation(body):kind==='laboratorio'?require('../src/services/studyLabService').create(body):['estrategia','projeto'].includes(kind)?await require('../src/services/personalLearningPaths').create(900001,kind,body,sourceDb,undefined,new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date())):{attempts:[],due:null})};if(kind==='projeto')record.stages=require('../src/services/personalLearningPaths').stages;if(kind==='laboratorio')record.case=require('../src/services/studyLabCatalog').present(record);guidedRecords.push(record);return record;
    }
    if(end.endsWith('/recuperacao/previa')){const source=guidedRecords.find(r=>r.id===end.split('/')[1]);return require('../src/services/postExamService').preview(source,body,new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()));}
    const record=guidedRecords.find(r=>r.id===end.slice(1));
    if(record?.kind==='projeto'&&body.action==='defenceQuestion'){require('../src/services/learningExperiments').acceptQuestion(record,body,JSON.parse(body.receipt),900001,record.id);record.version++;return record;}
    if(['estrategia','projeto'].includes(record?.kind)){if(require('../src/services/personalLearningPaths').replay(record,record.kind,body))return record;await require('../src/services/personalLearningPaths').apply(900001,record,record.kind,body,sourceDb,undefined,new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()));record.version++;return record;}
    if(['postexam','approveRecovery','completeRecovery'].includes(body.action)){require('../src/services/postExamService').apply(record,body,new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()));record.recoverySuggestions=require('../src/services/postExamService').suggestions(record);record.version++;return record;}
    if(record?.kind==='laboratorio'&&['help','parameter','investigate'].includes(body.action)){require('../src/services/studyLabService').apply(record,body,new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()));record.case=require('../src/services/studyLabCatalog').present(record);record.version++;return record;}
    if(body.action==='attempt'){record.attempts.push({id:body.key,text:body.text,correction:body.correction,created:new Date().toISOString()});record.due='2026-10-29';record.version++;return record;}
    if(body.action==='replan'){record.tasks.forEach(t=>{if(!t.done)t.date='2026-10-30'});record.version++;return record;}
    if(body.action==='complete'){record.tasks.find(t=>t.id===body.task).done=true;record.version++;return record;}
    return record;
  }
  if(url.includes('/aprendizagem/cartoes')){
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
    if(config.method==='get'&&cardReadFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
    if(config.method!=='get'&&cardWriteFailure)throw new axios.AxiosError('offline','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Cartão ainda não confirmado.'}});
    if(config.method!=='get'&&cardConflict)throw new axios.AxiosError('conflict','ERR_BAD_RESPONSE',config,null,{status:409,data:{message:'O cartão mudou em outra tela.'}});
    if(url.endsWith('/cartoes/colecoes')){if(config.method==='get')return cardCollectionsFixture.map(c=>{const items=cardLibraryFixture.filter(f=>cardMembershipsFixture.some(x=>x.collection===c.id&&x.card===f.id_flashcard));return {...c,total:items.length,ativos:items.filter(f=>!f.arquivado).length,pendentes:items.filter(f=>!f.arquivado&&f.proxima_revisao<=today).length,melhorar:items.filter(f=>!f.arquivado&&f.melhorar).length,arquivados:items.filter(f=>f.arquivado).length}}).sort((a,b)=>Number(b.fixada||0)-Number(a.fixada||0)||Number(a.ordem_prioridade||0)-Number(b.ordem_prioridade||0)||a.nome.localeCompare(b.nome,'pt-BR')||a.id-b.id);const data=JSON.parse(config.data),row={id:31,versao:1,...data};cardCollectionsFixture.push(row);return {salvo:true,id:31}}
    if(url.endsWith('/cartoes/colecoes/ordem')){const data=JSON.parse(config.data),actual=cardCollectionsFixture.filter(c=>c.fixada).sort((a,b)=>Number(a.ordem_prioridade||0)-Number(b.ordem_prioridade||0)||a.nome.localeCompare(b.nome,'pt-BR')||a.id-b.id).map(c=>c.id);if(JSON.stringify(actual)!==JSON.stringify(data.ordem)&&JSON.stringify(actual)!==JSON.stringify(data.anterior))throw new axios.AxiosError('conflict','ERR_BAD_RESPONSE',config,null,{status:409,data:{message:'As prioridades mudaram em outra tela. Atualize a lista antes de salvar uma nova ordem.'}});data.ordem.forEach((id,i)=>{cardCollectionsFixture.find(c=>c.id===id).ordem_prioridade=i+1});return {salvo:true,ordem:data.ordem}}
    if(/cartoes\/colecoes\/\d+\/retirar$/.test(url)){const collection=Number(url.match(/colecoes\/(\d+)/)[1]),ids=[...new Set(JSON.parse(config.data).cartoes)];cardMembershipsFixture=cardMembershipsFixture.filter(x=>x.collection!==collection||!ids.includes(x.card));return {salvo:true,confirmados:ids.length}}
    if(/cartoes\/colecoes\/\d+\/fixada$/.test(url)){const id=Number(url.match(/colecoes\/(\d+)/)[1]),row=cardCollectionsFixture.find(c=>c.id===id),data=JSON.parse(config.data);if(data.fixada&&!row.fixada&&cardCollectionsFixture.filter(c=>c.fixada).length>=3)throw new axios.AxiosError('limit','ERR_BAD_RESPONSE',config,null,{status:409,data:{message:'Você já tem três coleções fixadas em Hoje. Desafixe uma delas antes de escolher outra.'}});if(data.fixada&&!row.fixada)row.ordem_prioridade=Math.max(0,...cardCollectionsFixture.filter(c=>c.fixada).map(c=>Number(c.ordem_prioridade||0)))+1;if(!data.fixada)row.ordem_prioridade=0;row.fixada=data.fixada?1:0;return {salvo:true,fixada:data.fixada}}
    if(/cartoes\/colecoes\/\d+\/cartoes$/.test(url)){const collection=Number(url.match(/colecoes\/(\d+)/)[1]),data=JSON.parse(config.data),ids=[...new Set(data.cartoes)];for(const card of ids)if(!cardMembershipsFixture.some(x=>x.collection===collection&&x.card===card))cardMembershipsFixture.push({collection,card});return {salvo:true,confirmados:ids.length}}
    if(/cartoes\/colecoes\/\d+\/cartoes\/\d+$/.test(url)){const ids=url.match(/colecoes\/(\d+)\/cartoes\/(\d+)/),collection=Number(ids[1]),card=Number(ids[2]),data=JSON.parse(config.data);cardMembershipsFixture=cardMembershipsFixture.filter(x=>x.collection!==collection||x.card!==card);if(data.incluir)cardMembershipsFixture.push({collection,card});return {salvo:true}}
    if(/cartoes\/colecoes\/\d+$/.test(url)){const id=Number(url.split('/').at(-1));if(config.method==='put'){const row=cardCollectionsFixture.find(c=>c.id===id),data=JSON.parse(config.data);if(!row||row.versao!==data.versao)throw new axios.AxiosError('conflict','ERR_BAD_RESPONSE',config,null,{status:409,data:{message:'A coleção mudou em outra tela.'}});Object.assign(row,{nome:data.nome,objetivo:data.objetivo,versao:row.versao+1});return {salvo:true,id,versao:row.versao}};cardCollectionsFixture=cardCollectionsFixture.filter(c=>c.id!==id);cardMembershipsFixture=cardMembershipsFixture.filter(x=>x.collection!==id);return {salvo:true}}
    if(/cartoes\/\d+\/colecoes$/.test(url)){const id=Number(url.match(/cartoes\/(\d+)/)[1]);return cardMembershipsFixture.filter(x=>x.card===id).map(x=>x.collection)}
    if(url.endsWith('/melhoria')){const id=Number(url.match(/cartoes\/(\d+)/)[1]),row=cardLibraryFixture.find(c=>c.id_flashcard===id),data=JSON.parse(config.data);row.melhorar=data.melhorar?1:0;row.melhoria_nota=data.melhorar?data.nota:null;row.versao++;return {salvo:true}}
    if(url.endsWith('/historico')){if(cardHistoryFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});const id=Number(url.match(/cartoes\/(\d+)/)?.[1]),rows=cardHistoryFixture.filter(item=>item.idFlashcard===id),page=Number(config.params.pagina)||1;return {itens:rows.slice((page-1)*20,page*20),mais:rows.length>page*20,pagina:page,resumo:{total:rows.length,errei:rows.filter(x=>x.resultado==='ERREI').length,dificil:rows.filter(x=>x.resultado==='DIFICIL').length,lembrei:rows.filter(x=>x.resultado==='LEMBREI').length,dominei:rows.filter(x=>x.resultado==='DOMINEI').length}}}
    if(url.endsWith('/cartoes/curta')){const collection=config.params.colecao?cardCollectionsFixture.find(c=>c.id===Number(config.params.colecao)):null;if(config.params.colecao&&!collection)throw new axios.AxiosError('missing','ERR_BAD_RESPONSE',config,null,{status:404,data:{}});const due=cardLibraryFixture.filter(c=>!c.arquivado&&c.proxima_revisao<=today&&(!collection||cardMembershipsFixture.some(x=>x.collection===collection.id&&x.card===c.id_flashcard))).sort((a,b)=>a.proxima_revisao.localeCompare(b.proxima_revisao)||a.id_flashcard-b.id_flashcard),items=due.slice(0,{3:2,5:3,10:5}[config.params.minutos]);return {itens:items,totalPendentes:due.length,minutos:Number(config.params.minutos),minutosEstimados:Math.ceil(items.length*1.5),hoje:today,colecao:collection}}
    if(url.endsWith('/cartoes')){
      if(config.method==='get'){const p=config.params||{},filtered=cardLibraryFixture.filter(c=>Boolean(c.arquivado)===(p.arquivo==='arquivados')&&(!p.materia||c.disciplina===p.materia)&&(!p.semMateria||!c.disciplina)&&(!p.melhorar||c.melhorar)&&(!p.colecao||cardMembershipsFixture.some(x=>x.card===c.id_flashcard&&x.collection===Number(p.colecao)))&&(p.estado!=='pendentes'||c.proxima_revisao<=today));return {itens:filtered.slice(((p.pagina||1)-1)*12,(p.pagina||1)*12),mais:filtered.length>(p.pagina||1)*12,pagina:p.pagina||1,total:filtered.length,materias:[...new Set(cardLibraryFixture.map(c=>c.disciplina).filter(Boolean))],hoje:today}}
      const data=JSON.parse(config.data),row={id_flashcard:141,frente:data.pergunta,verso:data.resposta,disciplina:data.disciplina,proxima_revisao:today,versao:1,arquivado:0};cardLibraryFixture=[...cardLibraryFixture,row];return {salvo:true,id:141};
    }
    const id=Number(url.match(/cartoes\/(\d+)/)?.[1]),row=cardLibraryFixture.find(c=>c.id_flashcard===id)||{id_flashcard:141,frente:'Como a força muda o movimento?',verso:'A força resultante produz aceleração.',disciplina:'Física',fonte_titulo:'Leis de Newton',fonte_secao:'Conceito',fonte_trecho:'Uma força resultante não nula produz aceleração.',proxima_revisao:today,versao:1,arquivado:0};
    if(config.method==='get')return {...row};const body=JSON.parse(config.data);if(url.endsWith('/arquivo'))row.arquivado=body.arquivado?1:0;else if(url.endsWith('/avaliar')){const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+{ERREI:1,DIFICIL:3,LEMBREI:7,DOMINEI:15}[body.resultado]);row.proxima_revisao=date.toISOString().slice(0,10);cardHistoryFixture.unshift({id:cardHistoryFixture.length+1,idFlashcard:row.id_flashcard,resultado:body.resultado,versaoCartao:row.versao,pergunta:row.frente,resposta:row.verso,disciplina:row.disciplina,revisadoEm:new Date().toISOString(),proximaRevisao:row.proxima_revisao,intervaloDias:{ERREI:1,DIFICIL:3,LEMBREI:7,DOMINEI:15}[body.resultado],textoMudou:false})}else Object.assign(row,{frente:body.pergunta,verso:body.resposta,disciplina:body.disciplina});row.versao++;return {salvo:true,id,versao:row.versao,proximaRevisao:row.proxima_revisao};
  }
  if(url.endsWith('/registros/perguntas/141'))return {id_flashcard:141,frente:'Como a força muda o movimento?',verso:'A força resultante produz aceleração.',disciplina:'Física',fonte_titulo:'Leis de Newton',fonte_secao:'Conceito',fonte_trecho:'Uma força resultante não nula produz aceleração.'};
  if(url.endsWith('/registros/perguntas')){if(reviewSaveFailure)throw new axios.AxiosError('offline','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Pergunta ainda não confirmada.'}});return {id:141,salvo:true}}
  if(url.endsWith('/registros/destaques')){
    if(config.method==='get')return readingHighlightsFixture.filter(item=>Boolean(item.arquivado)===(config.params.arquivados==='1'));
    if(highlightSaveFailure)throw new axios.AxiosError('offline','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Destaque ainda não confirmado.'}});
    const data=JSON.parse(config.data),row={id:91,material_key:data.materialKey,titulo:data.titulo,secao:data.secao,trecho:data.trecho,nota:data.nota,versao:1,arquivado:0};readingHighlightsFixture=[row];return {...row,salvo:true};
  }
  if(/\/registros\/destaques\/91(?:\/arquivo)?$/.test(url)){
    if(config.method==='get'){if(highlightSaveFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:404,data:{}});return readingHighlightsFixture[0]}
    const data=JSON.parse(config.data),row=readingHighlightsFixture[0];if(highlightSaveFailure)throw new axios.AxiosError('offline','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
    if(config.method==='patch')row.arquivado=data.arquivado?1:0;else row.nota=data.nota;row.versao++;return {...row,salvo:true};
  }
  if(url.endsWith('/registros/conversas')){
    if(config.method==='get')return {itens:conversationsFixture.filter(item=>Boolean(item.arquivado)===(config.params.arquivados==='1')).map(item=>({...item,total:item.mensagens.length})),mais:false,pagina:1};
    if(conversationSaveFailure)throw new axios.AxiosError('offline','ERR_BAD_RESPONSE',config,null,{status:409,data:{message:'A versão da conta mudou.'}});
    const row={...JSON.parse(config.data),id:81,versao:1,arquivado:0};conversationsFixture=[row];if(conversationSaveDeferred)return new Promise(resolve=>{resolveConversationSave=()=>resolve({id:81,versao:1,salvo:true})});return {id:81,versao:1,salvo:true};
  }
  if(/\/registros\/conversas\/81(?:\/arquivo)?$/.test(url)){
    const row=conversationsFixture[0];if(config.method==='get')return row;
    if(conversationSaveFailure)throw new axios.AxiosError('offline','ERR_BAD_RESPONSE',config,null,{status:409,data:{message:'A versão da conta mudou.'}});
    const data=JSON.parse(config.data);if(config.method==='patch')row.arquivado=data.arquivado?1:0;else Object.assign(row,data);row.versao++;return {id:81,versao:row.versao,salvo:true};
  }
  if(planningWriteFailure && config.method==='post' && (url.endsWith('/perfil') || url.endsWith('/perfil/disponibilidade')))throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
  if(essayMode==='success' && config.method==='post' && url.endsWith('/redacao'))return {redacao:{id_redacao:88,...JSON.parse(config.data)}};
  if(essayMode==='workshopSuccess' && config.method==='post' && url.endsWith('/redacao/projetos'))return {id_projeto:84,...JSON.parse(config.data)};
  if(url.endsWith('/redacao/revisar-intencao')){
    if(intentMode==='failure')throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'A Lumi não conseguiu concluir esta revisão.'}});
    const answer={intencao:JSON.parse(config.data).intencao,observacao:'A ideia precisa de uma relação causal.',sugestao:'Explique como a biblioteca aproxima o livro do estudante.',motivo:'O exemplo sustenta a afirmação.',pergunta:'Que situação da sua experiência ilustra isso?'};
    if(intentMode==='deferred')return new Promise(resolve=>{deferredIntent=()=>resolve(answer)});
    return answer;
  }
  if(url.includes('/aprendizagem/mesa')||url.includes('/aprendizagem/entendimento')){
    if(personalFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Seu espaço está temporariamente indisponível.'}});
    if(url.endsWith('/mesa')&&config.method==='get')return {itens:deskItems,limite:6};
    if(url.endsWith('/mesa')&&config.method==='post')return {id:31,fixado:true};
    if(url.endsWith('/mover')){deskItems=[...deskItems].reverse();return {ordenado:true}};
    if(url.endsWith('/mesa/31')&&config.method==='delete'){deskItems=deskItems.filter(item=>item.id!==31);return {retirado:true}};
    if(url.endsWith('/mesa/31/abrir'))return {tipo:'anotacao',id_origem:9,item:{id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}};
    if(url.endsWith('/mesa/32/abrir'))return {tipo:'duvida',id_origem:71,item:{id:71,titulo:'Força e velocidade'}};
    if(url.endsWith('/entendimento'))return {itens:[{passo:102,registro:71,registro_tipo:'explicacao',titulo:'Força e velocidade',tipo:'explicacao',versao:2,trecho:'Minha nova explicação',criado_em:'2026-10-25T12:00:00'}],mais:false,pagina:1};
    if(url.endsWith('/entendimento/102'))return {id:102,id_diario:71,registro_tipo:'explicacao',tipo:'explicacao',texto:'Minha nova explicação completa',criado_em:'2026-10-25T12:00:00',anterior:{id:1,texto:'Minha versão anterior original',criado_em:'2026-10-20T12:00:00'}};
  }
  if(url.endsWith('/aprendizagem/retomadas')) {
    if(returnsFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
    return returnsFixture || {principal:null,explicacao:null,duvida:null,revisao:null,proximoPasso:null};
  }
  if(url.endsWith('/aprendizagem/fechamentos')) {
    if(closingFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Fechamento ainda não confirmado.'}});
    const data=JSON.parse(config.data);
    return {confirmado:true,fechamento:{id:89,id_conteudo:data.idConteudo,proximo_passo:data.proximoPasso,sintese:{titulo:'Leis de Newton',disciplina:'Física',minutos:5,resultado:data.resultado,anotacoes:notesWriteFailure?0:1,explicacoes:2,totalDuvidas:1,duvidas:[{id:71,titulo:'Ainda confundo força e velocidade'}]}}};
  }
  if(url.endsWith('/fechamentos/89/retomar'))return {conteudo:{id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}};
  if(url.endsWith('/fechamentos/89/retomado')){returnsFixture=null;return {confirmado:true}};
  if(notesWriteFailure && url.endsWith('/conteudos/9/anotacao') && config.method==='put')throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
  if(url.endsWith('/aprendizagem/diario')) {
    if(config.method==='post') {
      if(journalFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Não foi possível confirmar.'}});
      return {id:71,salvo:true};
    }
    return {itens:[{id:71,titulo:'Força e movimento',tipo:config.params.tipo,atualizado_em:'2026-10-25T12:00:00',versoes:2,retomar:1}],mais:false,pagina:1};
  }
  if(url.endsWith('/diario/71'))return {id:71,titulo:'Força e movimento',tipo:journalDoubt?'duvida':'explicacao',resolvido:journalResolved,passos:journalSteps,mais:false};
  if(url.endsWith('/diario/71/passos')){const data=JSON.parse(config.data);if(data.tipo==='resolucao')journalResolved=1;if(data.tipo==='reabertura')journalResolved=0;return {id:71,salvo:true}};
  if(url.endsWith('/diario/71/lumi'))return {resposta:'Seu exemplo tornou a ideia mais clara. O que muda se a força resultante for zero?'};
  if (url.endsWith('/busca')) {
    if(searchMode==='failed') throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
    if(searchMode==='slow' && config.params.q==='antiga') return new Promise(resolve=>{deferredSearch=resolve});
    if(searchMode==='empty') return {query:config.params.q,pagina:1,limite:12,grupos:[]};
    if(searchMode==='collections'){const matched=cardCollectionsFixture.filter(c=>(c.nome+' '+c.objetivo).toLocaleLowerCase('pt-BR').includes(config.params.q.toLocaleLowerCase('pt-BR'))),page=Number(config.params.pagina||1);return {query:config.params.q,pagina:page,limite:12,grupos:[{tipo:'colecoes',nome:'Coleções de cartões',mais:matched.length>page*12,itens:matched.slice((page-1)*12,page*12).map(c=>({id:c.id,titulo:c.nome,trecho:c.objetivo}))}]}}
    if(searchMode==='cards')return {query:config.params.q,pagina:1,limite:12,grupos:[{tipo:'cartoes',nome:'Cartões de revisão',itens:[{id:141,titulo:'Como a força muda o movimento?',disciplina:'Física',trecho:'A força resultante produz aceleração.'}]}]};
    if(searchMode==='memory')return {query:config.params.q,pagina:1,limite:12,grupos:[{tipo:'destaques',nome:'Destaques',itens:[{id:91,titulo:'Leis de Newton',trecho:'Meu exemplo de força no carrinho.'}]},{tipo:'conversas',nome:'Conversas da Lumi',itens:[{id:81,titulo:'Entender Newton',disciplina:'Física',trecho:'Como a força muda o movimento?'}]}].filter(group=>config.params.tipo==='todos'||group.tipo===config.params.tipo)};
    const groups=[{tipo:'materias',nome:'Matérias',itens:[{id:'Física',titulo:'Física'}]}, {tipo:'materiais',nome:'Materiais',mais:true,itens:[{id:9,titulo:'Leis de Newton',disciplina:'Física',trecho:'Força e movimento.'}]}, {tipo:'anotacoes',nome:'Anotações',itens:[{id:9,titulo:'Minha leitura de Newton',disciplina:'Física',trecho:'Minha dúvida sobre inércia.'}]}, {tipo:'redacoes',nome:'Redações',itens:[{id:81,titulo:'Educação no Brasil',trecho:'Um texto de teste.'}]}];
    return {query:config.params.q,pagina:Number(config.params.pagina)||1,limite:12,grupos:groups.filter(group=>config.params.tipo==='todos'||group.tipo===config.params.tipo)};
  }
  if(url.endsWith('/busca/conteudos/9')) return {id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física',materiais:'[]',link:''};
  if(searchMode && url.endsWith('/redacao') && config.method==='get') return [{id_redacao:81,tema:'Educação no Brasil',texto:'Um texto de teste.',enviada_em:'2026-10-24',id_usuario:900001}];
    if ((failScheduleLoad && url.endsWith('/cronograma')) || (failExamLoad && url.endsWith('/inteligencia/catalogo-provas'))) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (essayMode === 'workshopFailure' && config.method === 'post' && url.endsWith('/redacao/projetos')) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (failLearningLoad && url.endsWith('/aprendizagem/resumo')) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (url.endsWith('/redacao') && config.method === 'post') {
    if (essayMode === 'deferred') return new Promise(resolve => { deferredEssay = resolve; });
    if (essayMode === 'failure') throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { message: 'Envio temporariamente indisponível.' } });
    if (essayMode === 'queued') return { offline: true, queued: true, queueId: 123 };
  }
  if (url.endsWith('/aprendizagem/estudo-em-andamento')) {
    if (continuityFailure && config.method === 'get') throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
    return config.method === 'get' ? continuityFixture : { salvo: true };
  }
  if (url.endsWith('/aprendizagem/revisoes')) return reviewQueueFixture;
  if (/\/aprendizagem\/revisoes\/\d+\/adiar$/.test(url)) {
    if (postponeFailure) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
    reviewQueueFixture = [];
    return { message: 'Revisão reagendada.' };
  }
  if (url.endsWith('/cronograma')) return dailySchedulesFixture;
  if (url.endsWith('/aprendizagem/evolucao')) return evolutionFixture;
  if (/\/dias\/\d+\/ajustar$/.test(url)) return { message: 'Seu dia foi ajustado e salvo.' };
  if (url.endsWith('/inteligencia/chat')) {
    if (config.method === 'post') {
      if(chatPlainReply)return {conteudo:'Uma resposta que usa somente a conversa escolhida.'};
      if (failChat) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { message: 'Lumi temporariamente indisponível.' } });
      return { mensagens: [{ role: 'user', conteudo: JSON.parse(config.data).mensagem }, { role: 'assistant', conteudo: '# Vamos entender\n\nUma **ideia** de cada vez.\n\n- Primeiro ponto\n- Segundo ponto\n\n<script>unsafe()</script>' }] };
    }
    return chatHistoryFixture;
  }
  if (url.endsWith('/aprendizagem/jornada')) return { blocks: [], plannedMinutes: 25, summary: { reviews: 0, errors: 0, weeklyMinutes: 0, weeklyGoal: 180, criticalDiscipline: null } };
  if (url.endsWith('/aprendizagem/resumo')) return dashboardLearningFixture || { metaSemanal: 180, minutosSemana: 0, revisoesHoje: 0, errosPendentes: 0, porDisciplina: [], porDificuldade: [], recomendacoes: [], competenciasEnem: [] };
  if (url.endsWith('/perfil')) return { perfil: onboardingProfileFixture || (setupCompleteFixture ? { areas_foco: 'Matemática', objetivo: 'ENEM', ano_escolar: '3', tempo_diario_min: 60 } : null), disponibilidade: [] };
  if (url.endsWith('/inteligencia/privacidade')) return { visibilidade: 'RESUMO' };
  if (url.endsWith('/operacoes/suporte')) {
    if (config.method === 'post') {
      if (supportMode === 'failed') throw Object.assign(new Error('Falha no atendimento.'), { config, response: { status: 503, data: { message: 'Atendimento indisponível.' } } });
      return { id: 81 };
    }
    return supportMode === 'saved' ? [{ id: 81, categoria: 'PROBLEMA', mensagem: 'Minha mensagem de ajuda.', status: 'ABERTO', criado_em: '2026-10-24T12:00:00Z' }] : [];
  }
  if (url.endsWith('/usuarios/me')) return person('aluno');
  if (url.endsWith('/usuarios')) return { usuarios: [directoryOtherAccount?{...person('aluno'),id:900002,id_usuario:900002}:person('aluno')], pagina: 1, total_registros: 17, total_paginas: 2, stats: { total: 17, ativos: 15, inativos: 2, donos: 1, admins: 2, docentes: 3, alunos: 11 } };
  if (url.endsWith('/dashboard/estatisticas')) return { totalUsuarios: 17, totalAtividadesPublicadas: 0, totalEntregas: 0, totalCronogramasAtivos: 0 };
  if (url.endsWith('/colaborativo/gestao/alertas')) return [{ id_usuario: 31, nome: 'Aluno de teste', motivos: ['Revisões atrasadas'] }];
  if (url.endsWith('/colaborativo/gestao/grupos/sugestoes')) return [{ disciplina: 'Matemática', competencia: 'Razão e proporção', aprendizes: [31], mentores: [] }];
  if (url.endsWith('/turmas/minhas/1')) return { id_turma: 1, nome: 'Turma de teste', ano_letivo: 2026, pendentes: [], concluidas: [], avisos: [] };
  if (url.endsWith('/turmas')) return [{ id_turma: 2, nome: 'Terceiro A', codigo: '3A', ano_letivo: 2026, total_alunos: 3, disciplinas: [{ disciplina: 'Matemática' }] }];
  if (url.endsWith('/turmas/2')) return { id_turma: 2, nome: 'Terceiro A', codigo: '3A', docentes: [], alunos: [] };
  if (materialCatalogFixture && url.endsWith('/conteudos')) return [{ id_conteudo: 7, titulo: 'Leis de Newton', disciplina: 'Física', nivel: 'BASICO', materiais: '[]', link: '' }];
  if (url.endsWith('/adaptativo/proxima-acao')) return { motivo: 'Uma sessão breve', titulo: 'Revisar' };
  if (url.endsWith('/adaptativo/sequencia')) return { semanas: 0 };
  return [];
}
axios.defaults.adapter = async config => ({ status: 200, statusText: 'OK', headers: {}, config, data: await fixture(config) });
async function getBundle() {
  if (bundle) return bundle;
  const esbuild = requireFrontend('esbuild');
  const result = await esbuild.build({
    stdin: { contents: `export { default as Login } from './src/pages/Login'; export { AuthContext } from './src/context/AuthContext'; export { default as App } from './src/App'; export { default as RouteLoading } from './src/components/RouteLoading'; export { default as PageExperience } from './src/components/PageExperience'; export { ThemeProvider } from './src/context/ThemeContext'; export { AccessibilityProvider } from './src/context/AccessibilityContext'; export { default as ErrorBoundary } from './src/components/ErrorBoundary';`, resolveDir: frontendDir, loader: 'jsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', loader: { '.css': 'empty', '.ttf':'empty' },
    define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: 'http://fixture.invalid', BASE_URL: '/', DEV: true }) },
    plugins: [{ name: 'defer-nonessential-widgets', setup(build) { build.onResolve({ filter: /LumiMessage$/ }, () => ({ path: 'lumi-message-test', namespace: 'test' })); build.onResolve({ filter: /Deferred$/ }, () => ({ path: 'deferred-test', namespace: 'test' })); build.onLoad({ filter: /lumi-message-test/, namespace: 'test' }, () => ({ contents: "import React from 'react'; export default function LumiMessage({ content }) { return React.createElement('div', { className: 'lumi-message' }, content) }", loader: 'js', resolveDir: frontendDir })); build.onLoad({ filter: /deferred-test/, namespace: 'test' }, () => ({ contents: 'export default function Deferred(){ return null }', loader: 'js' })); } }],
    logLevel: 'silent',
  });
  const filename = path.join(frontendDir, '__student_test_bundle.cjs');
  const compiled = new Module(filename, module);
  compiled.filename = filename; compiled.paths = Module._nodeModulePaths(frontendDir);
  compiled._compile(result.outputFiles[0].text, filename);
  bundle = compiled.exports;
  return bundle;
}
async function flush() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
async function renderRoute(route, role = 'aluno', userOverrides = {}, stored = {}) {
  setupCompleteFixture = route !== '/onboarding' && !incompleteAccount;
  localStorage.clear();
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64'), Buffer.from(JSON.stringify({ id: 900001, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64'), 'fixture'].join('.');
  for (const [key, value] of Object.entries({ token, user: JSON.stringify({ ...person(role), ...userOverrides }), perfil_completo: route === '/onboarding' ? 'false' : 'true', primeiro_acesso: route === '/primeiro-acesso' ? 'true' : 'false', theme: 'light' })) localStorage.setItem(key, value);
  requests = [];
  for(const [key,value] of Object.entries(stored))localStorage.setItem(key,value);
  const { App, ThemeProvider, AccessibilityProvider, ErrorBoundary } = await getBundle();
  const container = document.getElementById('root');
  const root = createRoot(container);
  await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(ThemeProvider, null, React.createElement(AccessibilityProvider, null, React.createElement(ErrorBoundary, null, React.createElement(App)))))));
  await flush(); await flush();
  if (route === '/usuarios' || route === '/dono/usuarios') await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
  return { root, container, async close() { await act(async () => root.unmount()); } };
}
function button(text) { return [...document.querySelectorAll('button')].find(node => !node.closest('[hidden]') && node.textContent.trim() === text); }

function personalControl(prefix,root=document){return [...root.querySelectorAll('label')].find(label=>!label.closest('[hidden]')&&label.textContent.startsWith(prefix))?.querySelector('input,textarea,select');}

async function focusProject(focus){await act(async()=>document.getElementById('focus-tab-'+focus).click());await flush();}
async function stage76Records() {
  const paths=require('../src/services/personalLearningPaths'),day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
  const origin={id:'stage76-origin',version:1,kind:'evidencia',title:'Energia',attempts:[{id:'stage76-attempt',text:'Minha explicação original.',created:new Date().toISOString()}]};
  const db={execute:async()=>[[{id:origin.id,versao:1,tipo:'evidencia',dados:origin}]]};
  const strategy={id:'stage76-strategy',version:1,kind:'estrategia',...await paths.create(900001,'estrategia',{key:window.crypto.randomUUID(),title:'Conferir unidades',procedure:'Converter a duração antes de calcular.',experience:{subject:'Energia',difficulty:'Unidades',outcome:'parcial',observation:'Precisei converter minutos.',source:{type:'caminho',record:origin.id,step:origin.attempts[0].id}}},db,undefined,day)};
  return [origin,strategy];
}
async function stage79Project(){
  const paths=require('../src/services/personalLearningPaths'),day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
  const r={id:'stage79-project',version:1,kind:'projeto',...await paths.create(900001,'projeto',{title:'Investigação de fontes',question:'O que os dados permitem concluir?',scope:'Dois textos',subjects:['Matemática'],minutes:30,deliverable:'texto'},null,undefined,day)};
  for(const origin of ['Fonte A','Fonte B'])await paths.apply(900001,r,'projeto',{action:'projectSource',key:window.crypto.randomUUID(),origin,question:r.question,purpose:'Comparar os dados.',limits:'Recorte limitado.'},null,undefined,day);
  await paths.apply(900001,r,'projeto',{action:'projectEntry',key:window.crypto.randomUUID(),stage:'producao',entryType:'producao',text:'TEXTO_QUE_ESCOLHI_PARA_PORTFOLIO',reason:'MOTIVO_QUE_NAO_ESCOLHI',sources:[r.sources[0].id]},null,undefined,day);r.stages=paths.stages;return r;
}
async function stage82Project(){
  const r=await stage79Project(),evidence=require('../src/services/projectEvidenceService');
  const apply=async body=>{await evidence.apply(900001,r,{key:window.crypto.randomUUID(),...body},null);r.version++};
  await apply({action:'observationPlan',title:'Leituras observadas',question:'Como comparar leituras?',observe:'Anotar duração e condições.',unit:'minutos',count:4,conditions:'Registrar interrupções.',limits:'As atividades podem ser distintas.'});
  await apply({action:'prediction',plan:r.observationPlans[0].id,expected:'A segunda leitura pode levar menos tempo.',rationale:'Pode haver mais familiaridade.',challenge:'Tempo igual, maior ou condições distintas.'});
  await apply({action:'observation',plan:r.observationPlans[0].id,label:'Leitura inicial',date:require('../src/services/flashcardService').today(),kind:'medido',value:0,conditions:'Conferir o registro.',note:'Zero anotado, não ausência.'});
  await apply({action:'observationSelection',plan:r.observationPlans[0].id,rows:[r.observations[0].id],title:'Um registro com limites',purpose:'Examinar o procedimento.',limits:'Uma só observação não demonstra uma causa.'});
  return r;
}
test('focos preservam formulário aberto, recuperam o ponto da conta e permitem tentar salvar após falha',async()=>{
  const r=await stage79Project();guidedRecords=[r];let screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    assert.equal(document.getElementById('focus-tab-panorama').getAttribute('aria-selected'),'true');assert.equal(document.querySelector('.project-entry'),null);await focusProject('planejar');const field=personalControl('Meu texto, cálculo');await inputValue(field,'RASCUNHO_QUE_NAO_DEVE_SUMIR');await focusProject('observar');assert.equal(field.closest('[hidden]').id,'focus-panel-planejar');await focusProject('planejar');assert.equal(personalControl('Meu texto, cálculo'),field);assert.equal(field.value,'RASCUNHO_QUE_NAO_DEVE_SUMIR');
    guidedWriteFailure=true;await focusProject('argumentar');assert.equal(document.getElementById('focus-tab-argumentar').getAttribute('aria-selected'),'true');assert.equal(r.workspace.focus,'planejar');assert.ok(button('Tentar salvar o ponto de retomada'));guidedWriteFailure=false;await act(async()=>button('Tentar salvar o ponto de retomada').click());await flush();assert.equal(r.workspace.focus,'argumentar');assert.equal(r.entries.length,1);
    await screen.close();screen=await renderRoute('/projetos-investigacao?projeto='+r.id);assert.equal(document.getElementById('focus-tab-argumentar').getAttribute('aria-selected'),'true');assert.equal(document.querySelector('.observation-plan-create'),null);const a=await axe.run(document.querySelector('.project-focus-desk'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});
test('conferência preserva decisões ao abrir origens e falhar, e correção cria outra versão da produção',async()=>{
  const r=await stage82Project();guidedRecords=[r];const screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    await focusProject('produzir');const area=document.querySelector('.project-coherence');await act(async()=>area.querySelector('summary').click());await flush();let form=area.querySelector('.coherence-form');await selectValue(personalControl('Produção que quero',form),r.entries[0].id);await selectValue(personalControl('Versão relacionada',form),'coleta:'+r.observationSelections[0].id);await flush();await act(async()=>personalControl('Evidência apresentada',form).click());await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.coherenceReviews,undefined);assert.ok(form.textContent.includes('Conteúdo exato que estou conferindo'));
    for(const check of form.querySelectorAll('.coherence-check')){await selectValue(personalControl('Minha decisão',check),'em_aberto');await inputValue(personalControl('Minha explicação',check),'Quero conferir o alcance desta interpretação.');}await inputValue(personalControl('O que esta conferência',form),'Reconheço a ausência de uma comparação suficiente.');
    await act(async()=>[...form.querySelectorAll('button')].find(b=>b.textContent==='Abrir esta versão de origem').click());await flush();assert.equal(r.workspace.focus,'observar');assert.ok(document.querySelector('.project-origin-inspector').textContent.includes('Leitura inicial'));await focusProject('produzir');assert.equal(personalControl('O que esta conferência',form).value,'Reconheço a ausência de uma comparação suficiente.');
    guidedWriteFailure=true;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.coherenceReviews,undefined);assert.equal(personalControl('Minha explicação',form).value,'Quero conferir o alcance desta interpretação.');guidedWriteFailure=false;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.coherenceReviews.length,1);assert.equal(r.entries.length,1);assert.equal(r.status,'ativo');
    await act(async()=>[...area.querySelectorAll('summary')].find(s=>s.textContent.startsWith('Conferência 1')).click());await flush();await act(async()=>button('Abrir a produção desta versão').click());await flush();await act(async()=>button('Preparar uma revisão deste registro').click());await flush();const editor=document.querySelector('#focus-panel-produzir .project-entry'),priorText=r.entries[0].text;assert.equal(personalControl('Meu texto, cálculo',editor).value,priorText);await inputValue(personalControl('Meu texto, cálculo',editor),'Minha versão revisada explicita a ausência de dados suficientes.');await inputValue(personalControl('O que me fez manter',editor),'Explicitei os limites após conferir as origens.');await act(async()=>editor.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.entries.length,2);assert.equal(r.entries[1].replaces,r.entries[0].id);assert.equal(r.coherenceReviews[0].production.text,priorText);assert.equal(requests.filter(q=>q.url.endsWith('/lumi')).length,0);
    const a=await axe.run(document.querySelector('.project-focus-desk'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});
test('exportação mostra manifesto com versões e Lumi e exige reconferir ao trocar a edição',async()=>{
  const id=window.crypto.randomUUID(),item={id:window.crypto.randomUUID(),ref:{type:'projeto',record:'own-project',step:window.crypto.randomUUID()},role:'Uma evidência delimitada',title:'Minha investigação',originalDate:new Date().toISOString(),demonstrates:'O que consegui registrar.',limits:'Recorte pequeno.',blocks:[{key:'attempt',label:'Tentativa escolhida',authorship:'Registro do estudante',text:'TEXTO_EXATO_ESCOLHIDO'},{key:'lumi',label:'Orientação da Lumi',authorship:'Orientação da Lumi - pode conter erros',text:'ORIENTACAO_QUE_ESCOLHI'}],references:[{id:'ref',origin:'Referência escolhida',purpose:'Conferir a origem.',limits:'Não verificada externamente.',url:''}]};const p={id,kind:'portfolio',version:1,title:'Edições privadas',editions:[{id:window.crypto.randomUUID(),created:new Date().toISOString(),title:'Primeira edição',introduction:'Meu percurso.',conclusion:'O que continua aberto.',items:[item]},{id:window.crypto.randomUUID(),created:new Date().toISOString(),title:'Outra seleção',introduction:'Outro recorte.',conclusion:'Outra pergunta.',items:[{...item,blocks:[item.blocks[0]],references:[]}]}]};guidedRecords=[p];const screen=await renderRoute('/portfolio-investigacao?portfolio='+id);
  try{
    await selectValue(personalControl('Edição que quero'),'0');await act(async()=>button('Exportar esta edição em PDF').click());await flush();const manifest=document.querySelector('.portfolio-export-check');assert.ok(manifest.textContent.includes('1 orientação da Lumi selecionada'));assert.ok(manifest.textContent.includes(item.ref.step.slice(0,8)));assert.equal(button('Confirmar exportação desta prévia em PDF').disabled,true);await act(async()=>personalControl('Conferi os textos',manifest).click());assert.equal(button('Confirmar exportação desta prévia em PDF').disabled,false);await selectValue(personalControl('Edição que quero'),'1');assert.equal(document.querySelector('.portfolio-export-check'),null);await act(async()=>button('Exportar esta edição em PDF').click());await flush();assert.ok(document.querySelector('.portfolio-export-check').textContent.includes('0 orientações da Lumi selecionadas'));assert.equal(button('Confirmar exportação desta prévia em PDF').disabled,true);assert.ok(!document.querySelector('.portfolio-preview').textContent.includes('ORIENTACAO_QUE_ESCOLHI'));const a=await axe.run(document.querySelector('.portfolio-saved'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedRecords=[];await screen.close()}
});
test('previsão confrontada exige prévia e preserva comparação quando o envio falha',async()=>{
  const r=await stage82Project();guidedRecords=[r];const screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    await focusProject('observar');
    const area=document.querySelector('.project-predictions');await act(async()=>area.querySelector('summary').click());await flush();await act(async()=>[...area.querySelectorAll('summary')].find(s=>s.textContent==='Confrontar minha previsão atual com observações').click());await flush();
    const form=personalControl('Minha leitura destes dados',area).closest('form');await selectValue(personalControl('Seleção de observações',form),r.observationSelections[0].id);
    for(const [label,value] of [['O que é favorável','Não identifiquei evidência suficiente.'],['O que contraria','Faltam dados comparáveis.'],['O que preciso reconsiderar','Preciso conferir as condições.'],['Incertezas e limites','Uma observação é insuficiente.']])await inputValue(personalControl(label,form),value);
    await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.predictionComparisons,undefined);assert.ok(area.textContent.includes('Prévia ainda não guardada.'));
    guidedWriteFailure=true;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('O que preciso reconsiderar',form).value,'Preciso conferir as condições.');guidedWriteFailure=false;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.predictionComparisons.length,1);assert.equal(r.predictionComparisons[0].selection.rows[0].value,0);assert.equal(r.predictionComparisons[0].prediction.timing,'antes');
    await act(async()=>[...area.querySelectorAll('summary')].find(s=>s.textContent.startsWith('Comparação ·')).click());await flush();assert.equal(requests.filter(v=>v.url.endsWith('/lumi')).length,0);const a=await axe.run(area,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});
test('contraponto vira plano, começa por decisão própria e só retorna ao argumento após conferir',async()=>{
  const r=await stage82Project(),port=require('../src/services/researchPortfolioService'),db={execute:async()=>[[{id:r.id,versao:r.version,tipo:'projeto',dados:r}]]};
  const source=await port.resolve(900001,{type:'coleta',record:r.id,step:r.observationSelections[0].id},db);
  await require('../src/services/projectEvidenceService').apply(900001,r,{key:window.crypto.randomUUID(),action:'argumentVersion',title:'Uma conclusão com limites',claim:'Ainda não posso comparar as leituras.',evidences:[{ref:source.ref,sourceHash:source.sourceHash,parts:['evidence'],references:[],justification:'Só há um registro.'}],counterpoint:'A familiaridade pode alterar a leitura.',alternative:'A dificuldade dos textos pode variar.',limits:'Dados insuficientes.'},db);r.version++;guidedRecords=[r];const screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    await focusProject('argumentar');
    const area=document.querySelector('.project-counter-inquiries');await act(async()=>area.querySelector('summary').click());await flush();await selectValue(personalControl('Versão do argumento',area),r.argumentVersions[0].id);await flush();let form=personalControl('Nome desta investigação',area).closest('form');
    for(const [label,value] of [['Nome desta investigação','Examinar familiaridade'],['Pergunta delimitada','Como registrar o contato prévio?'],['O que ainda falta','Anotar contato com o texto.'],['Explicações que','Familiaridade e dificuldade.'],['Recursos e fontes','Dois trechos e meu caderno.'],['Condições e procedimento','Conferir o relógio e registrar interrupções.'],['Que resultados','Condições diferentes deixam a questão aberta.'],['Primeira ação','Escolher os trechos.'],['O que esta investigação','Não comprova causalidade.']])await inputValue(personalControl(label,form),value);
    await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.counterInvestigations.length,1);assert.equal(r.counterInquiryEvents,undefined);await act(async()=>[...area.querySelectorAll('summary')].find(s=>s.textContent.startsWith('Examinar familiaridade ·')).click());await flush();await act(async()=>[...area.querySelectorAll('summary')].find(s=>s.textContent==='Decidir começar esta investigação').click());await flush();form=personalControl('Como vou começar',area).closest('form');await inputValue(personalControl('Como vou começar',form),'Conferi os recursos e posso começar.');await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.counterInquiryEvents[0].state,'em_andamento');
    await act(async()=>[...area.querySelectorAll('summary')].find(s=>s.textContent==='Registrar o que encontrei e o que continua aberto').click());await flush();form=personalControl('O que fiz e encontrei',area).closest('form');for(const [label,value] of [['O que fiz e encontrei','Os trechos não tinham condições equivalentes.'],['Por que interpreto','Não obtive dados suficientes.'],['Limites do resultado','Há apenas um registro de duração.'],['Qual pergunta','Como comparar sem ignorar a dificuldade?']])await inputValue(personalControl(label,form),value);
    await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.counterInquiryResults,undefined);await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.counterInquiryResults[0].outcome,'inconclusiva');assert.equal(r.argumentVersions.length,1);
    await act(async()=>[...area.querySelectorAll('summary')].find(s=>s.textContent==='Conferir o resultado e rever meu argumento de origem').click());await flush();form=area.querySelector('.argument-version-form');const ev=form.querySelector('.argument-evidence-editor');await act(async()=>personalControl('Evidência apresentada',ev).click());await act(async()=>personalControl('Conclusão do estudante',ev).click());await inputValue(personalControl('Por que esta evidência',ev),'A investigação não obteve comparação suficiente.');await inputValue(personalControl('Por que estou mudando',form),'Mantenho a conclusão e explico o resultado inconclusivo.');await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.argumentVersions.length,1);await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.argumentVersions.length,2);assert.equal(r.argumentVersions[1].sourceInquiry.id,r.counterInquiryResults[0].id);
    assert.equal(requests.filter(v=>v.url.endsWith('/lumi')).length,0);const a=await axe.run(area,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});

test('ficha de fontes preserva rascunho na falha e aplica decisões às referências só após confirmar',async()=>{
  const r=await stage79Project();guidedRecords=[r];const screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    await focusProject('observar');
    await act(async()=>document.querySelector('.inquiry-create>summary').click());await flush();const form=document.querySelector('.inquiry-create form');
    await inputValue(personalControl('Afirmação que quero',form),'Os valores permitem generalizar?');await selectValue(personalControl('Referência do projeto',form),r.sources[0].id);
    for(const [label,value] of [['Trecho que estou','O texto apresenta um valor.'],['Finalidade percebida','Informar sobre o resultado.'],['Evidências que','Um número sem método descrito.'],['Informações ausentes','Preciso localizar o método.'],['Fatos ou dados','Um valor no recorte apresentado.'],['Interpretações que','O título generaliza.'],['Conclusões que','Não sei se o recorte é representativo.'],['Motivo da minha','Preciso conferir os dados.']])await inputValue(personalControl(label,form),value);
    guidedWriteFailure=true;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('Trecho que estou',form).value,'O texto apresenta um valor.');assert.equal(r.sourceInquiries,undefined);
    guidedWriteFailure=false;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.sourceInquiries.length,1);assert.equal(r.inquiryLinks,undefined);
    await act(async()=>document.querySelector('.inquiry-saved>summary').click());await flush();await act(async()=>button('Vincular estas decisões às referências do projeto').click());await flush();assert.equal(r.inquiryLinks.length,1);assert.ok(document.querySelector('.reference-assessments'));assert.equal(requests.filter(v=>v.url.endsWith('/lumi')).length,0);
    const a=await axe.run(document.querySelector('.source-inquiries'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});
test('caderno distingue zero de ausência e preserva correção e rascunho quando salvar falha',async()=>{
  const r=await stage79Project();guidedRecords=[r];const screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    await focusProject('observar');
    await act(async()=>document.querySelector('.observation-plan-create>summary').click());await flush();const plan=document.querySelector('.observation-plan-create form');
    for(const [label,value] of [['Nome do caderno','Duração das tentativas'],['Pergunta que esta coleta','Como comparar durações?'],['O que vou observar','Anotar tempo e consulta ao exemplo.'],['Unidade ou escala','minutos'],['Condições que vou','Registrar interrupções.'],['Limitações da coleta','As atividades são diferentes.']])await inputValue(personalControl(label,plan),value);
    await act(async()=>plan.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.observationPlans.length,1);assert.equal(r.observations,undefined);await act(async()=>document.querySelector('.observation-notebook>summary').click());await flush();await act(async()=>[...document.querySelectorAll('.observation-notebook summary')].find(s=>s.textContent==='Registrar a próxima observação').click());await flush();
    let row=document.querySelector('.observation-row-form');await inputValue(personalControl('Identificação da observação',row),'Primeira tentativa');await inputValue(personalControl('Valor em',row),'0');await act(async()=>row.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.observations[0].value,0);
    row=document.querySelector('.observation-row-form');await inputValue(personalControl('Identificação da observação',row),'Sem medida');await selectValue(personalControl('Este valor foi',row),'ausente');assert.equal(personalControl('Valor em',row).disabled,true);await inputValue(personalControl('Por que este dado',row),'Não registrei a duração.');await act(async()=>row.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.observations[1].value,null);assert.equal(document.querySelectorAll('.observation-chart circle').length,1);
    await act(async()=>button('Corrigir observação 1').click());row=document.querySelector('.observation-row-form');await inputValue(personalControl('Valor em',row),'4');await inputValue(personalControl('Por que estou corrigindo',row),'Conferi a anotação de tempo.');guidedWriteFailure=true;await act(async()=>row.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('Valor em',row).value,'4');guidedWriteFailure=false;await act(async()=>row.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.observations[0].value,0);assert.equal(r.observations[2].value,4);assert.equal(r.observations[2].replaces,r.observations[0].id);
    await act(async()=>[...document.querySelectorAll('.observation-notebook summary')].find(s=>s.textContent==='Escolher dados para uma seleção revisável').click());await flush();const selection=document.querySelector('.observation-selection-form');await inputValue(personalControl('Nome da seleção',selection),'Dois registros com limites');for(const box of selection.querySelectorAll('input[type=checkbox]'))await act(async()=>box.click());await inputValue(personalControl('Por que escolhi estes',selection),'Conferir os dois momentos.');await inputValue(personalControl('Limites que acompanham',selection),'Uma duração está ausente.');await act(async()=>selection.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.observationSelections[0].rows[0].value,4);assert.equal(r.observationSelections[0].rows[1].value,null);assert.equal(r.evidencePublications,undefined);assert.equal(requests.filter(v=>v.url.endsWith('/lumi')).length,0);
    const a=await axe.run(document.querySelector('.project-observations'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});
test('linha de argumentação exige trechos e prévia e mantém versão ao enviar produção',async()=>{
  const r=await stage79Project();guidedRecords=[r];const screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    await focusProject('argumentar');
    await act(async()=>document.querySelector('.argument-create>summary').click());await flush();const form=document.querySelector('.argument-version-form');await inputValue(personalControl('Nome desta linha',form),'Uma conclusão delimitada');await inputValue(personalControl('Afirmação que quero',form),'O recorte não representa toda a população.');await flush();await selectValue(personalControl('Versão que quero vincular',form),['projeto',r.id,'',r.entries[0].id].join(':'));await flush();const ev=document.querySelector('.argument-evidence-editor');await act(async()=>personalControl('Tentativa escolhida',ev).click());await inputValue(personalControl('Por que esta evidência',ev),'O registro reconhece os limites.');await inputValue(personalControl('Contraponto que preciso',form),'Talvez outros dados ampliem o recorte.');await inputValue(personalControl('Outra interpretação possível',form),'O efeito pode depender do contexto.');await inputValue(personalControl('Limites do que posso',form),'Não conheço o método completo.');
    await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.argumentVersions,undefined);assert.ok(document.querySelector('.argument-editor .argument-line'));assert.ok(!document.querySelector('.argument-editor .argument-line').textContent.includes('MOTIVO_QUE_NAO_ESCOLHI'));
    guidedWriteFailure=true;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('Afirmação que quero',form).value,'O recorte não representa toda a população.');guidedWriteFailure=false;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.argumentVersions.length,1);assert.equal(r.entries.length,1);
    await act(async()=>document.querySelector('.argument-saved>summary').click());await flush();await act(async()=>[...document.querySelectorAll('.argument-saved summary')].find(s=>s.textContent==='Levar esta versão para minha produção no projeto').click());await flush();const publication=document.querySelector('.argument-saved .project-evidence-publish form');await inputValue(personalControl('Por que este registro',publication),'Esta é minha versão conferida.');await act(async()=>publication.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.entries.length,2);assert.equal(r.entries[1].sourceArgument,r.argumentVersions[0].id);assert.equal(requests.filter(v=>v.url.endsWith('/lumi')).length,0);
    const a=await axe.run(document.querySelector('.project-arguments'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});
test('portfólio exige escolha de trechos e prévia, não salva automaticamente e conserva seleção na falha',async()=>{
  const r=await stage79Project();guidedRecords=[r];const screen=await renderRoute('/portfolio-investigacao');
  try{
    await inputValue(personalControl('Título do portfólio'),'Minha investigação');await inputValue(personalControl('O percurso que quero'),'Como confrontei uma afirmação.');
    await selectValue(personalControl('Versão que quero'),['projeto',r.id,'',r.entries[0].id].join(':'));await flush();
    const item=document.querySelector('.portfolio-item-editor');await inputValue(personalControl('Papel deste registro',item),'Conclusão provisória');await inputValue(personalControl('O que este registro demonstra',item),'Delimitei o que posso concluir.');await inputValue(personalControl('Limites que reconheço',item),'O recorte é pequeno.');
    assert.equal(button('Conferir a prévia da minha seleção').disabled,true);await act(async()=>personalControl('Tentativa escolhida',item).click());await inputValue(personalControl('O que concluo e'),'Ainda preciso examinar outro recorte.');const form=document.querySelector('.portfolio-editor form');await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.ok(document.querySelector('.portfolio-preview'));assert.ok(document.querySelector('.portfolio-preview').textContent.includes('TEXTO_QUE_ESCOLHI_PARA_PORTFOLIO'));assert.ok(!document.querySelector('.portfolio-preview').textContent.includes('MOTIVO_QUE_NAO_ESCOLHI'));assert.equal(guidedRecords.filter(v=>v.kind==='portfolio').length,0);
    guidedWriteFailure=true;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('Título do portfólio').value,'Minha investigação');assert.ok(document.querySelector('.portfolio-preview'));
    guidedWriteFailure=false;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();assert.equal(guidedRecords.filter(v=>v.kind==='portfolio').length,1);assert.ok(button('Exportar esta edição em PDF'));assert.equal(guidedRecords.find(v=>v.kind==='portfolio').editions[0].items[0].blocks.length,1);
    const a=await axe.run(document.querySelector('.portfolio-saved'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(a.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close()}
});
test('comparação planejada preserva rascunho, tentativas e decisão sem alterar repertório',async()=>{
  guidedRecords=await stage76Records();const r=guidedRecords[1],screen=await renderRoute('/como-aprendo?estrategia='+r.id);
  try{
    await act(async()=>document.querySelector('.experiment-create>summary').click());await flush();
    const form=document.querySelector('.experiment-create form');
    for(const [label,value] of [['Nome desta comparação','Conferir dois contextos'],['Dificuldade que quero','Conversão de unidades'],['O que espero','Identificar quando converter'],['O que as duas','Energia e duração'],['O que é diferente','Minutos e horas'],['Título da atividade 1','Um aparelho'],['Enunciado da atividade 1','Investigue durante 30 minutos.'],['Título da atividade 2','Outro aparelho'],['Enunciado da atividade 2','Investigue durante duas horas.']])await inputValue(personalControl(label,form),value);
    guidedWriteFailure=true;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('O que espero',form).value,'Identificar quando converter');assert.equal(r.experiments,undefined);
    guidedWriteFailure=false;await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.experiments.length,1);await act(async()=>document.querySelector('.experiment-saved>summary').click());await flush();
    for(const section of document.querySelectorAll('.experiment-activity')){
      const attemptForm=section.querySelector('form');for(const [label,value] of [['Minha resposta','Meu raciocínio nesta atividade.'],['Como apliquei','Conferi o tempo.'],['Apoios utilizados','Consultei um exemplo.'],['Condições da tentativa','Sem interrupções.'],['Dificuldade percebida','Ainda preciso interpretar os dados.']])await inputValue(personalControl(label,attemptForm),value);
      await act(async()=>attemptForm.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    }
    assert.equal(r.experiments[0].attempts.length,2);const compare=document.querySelector('.experiment-decision');
    await inputValue(personalControl('O que percebi',compare),'Precisei converter apenas no primeiro caso.');await inputValue(personalControl('Diferenças e limites',compare),'A segunda atividade já era familiar.');await inputValue(personalControl('Por que tomei',compare),'Quero testar em outro contexto.');await act(async()=>compare.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.equal(r.experiments[0].decisions.length,1);assert.equal(r.procedure,'Converter a duração antes de calcular.');assert.equal(requests.filter(v=>v.url.endsWith('/lumi')).length,0);
    const accessibility=await axe.run(document.querySelector('.learning-experiments'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(accessibility.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close();}
});
test('mesa de argumentação exige contexto confirmado e preserva contestação e versão autoral',async()=>{
  const paths=require('../src/services/personalLearningPaths'),day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()),r={id:'stage77-project',version:1,kind:'projeto',...await paths.create(900001,'projeto',{title:'Consumo',question:'Como comparar aparelhos?',scope:'Mesmo intervalo',subjects:['Física'],minutes:30,deliverable:'texto'},null,undefined,day)};
  await paths.apply(900001,r,'projeto',{action:'projectEntry',key:window.crypto.randomUUID(),stage:'producao',entryType:'producao',text:'Minha conclusão relaciona potência e duração.',sources:[]},null,undefined,day);r.stages=paths.stages;guidedRecords=[r];const screen=await renderRoute('/projetos-investigacao?projeto='+r.id);
  try{
    await focusProject('argumentar');
    await act(async()=>document.querySelector('.defence-create>summary').click());await flush();const create=document.querySelector('.defence-create form');await selectValue(personalControl('Produção de origem',create),r.entries[0].id);await inputValue(personalControl('Trecho exato',create),'relaciona potência e duração');await inputValue(personalControl('Afirmação que quero defender',create),'A duração precisa ser considerada.');await act(async()=>create.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.defences[0].turns.length,0);await act(async()=>document.querySelector('.defence-saved>summary').click());await flush();
    assert.equal(button('Pedir a primeira pergunta').disabled,true);await act(async()=>personalControl('Conferi o contexto').click());await act(async()=>button('Pedir a primeira pergunta').click());await flush();assert.equal(r.defences[0].turns.length,0);assert.ok(document.querySelector('.defence-preview'));await act(async()=>button('Guardar pergunta nesta conversa').click());await flush();assert.equal(r.defences[0].turns.length,1);
    const answer=document.querySelector('.defence-response');await selectValue(personalControl('Minha escolha',answer),'contestar');await inputValue(personalControl('Por que discordo',answer),'O trecho já delimita a duração.');guidedWriteFailure=true;await act(async()=>answer.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('Por que discordo',answer).value,'O trecho já delimita a duração.');guidedWriteFailure=false;await act(async()=>answer.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.defences[0].turns[0].events[0].type,'contestar');
    const revision=personalControl('Minha produção revisada').closest('form');await inputValue(personalControl('Minha produção revisada',revision),'Minha nova conclusão considera intervalos iguais.');await inputValue(personalControl('O que me fez rever',revision),'Explicitei a condição na conclusão.');await act(async()=>revision.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(r.entries.length,2);assert.equal(r.entries[0].text,'Minha conclusão relaciona potência e duração.');assert.equal(r.defences[0].revisions.length,1);assert.equal(r.next,null);
    const accessibility=await axe.run(document.querySelector('.conclusion-defences'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(accessibility.violations.map(v=>v.id),[]);
  }finally{guidedWriteFailure=false;guidedRecords=[];await screen.close();}
});

test('Como eu aprendo preserva rascunho na falha e registra reavaliação com a evidência original',async()=>{
  guidedRecords=[{id:'strategy-origin',version:1,kind:'evidencia',title:'Energia na prática',mode:'explicar',attempts:[{id:'strategy-attempt',text:'Minha explicação com potência e tempo.',created:new Date().toISOString()}]}];
  const screen=await renderRoute('/como-aprendo');
  try{
    await inputValue(personalControl('Um nome que faça'),'Conferir unidades');await inputValue(personalControl('Como faço, passo'),'Escrevo as unidades em cada etapa.');await inputValue(personalControl('Assunto'),'Energia');await inputValue(personalControl('Dificuldade que'),'Confundi kW e kWh.');await inputValue(personalControl('O que fiz e'),'Converter o tempo ajudou nesta questão.');
    await selectValue(personalControl('Registro que quero'),'caminho:strategy-origin:strategy-attempt');await flush();
    guidedWriteFailure=true;await act(async()=>document.querySelector('.strategy-create').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(personalControl('O que fiz e').value,'Converter o tempo ajudou nesta questão.');assert.ok(screen.container.textContent.includes('Não foi possível confirmar o envio.'));
    guidedWriteFailure=false;await act(async()=>document.querySelector('.strategy-create').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();assert.ok(document.querySelector('.strategy-notebook'));const record=guidedRecords.find(r=>r.kind==='estrategia');assert.equal(record.experiences[0].source.record,'strategy-origin');
    await act(async()=>[...document.querySelectorAll('summary')].find(n=>n.textContent.startsWith('Registrar outra experiência')).click());await selectValue(personalControl('É uma nova experiência'),record.experiences[0].id);await selectValue(personalControl('Como funcionou'),'nao_ajudou');await inputValue(personalControl('O que fiz e'),'Reavaliei: ainda preciso interpretar melhor os dados.');
    const form=personalControl('É uma nova experiência').closest('form');await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(record.experiences.length,2);assert.equal(record.experiences[0].outcome,'ajudou');assert.equal(record.experiences[1].outcome,'nao_ajudou');assert.equal(record.experiences[1].reassessOf,record.experiences[0].id);assert.equal(requests.filter(r=>r.url.endsWith('/lumi')&&r.method==='post').length,0);
  }finally{await screen.close();guidedRecords=[];guidedWriteFailure=false;}
});
test('projeto apresenta critérios desde o começo e só agenda o próximo passo após confirmação',async()=>{
  guidedRecords=[];const screen=await renderRoute('/projetos-investigacao');
  try{
    assert.ok(screen.container.textContent.includes('Reconhecimento dos limites'));await selectValue(personalControl('Começar por um modelo'),'energia');await act(async()=>document.querySelector('.project-create').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();const record=guidedRecords.find(r=>r.kind==='projeto');assert.ok(document.querySelector('.project-desk'));assert.equal(record.next,null);await focusProject('planejar');
    await selectValue(personalControl('Tipo de registro'),'hipotese');await inputValue(personalControl('Meu texto, cálculo'),'Acho que o tempo também muda o consumo.');await act(async()=>document.querySelector('.project-focus-panel:not([hidden]) .project-entry').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(record.entries.length,1);assert.equal(record.entries[0].type,'hipotese');
    await act(async()=>[...document.querySelectorAll('.project-next summary')][0].click());await inputValue(personalControl('O que vou fazer'),'Comparar dois períodos');await inputValue(personalControl('Por que este passo'),'Quero confrontar a primeira hipótese.');const form=personalControl('O que vou fazer').closest('form');assert.equal(requests.filter(r=>r.method==='patch'&&JSON.parse(r.data).action==='projectNext').length,0);await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(record.next.title,'Comparar dois períodos');
    await act(async()=>button('Registrei este próximo passo como realizado').click());await flush();assert.equal(record.next,null);assert.equal(record.actionHistory[0].outcome,'realizado');
    await focusProject('produzir');await inputValue(personalControl('Meu texto, cálculo'),'Meu relatório distingue potência, duração e energia, dentro das condições escolhidas.');await act(async()=>document.querySelector('.project-focus-panel:not([hidden]) .project-entry').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(record.entries[1].type,'producao');
    await act(async()=>[...document.querySelectorAll('.project-evaluation summary')][0].click());await inputValue(personalControl('O que esta investigação'),'Consegui comparar as condições; ainda não generalizo para todos os aparelhos.');const evaluation=personalControl('O que esta investigação').closest('form');await act(async()=>evaluation.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(record.status,'concluido');assert.equal(record.reviews.length,1);assert.equal(record.entries.length,2);
  }finally{await screen.close();guidedRecords=[];}
});

test('fechamento da prova mantém rascunho após falha e exige conferir a recuperação antes de aprovar',async()=>{
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
  const plan={...require('../src/services/guidedStudyService')._test.createPreparation({title:'Prova para refletir',date:require('../src/services/guidedStudyService')._test.dateAdd(day,14),minutes:40,days:[0,1,2,3,4,5,6],topics:[{title:'Energia',level:'seguro'}]}),id:'post-exam-fixture',kind:'prova',version:1};
  guidedRecords=[plan];const screen=await renderRoute('/preparacao-provas?plano=post-exam-fixture');
  try{
    await act(async()=>document.querySelector('.post-exam-entry>summary').click());
    const labels=[...document.querySelectorAll('.post-exam label')],worked=labels.find(l=>l.textContent.startsWith('O que consegui fazer')).querySelector('textarea');
    await inputValue(worked,'Consegui ler os dados, mas confundi as unidades.');
    await selectValue(document.querySelector('.post-exam select'),'dificuldade');
    guidedWriteFailure=true;
    await act(async()=>document.querySelector('.post-exam .guided-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.equal(worked.value,'Consegui ler os dados, mas confundi as unidades.');assert.ok(screen.container.textContent.includes('Não foi possível confirmar o envio.'));
    guidedWriteFailure=false;
    await act(async()=>document.querySelector('.post-exam .guided-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    assert.ok(screen.container.textContent.includes('Considerava seguro'));assert.ok(screen.container.textContent.includes('Tive dificuldade'));
    await act(async()=>[...document.querySelectorAll('.post-exam summary')].find(n=>n.textContent.includes('Escolher os próximos passos')).click());
    assert.equal(requests.filter(r=>r.method==='patch'&&JSON.parse(r.data).action==='approveRecovery').length,0);
    await act(async()=>document.querySelector('.investigation-recovery form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.ok(document.querySelector('.investigation-preview'));assert.equal(plan.recovery,undefined);
    await act(async()=>button('Confirmar estes passos na minha rotina').click());await flush();await flush();
    assert.ok(document.querySelector('.investigation-recovery-saved'));assert.equal(plan.recovery.tasks.length,1);
  }finally{await screen.close();guidedRecords=[];guidedWriteFailure=false;}
});
test('laboratório guarda tentativas, abre apoios gradualmente e preserva a condição anterior',async()=>{
  guidedRecords=[];const screen=await renderRoute('/laboratorio?caso=energia-cotidiano');
  try{
    assert.equal(document.querySelectorAll('.lab-catalog>article').length,3);
    await act(async()=>button('Começar esta investigação').click());await flush();await flush();
    assert.ok(document.querySelector('.lab-desk'));assert.equal(screen.container.textContent.includes('Total: 47,12'),false);
    await inputValue(document.querySelectorAll('.lab-entry textarea')[3],'A energia depende também do tempo de uso.');
    await act(async()=>document.querySelector('.lab-entry').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    await act(async()=>button('Abrir uma pergunta orientadora').click());await flush();
    assert.ok(screen.container.textContent.includes('Qual unidade de tempo'));assert.equal(screen.container.textContent.includes('Total: 47,12'),false);
    await act(async()=>button('Mudar uma condição').click());
    await inputValue(document.querySelectorAll('.lab-entry textarea')[3],'Com 8 minutos o consumo é menor.');
    await act(async()=>document.querySelector('.lab-entry').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    await inputValue(document.querySelector('.lab-parameter input'),'12');
    await act(async()=>document.querySelector('.lab-parameter').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.match(guidedRecords[0].attempts[1].prompt,/8 minutos/);assert.match(document.querySelector('.lab-problem').textContent,/12 minutos/);
    assert.equal(requests.filter(r=>r.url.endsWith('/lumi')&&r.method==='post').length,0);
    assert.ok(screen.container.textContent.includes('Nenhum outro registro da conta nem a resolução de referência é enviado.'));
  }finally{await screen.close();guidedRecords=[];}
});

test('preparação de prova preserva diagnóstico após falha, confirma envio e reorganiza dia perdido',async()=>{
  guidedRecords=[];guidedWriteFailure=false;
  const screen=await renderRoute('/preparacao-provas');
  try{
    const inputs=document.querySelectorAll('.guided-form input');
    await inputValue(inputs[0],'Prova de energia');await inputValue(inputs[1],require('../src/services/guidedStudyService')._test.dateAdd(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()),14));
    await inputValue(document.querySelector('fieldset input:not([type=checkbox])'),'Energia');
    await inputValue(document.querySelector('.guided-form textarea'),'Ainda confundo energia e força.');
    guidedWriteFailure=true;
    await act(async()=>document.querySelector('.guided-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.ok(screen.container.textContent.includes('Não foi possível confirmar o envio.'));assert.equal(document.querySelector('.guided-form textarea').value,'Ainda confundo energia e força.');
    guidedWriteFailure=false;
    await act(async()=>document.querySelector('.guided-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    assert.ok(document.querySelector('.guided-timeline'));assert.equal(guidedRecords.length,1);
    await act(async()=>button('Não consegui estudar hoje').click());await flush();
    assert.ok(requests.some(r=>r.method==='patch'&&JSON.parse(r.data).action==='replan'&&JSON.parse(r.data).minutes===0));
    assert.ok(screen.container.textContent.includes('Salvo na sua conta'));
  }finally{await screen.close();guidedRecords=[];guidedWriteFailure=false;}
});
test('entendimento permite quatro formas e guarda versões sem apagar a anterior',async()=>{
  guidedRecords=[];const screen=await renderRoute('/meu-entendimento');
  try{
    assert.equal(document.querySelectorAll('.guided-form select option').length,4);
    await inputValue(document.querySelector('.guided-form input'),'Energia e trabalho');
    await act(async()=>document.querySelector('.guided-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    await inputValue(document.querySelector('.guided-cycle .guided-form textarea'),'Minha primeira explicação com exemplo.');
    await act(async()=>document.querySelector('.guided-cycle .guided-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    await inputValue(document.querySelector('.guided-cycle .guided-form textarea'),'Minha segunda explicação mais precisa.');
    await act(async()=>document.querySelector('.guided-cycle .guided-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    assert.equal(guidedRecords[0].attempts.length,2);assert.equal(guidedRecords[0].attempts[0].text,'Minha primeira explicação com exemplo.');assert.notEqual(guidedRecords[0].attempts[0].id,guidedRecords[0].attempts[1].id);
    assert.equal(requests.filter(r=>r.url.endsWith('/lumi')&&r.method==='post').length,0);
    assert.ok(screen.container.textContent.includes('Nenhum outro registro da conta é consultado.'));
  }finally{await screen.close();guidedRecords=[];}
});

test('today highlights the pending lesson and saves a routine adjustment only after confirmation', async () => {
  dailySchedulesFixture = [{ id_cronograma: 11, status: 'ATIVO', dias: [{ id_dia: 51, data_estudo: new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo"}).format(new Date()), tempo_previsto: 60, concluido: 0, conteudos: [{ id: 70, titulo: 'Concluído', concluido: 1 }, { id: 71, id_conteudo: 7, titulo: 'Funções na prática', disciplina: 'Matemática', concluido: 0 }, { id: 72, titulo: 'Revisar equações', concluido: 0 }] }] }];
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Funções na prática'));
    assert.ok(screen.container.textContent.includes('30 min previstos para esta sessão'));
    assert.ok([...document.querySelectorAll('button')].some(node => node.textContent.includes('Continuar meus estudos')));
    const adjust = [...document.querySelectorAll('button')].find(node => node.textContent.includes('Hoje só tenho 20 minutos'));
    await act(async () => adjust.click());
    assert.ok(document.querySelector('[aria-label="Conferir ajuste"]'));
    assert.equal(requests.filter(req => req.url.endsWith('/ajustar')).length, 0);
    await act(async () => button('Cancelar').click());
    assert.equal(document.querySelector('[aria-label="Conferir ajuste"]'), null);
    await act(async () => adjust.click());
    await act(async () => button('Confirmar ajuste').click());
    await flush();
    const saved = requests.find(req => req.url.endsWith('/dias/51/ajustar'));
    assert.equal(saved.method, 'post');
    assert.equal(JSON.parse(saved.data).acao, 'REDUZIR');
    assert.ok(screen.container.textContent.includes('Seu dia foi ajustado e salvo.'));
  } finally { await screen.close(); dailySchedulesFixture = []; }
});

test('landing menu separates account access and closes with Escape or section navigation', async () => {
  const screen = await renderRoute('/');
  try {
    const menu = document.querySelector('.study-menu');
    const toggle = menu.querySelector('summary');
    await act(async () => toggle.click());
    assert.equal(menu.open, true);
    assert.equal(menu.querySelector('a[href="/register"]').textContent, 'Criar minha conta ↗');
    await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(menu.open, false);
    assert.equal(document.activeElement, toggle);
    await act(async () => toggle.click());
    await act(async () => button('Conheça a Lumi').click());
    assert.equal(menu.open, false);
    assert.equal(document.activeElement.id, 'lumi');
    assert.equal(document.querySelector('form'), null);
    assert.ok(document.querySelector('.study-actions a[href="/register"]'));
  } finally { await screen.close(); }
});
async function inputValue(element, value) { await act(async () => { const setter = Object.getOwnPropertyDescriptor(element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set; setter.call(element, value); element.dispatchEvent(new window.Event('input', { bubbles: true })); }); }
async function selectValue(element,value){await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set.call(element,value);element.dispatchEvent(new window.Event('change',{bubbles:true}))})}

test('class management opens details and reveals creation on demand', async () => {
  const screen = await renderRoute('/turmas', 'dono');
  try {
    assert.equal(document.querySelectorAll('.class-card').length, 1);
    assert.equal(document.querySelector('.class-form'), null);
    await act(async () => document.querySelector('.class-card').click());
    assert.equal(document.querySelector('.class-details h2').textContent, 'Terceiro A');
    await act(async () => button('Criar turma ↗').click());
    assert.ok(document.querySelector('.class-form'));
  } finally { await screen.close(); }
});

test('activity management guides the first creation into the editor', async () => {
  const screen = await renderRoute('/atividades', 'docente');
  try {
    assert.ok(screen.container.textContent.includes('Sua primeira atividade, passo a passo.'));
    await act(async () => button('Montar primeira atividade →').click());
    assert.ok(screen.container.textContent.includes('Nova atividade'));
    assert.ok(document.querySelector('.activity-question-editor'));
  } finally { await screen.close(); }
});

test('materials library opens a missing resource and allows adding a reference', async () => {
  materialCatalogFixture = true;
  const screen = await renderRoute('/materiais', 'docente');
  try {
    assert.ok(screen.container.textContent.includes('Precisa de material'));
    await act(async () => document.querySelector('.materials-card').click());
    assert.equal(document.querySelector('[role="dialog"] h2').textContent, 'Leis de Newton');
    await act(async () => [...document.querySelectorAll('.materials-dialog button')].find(node => node.textContent.includes('Adicionar recurso')).click());
    assert.equal(document.querySelectorAll('.materials-extra').length, 1);
  } finally { await screen.close(); materialCatalogFixture = false; }
});

test('people directory groups account actions without changing permissions', async () => {
  const screen = await renderRoute('/usuarios', 'dono');
  try {
    assert.ok(screen.container.textContent.includes('Pessoas e acessos'));
    const menu = document.querySelector('.users-actions');
    assert.ok(menu);
    await act(async () => menu.querySelector('summary').click());
    assert.equal(menu.open, true);
    assert.ok([...menu.querySelectorAll('button')].some(node => node.textContent.trim() === 'Definir senha'));
    assert.ok(menu.querySelector('button').disabled);
  } finally { await screen.close(); }
});

test('all student, teacher and owner pages render without runtime failures', async t => {
  const routes = ['/', '/login', '/register', '/primeiro-acesso', '/onboarding', '/esqueci-senha', '/redefinir-senha', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/minha-jornada', '/minhas-atividades', '/minhas-turmas', '/minhas-turmas/1', '/avisos', '/perfil', '/alterar-senha', '/planejamento-inteligente', '/estudar', '/status', '/lumi', '/chat', '/preferencias', '/pagina-inexistente'];
  for (const route of routes) await t.test(route, async () => { const screen = await renderRoute(route); try { assert.ok(document.querySelector('h1'), 'page must have a visible title'); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.'), 'error boundary should not be shown'); } finally { await screen.close(); } });
  for (const [route, role] of [['/dashboard-gestor', 'docente'], ['/turmas', 'docente'], ['/atividades', 'docente'], ['/materiais', 'docente'], ['/usuarios', 'admin'], ['/dono', 'dono'], ['/dono/usuarios', 'dono']]) await t.test(`${role}: ${route}`, async () => { const screen = await renderRoute(route, role); try { assert.ok(document.querySelector('h1')); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.')); } finally { await screen.close(); } });
  for (const route of ['/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/planejamento-inteligente', '/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono', '/lumi', '/preferencias', '/perfil']) await t.test(`dono: ${route}`, async () => { const screen = await renderRoute(route, 'dono'); try { assert.ok(document.querySelector('h1')); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.')); } finally { await screen.close(); } });
});
test('reading controls apply, persist and reset preferences', async () => {
  const screen = await renderRoute('/preferencias');
  try {
    const focus = [...document.querySelectorAll('label')].find(node => node.textContent.includes('Modo foco')).querySelector('input');
    await act(async () => focus.click());
    assert.ok(document.documentElement.classList.contains('a11y-focus'));
    assert.equal(JSON.parse(localStorage.getItem('planejai:accessibility')).focusMode, true);
    await act(async () => button('Restaurar preferências de leitura').click());
    assert.ok(!document.documentElement.classList.contains('a11y-focus'));
    assert.equal(document.documentElement.style.getPropertyValue('--a11y-line-height'), '1.75');
    const input = document.getElementById('custom-color-hex');
    await inputValue(input, '#52796F');
    await act(async () => input.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(localStorage.getItem('planejai:cor-custom'), '#52796F');
    assert.ok(document.documentElement.style.getPropertyValue('--pn-primaria'));
    for (const [kebab, camel] of [['primaria-suave', 'primariaSuave'], ['primaria-borda', 'primariaBorda'], ['texto-suave', 'textoSuave'], ['superficie-alt', 'superficieAlt'], ['borda-forte', 'bordaForte'], ['on-primaria', 'onPrimaria']]) {
      const value = document.documentElement.style.getPropertyValue(`--pn-${kebab}`);
      assert.match(value, /^#[0-9a-f]{6}$/i, `theme must publish ${kebab}`);
      assert.equal(value, document.documentElement.style.getPropertyValue(`--pn-${camel}`));
      assert.match(document.documentElement.style.getPropertyValue(`--pn-${kebab}-rgb`), /^\d+ \d+ \d+$/);
    }
  } finally { await screen.close(); }
});
test('login and registration previews switch study stages without submitting forms', async () => {
  for (const route of ['/login', '/register']) {
    const screen = await renderRoute(route);
    try {
      const tabs = [...document.querySelectorAll('.auth-journey-tabs button')];
      assert.equal(tabs.length, 3);
      assert.equal(tabs[0].getAttribute('aria-pressed'), 'true');
      await act(async () => tabs[1].click());
      assert.equal(tabs[1].getAttribute('aria-pressed'), 'true');
      assert.match(document.querySelector('.auth-journey-copy h2').textContent, /Prática/);
      assert.equal(requests.filter(request => request.method === 'post').length, 0);
    } finally { await screen.close(); }
  }
});
test('owner can navigate through the main study and management links', async () => {
  const screen = await renderRoute('/inicio', 'dono');
  try {
    for (const path of ['/cronograma', '/aprendizagem', '/provas', '/redacoes', '/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono']) {
      const link = document.querySelector(`#app-sidebar a[href="${path}"]`);
      assert.ok(link, `missing navigation link ${path}`);
      await act(async () => link.click());
      await flush();
      if (path === '/usuarios') await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
      assert.ok(document.querySelector('h1'), `missing title at ${path}: ${screen.container.textContent.slice(0, 300)}`);
      assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.'), `error boundary at ${path}`);
    }
  } finally { await screen.close(); }
});
test('writing guidance opens Lumi with an editable question about ENEM essays', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    const link = [...document.querySelectorAll('a')].find(item => item.textContent.includes('Destrave seu argumento'));
    assert.ok(link, 'writing guidance should link to Lumi');
    await act(async () => link.click());
    await flush();
    const input = document.getElementById('lumi-message');
    assert.ok(input, 'Lumi should show a message field');
    assert.match(input.value, /tese.*argumentos/i);
  } finally { await screen.close(); }
});
test('writing workshop opens staged fields without hiding the essay history', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    const open = button('Abrir oficina →');
    assert.ok(open);
    await act(async () => open.click());
    assert.ok(document.querySelector('input[placeholder*="inclusão digital"]'));
    const argumentsStep = [...document.querySelectorAll('.writing-workshop-body nav button')].find(item => item.textContent.includes('Argumentos'));
    await act(async () => argumentsStep.click());
    assert.ok(document.querySelector('textarea[placeholder*="primeira causa"]'));
    assert.ok(document.getElementById('redacoes-historico'));
  } finally { await screen.close(); }
});
test('legacy progress link opens study tools with goals, cards and trails intact', async () => {
  const screen = await renderRoute('/planejamento-inteligente');
  try {
    assert.ok(screen.container.textContent.includes('Prepare o jeito de aprender'));
    await act(async () => button('Metas e diagnóstico').click());
    assert.ok(screen.container.textContent.includes('Diagnóstico inicial'));
    assert.ok(screen.container.textContent.includes('Meta por matéria'));
    await act(async () => button('Cartões e pesquisa').click());
    assert.ok(document.getElementById('progress-search-input'));
    assert.ok(screen.container.textContent.includes('Meus cartões de revisão'));
    await act(async () => button('Trilhas e recomendações').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Progresso que vira ação'));
  } finally { await screen.close(); }
});

test('secondary study tools are reachable from their parent and loaded on demand', async () => {
  const screen = await renderRoute('/inicio');
  try {
    assert.equal(document.querySelector('.sd-navigation a[href="/sessao-guiada"]'), null);
    await act(async () => button('Montar sessão guiada').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Quanto tempo você tem'));
    assert.equal(document.querySelector('.sd-navigation a[aria-current="page"]')?.textContent, 'Hoje');
    await act(async () => button('← Voltar para Hoje').click());
    await flush();
    assert.ok(screen.container.textContent.includes('HOJE · UM PASSO DE CADA VEZ'));
    await act(async () => document.querySelector('.sd-navigation a[href="/aprendizagem"]').click());
    await flush();
    await act(async () => document.querySelector('a[href="/ferramentas-estudo"]').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Prepare o jeito de aprender'));
    assert.equal(document.querySelector('.sd-navigation a[aria-current="page"]')?.textContent, 'Praticar e revisar');
    const count = () => requests.filter(request => /\/inteligencia\/(flashcards|provas)$/.test(request.url)).length;
    assert.equal(count(), 0);
    await act(async () => button('Cartões e pesquisa').click());
    await flush();
    assert.equal(count(), 1);
    assert.equal(requests.filter(request=>request.url.endsWith('/aprendizagem/cartoes')).length,1);
    await act(async () => button('Metas e diagnóstico').click());
    await act(async () => button('Cartões e pesquisa').click());
    await flush();
    assert.equal(count(), 1, 'loaded exam tools are not fetched repeatedly');
    assert.equal(requests.filter(request=>request.url.endsWith('/aprendizagem/cartoes')).length,2,'reopening the library checks for cards changed in another screen');
  } finally { await screen.close(); }
});
test('pedagogical view presents actionable alerts and prevents duplicate intervention', async () => {
  const screen = await renderRoute('/dashboard-gestor', 'docente');
  try {
    assert.ok(screen.container.textContent.includes('Estudantes que pedem atenção'));
    assert.ok(screen.container.textContent.includes('Aluno de teste'));
    const action = button('Criar plano de intervenção →');
    assert.ok(action);
    await act(async () => action.click());
    await flush();
    assert.ok(button('Plano registrado →')?.disabled);
    assert.ok(requests.some(item => item.url.endsWith('/colaborativo/gestao/intervencoes') && item.method === 'post'));
  } finally { await screen.close(); }
});
test('Lumi starters prepare a question, then send one request and render safe structured text', async () => {
  failChat = false;
  const screen = await renderRoute('/lumi');
  try {
    assert.ok(screen.container.textContent.includes('EXPLORAR UMA DÚVIDA'));
    assert.equal(document.querySelectorAll('.lumi-starters button').length, 4);
    const starter = [...document.querySelectorAll('.lumi-starters button')][0];
    await act(async () => starter.click());
    const textarea = document.getElementById('lumi-message');
    assert.match(textarea.value, /funções do 2º grau/);
    assert.equal(requests.filter(request => request.method === 'post').length, 0, 'a suggestion must not send without confirmation');
    await act(async () => textarea.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(requests.filter(request => request.method === 'post').length, 1);
    assert.ok(document.querySelector('.lumi-message').textContent.includes('Uma **ideia** de cada vez.'));
    assert.equal(document.querySelectorAll('.lumi-feed script').length, 0);
    assert.ok(document.querySelector('.lumi-feed').textContent.includes('<script>unsafe()</script>'));
  } finally { await screen.close(); }
});
test('Lumi keeps the original portrait without reactions or a floating button', async () => {
  const screen = await renderRoute('/lumi');
  try {
    assert.equal(button('Pergunte à Lumi'), undefined);
    assert.ok(document.querySelector('.lumi-portrait img[src$="images/lumi-transparent.png"]'));
    assert.equal(document.querySelector('.lumi-mood'), null);
    assert.equal(document.querySelector('[class*="lumi-cat--feliz"], [class*="lumi-cat--raiva"]'), null);
  } finally { await screen.close(); }
});
test('chat adapts its wording to the chosen pronoun and stays neutral without a preference', async () => {
  for (const [pronome, frase] of [[undefined, 'Vamos pensar nisso?'], ['ela_dela', 'Vamos pensar juntas?'], ['ele_dele', 'Vamos pensar juntos?'], ['elu_delu', 'Vamos pensar juntes?'], ['nome_proprio', 'Vamos pensar nisso?']]) {
    const screen = await renderRoute('/lumi', 'aluno', { pronome });
    try { assert.ok(screen.container.textContent.includes(frase), `pronome ${pronome || 'não informado'}`); }
    finally { await screen.close(); }
  }
});
test('profile saves the optional pronoun preference to the signed-in account', async () => {
  const screen = await renderRoute('/perfil');
  try {
    const pronounSelect = [...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Pronomes'));
    assert.ok(pronounSelect);
    const preview = document.querySelector('.profile-pronoun-preview');
    assert.ok(preview?.textContent.includes('Vamos pensar nisso?'));
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(pronounSelect, 'elu_delu'); pronounSelect.dispatchEvent(new window.Event('change', { bubbles: true })); });
    assert.ok(preview.textContent.includes('Vamos pensar juntes?'));
    assert.ok(preview.textContent.includes('A preferência só muda no perfil quando você salvar'));
    await act(async () => button('Salvar alterações').click());
    await flush();
    assert.equal(JSON.parse(localStorage.getItem('user')).pronome, 'elu_delu');
    assert.ok(requests.some(request => request.method === 'put' && request.url.endsWith('/usuarios/900001')));
  } finally { await screen.close(); }
});
test('profile accepts custom pronouns without making the field required', async () => {
  const screen = await renderRoute('/perfil');
  try {
    const pronounSelect = [...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Pronomes'));
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(pronounSelect, 'personalizado'); pronounSelect.dispatchEvent(new window.Event('change', { bubbles: true })); });
    const customInput = document.querySelector('input[placeholder="Ex.: they/them, xe/xem ou ela/elu"]');
    assert.ok(customInput);
    assert.ok(screen.container.textContent.includes('Vamos pensar nisso?'));
    await inputValue(customInput, 'they/them');
    assert.ok(screen.container.textContent.includes('Preferência informada: they/them.'));
    await act(async () => button('Salvar alterações').click());
    await flush();
    assert.equal(JSON.parse(localStorage.getItem('user')).pronome, 'they/them');
    assert.ok(requests.some(request => request.method === 'put' && request.url.endsWith('/usuarios/900001') && JSON.parse(request.data).pronome === 'they/them'));
    assert.ok(document.querySelector('.save-feedback[data-state="saved"]'));
  } finally { await screen.close(); }
});
test('study room teaches the scheduled topic and gives Lumi its subject context', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' }, dia: { data_estudo: '2026-10-22' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('O que você precisa aprender'));
    assert.ok(screen.container.textContent.includes('Roteiro de estudo'));
    assert.ok(screen.container.querySelector('.study-desk-lumi'));
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    await flush();
    assert.equal(screen.container.querySelector('.session-timer'), null);
    const message = document.getElementById('lumi-message');
    await inputValue(message, 'Não entendi a primeira lei.');
    await act(async () => message.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    const request = requests.find(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat'));
    assert.deepEqual(JSON.parse(request.data).estudoAtual, { titulo: 'Leis de Newton', disciplina: 'Física', data: '2026-10-22' });
    assert.equal(JSON.parse(request.data).disciplina, 'Física');
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});
test('reading mode and collapsed Lumi preserve question and note drafts without sending them', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(!document.getElementById('lumi-message'));
    assert.equal(requests.filter(item => item.url.endsWith('/inteligencia/chat')).length,0);
    await act(async () => document.querySelector('.study-desk-note-link button').click());
    await flush();
    await inputValue(document.querySelector('.session-notes textarea'),'Minha ideia sobre inércia.');
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    await flush();
    await inputValue(document.getElementById('lumi-message'),'Uma dúvida ainda não enviada.');
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    assert.equal(document.getElementById('study-desk-lumi-body').hidden,true);
    await act(async () => button('Modo leitura').click());
    assert.equal(document.querySelector('.session-tools').hidden,true);
    assert.equal(document.querySelector('.session-notes textarea').value,'Minha ideia sobre inércia.');
    await act(async () => button('Sair do modo leitura').click());
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    assert.equal(document.getElementById('lumi-message').value,'Uma dúvida ainda não enviada.');
    assert.equal(requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).length,0);
    const result = await axe.run(document.querySelector('.study-desk'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(item => item.id),[]);
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('weekly schedule navigates and opens details without unlocking or writing the plan', async () => {
  const monday = new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date())+'T12:00:00Z');
  monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
  const firstDate=monday.toISOString().slice(0,10);
  monday.setUTCDate(monday.getUTCDate()+7);
  const secondDate=monday.toISOString().slice(0,10);
  dailySchedulesFixture = [{id_cronograma:11,status:'ATIVO',dias:[
    {id_dia:51,data_estudo:firstDate,tempo_previsto:25,concluido:0,conteudos:[{id:71,titulo:'Leitura de gráficos',disciplina:'Matemática',concluido:0}]},
    {id_dia:52,data_estudo:secondDate,tempo_previsto:40,concluido:0,bloqueado:true,conteudos:[{id:72,titulo:'Geometria',disciplina:'Matemática',concluido:0}]}
  ]}];
  const screen = await renderRoute('/cronograma');
  try {
    const before = requests.length;
    await act(async () => button('Semana').click());
    assert.equal(document.querySelectorAll('.schedule-week-day').length,7);
    assert.equal(localStorage.getItem('900001:schedule-view'),'week');
    assert.equal(localStorage.getItem('900002:schedule-view'),null);
    assert.ok(document.querySelector('.schedule-week').textContent.includes('25 min planejados'));
    await act(async () => document.querySelector('[aria-label="Próxima semana"]').click());
    assert.ok(document.querySelector('.schedule-week').textContent.includes('40 min planejados'));
    assert.equal(document.querySelector('[aria-label="Próxima semana"]').disabled,true);
    const result = await axe.run(document.querySelector('.schedule-week'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(item => item.id),[]);
    await act(async () => document.querySelector('.schedule-week-entry button').click());
    await flush();
    assert.ok(document.querySelector('#schedule-day-52').classList.contains('is-locked'));
    assert.ok(!document.querySelector('#schedule-day-52 .schedule-day-content'));
    assert.equal(document.activeElement,document.querySelector('#schedule-day-52 h3'));
    await act(async () => button('Semana').click());
    assert.ok(document.querySelector('.schedule-week').textContent.includes('40 min planejados'));
    await act(async () => document.querySelector('[aria-label="Semana anterior"]').click());
    await act(async () => document.querySelector('.schedule-week-entry button').click());
    await flush();
    assert.equal(document.activeElement,document.querySelector('#schedule-day-51 h3'));
    assert.ok(document.querySelector('#schedule-day-51 .schedule-day-content'));
    assert.equal(requests.length,before,'switching views uses the loaded plan without API calls');
  } finally { dailySchedulesFixture=[]; await screen.close(); }
});

test('a provider failure leaves the question available to retry', async () => {
  failChat = true;
  const screen = await renderRoute('/lumi');
  try {
    const textarea = document.getElementById('lumi-message');
    await inputValue(textarea, 'Como estudar frações?');
    await act(async () => textarea.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(textarea.value, 'Como estudar frações?');
    assert.ok(screen.container.textContent.includes('Lumi temporariamente indisponível.'));
    assert.equal(document.querySelectorAll('.lumi-message--user').length, 0);
  } finally { await screen.close(); failChat = false; }
});

test('session Lumi shortcuts stay available and send the current topic exactly once', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' }, dia: { data_estudo: '2026-10-22' } }));
  const screen = await renderRoute('/estudar');
  try {
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    await flush();
    for (const label of ['Explique de outro jeito', 'Dê um exemplo', 'Confira se entendi']) {
      const before = requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).length;
      await act(async () => button(label).click());
      await flush();
      const sent = requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat'));
      assert.equal(sent.length, before + 1);
      const payload = JSON.parse(sent.at(-1).data);
      assert.ok(payload.mensagem.includes('Leis de Newton'));
      assert.equal(payload.disciplina, 'Física');
      assert.equal(payload.estudoAtual.titulo, 'Leis de Newton');
      if (label === 'Confira se entendi') assert.ok(payload.mensagem.includes('Não revele a resposta agora'));
      assert.ok(button(label), 'shortcuts remain after a reply');
    }
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('a student cannot open management pages through a direct URL', async () => {
  const screen = await renderRoute('/usuarios', 'aluno');
  try {
    assert.ok(!screen.container.textContent.includes('Painel de Usuários'));
    assert.ok(!requests.some(request => request.url.endsWith('/usuarios')));
    assert.ok(screen.container.textContent.includes('Bom dia') || screen.container.textContent.includes('Boa tarde') || screen.container.textContent.includes('Boa noite'));
  } finally { await screen.close(); }
});
test('owner counters use totals instead of the paginated user slice', async () => {
  const screen = await renderRoute('/dono', 'dono');
  try { assert.ok(screen.container.textContent.includes('17')); assert.ok(screen.container.textContent.includes('15')); }
  finally { await screen.close(); }
});

test('schedule keeps the planned calendar date instead of moving it to the previous day', async () => {
  dailySchedulesFixture = [{ id_cronograma: 11, status: 'ATIVO', dias: [{ id_dia: 51, data_estudo: '2026-10-24', tempo_previsto: 25, concluido: 0, conteudos: [{ id: 71, titulo: 'Leitura de gráficos', disciplina: 'Matemática', concluido: 0 }] }] }];
  const screen = await renderRoute('/cronograma');
  try {
    assert.ok(document.querySelector('.schedule-journey-card').textContent.includes('24/10'));
    assert.ok(document.querySelector('.schedule-day').textContent.includes('24/10'));
  } finally { dailySchedulesFixture = []; await screen.close(); }
});

test('a schedule load failure cannot pretend the saved plan is empty and offers recovery', async () => {
  failScheduleLoad = true;
  const screen = await renderRoute('/cronograma');
  try {
    assert.ok(document.querySelector('.recovery-state'));
    assert.equal(document.querySelector('.schedule-page .empty-workspace'), null);
    assert.equal(button('Montar meu cronograma'),undefined);
    assert.ok(button('Tentar novamente'));
  } finally { failScheduleLoad=false;await screen.close(); }
});

test('a failed exam history is an error rather than an empty history', async () => {
  failExamLoad = true;
  const screen = await renderRoute('/provas');
  try {
    assert.ok(document.querySelector('.recovery-state'));
    assert.ok(screen.container.textContent.includes('suas tentativas não puderam ser carregados'));
    assert.ok(button('Tentar novamente'));
  } finally { failExamLoad=false;await screen.close(); }
});

test('today does not report zero progress or reviews up to date when the summary fails',async()=>{
  failLearningLoad=true;
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Seu progresso não pôde ser consultado.'));
    assert.ok(!document.querySelector('[aria-label="Progresso da meta semanal"]'));
    assert.ok(!screen.container.textContent.includes('Revisões em dia'));
  } finally {failLearningLoad=false;await screen.close();}
});

test('in-page study links keep the router address and move keyboard focus to the requested section', async () => {
  for (const [route,role,target] of [['/provas','aluno','laboratorio-provas'],['/redacoes','aluno','redacoes-historico'],['/dashboard-gestor','dono','pedagogy-priorities']]) {
    const screen=await renderRoute(route,role);
    try {
      const section=document.getElementById(target);
      const link=[...document.querySelectorAll('a')].find(node=>node.getAttribute('href')===`#${route}`);
      assert.ok(link);
      await act(async()=>link.click());
      assert.equal(document.activeElement.id,target);
      assert.equal(section.getAttribute('tabindex'),'-1');
      assert.ok(!screen.container.textContent.includes('Página não encontrada'));
    } finally {await screen.close();}
  }
});

test('owner operations panel opens the people directory', async () => {
  const screen = await renderRoute('/dono', 'dono');
  try {
    assert.ok(screen.container.textContent.includes('Operação da plataforma'));
    await act(async () => button('Abrir pessoas e acessos ↗').click());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
    assert.ok(screen.container.textContent.includes('Diretório de pessoas'));
  } finally { await screen.close(); }
});

test('support preserves a failed message and confirms receipt only after server success', async () => {
  supportMode = 'failed';
  const screen = await renderRoute('/preferencias');
  try {
    const panel = document.querySelector('.support-panel');
    const input = panel.querySelector('textarea');
    await inputValue(input, 'Minha mensagem de ajuda.');
    await act(async () => panel.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(input.value, 'Minha mensagem de ajuda.');
    assert.ok(panel.textContent.includes('Atendimento indisponível.'));
    assert.ok(!panel.textContent.includes('recebido'));
    supportMode = 'saved';
    await act(async () => panel.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(input.value, '');
    assert.ok(panel.textContent.includes('Pedido #81 recebido'));
    assert.ok(panel.textContent.includes('Minha mensagem de ajuda.'));
  } finally { supportMode = ''; await screen.close(); }
});

test('focus mode always offers a direct way back to navigation', async () => {
  const screen = await renderRoute('/preferencias');
  try {
    const focus = [...document.querySelectorAll('label')].find(node => node.textContent.includes('Modo foco')).querySelector('input');
    await act(async () => focus.click());
    assert.ok(document.documentElement.classList.contains('a11y-focus'));
    await act(async () => button('Sair do modo foco').click());
    assert.ok(!document.documentElement.classList.contains('a11y-focus'));
    assert.equal(JSON.parse(localStorage.getItem('planejai:accessibility')).focusMode, false);
  } finally { await screen.close(); }
});

test('mobile menu traps keyboard focus, closes with Escape and restores the page', async () => {
  const originalMedia = window.matchMedia;
  window.matchMedia = query => ({ ...originalMedia(query), matches: query.includes('max-width: 1023px') });
  const screen = await renderRoute('/inicio');
  try {
    const trigger = document.querySelector('.sd-mobile-menu');
    trigger.focus();
    await act(async () => trigger.click());
    const sidebar = document.getElementById('app-sidebar');
    assert.ok(sidebar.classList.contains('is-open'));
    assert.equal(document.body.style.overflow, 'hidden');
    assert.equal(document.querySelector('.app-workspace').inert, true);
    const links = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
    links.at(-1).focus();
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', cancelable: true })));
    assert.equal(document.activeElement, links[0]);
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', cancelable: true })));
    assert.ok(!sidebar.classList.contains('is-open'));
    assert.equal(document.querySelector('.app-workspace').inert, false);
    assert.equal(document.body.style.overflow, '');
    assert.equal(document.activeElement, trigger);
  } finally { await screen.close(); window.matchMedia = originalMedia; }
});

test('unified search submits content queries, keeps page shortcuts and avoids fetching while typing', async () => {
  const screen=await renderRoute('/inicio');
  try {
    await act(async()=>document.querySelector('.sd-search-trigger').click());
    assert.ok(screen.container.textContent.includes('Buscar no meu acervo'));
    await inputValue(document.querySelector('.sd-search input'),'Newton');
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,0);
    await act(async()=>document.querySelector('.sd-search form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    await flush();await flush();
    assert.ok(document.querySelector('.unified-search'));
    assert.ok(document.querySelector('.unified-search-status').textContent.includes('Newton'));
    assert.equal(requests.find(item=>item.url.endsWith('/busca')).cache,false);
    const before=requests.filter(item=>item.url.endsWith('/busca')).length;
    await inputValue(document.getElementById('unified-query'),'inércia');
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,before);
    const result=await axe.run(document.querySelector('.unified-search'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(item=>item.id),[]);
  } finally {await screen.close();}
});

test('search opens personal notes in their editor and rechecks material access', async () => {
  window.sessionStorage.clear();
  const screen=await renderRoute('/busca?q=Newton&tipo=anotacoes');
  try {
    await act(async()=>button('Ver anotação +').click());await flush();
    assert.ok(requests.some(item=>item.url.endsWith('/busca/conteudos/9')&&item.cache===false));
    await act(async()=>document.querySelector('.search-content-details a').click());await flush();await flush();
    assert.ok(document.querySelector('.session-notes textarea'));
    assert.equal(requests.filter(item=>item.method==='post').length,0);
  } finally {await screen.close();window.sessionStorage.clear();}
});

test('search filters paginate and an older slow response cannot replace the current results', async () => {
  searchMode='slow';
  const screen=await renderRoute('/busca?q=antiga');
  try {
    await inputValue(document.getElementById('unified-query'),'Newton');
    await act(async()=>document.querySelector('.unified-search-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    await flush();
    await act(async()=>deferredSearch({query:'antiga',grupos:[]}));await flush();
    assert.ok(document.querySelector('.unified-search-status').textContent.includes('Newton'));
    await act(async()=>document.querySelector('.unified-search-filters button:nth-child(3)').click());await flush();
    await act(async()=>button('Próximos →').click());await flush();
    const last=requests.filter(item=>item.url.endsWith('/busca')).at(-1);
    assert.equal(last.params.tipo,'materiais');assert.equal(last.params.pagina,2);
    assert.ok(button('← Anteriores'));
  } finally {searchMode='';await screen.close();}
});

test('search failures preserve input and retry without pretending the account has no matches', async () => {
  searchMode='failed';
  const screen=await renderRoute('/busca?q=Newton');
  try {
    assert.ok(screen.container.textContent.includes('Não conseguimos consultar seu acervo.'));
    assert.equal(document.getElementById('unified-query').value,'Newton');
    assert.ok(!screen.container.textContent.includes('Nenhum resultado nesta busca.'));
    searchMode='ready';await act(async()=>document.querySelector('.unified-search-empty button').click());await flush();
    assert.ok(document.querySelector('a[href="/redacoes?redacao=81"]'),screen.container.textContent.slice(-1800));
    await act(async()=>document.querySelector('a[href="/redacoes?redacao=81"]').click());await flush();await flush();
    assert.ok(document.querySelector('#essay-record-81 .essay-record__details'));
  } finally {searchMode='';await screen.close();}
});

test('search trigger focuses the page search input', async () => {
  const screen = await renderRoute('/inicio');
  try {
    await act(async () => document.querySelector('.sd-search-trigger').click());
    assert.equal(document.activeElement, document.querySelector('.sd-search input'));
    assert.ok(document.getElementById('page-search-results'));
  } finally { await screen.close(); }
});

test('short searches stay local and a confirmed empty search offers a useful next step',async()=>{
  searchMode='empty';
  const screen=await renderRoute('/busca');
  try{
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,0);
    await inputValue(document.getElementById('unified-query'),'a');
    await act(async()=>document.querySelector('.unified-search-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    assert.ok(document.getElementById('unified-query-error').textContent.includes('2 caracteres'));
    assert.equal(document.activeElement,document.getElementById('unified-query'));
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,0);
    await inputValue(document.getElementById('unified-query'),'qualquer');
    await act(async()=>document.querySelector('.unified-search-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    await flush();assert.ok(screen.container.textContent.includes('Nenhum resultado nesta busca.'));
    assert.ok(screen.container.textContent.includes('Tente uma palavra mais curta'));
  }finally{searchMode='';await screen.close();}
});

test('daily panel explains a practice recommendation using recorded attempts', async () => {
  dashboardLearningFixture = { metaSemanal: 180, minutosSemana: 0, revisoesHoje: 0, errosPendentes: 0, porDisciplina: [{ disciplina: 'Matemática', tentativas: 5, acerto: 40 }] };
  const screen = await renderRoute('/inicio');
  try {
    assert.equal(document.querySelector('.dash-v2-focus h2')?.textContent, 'Praticar Matemática');
    assert.ok(document.querySelector('.dash-v2-reason')?.textContent.includes('40% de acerto em 5 tentativas'));
    assert.ok(button('Praticar agora →'));
    assert.ok(button('Planejar com a Lumi'));
    await act(async () => button('Praticar agora →').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Simulado sob medida'));
    assert.equal(document.querySelector('.learning-tabs button[aria-pressed="true"]')?.textContent.trim(), 'Simulado');
    assert.equal([...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Disciplina'))?.value, 'Matemática');
  } finally { await screen.close(); dashboardLearningFixture = null; }
});

test('learning progress shows supported improvement and opens practice in the selected subject', async () => {
  dashboardLearningFixture = { porDisciplina: [{ disciplina: 'Física', tentativas: 5, acerto: 40 }], revisoesHoje: 0 };
  evolutionFixture = [{ disciplina: 'Biologia', anterior: 40, atual: 75, variacao: 35, comparavel: true, amostra_atual: 4, amostra_anterior: 5 }];
  const screen = await renderRoute('/aprendizagem');
  try {
    assert.ok(screen.container.textContent.includes('Mais acertos em Biologia'));
    assert.ok(screen.container.textContent.includes('4 respostas nos últimos 30 dias'));
    await act(async () => button('Praticar Física →').click());
    assert.equal(document.querySelector('.learning-tabs button[aria-pressed="true"]').textContent, 'Simulado');
    assert.equal([...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Disciplina'))?.value, 'Física');
  } finally { await screen.close(); dashboardLearningFixture = null; evolutionFixture = []; }
});

test('main routes expose labels and landmarks to assistive technology', async () => {
  const routes = ['/', '/login', '/register', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/lumi', '/perfil', '/planejamento-inteligente', '/minha-jornada', '/preferencias', '/minhas-atividades', '/minhas-turmas', '/avisos', '/status', '/mesa', '/meu-entendimento'];
  const management = ['/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono', '/dono/usuarios'];
  for (const route of [...routes, ...management]) {
    const screen = await renderRoute(route, management.includes(route) ? 'dono' : 'aluno');
    try {
      const results = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
      const failures = results.violations.map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(', ')}`);
      assert.deepEqual(failures, [], `${route}: ${failures.join('; ')}`);
    } finally { await screen.close(); }
  }
});


test('an empty Lumi conversation starts at the welcome section rather than the bottom', async () => {
  const old = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'scrollHeight');
  Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return this.classList.contains('lumi-feed') ? 1000 : 0; } });
  const screen = await renderRoute('/lumi');
  try { assert.equal(document.querySelector('.lumi-feed').scrollTop, 0); }
  finally {
    await screen.close();
    if (old) Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', old);
    else delete window.HTMLElement.prototype.scrollHeight;
  }
});

test('curated sources filter free access and keep the original providers visible', async () => {
  const screen = await renderRoute('/fontes-estudo');
  try {
    assert.ok(screen.container.textContent.includes('Fonte oficial'));
    assert.ok(document.querySelector('a[href="https://vestibular.fgv.br/provas-gabaritos"]'));
    const free = document.querySelector('.sources-check input');
    await act(async () => free.click());
    assert.equal(document.querySelector('a[href="https://aprovatotal.com.br/"]'), null);
    assert.ok(document.querySelector('a[href="https://cursoenemgratuito.com.br/"]'));
    await inputValue(document.querySelector('.sources-controls input[type="search"]'), 'zzzz');
    assert.ok(screen.container.textContent.includes('Nenhuma fonte neste filtro'));
    assert.equal(document.querySelectorAll('.sources-grid article').length, 0);
  } finally { await screen.close(); }
});

test('a quiz carries the selected answer into Lumi without sending a message or a hidden answer key', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('Repouso ou velocidade vetorial constante'));
    const option = document.querySelector('.study-guide-options button');
    const answerText = option.querySelector('span').textContent;
    await act(async () => option.click());
    await act(async () => button('Pensar nesta questão com a Lumi').click());
    assert.equal(requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).length, 0);
    assert.equal(document.querySelector('.lumi-practice label:last-of-type textarea').value, answerText);
    assert.equal(button('Ver resolução comentada'), undefined);
    await act(async () => button('Conferir minha tentativa').click());
    await flush();
    const request = requests.find(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat'));
    const { pratica } = JSON.parse(request.data);
    assert.equal(pratica.modo, 'feedback');
    assert.equal(pratica.tentativa, answerText);
    assert.equal(pratica.respostaCorreta, undefined);
    assert.ok(button('Ver resolução comentada'));
    await act(async () => button('Ver resolução comentada').click());
    await flush();
    assert.equal(JSON.parse(requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).at(-1).data).pratica.modo, 'resolucao');
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('a failed tutoring request preserves the attempt and never unlocks the full solution', async () => {
  const screen = await renderRoute('/lumi');
  failChat = true;
  try {
    await act(async () => document.querySelector('.lumi-practice summary').click());
    const fields = document.querySelectorAll('.lumi-practice textarea');
    await inputValue(fields[0], 'Resolva 3x = 12');
    await inputValue(fields[1], 'Dividi por 3 e achei x = 4.');
    await act(async () => button('Conferir minha tentativa').click());
    await flush();
    assert.equal(fields[1].value, 'Dividi por 3 e achei x = 4.');
    assert.equal(button('Ver resolução comentada'), undefined);
  } finally { await screen.close(); failChat = false; }
});

test('unsupported subjects are clearly labelled as general study methods', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, titulo: 'Tema ainda sem aula', disciplina: 'Geral' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('ROTEIRO GERAL DE ESTUDO'));
    assert.ok(screen.container.textContent.includes('ainda não há uma aula específica'));
    assert.ok(screen.container.textContent.includes('não o domínio do tema indicado'));
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('external reading opens at the original source instead of an iframe that may be blocked', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, titulo: 'Ecologia', disciplina: 'Biologia', link: 'https://brasilescola.uol.com.br/biologia/cadeia-alimentar.htm' } }));
  const screen = await renderRoute('/estudar');
  try {
    await act(async () => button('Fonte principal').click());
    await flush();
    assert.equal(document.querySelectorAll('.session-canvas iframe').length, 0);
    const source = [...document.querySelectorAll('.session-canvas a')].find(link => link.textContent.includes('Abrir material na fonte original'));
    assert.equal(source?.target, '_blank');
    assert.ok(source?.href.includes('/biologia/cadeia-alimentar.htm'));
    assert.ok(screen.container.textContent.includes('do organismo que serve de alimento para quem o consome'));
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('an incomplete account can explore sources without marking setup complete', async () => {
  incompleteAccount = true;
  const screen = await renderRoute('/fontes-estudo');
  try {
    assert.ok(screen.container.textContent.includes('Uma boa pergunta'));
    assert.ok(screen.container.textContent.includes('Preparar meu plano'));
    assert.equal(localStorage.getItem('perfil_completo'), 'false');
    assert.equal(requests.some(request => request.method === 'post' && request.url.endsWith('/cronograma/gerar')), false);
  } finally { incompleteAccount = false; await screen.close(); }
});

test('first setup makes school year optional and offers exploration before generating anything', async () => {
  const screen = await renderRoute('/onboarding');
  try {
    assert.equal(document.getElementById('setup-year').required, false);
    assert.equal(document.getElementById('setup-goal').value, 'ENEM');
    assert.ok(button('Explorar primeiro →'));
    await act(async () => button('Explorar primeiro →').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Seu primeiro passo pode ser pequeno'));
    assert.equal(localStorage.getItem('perfil_completo'), 'false');
  } finally { await screen.close(); }
});

test('a new student sees useful first steps without an empty progress dashboard', async () => {
  incompleteAccount = true;
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(document.querySelector('.first-study'));
    assert.equal(document.querySelector('.dash-v2-score'), null);
    assert.ok(document.querySelector('.first-study a[href="/onboarding"]'));
    await act(async () => document.querySelector('.first-study a[href="/lumi"]').click());
    await flush();
    assert.ok(document.querySelector('#lumi-message'));
    assert.equal(requests.filter(item=>item.method==='post' && item.url.includes('/chat')).length,0);
  } finally { incompleteAccount=false;await screen.close(); }
});

test('first steps respect an already saved study profile', async () => {
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(document.querySelector('.first-study a[href="/cronograma"]'));
    assert.equal(document.querySelector('.first-study a[href="/onboarding"]'),null);
    assert.ok(screen.container.textContent.includes('Seu perfil já está preparado.'));
  } finally { await screen.close(); }
});

test('returning to an unfinished setup recovers the server profile instead of requesting subjects again', async () => {
  onboardingProfileFixture = { areas_foco: 'Física', objetivo: 'VESTIBULAR', tempo_diario_min: 45, ano_escolar: '', prazo_estimado: 30 };
  const screen = await renderRoute('/onboarding');
  try {
    assert.ok(screen.container.textContent.includes('Etapa 2 de 2'));
    await act(async () => button('Voltar').click());
    assert.equal(document.getElementById('setup-minutes').value, '45');
    assert.equal(document.getElementById('setup-goal').value, 'VESTIBULAR');
  } finally { onboardingProfileFixture = null; await screen.close(); }
});

test('a new device resumes a pending session from the account without local session storage', async () => {
  window.sessionStorage.clear();
  continuityFixture = { conteudo: { id: 51, id_conteudo: 9, titulo: 'Sessão recuperada da conta', disciplina: 'Física' }, dia: { id_dia: 3, data_estudo: '2026-10-24' } };
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('Sessão recuperada da conta'));
    assert.ok(screen.container.textContent.includes('Retomada desta sessão salva na sua conta'));
    assert.ok(requests.some(request => request.method === 'put' && request.url.endsWith('/estudo-em-andamento') && JSON.parse(request.data).idItem === 51));
  } finally { continuityFixture = null; window.sessionStorage.clear(); await screen.close(); }
});

test('session content without the current account scope is never restored', async () => {
  window.sessionStorage.setItem('planejai:active-study-content', JSON.stringify({ conteudo: { titulo: 'Texto de outra conta' } }));
  window.sessionStorage.setItem('900002:active-study-content', JSON.stringify({ conteudo: { titulo: 'Texto privado' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('Nenhum conteúdo foi escolhido'));
    assert.equal(screen.container.textContent.includes('Texto privado'), false);
    assert.equal(screen.container.textContent.includes('Texto de outra conta'), false);
  } finally { window.sessionStorage.clear(); await screen.close(); }
});

test('learning load failure is a retryable error, never an empty progress report', async () => {
  failLearningLoad = true;
  const screen = await renderRoute('/aprendizagem');
  try {
    assert.ok(screen.container.textContent.includes('Não conseguimos consultar seu progresso'));
    assert.equal(document.querySelector('.learning-hero'), null);
    failLearningLoad = false;
    await act(async () => document.querySelector('.recovery-state button').click()); await flush();
    assert.ok(document.querySelector('.learning-hero'), screen.container.textContent.slice(-1200));
  } finally { failLearningLoad = false; await screen.close(); }
});

test('essay failure preserves the editor and an account-scoped draft immediately', async () => {
  const screen = await renderRoute('/redacoes');
  essayMode = 'failure';
  try {
    assert.equal(requests.some(r => r.url.endsWith('/redacao/portfolio')), false);
    assert.equal(requests.some(r => r.url.endsWith('/redacao/projetos')), false);
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Educação e acesso');
    const text = 'A educação permite compreender a sociedade e participar de decisões coletivas. '.repeat(5);
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), text);
    assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto, text);
    await act(async () => button('Finalizar e enviar').click()); await flush();
    assert.ok(document.querySelector('.essay-sheet .save-feedback[data-state="error"]'));
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, text);
    assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto, text);
  } finally { essayMode = ''; await screen.close(); }
});

test('queued essay keeps its text and prevents the same version being submitted twice', async () => {
  const screen = await renderRoute('/redacoes');
  essayMode = 'queued';
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Acesso à educação');
    const text = 'Uma escola acessível precisa de condições para que os estudantes possam aprender. '.repeat(5);
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), text);
    await act(async () => button('Finalizar e enviar').click()); await flush();
    assert.ok(screen.container.textContent.includes('já foi encaminhada pela fila'));
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, text);
    assert.ok(button('Nesta versão: envio na fila').disabled);
    assert.equal(requests.filter(r => r.method === 'post' && r.url.endsWith('/redacao')).length, 1);
    assert.ok(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).queuedVersion);
  } finally { essayMode = ''; await screen.close(); }
});

test('essay editor ignores drafts without the current account owner', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    localStorage.setItem('planejai:redacao:rascunho:v2', JSON.stringify({ tema: 'Privado', texto: 'De outra conta' }));
    localStorage.setItem('900002:essay-draft:v3', JSON.stringify({ tema: 'Privado', texto: 'De outra conta' }));
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    assert.equal(document.getElementById('essay-topic').value, '');
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, '');
  } finally { await screen.close(); }
});

test('a full device store keeps the essay editable and warns instead of claiming it was saved', async () => {
  const screen = await renderRoute('/redacoes');
  const original = window.Storage.prototype.setItem;
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    window.Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); };
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), 'Texto que precisa ser preservado.');
    assert.ok(document.querySelector('.save-feedback[data-state="unsaved"]'));
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, 'Texto que precisa ser preservado.');
  } finally { window.Storage.prototype.setItem = original; await screen.close(); }
});

test('clearing both essay fields does not resurrect an old draft when the editor reopens', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Tema antigo');
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), 'Texto antigo');
    await inputValue(document.getElementById('essay-topic'), '');
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), '');
    assert.equal(localStorage.getItem('900001:essay-draft:v3'), null);
  } finally { await screen.close(); }
});

test('guided workshop waits for its saved project and keeps edits when saving fails', async () => {
  const screen = await renderRoute('/redacoes');
  essayMode = 'workshopFailure';
  try {
    assert.equal(requests.some(r => r.url.endsWith('/redacao/projetos')), false);
    await act(async () => button('Abrir oficina →').click()); await flush();
    await inputValue(document.querySelector('.writing-workshop-editor input'), 'Inclusão digital');
    await act(async () => button('Salvar esta etapa').click()); await flush();
    assert.equal(document.querySelector('.writing-workshop-editor input').value, 'Inclusão digital');
    assert.ok(document.querySelector('.writing-workshop .save-feedback[data-state="error"]'));
  } finally { essayMode = ''; await screen.close(); }
});

for (const outcome of ['confirmed', 'queued']) test(`late ${outcome} essay response cannot erase text arriving after submission`, async () => {
  const screen = await renderRoute('/redacoes');
  const previous = window.SpeechRecognition;
  let recognition;
  window.SpeechRecognition = class { constructor() { recognition = this; } start() {} stop() {} };
  essayMode = 'deferred';
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Educação');
    const text = 'A escola deve oferecer condições de aprendizagem para todos os estudantes. '.repeat(5);
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), text);
    await act(async () => button('Ditado por voz').click());
    await act(async () => button('Finalizar e enviar').click());
    await act(async () => recognition.onresult({ resultIndex: 0, results: [[{ transcript: 'ideia posterior' }]] }));
    await act(async () => deferredEssay(outcome === 'queued' ? { offline: true, queueId: 123 } : { redacao: { id_redacao: 73, tema: 'Educação', texto: text } }));
    await flush();
    assert.ok(document.querySelector('textarea[aria-label="Texto da redação"]').value.includes('ideia posterior'));
    assert.ok(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto.includes('ideia posterior'));
  } finally { window.SpeechRecognition = previous; essayMode = ''; await screen.close(); }
});

test('slow route loading explains the wait without reloading or replacing the page', async () => {
  const { RouteLoading } = await getBundle();
  const original = window.setTimeout;
  let slow;
  window.setTimeout = (callback, delay, ...args) => delay === 8000 ? (slow = callback, 999999) : original(callback, delay, ...args);
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(RouteLoading)));
    await act(async () => slow());
    assert.ok(document.body.textContent.includes('Está demorando mais que o esperado'));
    assert.equal(document.querySelectorAll('button').length, 0);
  } finally { window.setTimeout = original; await act(async () => root.unmount()); }
});

test('navigation shortcuts leave typed text alone and still work outside form fields', async () => {
  const { PageExperience, ThemeProvider, AccessibilityProvider } = await getBundle();
  const { useLocation } = requireFrontend('react-router-dom');
  function Probe() { return React.createElement('p', { id: 'path-probe' }, useLocation().pathname); }
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/redacoes'] }, React.createElement(ThemeProvider, null, React.createElement(AccessibilityProvider, null, React.createElement(PageExperience), React.createElement('textarea', { defaultValue: 'Texto em andamento' }), React.createElement(Probe))))));
    await act(async () => document.querySelector('textarea').dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, altKey: true, key: 'c' })));
    assert.equal(document.getElementById('path-probe').textContent, '/redacoes');
    assert.equal(document.querySelector('textarea').value, 'Texto em andamento');
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, altKey: true, key: 'c' })));
    assert.equal(document.getElementById('path-probe').textContent, '/cronograma');
  } finally { await act(async () => root.unmount()); }
});

test('login keeps typed credentials during a server outage and checks recovery without resubmitting them', async () => {
  const { Login, AuthContext, ThemeProvider } = await getBundle();
  const container = document.getElementById('root');
  const root = createRoot(container);
  const previousFetch = global.fetch;
  let submissions = 0, checks = 0;
  global.fetch = async () => { checks++; return { ok: true, json: async () => ({ database: 'connected' }) }; };
  const login = async () => { submissions++; throw { response: { status: 503 } }; };
  try {
    await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(ThemeProvider, null, React.createElement(AuthContext.Provider, { value: { login } }, React.createElement(Login))))));
    await inputValue(document.getElementById('email'), 'fixture@example.invalid');
    await inputValue(document.getElementById('senha'), 'fixture-password');
    await act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.ok(container.querySelector('[role="alert"]').textContent.includes('Seus dados de acesso continuam aqui'));
    assert.equal(document.getElementById('email').value, 'fixture@example.invalid');
    assert.equal(document.getElementById('senha').value, 'fixture-password');
    await act(async () => button('Verificar conexão').click());
    assert.ok(container.textContent.includes('A conexão voltou'));
    assert.equal(submissions, 1);
    assert.equal(checks, 1);
  } finally { global.fetch = previousFetch; await act(async () => root.unmount()); }
});

test('a review explains actual difficulty evidence and postpones without grading it', async () => {
  reviewQueueFixture = [{ id_revisao: 84, id_conteudo: 7, titulo: 'Revisão de frações', disciplina: 'Matemática', ultimo_resultado: 'DIFICIL', nivel_dominio: 2 }];
  const screen = await renderRoute('/aprendizagem');
  try {
    assert.ok(screen.container.textContent.includes('Você marcou este conteúdo como difícil'));
    assert.equal(requests.filter(request => request.url.endsWith('/adiar')).length, 0);
    await act(async () => document.querySelector('.study-recommendation summary').click());
    await act(async () => button('Confirmar nova data').click());
    await flush();
    const saved = requests.find(request => request.url.endsWith('/revisoes/84/adiar'));
    assert.equal(JSON.parse(saved.data).dias, 1);
    assert.ok(!requests.some(request => request.url.endsWith('/avaliar')));
    assert.ok(!document.querySelector('.learning-review'));
  } finally { reviewQueueFixture = []; await screen.close(); }
});

test('a failed postponement keeps the review in the queue and does not claim success', async () => {
  reviewQueueFixture = [{ id_revisao: 84, id_conteudo: 7, titulo: 'Revisão preservada', disciplina: 'Matemática' }];
  postponeFailure = true;
  const screen = await renderRoute('/aprendizagem');
  try {
    await act(async () => document.querySelector('.study-recommendation summary').click());
    await act(async () => button('Confirmar nova data').click());
    assert.ok(document.querySelector('.learning-review'));
    assert.ok(screen.container.textContent.includes('Não foi possível atualizar a fila'));
    assert.ok(!screen.container.textContent.includes('Reagendamento salvo na sua conta'));
  } finally { reviewQueueFixture = []; postponeFailure = false; await screen.close(); }
});

test('today opens a gentle five-minute return without completing the pending lesson', async () => {
  continuityFixture = { conteudo: { id: 51, id_conteudo: 9, titulo: 'Retomar Física', disciplina: 'Física' }, dia: { id_dia: 3, data_estudo: '2026-10-24' }, atualizadoEm: '2026-10-23T15:00:00Z' };
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Esta foi sua última sessão aberta, em 23/10/2026'));
    await act(async () => button('Retomar por 5 minutos').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Cinco minutos já são um começo'));
    assert.ok(screen.container.textContent.includes('Retomar Física'));
    assert.ok(!requests.some(request => request.method === 'post' && /sessoes|concluir/.test(request.url)));
  } finally { continuityFixture = null; window.sessionStorage.clear(); await screen.close(); }
});

test('a continuity outage is recoverable rather than presented as an empty history', async () => {
  continuityFailure = true;
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Seu histórico não foi apagado'));
    continuityFailure = false;
    await act(async () => button('Consultar minha retomada').click());
    assert.ok(!screen.container.textContent.includes('Não conseguimos consultar sua última sessão'));
  } finally { continuityFailure = false; await screen.close(); }
});

test('registration validation focuses the first invalid field and associates its explanation', async () => {
  const screen = await renderRoute('/register');
  try {
    await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles:true, cancelable:true })));
    const input=document.getElementById('nome');
    assert.equal(document.activeElement,input);
    assert.equal(input.getAttribute('aria-invalid'),'true');
    assert.ok(document.getElementById(input.getAttribute('aria-describedby')).textContent.includes('Nome é obrigatório'));
    for (const id of ['email','senha','confirmarSenha']) assert.ok(document.getElementById(document.getElementById(id).getAttribute('aria-describedby')));
  } finally { await screen.close(); }
});

test('custom subjects and each available weekday time have accessible names', async () => {
  let screen = await renderRoute('/onboarding');
  try {
    const other=[...document.querySelectorAll('label')].find(node=>node.textContent.includes('Outra (digitar matérias'));
    assert.ok(other);
    await act(async()=>other.querySelector('input').click());
    assert.ok(document.querySelector('input[aria-label="Outras matérias, separadas por vírgula"]'));
    const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(results.violations.map(item=>item.id),[]);
  } finally { await screen.close(); }
  onboardingProfileFixture={areas_foco:'Matemática',objetivo:'ENEM',tempo_diario_min:60};
  screen=await renderRoute('/onboarding');
  try {
    const day=document.querySelector('input[type="checkbox"]');assert.ok(day);
    await act(async()=>day.click());
    const inputs=[...document.querySelectorAll('input[type="time"]')];assert.equal(inputs.length,2);
    for(const input of inputs) assert.match(input.getAttribute('aria-label'),/Horário (inicial|final) de /);
    const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(results.violations.map(item=>item.id),[]);
  } finally { onboardingProfileFixture=null; await screen.close(); }
});

test('different passwords show an error under confirmation and matching passwords clear it', async () => {
  const screen=await renderRoute('/register');
  try{
    await inputValue(document.getElementById('nome'),'Estudante Teste');
    await inputValue(document.getElementById('email'),'fixture@example.invalid');
    await inputValue(document.getElementById('senha'),'SenhaTeste123');
    await inputValue(document.getElementById('confirmarSenha'),'OutraSenha123');
    await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    assert.equal(document.getElementById('confirmar-requisitos').textContent,'As senhas precisam ser iguais.');
    assert.equal(document.activeElement.id,'confirmarSenha');
    assert.ok(!requests.some(request=>request.method==='post'&&request.url.endsWith('/register')));
    await inputValue(document.getElementById('confirmarSenha'),'SenhaTeste123');
    assert.equal(document.getElementById('confirmarSenha').getAttribute('aria-invalid'),'false');
    assert.ok(!document.getElementById('confirmar-requisitos').textContent.includes('precisam ser iguais'));
  }finally{await screen.close()}
});

test('password-change fields explain mismatching confirmation immediately below the field', async () => {
  const screen=await renderRoute('/alterar-senha');
  try{
    await inputValue(document.getElementById('novaSenha'),'SenhaTeste123');
    await inputValue(document.getElementById('confirmarSenha'),'Diferente123');
    assert.equal(document.getElementById('password-confirmation-error').textContent,'As senhas precisam ser iguais.');
    assert.equal(document.getElementById('confirmarSenha').getAttribute('aria-describedby'),'password-confirmation-error');
    await inputValue(document.getElementById('confirmarSenha'),'SenhaTeste123');
    assert.ok(!document.getElementById('password-confirmation-error'));
  }finally{await screen.close()}
});

async function openJournal() {
  const screen=await renderRoute('/aprendizagem');
  await act(async()=>button('Minhas palavras e dúvidas').click());await flush();await flush();
  return screen;
}
test('journal drafts remain on this account and failed saves retry the same version without auto sending to Lumi',async()=>{
  const screen=await openJournal();
  try {
    await act(async()=>button('+ Escrever uma explicação').click());
    await inputValue(document.querySelector('.journal-editor input'),'Inércia');
    await inputValue(document.querySelector('.journal-editor textarea'),'Um corpo mantém seu estado quando a força resultante é zero.');
    const savedDraft=JSON.parse(localStorage.getItem('900001:journal-draft:new:explicacao:livre'));
    assert.match(savedDraft.texto,/força resultante/);
    assert.ok(!requests.some(r=>r.method==='post'&&r.url.includes('/diario')));
    journalFailure=true;
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.match(document.querySelector('.journal-error').textContent,/Não foi possível confirmar/);
    assert.equal(document.querySelector('.journal-editor textarea').value,savedDraft.texto);
    journalFailure=false;
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    const posts=requests.filter(r=>r.method==='post'&&r.url.endsWith('/diario'));
    assert.equal(posts.length,2);assert.equal(JSON.parse(posts[0].data).chave,JSON.parse(posts[1].data).chave);
    assert.ok(!localStorage.getItem('900001:journal-draft:new:explicacao:livre'));
    assert.ok(!requests.some(r=>r.method==='post'&&r.url.endsWith('/lumi')));
  }finally{journalFailure=false;await screen.close()}
});
test('reexplaining hides old answers until requested and Lumi sends only checked versions after an explicit click',async()=>{
  const screen=await openJournal();
  try {
    await act(async()=>document.querySelector('.journal-list button').click());await flush();await flush();
    assert.ok(!screen.container.textContent.includes('Primeira versão preservada'));
    await act(async()=>button('Consultar versões anteriores / comparar').click());
    const checks=[...document.querySelectorAll('.journal-step input')];
    assert.equal(checks.length,2);assert.ok(checks.every(node=>!node.checked));
    assert.equal(button('Comparar trechos com a Lumi').disabled,true);
    await act(async()=>{checks[0].click();checks[1].click()});
    assert.ok(!requests.some(r=>r.url.endsWith('/lumi')));
    await act(async()=>button('Comparar trechos com a Lumi').click());await flush();
    const request=requests.find(r=>r.method==='post'&&r.url.endsWith('/diario/71/lumi'));
    assert.deepEqual(JSON.parse(request.data),{passos:[11,12]});
    assert.match(document.querySelector('.journal-feedback').textContent,/exemplo tornou/);
    const result=await axe.run(document.querySelector('.learning-journal'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(v=>v.id),[]);
  }finally{await screen.close()}
});
test('a saved second explanation is appended rather than editing the earlier text',async()=>{
  const screen=await openJournal();
  try {
    await act(async()=>document.querySelector('.journal-list button').click());await flush();
    await inputValue(document.querySelector('.journal-editor textarea'),'Uma nova explicação minha.');
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    const request=requests.find(r=>r.method==='post'&&r.url.endsWith('/diario/71/passos'));
    assert.equal(JSON.parse(request.data).tipo,'explicacao');assert.equal(JSON.parse(request.data).texto,'Uma nova explicação minha.');
    assert.ok(screen.container.textContent.includes('Primeira versão preservada'));
    assert.ok(screen.container.textContent.includes('Registro confirmado na sua conta.'));
    assert.ok(!requests.some(r=>r.method==='post'&&r.url.endsWith('/lumi')));
  }finally{await screen.close()}
});
test('doubts require the student to record what helped before resolving and can be reopened',async()=>{
  journalDoubt=true;
  const screen=await openJournal();
  try {
    await act(async()=>button('Caminhos das dúvidas').click());await flush();
    await act(async()=>document.querySelector('.journal-list button').click());await flush();
    const select=document.querySelector('.journal-editor select');
    await act(async()=>{select.value='resolucao';select.dispatchEvent(new window.Event('change',{bubbles:true}))});
    await inputValue(document.querySelector('.journal-editor textarea'),'Comparar velocidade e aceleração com uma bicicleta ajudou.');
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    assert.ok(screen.container.textContent.includes('Resolvida por você'));
    await inputValue(document.querySelector('.journal-editor textarea'),'Ainda tenho dúvida sobre o movimento circular.');
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    assert.ok(screen.container.textContent.includes('Em investigação'));
    assert.deepEqual(requests.filter(r=>r.url.endsWith('/diario/71/passos')).map(r=>JSON.parse(r.data).tipo),['resolucao','reabertura']);
    assert.ok(!requests.some(r=>r.url.endsWith('/lumi')));
  }finally{journalDoubt=false;journalResolved=0;await screen.close()}
});
test('a session cannot finish while its new explanation is still only a draft',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    await act(async()=>button('Explicar ou registrar uma dúvida').click());await flush();
    await act(async()=>button('+ Escrever uma explicação').click());
    await inputValue(document.querySelector('.journal-editor textarea'),'Minha ideia ainda em elaboração.');
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    assert.ok(document.querySelector('.study-desk'));
    assert.ok(!requests.some(r=>r.method==='post'&&/sessoes|concluir/.test(r.url)));
    assert.ok(localStorage.getItem('900001:journal-draft:new:explicacao:9'));
    window.confirm=()=>true;
    await act(async()=>button('Descartar rascunho').click());
    assert.ok(!localStorage.getItem('900001:journal-draft:new:explicacao:9'));
  }finally{window.confirm=()=>false;window.sessionStorage.clear();await screen.close()}
});
test('a study connection explains a reviewed relationship without fetching private data or sending to Lumi',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    const connection=document.querySelector('.study-connections');assert.ok(connection);
    assert.ok(connection.textContent.includes('Trabalho e energia'));
    assert.ok(!connection.textContent.includes('Uma resultante constante de 4 N'));
    const count=requests.length;
    await act(async()=>button('Entender esta conexão +').click());
    assert.match(connection.textContent,/12 J/);
    assert.equal(requests.length,count);
    const search=connection.querySelector('a[href^="/busca"]');
    assert.equal(search.getAttribute('target'),'_blank');assert.match(search.getAttribute('rel'),/noopener/);
    const url=new URL(search.href);assert.equal(url.searchParams.get('q'),'Trabalho e energia');assert.equal(url.searchParams.get('tipo'),'materiais');
    assert.ok(connection.querySelector('a[href^="https://openstax.org/"]'));
    assert.ok(!requests.some(r=>r.method==='post'&&/chat|lumi|sessoes|concluir/.test(r.url)));
    const result=await axe.run(connection,{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(v=>v.id),[]);
  }finally{window.sessionStorage.clear();await screen.close()}
});
test('recording a connection appends to the current note once and reading mode preserves both',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    await act(async()=>document.querySelector('.study-desk-note-link button').click());await flush();
    await inputValue(document.querySelector('.session-notes textarea'),'Minha anotação original.');
    await act(async()=>button('Entender esta conexão +').click());
    await act(async()=>button('Registrar esta conexão nas anotações').click());await flush();
    const text=document.querySelector('.session-notes textarea').value;
    assert.ok(text.startsWith('Minha anotação original.'));
    assert.match(text,/Conexão de estudo: Leis de Newton → Trabalho e energia/);assert.match(text,/Minha explicação:/);
    await act(async()=>button('Registrar esta conexão nas anotações').click());await flush();
    assert.equal(document.querySelector('.session-notes textarea').value,text);
    await act(async()=>button('Modo leitura').click());
    await act(async()=>button('Sair do modo leitura').click());
    assert.equal(document.querySelector('.session-notes textarea').value,text);
    assert.ok(!requests.some(r=>r.method==='post'&&/chat|lumi|sessoes|concluir/.test(r.url)));
  }finally{window.sessionStorage.clear();await screen.close()}
});
test('changing a curated connection reveals a distinct direction and leaves essays untouched',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Estrutura da redação dissertativa',disciplina:'Redação'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    assert.ok(document.querySelector('.study-connection-path').textContent.includes('Coesão e coerência textual'));
    await act(async()=>button('Entender esta conexão +').click());
    const next=button('Ver outra conexão →');next.focus();
    await act(async()=>next.click());
    assert.ok(document.activeElement===next);
    assert.ok(document.querySelector('.study-connection-path').textContent.includes('Repertório sociocultural'));
    assert.ok(button('Entender esta conexão +'));
    assert.ok(!requests.some(r=>/redacao|redacoes/.test(r.url)));
    assert.ok(!requests.some(r=>r.method==='post'&&/chat|lumi|sessoes|concluir/.test(r.url)));
  }finally{window.sessionStorage.clear();await screen.close()}
});
async function openClosingSession() {
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  return renderRoute('/estudar');
}
test('closing a session confirms its actual summary and saves a personal next step in one request',async()=>{
  const screen=await openClosingSession();
  try {
    await inputValue(document.getElementById('closure-reminder'),'Tentar resolver sem consultar o exemplo.');
    assert.ok(!requests.some(r=>r.url.endsWith('/fechamentos')));
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();await flush();
    assert.ok(document.querySelector('.session-closing'));
    assert.ok(screen.container.textContent.includes('2 versões de explicações preservadas'));
    assert.ok(screen.container.textContent.includes('Ainda confundo força e velocidade'));
    assert.ok(screen.container.textContent.includes('Tentar resolver sem consultar o exemplo.'));
    assert.ok(document.activeElement===document.querySelector('.session-closing h1'));
    const posts=requests.filter(r=>r.url.endsWith('/fechamentos'));assert.equal(posts.length,1);
    assert.equal(JSON.parse(posts[0].data).proximoPasso,'Tentar resolver sem consultar o exemplo.');
    assert.ok(!requests.some(r=>r.method==='post'&&/sessoes$|revisoes\/|concluir$/.test(r.url)));
    assert.ok(!localStorage.getItem('900001:study-close:item-51'));
    const result=await axe.run(document.querySelector('.session-closing'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  }finally{window.sessionStorage.clear();await screen.close()}
});
test('a failed closing preserves its original reminder and retries the same immutable request',async()=>{
  closingFailure=true;
  const screen=await openClosingSession();
  try {
    await inputValue(document.getElementById('closure-reminder'),'Retomar pelo desenho do problema.');
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    assert.ok(!document.querySelector('.session-closing'));
    assert.equal(document.getElementById('closure-reminder').value,'Retomar pelo desenho do problema.');
    assert.equal(document.getElementById('closure-reminder').disabled,true);
    assert.ok(localStorage.getItem('900001:study-close:item-51'));
    closingFailure=false;
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    const posts=requests.filter(r=>r.url.endsWith('/fechamentos'));assert.equal(posts.length,2);assert.equal(posts[0].data,posts[1].data);
    assert.ok(document.querySelector('.session-closing'));
  }finally{closingFailure=false;window.sessionStorage.clear();await screen.close()}
});
test('an unconfirmed note remains separate from a confirmed closing and can be retried independently',async()=>{
  notesWriteFailure=true;
  const screen=await openClosingSession();
  try {
    await act(async()=>document.querySelector('.study-desk-note-link button').click());
    await inputValue(document.querySelector('.session-notes textarea'),'Minha anotação que precisa ser reenviada.');
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    assert.ok(document.querySelector('.session-closing'));
    assert.ok(screen.container.textContent.includes('Suas anotações atuais estão só neste aparelho.'));
    notesWriteFailure=false;
    await act(async()=>button('Tentar enviar anotações').click());await flush();
    assert.ok(!document.querySelector('.closing-note-warning'));
    assert.equal(requests.filter(r=>r.url.endsWith('/fechamentos')).length,1);
  }finally{notesWriteFailure=false;window.sessionStorage.clear();await screen.close()}
});
test('today prioritizes due personal work and opens the exact explanation instead of the general list',async()=>{
  const explanation={id:71,titulo:'Minha explicação de Newton',minutos:5,motivo:'Sua última versão foi salva há pelo menos três dias.'};
  returnsFixture={explicacao:explanation,duvida:{id:72,titulo:'Uma dúvida aberta',minutos:8,motivo:'Ainda em investigação.'},revisao:{id:81,titulo:'Uma revisão pendente',minutos:10,motivo:'Prevista para hoje.'},proximoPasso:null,principal:{...explanation,tipo:'explicacao'}};
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(document.querySelector('.dash-v2-focus h2').textContent.includes('Minha explicação de Newton'));
    assert.ok(document.querySelector('.study-returns').textContent.includes('Uma dúvida aberta'));
    assert.ok(document.querySelector('.study-returns').textContent.includes('Uma revisão pendente'));
    assert.ok(document.querySelector('.dash-v2-focus').textContent.includes('5 min sugeridos'));
    await act(async()=>document.querySelector('.dash-v2-focus footer button').click());await flush();await flush();
    assert.ok(document.querySelector('.journal-detail'));
    assert.ok(!screen.container.textContent.includes('Primeira versão preservada'));
    assert.ok(requests.some(r=>r.url.endsWith('/diario/71')));
  }finally{returnsFixture=null;await screen.close()}
});
test('today keeps an ongoing session ahead of other suggestions and does not consume a reminder on open',async()=>{
  const reminder={id:89,titulo:'Próximo estudo',texto:'Fazer um desenho antes de calcular.',minutos:5,motivo:'Você escolheu esse próximo passo.'};
  returnsFixture={proximoPasso:reminder,principal:{...reminder,tipo:'lembrete'}};
  continuityFixture={conteudo:{id:51,id_conteudo:9,titulo:'Uma sessão ainda aberta',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}};
  const screen=await renderRoute('/inicio');
  try {
    assert.equal(document.querySelector('.dash-v2-focus h2').textContent,'Uma sessão ainda aberta');
    await act(async()=>document.querySelector('.study-returns article button').click());await flush();
    assert.ok(document.querySelector('.study-desk'));
    assert.ok(!requests.some(r=>r.url.endsWith('/retomado')));
  }finally{returnsFixture=null;continuityFixture=null;window.sessionStorage.clear();await screen.close()}
});
test('a failed return lookup offers retry without claiming the pending work is empty',async()=>{
  returnsFailure=true;
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Não conseguimos consultar suas retomadas'));
    assert.ok(!screen.container.textContent.includes('Nenhuma retomada foi encontrada'));
    returnsFailure=false;
    await act(async()=>button('Consultar retomadas novamente').click());await flush();
    assert.ok(!screen.container.textContent.includes('Não conseguimos consultar suas retomadas'));
    assert.equal(requests.filter(r=>r.url.endsWith('/retomadas')).length,2);
  }finally{returnsFailure=false;await screen.close()}
});
test('a personal next step is marked done only through its explicit control',async()=>{
  const reminder={id:89,titulo:'Leis de Newton',texto:'Tentar um exemplo novo.',minutos:5,motivo:'Sua escolha para a próxima sessão.'};
  returnsFixture={proximoPasso:reminder,principal:{...reminder,tipo:'lembrete'}};
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(!requests.some(r=>r.url.endsWith('/retomado')));
    await act(async()=>button('Marcar próximo passo como feito').click());await flush();
    assert.equal(requests.filter(r=>r.url.endsWith('/fechamentos/89/retomado')).length,1);
    assert.ok(!screen.container.textContent.includes('Tentar um exemplo novo.'));
  }finally{returnsFixture=null;await screen.close()}
});
test('a suggested review opens the review section with the selected item available',async()=>{
  const review={id:81,titulo:'Uma revisão para retomar',minutos:10,motivo:'A data de revisão já passou.',atrasada:true};
  returnsFixture={revisao:review,principal:{...review,tipo:'revisao'}};
  reviewQueueFixture=[{id_revisao:81,id_conteudo:9,titulo:review.titulo,disciplina:'Física',nivel_dominio:2,ultimo_resultado:'DIFICIL'}];
  const screen=await renderRoute('/inicio');
  try {
    await act(async()=>document.querySelector('.dash-v2-focus footer button').click());await flush();await flush();
    assert.ok(document.getElementById('learning-review-81'));
    assert.equal(document.querySelector('.learning-tabs button[aria-pressed="true"]').textContent,'Revisões');
  }finally{returnsFixture=null;reviewQueueFixture=[];await screen.close()}
});


test('personal desk reorders and removes shortcuts without deleting originals',async()=>{
 const original=structuredClone(deskItems),screen=await renderRoute('/mesa');
 try{
  assert.equal(document.querySelectorAll('.desk-card').length,2);
  assert.match(document.querySelector('.desk-board').textContent,/2 de 6/);
  await act(async()=>document.querySelector('[aria-label="Mover Força e velocidade para cima"]').click());await flush();
  assert.equal(document.querySelector('.desk-card h3').textContent,'Força e velocidade');
  await act(async()=>document.querySelector('[aria-label="Retirar Leis de Newton da mesa"]').click());await flush();
  assert.equal(document.querySelectorAll('.desk-card').length,1);
  assert.match(document.querySelector('.desk-board [role="status"]').textContent,/original foi preservado/);
  assert.ok(!requests.some(req=>req.method==='delete'&&!req.url.includes('/mesa/')));
  assert.equal(requests.find(req=>req.url.endsWith('/mesa')&&req.method==='get').cache,false);
 }finally{deskItems=original;await screen.close()}
});
test('understanding opens exact evidence lazily, with both original versions and an accessible disclosure',async()=>{
 const screen=await renderRoute('/meu-entendimento');
 try{
  assert.equal(requests.filter(req=>req.url.endsWith('/entendimento/102')).length,0);
  await act(async()=>button('Comparar as duas versões').click());await flush();
  assert.match(document.querySelector('.understanding-evidence').textContent,/Minha versão anterior original/);
  assert.match(document.querySelector('.understanding-evidence').textContent,/Minha nova explicação completa/);
  assert.equal(button('Recolher registro').getAttribute('aria-expanded'),'true');
  const result=await axe.run(document.querySelector('.personal-study'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>button('Recolher registro').click());assert.ok(!document.querySelector('.understanding-evidence'));
 }finally{await screen.close()}
});
test('personal pages distinguish outages from an empty account and recover on demand',async()=>{
 for(const route of ['/mesa','/meu-entendimento']){
  personalFailure=true;const screen=await renderRoute(route);
  try{
   assert.ok(document.querySelector('.personal-study [role="alert"]'));assert.ok(!document.querySelector('.personal-empty'));
   personalFailure=false;await act(async()=>document.querySelector('.personal-study [role="alert"] button').click());await flush();
   assert.ok(document.querySelector(route==='/mesa'?'.desk-card':'.understanding-card'));
  }finally{personalFailure=false;await screen.close()}
 }
});


test('pinning a search result waits for confirmation and keeps source type distinct',async()=>{
 const screen=await renderRoute('/busca?q=Newton&tipo=anotacoes');
 try{
  assert.equal(requests.filter(req=>req.url.endsWith('/mesa')&&req.method==='post').length,0);
  personalFailure=true;
  await act(async()=>document.querySelector('.desk-pin button').click());await flush();
  assert.ok(document.querySelector('.desk-pin [role="alert"]'));assert.ok(!document.querySelector('.desk-pin a'));
  personalFailure=false;
  await act(async()=>document.querySelector('.desk-pin button').click());await flush();
  assert.equal(document.querySelector('.desk-pin a')?.getAttribute('href'),'/mesa');
  const saved=requests.filter(req=>req.url.endsWith('/mesa')&&req.method==='post').at(-1);
  assert.deepEqual(JSON.parse(saved.data),{tipo:'anotacao',idOrigem:9});
 }finally{personalFailure=false;await screen.close()}
});
test('opening a desk note rechecks its source and goes to the notes editor',async()=>{
 window.sessionStorage.clear();const screen=await renderRoute('/mesa');
 try{
  await act(async()=>button('Abrir anotação').click());await flush();await flush();
  assert.ok(requests.some(req=>req.url.endsWith('/mesa/31/abrir')&&req.cache===false));
  assert.ok(document.querySelector('.session-notes textarea'));
 }finally{await screen.close();window.sessionStorage.clear()}
});


async function openIntentEditor(){
 const screen=await renderRoute('/redacoes');
 await act(async()=>document.querySelector('.redacoes-intro-actions button').click());await flush();
 const text='O acesso à leitura depende de condições materiais, como bibliotecas próximas e tempo para ler. Um acervo acessível pode aproximar o livro da rotina de estudantes.\n\nAlém disso, projetos de leitura ajudam a compartilhar interpretações e a descobrir autores. Essa troca pode tornar a leitura uma prática cotidiana.';
 await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'),text);
 await act(async()=>button('Revisar um trecho com a Lumi').click());
 const select=document.querySelector('.essay-intent select');
 await act(async()=>{select.value='0';select.dispatchEvent(new window.Event('change',{bubbles:true}))});
 return {screen,text};
}
test('intent review sends a selected excerpt on demand and preserves the essay and its draft',async()=>{
 const {screen,text}=await openIntentEditor();
 try{
  assert.equal(requests.filter(req=>req.url.endsWith('/revisar-intencao')).length,0);
  await act(async()=>document.querySelector('.essay-intent input[value="coesao"]').click());
  await act(async()=>document.querySelector('.essay-intent-neighbor input').click());
  await act(async()=>button('Pedir uma sugestão para este trecho').click());await flush();
  const request=requests.find(req=>req.url.endsWith('/revisar-intencao')),sent=JSON.parse(request.data);
  assert.equal(sent.intencao,'coesao');assert.equal(sent.trecho,text);assert.deepEqual(Object.keys(sent).sort(),['intencao','trecho']);
  assert.ok(document.querySelector('.essay-intent-result'));assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value,text);
  assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto,text);
  const result=await axe.run(document.querySelector('.essay-intent'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>button('Voltar ao meu texto para reescrever').click());assert.equal(document.activeElement,document.querySelector('textarea[aria-label="Texto da redação"]'));
 }finally{await screen.close()}
});
test('intent review failures retain the chosen text and allow an explicit retry',async()=>{
 const {screen,text}=await openIntentEditor();intentMode='failure';
 try{
  await act(async()=>button('Pedir uma sugestão para este trecho').click());await flush();
  assert.ok(document.querySelector('.essay-intent [role="alert"]'));assert.ok(!document.querySelector('.essay-intent-result'));
  assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value,text);
  intentMode='';await act(async()=>button('Pedir uma sugestão para este trecho').click());await flush();assert.ok(document.querySelector('.essay-intent-result'));
 }finally{intentMode='';await screen.close()}
});
test('an old review cannot appear after the student edits the source while Lumi is responding',async()=>{
 const {screen}=await openIntentEditor();intentMode='deferred';
 try{
  await act(async()=>button('Pedir uma sugestão para este trecho').click());
  assert.ok(document.querySelector('.essay-intent [role="status"]'));
  await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'),'Uma nova versão, com um argumento que eu mesmo desenvolvi depois de repensar a ideia.');
  await act(async()=>deferredIntent());await flush();
  assert.ok(!document.querySelector('.essay-intent-result'));
  assert.match(document.querySelector('textarea[aria-label="Texto da redação"]').value,/Uma nova versão/);
 }finally{intentMode='';await screen.close()}
});
test('connected page motifs stay decorative and personal pages retain their navigation labels',async()=>{
 for(const [route,title] of [['/mesa','Minha mesa — PlanejAI'],['/meu-entendimento','Meu entendimento — PlanejAI']]){
  const screen=await renderRoute(route);
  try{assert.equal(document.querySelector('.sd-topbar-context strong').textContent,title.replace(' — PlanejAI',''));assert.ok(document.querySelector('.area-signature .connected-pages[aria-hidden="true"]'));assert.equal(document.querySelector('.connected-pages')?.getAttribute('focusable'),'false');}
  finally{await screen.close()}
 }
});

test('personal routes announce their distinct document titles to assistive technology',async()=>{
 const {PageExperience,ThemeProvider,AccessibilityProvider}=await getBundle();
 for(const [route,title] of [['/mesa','Minha mesa — PlanejAI'],['/meu-entendimento','Meu entendimento — PlanejAI']]){
  const root=createRoot(document.getElementById('root'));
  try{
   await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:[route]},React.createElement(ThemeProvider,null,React.createElement(AccessibilityProvider,null,React.createElement(PageExperience))))));await flush();
   assert.equal(document.title,title);assert.equal(document.querySelector('.sr-route').textContent,title);
  }finally{await act(async()=>root.unmount())}
 }
});


test('cohesion waits for the neighboring paragraph instead of requesting a speculative review',async()=>{
 const {screen}=await openIntentEditor();
 try{
  await act(async()=>document.querySelector('.essay-intent input[value="coesao"]').click());
  assert.ok(button('Pedir uma sugestão para este trecho').disabled);
  assert.match(document.querySelector('.essay-intent-context').textContent,/parágrafo vizinho/);
  assert.equal(requests.filter(req=>req.url.endsWith('/revisar-intencao')).length,0);
  await act(async()=>document.querySelector('.essay-intent-neighbor input').click());
  assert.ok(!button('Pedir uma sugestão para este trecho').disabled);
 }finally{await screen.close()}
});
test('password dialog contains focus, reports mismatch below confirmation and restores its trigger',async()=>{
 directoryOtherAccount=true;const screen=await renderRoute('/usuarios','dono');
 try{
  await act(async()=>document.querySelector('.users-actions summary').click());
  const trigger=button('Definir senha');trigger.focus();
  await act(async()=>trigger.click());const dialog=document.querySelector('.users-password-dialog');
  assert.equal(document.activeElement,dialog);assert.equal(dialog.getAttribute('role'),'dialog');
  await inputValue(dialog.querySelector('[aria-label="Nova senha"]'),'SenhaFicticia123!');
  await inputValue(dialog.querySelector('[aria-label="Confirmar nova senha"]'),'OutraSenhaFicticia123!');
  await act(async()=>button('Salvar senha').click());
  assert.equal(dialog.querySelector('[role="alert"]').textContent,'As senhas precisam ser iguais.');
  assert.equal(dialog.querySelector('[aria-label="Confirmar nova senha"]').getAttribute('aria-invalid'),'true');
  assert.ok(!requests.some(req=>['post','patch','put'].includes(req.method)&&req.url.includes('/senha')));
  button('Salvar senha').focus();await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})));
  assert.equal(document.activeElement,dialog.querySelector('input'));
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true})));
  assert.equal(document.activeElement,button('Salvar senha'));
  const result=await axe.run(dialog,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  assert.ok(!document.querySelector('.users-password-dialog'));assert.equal(document.activeElement,trigger);assert.equal(document.body.style.overflow,'');
 }finally{directoryOtherAccount=false;await screen.close()}
});
test('material editor traps focus and closes without sending or discarding the original catalog entry',async()=>{
 materialCatalogFixture=true;const screen=await renderRoute('/materiais','dono');
 try{
  const trigger=document.querySelector('.materials-card');trigger.focus();await act(async()=>trigger.click());
  const dialog=document.querySelector('.materials-dialog');assert.equal(document.activeElement,dialog);
  const last=dialog.querySelector('button[type="submit"]');last.focus();
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})));
  assert.equal(document.activeElement,dialog.querySelector('button'));
  await act(async()=>button('+ Adicionar recurso').click());
  const result=await axe.run(dialog,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  assert.ok(!document.querySelector('.materials-dialog'));assert.equal(document.activeElement,trigger);assert.equal(document.body.style.overflow,'');
  assert.equal(requests.filter(req=>req.method==='put'||req.method==='patch').length,0);
 }finally{materialCatalogFixture=false;await screen.close()}
});


test('the public page shell observes keyboard height and cleans up its viewport state',async()=>{
 const {PageExperience,ThemeProvider,AccessibilityProvider}=await getBundle();
 const saved={};for(const key of ['visualViewport','innerWidth','innerHeight'])saved[key]=Object.getOwnPropertyDescriptor(window,key);
 const viewport=new window.EventTarget();viewport.height=350;viewport.scale=1;
 Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});Object.defineProperty(window,'innerWidth',{configurable:true,value:390});Object.defineProperty(window,'innerHeight',{configurable:true,value:844});
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/login']},React.createElement(ThemeProvider,null,React.createElement(AccessibilityProvider,null,React.createElement(PageExperience),React.createElement('input',{type:'email','aria-label':'Email fictício'}),React.createElement('button',null,'Continuar'))))));
  await act(async()=>document.querySelector('input[type="email"]').focus());await flush();
  assert.ok(document.documentElement.hasAttribute('data-mobile-keyboard'));assert.equal(document.documentElement.style.getPropertyValue('--visible-viewport-height'),'350px');
  await act(async()=>[...document.querySelectorAll('button')].find(el=>el.textContent==='Continuar').focus());await flush();
  assert.ok(!document.documentElement.hasAttribute('data-mobile-keyboard'));
 }finally{
  await act(async()=>root.unmount());
  for(const key of Object.keys(saved)){if(saved[key])Object.defineProperty(window,key,saved[key]);else delete window[key]}
 }
 assert.equal(document.documentElement.style.getPropertyValue('--visible-viewport-height'),'');
});
test('activity creation exposes named controls in all seven question formats',async()=>{
 const screen=await renderRoute('/atividades','dono');
 try{
  await act(async()=>button('Montar primeira atividade →').click());
  assert.ok(document.querySelector('input[placeholder="Título da atividade"]').closest('label'));
  for(const type of ['MULTIPLA_ESCOLHA','CHECKBOX','DISSERTATIVA','RESPOSTA_CURTA','ORDENACAO','ASSOCIACAO','ARQUIVO']){
   const select=document.querySelector('[aria-label="Tipo da questão 1"]');
   await act(async()=>{select.value=type;select.dispatchEvent(new window.Event('change',{bubbles:true}))});
   const result=await axe.run(document.querySelector('.activity-question-editor').parentElement,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[],type);
  }
 }finally{await screen.close()}
});

test('today gives a returning student one main action and keeps details expandable',async()=>{
 continuityFixture={conteudo:{id:51,id_conteudo:9,titulo:'Retomar Newton',disciplina:'Física'}};
 const screen=await renderRoute('/inicio','aluno',{}, {'900001:today-last-visit:v1':new Date(Date.now()-6*86400000).toISOString()});
 try{
  assert.equal(document.querySelector('.today-welcome').dataset.moment,'ongoing');
  assert.ok(document.querySelector('.dash-v2-focus footer button').textContent.includes('Retomar minha sessão'));
  const details=document.querySelector('.today-details');assert.equal(details.open,false);
  await act(async()=>details.querySelector('summary').click());assert.equal(details.open,true);
  assert.ok(document.querySelector('.dash-v2-agenda'));
 }finally{continuityFixture=null;await screen.close()}
});

test('today recognizes a device return without inventing missed study days',async()=>{
 dashboardLearningFixture={minutosSemana:15,metaSemanal:180,revisoesHoje:0};
 const screen=await renderRoute('/inicio','aluno',{}, {'900001:today-last-visit:v1':new Date(Date.now()-5*86400000).toISOString()});
 try{assert.equal(document.querySelector('.today-welcome').dataset.moment,'return');assert.match(document.querySelector('.today-welcome').textContent,/neste aparelho/);assert.equal(requests.filter(x=>x.method==='post').length,0)}finally{dashboardLearningFixture=null;await screen.close()}
});

test('planning failure retains account scoped choices and retries only on demand',async()=>{
 onboardingProfileFixture={areas_foco:'Física',objetivo:'ENEM',tempo_diario_min:45};planningWriteFailure=true;
 const screen=await renderRoute('/onboarding');
 try{
  await act(async()=>button('Voltar').click());
  await inputValue(document.getElementById('setup-minutes'),'50');
  await act(async()=>document.querySelector('.setup-page form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  assert.ok(document.querySelector('.save-feedback[data-state="error"]'));
  assert.equal(JSON.parse(localStorage.getItem('900001:planning-draft:v1')).value.formData.tempo_diario_min,50);
  assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/perfil')).length,1);
  planningWriteFailure=false;
  await act(async()=>button('Tentar salvar novamente').click());await flush();
  assert.match(document.querySelector('.save-feedback[data-state="saved"]').textContent,/Matérias salvas/);
  assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/perfil')).length,2);
 }finally{planningWriteFailure=false;onboardingProfileFixture=null;await screen.close()}
});

test('essay retry confirms the saved version before clearing its local draft',async()=>{
 const screen=await renderRoute('/redacoes');essayMode='failure';
 try{
  await act(async()=>document.querySelector('.redacoes-intro-actions button').click());await flush();
  await inputValue(document.getElementById('essay-topic'),'Educação e leitura');
  const text='Bibliotecas próximas facilitam o acesso à leitura e permitem compartilhar experiências. '.repeat(5);
  await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'),text);
  await act(async()=>button('Finalizar e enviar').click());await flush();
  assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto,text);
  essayMode='success';await act(async()=>button('Tentar salvar novamente').click());await flush();
  assert.ok(document.querySelector('.redacoes-page .save-feedback[data-state="saved"]'));
  assert.equal(localStorage.getItem('900001:essay-draft:v3'),null);
  assert.equal(document.querySelector('.essay-studio'),null);
 }finally{essayMode='';await screen.close()}
});

test('workshop recovers an unsent device draft explicitly and clears it after confirmation',async()=>{
 const draft={tema:'Minha tese preservada',tese:'Uma posição própria',argumentoUm:'',argumentoDois:'',repertorio:'',intervencao:'',rascunho:'',etapa:'TEMA'};
 const screen=await renderRoute('/redacoes','aluno',{}, {'900001:writing-workshop-draft:v1':JSON.stringify(draft)});
 try{
  await act(async()=>button('Abrir oficina →').click());await flush();
  assert.equal(document.querySelector('.writing-workshop-editor input').value,'');
  await act(async()=>button('Recuperar rascunho da oficina').click());
  assert.equal(document.querySelector('.writing-workshop-editor input').value,draft.tema);
  assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/redacao/projetos')).length,0);
  essayMode='workshopSuccess';await act(async()=>button('Salvar esta etapa').click());await flush();
  assert.ok(document.querySelector('.writing-workshop .save-feedback[data-state="saved"]'));
  assert.equal(localStorage.getItem('900001:writing-workshop-draft:v1'),null);
 }finally{essayMode='';await screen.close()}
});

test('welcome ignores another accounts visit and gives first study priority',async()=>{
 const screen=await renderRoute('/inicio','aluno',{}, {'900002:today-last-visit:v1':new Date(Date.now()-6*86400000).toISOString()});
 try{assert.equal(document.querySelector('.today-welcome').dataset.moment,'first');assert.ok(document.querySelector('.first-study-primary'));assert.ok(!document.querySelector('.today-details'))}finally{await screen.close()}
});

test('Lumi sends only selected snippets and removes the old conversation when context changes',async()=>{
 const screen=await renderRoute('/lumi');
 try{
  await act(async()=>document.querySelector('.lumi-context-add')?.closest('details').querySelector('summary').click());
  const field=document.querySelector('.lumi-context-add textarea');await inputValue(field,'Minha dúvida escolhida sobre força e aceleração.');
  await act(async()=>button('Adicionar trecho escolhido').click());
  await inputValue(document.getElementById('lumi-message'),'Explique esta ideia.');
  await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  const first=JSON.parse(requests.find(x=>x.method==='post'&&x.url.endsWith('/inteligencia/chat')).data);
  assert.equal(first.contextoEscolhido.itens[0].texto,'Minha dúvida escolhida sobre força e aceleração.');assert.deepEqual(first.contextoEscolhido.historico,[]);assert.equal(first.redacaoId,undefined);
  await act(async()=>document.querySelector('[aria-label="Retirar Minha dúvida do contexto"]').click());
  assert.equal(document.querySelectorAll('.lumi-message--assistant').length,0);
  await inputValue(document.getElementById('lumi-message'),'Agora explique energia.');
  await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  const last=JSON.parse(requests.filter(x=>x.method==='post'&&x.url.endsWith('/inteligencia/chat')).at(-1).data);
  assert.deepEqual(last.contextoEscolhido.itens,[]);assert.deepEqual(last.contextoEscolhido.historico,[]);assert.ok(!JSON.stringify(last).includes('dúvida escolhida'));
 }finally{await screen.close()}
});

test('starting Lumi without prior context removes session subject and pending practice',async()=>{
 window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}}));
 const screen=await renderRoute('/estudar');
 try{
  await act(async()=>document.querySelector('.study-desk-tool-toggle').click());await flush();
  await act(async()=>button('Começar sem contexto anterior').click());
  await inputValue(document.getElementById('lumi-message'),'Como interpretar um poema?');
  await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  const data=JSON.parse(requests.find(x=>x.method==='post'&&x.url.endsWith('/inteligencia/chat')).data);
  assert.equal(data.estudoAtual,undefined);assert.equal(data.disciplina,undefined);assert.deepEqual(data.contextoEscolhido.itens,[]);assert.deepEqual(data.contextoEscolhido.historico,[]);
 }finally{window.sessionStorage.clear();await screen.close()}
});

test('reading settings are scoped and a bookmark restores the matching section explicitly',async()=>{
 window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}}));
 const settings={size:24,width:48,spacing:2};
 const screen=await renderRoute('/estudar','aluno',{}, {'900001:reading-settings:v1':JSON.stringify(settings),'900001:reading-position:v1:9':JSON.stringify({index:1,title:'Entenda a ideia antes de praticar'})});
 try{
  const content=document.querySelector('.reading-content');assert.equal(content.style.getPropertyValue('--reading-size'),'1.5rem');assert.equal(content.style.getPropertyValue('--reading-width'),'48ch');
  assert.ok(button('Continuar de onde parei'));assert.ok(document.querySelector('.reading-resume'));
  await act(async()=>button('Continuar de onde parei').click());
  assert.equal(document.activeElement.querySelector('h3').textContent,'Entenda a ideia antes de praticar');
  assert.equal(JSON.parse(localStorage.getItem('900001:reading-position:v1:9')).index,1);
  const select=document.querySelector('.reading-settings select');await act(async()=>{select.value='20';select.dispatchEvent(new window.Event('change',{bubbles:true}))});
  assert.equal(JSON.parse(localStorage.getItem('900001:reading-settings:v1')).size,20);
  const result=await axe.run(document.querySelector('.reading-surface'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(x=>x.id),[]);
 }finally{window.sessionStorage.clear();await screen.close()}
});

test('reading ignores another accounts bookmark and stays usable when storage fails',async()=>{
 window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}}));
 const screen=await renderRoute('/estudar','aluno',{}, {'900002:reading-position:v1:9':JSON.stringify({index:1,title:'Registro privado'})});const original=window.Storage.prototype.setItem;
 try{
  assert.equal(document.querySelector('.reading-resume'),null);
  window.Storage.prototype.setItem=()=>{throw Error('quota')};
  const select=document.querySelector('.reading-settings select');await act(async()=>{select.value='22';select.dispatchEvent(new window.Event('change',{bubbles:true}))});
  assert.equal(document.querySelector('.reading-content').style.getPropertyValue('--reading-size'),'1.375rem');
  assert.match(document.querySelector('.reading-surface').textContent,/Não foi possível guardar/);
 }finally{window.Storage.prototype.setItem=original;window.sessionStorage.clear();await screen.close()}
});

test('viewing saved Lumi history does not add it to a new conversation context',async()=>{
 chatHistoryFixture=[{role:'user',conteudo:'Dúvida privada de uma conversa antiga.'}];
 const screen=await renderRoute('/lumi');
 try{
  assert.equal(document.querySelector('.lumi-history-readonly'),null);
  await act(async()=>button('Ver histórico salvo').click());await flush();
  assert.match(document.querySelector('.lumi-history-readonly').textContent,/conversa antiga/);
  await inputValue(document.getElementById('lumi-message'),'Explique uma metáfora.');
  await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  const data=JSON.parse(requests.find(x=>x.method==='post'&&x.url.endsWith('/inteligencia/chat')).data);assert.deepEqual(data.contextoEscolhido.historico,[]);assert.ok(!JSON.stringify(data).includes('conversa antiga'));
 }finally{chatHistoryFixture=[];await screen.close()}
});

test('search highlights matching text and directly opens the authorized note',async()=>{
 window.sessionStorage.clear();const screen=await renderRoute('/busca?q=newton&tipo=anotacoes');
 try{assert.ok(document.querySelector('.unified-search-card h3 mark'));assert.equal(document.querySelector('.unified-search-card h3 mark').textContent,'Newton');await act(async()=>button('Abrir anotação →').click());await flush();assert.ok(document.querySelector('.session-notes textarea'));assert.ok(requests.some(item=>item.url.endsWith('/busca/conteudos/9')&&item.params.anotacao==='1'))}finally{window.sessionStorage.clear();await screen.close()}
});

test('recent searches belong to the current account and can be cleared without repeating a search',async()=>{
 const screen=await renderRoute('/busca?q=Newton&tipo=anotacoes','aluno',{}, {'900002:recent-searches:v1':JSON.stringify([{q:'Registro de outra conta',type:'redacoes'}]),'900001:recent-searches:v1':JSON.stringify([{q:'Educação',type:'redacoes'}])});
 try{
  assert.ok(document.querySelector('.search-recent').textContent.includes('Educação'));assert.ok(!document.querySelector('.search-recent').textContent.includes('outra conta'));
  assert.equal(JSON.parse(localStorage.getItem('900001:recent-searches:v1'))[0].q,'Newton');
  const count=requests.filter(x=>x.url.endsWith('/busca')).length;await act(async()=>button('Limpar buscas recentes').click());assert.equal(localStorage.getItem('900001:recent-searches:v1'),null);assert.ok(localStorage.getItem('900002:recent-searches:v1'));assert.equal(requests.filter(x=>x.url.endsWith('/busca')).length,count);
 }finally{await screen.close()}
});

test('feedback previews exact page and text before sending and keeps them after a failure',async()=>{
 supportMode='failed';const screen=await renderRoute('/busca?q=Newton&tipo=anotacoes');
 try{
  await act(async()=>button('Sugerir melhoria').click());const panel=document.querySelector('.feedback-dialog');assert.equal(document.activeElement,panel);
  assert.equal(panel.querySelector('input[readonly]').value,'/busca');await inputValue(panel.querySelector('textarea'),'Gostaria de comparar minhas anotações.');
  await act(async()=>panel.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.match(panel.querySelector('.feedback-preview').textContent,/Gostaria de comparar/);assert.ok(!panel.textContent.includes('q=Newton'));
  assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/operacoes/suporte')).length,0);
  await act(async()=>button('Confirmar envio do feedback').click());await flush();assert.ok(panel.querySelector('[role="alert"]'));assert.match(panel.textContent,/Gostaria de comparar/);
  supportMode='saved';await act(async()=>button('Confirmar envio do feedback').click());await flush();assert.equal(document.querySelector('.feedback-dialog'),null);assert.match(document.querySelector('.feedback-entry').textContent,/Feedback #81 recebido/);
  const sent=JSON.parse(requests.filter(x=>x.method==='post'&&x.url.endsWith('/operacoes/suporte')).at(-1).data);assert.equal(sent.pagina,'/busca');assert.equal(sent.categoria,'MELHORIA');assert.equal(sent.captura,undefined);assert.equal(sent.detalhes,'');
 }finally{supportMode='';await screen.close()}
});

test('feedback screenshot remains local until confirmation and can be removed',async()=>{
 const screen=await renderRoute('/inicio');
 try{
  await act(async()=>button('Relatar um problema').click());const panel=document.querySelector('.feedback-dialog');
  await inputValue(panel.querySelector('textarea'),'O botão ficou difícil de encontrar.');
  const fileInput=panel.querySelector('input[type="file"]'),file=new window.File([new Uint8Array([137,80,78,71,13,10,26,10])],'captura-ficticia.png',{type:'image/png'});
  Object.defineProperty(fileInput,'files',{configurable:true,value:[file]});await act(async()=>fileInput.dispatchEvent(new window.Event('change',{bubbles:true})));await flush();
  assert.ok(panel.querySelector('.feedback-image img'));assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/operacoes/suporte')).length,0);
  const axeResult=await axe.run(panel,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(axeResult.violations.map(x=>x.id),[]);
  await act(async()=>button('Retirar captura').click());assert.equal(panel.querySelector('.feedback-image img'),null);
 }finally{await screen.close()}
});

test('reading highlights preserve a failed selection and save quote and annotation without calling Lumi',async()=>{
 window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}}));highlightSaveFailure=true;
 const screen=await renderRoute('/estudar');
 try{
  const span=document.querySelector('[data-reading-text]'),quote=span.textContent;const range=document.createRange();range.selectNodeContents(span);
  await act(async()=>{const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new window.Event('selectionchange'))});
  await act(async()=>button('Destacar trecho selecionado').click());
  await inputValue(document.querySelector('.reading-highlights textarea'),'Meu exemplo com um carrinho de compras.');
  await act(async()=>button('Salvar destaque e anotação').click());await flush();
  assert.ok(document.querySelector('.reading-highlights .save-feedback[data-state="error"]'));assert.equal(document.querySelector('.reading-highlights textarea').value,'Meu exemplo com um carrinho de compras.');
  assert.equal(JSON.parse(localStorage.getItem('900001:reading-highlight-draft:9')).trecho,quote);
  highlightSaveFailure=false;await act(async()=>document.querySelector('.reading-highlights .save-feedback button').click());await flush();
  assert.equal(document.querySelector('mark[data-reading-highlight]').textContent,quote);assert.equal(localStorage.getItem('900001:reading-highlight-draft:9'),null);
  assert.equal(requests.filter(item=>item.method==='post'&&item.url.endsWith('/inteligencia/chat')).length,0);
  const result=await axe.run(document.querySelector('.reading-highlights'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(item=>item.id),[]);
 }finally{highlightSaveFailure=false;readingHighlightsFixture=[];window.getSelection().removeAllRanges();window.sessionStorage.clear();await screen.close()}
});

test('highlight annotation edits preserve the original quote and removed highlights can be restored',async()=>{
 window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}}));
 readingHighlightsFixture=[{id:91,secao:'O que você precisa aprender',trecho:'As leis de Newton',nota:'Minha primeira ideia.',versao:1,arquivado:0}];
 const screen=await renderRoute('/estudar');
 try{
  await act(async()=>document.querySelector('.reading-highlights>summary').click());await act(async()=>button('Editar anotação').click());
  await inputValue(document.querySelector('.reading-highlights textarea'),'Uma explicação melhor com meu exemplo.');await act(async()=>button('Salvar destaque e anotação').click());await flush();
  assert.equal(readingHighlightsFixture[0].trecho,'As leis de Newton');assert.equal(readingHighlightsFixture[0].nota,'Uma explicação melhor com meu exemplo.');
  await act(async()=>button('Retirar destaque').click());await flush();assert.equal(readingHighlightsFixture[0].arquivado,1);
  await act(async()=>button('Ver destaques retirados').click());await flush();assert.ok(button('Restaurar destaque'));
  await act(async()=>button('Restaurar destaque').click());await flush();assert.equal(readingHighlightsFixture[0].arquivado,0);
 }finally{readingHighlightsFixture=[];window.sessionStorage.clear();await screen.close()}
});

test('Lumi saves an objective and only resumes its chosen conversation after context review',async()=>{
 chatPlainReply=true;const screen=await renderRoute('/lumi');
 try{
  await inputValue(document.getElementById('lumi-message'),'Quero entender a força resultante.');await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  await act(async()=>document.querySelector('.lumi-conversations>summary').click());await inputValue(document.querySelector('.lumi-conversations input'),'Entender Newton');
  await act(async()=>button('Guardar conversa por objetivo').click());await flush();assert.equal(conversationsFixture[0].mensagens.length,2);assert.equal(conversationsFixture[0].objetivo,'Entender Newton');
  const calls=requests.filter(item=>item.method==='post'&&item.url.endsWith('/inteligencia/chat')).length;
  await act(async()=>button('Começar sem contexto anterior').click());await act(async()=>document.querySelector('.lumi-conversations>summary').click());
  await act(async()=>button('Consultar conversas guardadas').click());await flush();await act(async()=>button('Conferir antes de retomar').click());await flush();
  assert.ok(document.querySelector('.lumi-conversation-preview'));assert.equal(document.querySelectorAll('.lumi-message--assistant').length,0);
  await act(async()=>button('Retomar com este contexto').click());assert.equal(document.querySelectorAll('.lumi-message--assistant').length,1);assert.equal(document.querySelector('.lumi-conversations input').value,'Entender Newton');
  assert.equal(requests.filter(item=>item.method==='post'&&item.url.endsWith('/inteligencia/chat')).length,calls);
  await act(async()=>document.querySelector('.lumi-conversations>summary').click());
  const result=await axe.run(document.querySelector('.lumi-conversations'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(item=>item.id),[]);
 }finally{chatPlainReply=false;conversationsFixture=[];await screen.close()}
});

test('a conversation save conflict preserves messages and archiving can be reversed',async()=>{
 chatPlainReply=true;const screen=await renderRoute('/lumi');
 try{
  await inputValue(document.getElementById('lumi-message'),'Como relacionar força e aceleração?');await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  await act(async()=>document.querySelector('.lumi-conversations>summary').click());await inputValue(document.querySelector('.lumi-conversations input'),'Meu estudo de Física');conversationSaveFailure=true;
  await act(async()=>button('Guardar conversa por objetivo').click());await flush();assert.ok(document.querySelector('.lumi-conversations .save-feedback[data-state="error"]'));assert.equal(document.querySelectorAll('.lumi-message--assistant').length,1);
  conversationSaveFailure=false;await act(async()=>document.querySelector('.lumi-conversations .save-feedback button').click());await flush();
  await act(async()=>button('Consultar conversas guardadas').click());await flush();await act(async()=>button('Arquivar conversa').click());await flush();assert.equal(conversationsFixture[0].arquivado,1);
  await act(async()=>button('Ver conversas arquivadas').click());await flush();await act(async()=>button('Restaurar conversa').click());await flush();assert.equal(conversationsFixture[0].arquivado,0);
 }finally{chatPlainReply=false;conversationSaveFailure=false;conversationsFixture=[];await screen.close()}
});

test('a delayed objective save cannot erase later messages or mark them as already saved',async()=>{
 chatPlainReply=true;const screen=await renderRoute('/lumi');
 try{
  await inputValue(document.getElementById('lumi-message'),'Uma primeira pergunta.');await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  await act(async()=>document.querySelector('.lumi-conversations>summary').click());await inputValue(document.querySelector('.lumi-conversations input'),'Investigar uma ideia');conversationSaveDeferred=true;
  await act(async()=>button('Guardar conversa por objetivo').click());assert.ok(document.querySelector('.lumi-conversations .save-feedback[data-state="saving"]'));
  await inputValue(document.getElementById('lumi-message'),'Uma pergunta posterior.');await act(async()=>document.getElementById('lumi-message').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  await act(async()=>resolveConversationSave());await flush();assert.equal(document.querySelectorAll('.lumi-message--user').length,2);assert.equal(document.querySelectorAll('.lumi-message--assistant').length,2);assert.equal(conversationsFixture[0].mensagens.length,2);assert.ok(document.querySelector('.lumi-conversations .save-feedback[data-state="pending"]'));
 }finally{conversationSaveDeferred=false;chatPlainReply=false;conversationsFixture=[];await screen.close()}
});

test('search opens a full personal highlight and prepares an editable review without implicit saving',async()=>{
 searchMode='memory';readingHighlightsFixture=[{id:91,material_key:'9',titulo:'Leis de Newton',secao:'Conceito',trecho:'A força resultante produz aceleração.',nota:'Meu exemplo com carrinho.',versao:1,arquivado:0}];
 const screen=await renderRoute('/busca?q=força&tipo=todos');
 try{
  assert.ok(button('Destaques'));assert.ok(button('Conversas da Lumi'));assert.ok(document.querySelector('a[href="/lumi?conversa=81"]'));
  await act(async()=>button('Abrir destaque +').click());await flush();assert.match(document.querySelector('.search-highlight-detail').textContent,/Meu exemplo com carrinho/);
  await act(async()=>button('Criar pergunta de revisão').click());assert.equal(requests.filter(x=>x.url.endsWith('/registros/perguntas')).length,0);
  const inputs=document.querySelectorAll('.highlight-review textarea');await inputValue(inputs[0],'O que muda no carrinho quando há força resultante?');await inputValue(inputs[1],'Sua velocidade muda: ocorre aceleração.');reviewSaveFailure=true;
  await act(async()=>button('Salvar pergunta nos meus cartões').click());await flush();assert.ok(document.querySelector('.highlight-review .save-feedback[data-state="error"]'));assert.equal(inputs[1].value,'Sua velocidade muda: ocorre aceleração.');assert.ok(localStorage.getItem('900001:highlight-review-draft:91'));
  reviewSaveFailure=false;await act(async()=>document.querySelector('.highlight-review .save-feedback button').click());await flush();assert.ok(document.querySelector('.highlight-review .save-feedback[data-state="saved"]'));assert.equal(localStorage.getItem('900001:highlight-review-draft:91'),null);
  const posts=requests.filter(x=>x.url.endsWith('/registros/perguntas'));assert.equal(posts.length,2);assert.equal(JSON.parse(posts[0].data).chave,JSON.parse(posts[1].data).chave);assert.equal(JSON.parse(posts[1].data).resposta,'Sua velocidade muda: ocorre aceleração.');assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/inteligencia/chat')).length,0);
  assert.ok(document.querySelector('a[href="/ferramentas-estudo?aba=ferramentas&cartao=141"]'));const result=await axe.run(document.querySelector('.unified-search'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(x=>x.id),[]);
 }finally{searchMode='';readingHighlightsFixture=[];reviewSaveFailure=false;await screen.close()}
});

test('search cannot open a withdrawn highlight and preserves a recoverable error',async()=>{
 searchMode='memory';highlightSaveFailure=true;const screen=await renderRoute('/busca?q=força&tipo=destaques');try{await act(async()=>button('Abrir destaque +').click());await flush();assert.ok(button('Consultar destaque novamente'));assert.equal(document.querySelector('.highlight-review'),null)}finally{searchMode='';highlightSaveFailure=false;await screen.close()}
});

test('conversation search link opens the exact context preview before restoring or consulting Lumi',async()=>{
 conversationsFixture=[{id:81,objetivo:'Entender Newton',materia:'Física',itens:[{tipo:'anotacao',titulo:'Meu carrinho',texto:'Força resultante muda a velocidade.'}],mensagens:[{role:'user',content:'Por que ocorre aceleração?'},{role:'assistant',content:'A resultante produz aceleração.'}],versao:1,arquivado:0}];
 const screen=await renderRoute('/lumi?conversa=81');try{const preview=document.querySelector('.lumi-conversation-preview');assert.ok(preview);assert.match(preview.textContent,/Meu carrinho/);assert.equal(document.querySelectorAll('.lumi-message--assistant').length,0);await act(async()=>button('Retomar com este contexto').click());assert.equal(document.querySelectorAll('.lumi-message--assistant').length,1);assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/inteligencia/chat')).length,0)}finally{conversationsFixture=[];await screen.close()}
});

test('reading selection prepares at most five independent questions, preserves a draft on reopening and does not auto-save',async()=>{
 window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}}));readingHighlightsFixture=Array.from({length:6},(_,i)=>({id:91+i,titulo:'Leis de Newton',secao:'Conceito',trecho:`Trecho de estudo número ${i+1}.`,nota:'',versao:1,arquivado:0}));const screen=await renderRoute('/estudar');
 try{await act(async()=>document.querySelector('.reading-highlights>summary').click());const checks=[...document.querySelectorAll('.highlight-review-selection input')];for(const check of checks.slice(0,5))await act(async()=>check.click());assert.equal(checks[5].disabled,true);await act(async()=>button('Preparar perguntas dos destaques').click());assert.equal(document.querySelectorAll('.highlight-review-card').length,5);assert.equal(requests.filter(x=>x.url.endsWith('/registros/perguntas')).length,0);await inputValue(document.querySelector('.highlight-review textarea'),'Minha pergunta preservada ao reabrir.');await act(async()=>button('Fechar preparação das perguntas').click());await act(async()=>checks[0].click());await act(async()=>button('Preparar perguntas dos destaques').click());assert.equal(document.querySelector('.highlight-review textarea').value,'Minha pergunta preservada ao reabrir.');const result=await axe.run(document.querySelector('.highlight-review'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(x=>x.id),[])}finally{readingHighlightsFixture=[];window.sessionStorage.clear();await screen.close()}
});

test('the saved review link opens the exact card with its source even outside the first five cards',async()=>{
 const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas&cartao=141');try{assert.match(document.body.textContent,/Como a força muda o movimento/);await act(async()=>button('Revelar resposta').click());assert.match(document.body.textContent,/A força resultante produz aceleração/);assert.ok(document.body.textContent.includes('Trecho que originou esta pergunta'));await act(async()=>button('Lembrei').click());await flush();assert.ok(!document.body.textContent.includes('Como a força muda o movimento?'));assert.ok(requests.some(x=>x.method==='post'&&x.url.endsWith('/cartoes/141/avaliar')))}finally{await screen.close()}
});

const seedCard=(id=141,patch={})=>({id_flashcard:id,frente:'Como a força muda o movimento?',verso:'A resultante produz aceleração.',disciplina:'Física',versao:1,arquivado:0,proxima_revisao:'2026-01-01',...patch});
test('card library edits preserve drafts on failure and support archive, restore and subject filters',async()=>{
 cardLibraryFixture=[seedCard(),seedCard(142,{frente:'Como estudar proporções?',disciplina:'Matemática'})];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');
 try{assert.equal(document.querySelectorAll('.library-card').length,2);await act(async()=>button('Editar cartão').click());const inputs=document.querySelectorAll('.card-editor textarea');await inputValue(inputs[0],'Como a resultante muda a velocidade?');await inputValue(inputs[1],'Ela produz aceleração e muda a velocidade.');cardWriteFailure=true;await act(async()=>button('Salvar alterações do cartão').click());await flush();assert.ok(document.querySelector('.card-editor .save-feedback[data-state="error"]'));assert.equal(inputs[1].value,'Ela produz aceleração e muda a velocidade.');assert.ok(localStorage.getItem('900001:card-editor:141'));cardWriteFailure=false;await act(async()=>document.querySelector('.card-editor .save-feedback button').click());await flush();assert.equal(cardLibraryFixture[0].frente,'Como a resultante muda a velocidade?');assert.equal(cardLibraryFixture[0].proxima_revisao,'2026-01-01');assert.equal(localStorage.getItem('900001:card-editor:141'),null);
 await act(async()=>button('Arquivar cartão').click());await flush();assert.equal(cardLibraryFixture[0].arquivado,1);const filters=document.querySelectorAll('.card-library-filters select');await selectValue(filters[1],'arquivados');await flush();assert.equal(document.querySelectorAll('.library-card').length,1);await act(async()=>button('Restaurar cartão').click());await flush();assert.equal(cardLibraryFixture[0].arquivado,0);await selectValue(filters[1],'ativos');await selectValue(filters[0],'subject:Matemática');await flush();assert.equal(document.querySelectorAll('.library-card').length,1);assert.match(document.querySelector('.library-card').textContent,/proporções/);const result=await axe.run(document.querySelector('.card-library'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(x=>x.id),[]);
 }finally{cardLibraryFixture=[];cardWriteFailure=false;await screen.close()}
});
test('card editor conflict preserves the draft while showing the version saved in the account',async()=>{
 cardLibraryFixture=[seedCard()];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{await act(async()=>button('Editar cartão').click());await inputValue(document.querySelector('.card-editor textarea'),'Minha pergunta que precisa continuar aqui.');cardConflict=true;await act(async()=>button('Salvar alterações do cartão').click());await flush();await act(async()=>button('Conferir versão da conta').click());await flush();assert.equal(document.querySelector('.card-editor textarea').value,'Minha pergunta que precisa continuar aqui.');assert.ok(document.querySelector('[aria-label="Versão atual do cartão"]'));assert.equal(cardLibraryFixture[0].frente,'Como a força muda o movimento?')}finally{cardLibraryFixture=[];cardConflict=false;await screen.close()}
});
test('short review adapts the budget, keeps a failed rating open and confirms only an explicit retry',async()=>{
 cardLibraryFixture=[seedCard(),seedCard(142,{frente:'Como a massa afeta a aceleração?'}),seedCard(143,{frente:'O que é inércia?'}),seedCard(144,{proxima_revisao:'2099-01-01'}),seedCard(145,{arquivado:1})];const screen=await renderRoute('/inicio');try{const panel=document.querySelector('.today-quick-review');assert.match(panel.textContent,/3 cartões escolhidos/);await act(async()=>button('3 minutos').click());await flush();assert.match(panel.textContent,/2 cartões escolhidos/);await act(async()=>button('Começar revisão curta →').click());assert.equal(panel.querySelector('.card-answer'),null);await act(async()=>button('Revelar resposta').click());cardWriteFailure=true;await act(async()=>button('Lembrei').click());await flush();assert.match(panel.textContent,/Cartão 1 de 2/);assert.ok(panel.querySelector('[role="alert"]'));cardWriteFailure=false;await act(async()=>button('Lembrei').click());await flush();assert.match(panel.textContent,/Cartão 2 de 2/);const posts=requests.filter(x=>x.url.endsWith('/cartoes/141/avaliar'));assert.equal(posts.length,2);assert.equal(JSON.parse(posts[0].data).chave,JSON.parse(posts[1].data).chave);await act(async()=>button('Deixar este para depois').click());assert.match(panel.textContent,/1 cartão revisado e salvo/);assert.match(panel.textContent,/1 ficou para depois/);assert.equal(cardLibraryFixture[1].proxima_revisao,'2026-01-01');const result=await axe.run(panel,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(x=>x.id),[])}finally{cardLibraryFixture=[];cardWriteFailure=false;await screen.close()}
});
test('short review distinguishes a connection failure from an empty due queue',async()=>{
 cardReadFailure=true;const screen=await renderRoute('/inicio');try{assert.ok(button('Consultar revisão curta novamente'));assert.ok(!document.querySelector('.today-quick-review').textContent.includes('Não há cartões pendentes'));cardReadFailure=false;await act(async()=>button('Consultar revisão curta novamente').click());await flush();assert.match(document.querySelector('.today-quick-review').textContent,/Não há cartões pendentes para hoje/);assert.equal(button('Começar revisão curta →'),undefined)}finally{cardReadFailure=false;await screen.close()}
});

test('new manual cards recover a closed draft and retry with the same creation key',async()=>{
 const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{await act(async()=>button('Criar novo cartão').click());const fields=document.querySelectorAll('.card-editor textarea');await inputValue(fields[0],'Como reconhecer uma proporção?');await inputValue(fields[1],'Comparando razões entre grandezas.');cardWriteFailure=true;await act(async()=>button('Criar cartão de revisão').click());await flush();await act(async()=>button('Fechar editor').click());await act(async()=>button('Criar novo cartão').click());assert.equal(document.querySelector('.card-editor textarea').value,'Como reconhecer uma proporção?');cardWriteFailure=false;await act(async()=>button('Criar cartão de revisão').click());await flush();assert.equal(cardLibraryFixture.length,1);const posts=requests.filter(x=>x.method==='post'&&x.url.endsWith('/aprendizagem/cartoes'));assert.equal(posts.length,2);assert.equal(JSON.parse(posts[0].data).chave,JSON.parse(posts[1].data).chave);assert.ok(document.querySelector('[aria-label="Cartão aberto pelo link"]'));assert.equal(localStorage.getItem('900001:card-editor:new'),null)}finally{cardLibraryFixture=[];cardWriteFailure=false;await screen.close()}
});
test('ending a short round keeps confirmed ratings and leaves untouched cards pending',async()=>{
 cardLibraryFixture=[seedCard(),seedCard(142),seedCard(143)];const screen=await renderRoute('/inicio');try{await act(async()=>button('Começar revisão curta →').click());await act(async()=>button('Revelar resposta').click());await act(async()=>button('Lembrei').click());await flush();await act(async()=>button('Encerrar por agora').click());await flush();const panel=document.querySelector('.today-quick-review');assert.match(panel.textContent,/1 cartão revisado nesta rodada/);assert.match(panel.textContent,/2 cartões escolhidos/);assert.equal(requests.filter(x=>x.method==='post'&&x.url.includes('/cartoes/')&&x.url.endsWith('/avaliar')).length,1);assert.equal(cardLibraryFixture[1].proxima_revisao,'2026-01-01');assert.equal(cardLibraryFixture[2].proxima_revisao,'2026-01-01')}finally{cardLibraryFixture=[];await screen.close()}
});

test('card search highlights the answer excerpt and opens the exact private card and its history',async()=>{
 searchMode='cards';cardLibraryFixture=[seedCard()];cardHistoryFixture=[];const screen=await renderRoute('/busca?q=aceleração&tipo=cartoes');try{assert.ok(button('Cartões de revisão'));assert.equal(document.querySelector('.unified-search-card p mark').textContent,'aceleração');const link=document.querySelector('a[href="/ferramentas-estudo?aba=ferramentas&cartao=141"]');assert.ok(link);await act(async()=>link.click());await flush();assert.ok(document.querySelector('[aria-label="Cartão aberto pelo link"]'));assert.equal(requests.filter(x=>x.url.endsWith('/historico')).length,0);await act(async()=>document.querySelector('.card-history>summary').click());await flush();assert.match(document.querySelector('.card-history').textContent,/Nenhuma revisão registrada neste histórico ainda/);assert.ok(requests.some(x=>x.url.endsWith('/cartoes/141/historico')&&x.cache===false))}finally{searchMode='';cardLibraryFixture=[];cardHistoryFixture=[];await screen.close()}
});
const seedHistory=(id,patch={})=>({id,idFlashcard:141,resultado:'DIFICIL',versaoCartao:id,pergunta:'Uma pergunta anterior sobre força?',resposta:'Minha resposta anterior com exemplo.',disciplina:'Física',revisadoEm:'2026-10-26T03:00:00.000Z',proximaRevisao:'2026-10-29',intervaloDias:3,textoMudou:true,...patch});
test('history recovers from a connection failure, shows dated evidence and preserves the original attempt text',async()=>{
 cardLibraryFixture=[seedCard()];cardHistoryFixture=[seedHistory(3,{resultado:'LEMBREI',intervaloDias:7}),seedHistory(2),seedHistory(1,{resultado:'ERREI',intervaloDias:1})];cardHistoryFailure=true;const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{assert.equal(requests.filter(x=>x.url.endsWith('/historico')).length,0);await act(async()=>document.querySelector('.card-history>summary').click());await flush();assert.ok(button('Consultar histórico novamente'));assert.ok(!document.querySelector('.card-history').textContent.includes('Nenhuma revisão registrada'));cardHistoryFailure=false;await act(async()=>button('Consultar histórico novamente').click());await flush();const history=document.querySelector('.card-history');assert.match(history.textContent,/3 avaliações registradas/);assert.match(history.textContent,/2 foram marcadas/);assert.match(history.textContent,/não foram reconstruídas/);assert.equal(history.querySelector('time').textContent,'26/10/2026, 00:00');await act(async()=>history.querySelector('.card-history-timeline details summary').click());assert.match(history.textContent,/Uma pergunta anterior sobre força/);assert.match(history.textContent,/pergunta ou resposta atual é diferente/);const result=await axe.run(history,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(x=>x.id),[])}finally{cardLibraryFixture=[];cardHistoryFixture=[];cardHistoryFailure=false;await screen.close()}
});
test('history paginates and remains readable for archived cards without changing their schedule',async()=>{
 cardLibraryFixture=[seedCard(141,{arquivado:1})];cardHistoryFixture=Array.from({length:25},(_,i)=>seedHistory(25-i));const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{await selectValue(document.querySelectorAll('.card-library-filters select')[1],'arquivados');await flush();await act(async()=>document.querySelector('.card-history>summary').click());await flush();assert.equal(document.querySelectorAll('.card-history-timeline>li').length,20);await act(async()=>button('Próximas →').click());await flush();assert.equal(document.querySelectorAll('.card-history-timeline>li').length,5);assert.equal(document.querySelector('.card-history-suggestion'),null);assert.ok(requests.some(x=>x.url.endsWith('/historico')&&x.params.pagina===2));assert.equal(requests.filter(x=>x.method!=='get'&&x.url.includes('/cartoes')).length,0)}finally{cardLibraryFixture=[];cardHistoryFixture=[];await screen.close()}
});
test('a rating from Today is available in the card history after reopening the library',async()=>{
 cardLibraryFixture=[seedCard()];cardHistoryFixture=[];const screen=await renderRoute('/inicio');try{await act(async()=>button('Começar revisão curta →').click());await act(async()=>button('Revelar resposta').click());await act(async()=>button('Lembrei').click());await flush();assert.equal(cardHistoryFixture.length,1);await act(async()=>document.querySelector('a[href="/ferramentas-estudo?aba=ferramentas"]').click());await flush();await act(async()=>document.querySelector('.card-history>summary').click());await flush();assert.match(document.querySelector('.card-history').textContent,/1 avaliação registrada/);assert.equal(document.querySelector('.card-history-timeline strong').textContent,'Lembrei');assert.equal(cardHistoryFixture[0].pergunta,'Como a força muda o movimento?')}finally{cardLibraryFixture=[];cardHistoryFixture=[];await screen.close()}
});

test('card improvement preserves the observation after failure and keeps the review date',async()=>{
 cardLibraryFixture=[seedCard()];const original=cardLibraryFixture[0].proxima_revisao;const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 await act(async()=>button('Organizar cartão').click());await flush();await inputValue(document.querySelector('.card-organization textarea'),'Separar força e velocidade.');cardWriteFailure=true;await act(async()=>button('Marcar para melhorar').click());await flush();assert.equal(document.querySelector('.card-organization textarea').value,'Separar força e velocidade.');assert.equal(cardLibraryFixture[0].melhorar,undefined);
 cardWriteFailure=false;await act(async()=>button('Marcar para melhorar').click());await flush();assert.equal(cardLibraryFixture[0].melhorar,1);assert.equal(cardLibraryFixture[0].proxima_revisao,original);assert.match(document.querySelector('.card-improvement-badge').textContent,/Separar força/);
 await act(async()=>button('Organizar cartão').click());await flush();await act(async()=>button('Concluir melhoria').click());await flush();assert.equal(cardLibraryFixture[0].melhorar,0);assert.equal(cardLibraryFixture[0].proxima_revisao,original);
 }finally{cardLibraryFixture=[];cardWriteFailure=false;await screen.close()}
});
test('collections group private cards by objective and removal preserves the original card',async()=>{
 cardLibraryFixture=[seedCard()];cardCollectionsFixture=[];cardMembershipsFixture=[];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 await act(async()=>button('Criar coleção por objetivo').click());await inputValue(document.querySelector('.card-collections-create input'),'Prova de Física');await inputValue(document.querySelector('.card-collections-create textarea'),'Distinguir força e aceleração.');await act(async()=>document.querySelector('.card-collections-create form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(cardCollectionsFixture.length,1);
 await act(async()=>button('Organizar cartão').click());await flush();await act(async()=>document.querySelector('.card-organization input[type=checkbox]').click());await flush();assert.deepEqual(cardMembershipsFixture,[{collection:31,card:141}]);
 await selectValue(document.querySelector('.card-objective-filters select'),'31');await flush();assert.equal(document.querySelectorAll('.library-card').length,1);assert.match(document.querySelector('.card-collection-summary').textContent,/Distinguir força/);
 const audit=await axe.run(document.querySelector('.card-library'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(audit.violations.map(x=>x.id),[]);
 await act(async()=>button('Remover coleção').click());assert.equal(cardCollectionsFixture.length,1);await act(async()=>button('Confirmar remoção da coleção').click());await flush();assert.equal(cardCollectionsFixture.length,0);assert.equal(cardLibraryFixture.length,1);assert.equal(cardMembershipsFixture.length,0);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];await screen.close()}
});

test('collection editing keeps draft on failure and explicitly compares a conflicting version',async()=>{
 cardLibraryFixture=[seedCard()];cardCollectionsFixture=[{id:31,nome:'Física',objetivo:'Revisar energia.',versao:1}];cardMembershipsFixture=[{collection:31,card:141}];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 await selectValue(document.querySelector('.card-objective-filters select'),'31');await flush();await act(async()=>button('Editar coleção').click());await inputValue(document.querySelector('.collection-editor input'),'Prova de Física');await inputValue(document.querySelector('.collection-editor textarea'),'Distinguir força e velocidade.');
 cardWriteFailure=true;await act(async()=>document.querySelector('.collection-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(document.querySelector('.collection-editor textarea').value,'Distinguir força e velocidade.');assert.equal(cardCollectionsFixture[0].nome,'Física');
 cardWriteFailure=false;Object.assign(cardCollectionsFixture[0],{nome:'Nome em outra tela',objetivo:'Outro objetivo salvo.',versao:2});await act(async()=>document.querySelector('.collection-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.ok(button('Salvar alterações da coleção').disabled);await act(async()=>button('Consultar versão atual da coleção').click());await flush();assert.match(document.querySelector('.collection-conflict').textContent,/Nome em outra tela/);assert.equal(document.querySelector('.collection-editor input').value,'Prova de Física');await act(async()=>button('Usar esta versão como base').click());await act(async()=>document.querySelector('.collection-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(cardCollectionsFixture[0].versao,3);assert.equal(cardCollectionsFixture[0].nome,'Prova de Física');assert.deepEqual(cardMembershipsFixture,[{collection:31,card:141}]);assert.equal(cardLibraryFixture[0].proxima_revisao,'2026-01-01');
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];cardWriteFailure=false;await screen.close()}
});
test('Today short review selects only the chosen collection and retries the same rating',async()=>{
 cardLibraryFixture=[seedCard(141),seedCard(142),seedCard(143,{proxima_revisao:'2099-01-01'}),seedCard(144,{arquivado:1})];cardCollectionsFixture=[{id:31,nome:'Prova de Física',objetivo:'Distinguir movimento.',versao:1}];cardMembershipsFixture=[{collection:31,card:141},{collection:31,card:143},{collection:31,card:144}];cardHistoryFixture=[];const screen=await renderRoute('/inicio');try{
 await selectValue(document.querySelector('.quick-review-collection select'),'31');await flush();const panel=document.querySelector('.today-quick-review');assert.match(panel.textContent,/1 cartão escolhido/);assert.match(panel.textContent,/Distinguir movimento/);assert.ok(requests.some(x=>x.url.endsWith('/cartoes/curta')&&x.params.colecao==='31'));
 await act(async()=>button('Começar revisão curta →').click());assert.equal(panel.querySelector('.quick-review-collection'),null);await act(async()=>panel.querySelector('.quick-review-prompt button').click());cardWriteFailure=true;await act(async()=>button('Lembrei').click());await flush();assert.equal(cardHistoryFixture.length,0);assert.match(panel.textContent,/Cartão ainda não confirmado/);cardWriteFailure=false;await act(async()=>button('Lembrei').click());await flush();assert.match(panel.textContent,/Sua rodada terminou/);assert.equal(cardHistoryFixture.length,1);assert.equal(cardHistoryFixture[0].idFlashcard,141);const posts=requests.filter(x=>x.url.endsWith('/avaliar'));assert.equal(JSON.parse(posts[0].data).chave,JSON.parse(posts[1].data).chave);assert.equal(cardLibraryFixture[1].proxima_revisao,'2026-01-01');
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];cardHistoryFixture=[];cardWriteFailure=false;await screen.close()}
});
test('library starts a short collection round and keeps empty collections separate from the general queue',async()=>{
 cardLibraryFixture=[seedCard(141),seedCard(142,{proxima_revisao:'2099-01-01'})];cardCollectionsFixture=[{id:31,nome:'Física',objetivo:'Revisar energia.',versao:1},{id:32,nome:'Para depois',objetivo:'Preparar a próxima prova.',versao:1}];cardMembershipsFixture=[{collection:31,card:141},{collection:32,card:142}];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 await selectValue(document.querySelector('.card-objective-filters select'),'31');await flush();await act(async()=>button('Revisar esta coleção').click());await flush();assert.ok(document.querySelector('[aria-label="Revisão curta da coleção"]'));assert.ok(button('Começar revisão curta →'));const audit=await axe.run(document.querySelector('.card-library'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(audit.violations.map(x=>x.id),[]);
 await selectValue(document.querySelector('.card-objective-filters select'),'32');await flush();await act(async()=>button('Revisar esta coleção').click());await flush();assert.match(document.querySelector('[aria-label="Revisão curta da coleção"]').textContent,/Esta coleção não tem cartões pendentes/);assert.equal(button('Começar revisão curta →'),undefined);assert.equal(requests.filter(x=>x.method!=='get'&&x.url.endsWith('/avaliar')).length,0);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];await screen.close()}
});

test('collection indicators distinguish due, improvement and archived cards and open the exact filter',async()=>{
 cardLibraryFixture=[seedCard(141,{melhorar:1}),seedCard(142,{proxima_revisao:'2099-01-01'}),seedCard(143,{arquivado:1,melhorar:1})];cardCollectionsFixture=[{id:31,nome:'Física',objetivo:'Revisar energia.',versao:1}];cardMembershipsFixture=cardLibraryFixture.map(c=>({collection:31,card:c.id_flashcard}));const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 const overview=document.querySelector('.collection-overview'),counts=Object.fromEntries([...overview.querySelectorAll('.collection-counts>div')].map(x=>[x.querySelector('dt').textContent,x.querySelector('dd').textContent]));assert.deepEqual(counts,{'Ativos':'2','Pendentes para hoje':'1','Para melhorar':'1','Arquivados':'1'});assert.match(overview.textContent,/3 cartões no total/);await act(async()=>[...overview.querySelectorAll('button')].find(x=>x.textContent==='Ver pendentes (1)').click());await flush();assert.equal(document.querySelector('.card-objective-filters select').value,'31');assert.equal(document.querySelectorAll('.card-library-filters select')[2].value,'pendentes');assert.equal(document.querySelectorAll('.library-card').length,1);assert.ok(requests.some(x=>x.url.endsWith('/cartoes')&&x.params.colecao==='31'&&x.params.estado==='pendentes'));
 await act(async()=>[...document.querySelector('.collection-overview').querySelectorAll('button')].find(x=>x.textContent==='Ver cartões para melhorar (1)').click());await flush();assert.ok(document.querySelector('.card-objective-filters input').checked);assert.equal(document.querySelectorAll('.card-library-filters select')[2].value,'todos');assert.equal(document.querySelectorAll('.library-card').length,1);
 const audit=await axe.run(document.querySelector('.card-library'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(audit.violations.map(x=>x.id),[]);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];await screen.close()}
});
test('bulk collection selection spans pages, previews the exact cards and survives a failed confirmation',async()=>{
 cardLibraryFixture=Array.from({length:14},(_,i)=>seedCard(141+i,{frente:`Como estudar o conceito ${i+1}?`}));const original=JSON.stringify(cardLibraryFixture);cardCollectionsFixture=[{id:31,nome:'Prova',objetivo:'Revisar todos os conceitos.',versao:1}];cardMembershipsFixture=[];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 await act(async()=>button('Selecionar vários cartões').click());await act(async()=>button('Selecionar cartões desta página').click());assert.match(document.querySelector('.card-bulk-organizer').textContent,/12 cartões selecionados/);await act(async()=>button('Próximos →').click());await flush();await act(async()=>button('Selecionar cartões desta página').click());assert.match(document.querySelector('.card-bulk-organizer').textContent,/14 cartões selecionados/);await act(async()=>document.querySelector('.card-bulk-preview summary').click());assert.equal(document.querySelectorAll('.card-bulk-preview li').length,14);await selectValue(document.querySelector('.card-bulk-organizer select'),'31');cardWriteFailure=true;
 await act(async()=>document.querySelector('.card-bulk-organizer').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(cardMembershipsFixture.length,0);assert.match(document.querySelector('.card-bulk-organizer').textContent,/14 cartões selecionados/);assert.equal(document.querySelector('.card-bulk-organizer select').value,'31');cardWriteFailure=false;
 await act(async()=>document.querySelector('.card-bulk-organizer').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.equal(cardMembershipsFixture.length,14);assert.equal(JSON.stringify(cardLibraryFixture),original);assert.match(document.querySelector('.card-bulk-organizer').textContent,/0 cartões selecionados/);const sends=requests.filter(x=>x.method==='put'&&/colecoes\/31\/cartoes$/.test(x.url));assert.equal(sends.length,2);assert.deepEqual(JSON.parse(sends[0].data),JSON.parse(sends[1].data));assert.match(document.querySelector('.card-library-notice').textContent,/14 cartões confirmados/);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];cardWriteFailure=false;await screen.close()}
});
test('bulk selection stays across filters and never exceeds fifty cards',async()=>{
 cardLibraryFixture=Array.from({length:52},(_,i)=>seedCard(141+i,{frente:`Como estudar o conceito ${i+1}?`,disciplina:i<50?'Física':'Matemática'}));cardCollectionsFixture=[{id:31,nome:'Prova',objetivo:'Revisar conceitos.',versao:1}];cardMembershipsFixture=[];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 await act(async()=>button('Selecionar vários cartões').click());for(let page=0;page<4;page++){await act(async()=>button('Selecionar cartões desta página').click());await act(async()=>button('Próximos →').click());await flush()}
 await act(async()=>button('Selecionar cartões desta página').click());assert.match(document.querySelector('.card-bulk-organizer').textContent,/48 cartões selecionados/);const options=[...document.querySelectorAll('.card-selection-choice input')];await act(async()=>options[0].click());await act(async()=>options[1].click());await act(async()=>options[2].click());assert.match(document.querySelector('.card-bulk-organizer').textContent,/50 cartões selecionados/);assert.equal(options[2].checked,false);await selectValue(document.querySelectorAll('.card-library-filters select')[0],'subject:Matemática');await flush();assert.match(document.querySelector('.card-bulk-organizer').textContent,/50 cartões selecionados/);assert.equal(document.querySelectorAll('.library-card').length,2);
 const audit=await axe.run(document.querySelector('.card-bulk-organizer'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(audit.violations.map(x=>x.id),[]);await act(async()=>button('Limpar seleção').click());assert.match(document.querySelector('.card-bulk-organizer').textContent,/0 cartões selecionados/);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];await screen.close()}
});

test('bulk removal asks for confirmation, retries without losing selection and preserves other collections',async()=>{
 cardLibraryFixture=[seedCard(141),seedCard(142)];const original=JSON.stringify(cardLibraryFixture);cardCollectionsFixture=[{id:31,nome:'Física',objetivo:'Revisar energia.',versao:1},{id:32,nome:'Prova',objetivo:'Preparar a prova.',versao:1}];cardMembershipsFixture=[{collection:31,card:141},{collection:31,card:142},{collection:32,card:141}];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 await selectValue(document.querySelector('.card-objective-filters select'),'31');await flush();await act(async()=>button('Retirar vários cartões').click());assert.ok(document.querySelector('.card-objective-filters select').disabled);await act(async()=>button('Selecionar cartões desta página').click());await act(async()=>button('Conferir retirada de 2 cartões').click());assert.equal(cardMembershipsFixture.length,3);assert.match(document.querySelector('.card-removal-confirm').textContent,/apenas da coleção “Física”/);assert.equal(requests.filter(x=>x.url.endsWith('/retirar')).length,0);cardWriteFailure=true;
 await act(async()=>button('Confirmar retirada de 2 cartões').click());await flush();assert.equal(cardMembershipsFixture.length,3);assert.match(document.querySelector('.card-bulk-organizer').textContent,/2 cartões selecionados/);cardWriteFailure=false;await act(async()=>button('Confirmar retirada de 2 cartões').click());await flush();assert.deepEqual(cardMembershipsFixture,[{collection:32,card:141}]);assert.equal(JSON.stringify(cardLibraryFixture),original);assert.match(document.querySelector('.card-library-notice').textContent,/Retirada de 2 cartões/);await act(async()=>button('Encerrar seleção').click());await selectValue(document.querySelector('.card-objective-filters select'),'');await flush();assert.equal(document.querySelectorAll('.library-card').length,2);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];cardWriteFailure=false;await screen.close()}
});
test('pinning a collection survives reopening Today and opens the exact objective',async()=>{
 cardLibraryFixture=[seedCard(141),seedCard(142)];cardCollectionsFixture=[{id:31,nome:'Física',objetivo:'Revisar energia.',versao:1,fixada:0},{id:32,nome:'Outra coleção',objetivo:'Outro objetivo.',versao:1,fixada:0}];cardMembershipsFixture=[{collection:31,card:141},{collection:32,card:142}];let screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 const pin=()=>[...document.querySelectorAll('.collection-overview-card')].find(x=>x.querySelector('h4').textContent==='Física').querySelector('.collection-pin button');cardWriteFailure=true;await act(async()=>pin().click());await flush();assert.equal(cardCollectionsFixture[0].fixada,0);assert.match(document.querySelector('.collection-pin').textContent,/Cartão ainda não confirmado/);cardWriteFailure=false;await act(async()=>pin().click());await flush();assert.equal(cardCollectionsFixture[0].fixada,1);await screen.close();screen=await renderRoute('/inicio');const priorities=document.querySelector('[aria-label="Coleções prioritárias de Hoje"]');assert.ok(priorities);assert.match(priorities.textContent,/Física/);assert.ok(!priorities.textContent.includes('Outra coleção'));await act(async()=>button('Revisar Física').click());await flush();assert.equal(document.querySelector('.quick-review-collection select').value,'31');assert.match(document.querySelector('.quick-review-ready').textContent,/1 cartão escolhido/);
 const audit=await axe.run(priorities,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(audit.violations.map(x=>x.id),[]);await act(async()=>priorities.querySelector('a[href="/ferramentas-estudo?aba=ferramentas&colecao=31"]').click());await flush();assert.equal(document.querySelector('.card-objective-filters select').value,'31');assert.equal(document.querySelectorAll('.library-card').length,1);assert.ok(requests.some(x=>x.url.endsWith('/cartoes')&&x.params.colecao==='31'));
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];cardWriteFailure=false;await screen.close()}
});
test('a fourth priority is rejected until one existing collection is unpinned',async()=>{
 cardLibraryFixture=[seedCard()];cardCollectionsFixture=Array.from({length:4},(_,i)=>({id:31+i,nome:`Coleção ${i+1}`,objetivo:'Preparar uma prova.',versao:1,fixada:i<3?1:0}));cardMembershipsFixture=[];const screen=await renderRoute('/ferramentas-estudo?aba=ferramentas');try{
 const row=name=>[...document.querySelectorAll('.collection-overview-card')].find(x=>x.querySelector('h4').textContent===name);await act(async()=>row('Coleção 4').querySelector('.collection-pin button').click());await flush();assert.equal(cardCollectionsFixture[3].fixada,0);assert.match(row('Coleção 4').textContent,/três coleções fixadas/);await act(async()=>row('Coleção 1').querySelector('.collection-pin button').click());await flush();assert.equal(cardCollectionsFixture[0].fixada,0);await act(async()=>row('Coleção 4').querySelector('.collection-pin button').click());await flush();assert.equal(cardCollectionsFixture[3].fixada,1);assert.equal(cardCollectionsFixture.filter(x=>x.fixada).length,3);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];await screen.close()}
});

test('priority ordering keeps the displayed order on failure and persists after reopening Today',async()=>{
 cardLibraryFixture=[seedCard()];cardCollectionsFixture=[{id:31,nome:'Física',objetivo:'Revisar energia.',versao:1,fixada:1,ordem_prioridade:1},{id:32,nome:'Matemática',objetivo:'Revisar proporções.',versao:1,fixada:1,ordem_prioridade:2},{id:33,nome:'Química',objetivo:'Revisar ligações.',versao:1,fixada:1,ordem_prioridade:3}];cardMembershipsFixture=[{collection:31,card:141}];let screen=await renderRoute('/inicio');try{
 const titles=()=>[...document.querySelectorAll('.today-pinned-grid h4')].map(x=>x.textContent);const down=()=>document.querySelector('[aria-label="Descer Física"]');assert.deepEqual(titles(),['Física','Matemática','Química']);assert.ok(document.querySelector('[aria-label="Subir Física"]').disabled);cardWriteFailure=true;await act(async()=>down().click());await flush();assert.deepEqual(titles(),['Física','Matemática','Química']);assert.ok(button('Atualizar prioridades'));cardWriteFailure=false;await act(async()=>down().click());await flush();assert.deepEqual(titles(),['Matemática','Física','Química']);const sends=requests.filter(x=>x.url.endsWith('/colecoes/ordem'));assert.deepEqual(JSON.parse(sends[0].data),JSON.parse(sends[1].data));assert.equal(cardLibraryFixture[0].proxima_revisao,'2026-01-01');await screen.close();screen=await renderRoute('/inicio');assert.deepEqual(titles(),['Matemática','Física','Química']);assert.ok(document.querySelector('[aria-label="Descer Química"]').disabled);const audit=await axe.run(document.querySelector('.today-pinned-collections'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(audit.violations.map(x=>x.id),[]);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];cardWriteFailure=false;await screen.close()}
});
test('a stale priority order cannot overwrite another screen and offers refresh',async()=>{
 cardLibraryFixture=[seedCard()];cardCollectionsFixture=[{id:31,nome:'Física',objetivo:'Revisar energia.',versao:1,fixada:1,ordem_prioridade:1},{id:32,nome:'Matemática',objetivo:'Revisar proporções.',versao:1,fixada:1,ordem_prioridade:2},{id:33,nome:'Química',objetivo:'Revisar ligações.',versao:1,fixada:1,ordem_prioridade:3}];cardMembershipsFixture=[];const screen=await renderRoute('/inicio');try{
 cardCollectionsFixture[0].ordem_prioridade=2;cardCollectionsFixture[1].ordem_prioridade=3;cardCollectionsFixture[2].ordem_prioridade=1;await act(async()=>document.querySelector('[aria-label="Descer Física"]').click());await flush();assert.match(document.querySelector('.today-pinned-collections').textContent,/As prioridades mudaram/);assert.equal(cardCollectionsFixture[2].ordem_prioridade,1);await act(async()=>button('Atualizar prioridades').click());await flush();assert.deepEqual([...document.querySelectorAll('.today-pinned-grid h4')].map(x=>x.textContent),['Química','Física','Matemática']);
 }finally{cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];await screen.close()}
});
test('collection search highlights the objective, opens the exact collection and remembers its filter',async()=>{
 searchMode='collections';cardLibraryFixture=[seedCard()];cardCollectionsFixture=[{id:31,nome:'Prova de Física',objetivo:'Revisar energia em exemplos próprios.',versao:1,fixada:1}];cardMembershipsFixture=[{collection:31,card:141}];const screen=await renderRoute('/busca?q=energia&tipo=colecoes');try{
 assert.ok(button('Coleções de cartões'));assert.equal(document.querySelector('.unified-search-card p mark').textContent,'energia');assert.equal(document.querySelector('.unified-search-card h3').textContent,'Prova de Física');const link=document.querySelector('a[href="/ferramentas-estudo?aba=ferramentas&colecao=31"]');assert.ok(link);const recent=JSON.parse(localStorage.getItem('900001:recent-searches:v1'));assert.ok(recent.some(x=>x.q==='energia'&&x.type==='colecoes'));const audit=await axe.run(document.querySelector('.unified-search'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(audit.violations.map(x=>x.id),[]);await act(async()=>link.click());await flush();assert.equal(document.querySelector('.card-objective-filters select').value,'31');assert.equal(document.querySelectorAll('.library-card').length,1);assert.ok(requests.some(x=>x.url.endsWith('/cartoes')&&x.params.colecao==='31'));
 }finally{searchMode='';cardLibraryFixture=[];cardCollectionsFixture=[];cardMembershipsFixture=[];await screen.close()}
});
