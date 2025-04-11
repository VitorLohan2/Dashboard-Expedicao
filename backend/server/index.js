/// backend/server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Simulando um banco de dados em memória
let carregamentos = [];

// Rota para salvar carregamento
app.post('/api/carregamento', (req, res) => {
  const dados = req.body;
  carregamentos.push(dados);
  console.log('Dados recebidos:', dados);
  res.status(200).json({ message: 'Carregamento salvo com sucesso!' });
});

// Rota para obter todos os carregamentos
app.get('/api/carregamento', (req, res) => {
  res.status(200).json(carregamentos);
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
