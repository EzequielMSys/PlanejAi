# Migração da sessão para cookie

## Estado atual

O backend e o frontend agora têm uma implementação local de sessão por cookie `HttpOnly`, `Secure` em produção, `SameSite=Lax` e prefixo `__Host-`. Login e alteração de senha deixam de devolver JWT ao navegador. `GET /api/auth/session` restaura a sessão e `POST /api/auth/logout` limpa o cookie e revoga a versão da sessão da conta, encerrando também sessões em outros aparelhos. Requisições autenticadas que alteram dados exigem `X-CSRF-Token` associado ao JWT. O frontend usa credenciais do navegador, elimina JWT legado do `localStorage` e sincroniza a fila offline com CSRF. O suporte a Bearer permanece apenas para clientes externos durante a transição.

## Sequência de implementação

1. Criar rotas `GET /api/auth/session` e `POST /api/auth/logout`. A primeira consulta a conta no servidor; a segunda limpa o cookie.
2. Fazer login e troca de senha emitirem um cookie de sessão `HttpOnly`, `Secure`, `SameSite=Lax`, com expiração alinhada ao JWT. Nunca devolver o JWT no corpo após a migração.
3. Exigir um token CSRF separado em requisições que alteram dados quando a autenticação vier do cookie. Validar o token no servidor e limitar CORS às origens explícitas já configuradas.
4. Atualizar `AuthContext`, cliente da API, fila offline e rastreador de uso para usar `credentials: include`. O estado de autenticação deve vir da rota `/session`, sem depender de dados locais como fonte de verdade.
5. Atualizar os testes de interface para simular cookies e `/session`; testar login, recarga, logout, expiração, revogação, troca de senha, CSRF e sincronização offline. Só então remover o suporte a `Authorization: Bearer` para o navegador.

## Verificação para ativar

- Nenhum JWT aparece em `localStorage`, `sessionStorage` ou na resposta de login.
- A sessão sobrevive à recarga e termina após logout, expiração ou revogação.
- Requisições de escrita sem token CSRF válido falham; as legítimas funcionam.
- A suíte local e os fluxos de login, perfil e fila offline na publicação passam.

O frontend e a API precisam usar a mesma origem para o cookie `SameSite=Lax`. O GitHub Pages passa a redirecionar para a Vercel, preservando a rota no fragmento, em vez de hospedar uma segunda cópia incompatível com a sessão. Antes de publicar em produção, testar os fluxos com uma conta descartável na Vercel e conferir os atributos do cookie no navegador.

Verificação local em 24/11/2026: a suíte de regressão passou, incluindo autenticação, interface e fila offline; lint, build e checagem sintática do backend passaram. O teste HTTP `node test/sessionIntegration.js` validou `Secure`, `HttpOnly`, prefixo `__Host-`, login, recarga, CSRF, troca de senha, logout e exclusão em banco isolado. Ainda falta a validação pelo navegador na Vercel.
