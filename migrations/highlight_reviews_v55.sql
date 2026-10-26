CREATE TABLE IF NOT EXISTS revisoes_destaques (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  chave VARCHAR(80) NOT NULL,
  id_destaque BIGINT UNSIGNED NOT NULL,
  id_flashcard INT NOT NULL,
  hash_payload CHAR(64) NOT NULL,
  fonte_titulo VARCHAR(160) NOT NULL,
  fonte_secao VARCHAR(160) NOT NULL,
  fonte_trecho VARCHAR(1200) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_revisao_destaque_envio (id_usuario,chave),
  INDEX idx_revisao_destaque_origem (id_usuario,id_destaque),
  CONSTRAINT fk_revisao_destaque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_revisao_destaque_card FOREIGN KEY (id_flashcard) REFERENCES flashcards_estudo(id_flashcard) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
