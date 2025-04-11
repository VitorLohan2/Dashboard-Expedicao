const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const carregamentoRoutes = require('../routes/carregamentos');

const app = express();
const port = 3001; // Alterado de 5000 para 3001

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas
app.use('/carregamentos', carregamentoRoutes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});

