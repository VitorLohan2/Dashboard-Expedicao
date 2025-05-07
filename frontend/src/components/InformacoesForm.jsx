// src/components/InformacoesForm.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../InformacoesForm.css";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const InformacoesForm = ({ dataSelecionada }) => {
  const [totalPedidos, setTotalPedidos] = useState("");
  const [confZonas, setConfZonas] = useState("");
  const [zonaum, setZonaum] = useState("");
  const [carregmanha, setcarregmanha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Carrega informações já salvas quando a dataSelecionada mudar
  useEffect(() => {
    const carregarInformacoes = async () => {
      if (!dataSelecionada) return;
  
      try {
        const response = await api.get(`/informacoes-gerais/${dataSelecionada}`);
        const dados = response.data;
  
        setTotalPedidos(dados.totalPedidos || "");
        setConfZonas(dados.confZonas || "");
        setZonaum(dados.zonaum || "");
        setcarregmanha(dados.carregmanha || "");
      } catch (error) {
        if (error.response?.status === 404) {
          console.log("Nenhuma informação encontrada para a data selecionada. Será criada ao salvar.");
          setTotalPedidos("");
          setConfZonas("");
          setZonaum("");
          setcarregmanha("");
        } else {
          console.error("Erro ao carregar informações:", error);
        }
      }
    };
  
    carregarInformacoes();
  }, [dataSelecionada]);  

  const handleRegistrarInformacoes = async () => {
    if (!dataSelecionada) {
      toast.warn("⚠️ Selecione uma data antes de registrar os dados.");
      return;
    }

    setIsLoading(true);
    try {
      await api.put(`/informacoes-gerais/${dataSelecionada}`, {
        totalPedidos,
        confZonas,
        zonaum,
        carregmanha,
      });

      toast.success("✅ Informações gerais registradas com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar informações:", error);
      toast.error("❌ Erro ao registrar as informações.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="informacoes-form-container">
      <div className="campo">
        <label>TOTAL PEDIDOS</label>
        <input
          type="number"
          value={totalPedidos}
          onChange={(e) => setTotalPedidos(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <div className="campo">
        <label>ZONA 1 (CONFERÊNCIA)</label>
        <input
          type="time"
          value={confZonas}
          onChange={(e) => setConfZonas(e.target.value)}
        />
      </div>

      <div className="campo">
        <label>CARREGAMENTO</label>
        <input
          type="time"
          value={zonaum}
          onChange={(e) => setZonaum(e.target.value)}
        />
      </div>

      <div className="campo">
        <label>CARREGAMENTO MANHÃ</label>
        <input
          type="time"
          value={carregmanha}
          onChange={(e) => setcarregmanha(e.target.value)}
        />
      </div>

      <div className="campo botao">
        <button onClick={handleRegistrarInformacoes} disabled={isLoading}>
          <span className="text">Registrar</span>
          <span className="icon-wrapper">
            <FontAwesomeIcon icon={faArrowRight} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default InformacoesForm;
