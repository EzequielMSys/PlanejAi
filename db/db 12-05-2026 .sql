-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para tcc
DROP DATABASE IF EXISTS `tcc`;
CREATE DATABASE IF NOT EXISTS `tcc` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `tcc`;

-- Copiando estrutura para tabela tcc.atividades
DROP TABLE IF EXISTS `atividades`;
CREATE TABLE IF NOT EXISTS `atividades` (
  `id_atividade` int(11) NOT NULL AUTO_INCREMENT,
  `id_conteudo` int(11) DEFAULT NULL,
  `pergunta` text DEFAULT NULL,
  `tipo` enum('OBJETIVA','DISSERTATIVA') DEFAULT NULL,
  `resposta_correta` text DEFAULT NULL,
  PRIMARY KEY (`id_atividade`),
  KEY `id ativ de conteudos1` (`id_conteudo`),
  CONSTRAINT `id ativ de conteudos1` FOREIGN KEY (`id_conteudo`) REFERENCES `conteudos` (`id_conteudo`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.conteudos
DROP TABLE IF EXISTS `conteudos`;
CREATE TABLE IF NOT EXISTS `conteudos` (
  `id_conteudo` int(11) NOT NULL AUTO_INCREMENT,
  `area` enum('Ciências','Exatas','Terra','Biológicas','Engenharias','Saúde','Agrárias','Sociais Aplicadas','Humanas','Linguística','Letras','Artes') DEFAULT NULL,
  `disciplina` varchar(50) DEFAULT NULL,
  `titulo` varchar(50) DEFAULT NULL,
  `tipo` enum('VIDEO','PDF','LIVRO','ARTIGO') DEFAULT NULL,
  `link` text DEFAULT NULL,
  `nivel` enum('BASICO','INTERMEDIARIO','AVANCADO') DEFAULT NULL,
  PRIMARY KEY (`id_conteudo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.cronograma_conteudos
DROP TABLE IF EXISTS `cronograma_conteudos`;
CREATE TABLE IF NOT EXISTS `cronograma_conteudos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_dia` int(11) DEFAULT NULL,
  `id_conteudo` int(11) DEFAULT NULL,
  `concluido` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `id de dias1` (`id_dia`),
  KEY `id de conteudos1` (`id_conteudo`),
  CONSTRAINT `id de conteudos1` FOREIGN KEY (`id_conteudo`) REFERENCES `conteudos` (`id_conteudo`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `id de dias1` FOREIGN KEY (`id_dia`) REFERENCES `cronograma_dias` (`id_dia`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.cronograma_dias
DROP TABLE IF EXISTS `cronograma_dias`;
CREATE TABLE IF NOT EXISTS `cronograma_dias` (
  `id_dia` int(11) NOT NULL AUTO_INCREMENT,
  `id_cronograma` int(11) DEFAULT NULL,
  `data_estudo` date DEFAULT NULL,
  `tempo_previsto` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_dia`),
  KEY `id cronogamas1` (`id_cronograma`),
  CONSTRAINT `id cronogamas1` FOREIGN KEY (`id_cronograma`) REFERENCES `cronogramas` (`id_cronograma`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.cronogramas
DROP TABLE IF EXISTS `cronogramas`;
CREATE TABLE IF NOT EXISTS `cronogramas` (
  `id_cronograma` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) DEFAULT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `status` enum('ATIVO','CONCLUIDO','CANCELADO') DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_cronograma`),
  KEY `cronograma perfil1` (`id_perfil`),
  CONSTRAINT `cronograma perfil1` FOREIGN KEY (`id_perfil`) REFERENCES `perfil_estudo` (`id_perfil`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.disponibilidade_semana
DROP TABLE IF EXISTS `disponibilidade_semana`;
CREATE TABLE IF NOT EXISTS `disponibilidade_semana` (
  `id_disponibilidade` int(11) NOT NULL AUTO_INCREMENT,
  `id_perfil` int(11) NOT NULL DEFAULT 0,
  `dia_semana` enum('SEG','TER','QUA','QUI','SEX','SAB','DOM') DEFAULT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fim` time DEFAULT NULL,
  `ocupado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_disponibilidade`),
  KEY `id perfil1` (`id_perfil`),
  CONSTRAINT `id perfil1` FOREIGN KEY (`id_perfil`) REFERENCES `perfil_estudo` (`id_perfil`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.perfil_estudo
DROP TABLE IF EXISTS `perfil_estudo`;
CREATE TABLE IF NOT EXISTS `perfil_estudo` (
  `id_perfil` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `ano_escolar` enum('9º','1º EM','2º EM','3º EM') DEFAULT NULL,
  `objetivo` enum('ENEM','VESTIBULAR','OBMEP','CURSO') DEFAULT NULL,
  `areas_foco` varchar(100) DEFAULT NULL,
  `tempo_diario_min` int(11) DEFAULT NULL,
  `prazo_estimado` date DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_perfil`),
  KEY `usuários` (`id_usuario`),
  CONSTRAINT `usuários` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.redacoes
DROP TABLE IF EXISTS `redacoes`;
CREATE TABLE IF NOT EXISTS `redacoes` (
  `id_redacao` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `tema` varchar(200) DEFAULT NULL,
  `texto` text DEFAULT NULL,
  `nota_estimada` decimal(4,2) DEFAULT NULL,
  `feedback_ia` text DEFAULT NULL,
  `enviada_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_redacao`),
  KEY `id redacoes usario1` (`id_usuario`),
  CONSTRAINT `id redacoes usario1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.respostas_usuario
DROP TABLE IF EXISTS `respostas_usuario`;
CREATE TABLE IF NOT EXISTS `respostas_usuario` (
  `id_resposta` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_atividade` int(11) DEFAULT NULL,
  `resposta` text DEFAULT NULL,
  `correta` tinyint(1) DEFAULT NULL,
  `respondido_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_resposta`),
  KEY `id respostas usuario1` (`id_usuario`),
  KEY `id respostas atividade1` (`id_atividade`),
  CONSTRAINT `id respostas atividade1` FOREIGN KEY (`id_atividade`) REFERENCES `atividades` (`id_atividade`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `id respostas usuario1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela tcc.usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `data_cadastro` datetime DEFAULT current_timestamp(),
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `tipo` enum('dono','admin','adm','docente','aluno') NOT NULL DEFAULT 'aluno',
  `senha_temporaria` tinyint(1) DEFAULT 1,
  `token_recuperacao` varchar(255) DEFAULT NULL,
  `token_expiracao` datetime DEFAULT NULL,
  `ultimo_login` datetime DEFAULT NULL,
  `atualizado_em` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `apelido` varchar(100) DEFAULT NULL,
  `foto_url` text DEFAULT NULL,
  `email_verificado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  KEY `idx_usuarios_tipo` (`tipo`),
  KEY `idx_usuarios_ativo` (`ativo`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Exportação de dados foi desmarcado.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
