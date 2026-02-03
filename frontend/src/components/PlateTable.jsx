// src/components/PlateTable.jsx
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruck,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faPause,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/PlateTable.css";

// Utils
import { formatarTempo, calcularSegundosDecorridos } from "../utils/timeUtils";

const STATUS_CONFIG = {
  "Não iniciado": {
    icon: faTimesCircle,
    className: "status-pending",
    label: "Não iniciado",
  },
  "Em andamento": {
    icon: faSpinner,
    className: "status-progress",
    label: "Em andamento",
  },
  Finalizado: {
    icon: faCheckCircle,
    className: "status-done",
    label: "Finalizado",
  },
};

// Componente para exibir tempo usando o tempo centralizado
const TempoCell = ({ plate, tempoCentralizado }) => {
  const tempoDisplay = tempoCentralizado || plate.tempo || "00:00:00";
  const isPaused = plate.isPaused;

  return (
    <span className={`tempo-cell ${isPaused ? "tempo-paused" : ""}`}>
      <FontAwesomeIcon icon={isPaused ? faPause : faClock} />
      {tempoDisplay}
    </span>
  );
};

TempoCell.propTypes = {
  plate: PropTypes.object.isRequired,
  tempoCentralizado: PropTypes.string,
};

const PlateTable = ({ plates, onSelect, selectedPlate, platesTempos = {} }) => {
  const renderStatus = (status) => {
    const config = STATUS_CONFIG[status] || {
      icon: faTimesCircle,
      className: "",
      label: status,
    };
    return (
      <span className={`status-badge ${config.className}`}>
        <FontAwesomeIcon icon={config.icon} />
        {config.label}
      </span>
    );
  };

  if (plates.length === 0) {
    return (
      <div className="plate-table-empty">
        <FontAwesomeIcon icon={faTruck} className="empty-icon" />
        <p>Nenhuma placa encontrada para esta data</p>
      </div>
    );
  }

  return (
    <div className="plate-table-wrapper">
      <table className="plate-table">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Modelo</th>
            <th>Tempo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {plates.map((plate) => (
            <tr
              key={plate.codigoBarra || plate.idPlaca}
              className={
                selectedPlate?.codigoBarra === plate.codigoBarra
                  ? "selected"
                  : ""
              }
              onClick={() => onSelect(plate)}
            >
              <td className="td-placa">{plate.placa}</td>
              <td>{plate.modelo}</td>
              <td>
                <TempoCell
                  plate={plate}
                  tempoCentralizado={platesTempos[plate.idPlaca]}
                />
              </td>
              <td>{renderStatus(plate.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

PlateTable.propTypes = {
  plates: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedPlate: PropTypes.object,
  platesTempos: PropTypes.object,
};

PlateTable.defaultProps = {
  selectedPlate: null,
};

export default PlateTable;
