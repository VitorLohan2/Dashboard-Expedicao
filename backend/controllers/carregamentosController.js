// backend/controllers/carregamentosController.js
import { DateTime } from "luxon";
import Carregamento from "../models/carregamento.js";
import { queryCP, getCplusStatus } from "../config/db.js";

/**
 * Obtém carregamentos filtrados por data
 */
export const getCarregamentos = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ erro: "Parâmetro data é obrigatório" });
    }

    const registros = await Carregamento.find({ data });

    const registrosFormatados = registros.map((reg) => ({
      ...reg._doc,
      horaInicio: reg.horaInicio
        ? DateTime.fromJSDate(reg.horaInicio).toISO()
        : null,
      horaFim: reg.horaFim ? DateTime.fromJSDate(reg.horaFim).toISO() : null,
      tempo: reg.tempo || null,
    }));

    res.json(registrosFormatados);
  } catch (error) {
    console.error("Erro ao buscar placas:", error);
    res.status(500).json({ erro: "Erro ao buscar placas" });
  }
};

/**
 * Obtém carregamentos finalizados filtrados por data
 * Inclui dados do CPlus (datainiciocarregamento e datafinalizacaocarregamento)
 */
export const getFinalizados = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ erro: "Parâmetro data é obrigatório" });
    }

    console.log(`\n🔍 [FINALIZADOS] Buscando data: ${data}`);

    // 1. Buscar carregamentos finalizados do MongoDB
    const registros = await Carregamento.find({ data, status: "Finalizado" });
    console.log(`   MongoDB: ${registros.length} carregamentos finalizados`);

    // 2. Buscar dados do CPlus para a data especificada
    let dadosCPlus = [];
    try {
      console.log(`Consultando CPlus...`);

      const queryCPlus = `
        SELECT 
          v.placa,
          r.datainiciocarregamento,
          r.datafinalizacaocarregamento,
          r.datadocadastro
        FROM dbo.romaneiodeentrega as r
        JOIN dbo.veiculo as v ON r.idveiculo = v.id
        WHERE DATE(r.datainiciocarregamento) = $1
      `;

      dadosCPlus = await queryCP(queryCPlus, [data]);
      console.log(`   📊 CPlus: Encontrados ${dadosCPlus.length} registros`);
    } catch (error) {
      console.error("   ⚠️ Erro ao buscar dados do CPlus:", error.message);
    }

    // 3. Fazer o merge dos dados por placa e proximidade de horário
    const registrosComCPlus = registros.map((reg) => {
      const registroObj = reg.toObject();

      const placaNormalizada = reg.placa.replace(/[\s-]/g, "").toUpperCase();

      const matchesCPlus = dadosCPlus.filter((cp) => {
        if (!cp.placa) return false;
        const placaCPlusNormalizada = cp.placa
          .replace(/[\s-]/g, "")
          .toUpperCase();
        return placaCPlusNormalizada === placaNormalizada;
      });

      if (matchesCPlus.length > 0) {
        let melhorMatch = matchesCPlus[0];

        if (matchesCPlus.length > 1 && reg.horaInicio) {
          const horaInicioMongo = new Date(reg.horaInicio);

          melhorMatch = matchesCPlus.reduce((prev, curr) => {
            if (!curr.datainiciocarregamento) return prev;
            if (!prev.datainiciocarregamento) return curr;

            const diffCurr = Math.abs(
              new Date(curr.datainiciocarregamento) - horaInicioMongo,
            );
            const diffPrev = Math.abs(
              new Date(prev.datainiciocarregamento) - horaInicioMongo,
            );

            return diffCurr < diffPrev ? curr : prev;
          });
        }

        const formatarHoraCPlus = (timestamp) => {
          if (!timestamp) return null;
          const date =
            timestamp instanceof Date ? timestamp : new Date(timestamp);
          const horas = String(date.getHours()).padStart(2, "0");
          const minutos = String(date.getMinutes()).padStart(2, "0");
          const segundos = String(date.getSeconds()).padStart(2, "0");
          return `${horas}:${minutos}:${segundos}`;
        };

        registroObj.cplusInicio = formatarHoraCPlus(
          melhorMatch.datainiciocarregamento,
        );
        registroObj.cplusFim = formatarHoraCPlus(
          melhorMatch.datafinalizacaocarregamento,
        );
      } else {
        registroObj.cplusInicio = null;
        registroObj.cplusFim = null;
      }

      return registroObj;
    });

    res.json({
      dados: registrosComCPlus,
      cplusConectado: dadosCPlus.length > 0 || getCplusStatus(),
    });
  } catch (error) {
    console.error("Erro ao buscar finalizados:", error);
    res.status(500).json({ erro: "Erro ao buscar finalizados" });
  }
};

