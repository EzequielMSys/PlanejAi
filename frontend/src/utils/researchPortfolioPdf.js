import fontUrl from '../assets/fonts/NotoSans-Regular.ttf?url'
let fontPromise
async function fontData(){
  if(!fontPromise)fontPromise=fetch(fontUrl).then(async response=>{if(!response.ok)throw Error('Não foi possível carregar a fonte do PDF. Tente novamente.');const bytes=new Uint8Array(await response.arrayBuffer());let value='';for(let n=0;n<bytes.length;n+=8192)value+=String.fromCharCode(...bytes.subarray(n,n+8192));return window.btoa(value)}).catch(error=>{fontPromise=null;throw error})
  return fontPromise
}
export async function buildPortfolioPdf(edition,font){
  const {jsPDF}=await import('jspdf')
  const doc=new jsPDF({unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true})
  doc.addFileToVFS('NotoSans.ttf',font||await fontData());doc.addFont('NotoSans.ttf','NotoSans','normal');doc.setFont('NotoSans')
  doc.setProperties({title:edition.title,subject:'Portfólio pessoal de investigação - seleção do estudante',author:'Estudante do PlanejAI',creator:'PlanejAI'})
  const margin=48,width=499,bottom=782,line=16,unsupported=new Set()
  let y=62
  function clean(value){const map=doc.getFont().metadata.cmap?.unicode?.codeMap;return Array.from(String(value||'').replace(/\r\n?/g,'\n').replace(/\t/g,'  ')).map(c=>{if(c==='\n'||!map||map[c.codePointAt(0)])return c;unsupported.add(`U+${c.codePointAt(0).toString(16).toUpperCase()}`);return `[${c.codePointAt(0).toString(16).toUpperCase()}]`}).join('')}
  function next(){doc.addPage();y=62}
  function write(value,{size=10.5,color=[39,38,52],gap=10}={}){
    doc.setFontSize(size);doc.setTextColor(...color)
    for(const paragraph of clean(value).split('\n')){
      const lines=doc.splitTextToSize(paragraph||' ',width)
      for(const row of lines){if(y>bottom-line)next();doc.setFontSize(size);doc.setTextColor(...color);doc.text(row,margin,y);y+=size>=20?29:line}
    }
    y+=gap
  }
  function heading(value){if(y>bottom-65)next();write(value,{size:14,color:[76,58,140],gap:7})}
  write('PORTFÓLIO PESSOAL DE INVESTIGAÇÃO',{size:10,color:[76,58,140],gap:18})
  write(edition.title,{size:24,gap:16})
  write(`Edição de ${new Date(edition.created).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})} · ${edition.items.length} ${edition.items.length===1?'registro escolhido':'registros escolhidos'}`,{size:10,color:[90,88,105],gap:20})
  heading('O percurso que escolhi apresentar');write(edition.introduction)
  heading('Como ler este portfólio');write('Os registros e comentários do estudante estão identificados. Orientações da Lumi aparecem somente quando selecionadas e podem conter erros. Esta seleção não constitui uma nota nem comprovação automática de domínio. Não inclui outros registros da conta.')
  heading('Registros desta edição');edition.items.forEach((item,i)=>write(`${i+1}. ${item.role} - ${item.title}`,{gap:4}))
  edition.items.forEach((item,i)=>{
    next();write(`REGISTRO ${String(i+1).padStart(2,'0')}`,{size:10,color:[76,58,140]});write(item.role,{size:21});write(item.title,{size:13,color:[76,58,140]})
    if(item.originalDate)write(`Versão original de ${new Date(item.originalDate).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}`,{size:9,color:[90,88,105]})
    heading('O que este registro demonstra para mim');write(item.demonstrates)
    heading('Limites que reconheço');write(item.limits)
    item.blocks.forEach(block=>{heading(block.label);write(block.authorship,{size:9,color:[90,88,105],gap:4});write(block.text)})
    if(item.references.length){heading('Referências que escolhi incluir');item.references.forEach(ref=>{write(ref.origin,{size:11,gap:3});if(ref.purpose)write(`Propósito: ${ref.purpose}`,{gap:3});if(ref.limits)write(`Limites: ${ref.limits}`,{gap:3});if(ref.url)write(ref.url,{size:9,gap:10})})}
  })
  if(y>bottom-140)next();heading('O que concluo e o que quero investigar depois');write(edition.conclusion)
  const count=doc.getNumberOfPages()
  for(let page=1;page<=count;page++){doc.setPage(page);doc.setDrawColor(210,207,225);doc.line(margin,32,547,32);doc.setFontSize(8);doc.setTextColor(90,88,105);doc.text('PlanejAI / Meu percurso de investigação',margin,23);doc.text(`Edição pessoal · ${page} / ${count}`,547,813,{align:'right'})}
  if(unsupported.size)throw Error(`O PDF não foi exportado porque a fonte não representa estes símbolos: ${[...unsupported].slice(0,8).join(', ')}. Os textos permanecem salvos. Prepare uma edição com a descrição por extenso desses símbolos.`)
  return doc
}
export async function downloadPortfolioPdf(edition){const doc=await buildPortfolioPdf(edition);doc.save(`planejai-portfolio-${edition.id.slice(0,8)}.pdf`)}
