ALTER TABLE flashcards_estudo
  ADD COLUMN arquivado TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN versao INT NOT NULL DEFAULT 1,
  ADD COLUMN chave_criacao VARCHAR(80) NULL,
  ADD COLUMN hash_criacao CHAR(64) NULL,
  ADD COLUMN ultima_avaliacao_chave VARCHAR(80) NULL,
  ADD COLUMN ultimo_resultado VARCHAR(10) NULL,
  ADD UNIQUE KEY uq_flashcard_criacao (id_usuario,chave_criacao),
  ADD INDEX idx_flashcard_ativos_revisao (id_usuario,arquivado,proxima_revisao,id_flashcard);
