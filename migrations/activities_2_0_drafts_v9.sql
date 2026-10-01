-- Mantém alterações em edição separadas da versão publicada aos alunos.
CREATE TABLE IF NOT EXISTS atividade_rascunhos (
  id_atividade INT PRIMARY KEY,
  conteudo JSON NOT NULL,
  salvo_por INT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_atividade_rascunho_atividade FOREIGN KEY (id_atividade) REFERENCES atividades(id_atividade) ON DELETE CASCADE,
  CONSTRAINT fk_atividade_rascunho_usuario FOREIGN KEY (salvo_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
