// backend/routes/informacoesGerais.js
const express = require("express");
const router = express.Router();
const InformacoesGerais = require("../models/informacoesGerais");

/**
 * PUT /informacoes-gerais/:data
 * Registra ou atualiza informações gerais por data
 */
router.put("/:data", async (req, res) => {
  const { data } = req.params;
  const novosDados = req.body;

  try {
    const existentes = await InformacoesGerais.findOne({ data });

    const dadosAtualizados = {
      totalPedidos: novosDados.totalPedidos ?? existentes?.totalPedidos ?? "",
      confZonas: novosDados.confZonas ?? existentes?.confZonas ?? "",
      zonaum: novosDados.zonaum ?? existentes?.zonaum ?? "",
      carregmanha: novosDados.carregmanha ?? existentes?.carregmanha ?? "",
      data,
    };

    const atualizado = await InformacoesGerais.findOneAndUpdate(
      { data },
      dadosAtualizados,
      { upsert: true, new: true },
    );

    res.json(atualizado);
  } catch (error) {
    console.error("Erro ao salvar informações gerais:", error);
    res.status(500).json({ erro: "Erro ao salvar informações" });
  }
});

/**
 * GET /informacoes-gerais/:data
 * Obtém informações gerais por data
 */
router.get("/:data", async (req, res) => {
  const { data } = req.params;

  try {
    const info = await InformacoesGerais.findOne({ data });

    if (!info) {
      return res
        .status(404)
        .json({ erro: "Informações não encontradas para a data" });
    }

    res.json(info);
  } catch (error) {
    console.error("Erro ao buscar informações gerais:", error);
    res.status(500).json({ erro: "Erro ao buscar informações" });
  }
});

module.exports = router;
