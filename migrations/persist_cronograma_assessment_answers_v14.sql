-- Rascunhos de avaliações pertencem à conta do aluno, não ao navegador.
CREATE TABLE IF NOT EXISTS cronograma_avaliacao_respostas (
  id_avaliacao INT NOT NULL,
  id_questao INT NOT NULL,
  resposta TINYINT UNSIGNED NOT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_avaliacao, id_questao),
  CONSTRAINT fk_avaliacao_resposta_avaliacao
    FOREIGN KEY (id_avaliacao) REFERENCES cronograma_avaliacoes(id_avaliacao) ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_resposta_questao
    FOREIGN KEY (id_questao) REFERENCES questoes_estudo(id_questao) ON DELETE CASCADE,
  INDEX idx_avaliacao_resposta_atualizado (atualizado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
