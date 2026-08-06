# TODO

## Correções PlanejAI

### 1. Corrigir erro de conexão com o banco (DB IP)
- [x] Alterar `DB_HOST=10.111.9.71` para `DB_HOST=localhost` no `.env`
- [x] Adicionar `DB_PORT=3306` no `.env`
- [x] Criar/conceder acesso ao usuário `planejai` no MySQL local

### 2. Remover seletor "Tipo de Conta" da tela de cadastro
- [x] Remover o bloco `<select>` de "Tipo de Conta" em `frontend/src/pages/Register.jsx`
- [x] Manter `tipo: 'aluno'` fixo no estado e no payload de submit

### 3. Varredura de outros possíveis erros
- [x] Revisar backend (authService, authController, db.js) em busca de erros
- [x] Confirmar configuração do frontend (vite proxy, API base)
- [x] Testar conexão com MySQL local (OK, todas as tabelas presentes)
