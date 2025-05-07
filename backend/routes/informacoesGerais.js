// backend/routes/informacoesGerais.js
const express = require('express');
const router = express.Router();
const InformacoesGerais = require('../models/informacoesGerais');

// Registrar ou atualizar informações gerais por data
router.put('/:data', async (req, res) => {
  const { data } = req.params;
  const novosDados = req.body;

  try {
    // Buscar dados existentes
    const existentes = await InformacoesGerais.findOne({ data });

    // Mesclar dados existentes com novos
    const dadosAtualizados = {
      totalPedidos: novosDados.totalPedidos ?? existentes?.totalPedidos ?? "",
      confZonas: novosDados.confZonas ?? existentes?.confZonas ?? "",
      zonaum: novosDados.zonaum ?? existentes?.zonaum ?? "",
      carregmanha: novosDados.carregmanha ?? existentes?.carregmanha ?? "",
      data
    };

    // Atualizar ou criar
    const atualizado = await InformacoesGerais.findOneAndUpdate(
      { data },
      dadosAtualizados,
      { upsert: true, new: true }
    );

    res.json(atualizado);
  } catch (error) {
    console.error('Erro ao salvar informações gerais:', error);
    res.status(500).json({ erro: 'Erro ao salvar informações' });
  }
});


// Obter informações gerais por data
router.get('/:data', async (req, res) => {
  const { data } = req.params;

  try {
    const info = await InformacoesGerais.findOne({ data });

    if (!info) {
      return res.status(404).json({ erro: 'Informações não encontradas para a data' });
    }

    res.json(info);
  } catch (error) {
    console.error('Erro ao buscar informações gerais:', error);
    res.status(500).json({ erro: 'Erro ao buscar informações' });
  }
});

module.exports = router;
