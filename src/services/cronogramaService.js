const perfilModel = require('../models/perfilEstudoModel')
const dispModel = require('../models/disponibilidadeSemanaModel')
const cronogramaModel = require('../models/cronogramaModel')
const cronogramaDiaModel = require('../models/cronogramaDiaModel')
const cronogramaConteudoModel = require('../models/cronogramaConteudoModel')
const conteudoModel = require('../models/conteudoModel')

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

class CronogramaService {
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

  async marcarConcluido(idDia) {
    await cronogramaConteudoModel.marcarTodosConcluidos(idDia)
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

  async concluirConteudo(idConteudoCronograma) {
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

    const atualizados = await conteudoModel.atualizarConteudo(conteudo.id_conteudo, dados)
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