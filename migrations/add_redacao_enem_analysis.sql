-- Migration: adicionar suporte à análise ENEM (0-1000), repertório sugerido e detecção de IA aprimorada

-- Expande a coluna nota_estimada para suportar notas de 0 a 1000 (padrão ENEM)
ALTER TABLE `redacoes`
  MODIFY COLUMN `nota_estimada` decimal(6,2) DEFAULT NULL,
  MODIFY COLUMN `nota_manual` decimal(6,2) DEFAULT NULL;

-- Adiciona colunas para competências ENEM, repertório sugerido e análise de IA
ALTER TABLE `redacoes`
  ADD COLUMN IF NOT EXISTS `competencias_enem` text DEFAULT NULL AFTER `flag_ia`,
  ADD COLUMN IF NOT EXISTS `repertorio_sugerido` text DEFAULT NULL AFTER `competencias_enem`,
  ADD COLUMN IF NOT EXISTS `ia_nivel` varchar(20) DEFAULT NULL AFTER `repertorio_sugerido`,
  ADD COLUMN IF NOT EXISTS `ia_evidencias` text DEFAULT NULL AFTER `ia_nivel`,
  ADD COLUMN IF NOT EXISTS `texto_corrigido` text DEFAULT NULL AFTER `ia_evidencias`;
