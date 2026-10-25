import './ConnectedPages.css'
/** Decorative leaves and their shared thread. This is a page motif, not a control. */
export default function ConnectedPages({className='',compact=false}){
  return <svg className={`connected-pages ${className}`} viewBox={compact?'0 0 64 48':'0 0 132 48'} aria-hidden="true" focusable="false" fill="none">
    <path className="connected-pages-leaf" d="M5 8h17l10 8v25l-10-8H5V8Z M59 8H42l-10 8v25l10-8h17V8Z"/>
    <path className="connected-pages-writing" d="M11 15h8m-8 6h12m18-6h12m-12 6h8"/>
    <path className="connected-pages-thread" d={compact?'M19 29c6 0 6-10 13-10s7 10 14 10':'M19 29c6 0 6-10 13-10s7 10 14 10h23c12 0 12-18 24-18h16'}/>
    {!compact&&<><circle cx="112" cy="11" r="3" className="connected-pages-point"/><path className="connected-pages-writing" d="M122 7v8m-4-4h8"/></>}
  </svg>
}
