CREATE TABLE IF NOT EXISTS leituras_criticas (
 id CHAR(36) NOT NULL PRIMARY KEY,
 projeto CHAR(36) NOT NULL,
 autor INT NOT NULL,
 leitor INT NOT NULL,
 dados JSON NOT NULL,
 hash_envio CHAR(64) NOT NULL,
 expira_em BIGINT UNSIGNED NOT NULL,
 revogada_em DATETIME NULL,
 criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_leituras_leitor (leitor,expira_em),
 KEY idx_leituras_autor (autor,projeto),
 CONSTRAINT fk_leitura_autor FOREIGN KEY (autor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
 CONSTRAINT fk_leitura_leitor FOREIGN KEY (leitor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS leitura_critica_comentarios (
 id CHAR(36) NOT NULL PRIMARY KEY,
 leitura CHAR(36) NOT NULL,
 dados JSON NOT NULL,
 hash_envio CHAR(64) NOT NULL,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_leitura_comentarios (leitura,criado_em),
 CONSTRAINT fk_comentario_leitura FOREIGN KEY (leitura) REFERENCES leituras_criticas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
