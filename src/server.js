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

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir imagens/uploads corretamente
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/cronograma', cronogramaRoutes);
app.use('/api/atividade', atividadeRoutes);
app.use('/api/redacao', redacaoRoutes);

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

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;