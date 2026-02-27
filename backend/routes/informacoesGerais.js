// backend/routes/informacoesGerais.js
import { Router } from "express";
import {
  getInformacoesGerais,
  updateInformacoesGerais,
} from "../controllers/informacoesGeraisController.js";

const router = Router();

router.get("/:data", getInformacoesGerais);
router.put("/:data", updateInformacoesGerais);

export default router;
