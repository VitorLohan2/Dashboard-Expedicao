// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Carregamento = require('./models/Carregamento');

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

const placas = [
  {
    idPlaca: '01',
    placa: 'VKQ9V1G',
    modelo: '001',
    codigoBarra: 'VKQ9V1G-01',
    data: '2025-04-17'
  },
  {
    idPlaca: '02',
    placa: 'GLM15PH',
    modelo: '002',
    codigoBarra: 'GLM15PH-02',
    data: '2025-04-17'
  },
  {
    idPlaca: '03',
    placa: 'QPSQ78S0',
    modelo: '003',
    codigoBarra: 'QPSQ78S0-03',
    data: '2025-04-17'
  },
  {
    idPlaca: '01',
    placa: 'VKQ9V1G',
    modelo: '001',
    codigoBarra: 'VKQ9V1G-01',
    data: '2025-04-18'
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado ao MongoDB');

     await Carregamento.deleteMany({}); // Limpar o banco de dados antes de inserir novos dados.
     console.log('🗑️  Coleção limpa!');
    //await Carregamento.insertMany(placas); // Adicionar novas placas ao banco de dados.

    for (const placa of placas) {
      const existe = await Carregamento.findOne({ idPlaca: placa.idPlaca, data: placa.data });

      if (!existe) {
        await Carregamento.create(placa);
        console.log(`✅ Inserida: Placa ${placa.placa} na data ${placa.data}`);
      } else {
        console.log(`⚠️ Já existe: Placa ${placa.placa} na data ${placa.data}`);
      }
    }

    console.log('🚀 Finalizado!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao semear o banco:', err);
    process.exit(1);
  }
}

seedDatabase();
