-- Anotações devem acompanhar o aluno em qualquer dispositivo.
CREATE TABLE IF NOT EXISTS anotacoes_estudo (
  id_anotacao INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_conteudo INT NOT NULL,
  texto MEDIUMTEXT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_anotacao_usuario_conteudo (id_usuario, id_conteudo),
  CONSTRAINT fk_anotacao_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_anotacao_conteudo
    FOREIGN KEY (id_conteudo) REFERENCES conteudos(id_conteudo) ON DELETE CASCADE,
  INDEX idx_anotacao_atualizado (id_usuario, atualizado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
