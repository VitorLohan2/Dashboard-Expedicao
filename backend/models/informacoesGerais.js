// backend/models/informacoesGerais.js
import mongoose from "mongoose";

const InformacoesGeraisSchema = new mongoose.Schema(
  {
    data: { type: String, required: true, unique: true }, // Ex: "2025-05-06"
    totalPedidos: { type: Number },
    confZonas: { type: String },
    zonaum: { type: String },
    carregmanha: { type: String },
  },
  { timestamps: true },
);

const InformacoesGerais = mongoose.model(
  "InformacoesGerais",
  InformacoesGeraisSchema,
);

export default InformacoesGerais;
