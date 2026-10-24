const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const isUnavailable=require('../src/utils/databaseUnavailable');
function load(file,deps){const context={module:{exports:{}},console:{error(){},warn(){}},require:name=>deps[name]};vm.runInNewContext(fs.readFileSync(require.resolve(file),'utf8'),context);return context.module.exports;}
const response=()=>({statusCode:200,status(code){this.statusCode=code;return this},json(body){this.body=body;return this}});
test('login distinguishes database outage from invalid credentials without exposing connection details',async()=>{
 for(const code of ['ENOTFOUND','ETIMEDOUT','ER_CON_COUNT_ERROR']){
  const controller=load('../src/controllers/authController',{'../services/authService':{login:async()=>{throw Object.assign(new Error('private connection details'),{code})}},'../utils/databaseUnavailable':isUnavailable});
  const res=response();await controller.login({body:{email:'test@example.invalid',senha:'test'}},res);
  assert.equal(res.statusCode,503);assert.equal(res.body.code,'AUTH_SERVICE_UNAVAILABLE');assert.ok(!JSON.stringify(res.body).includes('private'));
 }
});
test('a valid session is not rejected as expired when the account database is down',async()=>{
 const middleware=load('../src/middlewares/authMiddleware',{'jsonwebtoken':{verify:()=>({id:7})},'../config/jwtConfig':{getJwtSecret:()=> 'test'},'../models/usuarioModel':{buscarPorId:async()=>{throw Object.assign(new Error('private host'),{code:'ENOTFOUND'})}}});
 const res=response();let next=false;await middleware.authMiddleware({headers:{authorization:'Bearer valid-token'}},res,()=>{next=true});
 assert.equal(res.statusCode,503);assert.equal(next,false);assert.ok(!JSON.stringify(res.body).includes('private host'));
});
test('invalid JWT still returns 401 without querying the account database',async()=>{
 let queried=false;const middleware=load('../src/middlewares/authMiddleware',{'jsonwebtoken':{verify:()=>{throw new Error('invalid token')}},'../config/jwtConfig':{getJwtSecret:()=> 'test'},'../models/usuarioModel':{buscarPorId:async()=>{queried=true}}});
 const res=response();await middleware.authMiddleware({headers:{authorization:'Bearer bad-token'}},res,()=>{});
 assert.equal(res.statusCode,401);assert.equal(queried,false);
});
