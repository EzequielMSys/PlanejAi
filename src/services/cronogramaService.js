const perfilModel = require('../models/perfilEstudoModel')
const dispModel = require('../models/disponibilidadeSemanaModel')
const cronogramaModel = require('../models/cronogramaModel')
const cronogramaDiaModel = require('../models/cronogramaDiaModel')
const cronogramaConteudoModel = require('../models/cronogramaConteudoModel')
const conteudoModel = require('../models/conteudoModel')
const avaliacaoModel = require('../models/cronogramaAvaliacaoModel')
const inteligenciaModel = require('../models/inteligenciaModel')

const DIAS_SEMANA = {
  DOM: 0,
  SEG: 1,
  TER: 2,
  QUA: 3,
  QUI: 4,
  SEX: 5,
  SAB: 6
}

function formatarDataISO(data) {
  return data.toISOString().split('T')[0]
}

function chaveData(data) {
  return data instanceof Date ? data.toISOString().slice(0, 10) : String(data).slice(0, 10)
}

function obterCodigoDia(data) {
  return Object.keys(DIAS_SEMANA).find(
    (dia) => DIAS_SEMANA[dia] === data.getDay()
  )
}

function normalizarListaAreas(areasFoco) {
  if (!areasFoco) return ['Geral']

  return areasFoco
    .split(',')
    .map((area) => area.trim())
    .filter(Boolean)
}

function removerDuplicadosPorId(conteudos) {
  const mapa = new Map()

  for (const conteudo of conteudos) {
    if (conteudo?.id_conteudo && !mapa.has(conteudo.id_conteudo)) {
      mapa.set(conteudo.id_conteudo, conteudo)
    }
  }

  return Array.from(mapa.values())
}

function combinarDadosConteudo(atual, alteracoes = {}) {
  return Object.fromEntries(
    Object.entries({ ...atual, ...alteracoes }).filter(([, valor]) => valor !== undefined)
  )
}

class CronogramaService {
  async validarDiaLiberado(idDia, idUsuario) {
    const dia = await avaliacaoModel.obterDiaDoUsuario(idDia, idUsuario)
    if (!dia) throw new Error('Dia do cronograma não encontrado.')
    const dias = await cronogramaDiaModel.listarDiasPorCronograma(dia.id_cronograma)
    const indice = dias.findIndex((item) => Number(item.id_dia) === Number(idDia))
    const anterioresConcluidos = dias.slice(0, indice).every((item) => Number(item.concluido) === 1)
    if (!anterioresConcluidos) throw new Error('Conclua os dias anteriores antes de avançar no cronograma.')
    const hoje = new Date().toISOString().slice(0, 10)
    const dataDia = chaveData(dia.data_estudo)
    if (dataDia > hoje && !(await avaliacaoModel.diaTemDesafioAprovado(idDia, idUsuario))) {
      throw new Error('Este dia ainda está bloqueado. Faça o desafio de avanço para liberá-lo antecipadamente.')
    }
    return dia
  }

  async iniciarDesafioAdiantamento(idDia, idUsuario) {
    const dia = await avaliacaoModel.obterDiaDoUsuario(idDia, idUsuario)
    if (!dia) throw new Error('Dia do cronograma não encontrado.')
    const hoje = new Date().toISOString().slice(0, 10)
    if (chaveData(dia.data_estudo) <= hoje) throw new Error('Este dia já está disponível pela data do cronograma.')
    const dias = await cronogramaDiaModel.listarDiasPorCronograma(dia.id_cronograma)
    const indice = dias.findIndex((item) => Number(item.id_dia) === Number(idDia))
    if (!dias.slice(0, indice).every((item) => Number(item.concluido) === 1)) throw new Error('Conclua os dias anteriores antes de tentar adiantar este dia.')
    return avaliacaoModel.iniciar({ idUsuario, idCronograma: dia.id_cronograma, idDia, tipo: 'ADIANTAMENTO', quantidade: 5, minimoAcertos: 4 })
  }

  async iniciarProvaFinal(idCronograma, idUsuario) {
    const cronograma = await avaliacaoModel.obterCronogramaDoUsuario(idCronograma, idUsuario)
    if (!cronograma) throw new Error('Cronograma não encontrado.')
    const total = await cronogramaConteudoModel.contarConteudosPorCronograma(idCronograma)
    const concluidos = await cronogramaConteudoModel.contarConteudosConcluidosPorCronograma(idCronograma)
    if (!total || total !== concluidos) throw new Error('Conclua todos os conteúdos do cronograma antes de iniciar a prova final.')
    return avaliacaoModel.iniciar({ idUsuario, idCronograma, tipo: 'FINAL', quantidade: 20, minimoAcertos: 14 })
  }

