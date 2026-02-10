// src/pages/Consulta.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Components
import Header from "../components/Header";
import StatusMessage from "../components/StatusMessage";

// Services
import api from "../services/api";

// Styles
import "../styles/Consulta.css";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFilePdf,
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

  // Gerar PDF
  const gerarPDF = () => {
    if (carregamentosFiltrados.length === 0) {
      showMessage("warning", "Não há dados para gerar o PDF.");
      return;
    }

    const doc = new jsPDF();
    const dataFormatada = dataSelecionada.split("-").reverse().join("/");

    // Título
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text("Relatório de Carregamentos", 14, 20);

    // Subtítulo
    doc.setFontSize(12);
    doc.setTextColor(100);
    const subtitulo = conferenteSelecionado
      ? `Data: ${dataFormatada} | Conferente: ${conferenteSelecionado}`
      : `Data: ${dataFormatada}`;
    doc.text(subtitulo, 14, 28);

    // Tabela
    const dados = carregamentosFiltrados.map((c) => [
      c.placa || "-",
      c.modelo || "-",
      c.conferente || "-",
      c.equipe || "-",
      c.horaInicio ? new Date(c.horaInicio).toLocaleTimeString("pt-BR") : "-",
      c.horaFim ? new Date(c.horaFim).toLocaleTimeString("pt-BR") : "-",
      c.cplusInicio || "-",
      c.cplusFim || "-",
      c.tempo || "00:00:00",
    ]);

    autoTable(doc, {
      head: [
        [
          "Placa",
          "Modelo",
          "Conferente",
          "Equipe",
          "Início",
          "Fim",
          "Início (C-Plus)",
          "Fim (C-Plus)",
          "Tempo",
        ],
      ],
      body: dados,
      startY: 35,
      theme: "striped",
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // Rodapé com contagem por conferente
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text("Resumo por Conferente:", 14, finalY);

    let yPosition = finalY + 8;
    doc.setFontSize(10);
    doc.setTextColor(60);

    conferentesContagem.forEach(([nome, qtd]) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`• ${nome}: ${qtd} caminhão(ões)`, 14, yPosition);
      yPosition += 6;
    });

    // Salvar
    const nomeArquivo = conferenteSelecionado
      ? `carregamentos_${dataSelecionada}_${conferenteSelecionado}.pdf`
      : `carregamentos_${dataSelecionada}.pdf`;
    doc.save(nomeArquivo);

    showMessage("success", "PDF gerado com sucesso!");
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
                <button className="btn btn-primary" onClick={gerarPDF}>
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
                                )
                              : "-"}
                          </td>
                          <td data-label="Fim">
                            {c.horaFim
                              ? new Date(c.horaFim).toLocaleTimeString("pt-BR")
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
