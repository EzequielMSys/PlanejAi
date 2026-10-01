require('dotenv').config();
const garantirTabelas = require('./garantirTabelas');

garantirTabelas().catch((error) => {
  console.error('Erro nas migrations:', error.message);
  process.exitCode = 1;
});
