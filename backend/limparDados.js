// limparDados.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Carregamento = require('./models/Carregamento');

dotenv.config();

async function limparDados() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Escolha UM dos filtros abaixo:
    
    // 1. Limpar por datas específicas
    await Carregamento.deleteMany({ 
      data: { $in: ['2025-04-25', '2025-04-28', '2025-04-29', '2025-04-30', '2025-05-02'] } 
    });
    
    // 2. Limpar por status
    // await Carregamento.deleteMany({ status: "Finalizado" });
    
    // 3. Limpar por modelo de veículo
    // await Carregamento.deleteMany({ modelo: "1016" });
    
    // 4. Limpar registros antigos (antes de uma data)
    // await Carregamento.deleteMany({ 
    //   data: { $lt: "2025-05-01" } 
    // });
    
    console.log('✅ Documentos deletados com sucesso');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao limpar dados:', err);
    process.exit(1);
  }
}

limparDados();