import Icon from './Icons'
export default function LumiMark({ size = 36, className = '' }) {
  return <span className={`lumi-mark ${className}`} style={{ width: size, height: size }} aria-hidden="true"><Icon name="spark" size={Math.round(size * .56)} /></span>
}
