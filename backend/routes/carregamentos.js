const express = require('express');
const router = express.Router();
const carregamentos = require('../models/carregamentos');

// Obter carregamentos (com filtro por data)
router.get('/', (req, res) => {
  const { data } = req.query;
  
  if (data) {
    // Valida o formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    const resultados = carregamentos.filter(item => {
      if (!item.horaInicio) return false;
      
      // Converte ambas as datas para o formato YYYY-MM-DD para comparação
      const itemDate = new Date(item.horaInicio);
      const filterDate = new Date(data);
      
      return (
        itemDate.getFullYear() === filterDate.getFullYear() &&
        itemDate.getMonth() === filterDate.getMonth() &&
        itemDate.getDate() === filterDate.getDate()
      );
    });

    return res.json(resultados);
  }
  
  res.json(carregamentos);
});

// Criar novo carregamento
router.post('/', (req, res) => {
  const novo = req.body;
  novo.id = novo.id || Date.now();
  
  // Padronização dos campos de data
  novo.horaInicio = novo.inicio || new Date().toISOString();
  novo.horaFim = novo.fim || null;
  
  // Remove campos antigos se existirem
  delete novo.inicio;
  delete novo.fim;

  const existente = carregamentos.find(c => c.codigoBarra === novo.codigoBarra);

  if (existente) {
    existente.status = novo.status;
    existente.tempo = novo.tempo;
    existente.equipe = novo.equipe;
    existente.conferente = novo.conferente;
    existente.horaFim = new Date().toISOString();

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
    const fim = new Date();
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
