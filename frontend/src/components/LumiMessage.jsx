import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './LumiMessage.css'

const elementos = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td']

export default function LumiMessage({ content }) {
  return <div className="lumi-message"><Markdown remarkPlugins={[remarkGfm]} allowedElements={elementos} unwrapDisallowed skipHtml>{content || ''}</Markdown></div>
}
