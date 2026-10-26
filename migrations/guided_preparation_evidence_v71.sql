CREATE TABLE IF NOT EXISTS percursos_estudo (
 id CHAR(36) NOT NULL PRIMARY KEY,
 id_usuario INT NOT NULL,
 tipo ENUM('prova','evidencia') NOT NULL,
 versao INT NOT NULL DEFAULT 1,
 dados JSON NOT NULL,
 resumo JSON NOT NULL,
 atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_percursos_conta (id_usuario,tipo,atualizado_em),
 CONSTRAINT fk_percursos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
