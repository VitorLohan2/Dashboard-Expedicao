// src/components/PlateDetails.jsx
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import JsBarcode from "jsbarcode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faUsers,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/PlateDetails.css";

// Lista de conferentes disponíveis
const CONFERENTES = [
  "Renan",
  "Fellippe",
  "Lopes",
  "Alamir",
  "Douglas",
  "Lucas",
  "Robson",
  "Luis",
  "Couto",
  "Camargo",
  "Jeferson",
  "Aruan",
  "Tavares",
  "Jhonath",
  "Washington",
];

// Opções de equipe (quantidade de pessoas)
const EQUIPE_OPTIONS = Array.from({ length: 7 }, (_, i) => i + 4);

const PlateDetails = ({
  selectedPlate,
  equipe,
  setEquipe,
  conferente,
  setConferente,
  tempo,
}) => {
  useEffect(() => {
    if (selectedPlate?.codigoBarra) {
      JsBarcode("#barcode", selectedPlate.codigoBarra, {
        format: "CODE128",
        lineColor: "#1e3a8a",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    }
  }, [selectedPlate]);

  if (!selectedPlate) return null;

  return (
    <div className="plate-details">
      <div className="details-card">
        <div className="details-header">
          <div className="plate-badge">
            <span className="plate-number">{selectedPlate.placa}</span>
            <span className="plate-model">{selectedPlate.modelo}</span>
          </div>
          <div className="barcode-container">
            <svg id="barcode" className="barcode-svg" />
          </div>
        </div>
      </div>

      <div className="details-form-card">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="equipe">
              <FontAwesomeIcon icon={faUsers} />
              Equipe
            </label>
            <select
              id="equipe"
              value={equipe}
              onChange={(e) => setEquipe(e.target.value)}
              className="form-select"
            >
              <option value="">Selecione...</option>
              {EQUIPE_OPTIONS.map((num) => (
                <option key={num} value={num}>
                  {num} pessoas
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="conferente">
              <FontAwesomeIcon icon={faUserCheck} />
              Conferente
            </label>
            <select
              id="conferente"
              value={conferente}
              onChange={(e) => setConferente(e.target.value)}
              className="form-select"
            >
              <option value="">Selecione...</option>
              {CONFERENTES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group tempo-group">
            <label>
              <FontAwesomeIcon icon={faClock} />
              Tempo
            </label>
            <div className="tempo-display">
              <span className="tempo-value">{tempo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PlateDetails.propTypes = {
  selectedPlate: PropTypes.shape({
    placa: PropTypes.string,
    modelo: PropTypes.string,
    codigoBarra: PropTypes.string,
  }),
  equipe: PropTypes.string.isRequired,
  setEquipe: PropTypes.func.isRequired,
  conferente: PropTypes.string.isRequired,
  setConferente: PropTypes.func.isRequired,
  tempo: PropTypes.string.isRequired,
};

export default PlateDetails;
