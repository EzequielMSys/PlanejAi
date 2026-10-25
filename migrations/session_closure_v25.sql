CREATE TABLE IF NOT EXISTS fechamentos_estudo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_conteudo INT NULL,
  id_sessao INT NOT NULL,
  chave VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  hash_payload CHAR(64) CHARACTER SET ascii NOT NULL,
  sintese JSON NOT NULL,
  proximo_passo VARCHAR(600) NOT NULL DEFAULT '',
  retomado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fechamento_request (id_usuario,chave),
  UNIQUE KEY uq_fechamento_sessao (id_sessao),
  INDEX idx_fechamento_retomada (id_usuario,retomado_em,criado_em),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_conteudo) REFERENCES conteudos(id_conteudo) ON DELETE SET NULL,
  FOREIGN KEY (id_sessao) REFERENCES sessoes_estudo(id_sessao) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
