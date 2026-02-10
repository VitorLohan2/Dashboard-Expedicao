// config/db.js
const { Pool } = require("pg");

// Conexão com CPlus (PostgreSQL) - dotenv já carregado no index.js
let cplusPool = null;
let cplusConectado = false;

// Inicializar pool apenas se a URL estiver configurada
const initCplusPool = () => {
  if (process.env.DATABASE_URL_CPLUS && !cplusPool) {
    cplusPool = new Pool({
      connectionString: process.env.DATABASE_URL_CPLUS,
      connectionTimeoutMillis: 10000, // 10 segundos timeout
      idleTimeoutMillis: 30000,
    });

    cplusPool.on("error", (err) => {
      console.error("❌ Erro na conexão com CPlus:", err.message);
      cplusConectado = false;
    });

    cplusPool.on("connect", () => {
      cplusConectado = true;
    });
  }
  return cplusPool;
};

/**
 * Executar consulta no banco CPlus (com proteção contra falhas)
 * @param {string} query - SQL query
 * @param {array} params - Parâmetros para prepared statement
 * @returns {Promise} Resultado da query ou array vazio em caso de erro
 */
const queryCP = async (query, params = []) => {
  try {
    const pool = initCplusPool();
    if (!pool) {
      console.warn("⚠️ CPlus não configurado");
      return [];
    }
    const result = await pool.query(query, params);
    cplusConectado = true;
    return result.rows;
  } catch (error) {
    console.error("❌ Erro CPlus:", error.message);
    cplusConectado = false;
    return []; // Retorna array vazio em vez de throw - não quebra o sistema
  }
};

/**
 * Obter uma única linha do CPlus
 */
const queryOneCP = async (query, params = []) => {
  const results = await queryCP(query, params);
  return results.length > 0 ? results[0] : null;
};

/**
 * Verificar status da conexão CPlus
 */
const getCplusStatus = () => cplusConectado;

/**
 * Testar conexão CPlus
 */
const testCplusConnection = async () => {
  try {
    const pool = initCplusPool();
    if (!pool) return false;
    await pool.query("SELECT 1");
    cplusConectado = true;
    return true;
  } catch (error) {
    cplusConectado = false;
    return false;
  }
};

module.exports = {
  queryCP,
  queryOneCP,
  getCplusStatus,
  testCplusConnection,
};
