// backend/controllers/cplusController.js
import { queryCP, queryOneCP, testCplusConnection } from "../config/db.js";

/**
 * GET /cplus/status
 * Retorna status da conexão CPlus
 */
export const getStatus = async (req, res) => {
  const conectado = await testCplusConnection();
  res.json({
    conectado,
    timestamp: new Date().toISOString(),
  });
};

/**
 * GET /cplus/teste
 * Retorna informações básicas do banco
 */
export const getTeste = async (req, res) => {
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
};

/**
 * GET /cplus/tabelas
 * Lista todas as tabelas disponíveis
 */
export const getTabelas = async (req, res) => {
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
};

/**
 * POST /cplus/consulta
 * Executa uma consulta personalizada no CPlus
 * Body: { query: "SELECT * FROM dbo.empresa LIMIT 10" }
 */
export const postConsulta = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query não fornecida" });
    }

    const forbiddenCommands = ["DELETE", "DROP", "UPDATE", "INSERT"];
    if (forbiddenCommands.some((cmd) => query.toUpperCase().includes(cmd))) {
      return res.status(403).json({
        error: "Comandos de escrita não são permitidos",
      });
    }

    const resultado = await queryCP(query);
    res.json({
      linhas: resultado.length,
      dados: resultado.slice(0, 100),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
