CREATE TABLE IF NOT EXISTS flashcard_revisoes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_flashcard INT NOT NULL,
  chave VARCHAR(80) NOT NULL,
  resultado ENUM('ERREI','DIFICIL','LEMBREI','DOMINEI') NOT NULL,
  versao_cartao INT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  disciplina VARCHAR(100) NULL,
  proxima_revisao DATE NOT NULL,
  intervalo_dias INT NOT NULL,
  criado_em DATETIME NOT NULL,
  UNIQUE KEY uq_flashcard_revisao_envio (id_usuario,id_flashcard,chave),
  INDEX idx_flashcard_revisao_historico (id_usuario,id_flashcard,id),
  CONSTRAINT fk_flashcard_revisao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_flashcard_revisao_cartao FOREIGN KEY (id_flashcard) REFERENCES flashcards_estudo(id_flashcard) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
