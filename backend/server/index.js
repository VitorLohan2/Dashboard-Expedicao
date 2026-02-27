// backend/server/index.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { testCplusConnection, getCplusStatus } from "../config/db.js";

import carregamentoRoutes from "../routes/carregamentos.js";
import informacoesGeraisRoutes from "../routes/informacoesGerais.js";
import cplusRoutes from "../routes/cplus.js";

// Corrigir __dirname no ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

let mongoConectado = false;

// MongoDB
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

// CPlus
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

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
