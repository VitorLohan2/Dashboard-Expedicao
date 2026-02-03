// src/pages/Placas.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Components
import Header from "../components/Header";
import StatusMessage from "../components/StatusMessage";

// Services
import api from "../services/api";

// Styles
import "../styles/Placas.css";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faTruck,
  faCalendarPlus,
  faSync,
} from "@fortawesome/free-solid-svg-icons";

// Placas padrão do sistema
const PLACAS_PADRAO = [
  { idPlaca: "01", placa: "LQE 8437", modelo: "1318", codigoBarra: "LQE8437" },
  { idPlaca: "02", placa: "RJU 2F64", modelo: "1016", codigoBarra: "RJU2F64" },
  { idPlaca: "03", placa: "LSE 9F95", modelo: "1016", codigoBarra: "LSE9F95" },
  { idPlaca: "04", placa: "KRF 6E12", modelo: "1016", codigoBarra: "KRF6E12" },
  { idPlaca: "05", placa: "KPT 1J99", modelo: "1016", codigoBarra: "KPT1J99" },
  { idPlaca: "06", placa: "KRA 5I69", modelo: "1016", codigoBarra: "KRA5I69" },
  { idPlaca: "07", placa: "KYH 9D76", modelo: "1016", codigoBarra: "KYH9D76" },
  { idPlaca: "08", placa: "LQM 7F74", modelo: "1016", codigoBarra: "LQM7F74" },
  { idPlaca: "09", placa: "LUN 4G76", modelo: "1016", codigoBarra: "LUN4G76" },
  { idPlaca: "10", placa: "LTM 9D02", modelo: "1016", codigoBarra: "LTM9D02" },
  { idPlaca: "11", placa: "KRZ 8F40", modelo: "1318", codigoBarra: "KRZ8F40" },
  { idPlaca: "12", placa: "LTF 7210", modelo: "1016", codigoBarra: "LTF7210" },
  { idPlaca: "13", placa: "LTE 8J14", modelo: "1016", codigoBarra: "LTE8J14" },
  { idPlaca: "14", placa: "KRZ 8F42", modelo: "1016", codigoBarra: "KRZ8F42" },
  { idPlaca: "15", placa: "KRZ 8541", modelo: "1016", codigoBarra: "KRZ8541" },
  { idPlaca: "16", placa: "FG", modelo: "CAMPOS", codigoBarra: "FG" },
  { idPlaca: "17", placa: "KRF 3310", modelo: "1016", codigoBarra: "KRF3310" },
  { idPlaca: "18", placa: "TTN 4B80", modelo: "1016", codigoBarra: "TTN4B80" },
  { idPlaca: "19", placa: "TTJ 1C65", modelo: "1016", codigoBarra: "TTJ1C65" },
  { idPlaca: "20", placa: "RKA 2E49", modelo: "1016", codigoBarra: "RKA2E49" },
  { idPlaca: "21", placa: "SRB 2D29", modelo: "1016", codigoBarra: "SRB2D29" },
  { idPlaca: "22", placa: "RKU 7H47", modelo: "1016", codigoBarra: "RKU7H47" },
  { idPlaca: "23", placa: "LUH 9A65", modelo: "1016", codigoBarra: "LUH9A65" },
  { idPlaca: "24", placa: "RIU 0H70", modelo: "1016", codigoBarra: "RIU0H70" },
  { idPlaca: "25", placa: "RKD 7J74", modelo: "1016", codigoBarra: "RKD7J74" },
  { idPlaca: "26", placa: "KYV 8101", modelo: "1016", codigoBarra: "KYV8101" },
  { idPlaca: "27", placa: "TTE 6J44", modelo: "1016", codigoBarra: "TTE6J44" },
  { idPlaca: "28", placa: "KRS 6588", modelo: "1016", codigoBarra: "KRS6588" },
  { idPlaca: "29", placa: "RJL 8F79", modelo: "1016", codigoBarra: "RJL8F79" },
  { idPlaca: "30", placa: "TTN 4B83", modelo: "1016", codigoBarra: "TTN4B83" },
  { idPlaca: "31", placa: "LRQ 7A87", modelo: "1016", codigoBarra: "LRQ7A87" },
  { idPlaca: "32", placa: "KXJ 3J34", modelo: "1016", codigoBarra: "KXJ3J34" },
  { idPlaca: "33", placa: "RIR 7J57", modelo: "1016", codigoBarra: "RIR7J57" },
  { idPlaca: "34", placa: "LSS 9C37", modelo: "1016", codigoBarra: "LSS9C37" },
  { idPlaca: "35", placa: "RIR 7J59", modelo: "1016", codigoBarra: "RIR7J59" },
  { idPlaca: "36", placa: "KRI 5I29", modelo: "1016", codigoBarra: "KRI5I29" },
  { idPlaca: "37", placa: "LNS 3B79", modelo: "1016", codigoBarra: "LNS3B79" },
  { idPlaca: "38", placa: "LTM 9D01", modelo: "1016", codigoBarra: "LTM9D01" },
  { idPlaca: "39", placa: "KWX 6I41", modelo: "1016", codigoBarra: "KWX6I41" },
  { idPlaca: "40", placa: "KXO 5059", modelo: "1016", codigoBarra: "KXO5059" },
  { idPlaca: "41", placa: "KRU 8I95", modelo: "1016", codigoBarra: "KRU8I95" },
  { idPlaca: "42", placa: "TTL 1E06", modelo: "1016", codigoBarra: "TTL1E06" },
  { idPlaca: "43", placa: "PATRUS", modelo: "PATRUS", codigoBarra: "PATRUS" },
];

