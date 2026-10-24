CREATE TABLE IF NOT EXISTS estudo_em_andamento (
  id_usuario INT NOT NULL PRIMARY KEY,
  id_item INT NOT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_estudo_atual_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_estudo_atual_item FOREIGN KEY (id_item) REFERENCES cronograma_conteudos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
