// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Carregamento = require('./models/Carregamento');

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

// 1. CONFIGURAÇÃO PRINCIPAL (EDITÁVEL)
const config = {
  placas: [
    { idPlaca: '01', placa: 'SSQ9V1G', modelo: '001', codigoBarra: 'SSQ9V1G-01' },
    { idPlaca: '02', placa: 'WSM15PH', modelo: '002', codigoBarra: 'WSM15PH-02' },
    { idPlaca: '03', placa: 'QQSQ78S0', modelo: '003', codigoBarra: 'QQSQ78S0-03' }
  ],
  datas: ['2025-04-21', '2025-04-22'], // Adicione quantas datas precisar
  statusPadrao: 'Não iniciado'
};

// 2. FUNÇÃO PARA GERAR REGISTROS
async function gerarRegistros() {
  const registros = [];
  
  for (const data of config.datas) {
    for (const placa of config.placas) {
      registros.push({
        ...placa,
        data,
        status: config.statusPadrao,
        equipe: '',
        conferente: '',
        horaInicio: null,
        horaFim: null,
        tempo: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  
  return registros;
}

// 3. EXECUÇÃO DO SEED
async function seedDatabase() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado ao MongoDB');

    // Opção 1: Limpar tudo antes de inserir
    //await Carregamento.deleteMany({});
    //console.log('🗑️  Todos os registros anteriores removidos');

    // Opção 2: Limpar apenas registros das datas específicas
    // await Carregamento.deleteMany({ data: { $in: config.datas } });
    // console.log(`🗑️  Registros das datas ${config.datas.join(', ')} removidos`);

    const registros = await gerarRegistros();
    await Carregamento.insertMany(registros);
    
    console.log(`📝 ${registros.length} registros inseridos para ${config.datas.length} datas`);
    console.log('🚀 Seed concluído com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  }
}

seedDatabase();