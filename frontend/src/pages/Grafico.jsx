// src/pages/Grafico.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// Components
import Header from "../components/Header";
import StatusMessage from "../components/StatusMessage";

// Services
import api from "../services/api";

// Styles
import "../styles/Grafico.css";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChartLine,
  faTrophy,
  faCalendarPlus,
  faTimes,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Converte "HH:MM:SS" → minutos (para eixo do gráfico)
const tempoParaMinutos = (tempo) => {
  if (!tempo) return 0;
  const [h, m, s] = tempo.split(":").map(Number);
  return Math.round((h * 3600 + m * 60 + (s || 0)) / 60);
};

// Modo 1: score = mediaSegundos ÷ total
// Penaliza quem fez pouco volume, valoriza quem carregou muito em pouco tempo
const aplicarRanking = (conferentes) =>
  [...conferentes]
    .map((c) => ({ ...c, score: c.mediaSegundos / c.total }))
    .sort((a, b) => a.score - b.score);

const Grafico = () => {
  const navigate = useNavigate();

  const [datasSelecionadas, setDatasSelecionadas] = useState([]);
  const [novaData, setNovaData] = useState("");
  const [dados, setDados] = useState(null);
  const [dadosUltimo, setDadosUltimo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const adicionarData = () => {
    if (!novaData) return;
    if (datasSelecionadas.includes(novaData)) {
      showMessage("warning", "Esta data já foi adicionada.");
      return;
    }
    setDatasSelecionadas((prev) => [...prev, novaData].sort());
    setNovaData("");
  };

  const removerData = (data) => {
    setDatasSelecionadas((prev) => prev.filter((d) => d !== data));
  };

  const buscarDados = useCallback(async () => {
    if (datasSelecionadas.length === 0) return;
    setLoading(true);
    try {
      const datasParam = datasSelecionadas.join(",");
      const [resGrafico, resUltimo] = await Promise.all([
        api.get(`/carregamentos/grafico?datas=${datasParam}`),
        api.get(
          `/carregamentos/grafico/ultimo-carregamento?datas=${datasParam}`,
        ),
      ]);
      setDados(resGrafico.data);
      setDadosUltimo(resUltimo.data);
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico:", error);
      showMessage("error", "Erro ao buscar dados para os gráficos.");
    } finally {
      setLoading(false);
    }
  }, [datasSelecionadas]);

  useEffect(() => {
    if (datasSelecionadas.length > 0) {
      buscarDados();
    } else {
      setDados(null);
      setDadosUltimo(null);
    }
  }, [datasSelecionadas, buscarDados]);

  const ranking = aplicarRanking(dados?.rankingConferentes || []);

  // ── Gráfico de linha ───────────────────────────────────────────────────────
  const linhaData = dados
    ? {
        labels: dados.mediaPorDia.map((d) => d.dataFormatada),
        datasets: [
          {
            label: "Tempo Médio (min)",
            data: dados.mediaPorDia.map((d) =>
              tempoParaMinutos(d.mediaFormatada),
            ),
            backgroundColor: "rgba(30, 58, 138, 0.8)",
            borderColor: "#1e3a8a",
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      }
    : null;

  const linhaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e3a8a",
        titleColor: "#fff",
        bodyColor: "#e0e7ff",
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex;
            const item = dados?.mediaPorDia[idx];
            return [
              ` Média: ${item?.mediaFormatada || "-"}`,
              ` Carregamentos: ${item?.total || 0}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { color: "#6b7280", font: { size: 12 } },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: {
          color: "#6b7280",
          font: { size: 12 },
          callback: (val) => `${val}m`,
        },
        title: {
          display: true,
          text: "Minutos",
          color: "#9ca3af",
          font: { size: 11 },
        },
      },
    },
  };

  // ── Gráfico de barras horizontais ──────────────────────────────────────────
  const coresRanking = ranking.map((_, i) => {
    if (i === 0) return "rgba(234, 179, 8, 0.85)";
    if (i === 1) return "rgba(156, 163, 175, 0.85)";
    if (i === 2) return "rgba(180, 100, 50, 0.85)";
    return "rgba(30, 58, 138, 0.75)";
  });

  const barrasData = {
    labels: ranking.map((c) => c.conferente),
    datasets: [
      {
        label: "Tempo Médio (min)",
        data: ranking.map((c) => tempoParaMinutos(c.mediaFormatada)),
        backgroundColor: coresRanking,
        borderColor: coresRanking.map((c) =>
          c.replace("0.85", "1").replace("0.75", "1"),
        ),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barrasOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e3a8a",
        titleColor: "#fff",
        bodyColor: "#e0e7ff",
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const item = ranking[ctx.dataIndex];
            return [
              ` Média: ${item?.mediaFormatada || "-"}`,
              ` Caminhões: ${item?.total || 0}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: {
          color: "#6b7280",
          font: { size: 12 },
          callback: (val) => `${val}m`,
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#374151", font: { size: 13, weight: "500" } },
      },
    },
  };

  const alturaRanking = Math.max(200, ranking.length * 56);

  // ── Gráfico de linha — Último carregamento do turno ───────────────────────

  const horaParaMinutosBR = (dataISO) => {
    if (!dataISO) return null;

    const date = new Date(dataISO);

    const br = new Date(
      date.toLocaleString("en-US", {
        timeZone: "America/Sao_Paulo",
      }),
    );

    return br.getHours() * 60 + br.getMinutes();
  };

  const ultimoList = dadosUltimo?.ultimoCarregamentoPorDia || [];

  const ultimoLinhaData = {
    labels: ultimoList.map((d) => d.dataFormatada),
    datasets: [
      {
        label: "Último carregamento",
        data: ultimoList.map((d) => horaParaMinutosBR(d.horaFim)),
        borderColor: "#0d9488",
        backgroundColor: "rgba(13, 148, 136, 0.08)",
        pointBackgroundColor: ultimoList.map((d) =>
          d.virada ? "#f59e0b" : "#0d9488",
        ),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 7,
        pointHoverRadius: 9,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        spanGaps: true,
      },
    ],
  };

  const ultimoLinhaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f766e",
        titleColor: "#fff",
        bodyColor: "#ccfbf1",
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const item = ultimoList[ctx.dataIndex];
            if (!item?.horaFim) return " Sem dados";
            return [
              ` Último: ${item.horaFimFormatada}${item.virada ? " (virada)" : ""}`,
              ` Placa: ${item.placa || "-"}`,
              ` Conferente: ${item.conferente || "-"}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { color: "#6b7280", font: { size: 12 } },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: {
          color: "#6b7280",
          font: { size: 12 },
          callback: (val) => {
            const h = Math.floor(val / 60);
            const m = val % 60;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          },
        },
        title: {
          display: true,
          text: "Horário",
          color: "#9ca3af",
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="grafico-page">
      <div className="grafico-container">
        <Header />

        {message && (
          <StatusMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Header */}
        <div className="grafico-header">
          <div className="grafico-header-left">
            <button className="btn btn-ghost" onClick={() => navigate("/")}>
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Voltar</span>
            </button>
          </div>
          <div className="grafico-header-center">
            <h1 className="grafico-title">Análise de Carregamentos</h1>
            <p className="grafico-subtitle">
              Tempo médio e ranking por conferente
            </p>
          </div>
          <div className="grafico-header-right" />
        </div>

        {/* Seletor de datas */}
        <div className="grafico-filtros">
          <div className="filtros-header">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faCalendarPlus} />
              Datas Analisadas
            </h2>
          </div>
          <div className="filtros-body">
            <div className="datas-chips">
              {datasSelecionadas.map((data) => (
                <span key={data} className="data-chip">
                  {data.split("-").reverse().join("/")}
                  <button
                    className="data-chip-remove"
                    onClick={() => removerData(data)}
                    title="Remover data"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </span>
              ))}
            </div>
            <div className="adicionar-data">
              <input
                type="date"
                className="control-input"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={adicionarData}
                disabled={!novaData}
              >
                <FontAwesomeIcon icon={faCalendarPlus} />
                <span>Adicionar Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards de resumo */}
        {dados && !loading && (
          <div className="grafico-resumo">
            <div className="resumo-card total">
              <span className="resumo-valor">
                {dados.mediaPorDia.reduce((acc, d) => acc + d.total, 0)}
              </span>
              <span className="resumo-label">Total Carregamentos</span>
            </div>
            <div className="resumo-card total">
              <span className="resumo-valor">{datasSelecionadas.length}</span>
              <span className="resumo-label">
                {datasSelecionadas.length === 1
                  ? "Dia Analisado"
                  : "Dias Analisados"}
              </span>
            </div>
            <div className="resumo-card total">
              <span className="resumo-valor">{ranking.length}</span>
              <span className="resumo-label">Conferentes</span>
            </div>
          </div>
        )}

        {datasSelecionadas.length === 0 && !loading && (
          <div className="empty-state">
            <p>Selecione uma ou mais datas para visualizar os gráficos.</p>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Carregando dados...</span>
          </div>
        ) : !dados ? null : (
          <>
            {/* Grid com os dois gráficos lado a lado */}
            <div className="graficos-grid">
              {/* Gráfico de barras — Tempo Médio por Dia */}
              <div className="section">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faChartLine} />
                  Tempo Médio por Dia
                </h2>
                {dados.mediaPorDia.every((d) => d.total === 0) ? (
                  <div className="empty-state">
                    <p>
                      Nenhum carregamento finalizado nas datas selecionadas.
                    </p>
                  </div>
                ) : (
                  <div className="chart-wrapper" style={{ height: "300px" }}>
                    <Bar data={linhaData} options={linhaOptions} />
                  </div>
                )}
              </div>

              {/* Gráfico de linha — Último carregamento do turno */}
              <div className="section">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faClock} />
                  Último Carregamento do Turno
                </h2>
                {ultimoList.every((d) => !d.horaFim) ? (
                  <div className="empty-state">
                    <p>Nenhum dado de horário disponível.</p>
                  </div>
                ) : (
                  <>
                    <div className="chart-wrapper" style={{ height: "300px" }}>
                      <Line
                        data={ultimoLinhaData}
                        options={ultimoLinhaOptions}
                      />
                    </div>
                    {/* Legenda da virada */}
                    <div className="ultimo-legenda">
                      <span className="legenda-item legenda-normal">
                        <span
                          className="legenda-dot"
                          style={{ background: "#0d9488" }}
                        />
                        Registro de até 04:00 horas
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Ranking de conferentes */}
            <div className="section">
              <h2 className="section-title">
                <FontAwesomeIcon icon={faTrophy} />
                Ranking de Conferentes
                <span className="section-count">({ranking.length})</span>
              </h2>

              {ranking.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum dado de conferente disponível.</p>
                </div>
              ) : (
                <>
                  <div
                    className="chart-wrapper"
                    style={{ height: `${alturaRanking}px` }}
                  >
                    <Bar data={barrasData} options={barrasOptions} />
                  </div>

                  <div className="ranking-tabela">
                    <table className="consulta-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Conferente</th>
                          <th>Tempo Médio</th>
                          <th>Caminhões</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((c, i) => (
                          <tr key={c.conferente}>
                            <td className="td-posicao">
                              {i === 0
                                ? "🥇"
                                : i === 1
                                  ? "🥈"
                                  : i === 2
                                    ? "🥉"
                                    : `${i + 1}º`}
                            </td>
                            <td className="td-placa">{c.conferente}</td>
                            <td className="td-tempo">{c.mediaFormatada}</td>
                            <td>{c.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Grafico;
