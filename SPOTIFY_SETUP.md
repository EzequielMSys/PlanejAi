# Vinculação do Spotify no PlanejAI

O player incorporado funciona sem credenciais. A vinculação de conta usa Authorization Code com PKCE, sem expor `Client Secret` no frontend.

## Configuração

1. Acesse [Spotify for Developers](https://developer.spotify.com/dashboard) e crie um aplicativo.
2. Ative Web API e Web Playback SDK no aplicativo.
3. Cadastre as Redirect URIs utilizadas pelo projeto:
   - Produção: `https://ezequielmsys.github.io/PlanejAi/`
   - Desenvolvimento: `http://127.0.0.1:5173/PlanejAi/`
4. Copie apenas o Client ID público.
5. Em `frontend/.env`, adicione:

   ```env
   VITE_SPOTIFY_CLIENT_ID=seu_client_id
   ```

6. Reinicie o frontend.

O Spotify não aceita `localhost` como Redirect URI. Em desenvolvimento, abra o projeto usando `http://127.0.0.1:5173/PlanejAi/`.

## Segurança

- O Client Secret não deve ser colocado no frontend.
- O verificador PKCE e os tokens ficam em `sessionStorage`, limitado à aba atual.
- A URL recebe um `state` aleatório para evitar falsificação da resposta OAuth.
- O código e o estado são removidos da URL após a vinculação.
- Desconectar remove a sessão local do Spotify.

Controles completos de reprodução e volume pela API dependem de uma conta Spotify Premium e de um dispositivo ativo compatível.