  async enviarAvaliacao(idAvaliacao, idUsuario, respostas) {
    return avaliacaoModel.enviar(idAvaliacao, idUsuario, respostas)
  }

  async retomarAvaliacao(idAvaliacao, idUsuario) {
    return avaliacaoModel.retomar(idAvaliacao, idUsuario)
  }

  async abandonarAvaliacao(idAvaliacao, idUsuario) {
    return avaliacaoModel.abandonar(idAvaliacao, idUsuario)
  }

  async buscarConteudosDoPerfil(perfil) {
    const areas = normalizarListaAreas(perfil.areas_foco)
    const conteudos = []

    for (const area of areas) {
      const encontrados = await conteudoModel.buscarRelevantes(area)
      conteudos.push(...encontrados)
    }

    return removerDuplicadosPorId(conteudos)
  }

  async gerar(usuarioId) {
    const perfil = await perfilModel.obterPerfilPorUsuario(usuarioId)

    if (!perfil) {
      throw new Error('Perfil de estudo não configurado')
    }

    const disponibilidade =
      await dispModel.obterDisponibilidadePorUsuario(usuarioId)

    if (!disponibilidade || disponibilidade.length === 0) {
      throw new Error('Disponibilidade semanal não configurada')
    }

    const diasDisponiveis = disponibilidade
      .filter((dia) => Number(dia.ocupado) === 0)
      .map((dia) => dia.dia_semana)

    if (diasDisponiveis.length === 0) {
      throw new Error('Nenhum dia disponível para estudo foi configurado')
    }

    const conteudos = await this.buscarConteudosDoPerfil(perfil)

    if (conteudos.length === 0) {
      throw new Error('Nenhum conteúdo cadastrado para as áreas de foco informadas')
    }

    const provas = await inteligenciaModel.provas(usuarioId)
    const proximaProva = provas.find((prova) => chaveData(prova.data_prova) >= formatarDataISO(new Date()))
    if (proximaProva?.materias?.length) {
      const pesos = new Map(proximaProva.materias.map((materia) => [String(materia.disciplina || materia).toLowerCase(), Number(materia.peso || 1)]))
      conteudos.sort((a, b) => (pesos.get(String(b.disciplina).toLowerCase()) || 0) - (pesos.get(String(a.disciplina).toLowerCase()) || 0))
    }

    await cronogramaModel.desativarCronogramasAtivos(perfil.id_perfil)

    const hoje = new Date()
    const prazoDias = Number(perfil.prazo_estimado || 30)

    const dataFim = new Date(hoje)
    dataFim.setDate(dataFim.getDate() + prazoDias)

    const cronograma = await cronogramaModel.criarCronograma(perfil.id_perfil, {
      data_inicio: formatarDataISO(hoje),
      data_fim: formatarDataISO(dataFim),
      status: 'ativo'
    })

    let dataAtual = new Date(hoje)
    let indiceConteudo = 0

    for (let i = 0; i < prazoDias; i++) {
      const codigoDia = obterCodigoDia(dataAtual)

      if (diasDisponiveis.includes(codigoDia)) {
        const dia = await cronogramaDiaModel.criarDia(
          cronograma.id_cronograma,
          {
            data_estudo: formatarDataISO(dataAtual),
            tempo_previsto: Number(perfil.tempo_diario_min || 120)
          }
        )

        const quantidadeSlots = Math.max(
          1,
          Math.floor(Number(perfil.tempo_diario_min || 120) / 30)
        )

        for (let slot = 0; slot < quantidadeSlots; slot++) {
          const conteudo = conteudos[indiceConteudo % conteudos.length]

          await cronogramaConteudoModel.atribuirConteudoAoDia(
            dia.id_dia,
            conteudo.id_conteudo
          )

          indiceConteudo++
        }
      }

      dataAtual.setDate(dataAtual.getDate() + 1)
    }

    return cronogramaModel.obterCronogramaCompleto(
      cronograma.id_cronograma
    )
  }

