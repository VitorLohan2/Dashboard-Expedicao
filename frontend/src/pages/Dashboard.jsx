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
import {
  faMagnifyingGlass,
  faPlus,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// Utils
import { formatarTempo, calcularSegundosDecorridos } from "../utils/timeUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const isPausedRef = useRef(false);
  const pausedTimeRef = useRef(0);

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState(null);
  const [platesTempos, setPlatesTempos] = useState({});

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
      // Evita re-seleção da mesma placa
      if (selectedPlate?.idPlaca === plate.idPlaca) {
        return;
      }

      setSelectedPlate(plate);
      setEquipe(plate.equipe || "");
      setConferente(plate.conferente || "");
      setIsPaused(plate.isPaused || false);
      isPausedRef.current = plate.isPaused || false;

      // O tempo será atualizado pelo timer global
      if (platesTempos[plate.idPlaca]) {
        setTempo(platesTempos[plate.idPlaca]);
      } else {
        setTempo(plate.tempo || "00:00:00");
      }
    },
    [selectedPlate, platesTempos],
  );

  // Buscar placas
  useEffect(() => {
    const fetchPlates = async () => {
      setInitialLoading(true);
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
            isPaused: item.isPaused || false,
            tempoPausado: item.tempoPausado || 0,
            horaPausa: item.horaPausa || null,
          }));

        setPlates(placasFormatadas);

        // Atualiza dados da placa selecionada sem re-selecionar
        setSelectedPlate((prevSelected) => {
          if (prevSelected) {
            const placaAtualizada = placasFormatadas.find(
              (p) => p.idPlaca === prevSelected.idPlaca,
            );
            if (placaAtualizada) {
              // Atualiza os campos se mudaram
              setEquipe(placaAtualizada.equipe || "");
              setConferente(placaAtualizada.conferente || "");
              return placaAtualizada;
            } else {
              // Placa não existe mais, limpa tudo
              pararCronometro();
              setTempo("00:00:00");
              setEquipe("");
              setConferente("");
              setIsPaused(false);
              isPausedRef.current = false;
              pausedTimeRef.current = 0;
              return null;
            }
          }
          return null;
        });
      } catch (err) {
        console.error("Erro ao buscar placas:", err);
        showMessage("warning", "Não foi possível carregar as placas.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPlates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada]);

  // Timer global para atualizar tempos de todas as placas
  useEffect(() => {
    // Calcula imediatamente ao montar
    const calcularTodosTempos = () => {
      const novosTempos = {};

      plates.forEach((plate) => {
        if (
          plate.status === "Em andamento" &&
          plate.horaInicio &&
          !plate.isPaused
        ) {
          try {
            const segundosDecorridos = calcularSegundosDecorridos(
              plate.horaInicio,
            );
            const tempoPausado = plate.tempoPausado || 0;
            const tempoReal = Math.max(0, segundosDecorridos - tempoPausado);
            novosTempos[plate.idPlaca] = formatarTempo(tempoReal);
          } catch (error) {
            novosTempos[plate.idPlaca] = plate.tempo || "00:00:00";
          }
        } else if (plate.isPaused && plate.horaInicio && plate.horaPausa) {
          try {
            const tempoAtePausa = calcularSegundosDecorridos(
              plate.horaInicio,
              plate.horaPausa,
            );
            const tempoPausadoAnterior = plate.tempoPausado || 0;
            const tempoReal = Math.max(0, tempoAtePausa - tempoPausadoAnterior);
            novosTempos[plate.idPlaca] = formatarTempo(tempoReal);
          } catch (error) {
            novosTempos[plate.idPlaca] = plate.tempo || "00:00:00";
          }
        } else {
          novosTempos[plate.idPlaca] = plate.tempo || "00:00:00";
        }
      });

      setPlatesTempos(novosTempos);

      // Atualiza o tempo da placa selecionada
      if (selectedPlate && novosTempos[selectedPlate.idPlaca]) {
        setTempo(novosTempos[selectedPlate.idPlaca]);
      }
    };

    // Calcula imediatamente
    calcularTodosTempos();

    // Depois atualiza a cada segundo
    const intervalId = setInterval(calcularTodosTempos, 1000);

    return () => clearInterval(intervalId);
  }, [plates, selectedPlate]);

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

      if (res.data.alerta) {
        showMessage(
          "warning",
          "Dados dessa placa já existiam e foram sobrescritos!",
        );
      } else {
        showMessage("success", "Carregamento iniciado com sucesso!");
      }

      // Recarrega as placas do servidor para garantir sincronização
      const platesRes = await api.get(`/carregamentos?data=${dataSelecionada}`);
      const placasAtualizadas = platesRes.data
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
          isPaused: item.isPaused || false,
          tempoPausado: item.tempoPausado || 0,
          horaPausa: item.horaPausa || null,
        }));

      setPlates(placasAtualizadas);

      // Atualiza a placa selecionada
      const placaSelecionadaAtualizada = placasAtualizadas.find(
        (p) => p.idPlaca === selectedPlate.idPlaca,
      );

      if (placaSelecionadaAtualizada) {
        setSelectedPlate(placaSelecionadaAtualizada);
        setIsPaused(false);
        isPausedRef.current = false;
      }
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

    try {
      const res = await api.put(
        `/carregamentos/${selectedPlate.idPlaca}/finalizar`,
        {
          data: dataSelecionada,
        },
      );

      showMessage("success", "Carregamento finalizado com sucesso!");

      // Recarrega as placas do servidor
      const platesRes = await api.get(`/carregamentos?data=${dataSelecionada}`);
      const placasAtualizadas = platesRes.data
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
          isPaused: item.isPaused || false,
          tempoPausado: item.tempoPausado || 0,
          horaPausa: item.horaPausa || null,
        }));

      setPlates(placasAtualizadas);

      // Atualiza a placa selecionada
      const placaSelecionadaAtualizada = placasAtualizadas.find(
        (p) => p.idPlaca === selectedPlate.idPlaca,
      );

      if (placaSelecionadaAtualizada) {
        setSelectedPlate(placaSelecionadaAtualizada);
        setTempo(placaSelecionadaAtualizada.tempo);
        setIsPaused(false);
        isPausedRef.current = false;
      }
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      showMessage("error", "Erro ao finalizar o carregamento.");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!selectedPlate || selectedPlate.status !== "Em andamento") {
      showMessage("info", "Só é possível pausar carregamentos em andamento.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.put(
        `/carregamentos/${selectedPlate.idPlaca}/pausar`,
        { data: dataSelecionada },
      );

      const atualizado = res.data.carregamento;
      const acao = res.data.acao;
      const tempoEfetivoAtual = res.data.tempoEfetivoAtual;

      // Recarrega as placas do servidor para garantir sincronização
      const platesRes = await api.get(`/carregamentos?data=${dataSelecionada}`);
      const placasAtualizadas = platesRes.data
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
          isPaused: item.isPaused || false,
          tempoPausado: item.tempoPausado || 0,
          horaPausa: item.horaPausa || null,
        }));

      setPlates(placasAtualizadas);

      // Atualiza a placa selecionada
      const placaSelecionadaAtualizada = placasAtualizadas.find(
        (p) => p.idPlaca === selectedPlate.idPlaca,
      );

      if (placaSelecionadaAtualizada) {
        setSelectedPlate(placaSelecionadaAtualizada);
        setIsPaused(placaSelecionadaAtualizada.isPaused);
        isPausedRef.current = placaSelecionadaAtualizada.isPaused;

        // Usa o tempo efetivo calculado pelo servidor para garantir consistência
        if (tempoEfetivoAtual !== undefined) {
          setTempo(formatarTempo(tempoEfetivoAtual));
        }
      }

      if (acao === "pausado") {
        showMessage("info", "Cronômetro pausado!");
      } else {
        showMessage("success", "Cronômetro retomado!");
      }
    } catch (error) {
      console.error("Erro ao pausar/retomar:", error);
      showMessage("error", "Erro ao pausar/retomar o carregamento.");
    } finally {
      setLoading(false);
    }
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
          {initialLoading ? (
            <div className="loading-container">
              <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
              <p className="loading-text">Carregando dados...</p>
            </div>
          ) : (
            <PlateTable
              plates={plates}
              selectedPlate={selectedPlate}
              onSelect={handleSelectPlate}
              platesTempos={platesTempos}
            />
          )}
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
              isPaused={isPaused}
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
