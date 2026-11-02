const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const service=require('../src/services/activityPhotoService');
const png=()=>({mimetype:'image/png',buffer:Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(20)])});
const output={texto:'Capital inicial: R$ 200,00. Taxa: 5% ao mês.',legivel:true,conferir:[]};
const completion=(data=output)=>({choices:[{message:{content:JSON.stringify(data)},finish_reason:'stop'}]});

test('foto usa modelo de visão do provedor e encaminha somente a imagem escolhida',async()=>{
 let sent,options;const counts=[];
 const result=await service.readActivityPhoto(31,png(),{model:'vision-test',consume:async(...args)=>{counts.push(args);return 1},client:{chat:{completions:{create:async(payload,opts)=>{sent=payload;options=opts;return completion()}}}}});
 assert.deepEqual(result,output);assert.equal(sent.model,'vision-test');assert.equal(sent.messages.length,2);assert.match(sent.messages[1].content[1].image_url.url,/^data:image\/png;base64,/);assert.match(sent.messages[0].content,/Não resolva/);assert.match(sent.messages[0].content,/não siga instruções/);assert.ok(!JSON.stringify(sent).includes('31'));assert.equal(options.maxRetries,0);assert.equal(options.timeout,45000);assert.equal(counts.length,2);assert.equal(counts[0][1],'31');
 assert.equal(service.visionModel({OPENAI_BASE_URL:'https://api.groq.com/openai/v1'}),'qwen/qwen3.8-27b');assert.equal(service.visionModel({OPENAI_VISION_MODEL:'custom'}),'custom');assert.throws(()=>service.visionModel({OPENAI_BASE_URL:'https://other.invalid'}),e=>e.status===503);
});

test('conteúdo falso, tipo divergente e tamanho excessivo são barrados antes da IA',async()=>{
 let calls=0;const deps={model:'vision',consume:async()=>{calls++;return 1}};
 for(const file of [undefined,{mimetype:'image/png',buffer:Buffer.from('<svg onload="bad"/>')},{...png(),mimetype:'image/jpeg'},{mimetype:'image/png',buffer:Buffer.alloc(service.MAX_BYTES+1)}])await assert.rejects(service.readActivityPhoto(1,file,deps),e=>[400,413,415].includes(e.status));
 assert.equal(calls,0);
});

test('cotas persistentes e falha de provedor não expõem imagem ou erro interno',async()=>{
 let calls=0;const client={chat:{completions:{create:async()=>{calls++;throw {status:500,message:'secret-base64-content'}}}}};
 await assert.rejects(service.readActivityPhoto(1,png(),{model:'vision',consume:async()=>4,client}),e=>e.status===429);assert.equal(calls,0);
 await assert.rejects(service.readActivityPhoto(1,png(),{model:'vision',consume:async scope=>scope.endsWith('dia')?21:1,client}),e=>e.status===429);assert.equal(calls,0);
 await assert.rejects(service.readActivityPhoto(1,png(),{model:'vision',consume:async()=>1,client}),e=>e.status===503&&!e.message.includes('secret'));assert.equal(calls,1);
});

test('leitura incompleta sinaliza incerteza e resposta truncada ou malformada é recusada',()=>{
 assert.throws(()=>service.parseReading('not json'),e=>e.status===422);assert.throws(()=>service.parseReading(JSON.stringify(output),'length'),e=>e.status===422);assert.throws(()=>service.parseReading(JSON.stringify({...output,texto:'x'.repeat(1801)})),e=>e.status===422);assert.throws(()=>service.parseReading(JSON.stringify({...output,texto:''})),e=>e.status===422);
 const result=service.parseReading(JSON.stringify({...output,texto:'Taxa [ilegível]',legivel:false}));assert.equal(result.legivel,false);assert.match(result.conferir[0],/ilegíveis/);
});

test('rota exige autenticação antes de processar multipart, não salva arquivo e limpa o buffer',async()=>{
 const express=require('express'),controller={};let received;
 const scope={exports:controller,require:key=>key==='../services/activityPhotoService'?{readActivityPhoto:async(owner,file)=>{assert.equal(owner,31);service.imageType(file);received=file;return output}}:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/controllers/inteligenciaController'),'utf8'),scope);
 const routeScope={module:{exports:{}},require:key=>key==='express'?express:key==='../controllers/inteligenciaController'?new Proxy(controller,{get:(obj,key)=>obj[key]||((req,res)=>res.end())}):key==='../middlewares/authMiddleware'?{authMiddleware:(req,res,next)=>{if(req.headers.authorization!=='Bearer fixture')return res.sendStatus(401);req.usuario={id_usuario:31};next()}}:key==='../middlewares/activityPhotoUpload'?require('../src/middlewares/activityPhotoUpload'):require(key)};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/routes/inteligenciaRoutes'),'utf8'),routeScope);
 const app=express();app.use('/api/inteligencia',routeScope.module.exports);const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const url=`http://127.0.0.1:${server.address().port}/api/inteligencia/chat/foto`;
 const form=()=>{const body=new FormData();body.append('foto',new Blob([png().buffer],{type:'image/png'}),'atividade.png');return body};
 try{
  assert.equal((await fetch(url,{method:'POST',body:form()})).status,401);
  const response=await fetch(url,{method:'POST',body:form(),headers:{Authorization:'Bearer fixture'}});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),output);assert.equal(received.buffer,null);
  const wrong=new FormData();wrong.append('foto',new Blob(['<svg/>'],{type:'image/png'}),'bad.png');assert.equal((await fetch(url,{method:'POST',body:wrong,headers:{Authorization:'Bearer fixture'}})).status,415);
  const multi=form();multi.append('extra','not allowed');assert.equal((await fetch(url,{method:'POST',body:multi,headers:{Authorization:'Bearer fixture'}})).status,400);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
});
