const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/temas', require('./routes/temas'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/coletas', require('./routes/coletas'));
app.use('/api/relatorio', require('./routes/relatorio'));

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao iniciar o banco de dados:', err);
    process.exit(1);
  });
