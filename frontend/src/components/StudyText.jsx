import { parseStudyText, inlineStudyText } from '../utils/studyText'
function Inline({ text }) { return inlineStudyText(text).map((part, index) => part.type === 'strong' ? <strong key={index}>{part.text}</strong> : part.type === 'code' ? <code key={index}>{part.text}</code> : part.text) }
export default function StudyText({ children }) {
  return <div className="lumi-prose">{parseStudyText(children).map((block, index) => block.type === 'heading' ? <h3 key={index}><Inline text={block.text} /></h3> : block.type === 'code' ? <pre key={index}><code>{block.text}</code></pre> : block.type === 'list' ? block.ordered ? <ol key={index}>{block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}</ol> : <ul key={index}>{block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}</ul> : <p key={index}><Inline text={block.text} /></p>)}</div>
}
