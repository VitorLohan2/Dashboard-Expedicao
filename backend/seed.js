// backend/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Carregamento = require("./models/carregamento");

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

// 1. CONFIGURAÇÃO PRINCIPAL (EDITÁVEL)
const config = {
  placas: [
    {
      idPlaca: "01",
      placa: "LQE 8437",
      modelo: "1318",
      codigoBarra: "LQE8437",
    },
    {
      idPlaca: "02",
      placa: "RJU 2F64",
      modelo: "1016",
      codigoBarra: "RJU2F64",
    },
    {
      idPlaca: "03",
      placa: "LSE 9F95",
      modelo: "1016",
      codigoBarra: "LSE9F95",
    },
    {
      idPlaca: "04",
      placa: "KRF 6E12",
      modelo: "1016",
      codigoBarra: "KRF6E12",
    },
    {
      idPlaca: "05",
      placa: "KPT 1J99",
      modelo: "1016",
      codigoBarra: "KPT1J99",
    },
    {
      idPlaca: "06",
      placa: "KRA 5I69",
      modelo: "1016",
      codigoBarra: "KRA5I69",
    },
    {
      idPlaca: "07",
      placa: "KYH 9D76",
      modelo: "1016",
      codigoBarra: "KYH9D76",
    },
    {
      idPlaca: "08",
      placa: "LQM 7F74",
      modelo: "1016",
      codigoBarra: "LQM7F74",
    },
    {
      idPlaca: "09",
      placa: "LUN 4G76",
      modelo: "1016",
      codigoBarra: "LUN4G76",
    },
    {
      idPlaca: "10",
      placa: "LTM 9D02",
      modelo: "1016",
      codigoBarra: "LTM9D02",
    },
    {
      idPlaca: "11",
      placa: "KRZ 8F40",
      modelo: "1318",
      codigoBarra: "KRZ8F40",
    },
    {
      idPlaca: "12",
      placa: "LTF 7210",
      modelo: "1016",
      codigoBarra: "LTF7210",
    },
    {
      idPlaca: "13",
      placa: "LTE 8J14",
      modelo: "1016",
      codigoBarra: "LTE8J14",
    },
    {
      idPlaca: "14",
      placa: "KRZ 8F42",
      modelo: "1016",
      codigoBarra: "KRZ8F42",
    },
    {
      idPlaca: "15",
      placa: "KRZ 8541",
      modelo: "1016",
      codigoBarra: "KRZ8541",
    },
    {
      idPlaca: "16",
      placa: "KRS 6588",
      modelo: "1016",
      codigoBarra: "KRS6588",
    },
    {
      idPlaca: "17",
      placa: "LNS 3B79",
      modelo: "1016",
      codigoBarra: "LNS3B79",
    },
    {
      idPlaca: "18",
      placa: "LRQ 7A87",
      modelo: "1016",
      codigoBarra: "LRQ7A87",
    },
    {
      idPlaca: "19",
      placa: "LSS 9C37",
      modelo: "1016",
      codigoBarra: "LSS9C37",
    },
    {
      idPlaca: "20",
      placa: "LTM 9D01",
      modelo: "1016",
      codigoBarra: "LTM9D01",
    },
    {
      idPlaca: "21",
      placa: "LUH 9A65",
      modelo: "1016",
      codigoBarra: "LUH9A65",
    },
    {
      idPlaca: "22",
      placa: "RIU 0H70",
      modelo: "1016",
      codigoBarra: "RIU0H70",
    },
    {
      idPlaca: "23",
      placa: "RKA 2E49",
      modelo: "1016",
      codigoBarra: "RKA2E49",
    },
    { idPlaca: "24", placa: "KXO 5059", modelo: "710", codigoBarra: "KXO5059" },
    { idPlaca: "25", placa: "KXJ 3J34", modelo: "710", codigoBarra: "KXJ3J34" },
    {
      idPlaca: "26",
      placa: "KWX 6I41",
      modelo: "1016",
      codigoBarra: "KWX6I41",
    },
    {
      idPlaca: "27",
      placa: "KRU 8I95",
      modelo: "VUCK",
      codigoBarra: "KRU8I95",
    },
    {
      idPlaca: "28",
      placa: "RIR 7J57",
      modelo: "1016",
      codigoBarra: "RIR7J57",
    },
    {
      idPlaca: "29",
      placa: "RIR 7J59",
      modelo: "1016",
      codigoBarra: "RIR7J59",
    },
    {
      idPlaca: "30",
      placa: "RJL 8F79",
      modelo: "1016",
      codigoBarra: "RJL8F79",
    },
    {
      idPlaca: "31",
      placa: "RKU 7H47",
      modelo: "1016",
      codigoBarra: "RKU7H47",
    },
    {
      idPlaca: "32",
      placa: "RKD 7J74",
      modelo: "1016",
      codigoBarra: "RKD7J74",
    },
    { idPlaca: "33", placa: "KRF 3310", modelo: "915", codigoBarra: "KRF3310" },
    { idPlaca: "34", placa: "KYV 8101", modelo: "915", codigoBarra: "KYV8101" },
    {
      idPlaca: "35",
      placa: "KRI 5I29",
      modelo: "1017",
      codigoBarra: "KRI5I29",
    },
    {
      idPlaca: "36",
      placa: "SRB 2D29",
      modelo: "1719",
      codigoBarra: "SRB2D29",
    },
    {
      idPlaca: "37",
      placa: "TTE 6J44",
      modelo: "1016",
      codigoBarra: "TTE6J44",
    },
    { idPlaca: "38", placa: "FG", modelo: "CAMPOS", codigoBarra: "FG" },
    {
      idPlaca: "39",
      placa: "TTN 4B80",
      modelo: "1016",
      codigoBarra: "TTN4B80",
    },
    {
      idPlaca: "40",
      placa: "TTL 1E06",
      modelo: "1016",
      codigoBarra: "TTL1E06",
    },
    {
      idPlaca: "41",
      placa: "TTJ 1C65",
      modelo: "1016",
      codigoBarra: "TTJ1C65",
    },
    {
      idPlaca: "42",
      placa: "TTN 4B83",
      modelo: "1016",
      codigoBarra: "TTN4B83",
    },
  ],
  datas: [
    "2026-01-12",
    "2026-01-13",
    "2026-01-14",
    "2026-01-15",
    "2026-01-16",
    "2026-01-17",
    "2026-01-18",
    "2026-01-19",
    "2026-01-20",
    "2026-01-21",
    "2026-01-22",
    "2026-01-23",
    "2026-01-24",
    "2026-01-25",
    "2026-01-26",
    "2026-01-27",
    "2026-01-28",
    "2026-01-29",
    "2026-01-30",
    "2026-01-31",
  ], // Adicione quantas datas precisar
  statusPadrao: "Não iniciado",
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
        equipe: "",
        conferente: "",
        horaInicio: null,
        horaFim: null,
        tempo: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return registros;
}

// 3. EXECUÇÃO DO SEED
async function seedDatabase() {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Conectado ao MongoDB");

    // Opção 1: Limpar tudo antes de inserir
    //await Carregamento.deleteMany({});
    //console.log('🗑️  Todos os registros anteriores removidos');

    // Opção 2: Limpar apenas registros das datas específicas
    //await Carregamento.deleteMany({ data: { $in: config.datas } });
    //console.log(`🗑️  Registros das datas ${config.datas.join(', ')} removidos`);

    const registros = await gerarRegistros();
    await Carregamento.insertMany(registros);

    console.log(
      `📝 ${registros.length} registros inseridos para ${config.datas.length} datas`,
    );
    console.log("🚀 Seed concluído com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro no seed:", err);
    process.exit(1);
  }
}

seedDatabase();
