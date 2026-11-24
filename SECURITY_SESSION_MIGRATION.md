# Migração da sessão para cookie

## Estado atual

O frontend guarda o JWT em `localStorage` e o envia em `Authorization`. A autenticação também é usada no envio da fila offline, no rastreador de uso e na restauração da sessão. Uma troca direta do contrato que remove o token da resposta de login fez 223 dos 774 testes falharem, principalmente porque os testes de interface simulam a sessão antiga. Essa tentativa foi revertida para preservar o funcionamento atual.

## Sequência de implementação

1. Criar rotas `GET /api/auth/session` e `POST /api/auth/logout`. A primeira consulta a conta no servidor; a segunda limpa o cookie.
2. Fazer login e troca de senha emitirem um cookie de sessão `HttpOnly`, `Secure`, `SameSite=Strict`, com expiração alinhada ao JWT. Nunca devolver o JWT no corpo após a migração.
3. Exigir um token CSRF separado em requisições que alteram dados quando a autenticação vier do cookie. Validar o token no servidor e limitar CORS às origens explícitas já configuradas.
4. Atualizar `AuthContext`, cliente da API, fila offline e rastreador de uso para usar `credentials: include`. O estado de autenticação deve vir da rota `/session`, sem depender de dados locais como fonte de verdade.
5. Atualizar os testes de interface para simular cookies e `/session`; testar login, recarga, logout, expiração, revogação, troca de senha, CSRF e sincronização offline. Só então remover o suporte a `Authorization: Bearer` para o navegador.

## Verificação para ativar

- Nenhum JWT aparece em `localStorage`, `sessionStorage` ou na resposta de login.
- A sessão sobrevive à recarga e termina após logout, expiração ou revogação.
- Requisições de escrita sem token CSRF válido falham; as legítimas funcionam.
- A suíte local e os fluxos de login, perfil e fila offline na publicação passam.
