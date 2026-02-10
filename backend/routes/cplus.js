// routes/cplus.js - Rotas para consultar CPlus
const express = require("express");
const router = express.Router();
const {
  queryCP,
  queryOneCP,
  getCplusStatus,
  testCplusConnection,
} = require("../config/db");

/**
 * GET /cplus/status
 * Retorna status da conexão CPlus
 */
router.get("/status", async (req, res) => {
  const conectado = await testCplusConnection();
  res.json({
    conectado,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /cplus/teste
 * Retorna informações básicas do banco
 */
router.get("/teste", async (req, res) => {
  try {
    const result = await queryOneCP("SELECT NOW() as hora_servidor");
    if (!result) {
      return res.status(503).json({
        status: "❌ CPlus desconectado",
        conectado: false,
      });
    }
    res.json({
      status: "✅ Conectado ao CPlus",
      conectado: true,
      servidor: result,
    });
  } catch (error) {
    res.status(503).json({
      status: "❌ Erro ao conectar ao CPlus",
      conectado: false,
      detalhes: error.message,
    });
  }
});

/**
 * Exemplo: GET /cplus/tabelas
 * Lista todas as tabelas disponíveis
 */
router.get("/tabelas", async (req, res) => {
  try {
    const tabelas = await queryCP(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'dbo' 
       ORDER BY table_name`,
    );
    res.json({
      total: tabelas.length,
      tabelas: tabelas.map((t) => t.table_name),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Exemplo: POST /cplus/consulta
 * Executa uma consulta personalizada no CPlus
 * Body: { query: "SELECT * FROM dbo.empresa LIMIT 10" }
 */
router.post("/consulta", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query não fornecida" });
    }

    // Segurança: evitar comandos perigosos
    const forbiddenCommands = ["DELETE", "DROP", "UPDATE", "INSERT"];
    if (forbiddenCommands.some((cmd) => query.toUpperCase().includes(cmd))) {
      return res.status(403).json({
        error: "Comandos de escrita não são permitidos",
      });
    }

    const resultado = await queryCP(query);
    res.json({
      linhas: resultado.length,
      dados: resultado.slice(0, 100), // Limitar a 100 registros por segurança
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
