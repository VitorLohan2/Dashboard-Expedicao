// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Components
import PlateTable from "../components/PlateTable";
import PlateDetails from "../components/PlateDetails";
import Actions from "../components/Actions";
import InformacoesForm from "../components/InformacoesForm";
import Header from "../components/Header";
import StatusMessage from "../components/StatusMessage";

// Services
import api from "../services/api";

// Styles
import "../styles/Dashboard.css";

// Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPlus } from "@fortawesome/free-solid-svg-icons";

// Utils
import { formatarTempo, calcularSegundosDecorridos } from "../utils/timeUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // States
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  });

  const [plates, setPlates] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState(null);
  const [equipe, setEquipe] = useState("");
  const [conferente, setConferente] = useState("");
  const [tempo, setTempo] = useState("00:00:00");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Mostrar mensagem
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Funções do cronômetro
  const iniciarCronometro = useCallback((segundosJaDecorridos = 0) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    segundosJaDecorridos = Math.max(0, segundosJaDecorridos);
    const start = Date.now() - segundosJaDecorridos * 1000;

    timerRef.current = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setTempo(formatarTempo(diff));
    }, 1000);
  }, []);

  const pararCronometro = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Selecionar placa
  const handleSelectPlate = useCallback(
    (plate) => {
      setSelectedPlate(plate);
      setEquipe(plate.equipe || "");
      setConferente(plate.conferente || "");
      pararCronometro();
      setTempo("00:00:00");

      if (plate.status === "Em andamento" && plate.horaInicio) {
        try {
          const diff = calcularSegundosDecorridos(plate.horaInicio);
          if (diff > 0 && diff < 86400) {
            setTempo(formatarTempo(diff));
            iniciarCronometro(diff);
          }
        } catch (error) {
          console.error("Erro ao calcular tempo:", error);
          showMessage("error", `Erro: ${error.message}`);
        }
      } else {
        setTempo(plate.tempo || "00:00:00");
      }
    },
    [pararCronometro, iniciarCronometro],
  );

  // Buscar placas
  useEffect(() => {
    const fetchPlates = async () => {
      try {
        const res = await api.get(`/carregamentos?data=${dataSelecionada}`);
        const placasFormatadas = res.data
          .filter((item) => item.placa && item.placa.trim() !== "")
          .map((item) => ({
            id: item._id,
            idPlaca: item.idPlaca,
            placa: item.placa,
            modelo: item.modelo,
            codigoBarra: item.codigoBarra,
            status: item.status,
            equipe: item.equipe || "",
            conferente: item.conferente || "",
            horaInicio: item.horaInicio,
            horaFim: item.horaFim,
            tempo: item.tempo || "00:00:00",
          }));

        setPlates(placasFormatadas);

        if (selectedPlate) {
          const placaAtualizada = placasFormatadas.find(
            (p) => p.idPlaca === selectedPlate.idPlaca,
          );
          if (placaAtualizada) {
            handleSelectPlate(placaAtualizada);
          } else {
            setSelectedPlate(null);
            setTempo("00:00:00");
            setEquipe("");
            setConferente("");
          }
        }
      } catch (err) {
        console.error("Erro ao buscar placas:", err);
        showMessage("warning", "Não foi possível carregar as placas.");
      }
    };

    fetchPlates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada, selectedPlate?.idPlaca, handleSelectPlate]);

  // Limpar cronômetro ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Ações
  const handleStart = async () => {
    if (!selectedPlate || !equipe.trim() || !conferente.trim()) {
      showMessage("error", "Preencha todos os campos antes de iniciar!");
      return;
    }

    if (
      selectedPlate.status === "Em andamento" ||
      selectedPlate.status === "Finalizado"
    ) {
      showMessage("info", "Essa placa já foi iniciada ou finalizada.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.put(
        `/carregamentos/${selectedPlate.idPlaca}/iniciar`,
        {
          equipe,
          conferente,
          data: dataSelecionada,
        },
      );

      const atualizado = { ...selectedPlate, ...res.data.carregamento };

      if (res.data.alerta) {
        showMessage(
          "warning",
          "Dados dessa placa já existiam e foram sobrescritos!",
        );
      } else {
        showMessage("success", "Carregamento iniciado com sucesso!");
      }

      setTempo("00:00:00");
      iniciarCronometro(0);

      const updatedPlates = plates.map((p) =>
        p.idPlaca === atualizado.idPlaca ? atualizado : p,
      );

      setPlates(updatedPlates);
      setSelectedPlate(atualizado);
    } catch (error) {
      console.error("Erro ao iniciar:", error);
      showMessage("error", "Erro ao iniciar o carregamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedPlate) return;

    if (selectedPlate.status !== "Em andamento") {
      showMessage("info", "Essa placa ainda não foi iniciada.");
      return;
    }

    setLoading(true);
    pararCronometro();

    try {
      const res = await api.put(
        `/carregamentos/${selectedPlate.idPlaca}/finalizar`,
        {
          data: dataSelecionada,
        },
      );

      const finalizado = res.data.carregamento;
      const updated = plates.map((p) =>
        p.idPlaca === finalizado.idPlaca ? finalizado : p,
      );

      setPlates(updated);
      setSelectedPlate(finalizado);

      showMessage("success", "Carregamento finalizado com sucesso!");
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      showMessage("error", "Erro ao finalizar o carregamento.");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    showMessage("info", "Função em desenvolvimento.");
  };

  // Estatísticas
  const stats = {
    total: plates.length,
    naoIniciados: plates.filter((p) => p.status === "Não iniciado").length,
    emAndamento: plates.filter((p) => p.status === "Em andamento").length,
    finalizados: plates.filter((p) => p.status === "Finalizado").length,
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <Header />

        {message && (
          <StatusMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        <div className="dashboard-header">
          <h1 className="dashboard-title">Carregamento Expedição</h1>
          <p className="dashboard-subtitle">
            Gerencie os carregamentos de forma eficiente
          </p>
        </div>

        {/* Controles principais */}
        <div className="dashboard-controls">
          <div className="control-group">
            <label htmlFor="data" className="control-label">
              Data do Carregamento
            </label>
            <input
              type="date"
              id="data"
              className="control-input"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
            />
          </div>

          <div className="control-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/consulta")}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <span>Consultar</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/placas")}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Gerenciar Placas</span>
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card stat-pending">
            <span className="stat-value">{stats.naoIniciados}</span>
            <span className="stat-label">Não Iniciados</span>
          </div>
          <div className="stat-card stat-progress">
            <span className="stat-value">{stats.emAndamento}</span>
            <span className="stat-label">Em Andamento</span>
          </div>
          <div className="stat-card stat-done">
            <span className="stat-value">{stats.finalizados}</span>
            <span className="stat-label">Finalizados</span>
          </div>
        </div>

        {/* Formulário de informações */}
        <InformacoesForm
          dataSelecionada={dataSelecionada}
          showMessage={showMessage}
        />

        {/* Tabela de placas */}
        <div className="section">
          <h2 className="section-title">Placas do Dia</h2>
          <PlateTable
            plates={plates}
            selectedPlate={selectedPlate}
            onSelect={handleSelectPlate}
          />
        </div>

        {/* Detalhes da placa selecionada */}
        {selectedPlate && (
          <div className="section">
            <h2 className="section-title">Detalhes do Carregamento</h2>
            <PlateDetails
              selectedPlate={selectedPlate}
              equipe={equipe}
              setEquipe={setEquipe}
              conferente={conferente}
              setConferente={setConferente}
              tempo={tempo}
            />
            <Actions
              onStart={handleStart}
              onFinish={handleFinish}
              onPause={handlePause}
              isPaused={false}
              loading={loading}
              status={selectedPlate.status}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
