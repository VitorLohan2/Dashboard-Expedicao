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

    const registrosFormatados = registrosData.map(reg => ({
      ...reg._doc,
      horaInicio: reg.horaInicio ? DateTime.fromJSDate(reg.horaInicio).toISO() : null,
      horaFim: reg.horaFim ? DateTime.fromJSDate(reg.horaFim).toISO() : null,
      tempo: reg.tempo || null
    }));

    res.json(registrosFormatados);
  } catch (error) {
    console.error('Erro ao buscar placas:', error);
    res.status(500).json({ erro: 'Erro ao buscar placas' });
  }
});

// Rota para iniciar carregamento
router.put('/:idPlaca/iniciar', async (req, res) => {
  const { idPlaca } = req.params;
  const { data, equipe, conferente } = req.body;

  try {
    const registro = await Carregamento.findOne({ idPlaca, data });

    if (!registro) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    if (registro.horaInicio) {
      return res.status(400).json({ erro: 'Carregamento já foi iniciado.' });
    }

    const horaInicio = DateTime.local(); // Usando Luxon para pegar a hora atual
    console.log('Hora de Início:', horaInicio.toISO()); // Exibe a hora no formato ISO 8601

    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        horaInicio: horaInicio.toISO(), // Salvando como string ISO
        equipe, 
        conferente, 
        status: 'Em andamento', 
        updatedAt: horaInicio.toJSDate() // Convertendo para JS Date
      },
      { new: true }
    );

    res.json({ carregamento: atualizado });

  } catch (error) {
    console.error('Erro ao iniciar carregamento:', error);
    res.status(500).json({ erro: 'Erro no servidor ao iniciar carregamento' });
  }
});

// Finalizar carregamento (VERSÃO CORRIGIDA COM LUXON)
router.put('/:idPlaca/finalizar', async (req, res) => {
  const { idPlaca } = req.params;
  const { data } = req.body;

  try {
    const registro = await Carregamento.findOne({ idPlaca, data });

    if (!registro) {
      return res.status(404).json({ erro: 'Registro não encontrado' });
    }

    if (registro.status === 'Finalizado') {
      return res.status(400).json({ erro: 'Carregamento já finalizado' });
    }

    // Garantir que horaInicio é um objeto Date válido
    const horaInicio = DateTime.fromJSDate(registro.horaInicio);
    if (!horaInicio.isValid) {
      return res.status(400).json({ erro: 'Hora de início inválida ou ausente' });
    }

    const horaFim = DateTime.local(); // Hora do fim será a hora atual
    if (!horaFim.isValid) {
      return res.status(400).json({ erro: 'Hora de fim inválida' });
    }

    // Calcular o tempo total (em milissegundos)
    const tempoTotalMs = horaFim.diff(horaInicio, 'milliseconds').milliseconds;

    // Verificar se a diferença de tempo é válida
    if (tempoTotalMs <= 0) {
      return res.status(400).json({ erro: 'Hora de fim é anterior à hora de início' });
    }

    // Calcular o tempo total (em horas, minutos e segundos)
    const horas = Math.floor(tempoTotalMs / 3600000); // horas
    const minutos = Math.floor((tempoTotalMs % 3600000) / 60000); // minutos
    const segundos = Math.floor((tempoTotalMs % 60000) / 1000); // segundos

    const tempoTotal = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    console.log('Tempo Total (HH:mm:ss):', tempoTotal);

    // Atualizando o registro no banco de dados com o tempo calculado
    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        horaFim: horaFim.toISO(), // Hora de fim em formato ISO
        tempo: tempoTotal,
        status: 'Finalizado',
        updatedAt: horaFim.toJSDate() // Convertendo para JS Date
      },
      { new: true }
    );

    res.json({ carregamento: atualizado });

  } catch (error) {
    console.error('Erro ao finalizar carregamento:', error);
    res.status(500).json({ erro: 'Erro no servidor ao finalizar carregamento' });
  }
});


module.exports = router;

