ALTER TABLE flashcards_estudo ADD COLUMN melhorar TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE flashcards_estudo ADD COLUMN melhoria_nota VARCHAR(300) NULL;
CREATE TABLE IF NOT EXISTS flashcard_colecoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  objetivo VARCHAR(300) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_colecao_nome (id_usuario,nome),
  UNIQUE KEY uq_colecao_dono (id,id_usuario),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE flashcards_estudo ADD UNIQUE KEY uq_flashcard_dono (id_flashcard,id_usuario);
CREATE TABLE IF NOT EXISTS flashcard_colecao_itens (
  id_colecao INT NOT NULL,
  id_flashcard INT NOT NULL,
  id_usuario INT NOT NULL,
  PRIMARY KEY (id_colecao,id_flashcard),
  INDEX idx_colecao_cartao (id_flashcard,id_usuario),
  FOREIGN KEY (id_colecao,id_usuario) REFERENCES flashcard_colecoes(id,id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_flashcard,id_usuario) REFERENCES flashcards_estudo(id_flashcard,id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
