import {useEffect,useId,useRef,useState} from 'react'
import {scopedCacheKey} from '../utils/offlineStore'
import './ReadingSurface.css'

const defaults={size:18,width:68,spacing:1.8}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
export function readingSettings(value){return {size:[16,18,20,22,24,28].includes(value?.size)?value.size:18,width:[48,60,68,80].includes(value?.width)?value.width:68,spacing:[1.5,1.8,2,2.2].includes(value?.spacing)?value.spacing:1.8}}

export default function ReadingSurface({material,children}) {
  const id=useId(),content=useRef(null),ownerKey=useRef(scopedCacheKey('reading-settings:v1')).current
  const identity=String(material.id_conteudo || material.id || `${material.disciplina||''}:${material.titulo||'material'}`)
  const bookmarkKey=scopedCacheKey(`reading-position:v1:${identity}`)
  const [settings,setSettings]=useState(()=>readingSettings(read(ownerKey)))
  const [offer,setOffer]=useState(()=>{const value=read(bookmarkKey);return value && Number.isInteger(value.index) && value.index>=0 && value.index<64 && typeof value.title==='string' && value.title.trim()?value:null})
  const [notice,setNotice]=useState(''),[failed,setFailed]=useState(false)
  const pending=useRef(Boolean(offer))
  const sections=()=>[...(content.current?.querySelectorAll('.study-guide>section')||[])]
  function update(name,value){const next={...settings,[name]:Number(value)};setSettings(next);try{localStorage.setItem(ownerKey,JSON.stringify(next));setFailed(false)}catch{setFailed(true)}}
  function remember(index){
    if(ownerKey!==scopedCacheKey('reading-settings:v1'))return
    const section=sections()[index],title=section?.querySelector('h3')?.textContent
    if(!title)return
    const value={index,title,at:new Date().toISOString()};
    try{localStorage.setItem(bookmarkKey,JSON.stringify(value));setFailed(false);return true}catch{setFailed(true);return false}
  }
  function go(index){const list=sections(),section=list[index];pending.current=false;setOffer(null);if(!section)return;section.scrollIntoView({block:'start',behavior:'auto'});section.setAttribute('tabindex','-1');section.focus({preventScroll:true});remember(index);setNotice(`Leitura retomada em: ${section.querySelector('h3')?.textContent}`)}
  useEffect(()=>{
    let timer
    const track=()=>{
      if(pending.current || ownerKey!==scopedCacheKey('reading-settings:v1'))return
      window.clearTimeout(timer);timer=window.setTimeout(()=>{
        const list=sections();let index=-1
        list.forEach((section,i)=>{const rect=section.getBoundingClientRect();if(rect.top<window.innerHeight*.55 && rect.bottom>0)index=i})
        if(index>=0)remember(index)
      },350)
    }
    window.addEventListener('scroll',track,true)
    return()=>{window.removeEventListener('scroll',track,true);window.clearTimeout(timer)}
  },[bookmarkKey,ownerKey])
  const validOffer=offer && Number.isInteger(offer.index) && offer.index>=0 && typeof offer.title==='string'
  return <section className="reading-surface" aria-label="Leitura do material">
    <details className="reading-settings"><summary>Ajustar leitura</summary><div>
      <label htmlFor={`${id}-size`}>Tamanho do texto<select id={`${id}-size`} value={settings.size} onChange={e=>update('size',e.target.value)}>{[16,18,20,22,24,28].map(size=><option key={size} value={size}>{size} px</option>)}</select></label>
      <label htmlFor={`${id}-width`}>Largura do texto<select id={`${id}-width`} value={settings.width} onChange={e=>update('width',e.target.value)}>{[[48,'Estreita'],[60,'Confortável'],[68,'Padrão'],[80,'Ampla']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label htmlFor={`${id}-spacing`}>Espaçamento entre linhas<select id={`${id}-spacing`} value={settings.spacing} onChange={e=>update('spacing',e.target.value)}>{[1.5,1.8,2,2.2].map(value=><option key={value} value={value}>{String(value).replace('.',',')}</option>)}</select></label>
      <button type="button" onClick={()=>{setSettings(defaults);try{localStorage.setItem(ownerKey,JSON.stringify(defaults));setFailed(false)}catch{setFailed(true)}}}>Restaurar ajustes</button>
    </div><p>Os ajustes valem para os textos do PlanejAI e ficam nesta conta e aparelho. PDFs, vídeos e páginas externas usam seus próprios controles.</p></details>
    {validOffer && <div className="reading-resume"><p>Você parou em <strong>{offer.title}</strong>.</p><div><button type="button" onClick={()=>{const list=sections();const found=list.findIndex(section=>section.querySelector('h3')?.textContent===offer.title);go(found>=0?found:0)}}>Continuar de onde parei</button><button type="button" onClick={()=>go(0)}>Ler desde o início</button></div></div>}
    {failed && <p role="status">Não foi possível guardar os ajustes ou o ponto de leitura neste aparelho. A leitura continua disponível.</p>}
    {notice && <p role="status">{notice}</p>}
    <div ref={content} className="reading-content" style={{'--reading-size':`${settings.size/16}rem`,'--reading-width':`${settings.width}ch`,'--reading-spacing':settings.spacing}}>{children}</div>
    <button className="reading-bookmark" type="button" onClick={()=>{const list=sections();let index=list.findIndex(section=>section.getBoundingClientRect().bottom>80);if(index<0)index=0;pending.current=false;setOffer(null);const saved=remember(index);setNotice(saved?'Ponto de leitura marcado neste aparelho.':'Não foi possível guardar o ponto de leitura. Mantenha a seção como referência.')}}>Marcar ponto de leitura</button>
  </section>
}