  async listar(usuarioId) {
    const perfil = await perfilModel.obterPerfilPorUsuario(usuarioId)

    if (!perfil) {
      return []
    }

    const cronogramas =
      await cronogramaModel.listarCronogramasPorPerfil(perfil.id_perfil)

    const cronogramasCompletos = []

    for (const cronograma of cronogramas) {
      const completo = await cronogramaModel.obterCronogramaCompleto(
        cronograma.id_cronograma
      )

      if (completo) {
        const hoje = new Date().toISOString().slice(0, 10)
        let anteriorConcluido = true
        for (const dia of completo.dias) {
          const adiantado = await avaliacaoModel.diaTemDesafioAprovado(dia.id_dia, usuarioId)
          const futuro = chaveData(dia.data_estudo) > hoje
          dia.bloqueado = !Number(dia.concluido) && (!anteriorConcluido || (futuro && !adiantado))
          dia.requer_desafio = !Number(dia.concluido) && anteriorConcluido && futuro && !adiantado
          dia.desbloqueado_antecipadamente = adiantado
          anteriorConcluido = anteriorConcluido && Number(dia.concluido) === 1
        }
        const totalConteudos = await cronogramaConteudoModel.contarConteudosPorCronograma(completo.id_cronograma)
        const concluidos = await cronogramaConteudoModel.contarConteudosConcluidosPorCronograma(completo.id_cronograma)
        const prova = await avaliacaoModel.obterProvaFinal(completo.id_cronograma, usuarioId)
        const emAndamento = await avaliacaoModel.obterEmAndamento(completo.id_cronograma, usuarioId)
        completo.prova_final = { disponivel: totalConteudos > 0 && totalConteudos === concluidos && completo.status !== 'CONCLUIDO', concluida: completo.status === 'CONCLUIDO', ultima: prova ? { status: prova.status, percentual: prova.percentual } : null }
        completo.avaliacao_em_andamento = emAndamento ? {
          id_avaliacao: emAndamento.id_avaliacao,
          id_dia: emAndamento.id_dia,
          tipo: emAndamento.tipo,
          total: Number(emAndamento.total_questoes),
          minimoAcertos: Number(emAndamento.minimo_acertos)
        } : null
        cronogramasCompletos.push(completo)
      }
    }

    return cronogramasCompletos
  }

  async obterAtivo(usuarioId) {
    const perfil = await perfilModel.obterPerfilPorUsuario(usuarioId)

    if (!perfil) {
      return null
    }

    return cronogramaModel.obterCronogramaAtivoCompletoPorPerfil(
      perfil.id_perfil
    )
  }

  async marcarConcluido(idDia, idUsuario) {
    await this.validarDiaLiberado(idDia, idUsuario)
    const total = await cronogramaConteudoModel.contarConteudosPorDia(idDia)
    const concluidos = await cronogramaConteudoModel.contarConteudosConcluidosPorDia(idDia)
    if (!total || total !== concluidos) throw new Error('Conclua todos os conteúdos deste dia antes de confirmá-lo.')
    await cronogramaDiaModel.marcarDiaConcluido(idDia)

    return {
      id_dia: idDia,
      status: 'concluído',
      concluido: true
    }
  }

  async marcarPendente(idDia) {
    await cronogramaConteudoModel.marcarTodosPendentes(idDia)
    await cronogramaDiaModel.marcarDiaPendente(idDia)

    return {
      id_dia: idDia,
      status: 'pendente',
      concluido: false
    }
  }

  async concluirConteudo(idConteudoCronograma, idUsuario) {
    const conteudo = await cronogramaConteudoModel.obterConteudoCronogramaPorId(idConteudoCronograma)
    if (!conteudo) throw new Error('Conteúdo do cronograma não encontrado.')
    await this.validarDiaLiberado(conteudo.id_dia, idUsuario)
    return cronogramaConteudoModel.marcarConcluido(idConteudoCronograma)
  }

  async reabrirConteudo(idConteudoCronograma) {
    return cronogramaConteudoModel.marcarNaoConcluido(idConteudoCronograma)
  }

  async atualizarStatus(idCronograma, status) {
    return cronogramaModel.atualizarStatusCronograma(idCronograma, status)
  }

  async atualizarConteudoCronograma(idConteudoCronograma, dados) {
    const conteudo = await cronogramaConteudoModel.obterConteudoCronogramaPorId(idConteudoCronograma)
    if (!conteudo) throw new Error('Conteúdo do cronograma não encontrado.')

    if (!conteudo.id_conteudo) return conteudo

    await conteudoModel.atualizarConteudo(conteudo.id_conteudo, combinarDadosConteudo(conteudo, dados))
    return cronogramaConteudoModel.obterConteudoCronogramaPorId(idConteudoCronograma)
  }

  async obterConteudoCronogramaPorId(idConteudoCronograma) {
    return cronogramaConteudoModel.obterConteudoCronogramaPorId(idConteudoCronograma)
  }
  async moverConteudo(idConteudoCronograma, idDiaDestino, idUsuario) {
    return cronogramaConteudoModel.moverConteudo(idConteudoCronograma, idDiaDestino, idUsuario)
  }

}

module.exports = new CronogramaService()
