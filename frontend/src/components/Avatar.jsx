import { useState } from 'react'
import { resolveBackendAsset } from '../config/api'

/**
 * Avatar do usuário com degradação graciosa.
 *
 * O banco pode guardar o caminho de uma foto que não existe mais — por exemplo,
 * depois de uma instalação nova, já que uploads/ é ignorada pelo Git. Sem
 * tratamento, o <img> quebrado mostra o ícone de imagem perdida e a inicial do
 * nome nunca aparece. Aqui, se o carregamento falhar, voltamos para a inicial.
 *
 * Também evita repetir essa lógica em Navbar, Sidebar e Perfil.
 */
export default function Avatar({ src, nome = 'U', className = '', tamanho = 40 }) {
  const [falhou, setFalhou] = useState(false)
  const url = src && !falhou ? (src.startsWith('http') ? src : resolveBackendAsset(src)) : null
  const inicial = String(nome || 'U').trim().charAt(0).toUpperCase() || 'U'

  return (
    <span
      className={`pn-avatar ${className}`}
      style={{ width: tamanho, height: tamanho }}
    >
      {url ? (
        <img src={url} alt="" onError={() => setFalhou(true)} />
      ) : (
        <span aria-hidden="true">{inicial}</span>
      )}
    </span>
  )
}
