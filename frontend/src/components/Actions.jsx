// src/components/Actions.jsx
import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSquareCheck,
  faTruckFast,
  faPause,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/Actions.css";

const Actions = ({ onStart, onFinish, onPause, isPaused, loading, status }) => {
  const isStarted = status === "Em andamento" || status === "Finalizado";
  const isFinished = status === "Finalizado";

  return (
    <div className="actions-container">
      <button
        className="action-btn action-start"
        onClick={onStart}
        disabled={loading || isStarted}
        aria-label="Iniciar carregamento"
      >
        <FontAwesomeIcon icon={faTruckFast} flip="horizontal" />
        <span>Iniciar</span>
      </button>

      <button
        className="action-btn action-finish"
        onClick={onFinish}
        disabled={loading || !isStarted || isFinished}
        aria-label="Finalizar carregamento"
      >
        <FontAwesomeIcon icon={faSquareCheck} />
        <span>Finalizar</span>
      </button>

      <button
        className="action-btn action-pause"
        onClick={onPause}
        disabled={loading || !isStarted || isFinished}
        aria-label={isPaused ? "Retomar carregamento" : "Pausar carregamento"}
      >
        <FontAwesomeIcon icon={isPaused ? faPlay : faPause} />
        <span>{isPaused ? "Retomar" : "Pausar"}</span>
      </button>
    </div>
  );
};

Actions.propTypes = {
  onStart: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  isPaused: PropTypes.bool,
  loading: PropTypes.bool,
  status: PropTypes.string,
};

Actions.defaultProps = {
  isPaused: false,
  loading: false,
  status: "Não iniciado",
};

export default Actions;
