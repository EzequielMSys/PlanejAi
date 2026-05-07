require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const cronogramaRoutes = require('./routes/cronogramaRoutes');
const atividadeRoutes = require('./routes/atividadeRoutes');
const redacaoRoutes = require('./routes/redacaoRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/cronograma', cronogramaRoutes);
app.use('/api/atividade', atividadeRoutes);
app.use('/api/redacao', redacaoRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Plataforma Estudos Inteligente API', 
    version: '1.0.0',
    status: 'OK'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 🔥 COMPATÍVEL COM RENDER E LOCAL
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

// Exporta para Vercel
module.exports = app;