/**
 * Obtém carregamentos finalizados do mês inteiro para exportação Excel
 * Recebe ?mes=YYYY-MM e retorna todos os finalizados do mês, sem dados CPlus
 */
export const getFinalizadosMes = async (req, res) => {
  try {
    const { mes } = req.query;

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res
        .status(400)
        .json({ erro: "Parâmetro mes é obrigatório no formato YYYY-MM" });
    }

    console.log(`\n📅 [FINALIZADOS MÊS] Buscando mês: ${mes}`);

    // 1. Buscar todos os finalizados do mês no MongoDB
    const registros = await Carregamento.find({
      data: { $regex: `^${mes}` },
      status: "Finalizado",
    }).sort({ data: 1, horaInicio: 1 });

    console.log(`   MongoDB: ${registros.length} carregamentos no mês`);

    // 2. Buscar dados do CPlus para o mês inteiro (uma única query)
    let dadosCPlus = [];
    try {
      console.log(`   Consultando CPlus para o mês ${mes}...`);

      const queryCPlus = `
        SELECT 
          v.placa,
          r.datainiciocarregamento,
          r.datafinalizacaocarregamento
        FROM dbo.romaneiodeentrega as r
        JOIN dbo.veiculo as v ON r.idveiculo = v.id
        WHERE DATE(r.datainiciocarregamento) >= $1
          AND DATE(r.datainiciocarregamento) <= $2
      `;

      // Primeiro e último dia do mês
      const primeiroDia = `${mes}-01`;
      const ultimoDia = new Date(
        Number(mes.slice(0, 4)),
        Number(mes.slice(5, 7)),
        0,
      )
        .toISOString()
        .slice(0, 10);

      dadosCPlus = await queryCP(queryCPlus, [primeiroDia, ultimoDia]);
      console.log(`   CPlus: ${dadosCPlus.length} registros no mês`);
    } catch (error) {
      console.error("   ⚠️ Erro ao buscar dados do CPlus:", error.message);
    }

    // 3. Merge por placa e proximidade de horário (mesma lógica do getFinalizados)
    const formatarHoraCPlus = (timestamp) => {
      if (!timestamp) return null;
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const horas = String(date.getHours()).padStart(2, "0");
      const minutos = String(date.getMinutes()).padStart(2, "0");
      const segundos = String(date.getSeconds()).padStart(2, "0");
      return `${horas}:${minutos}:${segundos}`;
    };

    const registrosComCPlus = registros.map((reg) => {
      const placaNormalizada = reg.placa.replace(/[\s-]/g, "").toUpperCase();

      const matchesCPlus = dadosCPlus.filter((cp) => {
        if (!cp.placa) return false;
        return (
          cp.placa.replace(/[\s-]/g, "").toUpperCase() === placaNormalizada
        );
      });

      let cplusInicio = null;
      let cplusFim = null;

      if (matchesCPlus.length > 0) {
        let melhorMatch = matchesCPlus[0];

        if (matchesCPlus.length > 1 && reg.horaInicio) {
          const horaInicioMongo = new Date(reg.horaInicio);
          melhorMatch = matchesCPlus.reduce((prev, curr) => {
            if (!curr.datainiciocarregamento) return prev;
            if (!prev.datainiciocarregamento) return curr;
            const diffCurr = Math.abs(
              new Date(curr.datainiciocarregamento) - horaInicioMongo,
            );
            const diffPrev = Math.abs(
              new Date(prev.datainiciocarregamento) - horaInicioMongo,
            );
            return diffCurr < diffPrev ? curr : prev;
          });
        }

        cplusInicio = formatarHoraCPlus(melhorMatch.datainiciocarregamento);
        cplusFim = formatarHoraCPlus(melhorMatch.datafinalizacaocarregamento);
      }

      return {
        data: reg.data,
        placa: reg.placa || "-",
        modelo: reg.modelo || "-",
        conferente: reg.conferente || "-",
        equipe: reg.equipe || "-",
        horaInicio: reg.horaInicio
          ? DateTime.fromJSDate(reg.horaInicio).toISO()
          : null,
        horaFim: reg.horaFim ? DateTime.fromJSDate(reg.horaFim).toISO() : null,
        tempo: reg.tempo || "00:00:00",
        cplusInicio,
        cplusFim,
      };
    });

    res.json(registrosComCPlus);
  } catch (error) {
    console.error("Erro ao buscar finalizados do mês:", error);
    res.status(500).json({ erro: "Erro ao buscar finalizados do mês" });
  }
};

