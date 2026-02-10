// backend/routes/carregamentos.js
const express = require("express");
const router = express.Router();
const { DateTime } = require("luxon");
const Carregamento = require("../models/carregamento");
const { queryCP, getCplusStatus } = require("../config/db");

/**
 * GET /carregamentos
 * Obtém carregamentos filtrados por data
 */
router.get("/", async (req, res) => {
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
});

/**
 * GET /carregamentos/finalizados
 * Obtém carregamentos finalizados filtrados por data
 * Inclui dados do CPlus (datainiciocarregamento e datafinalizacaocarregamento)
 */
router.get("/finalizados", async (req, res) => {
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
      console.log(`   Consultando CPlus...`);

      // Buscar por datainiciocarregamento (data que o carregamento começou)
      // pois o MongoDB salva a data de início, não a data prevista de saída
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
      // Continua sem os dados do CPlus se houver erro
    }

    // 3. Fazer o merge dos dados por placa e proximidade de horário
    const registrosComCPlus = registros.map((reg) => {
      const registroObj = reg.toObject();

      // Normalizar placa do MongoDB (remover espaços e hífens)
      const placaNormalizada = reg.placa.replace(/[\s-]/g, "").toUpperCase();

      // Buscar correspondência no CPlus pela placa (normalizada)
      const matchesCPlus = dadosCPlus.filter((cp) => {
        if (!cp.placa) return false;
        const placaCPlusNormalizada = cp.placa
          .replace(/[\s-]/g, "")
          .toUpperCase();
        return placaCPlusNormalizada === placaNormalizada;
      });

      if (matchesCPlus.length > 0) {
        // Se houver múltiplos matches, pegar o mais próximo do horário de início
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

        // Adicionar dados do CPlus ao registro
        // Enviar horários formatados como string para evitar problemas de timezone
        const formatarHoraCPlus = (timestamp) => {
          if (!timestamp) return null;
          // O timestamp vem do PostgreSQL. Verificar se é Date ou string
          const date =
            timestamp instanceof Date ? timestamp : new Date(timestamp);
          // Usar getHours (hora local do servidor) pois o PostgreSQL armazena em hora local
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

    // Retornar dados com status da conexão CPlus
    res.json({
      dados: registrosComCPlus,
      cplusConectado: dadosCPlus.length > 0 || getCplusStatus(),
    });
  } catch (error) {
    console.error("Erro ao buscar finalizados:", error);
    res.status(500).json({ erro: "Erro ao buscar finalizados" });
  }
});

/**
 * GET /carregamentos/datas
 * Obtém lista de datas que possuem carregamentos
 */
router.get("/datas", async (req, res) => {
  try {
    const datas = await Carregamento.distinct("data");
    res.json(datas.sort());
  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    res.status(500).json({ erro: "Erro ao buscar datas" });
  }
});

/**
 * POST /carregamentos
 * Cria um novo carregamento
 */
router.post("/", async (req, res) => {
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

    // Verificar se já existe
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
});

/**
 * PUT /carregamentos/:idPlaca/iniciar
 * Inicia um carregamento
 */
router.put("/:idPlaca/iniciar", async (req, res) => {
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
});

/**
 * PUT /carregamentos/:idPlaca/finalizar
 * Finaliza um carregamento
 */
router.put("/:idPlaca/finalizar", async (req, res) => {
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

    // Calcular tempo total de pausas
    // tempoPausado já contém o tempo acumulado de pausas anteriores (quando retomou)
    let tempoPausadoTotal = registro.tempoPausado || 0;

    // Se estiver pausado AGORA, adiciona o tempo desta pausa atual
    if (registro.isPaused && registro.horaPausa) {
      const horaPausa = DateTime.fromJSDate(registro.horaPausa);
      if (horaPausa.isValid) {
        const tempoNestaPausa = horaFim.diff(horaPausa, "seconds").seconds;
        tempoPausadoTotal += Math.floor(tempoNestaPausa);
      }
    }

    // Tempo bruto = fim - inicio (em segundos)
    const tempoTotalSegundos = horaFim.diff(horaInicio, "seconds").seconds;

    // Tempo efetivo = tempo bruto - tempo pausado
    const tempoEfetivoSegundos = Math.max(
      0,
      Math.floor(tempoTotalSegundos) - tempoPausadoTotal,
    );

    // Converter para HH:MM:SS
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
});

/**
 * PUT /carregamentos/:idPlaca/pausar
 * Pausa ou retoma um carregamento
 */
router.put("/:idPlaca/pausar", async (req, res) => {
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
      // RETOMAR - calcula o tempo que ficou pausado e adiciona ao tempoPausado
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

      // Calcula o tempo efetivo no momento de retomar
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
          tempoEfetivoNaPausa: 0, // Limpa ao retomar
          updatedAt: agora.toJSDate(),
        },
        { new: true },
      );

      res.json({
        carregamento: atualizado,
        acao: "retomado",
        tempoEfetivoAtual: tempoEfetivoAtual,
      });
    } else {
      // PAUSAR - registra a hora da pausa
      const horaInicio = DateTime.fromJSDate(registro.horaInicio);
      const tempoPausadoAnterior = registro.tempoPausado || 0;

      // Calcula o tempo efetivo no momento da pausa
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
          tempoEfetivoNaPausa: tempoEfetivoAtual, // Salva o tempo efetivo no momento da pausa
          updatedAt: agora.toJSDate(),
        },
        { new: true },
      );

      res.json({
        carregamento: atualizado,
        acao: "pausado",
        tempoEfetivoAtual: tempoEfetivoAtual,
      });
    }
  } catch (error) {
    console.error("Erro ao pausar/retomar carregamento:", error);
    res
      .status(500)
      .json({ erro: "Erro no servidor ao pausar/retomar carregamento" });
  }
});

module.exports = router;
