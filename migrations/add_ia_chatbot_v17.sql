-- Integração de IA: assistente de chat (chatbot) para dúvidas de matéria.
-- Mensagens persistidas por usuário para manter o histórico da conversa e
-- alimentar o contexto do modelo. Apenas 'user' e 'assistant' são armazenados;
-- o prompt de sistema é reaplicado em cada chamada (see iaConfig.systemPrompt).
CREATE TABLE IF NOT EXISTS mensagens_chat_ia (
  id_mensagem INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL DEFAULT 'user',
  conteudo TEXT NOT NULL,
  disciplina VARCHAR(100) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_usuario_data (id_usuario, criado_em),
  INDEX idx_chat_usuario_role (id_usuario, role, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS limites_ia (
  id_usuario INT PRIMARY KEY,
  mensagens_hoje INT UNSIGNED NOT NULL DEFAULT 0,
  ultima_mensagem DATE NOT NULL DEFAULT (CURRENT_DATE),
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