/**
 * Obtém lista de datas que possuem carregamentos
 */
export const getDatas = async (req, res) => {
  try {
    const datas = await Carregamento.distinct("data");
    res.json(datas.sort());
  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    res.status(500).json({ erro: "Erro ao buscar datas" });
  }
};

/**
 * Cria um novo carregamento
 */
export const createCarregamento = async (req, res) => {
  try {
    const {
      idPlaca,
      placa,
      modelo,
      codigoBarra,
      data,
      status,
      equipe,
      conferente,
      horaInicio,
      horaFim,
      tempo,
    } = req.body;

    const existente = await Carregamento.findOne({ idPlaca, data });

    if (existente) {
      return res.json({ existente: true, carregamento: existente });
    }

    const novoCarregamento = new Carregamento({
      idPlaca,
      placa,
      modelo,
      codigoBarra,
      data,
      status: status || "Não iniciado",
      equipe: equipe || "",
      conferente: conferente || "",
      horaInicio: horaInicio || null,
      horaFim: horaFim || null,
      tempo: tempo || "00:00:00",
    });

    await novoCarregamento.save();
    res.status(201).json({ existente: false, carregamento: novoCarregamento });
  } catch (error) {
    console.error("Erro ao criar carregamento:", error);
    res.status(500).json({ erro: "Erro ao criar carregamento" });
  }
};

/**
 * Inicia um carregamento
 */
export const iniciarCarregamento = async (req, res) => {
  const { idPlaca } = req.params;
  const { data, equipe, conferente } = req.body;

  try {
    const registro = await Carregamento.findOne({ idPlaca, data });

    if (!registro) {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }

    if (registro.horaInicio) {
      return res.status(400).json({ erro: "Carregamento já foi iniciado." });
    }

    const horaInicio = DateTime.local();

    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        horaInicio: horaInicio.toISO(),
        equipe,
        conferente,
        status: "Em andamento",
        isPaused: false,
        horaPausa: null,
        tempoPausado: 0,
        tempo: "00:00:00",
        updatedAt: horaInicio.toJSDate(),
      },
      { new: true },
    );

    res.json({ carregamento: atualizado });
  } catch (error) {
    console.error("Erro ao iniciar carregamento:", error);
    res.status(500).json({ erro: "Erro no servidor ao iniciar carregamento" });
  }
};

/**
 * Finaliza um carregamento
 */
