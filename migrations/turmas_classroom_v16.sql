-- Turmas no formato Classroom: entrada por código, convite por código de uso
-- único, e tudo que pertence a uma turma (atividades e avisos) amarrado a ela.
--
-- Antes, `atividades` e `avisos` eram globais do docente: um aluno em três
-- turmas viajava três listas misturadas, sem saber de onde veio cada item. As
-- colunas são NULL quando o item não pertence a nenhuma turma, o que preserva
-- integralmente o comportamento anterior das atividades pessoais do docente.

CREATE TABLE IF NOT EXISTS turma_convites (
  id_convite INT AUTO_INCREMENT PRIMARY KEY,
  id_turma INT NOT NULL,
  codigo CHAR(8) NOT NULL,
  criado_por INT NOT NULL,
  expira_em DATETIME NOT NULL,
  usado_em DATETIME NULL,
  usado_por INT NULL,
  cancelado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_convite_codigo (codigo),
  KEY idx_convite_turma (id_turma, expira_em),
  CONSTRAINT fk_convite_turma FOREIGN KEY (id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE,
  CONSTRAINT fk_convite_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_convite_usado_por FOREIGN KEY (usado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE atividades
  ADD COLUMN IF NOT EXISTS id_turma INT NULL AFTER id_conteudo,
  ADD KEY idx_atividades_turma (id_turma, status, prazo),
  ADD CONSTRAINT fk_atividades_turma FOREIGN KEY (id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE;

ALTER TABLE avisos
  ADD COLUMN IF NOT EXISTS id_turma INT NULL AFTER criado_por,
  ADD KEY idx_avisos_turma (id_turma, criado_em),
  ADD CONSTRAINT fk_avisos_turma FOREIGN KEY (id_turma) REFERENCES turmas(id_turma) ON DELETE CASCADE;
