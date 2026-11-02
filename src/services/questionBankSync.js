// Synchronize reference content once per process. Reading a practice must not
// rewrite the entire bank (hundreds of remote round trips on every request).
function createQuestionBankSync(db, bank) {
  let pending;
  return function sync() {
    if (!pending) pending = reconcile().catch(error => { pending = null; throw error; });
    return pending;
  };

  async function reconcile() {
    const [rows] = await db.query('SELECT id_questao, disciplina, competencia, enunciado, alternativas, resposta_correta, explicacao, dificuldade FROM questoes_estudo');
    const existing = new Map(rows.map(row => [row.enunciado, row]));
    let changed = 0;
    for (const question of bank) {
      const row = existing.get(question.enunciado);
      const values = [question.disciplina, question.competencia || null, JSON.stringify(question.alternativas), question.resposta, question.explicacao, question.dificuldade || 'MEDIA'];
      if (row) {
        let alternatives = row.alternativas;
        if (typeof alternatives === 'string') { try { alternatives = JSON.parse(alternatives); } catch { alternatives = null; } }
        if (row.disciplina === values[0] && (row.competencia || null) === values[1] && JSON.stringify(alternatives) === values[2] && Number(row.resposta_correta) === values[3] && row.explicacao === values[4] && row.dificuldade === values[5]) continue;
        await db.execute('UPDATE questoes_estudo SET disciplina=?, competencia=?, alternativas=?, resposta_correta=?, explicacao=?, dificuldade=? WHERE id_questao=?', [...values, row.id_questao]);
      } else {
        await db.execute('INSERT INTO questoes_estudo (disciplina, competencia, alternativas, resposta_correta, explicacao, dificuldade, origem, ativo, enunciado) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)', [...values, question.origem || 'PlanejAI', question.enunciado]);
      }
      changed++;
    }
    return changed;
  }
}

module.exports = { createQuestionBankSync };