export const finalizarCarregamento = async (req, res) => {
  const { idPlaca } = req.params;
  const { data } = req.body;

  try {
    const registro = await Carregamento.findOne({ idPlaca, data });

    if (!registro) {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }

    if (registro.status === "Finalizado") {
      return res.status(400).json({ erro: "Carregamento já finalizado" });
    }

    const horaInicio = DateTime.fromJSDate(registro.horaInicio);

    if (!horaInicio.isValid) {
      return res
        .status(400)
        .json({ erro: "Hora de início inválida ou ausente" });
    }

    const horaFim = DateTime.local();

    let tempoPausadoTotal = registro.tempoPausado || 0;

    if (registro.isPaused && registro.horaPausa) {
      const horaPausa = DateTime.fromJSDate(registro.horaPausa);
      if (horaPausa.isValid) {
        const tempoNestaPausa = horaFim.diff(horaPausa, "seconds").seconds;
        tempoPausadoTotal += Math.floor(tempoNestaPausa);
      }
    }

    const tempoTotalSegundos = horaFim.diff(horaInicio, "seconds").seconds;
    const tempoEfetivoSegundos = Math.max(
      0,
      Math.floor(tempoTotalSegundos) - tempoPausadoTotal,
    );

    const horas = Math.floor(tempoEfetivoSegundos / 3600);
    const minutos = Math.floor((tempoEfetivoSegundos % 3600) / 60);
    const segundos = tempoEfetivoSegundos % 60;

    const tempoTotal = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

    console.log(`[Finalizar] Placa ${idPlaca}:`);
    console.log(`  - Tempo bruto: ${Math.floor(tempoTotalSegundos)}s`);
    console.log(`  - Tempo pausado: ${tempoPausadoTotal}s`);
    console.log(`  - Tempo efetivo: ${tempoEfetivoSegundos}s = ${tempoTotal}`);

    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        horaFim: horaFim.toISO(),
        tempo: tempoTotal,
        status: "Finalizado",
        isPaused: false,
        horaPausa: null,
        tempoPausado: tempoPausadoTotal,
        updatedAt: horaFim.toJSDate(),
      },
      { new: true },
    );

    res.json({ carregamento: atualizado });
  } catch (error) {
    console.error("Erro ao finalizar carregamento:", error);
    res
      .status(500)
      .json({ erro: "Erro no servidor ao finalizar carregamento" });
  }
};

/**
 * Pausa ou retoma um carregamento
 */
export const pausarCarregamento = async (req, res) => {
  const { idPlaca } = req.params;
  const { data } = req.body;

  try {
    const registro = await Carregamento.findOne({ idPlaca, data });

    if (!registro) {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }

    if (registro.status !== "Em andamento") {
      return res
        .status(400)
        .json({ erro: "Só é possível pausar carregamentos em andamento" });
    }

    const agora = DateTime.local();

    if (registro.isPaused) {
      // RETOMAR
      const horaPausa = DateTime.fromJSDate(registro.horaPausa);
      const horaInicio = DateTime.fromJSDate(registro.horaInicio);

      if (!horaPausa.isValid) {
        return res.status(400).json({ erro: "Hora de pausa inválida" });
      }

      const tempoNestaPausa = Math.floor(
        agora.diff(horaPausa, "seconds").seconds,
      );
      const tempoPausadoAnterior = registro.tempoPausado || 0;
      const novoTempoPausado = tempoPausadoAnterior + tempoNestaPausa;

      const tempoTotalAteAgora = Math.floor(
        agora.diff(horaInicio, "seconds").seconds,
      );
      const tempoEfetivoAtual = tempoTotalAteAgora - novoTempoPausado;

      console.log(`[Retomar] Placa ${idPlaca}:`);
      console.log(`  - Tempo nesta pausa: ${tempoNestaPausa}s`);
      console.log(`  - Tempo pausado anterior: ${tempoPausadoAnterior}s`);
      console.log(`  - Novo tempo pausado total: ${novoTempoPausado}s`);
      console.log(`  - Tempo efetivo (trabalhado): ${tempoEfetivoAtual}s`);

      const atualizado = await Carregamento.findOneAndUpdate(
        { idPlaca, data },
        {
          isPaused: false,
          horaPausa: null,
          tempoPausado: novoTempoPausado,
          tempoEfetivoNaPausa: 0,
          updatedAt: agora.toJSDate(),
        },
        { new: true },
      );

      res.json({
        carregamento: atualizado,
        acao: "retomado",
        tempoEfetivoAtual,
      });
    } else {
      // PAUSAR
      const horaInicio = DateTime.fromJSDate(registro.horaInicio);
      const tempoPausadoAnterior = registro.tempoPausado || 0;

      const tempoTotalAteAgora = Math.floor(
        agora.diff(horaInicio, "seconds").seconds,
      );
      const tempoEfetivoAtual = tempoTotalAteAgora - tempoPausadoAnterior;

      console.log(`[Pausar] Placa ${idPlaca}:`);
      console.log(
        `  - Tempo pausado acumulado até agora: ${tempoPausadoAnterior}s`,
      );
      console.log(`  - Tempo total desde início: ${tempoTotalAteAgora}s`);
      console.log(`  - Tempo efetivo (trabalhado): ${tempoEfetivoAtual}s`);
      console.log(`  - Hora da pausa: ${agora.toISO()}`);

      const atualizado = await Carregamento.findOneAndUpdate(
        { idPlaca, data },
        {
          isPaused: true,
          horaPausa: agora.toISO(),
          tempoEfetivoNaPausa: tempoEfetivoAtual,
          updatedAt: agora.toJSDate(),
        },
        { new: true },
      );

      res.json({
        carregamento: atualizado,
        acao: "pausado",
        tempoEfetivoAtual,
      });
    }
  } catch (error) {
    console.error("Erro ao pausar/retomar carregamento:", error);
    res
      .status(500)
      .json({ erro: "Erro no servidor ao pausar/retomar carregamento" });
  }
};

