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
  { idPlaca: "16", placa: "LRK 2A47", modelo: "1016", codigoBarra: "LRK2A47" },
  { idPlaca: "17", placa: "LSI 5253", modelo: "1016", codigoBarra: "LSI5253" },
  { idPlaca: "18", placa: "KPW 0I86", modelo: "1016", codigoBarra: "KPW0I86" },
  { idPlaca: "19", placa: "LSB 3B40", modelo: "1016", codigoBarra: "LSB3B40" },
  { idPlaca: "20", placa: "LPQ 5G64", modelo: "1016", codigoBarra: "LPQ5G64" },
  { idPlaca: "21", placa: "LUL 5J32", modelo: "1016", codigoBarra: "LUL5J32" },
  { idPlaca: "22", placa: "LUC 8E54", modelo: "1016", codigoBarra: "LUC8E54" },
  { idPlaca: "23", placa: "LSJ 4E07", modelo: "1016", codigoBarra: "LSJ4E07" },
  { idPlaca: "24", placa: "LTT 3I74", modelo: "1016", codigoBarra: "LTT3I74" },
  { idPlaca: "25", placa: "LUA 7D73", modelo: "1016", codigoBarra: "LUA7D73" },
  { idPlaca: "26", placa: "KQS 3D17", modelo: "1016", codigoBarra: "KQS3D17" },
  { idPlaca: "27", placa: "PNZ 5D51", modelo: "1016", codigoBarra: "PNZ5D51" },
  { idPlaca: "28", placa: "LZY 4G07", modelo: "1016", codigoBarra: "LZY4G07" },
  { idPlaca: "29", placa: "LTZ 8B97", modelo: "1016", codigoBarra: "LTZ8B97" },
  { idPlaca: "30", placa: "LSK 3A74", modelo: "1016", codigoBarra: "LSK3A74" },
  { idPlaca: "31", placa: "MZD 1F55", modelo: "1016", codigoBarra: "MZD1F55" },
  { idPlaca: "32", placa: "MZD 7B69", modelo: "1016", codigoBarra: "MZD7B69" },
  { idPlaca: "33", placa: "MZC 3E31", modelo: "1016", codigoBarra: "MZC3E31" },
  { idPlaca: "34", placa: "NAA 8E91", modelo: "1016", codigoBarra: "NAA8E91" },
  { idPlaca: "35", placa: "KRV 0A61", modelo: "1016", codigoBarra: "KRV0A61" },
  { idPlaca: "36", placa: "LRX 2A98", modelo: "1016", codigoBarra: "LRX2A98" },
  { idPlaca: "37", placa: "LSG 9H05", modelo: "1016", codigoBarra: "LSG9H05" },
  { idPlaca: "38", placa: "LRL 4D37", modelo: "1016", codigoBarra: "LRL4D37" },
  { idPlaca: "39", placa: "LZY 4G50", modelo: "1016", codigoBarra: "LZY4G50" },
  { idPlaca: "40", placa: "LRC 7D35", modelo: "1016", codigoBarra: "LRC7D35" },
  { idPlaca: "41", placa: "LTG 5G68", modelo: "1016", codigoBarra: "LTG5G68" },
  { idPlaca: "42", placa: "LTG 5G48", modelo: "1016", codigoBarra: "LTG5G48" },
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

    const novoId = String(placas.length + 1).padStart(2, "0");
    const codigoBarra = novaPlaca.placa.replace(/\s+/g, "");

    const nova = {
      idPlaca: novoId,
      placa: novaPlaca.placa.toUpperCase(),
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
        <div className="section">
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
        </div>

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
                <button
                  className="btn-remover"
                  onClick={() => removerPlaca(placa.idPlaca)}
                  title="Remover placa"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Placas;
