// backend/routes/carregamentos.js
import { Router } from "express";
import {
  getCarregamentos,
  getFinalizados,
  getFinalizadosMes,
  getDatas,
  createCarregamento,
  iniciarCarregamento,
  finalizarCarregamento,
  pausarCarregamento,
  getGraficoDados,
  getUltimoCarregamento,
} from "../controllers/carregamentosController.js";

const router = Router();

/**
 * Obtém carregamentos filtrados por data
 */
router.get("/", getCarregamentos);

/**
 * Obtém carregamentos finalizados filtrados por data
 * Inclui dados do CPlus (datainiciocarregamento e datafinalizacaocarregamento)
 */
router.get("/finalizados", getFinalizados);

router.get("/finalizados/mes", getFinalizadosMes); // ?mes=YYYY-MM

/**
 * Obtém lista de datas que possuem carregamentos
 */
router.get("/datas", getDatas);

/**
 * Cria um novo carregamento
 */
router.post("/", createCarregamento);

/**
 * Inicia um carregamento
 */
router.put("/:idPlaca/iniciar", iniciarCarregamento);

/**
 * Finaliza um carregamento
 */
router.put("/:idPlaca/finalizar", finalizarCarregamento);

/**
 * Pausa ou retoma um carregamento
 */
router.put("/:idPlaca/pausar", pausarCarregamento);

router.get("/grafico", getGraficoDados);

router.get("/grafico/ultimo-carregamento", getUltimoCarregamento);

export default router;