export const getGraficoDados = async (req, res) => {
  try {
    const { datas } = req.query;

    if (!datas) {
      return res.status(400).json({ erro: "Parâmetro datas é obrigatório" });
    }

    const listaDeData = datas
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    if (listaDeData.length === 0) {
      return res.status(400).json({ erro: "Nenhuma data válida fornecida" });
    }

    console.log(
      `\n📊 [GRAFICO] Buscando dados para: ${listaDeData.join(", ")}`,
    );

    const registros = await Carregamento.find({
      data: { $in: listaDeData },
      status: "Finalizado",
      tempo: { $exists: true, $ne: null },
    });

    console.log(`   MongoDB: ${registros.length} registros encontrados`);

    const tempoParaSegundos = (tempo) => {
      if (!tempo || tempo === "00:00:00") return 0;
      const partes = tempo.split(":").map(Number);
      return partes[0] * 3600 + partes[1] * 60 + (partes[2] || 0);
    };

    const segundosParaTempo = (seg) => {
      const h = Math.floor(seg / 3600);
      const m = Math.floor((seg % 3600) / 60);
      const s = Math.floor(seg % 60);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // 1. Média por dia
    const porDia = {};
    listaDeData.forEach((d) => {
      porDia[d] = { soma: 0, total: 0 };
    });

    registros.forEach((reg) => {
      const seg = tempoParaSegundos(reg.tempo);
      if (seg > 0 && porDia[reg.data]) {
        porDia[reg.data].soma += seg;
        porDia[reg.data].total += 1;
      }
    });

    const mediaPorDia = listaDeData.map((data) => {
      const { soma, total } = porDia[data];
      const mediaSegundos = total > 0 ? Math.round(soma / total) : 0;
      return {
        data,
        dataFormatada: data.split("-").reverse().join("/"),
        mediaSegundos,
        mediaFormatada: segundosParaTempo(mediaSegundos),
        total,
      };
    });

    // 2. Ranking por conferente (menor → maior)
    const porConferente = {};

    registros.forEach((reg) => {
      if (!reg.conferente) return;
      const seg = tempoParaSegundos(reg.tempo);
      if (seg <= 0) return;
      if (!porConferente[reg.conferente]) {
        porConferente[reg.conferente] = { soma: 0, total: 0 };
      }
      porConferente[reg.conferente].soma += seg;
      porConferente[reg.conferente].total += 1;
    });

    const rankingConferentes = Object.entries(porConferente)
      .map(([conferente, { soma, total }]) => {
        const mediaSegundos = Math.round(soma / total);
        return {
          conferente,
          mediaSegundos,
          mediaFormatada: segundosParaTempo(mediaSegundos),
          total,
        };
      })
      .sort((a, b) => {
        if (a.mediaSegundos !== b.mediaSegundos) {
          return a.mediaSegundos - b.mediaSegundos;
        }
        return b.total - a.total; // desempate: mais caminhões primeiro
      });

    res.json({ mediaPorDia, rankingConferentes });
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico:", error);
    res.status(500).json({ erro: "Erro ao buscar dados do gráfico" });
  }
};

export const getUltimoCarregamento = async (req, res) => {
  try {
    const { datas } = req.query;

    if (!datas) {
      return res.status(400).json({ erro: "Parâmetro datas é obrigatório" });
    }

    const listaDeData = datas
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    if (listaDeData.length === 0) {
      return res.status(400).json({ erro: "Nenhuma data válida fornecida" });
    }

    console.log(
      `\n🕐 [ULTIMO CARREGAMENTO] Buscando turno para: ${listaDeData.join(", ")}`,
    );

    const registros = await Carregamento.find({
      status: "Finalizado",
      horaFim: { $exists: true, $ne: null },
    });

    const CORTE_HORA = 4; // 04:00

    const ultimoPorDia = {};

    registros.forEach((reg) => {
      const fimUTC = new Date(reg.horaFim);

      // 🔥 Converte corretamente para Brasília
      const fimBR = new Date(
        fimUTC.toLocaleString("en-US", {
          timeZone: "America/Sao_Paulo",
        }),
      );

      const turno = new Date(fimBR);

      // Regra da virada
      if (fimBR.getHours() < CORTE_HORA) {
        turno.setDate(turno.getDate() - 1);
      }

      // 🔥 NÃO usar toISOString
      const turnoStr =
        turno.getFullYear() +
        "-" +
        String(turno.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(turno.getDate()).padStart(2, "0");

      if (!listaDeData.includes(turnoStr)) return;

      const atual = ultimoPorDia[turnoStr];

      // 🔥 Comparar usando horário BR (não UTC)
      if (!atual) {
        ultimoPorDia[turnoStr] = { reg, fimBR };
      } else {
        if (fimBR > atual.fimBR) {
          ultimoPorDia[turnoStr] = { reg, fimBR };
        }
      }
    });

    const ultimoCarregamentoPorDia = listaDeData.map((data) => {
      const item = ultimoPorDia[data];

      if (!item) {
        return {
          data,
          dataFormatada: data.split("-").reverse().join("/"),
          horaFim: null,
          horaFimFormatada: null,
          minutosGrafico: null,
          placa: null,
          conferente: null,
        };
      }

      const { reg, fimBR } = item;

      const h = fimBR.getHours();
      const m = fimBR.getMinutes();

      const horaFimFormatada = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      // minutos desde 04:00
      let minutosGrafico = h * 60 + m - 4 * 60;
      if (minutosGrafico < 0) minutosGrafico += 1440;

      return {
        data,
        dataFormatada: data.split("-").reverse().join("/"),
        horaFim: reg.horaFim,
        horaFimFormatada,
        minutosGrafico,
        placa: reg.placa,
        conferente: reg.conferente,
      };
    });

    console.log(
      `   Resultado final: ${
        ultimoCarregamentoPorDia.filter((d) => d.horaFim).length
      } dias com dados`,
    );

    res.json({ ultimoCarregamentoPorDia });
  } catch (error) {
    console.error("Erro ao buscar último carregamento:", error);
    res.status(500).json({ erro: "Erro ao buscar último carregamento" });
  }
};
