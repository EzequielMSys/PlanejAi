-- Existing installations can use different collations for project identifiers.
-- Match the parent column before adding the foreign key; no project data changes.
SET @reading_project_collation = (SELECT COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='percursos_estudo' AND COLUMN_NAME='id');
SET @reading_project_sql = CONCAT('ALTER TABLE leituras_criticas MODIFY projeto CHAR(36) CHARACTER SET utf8mb4 COLLATE ', @reading_project_collation, ' NOT NULL');
PREPARE reading_project_statement FROM @reading_project_sql;
EXECUTE reading_project_statement;
DEALLOCATE PREPARE reading_project_statement;
ALTER TABLE leituras_criticas ADD CONSTRAINT fk_leitura_projeto FOREIGN KEY (projeto) REFERENCES percursos_estudo(id) ON DELETE CASCADE;
