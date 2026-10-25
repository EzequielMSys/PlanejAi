CREATE TABLE IF NOT EXISTS mesa_estudo (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 id_usuario INT NOT NULL,
 tipo ENUM('anotacao','duvida','material','redacao') NOT NULL,
 id_origem INT NOT NULL,
 posicao INT NOT NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_mesa_origem (id_usuario,tipo,id_origem),
 KEY idx_mesa_ordem (id_usuario,posicao,id),
 CONSTRAINT fk_mesa_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
