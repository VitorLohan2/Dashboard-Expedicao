// backend/routes/cplus.js
import { Router } from "express";
import {
  getStatus,
  getTeste,
  getTabelas,
  postConsulta,
} from "../controllers/cplusController.js";

const router = Router();

router.get("/status", getStatus);
router.get("/teste", getTeste);
router.get("/tabelas", getTabelas);
router.post("/consulta", postConsulta);

export default router;
