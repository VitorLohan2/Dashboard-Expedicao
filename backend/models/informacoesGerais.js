// backend/models/informacoesGerais.js
const mongoose = require('mongoose');

const InformacoesGeraisSchema = new mongoose.Schema({
  data: { type: String, required: true, unique: true }, // Ex: "2025-05-06"
  totalPedidos: { type: Number },
  confZonas: { type: String },
  zonaum: { type: String },
  carregmanha: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InformacoesGerais', InformacoesGeraisSchema);
