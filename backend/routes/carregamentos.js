// backend/routes/carregamentos.js
const express = require("express");
const router = express.Router();
const { DateTime } = require("luxon");
const Carregamento = require("../models/carregamento");

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
 */
router.get("/finalizados", async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ erro: "Parâmetro data é obrigatório" });
    }

    const registros = await Carregamento.find({ data, status: "Finalizado" });
    res.json(registros);
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

    // Calcular tempo total
    const tempoTotalMs = horaFim.diff(horaInicio, "milliseconds").milliseconds;

    if (tempoTotalMs <= 0) {
      return res
        .status(400)
        .json({ erro: "Hora de fim é anterior à hora de início" });
    }

    const horas = Math.floor(tempoTotalMs / 3600000);
    const minutos = Math.floor((tempoTotalMs % 3600000) / 60000);
    const segundos = Math.floor((tempoTotalMs % 60000) / 1000);

    const tempoTotal = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

    const atualizado = await Carregamento.findOneAndUpdate(
      { idPlaca, data },
      {
        horaFim: horaFim.toISO(),
        tempo: tempoTotal,
        status: "Finalizado",
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

module.exports = router;
