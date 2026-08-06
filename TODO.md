# TODO PlanejAI

## Novas funcionalidades

### 1. Exibir os conteúdos de cada dia no Cronograma
- [x] Adicionar seção expandível em `frontend/src/pages/Cronograma.jsx` mostrando os conteúdos/materiais de cada dia (os dados já vêm da API em `dia.conteudos`)
- [x] Permitir concluir/reabrir conteúdo individualmente usando `cronogramaService.concluirConteudo`/`reabrirConteudo`

### 2. Tela de Redações
- [x] Criar serviço `frontend/src/services/redacaoService.js` (integração com `/api/redacao`)
- [x] Criar página `frontend/src/pages/Redacoes.jsx` (listar, escrever, ver feedback/nota)
- [x] Adicionar rota `/redacoes` no `frontend/src/App.jsx`
- [x] Adicionar item "Redações" no `frontend/src/components/Sidebar.jsx`

### 3. Melhorar feedback de redação no backend
- [x] Aprimorar `src/controllers/redacaoController.js` para dar feedback mais rico (estrutura, coesão, competências) além do comprimento

## Correções de erros reportados

### 4. Erro "Unknown column 'atualizado_em' em perfil_estudo"
- [x] Remover `atualizado_em = CURRENT_TIMESTAMP` do `UPDATE` em `src/models/perfilEstudoModel.js` (a tabela não tem essa coluna)

### 5. Geração de cronograma não funcionava
- [x] Corrigir `criarCronograma` em `src/models/cronogramaModel.js` para usar `status.toUpperCase()` (valores do enum `'ATIVO'`, `'CONCLUIDO'`, `'CANCELADO'`) em vez de `'ativo'`/`'arquivado'`
- [x] Corrigir `listarCronogramasPorPerfil`, `obterCronogramaAtivoPorPerfil` e `desativarCronogramasAtivos` para usar os valores corretos do enum
- [x] Criar e aplicar `migrations/fix_cronograma_schema.sql`:
  - `prazo_estimado` (date) → `INT` (para armazenar dias)
  - Adicionar coluna `concluido` em `cronograma_dias`
  - Normalizar valores de `cronogramas.status`
