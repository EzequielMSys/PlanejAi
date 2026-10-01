const pool = require('../config/db');
const { getDirectResource, isSearchUrl } = require('../utils/contentLinkPolicy');

async function repairContentLinks() {
  const [rows] = await pool.query('SELECT id_conteudo, titulo, tipo, link FROM conteudos');
  let updated = 0;

  for (const row of rows) {
    if (!isSearchUrl(row.link)) continue;
    const resource = getDirectResource(row.titulo);
    if (!resource) continue;
    await pool.execute(
      'UPDATE conteudos SET tipo = ?, link = ? WHERE id_conteudo = ?',
      [resource.tipo, resource.link, row.id_conteudo]
    );
    updated += 1;
  }

  if (updated > 0) console.log(`[CONTEUDOS] ${updated} links de pesquisa substituídos por materiais diretos.`);
  return updated;
}

module.exports = repairContentLinks;

if (require.main === module) {
  repairContentLinks()
    .then((updated) => {
      console.log(`[CONTEUDOS] Revisão concluída: ${updated} registro(s) atualizado(s).`);
      return pool.end();
    })
    .catch((error) => {
      console.error('[CONTEUDOS] Falha ao revisar links:', error.message);
      process.exitCode = 1;
    });
}
