import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/contrib/mhchem/mhchem.js'
import normalizeLumiMath from '../utils/normalizeLumiMath'
import 'katex/dist/katex.min.css'
import './LumiMessage.css'

const elementos = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td']
const elementosMatematicos = ['div', 'span', 'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mspace', 'mfrac', 'msqrt', 'mroot', 'msup', 'msub', 'msubsup', 'mover', 'munder', 'munderover', 'mtable', 'mtr', 'mtd', 'mstyle', 'mpadded', 'mphantom', 'menclose', 'mmultiscripts', 'mprescripts', 'none', 'svg', 'path', 'line']
const mathOptions = {trust: false, strict: 'ignore', maxExpand: 500, maxSize: 10, output: 'htmlAndMathml'}
function MathSpan({className, children, node, ...props}) {
  if (className?.split(' ').includes('katex-error')) return <span className="lumi-math-error"><span>Não foi possível formatar esta fórmula.</span><code>{children}</code></span>
  return <span className={className} {...props}>{children}</span>
}

export default function LumiMessage({ content }) {
  return <div className="lumi-message"><Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, mathOptions]]} components={{span: MathSpan}} allowedElements={[...elementos, ...elementosMatematicos]} unwrapDisallowed skipHtml>{normalizeLumiMath(content)}</Markdown></div>
}
