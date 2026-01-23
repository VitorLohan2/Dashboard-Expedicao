// backend/server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Routes
const carregamentoRoutes = require("../routes/carregamentos");
const informacoesGeraisRoutes = require("../routes/informacoesGerais");

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectado ao MongoDB Atlas"))
  .catch((err) => console.error("❌ Erro na conexão com MongoDB:", err));

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/carregamentos", carregamentoRoutes);
app.use("/informacoes-gerais", informacoesGeraisRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
