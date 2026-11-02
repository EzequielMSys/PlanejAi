const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{createRequire,Module}=require('node:module');
const frontend=path.resolve(__dirname,'../frontend'),req=createRequire(path.join(frontend,'package.json'));
let component;
async function render(content){
  if(!component){const built=await req('esbuild').build({entryPoints:[path.join(frontend,'src/components/LumiMessage.jsx')],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react-dom/server'],loader:{'.css':'empty'},plugins:[{name:'css-test',setup(build){build.onResolve({filter:/\.css$/},()=>({path:'empty-css',namespace:'test'}));build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'',loader:'js'}))}}]});const file=path.join(frontend,'__lumi_math_test.cjs'),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(frontend);m._compile(built.outputFiles[0].text,file);component=m.exports.default;}
  const html=req('react-dom/server').renderToStaticMarkup(req('react').createElement(component,{content}));return new (req('jsdom').JSDOM)(html).window.document;
}
test('equações das imagens exibem fração, potência, índice e texto matemático',async()=>{
  const doc=await render(String.raw`### 1. Energia cinética
\[ EC = \frac{1}{2}\,m\,v^{2} \]
### 3. Energia mecânica total
\[ E_{\text{mec}} = EC + EP = \frac{1}{2} m v^{2} + m g h \]`);
  assert.equal(doc.querySelectorAll('.katex-display').length,2);assert.equal(doc.querySelectorAll('mfrac').length,2);assert.equal(doc.querySelectorAll('msup').length,2);assert.ok(doc.querySelector('msub'));assert.equal(doc.querySelectorAll('.katex-error').length,0);assert.equal(doc.querySelectorAll('h3').length,2);assert.equal(doc.querySelectorAll('.katex-mathml').length,2);
});
test('delimitadores antigos e atuais funcionam em texto, listas e blocos',async()=>{
  const doc=await render(String.raw`No texto, \(v^{2}\) e $mgh$.

- A energia é $E_c$.

$$
x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
$$

[ E_{\text{mec}} = \frac{1}{2} m v^{2} + mgh ]`);
  assert.equal(doc.querySelectorAll('.katex').length,5);assert.equal(doc.querySelectorAll('.katex-display').length,2);assert.ok(doc.querySelector('li .katex'));assert.equal(doc.querySelectorAll('.katex-error').length,0);
});
test('código literal, colchetes de texto e preços não viram fórmulas',async()=>{
  const {default:normalize}=await import('../frontend/src/utils/normalizeLumiMath.js');
  const text=String.raw`[um exemplo]
Use \(x^2\) no texto e `+'`\\(x^2\\)`'+String.raw` como código.

`+'```js\nconst exemplo = "\\\\[x^2\\\\]";\n```'+String.raw`

R$10 e R$20.`;
  const doc=await render(text);assert.equal(doc.querySelectorAll('.katex').length,1);assert.ok(doc.body.textContent.includes('R$10 e R$20'));assert.ok(doc.querySelector('pre code').textContent.includes('const exemplo'));assert.ok(doc.body.textContent.includes('[um exemplo]'));
  const fenced='~~~latex\n\\[\\frac{1}{2}\\]\n~~~';assert.equal(normalize(fenced),fenced);assert.equal(normalize('```latex\n\\[x\\]'),'```latex\n\\[x\\]');
  assert.equal(normalize('    \\[x^2\\]'),'    \\[x^2\\]');
  const spaced=await render('\\[\n    E=\\frac{1}{2}mv^2\n\\]');assert.ok(spaced.querySelector('mfrac'));
});
test('fórmula inválida e expansão recursiva não derrubam a resposta',async()=>{
  const doc=await render(String.raw`Antes.
$$
\frac{1}{
$$
Depois.
$$
\def\loop{\loop}\loop
$$`);
  assert.match(doc.body.textContent,/Antes/);assert.match(doc.body.textContent,/Depois/);assert.ok(doc.querySelector('.lumi-math-error')||doc.querySelector('.katex-error'));assert.doesNotMatch(doc.body.innerHTML,/NaN/);
});
test('HTML e comandos matemáticos não concedem execução, links ou imagens externas',async()=>{
  const doc=await render(String.raw`<img src="https://example.invalid/private" onerror="alert(1)">
<script>alert(1)</script>
$\href{javascript:alert(1)}{clique}$
$\includegraphics{https://example.invalid/image.png}$
[link](javascript:alert(1))
$\htmlClass{inject}{x}$`);
  assert.equal(doc.querySelectorAll('script,img,a,iframe').length,0);assert.equal(doc.querySelectorAll('[onerror],[onclick]').length,0);assert.equal(doc.querySelectorAll('.inject').length,0);
});


test('reais dentro da fórmula não encerram a expressão nem perdem o valor',async()=>{
  for(const text of [String.raw`- **Capital inicial** $P = \text{R\$}200,00$`,String.raw`Capital inicial \(P = \text{R\$}200,00\)`,String.raw`\[P=\text{R$}200,00\]`,String.raw`$P=R$ 200,00$`]){
    const doc=await render(text);assert.equal(doc.querySelectorAll('.lumi-math-error,.katex-error').length,0,text);assert.equal(doc.querySelectorAll('.katex').length,1,text);assert.match(doc.querySelector('.katex-mathml').textContent,/200/);assert.match(doc.querySelector('.katex-mathml').textContent,/R\$/);
  }
});

test('preços e símbolos escapados fora de fórmulas ficam literais junto a matemática válida',async()=>{
  const doc=await render(String.raw`O capital é R$ 200,00 e o montante é R$240,00. Use $M=P(1+i)^t$. O símbolo é \$ e a variável é $R$.`);
  assert.equal(doc.querySelectorAll('.katex').length,2);assert.equal(doc.querySelectorAll('.lumi-math-error').length,0);assert.match(doc.body.textContent,/R\$ 200,00/);assert.match(doc.body.textContent,/R\$240,00/);assert.match(doc.body.textContent,/símbolo é \$/);
});


test('moeda em exemplos de código e caracteres privados permanecem intactos',async()=>{
 const {default:normalize}=await import('../frontend/src/utils/normalizeLumiMath.js');
 const code='`$P=\\text{R\\$}200$`';assert.equal(normalize(code),code);
 const text='\uE000 \uE000\uE000 '+String.raw`R$200 e $P=\text{R\$}200$`;
 const doc=await render(text);assert.match(doc.body.textContent,/^\uE000 \uE000\uE000 /);assert.equal(doc.querySelectorAll('.lumi-math-error').length,0);assert.equal(doc.querySelectorAll('.katex').length,1);
});
