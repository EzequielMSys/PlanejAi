import { useState } from 'react'
import { scopedCacheKey } from '../utils/offlineStore'
import { readJournalDraft, keepJournalDraft, clearJournalDraft } from '../utils/journalDrafts'
export default function useStudyDraft(name, initial) {
  const key=scopedCacheKey(`study-path-${name}`)
  const [value,setValue]=useState(()=>readJournalDraft(key)||initial)
  const [safe,setSafe]=useState(true)
  return [value,next=>{setValue(next);setSafe(keepJournalDraft(key,next))},()=>{clearJournalDraft(key);setValue({...initial,key:window.crypto.randomUUID()})},safe]
}
