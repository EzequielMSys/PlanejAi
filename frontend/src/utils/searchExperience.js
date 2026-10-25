import {scopedCacheKey,currentUser} from './offlineStore'
const key=()=>scopedCacheKey('recent-searches:v1')
const types=new Set(['todos','materias','materiais','anotacoes','redacoes'])
export function readRecentSearches(){try{const value=JSON.parse(localStorage.getItem(key()));return Array.isArray(value)?value.filter(item=>typeof item.q==='string' && item.q.length>=2 && item.q.length<=100 && types.has(item.type)).slice(0,8):[]}catch{return []}}
export function rememberSearch(q,type){if(currentUser()==='anonymous')return false;const value={q:q.trim(),type};if(value.q.length<2 || value.q.length>100 || !types.has(type))return false;try{localStorage.setItem(key(),JSON.stringify([value,...readRecentSearches().filter(item=>item.q.toLocaleLowerCase('pt-BR')!==value.q.toLocaleLowerCase('pt-BR') || item.type!==type)].slice(0,8)));return true}catch{return false}}
export function clearRecentSearches(){try{localStorage.removeItem(key());return true}catch{return false}}
const fold=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')
export function highlightParts(value,query){
  const source=String(value||''),needle=fold(String(query||'').trim());if(!needle)return [{text:source,match:false}]
  let normalized='',offset=0;const positions=[]
  for(const char of source){const normalizedChar=fold(char);for(let i=0;i<normalizedChar.length;i++)positions.push(offset);normalized+=normalizedChar;offset+=char.length}
  positions.push(source.length)
  const parts=[];let cursor=0,index=0,count=0
  while(count++<30 && (index=normalized.indexOf(needle,index))>=0){const start=positions[index],end=positions[index+needle.length];if(start>cursor)parts.push({text:source.slice(cursor,start),match:false});parts.push({text:source.slice(start,end),match:true});cursor=end;index+=needle.length}
  if(cursor<source.length)parts.push({text:source.slice(cursor),match:false});return parts.length?parts:[{text:source,match:false}]
}
