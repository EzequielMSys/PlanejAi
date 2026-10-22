-- Preferência opcional de pronomes para tratamento nas mensagens da plataforma.
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS pronome VARCHAR(20) NULL;