const Placas = () => {
  const navigate = useNavigate();

  // States
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  });

  const [placas, setPlacas] = useState([]);
  const [placasSelecionadas, setPlacasSelecionadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [datasExistentes, setDatasExistentes] = useState([]);

  // Form para nova placa
  const [novaPlaca, setNovaPlaca] = useState({
    placa: "",
    modelo: "",
  });

  // Mostrar mensagem
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Buscar datas que já têm placas
  const buscarDatasExistentes = useCallback(async () => {
    try {
      const res = await api.get("/carregamentos/datas");
      setDatasExistentes(res.data || []);
    } catch (error) {
      console.error("Erro ao buscar datas:", error);
    }
  }, []);

  useEffect(() => {
    buscarDatasExistentes();
    // Inicializar placas com as padrão
    setPlacas(PLACAS_PADRAO);
    setPlacasSelecionadas(PLACAS_PADRAO.map((p) => p.idPlaca));
  }, [buscarDatasExistentes]);

  // Toggle seleção de placa
  const togglePlaca = (idPlaca) => {
    setPlacasSelecionadas((prev) =>
      prev.includes(idPlaca)
        ? prev.filter((id) => id !== idPlaca)
        : [...prev, idPlaca],
    );
  };

  // Selecionar todas
  const selecionarTodas = () => {
    setPlacasSelecionadas(placas.map((p) => p.idPlaca));
  };

  // Desselecionar todas
  const desselecionarTodas = () => {
    setPlacasSelecionadas([]);
  };

  // Gerar datas entre início e fim
  const gerarDatas = (inicio, fim) => {
    const datas = [];
    const dataAtual = new Date(inicio + "T00:00:00");
    const dataFinal = new Date(fim + "T00:00:00");

    while (dataAtual <= dataFinal) {
      datas.push(dataAtual.toISOString().split("T")[0]);
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return datas;
  };

  // Gerar carregamentos para as datas selecionadas
  const gerarCarregamentos = async () => {
    if (placasSelecionadas.length === 0) {
      showMessage("warning", "Selecione pelo menos uma placa.");
      return;
    }

    if (!dataInicio || !dataFim) {
      showMessage("warning", "Selecione as datas de início e fim.");
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      showMessage(
        "error",
        "A data de início deve ser menor ou igual à data de fim.",
      );
      return;
    }

    setLoading(true);

    try {
      const datas = gerarDatas(dataInicio, dataFim);
      const placasParaGerar = placas.filter((p) =>
        placasSelecionadas.includes(p.idPlaca),
      );

      let totalCriados = 0;
      let totalExistentes = 0;

      for (const data of datas) {
        for (const placa of placasParaGerar) {
          try {
            const res = await api.post("/carregamentos", {
              ...placa,
              data,
              status: "Não iniciado",
              equipe: "",
              conferente: "",
              horaInicio: null,
              horaFim: null,
              tempo: "00:00:00",
            });

            if (res.data.existente) {
              totalExistentes++;
            } else {
              totalCriados++;
            }
          } catch (error) {
            if (error.response?.status !== 409) {
              console.error("Erro ao criar carregamento:", error);
            } else {
              totalExistentes++;
            }
          }
        }
      }

      await buscarDatasExistentes();

      if (totalCriados > 0) {
        showMessage(
          "success",
          `${totalCriados} carregamentos criados com sucesso! ${
            totalExistentes > 0 ? `(${totalExistentes} já existiam)` : ""
          }`,
        );
      } else if (totalExistentes > 0) {
        showMessage(
          "info",
          `Todos os ${totalExistentes} carregamentos já existiam.`,
        );
      }
    } catch (error) {
      console.error("Erro ao gerar carregamentos:", error);
      showMessage("error", "Erro ao gerar carregamentos.");
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova placa à lista
  const adicionarPlaca = () => {
    if (!novaPlaca.placa.trim() || !novaPlaca.modelo.trim()) {
      showMessage("warning", "Preencha a placa e o modelo.");
      return;
    }

    const codigoBarra = novaPlaca.placa.replace(/\s+/g, "").toUpperCase();
    const placaFormatada = novaPlaca.placa.toUpperCase().trim();

    // Verifica se a placa já existe na lista
    const placaExistente = placas.find(
      (p) =>
        p.codigoBarra === codigoBarra ||
        p.placa.toUpperCase() === placaFormatada,
    );

    if (placaExistente) {
      showMessage("warning", `A placa ${placaFormatada} já existe na lista.`);
      return;
    }

    const novoId = String(placas.length + 1).padStart(2, "0");

    const nova = {
      idPlaca: novoId,
      placa: placaFormatada,
      modelo: novaPlaca.modelo,
      codigoBarra,
    };

    setPlacas([...placas, nova]);
    setPlacasSelecionadas([...placasSelecionadas, novoId]);
    setNovaPlaca({ placa: "", modelo: "" });

    showMessage("success", "Placa adicionada à lista!");
  };

  // Remover placa da lista
  const removerPlaca = (idPlaca) => {
    setPlacas(placas.filter((p) => p.idPlaca !== idPlaca));
    setPlacasSelecionadas(placasSelecionadas.filter((id) => id !== idPlaca));
  };

  // Resetar para placas padrão
  const resetarPlacas = () => {
    setPlacas(PLACAS_PADRAO);
    setPlacasSelecionadas(PLACAS_PADRAO.map((p) => p.idPlaca));
    showMessage("info", "Lista de placas resetada para o padrão.");
  };

  return (
    <div className="placas-page">
      <div className="placas-container">
        <Header />

        {message && (
          <StatusMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        <div className="placas-header">
          <div className="placas-header-left">
            <button className="btn btn-ghost" onClick={() => navigate("/")}>
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Voltar</span>
            </button>
          </div>
          <div className="placas-header-center">
            <h1 className="placas-title">Gerenciar Placas</h1>
            <p className="placas-subtitle">
              Configure as placas e gere carregamentos para datas específicas
            </p>
          </div>
          <div className="placas-header-right">
            <button className="btn btn-secondary" onClick={resetarPlacas}>
              <FontAwesomeIcon icon={faSync} />
              <span>Resetar</span>
            </button>
          </div>
        </div>

        {/* Seção de geração de carregamentos */}
        <div className="section">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faCalendarPlus} />
            Gerar Carregamentos
          </h2>

          <div className="gerar-form">
            <div className="gerar-datas">
              <div className="control-group">
                <label className="control-label">Data Início</label>
                <input
                  type="date"
                  className="control-input"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="control-group">
                <label className="control-label">Data Fim</label>
                <input
                  type="date"
                  className="control-input"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            <div className="gerar-info">
              <p>
                <strong>{placasSelecionadas.length}</strong> placas selecionadas
              </p>
              <p>
                Período:{" "}
                {dataInicio === dataFim
                  ? "1 dia"
                  : `${gerarDatas(dataInicio, dataFim).length} dias`}
              </p>
              <p>{datasExistentes.length} datas já possuem carregamentos</p>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={gerarCarregamentos}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCalendarPlus} />
                  <span>Gerar Carregamentos</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Seção de adicionar nova placa */}
        {/* <div className="section">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faPlus} />
            Adicionar Nova Placa
          </h2>

          <div className="nova-placa-form">
            <div className="control-group">
              <label className="control-label">Placa</label>
              <input
                type="text"
                className="control-input"
                placeholder="ABC 1234"
                value={novaPlaca.placa}
                onChange={(e) =>
                  setNovaPlaca({ ...novaPlaca, placa: e.target.value })
                }
              />
            </div>
            <div className="control-group">
              <label className="control-label">Modelo</label>
              <input
                type="text"
                className="control-input"
                placeholder="1016"
                value={novaPlaca.modelo}
                onChange={(e) =>
                  setNovaPlaca({ ...novaPlaca, modelo: e.target.value })
                }
              />
            </div>
            <button className="btn btn-success" onClick={adicionarPlaca}>
              <FontAwesomeIcon icon={faPlus} />
              <span>Adicionar</span>
            </button>
          </div>
        </div> */}

        {/* Lista de placas */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faTruck} />
              Lista de Placas ({placas.length})
            </h2>
            <div className="section-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={selecionarTodas}
              >
                Selecionar Todas
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={desselecionarTodas}
              >
                Desselecionar Todas
              </button>
            </div>
          </div>

          <div className="placas-grid">
            {placas.map((placa) => (
              <div
                key={placa.idPlaca}
                className={`placa-card ${
                  placasSelecionadas.includes(placa.idPlaca)
                    ? "selecionada"
                    : ""
                }`}
              >
                <label className="placa-checkbox">
                  <input
                    type="checkbox"
                    checked={placasSelecionadas.includes(placa.idPlaca)}
                    onChange={() => togglePlaca(placa.idPlaca)}
                  />
                  <span className="checkmark"></span>
                </label>
                <div
                  className="placa-info"
                  onClick={() => togglePlaca(placa.idPlaca)}
                >
                  <span className="placa-numero">{placa.placa}</span>
                  <span className="placa-modelo">{placa.modelo}</span>
                </div>
                {/* <button
                  className="btn-remover"
                  onClick={() => removerPlaca(placa.idPlaca)}
                  title="Remover placa"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button> */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Placas;
