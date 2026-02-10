// backend/server/index.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { testCplusConnection, getCplusStatus } = require("../config/db");

// Routes
const carregamentoRoutes = require("../routes/carregamentos");
const informacoesGeraisRoutes = require("../routes/informacoesGerais");
const cplusRoutes = require("../routes/cplus");

const app = express();
const PORT = process.env.PORT || 3001;

// Status das conexões
let mongoConectado = false;

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado ao MongoDB Atlas");
    mongoConectado = true;
  })
  .catch((err) => {
    console.error("❌ Erro na conexão com MongoDB:", err);
    mongoConectado = false;
  });

// Testar conexão CPlus na inicialização
testCplusConnection().then((conectado) => {
  if (conectado) {
    console.log("✅ Conectado ao CPlus (PostgreSQL)");
  } else {
    console.warn("⚠️ CPlus não conectado (sistema continua funcionando)");
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/carregamentos", carregamentoRoutes);
app.use("/informacoes-gerais", informacoesGeraisRoutes);
app.use("/cplus", cplusRoutes);

// Health check simples
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Status completo das conexões (para o frontend)
app.get("/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    conexoes: {
      mongodb: mongoConectado,
      cplus: getCplusStatus(),
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
