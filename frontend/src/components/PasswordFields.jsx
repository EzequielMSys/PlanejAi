import { useState } from 'react'
import { REQUISITOS_SENHA } from '../config/senha'

export default function PasswordFields({ value, onChange, includeCurrent = true, disabled = false }) {
  const [visible, setVisible] = useState(false)
  const fields = [...(includeCurrent ? [['senhaAtual', 'Senha atual', 'current-password']] : []),
    ['novaSenha', 'Nova senha', 'new-password'], ['confirmarSenha', 'Confirmar nova senha', 'new-password']]
  return <>
    {fields.map(([key, label, autoComplete]) => <div key={key}>
      <label htmlFor={key} className="pn-etiqueta">{label}</label>
      <input id={key} className="pn-campo" type={visible ? 'text' : 'password'} autoComplete={autoComplete}
        required disabled={disabled} value={value[key] || ''} aria-describedby={key === 'novaSenha' ? 'password-requirements' : undefined}
        onChange={event => onChange({ ...value, [key]: event.target.value })} />
    </div>)}
    <div className="password-help"><p id="password-requirements">{REQUISITOS_SENHA}.</p>
      <button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar senhas' : 'Mostrar senhas'}</button>
    </div>
  </>
}
