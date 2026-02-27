// src/pages/Consulta.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Components
import Header from "../components/Header";
import StatusMessage from "../components/StatusMessage";
import { gerarPDF } from "../components/pdf";
import { gerarExcel } from "../components/excel";

// Services
import api from "../services/api";

// Styles
import "../styles/Consulta.css";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFilePdf,
  faFileExcel,
  faSearch,
  faTruck,
  faUser,
  faClock,
  faFilter,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const Consulta = () => {
  const navigate = useNavigate();

  // States
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  });

  const [carregamentos, setCarregamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conectandoBackend, setConectandoBackend] = useState(true);
  const [cplusConectado, setCplusConectado] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [conferenteSelecionado, setConferenteSelecionado] = useState(null);

  // Mostrar mensagem
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Buscar carregamentos
  const buscarCarregamentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/carregamentos/finalizados?data=${dataSelecionada}`,
      );
      // Novo formato: { dados: [...], cplusConectado: boolean }
      const resposta = res.data;
      if (resposta.dados) {
        setCarregamentos(resposta.dados);
        setCplusConectado(resposta.cplusConectado);
      } else {
        // Fallback para formato antigo
        setCarregamentos(resposta || []);
      }
      setConferenteSelecionado(null);
      setConectandoBackend(false);
    } catch (error) {
      console.error("Erro ao buscar carregamentos:", error);
      showMessage("error", "Erro ao buscar carregamentos.");
      setConectandoBackend(false);
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada]);

  useEffect(() => {
    buscarCarregamentos();
  }, [buscarCarregamentos]);

  // Contagem de caminhões por conferente
  const conferentesContagem = useMemo(() => {
    const contagem = {};
    carregamentos.forEach((c) => {
      if (c.conferente) {
        contagem[c.conferente] = (contagem[c.conferente] || 0) + 1;
      }
    });
    return Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  }, [carregamentos]);

  // Filtrar carregamentos
  const carregamentosFiltrados = useMemo(() => {
    let resultado = carregamentos;

    // Filtrar por conferente selecionado
    if (conferenteSelecionado) {
      resultado = resultado.filter(
        (c) => c.conferente === conferenteSelecionado,
      );
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (c) =>
          c.placa?.toLowerCase().includes(termo) ||
          c.conferente?.toLowerCase().includes(termo) ||
          c.equipe?.toLowerCase().includes(termo) ||
          c.modelo?.toLowerCase().includes(termo),
      );
    }

    // Ordenar por horaInicio (do mais cedo para o mais tarde)
    resultado = [...resultado].sort((a, b) => {
      if (!a.horaInicio) return 1;
      if (!b.horaInicio) return -1;
      return new Date(a.horaInicio) - new Date(b.horaInicio);
    });

    return resultado;
  }, [carregamentos, conferenteSelecionado, searchTerm]);

  const handleExportarPDF = () => {
    if (carregamentosFiltrados.length === 0) {
      showMessage("warning", "Não há dados para gerar o PDF.");
      return;
    }

    gerarPDF({
      carregamentos: carregamentosFiltrados,
      conferentesContagem,
      dataSelecionada,
      conferenteSelecionado,
    });

    showMessage("success", "PDF gerado com sucesso!");
  };

  // Extrai YYYY-MM da data selecionada e busca o mês inteiro no backend
  const handleExportarExcel = async () => {
    const mes = dataSelecionada.slice(0, 7); // "YYYY-MM-DD" → "YYYY-MM"
    setLoading(true);
    try {
      const res = await api.get(`/carregamentos/finalizados/mes?mes=${mes}`);
      const dadosMes = res.data;

      if (!dadosMes || dadosMes.length === 0) {
        showMessage("warning", "Nenhum carregamento encontrado no mês.");
        return;
      }

      gerarExcel({ carregamentos: dadosMes, mes });
      showMessage("success", `Excel do mês ${mes} gerado com sucesso!`);
    } catch (error) {
      console.error("Erro ao buscar dados do mês:", error);
      showMessage("error", "Erro ao buscar dados do mês para o Excel.");
    } finally {
      setLoading(false);
    }
  };

  // Limpar filtro de conferente
  const limparFiltroConferente = () => {
    setConferenteSelecionado(null);
  };

  return (
    <div className="consulta-page">
      <div className="consulta-container">
        <Header />

        {/* Loading de conexão inicial */}
        {conectandoBackend && (
          <div className="conexao-loading">
            <div className="conexao-loading-spinner"></div>
            <p className="conexao-loading-text">Conectando ao servidor...</p>
          </div>
        )}

        {message && (
          <StatusMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        {!conectandoBackend && (
          <>
            <div className="consulta-header">
              <div className="consulta-header-left">
                <button className="btn btn-ghost" onClick={() => navigate("/")}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>Voltar</span>
                </button>
              </div>
              <div className="consulta-header-center">
                <h1 className="consulta-title">Consulta de Carregamentos</h1>
                <p className="consulta-subtitle">
                  Visualize os carregamentos finalizados
                  {!cplusConectado && (
                    <span style={{ color: "#dc3545", marginLeft: "10px" }}>
                      {" "}
                      ⚠️ CPlus desconectado
                    </span>
                  )}
                </p>
              </div>
              <div className="consulta-header-right">
                <button
                  className="btn btn-success"
                  onClick={handleExportarExcel}
                >
                  <FontAwesomeIcon icon={faFileExcel} />
                  <span>Exportar Excel</span>
                </button>
                <button className="btn btn-primary" onClick={handleExportarPDF}>
                  <FontAwesomeIcon icon={faFilePdf} />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>

            {/* Controles */}
            <div className="consulta-controls">
              <div className="control-group">
                <label htmlFor="data" className="control-label">
                  Data
                </label>
                <input
                  type="date"
                  id="data"
                  className="control-input"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                />
              </div>

              <div className="control-group search-group">
                <label htmlFor="search" className="control-label">
                  Buscar
                </label>
                <div className="search-input-wrapper">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    id="search"
                    className="control-input search-input"
                    placeholder="Placa, conferente, equipe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Filtro ativo */}
            {conferenteSelecionado && (
              <div className="filtro-ativo">
                <FontAwesomeIcon icon={faFilter} />
                <span>
                  Filtrando por: <strong>{conferenteSelecionado}</strong>
                </span>
                <button
                  className="btn-limpar-filtro"
                  onClick={limparFiltroConferente}
                >
                  <FontAwesomeIcon icon={faTimes} />
                  Limpar
                </button>
              </div>
            )}

            {/* Estatísticas e resumo por conferente */}
            <div className="consulta-grid">
              {/* Cards de resumo */}
              <div className="resumo-section">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faTruck} />
                  Resumo
                </h2>

                <div className="resumo-card total">
                  <span className="resumo-valor">{carregamentos.length}</span>
                  <span className="resumo-label">Total Finalizados</span>
                </div>

                {conferenteSelecionado && (
                  <div className="resumo-card filtrado">
                    <span className="resumo-valor">
                      {carregamentosFiltrados.length}
                    </span>
                    <span className="resumo-label">
                      De {conferenteSelecionado}
                    </span>
                  </div>
                )}
              </div>

              {/* Lista de conferentes */}
              <div className="conferentes-section">
                <h2 className="section-title">
                  <FontAwesomeIcon icon={faUser} />
                  Caminhões por Conferente
                </h2>

                {conferentesContagem.length > 0 ? (
                  <ul className="conferentes-lista">
                    {conferentesContagem.map(([nome, qtd]) => (
                      <li
                        key={nome}
                        className={`conferente-item ${
                          conferenteSelecionado === nome ? "ativo" : ""
                        }`}
                        onClick={() =>
                          setConferenteSelecionado(
                            conferenteSelecionado === nome ? null : nome,
                          )
                        }
                      >
                        <span className="conferente-nome">{nome}</span>
                        <span className="conferente-badge">{qtd}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sem-dados">Nenhum conferente encontrado.</p>
                )}
              </div>
            </div>

            {/* Tabela de carregamentos */}
            <div className="section">
              <h2 className="section-title">
                <FontAwesomeIcon icon={faClock} />
                Carregamentos Finalizados
                <span className="section-count">
                  ({carregamentosFiltrados.length})
                </span>
              </h2>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <span>Carregando...</span>
                </div>
              ) : carregamentosFiltrados.length > 0 ? (
                <div className="table-wrapper">
                  <table className="consulta-table">
                    <thead>
                      <tr>
                        <th>Placa</th>
                        <th>Modelo</th>
                        <th>Conferente</th>
                        <th>Equipe</th>
                        <th>Início</th>
                        <th>Fim</th>
                        <th>Início (C-Plus)</th>
                        <th>Fim (C-Plus)</th>
                        <th>Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carregamentosFiltrados.map((c) => (
                        <tr key={c._id || c.idPlaca}>
                          <td className="td-placa" data-label="Placa">
                            {c.placa}
                          </td>
                          <td data-label="Modelo">{c.modelo}</td>
                          <td data-label="Conferente">{c.conferente}</td>
                          <td data-label="Equipe">{c.equipe}</td>
                          <td data-label="Início">
                            {c.horaInicio
                              ? new Date(c.horaInicio).toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    timeZone: "America/Sao_Paulo",
                                  },
                                )
                              : "-"}
                          </td>
                          <td data-label="Fim">
                            {c.horaFim
                              ? new Date(c.horaFim).toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    timeZone: "America/Sao_Paulo",
                                  },
                                )
                              : "-"}
                          </td>
                          <td
                            data-label="Início (C-Plus)"
                            className={`td-cplus ${!cplusConectado ? "td-cplus-error" : ""}`}
                          >
                            {!cplusConectado ? "⚠️" : c.cplusInicio || "-"}
                          </td>
                          <td
                            data-label="Fim (C-Plus)"
                            className={`td-cplus ${!cplusConectado ? "td-cplus-error" : ""}`}
                          >
                            {!cplusConectado ? "⚠️" : c.cplusFim || "-"}
                          </td>
                          <td className="td-tempo" data-label="Tempo">
                            {c.tempo || "00:00:00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faTruck} className="empty-icon" />
                  <p>Nenhum carregamento finalizado encontrado.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Consulta;
