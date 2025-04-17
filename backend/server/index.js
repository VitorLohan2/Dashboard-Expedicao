// backend/server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const carregamentoRoutes = require('../routes/carregamentos');

const app = express();
const port = 3001; // Alterado de 5000 para 3001

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado ao MongoDB Atlas'))
.catch((err) => console.error('❌ Erro na conexão com MongoDB:', err));


// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas
app.use('/carregamentos', carregamentoRoutes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});

