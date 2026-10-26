CREATE TABLE IF NOT EXISTS leitura_destaques (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 id_usuario INT NOT NULL,
 chave VARCHAR(80) NOT NULL,
 material_key VARCHAR(220) NOT NULL,
 titulo VARCHAR(160) NOT NULL,
 secao VARCHAR(160) NOT NULL,
 trecho VARCHAR(1200) NOT NULL,
 nota TEXT NOT NULL,
 versao INT NOT NULL DEFAULT 1,
 arquivado TINYINT NOT NULL DEFAULT 0,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_destaque_envio (id_usuario,chave),
 INDEX idx_destaque_material (id_usuario,material_key,arquivado),
 CONSTRAINT fk_destaque_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS lumi_conversas (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 id_usuario INT NOT NULL,
 chave VARCHAR(80) NOT NULL,
 objetivo VARCHAR(100) NOT NULL,
 materia VARCHAR(100) NOT NULL DEFAULT '',
 contexto JSON NOT NULL,
 mensagens JSON NOT NULL,
 versao INT NOT NULL DEFAULT 1,
 arquivado TINYINT NOT NULL DEFAULT 0,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_conversa_envio(id_usuario,chave),
 INDEX idx_conversa_usuario(id_usuario,arquivado,atualizado_em),
 CONSTRAINT fk_conversa_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
