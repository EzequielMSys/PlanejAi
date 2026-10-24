const unavailableCodes = new Set([
  'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_CON_COUNT_ERROR', 'ER_TOO_MANY_USER_CONNECTIONS', 'ER_USER_LIMIT_REACHED',
  'ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR'
]);
module.exports = error => unavailableCodes.has(error?.code) || unavailableCodes.has(error?.cause?.code);
