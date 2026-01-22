// src/components/PlateTable.jsx
import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruck,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/PlateTable.css";

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

const PlateTable = ({ plates, onSelect, selectedPlate }) => {
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
};

PlateTable.defaultProps = {
  selectedPlate: null,
};

export default PlateTable;
