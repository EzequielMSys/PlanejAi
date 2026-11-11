CREATE TABLE IF NOT EXISTS uso_diario_conta (
  id_usuario INT NOT NULL,
  dia DATE NOT NULL,
  segundos INT UNSIGNED NOT NULL,
  ultimo_intervalo BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_usuario, dia),
  CONSTRAINT fk_uso_diario_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
