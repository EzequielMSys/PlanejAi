function getDatabaseOptions(extra = {}) {
  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      ...extra
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tcc',
    ...extra
  };
}

module.exports = getDatabaseOptions;
