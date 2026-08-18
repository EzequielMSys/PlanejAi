function decode(value) {
  return decodeURIComponent(value || '');
}

function readCaCertificate() {
  if (process.env.DB_SSL_CA_BASE64) {
    return Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8');
  }

  if (process.env.DB_SSL_CA) {
    return process.env.DB_SSL_CA.replace(/\\n/g, '\n');
  }

  return undefined;
}

function getSslOptions(mode) {
  const normalizedMode = String(mode || '').trim().toLowerCase();
  const ca = readCaCertificate();

  if (['disabled', 'disable', 'false', '0'].includes(normalizedMode)) {
    return undefined;
  }

  if (!normalizedMode && !ca) {
    return undefined;
  }

  // `required` garante criptografia, como a URI padrão do Aiven. Os modos
  // verify-ca/verify-full também validam o certificado quando a CA é enviada.
  return {
    rejectUnauthorized: ca
      ? true
      : ['verify-ca', 'verify-full'].includes(normalizedMode),
    ...(ca ? { ca } : {})
  };
}

function fromDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const sslMode =
    parsed.searchParams.get('ssl-mode') ||
    parsed.searchParams.get('sslmode') ||
    process.env.DB_SSL_MODE;

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decode(parsed.username),
    password: decode(parsed.password),
    database: decode(parsed.pathname.replace(/^\//, '')) || 'defaultdb',
    ...(getSslOptions(sslMode) ? { ssl: getSslOptions(sslMode) } : {})
  };
}

function getDatabaseOptions(extra = {}) {
  if (process.env.DATABASE_URL) {
    return {
      ...fromDatabaseUrl(process.env.DATABASE_URL),
      ...extra
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tcc',
    ...(getSslOptions(process.env.DB_SSL_MODE) ? { ssl: getSslOptions(process.env.DB_SSL_MODE) } : {}),
    ...extra
  };
}

module.exports = getDatabaseOptions;
