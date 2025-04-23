// backend/routes/carregamentos.js
const express = require('express');
const router = express.Router();
const Carregamento = require('../models/carregamento');
const { DateTime } = require('luxon');

// Obter carregamentos (com filtro por data)
router.get('/', async (req, res) => {
  try {
    const { data } = req.query;
    const registrosData = await Carregamento.find({ data });
    
    if (registrosData.length === 0) {
      return res.json([]);
    }

    res.json(registrosData);
  } catch (error) {
    console.error('Erro ao buscar placas:', error);
    res.status(500).json({ erro: 'Erro ao buscar placas' });
  }
});

// Iniciar carregamento
router.put('/:idPlaca/iniciar', async (req, res) => {
  const { idPlaca } = req.params;
  const { equipe, conferente, data } = req.body;

  try {
    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        $set: {
          status: 'Em andamento',
          equipe,
          conferente,
          horaInicio: new Date(),
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    res.json({ carregamento: atualizado });
  } catch (error) {
    console.error('Erro ao iniciar:', error);
    res.status(500).json({ erro: 'Erro ao iniciar carregamento' });
  }
});

// Finalizar carregamento (VERSÃO CORRIGIDA)
router.put('/:idPlaca/finalizar', async (req, res) => {
  const { idPlaca } = req.params;
  const { data } = req.body;

  try {
    const registro = await Carregamento.findOne({ idPlaca, data });
    if (!registro) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    const horaFim = new Date();
    // CÁLCULO CORRIGIDO - Parênteses balanceados:
    const diffSegundos = Math.floor((horaFim - new Date(registro.horaInicio))) / 1000;

    const formatarTempo = (segundos) => {
      const horas = String(Math.floor(segundos / 3600)).padStart(2, '0');
      const minutos = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
      const segundosRestantes = String(segundos % 60).padStart(2, '0');
      return `${horas}:${minutos}:${segundosRestantes}`;
    };

    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        horaFim,
        status: 'Finalizado',
        tempo: formatarTempo(diffSegundos),
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ carregamento: atualizado });
  } catch (error) {
    console.error('Erro ao finalizar:', error);
    res.status(500).json({ erro: 'Erro ao finalizar carregamento' });
  }
});

module.exports = router;