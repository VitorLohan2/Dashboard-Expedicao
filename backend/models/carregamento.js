// backend/models/carregamento.js
const mongoose = require('mongoose');

const carregamentoSchema = new mongoose.Schema({
  idPlaca: {
    type: String,
    required: true,
    match: /^[0-9]{2}$/,
  },
  placa: {
    type: String,
    required: true
  },
  modelo: {
    type: String,
    required: true
  },
  codigoBarra: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true // representa a data do carregamento, ex: '2025-04-15'
  },
  status: {
    type: String,
    enum: ['Não iniciado', 'Em andamento', 'Finalizado'],
    default: 'Não iniciado'
  },
  equipe: String,
  conferente: String,
  horaInicio: {
    type: Date,  // Armazenar como string ISO 8601
    required: false
  },
  horaFim: {
    type: Date,  // Armazenar como string ISO 8601
    required: false
  },
  tempo: String
}, {
  timestamps: true
});

carregamentoSchema.index({ idPlaca: 1, data: 1 }, { unique: true }); // placa única por data

module.exports = mongoose.model('Carregamento', carregamentoSchema);



