const assert=require('node:assert/strict');
function database() {
  const rows = new Map(), calls=[];
  const db={rows,calls,beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},getConnection:async()=>db};
  db.execute=async(sql,values)=>{
    calls.push({sql,values});
    if(sql.startsWith('SELECT id_usuario FROM usuarios'))return [[{id_usuario:values[0]}]];
    if(sql.startsWith('SELECT COUNT'))return [[{total:[...rows.values()].filter(r=>r.id_usuario===values[0]&&r.tipo===values[1]).length}]];
    if(sql.startsWith('SELECT id_usuario,dados'))return [[...rows.values()].filter(r=>r.id===values[0])];
    if(sql.startsWith('SELECT *'))return [[...rows.values()].filter(r=>r.id===values[0]&&r.id_usuario===values[1])];
    if(sql.startsWith('SELECT id, versao'))return [[...rows.values()].filter(r=>r.id_usuario===values[0]&&r.tipo===values[1])];
    if(sql.startsWith('INSERT INTO flashcard_colecoes'))return [{insertId:81}];
    if(sql.startsWith('INSERT INTO percursos')){rows.set(values[0],{id:values[0],id_usuario:values[1],tipo:values[2],dados:JSON.parse(values[3]),resumo:JSON.parse(values[4]),versao:1});return [{affectedRows:1}];}
    if(sql.startsWith('UPDATE percursos')){const r=rows.get(values[2]);assert.equal(r.id_usuario,values[3]);r.dados=JSON.parse(values[0]);r.resumo=JSON.parse(values[1]);r.versao++;return [{affectedRows:1}];}
    if(sql.startsWith('DELETE')){rows.delete(values[0]);return [{affectedRows:1}];}
    if(sql.includes('diario_lumi_uso'))return [{affectedRows:1}];
    throw Error(`Unexpected query: ${sql}`);
  };
  return db;
}
module.exports=database;
