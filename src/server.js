require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const cronogramaRoutes = require('./routes/cronogramaRoutes');
const atividadeRoutes = require('./routes/atividadeRoutes');
const redacaoRoutes = require('./routes/redacaoRoutes');
const conteudoRoutes = require('./routes/conteudoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const avisoRoutes = require('./routes/avisoRoutes');

const app = express();

const garantirTabelas = require('./scripts/garantirTabelas');
garantirTabelas().catch((error) => {
  console.error('[MIGRATION] Falha ao garantir tabelas:', error.message);
});

const uploadErrorHandler = require('./middlewares/uploadErrorHandler');
app.use(uploadErrorHandler);

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0) {
      return callback(new Error('CORS_ORIGIN não configurado. Defina as origens permitidas no .env.'));
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pelo CORS.'));
  }
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/cronograma', cronogramaRoutes);
app.use('/api/atividade', atividadeRoutes);
app.use('/api/redacao', redacaoRoutes);
app.use('/api/conteudos', conteudoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/avisos', avisoRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Plataforma Estudos Inteligente API',
    version: '1.0.0',
    status: 'OK'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;