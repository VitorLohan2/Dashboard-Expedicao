// backend/routes/carregamentos.js
const express = require('express');
const router = express.Router();
const carregamentos = require('../models/carregamentos');
const { DateTime } = require('luxon');

// Obter carregamentos (com filtro por data)
router.get('/', (req, res) => {
  const { data } = req.query;   
  if (data) {
    const filtrados = carregamentos.filter(c => c.data === data);
    return res.json(filtrados);
  }
  res.json(carregamentos);
});

// Criar novo carregamento
router.post('/', (req, res) => {
  const novo = req.body;
  novo.id = novo.id || Date.now();

  // Define horaInicio no fuso de São Paulo
  const agoraSP = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  novo.horaInicio = novo.inicio || new Date(agoraSP).toISOString();
  novo.horaFim = novo.fim || null;

  delete novo.inicio;
  delete novo.fim;

  const existente = carregamentos.find(c => c.codigoBarra === novo.codigoBarra);

  if (existente) {
    existente.status = novo.status;
    existente.tempo = novo.tempo;
    existente.equipe = novo.equipe;
    existente.conferente = novo.conferente;

    const fimSP = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    existente.horaFim = new Date(fimSP).toISOString();

    console.log('⚠️ Atualizado:', existente);
    return res.status(200).json({
      mensagem: 'Carregamento atualizado com sucesso',
      carregamento: existente
    });
  }

  carregamentos.push(novo);
  console.log('🚀 Novo criado:', novo);
  res.status(201).json({
    mensagem: 'Novo carregamento criado com sucesso',
    carregamento: novo
  });
});

// Finalizar carregamento
router.put('/:id/finalizar', (req, res) => {
  const id = req.params.id;
  const carregamento = carregamentos.find(c => String(c.id) === String(id));

  if (carregamento) {
    const fimSP = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    const fim = new Date(fimSP);
    carregamento.horaFim = fim.toISOString();
    carregamento.status = "Finalizado";

    const inicio = new Date(carregamento.horaInicio);
    const diffMs = fim - inicio;
    const horas = Math.floor(diffMs / 3600000);
    const minutos = Math.floor((diffMs % 3600000) / 60000);
    const segundos = Math.floor((diffMs % 60000) / 1000);

    carregamento.tempo = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    console.log('✅ Finalizado no backend:', carregamento);
    res.json({
      message: 'Carregamento finalizado',
      carregamento
    });
  } else {
    res.status(404).json({ error: 'Carregamento não encontrado' });
  }
});

module.exports = router;
