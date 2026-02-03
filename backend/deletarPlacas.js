// Script para deletar placas criadas a partir de uma data específica
require("dotenv").config();
const mongoose = require("mongoose");
const Carregamento = require("./models/carregamento");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://vitorlohan:M4WgNOz5CWDWGCQ2@clustercarregamento.to7zl3e.mongodb.net/carregamentos_db?retryWrites=true&w=majority";

async function deletarPlacas() {
  try {
    console.log("Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado!\n");

    // Data a partir da qual deletar (03/02/2026)
    const dataInicio = "2026-02-03";

    // Buscar placas que serão deletadas
    const placasParaDeletar = await Carregamento.find({
      data: { $gte: dataInicio },
    }).sort({ data: 1, idPlaca: 1 });

    console.log(`Encontradas ${placasParaDeletar.length} placas para deletar:\n`);

    if (placasParaDeletar.length === 0) {
      console.log("Nenhuma placa encontrada para deletar.");
      await mongoose.disconnect();
      return;
    }

    // Listar as placas que serão deletadas
    placasParaDeletar.forEach((p) => {
      console.log(`  - Data: ${p.data} | Placa: ${p.placa} | ID: ${p.idPlaca} | Status: ${p.status}`);
    });

    console.log("\n⚠️  ATENÇÃO: Esta operação é irreversível!");
    console.log("Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...\n");

    // Aguarda 5 segundos antes de deletar
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Deletar as placas
    const resultado = await Carregamento.deleteMany({
      data: { $gte: dataInicio },
    });

    console.log(`✅ ${resultado.deletedCount} placas deletadas com sucesso!`);

    await mongoose.disconnect();
    console.log("\nDesconectado do MongoDB.");
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

deletarPlacas();
