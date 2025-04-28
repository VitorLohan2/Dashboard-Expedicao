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
    
    // Formatar datas para o frontend
    const registrosFormatados = registrosData.map(reg => ({
      ...reg._doc,
      horaInicio: reg.horaInicio ? DateTime.fromISO(reg.horaInicio).toISO() : null,
      horaFim: reg.horaFim ? DateTime.fromISO(reg.horaFim).toISO() : null
    }));

    res.json(registrosFormatados.length === 0 ? [] : registrosFormatados);
  } catch (error) {
    console.error('Erro ao buscar placas:', error);
    res.status(500).json({ erro: 'Erro ao buscar placas' });
  }
});

// Modifique a rota de iniciar carregamento
router.put('/:idPlaca/iniciar', async (req, res) => {
  const { idPlaca } = req.params;
  const { equipe, conferente, data } = req.body;

  try {
    const horaInicio = DateTime.now().setZone('America/Sao_Paulo').toISO(); // Ajuste o timezone conforme necessário

    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        $set: {
          status: 'Em andamento',
          equipe,
          conferente,
          horaInicio, // Agora usando ISO string com timezone
          updatedAt: DateTime.now().toISO()
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

    const horaFim = DateTime.now().setZone('America/Sao_Paulo');
    const horaInicio = DateTime.fromISO(registro.horaInicio);
    
    // Cálculo mais robusto com Luxon
    const diffSegundos = horaFim.diff(horaInicio, 'seconds').seconds;

    const formatarTempo = (segundos) => {
      const horas = String(Math.floor(segundos / 3600)).padStart(2, '0');
      const minutos = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
      const segundosRestantes = String(Math.floor(segundos % 60)).padStart(2, '0');
      return `${horas}:${minutos}:${segundosRestantes}`;
    };

    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        horaFim: horaFim.toISO(),
        status: 'Finalizado',
        tempo: formatarTempo(diffSegundos),
        updatedAt: horaFim.toISO()
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