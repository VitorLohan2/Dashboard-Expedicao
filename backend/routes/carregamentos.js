// backend/routes/carregamentos.js
const express = require('express');
const router = express.Router();
const Carregamento = require('../models/carregamento');
const { DateTime } = require('luxon');

// Obter carregamentos (com filtro por data)
// GET placas da data
router.get('/', async (req, res) => {
  try {
    const { data } = req.query;

    // Busca todas as placas existentes no sistema (pré-cadastradas)
    const todasPlacas = await Carregamento.find();

    // Busca as placas com registros para a data selecionada
    const placasNaData = await Carregamento.find({ data });

    // Cria um dicionário rápido para saber quais foram atualizadas nessa data
    const mapaData = new Map(placasNaData.map(p => [p.idPlaca, p]));

    // Junta os dados, priorizando os dados da data selecionada
    const resultado = todasPlacas.map(placa => {
      const atualNaData = mapaData.get(placa.idPlaca);
      return atualNaData
        ? atualNaData
        : {
            _id: placa._id,
            idPlaca: placa.idPlaca,
            codigoBarra: placa.codigoBarra || '',
            status: 'Não iniciado',
            data,
            equipe: '',
            conferente: '',
            horaInicio: '',
            horaFim: '',
            tempo: ''
          };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar placas:', error);
    res.status(500).json({ erro: 'Erro ao buscar placas' });
  }
});

// Criar novo carregamento
// PUT iniciar carregamento
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


// Finalizar carregamento
// PUT finalizar carregamento
router.put('/:idPlaca/finalizar', async (req, res) => {
  const { idPlaca } = req.params;
  const { data } = req.body;

  try {
    const registro = await Carregamento.findOne({ idPlaca, data });

    if (!registro) return res.status(404).json({ erro: 'Registro não encontrado' });

    const horaFim = new Date();
    const diffSegundos = Math.floor((horaFim - new Date(registro.horaInicio)) / 1000);

    const formatarTempo = (s) => {
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      return `${h}:${m}:${sec}`;
    };

    const tempoTotal = formatarTempo(diffSegundos);

    registro.horaFim = horaFim;
    registro.status = 'Finalizado';
    registro.tempo = tempoTotal;
    await registro.save();

    res.json({ carregamento: registro });
  } catch (error) {
    console.error('Erro ao finalizar:', error);
    res.status(500).json({ erro: 'Erro ao finalizar carregamento' });
  }
});



module.exports = router;

