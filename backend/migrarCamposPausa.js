// backend/migrarCamposPausa.js
// Script para adicionar os novos campos de pausa aos carregamentos existentes

const mongoose = require("mongoose");
const Carregamento = require("./models/carregamento");
require("dotenv").config();

const migrarCampos = async () => {
  try {
    console.log("🔄 Conectando ao MongoDB...");

    // Conectar ao banco de dados usando a mesma config do projeto
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("❌ MONGODB_URI não encontrado no arquivo .env");
    }

    await mongoose.connect(mongoUri);

    console.log("✅ Conectado ao MongoDB Atlas!");
    console.log("🔄 Iniciando migração...\n");

    // Atualizar todos os documentos que não têm os novos campos
    const resultado = await Carregamento.updateMany(
      {
        $or: [
          { isPaused: { $exists: false } },
          { tempoPausado: { $exists: false } },
          { horaPausa: { $exists: false } },
        ],
      },
      {
        $set: {
          isPaused: false,
          tempoPausado: 0,
          horaPausa: null,
        },
      },
    );

    console.log(`📊 Resultado da migração:`);
    console.log(`   - Documentos encontrados: ${resultado.matchedCount}`);
    console.log(`   - Documentos atualizados: ${resultado.modifiedCount}`);
    console.log(`\n✅ Migração concluída com sucesso!`);

    // Verificar alguns documentos para confirmar
    const amostra = await Carregamento.find({}).limit(3);
    console.log("\n📋 Amostra de documentos atualizados:");
    amostra.forEach((doc, index) => {
      console.log(`\n   ${index + 1}. Placa: ${doc.placa}`);
      console.log(`      - isPaused: ${doc.isPaused}`);
      console.log(`      - tempoPausado: ${doc.tempoPausado}`);
      console.log(`      - horaPausa: ${doc.horaPausa}`);
    });
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    process.exit(1);
  } finally {
    // Desconectar do banco
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado do MongoDB");
    process.exit(0);
  }
};

// Executar migração
console.log("═══════════════════════════════════════════════");
console.log("  MIGRAÇÃO DE CAMPOS DE PAUSA");
console.log("═══════════════════════════════════════════════\n");

migrarCampos();
