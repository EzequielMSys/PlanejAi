import MarkdownModule from 'react-markdown'
import remarkGfmModule from 'remark-gfm'
import './LumiMessage.css'

// O teste de interface executa o pacote ESM por um bundle CommonJS.
const Markdown = MarkdownModule.default || MarkdownModule
const remarkGfm = remarkGfmModule.default || remarkGfmModule
const elements = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td']

export default function LumiPlainMessage({ content }) {
  return <div className="lumi-message"><Markdown remarkPlugins={[remarkGfm]} allowedElements={elements} unwrapDisallowed skipHtml>{content}</Markdown></div>
}
