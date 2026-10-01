// A política de CORS fica isolada neste módulo para poder ser testada sem
// subir o servidor HTTP. O navegador envia apenas a origem
// (`esquema://host[:porta]`) e nunca o caminho, por isso toda a comparação
// acontece contra o host autorizado.

const PROTOCOLOS_PERMITIDOS = new Set(["http:", "https:"]);

const PORTAS_PADRAO = { "http:": "80", "https:": "443" };

// Rótulo válido de host ou IP: letras, dígitos e hífen, sem hífen nas pontas.
// O `*` é tratado à parte e casa um rótulo inteiro.
const ROTULO_EXATO = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

const PORTA_VALIDA = /^\d{1,5}$/;

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function padraoDeRotulo(rotulo) {
  if (rotulo === "*") return "[^.]+";
  if (!ROTULO_EXATO.test(rotulo)) return null;
  return escaparRegex(rotulo);
}

// Aceita `host`, `host:porta` e IPv6 literal como `[::1]:3000`.
function dividirAutoridade(autoridade) {
  if (!autoridade) return { host: "", porta: null };
  if (autoridade.startsWith("[")) {
    const fim = autoridade.indexOf("]");
    if (fim < 0) return { host: "", porta: null };
    const host = autoridade.slice(0, fim + 1);
    const resto = autoridade.slice(fim + 1);
    if (!resto) return { host, porta: null };
    if (!resto.startsWith(":")) return { host: "", porta: null };
    return { host, porta: resto.slice(1) };
  }
  const separador = autoridade.lastIndexOf(":");
  if (separador < 0) return { host: autoridade, porta: null };
  return { host: autoridade.slice(0, separador), porta: autoridade.slice(separador + 1) };
}

// Devolve `null` para qualquer texto que não seja uma origem http(s) bem
// formada. Um rule inválido nunca é silenciosamente ignorado: quem configura
// precisa saber que a origem não entrou na lista.
function parsearOrigem(valor) {
  const texto = String(valor || "").trim().replace(/\/+$/, "");
  const separador = texto.indexOf("://");
  if (separador < 1) return null;

  const protocolo = `${texto.slice(0, separador).toLowerCase()}:`;
  if (!PROTOCOLOS_PERMITIDOS.has(protocolo)) return null;

  const autoridade = texto.slice(separador + 3);
  // Origem não pode conter caminho, credenciais, query ou fragmento.
  if (!autoridade || /[/@?#]/.test(autoridade)) return null;

  const { host, porta } = dividirAutoridade(autoridade);
  if (!host) return null;
  if (porta !== null && (!PORTA_VALIDA.test(porta) || Number(porta) > 65535)) return null;

  // IPv6 literal é sempre exato: não faz sentido pedir curinga dentro dele.
  if (host.startsWith("[") && host.endsWith("]")) {
    return {
      protocolo,
      host,
      porta,
      regexHost: new RegExp(`^${escaparRegex(host)}$`, "i"),
    };
  }

  const rotulos = host.split(".").map(padraoDeRotulo);
  if (rotulos.some((rotulo) => rotulo === null)) return null;

  return {
    protocolo,
    host,
    porta,
    regexHost: new RegExp(`^${rotulos.join("\\.")}$`, "i"),
  };
}

// `CORS_ORIGIN` aceita uma lista separada por vírgula. Regras malformadas
// voltam em `invalidas` para que o servidor possa avisar na inicialização.
function parsearOrigensPermitidas(bruto = process.env.CORS_ORIGIN) {
  const permitidas = [];
  const invalidas = [];
  for (const parte of String(bruto || "").split(",")) {
    const texto = parte.trim();
    if (!texto) continue;
    const regra = parsearOrigem(texto);
    if (regra) permitidas.push(regra);
    else invalidas.push(texto);
  }
  return { permitidas, invalidas };
}

function portaEfetiva(protocolo, porta) {
  return porta === null ? PORTAS_PADRAO[protocolo] : porta;
}

function regraAceita(regra, origem) {
  if (regra.protocolo !== origem.protocolo) return false;
  if (!regra.regexHost.test(origem.host)) return false;
  // Regra sem porta explícita vale para qualquer porta.
  if (regra.porta === null) return true;
  return portaEfetiva(origem.protocolo, origem.porta) === regra.porta;
}

// `hostDaRequisicao` é o cabeçalho Host, usado para o Swagger servido pela
// própria API: ali a origem é a própria API, em qualquer IP/porta da LAN.
function isMesmaHost(origem, hostDaRequisicao) {
  const host = String(hostDaRequisicao || "").trim().toLowerCase();
  if (!host) return false;
  const esperado = `${origem.host}:${portaEfetiva(origem.protocolo, origem.porta)}`;
  return host === esperado || host === origem.host.toLowerCase();
}

// Reconhece o host como um IP privado literal (IPv4 em RFC 1918, loopback e
// link-local, ou IPv6 loopback/unique-local). Confere dígito a dígito em vez de
// usar prefixo de texto, para que `192.168.evil.com` nunca seja confundido com
// um endereço da faixa 192.168.0.0/16.
function isHostPrivado(host) {
  const normalizado = String(host || "").toLowerCase().replace(/^\[|\]$/g, "");

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(normalizado);
  if (ipv4) {
    const octetos = ipv4.slice(1).map(Number);
    if (octetos.some((octeto) => octeto > 255)) return false;
    const [a, b] = octetos;
    if (a === 10) return true;                                  // 10.0.0.0/8
    if (a === 192 && b === 168) return true;                    // 192.168.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true;            // 172.16.0.0/12
    if (a === 127) return true;                                 // loopback
    if (a === 169 && b === 254) return true;                    // link-local
    return false;
  }

  if (normalizado === "::1") return true;
  // fc00::/7 (unique local) e fe80::/10 (link-local).
  if (/^f[cd][0-9a-f]{2}:/.test(normalizado)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(normalizado)) return true;
  return false;
}

function isOriginAllowed(origin, { permitidas = [], hostDaRequisicao = "", permitirRedePrivada = false } = {}) {
  // Sem cabeçalho Origin não há requisição cross-origin (curl, apps nativos,
  // health check) e nada a bloquear.
  if (origin === undefined || origin === null || origin === "") return true;
  // A string "null" vem de iframe sandboxed e file://; liberá-la permitiria
  // que qualquer página fizesse requisições autenticadas à API.
  if (typeof origin !== "string" || origin.trim().toLowerCase() === "null") return false;

  const origem = parsearOrigem(origin);
  if (!origem) return false;
  if (isMesmaHost(origem, hostDaRequisicao)) return true;
  // `permitirRedePrivada` cobre o IP que o roteador troca a cada boot sem
  // recorrer a curingas, que são ambíguos entre "faixa de IP" e "domínio".
  if (permitirRedePrivada && origem.protocolo === "http:" && isHostPrivado(origem.host)) return true;
  return permitidas.some((regra) => regraAceita(regra, origem));
}

module.exports = { isOriginAllowed, isHostPrivado, parsearOrigem, parsearOrigensPermitidas };
