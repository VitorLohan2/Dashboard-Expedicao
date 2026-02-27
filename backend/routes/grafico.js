import { Router } from "express";

const router = Router();

router.get("/grafico", getGraficoDados);

router.get("/grafico/ultimo-carregamento", getUltimoCarregamento);
