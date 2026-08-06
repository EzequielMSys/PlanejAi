# TODO PlanejAI

## Novas funcionalidades

### 1. Exibir os conteúdos de cada dia no Cronograma
- [x] Adicionar seção expandível em `frontend/src/pages/Cronograma.jsx` mostrando os conteúdos/materiais de cada dia (os dados já vêm da API em `dia.conteudos`)
- [x] Permitir concluir/reabrir conteúdo individualmente usando `cronogramaService.concluirConteudo`/`reabrirConteudo`

### 2. Tela de Redações
- [x] Criar serviço `frontend/src/services/redacaoService.js` (integração com `/api/redacao`)
- [x] Criar página `frontend/src/pages/Redacoes.jsx` (listar, escrever, ver feedback/nota)
- [x] Adicionar rota `/redacoes` no `frontend/src/App.jsx`
- [x] Adicionar item "Redações" no `frontend/src/components/Sidebar.jsx`

### 3. Melhorar feedback de redação no backend
- [x] Aprimorar `src/controllers/redacaoController.js` para dar feedback mais rico (estrutura, coesão, competências) além do comprimento

## Validações solicitadas

### 4. Nome com apenas letras (cadastro)
- [x] Frontend `Register.jsx`: validação rejeita números no nome
- [x] Backend `authService.js`: valida nome apenas com letras (e espaços/acentos)
- [x] Backend `authController.js`: retornar erro 400 para nome inválido

### 5. Área de foco com apenas letras
- [x] Frontend `Onboarding.jsx`: validação rejeita números/caracteres especiais
- [x] Frontend `Perfil.jsx`: validação no `handleSaveEstudos`
- [x] Backend `perfilController.js`: valida `areas_foco` em `salvarPerfil` e `atualizarPerfil`

### 6. E-mail válido (cadastro e edição)
- [x] Frontend `Register.jsx`: regex exige domínio com TLD (ex.: `.com`)
- [x] Frontend `Perfil.jsx`: valida e-mail no `handleSaveInfo`
- [x] Backend `authService.js`: valida e-mail no registro
- [x] Backend `usuarioService.js`: valida e-mail e nome no `atualizar`

## Menu/Navegação

### 7. Dropdown de navegação no logo "P" roxo
- [x] Transformar o botão "P" (logo) em um menu dropdown com todas as seções do site (Dashboard, Cronograma, Redações, Perfil, Configurações e painéis admin/dono)
- [x] Manter o dropdown de perfil no avatar
- [x] Ícones para cada seção em `frontend/src/components/Navbar.jsx`
</content>
