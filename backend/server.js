const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Importar rotas (ajuste o caminho conforme sua estrutura)
const carregamentosRouter = require('./routes/carregamentos');
app.use('/carregamentos', carregamentosRouter);

// Iniciar servidor na porta 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
