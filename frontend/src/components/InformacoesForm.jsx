// src/components/InformacoesForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import "../styles/InformacoesForm.css";

const InformacoesForm = ({ dataSelecionada, showMessage }) => {
  const [formData, setFormData] = useState({
    totalPedidos: "",
    confZonas: "",
    zonaum: "",
    carregmanha: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Carrega informações quando a data muda
  const carregarInformacoes = useCallback(async () => {
    if (!dataSelecionada) return;

    try {
      const response = await api.get(`/informacoes-gerais/${dataSelecionada}`);
      const { totalPedidos, confZonas, zonaum, carregmanha } = response.data;

      setFormData({
        totalPedidos: totalPedidos || "",
        confZonas: confZonas || "",
        zonaum: zonaum || "",
        carregmanha: carregmanha || "",
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setFormData({
          totalPedidos: "",
          confZonas: "",
          zonaum: "",
          carregmanha: "",
        });
      } else {
        console.error("Erro ao carregar informações:", error);
      }
    }
  }, [dataSelecionada]);

  useEffect(() => {
    carregarInformacoes();
  }, [carregarInformacoes]);

  // Handlers
  const handleChange = (field) => (e) => {
    const value =
      field === "totalPedidos"
        ? e.target.value.replace(/\D/g, "")
        : e.target.value;

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!dataSelecionada) {
      showMessage?.(
        "warning",
        "Selecione uma data antes de registrar os dados.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await api.put(`/informacoes-gerais/${dataSelecionada}`, formData);
      showMessage?.("success", "Informações gerais registradas com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar informações:", error);
      showMessage?.("error", "Erro ao registrar as informações.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="informacoes-section">
      <h3 className="informacoes-title">
        <FontAwesomeIcon icon={faInfoCircle} />
        Informações Gerais do Dia
      </h3>
      <div className="informacoes-form">
        <div className="campo">
          <label htmlFor="totalPedidos">Total Pedidos</label>
          <input
            id="totalPedidos"
            type="number"
            value={formData.totalPedidos}
            onChange={handleChange("totalPedidos")}
            placeholder="0"
          />
        </div>

        <div className="campo">
          <label htmlFor="confZonas">Zona 1 (Conferência)</label>
          <input
            id="confZonas"
            type="time"
            value={formData.confZonas}
            onChange={handleChange("confZonas")}
          />
        </div>

        <div className="campo">
          <label htmlFor="zonaum">Carregamento</label>
          <input
            id="zonaum"
            type="time"
            value={formData.zonaum}
            onChange={handleChange("zonaum")}
          />
        </div>

        <div className="campo">
          <label htmlFor="carregmanha">Carregamento Manhã</label>
          <input
            id="carregmanha"
            type="time"
            value={formData.carregmanha}
            onChange={handleChange("carregmanha")}
          />
        </div>

        <div className="campo botao">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            <span>{isLoading ? "Salvando..." : "Registrar"}</span>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

InformacoesForm.propTypes = {
  dataSelecionada: PropTypes.string.isRequired,
  showMessage: PropTypes.func,
};

export default InformacoesForm;
