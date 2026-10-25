CREATE TABLE IF NOT EXISTS suporte_contexto (
  id_solicitacao BIGINT UNSIGNED PRIMARY KEY,
  tipo ENUM('PROBLEMA','MELHORIA') NOT NULL,
  pagina VARCHAR(200) NOT NULL,
  detalhes VARCHAR(1000) NULL,
  captura MEDIUMBLOB NULL,
  captura_mime VARCHAR(30) NULL,
  CONSTRAINT fk_suporte_contexto FOREIGN KEY (id_solicitacao) REFERENCES suporte_solicitacoes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
