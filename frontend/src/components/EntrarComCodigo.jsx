import { useState } from 'react'
import { toast } from 'react-hot-toast'
import turmaService from '../services/turmaService'
import { Surface, Button, Field } from './ui/PlanejUI'

const TAMANHO_CONVITE = 8

// Dois caminhos, como no Classroom: o código da turma (fixo, o professor
// repassa para a turma toda) e o convite (uso único, expira). O campo aceita
// os dois porque o aluno não deve precisar saber qual dos dois recebeu.
export function EntrarComCodigo({ aoEntrar }) {
  const [codigo, setCodigo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  // Convidar usa o mesmo teclado, com maiúsculas fixas. Sobe e desce também é
  // comum em códigos, então ambos são normalizados para maiúsculas.
  function aoMudar(valor) {
    setErro('')
    setCodigo(valor.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, TAMANHO_CONVITE + 1))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const limpo = codigo.replace(/[^A-Z0-9]/g, '')
    if (limpo.length < 4) {
      setErro('Digite o código que o professor passou.')
      return
    }
    setEnviando(true)
    setErro('')
    // Não dá para adivinhar pelo formato qual dos dois o aluno recebeu: o
    // código da turma também pode ter 8 caracteres. Tenta o caminho comum
    // (turma) e, se falhar, o de convite. O erro exibido é sempre o do código da
    // turma, porque é o caso mais frequente.
    try {
      await turmaService.entrar(limpo)
    } catch {
      try {
        await turmaService.usarConvite(limpo)
      } catch (falha) {
        setErro(falha.response?.data?.message || 'Não foi possível entrar com esse código.')
        setEnviando(false)
        return
      }
    }
    toast.success('Você entrou na turma.')
    setCodigo('')
    setEnviando(false)
    aoEntrar?.()
  }

  return (
    <Surface as="form" className="entrar-codigo" onSubmit={enviar}>
      <div className="entrar-codigo-cabecalho">
        <h2>Entrar em uma turma</h2>
        <p>Digite o código da turma ou o convite que o professor enviou.</p>
      </div>

      <Field label="Código" hint="Pode ter hífen ou não — tanto faz.">
        <input
          className="pn-campo entrar-codigo-input"
          value={codigo}
          onChange={evento => aoMudar(evento.target.value)}
          placeholder="EX: FIS-2026"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? 'entrar-codigo-erro' : 'entrar-codigo-dica'}
        />
      </Field>

      {erro ? (
        <p id="entrar-codigo-erro" className="pn-erro" role="alert">{erro}</p>
      ) : (
        <p id="entrar-codigo-dica" className="pn-dica">
          Se o código não funcionar, peça um novo ao professor.
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar na turma'}
      </Button>
    </Surface>
  )
}
