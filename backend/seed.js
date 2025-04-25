// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Carregamento = require('./models/Carregamento');

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

// 1. CONFIGURAÇÃO PRINCIPAL (EDITÁVEL)
const config = {
  placas: [
    { idPlaca: '01', placa: 'LQE 8437', modelo: '1318', codigoBarra: 'LQE 8437' },
    { idPlaca: '02', placa: 'RJU 2F64', modelo: '1016', codigoBarra: 'RJU 2F64' },
    { idPlaca: '03', placa: 'LSE 9F95', modelo: '1016', codigoBarra: 'LSE 9F95' },
    { idPlaca: '04', placa: 'KRF 6E12', modelo: '1016', codigoBarra: 'KRF 6E12' },
    { idPlaca: '05', placa: 'KPT 1J99', modelo: '1016', codigoBarra: 'KPT 1J99' },
    { idPlaca: '06', placa: 'KRA 5i69', modelo: '1016', codigoBarra: 'KRA 5i69' },
    { idPlaca: '07', placa: 'KYH 9D76', modelo: '1016', codigoBarra: 'KYH 9D76' },
    { idPlaca: '08', placa: 'LQM 7F74', modelo: '1016', codigoBarra: 'LQM 7F74' },
    { idPlaca: '09', placa: 'LUN 4G76', modelo: '1016', codigoBarra: 'LUN 4G76' },
    { idPlaca: '10', placa: 'LTM 9D02', modelo: '1016', codigoBarra: 'LTM 9D02' }
  ],
  datas: ['2025-04-24', '2025-04-25'], // Adicione quantas datas precisar
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
    //await Carregamento.deleteMany({ data: { $in: config.datas } });
    //console.log(`🗑️  Registros das datas ${config.datas.join(', ')} removidos`);

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