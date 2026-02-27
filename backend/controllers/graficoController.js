import Carregamento from "../models/carregamento.js";

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

    const CORTE_HORAS = 4;

    const proximoDia = (dataStr) => {
      const dt = new Date(dataStr + "T00:00:00Z");
      dt.setUTCDate(dt.getUTCDate() + 1);
      return dt.toISOString().slice(0, 10);
    };

    const mapProximoDia = {};
    listaDeData.forEach((d) => {
      mapProximoDia[proximoDia(d)] = d;
    });
    const datasProximoDia = Object.keys(mapProximoDia);

    // ── 1. Buscar registros do próprio dia ─────────────────────────────────
    const registrosDia = await Carregamento.find({
      data: { $in: listaDeData },
      status: "Finalizado",
      horaFim: { $exists: true, $ne: null },
    });

    console.log(`   Registros no dia: ${registrosDia.length}`);

    // ── 2. Buscar registros do dia seguinte até 04:00 (virada de turno) ────
    const registrosVirada = await Carregamento.find({
      data: { $in: datasProximoDia },
      status: "Finalizado",
      horaFim: { $exists: true, $ne: null },
    });

    const registrosViradaFiltrados = registrosVirada.filter((reg) => {
      const fim = new Date(reg.horaFim);
      return fim.getHours() < CORTE_HORAS;
    });

    console.log(
      `Registros na virada (até 04:00): ${registrosViradaFiltrados.length}`,
    );

    // ── 3. Encontrar o último horaFim por dia de turno ──────────────────────
    const ultimoPorDia = {};

    // Processa registros do próprio dia — apenas a partir das 04:00
    registrosDia.forEach((reg) => {
      const fim = new Date(reg.horaFim);

      // Ignora registros antes das 04:00 (pertencem ao turno do dia anterior)
      if (fim.getHours() < CORTE_HORAS) return;

      const atual = ultimoPorDia[reg.data];
      if (!atual || fim > new Date(atual.horaFim)) {
        ultimoPorDia[reg.data] = {
          horaFim: reg.horaFim,
          placa: reg.placa,
          conferente: reg.conferente,
          virada: false,
        };
      }
    });

    // Processa registros da virada (substitui se for mais tardio)
    registrosViradaFiltrados.forEach((reg) => {
      const dataOriginal = mapProximoDia[reg.data];
      if (!dataOriginal) return;
      const fim = new Date(reg.horaFim);
      const atual = ultimoPorDia[dataOriginal];
      if (!atual || fim > new Date(atual.horaFim)) {
        ultimoPorDia[dataOriginal] = {
          horaFim: reg.horaFim,
          placa: reg.placa,
          conferente: reg.conferente,
          virada: true,
        };
      }
    });

    // ── 4. Formatar resultado ───────────────────────────────────────────────
    const ultimoCarregamentoPorDia = listaDeData.map((data) => {
      const ultimo = ultimoPorDia[data];

      if (!ultimo) {
        return {
          data,
          dataFormatada: data.split("-").reverse().join("/"),
          horaFim: null,
          horaFimFormatada: null,
          minutosGrafico: null,
          placa: null,
          conferente: null,
          virada: false,
        };
      }

      const fim = new Date(ultimo.horaFim);
      const h = fim.getHours();
      const m = fim.getMinutes();

      const horaFimFormatada = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      const minutosBrutos = h * 60 + m;
      const minutosGrafico = ultimo.virada
        ? minutosBrutos + 1440 - CORTE_HORAS * 60
        : minutosBrutos - CORTE_HORAS * 60;

      return {
        data,
        dataFormatada: data.split("-").reverse().join("/"),
        horaFim: ultimo.horaFim,
        horaFimFormatada,
        minutosGrafico,
        placa: ultimo.placa,
        conferente: ultimo.conferente,
        virada: ultimo.virada,
      };
    });

    console.log(
      `   Resultado: ${ultimoCarregamentoPorDia.filter((u) => u.horaFim).length} dias com dados`,
    );

    res.json({ ultimoCarregamentoPorDia });
  } catch (error) {
    console.error("Erro ao buscar último carregamento:", error);
    res.status(500).json({ erro: "Erro ao buscar último carregamento" });
  }
};
