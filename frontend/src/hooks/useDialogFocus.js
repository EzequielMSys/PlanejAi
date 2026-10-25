import { useEffect, useRef } from 'react'

export default function useDialogFocus(ref,open,onClose,blocked=false){
  const close=useRef(onClose),busy=useRef(blocked)
  close.current=onClose;busy.current=blocked
  useEffect(()=>{
    if(!open||!ref.current)return
    const panel=ref.current,previous=document.activeElement,overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    panel.focus({preventScroll:true})
    const key=event=>{
      if(event.key==='Escape'){event.preventDefault();if(!busy.current)close.current();return}
      if(event.key!=='Tab')return
      const fields=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(el=>!el.closest('[hidden],[inert]'))
      if(!fields.length){event.preventDefault();panel.focus();return}
      const first=fields[0],last=fields[fields.length-1]
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel||!panel.contains(document.activeElement))){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){event.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',key)
    return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus({preventScroll:true})}
  },[open,ref])
}
