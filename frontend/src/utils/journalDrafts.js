import { currentUser } from './offlineStore'
const memory = new Map()
const unsafe = new Set()
let listening = false
export function readJournalDraft(key) {
  if(memory.has(key)) return memory.get(key)
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}
export function keepJournalDraft(key,value) {
  memory.set(key,value)
  if(!listening) {
    window.addEventListener('beforeunload',event=>{if(hasUnsafeJournalDraft()){event.preventDefault();event.returnValue=''}})
    listening=true
  }
  try {localStorage.setItem(key,JSON.stringify(value));unsafe.delete(key);return true}
  catch {unsafe.add(key);return false}
}
export function clearJournalDraft(key) {
  memory.delete(key);unsafe.delete(key)
  try {localStorage.removeItem(key)} catch { /* The account may already contain the confirmed version. */ }
}
export function hasUnsafeJournalDraft() {return [...unsafe].some(key=>key.startsWith(`${currentUser()}:`))}
export function hasPendingJournalDraft(contentId) {
  if(!contentId)return false
  const prefix=`${currentUser()}:journal-draft:`
  const entries=new Map(memory)
  try {for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith(prefix) && !entries.has(key))entries.set(key,readJournalDraft(key))}} catch { /* In-memory protection remains active. */ }
  return [...entries].some(([key,value])=>key.startsWith(prefix) && Number(value?.idConteudo)===Number(contentId) && Boolean(value?.texto?.trim()))
}
