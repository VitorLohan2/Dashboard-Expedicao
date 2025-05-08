// src/components/Actions.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareCheck, faTruckFast } from '@fortawesome/free-solid-svg-icons';

const Actions = ({ onStart, onFinish, onPause, isPaused }) => {
  return (
    <div className="actions">
      <button className="btn iniciar" onClick={onStart}>
      <FontAwesomeIcon icon={faTruckFast} flip="horizontal" size="lg" style={{color: "#e77f08",}}/> Iniciar Carregamento
      </button>
      <button className="btn finalizar" onClick={onFinish}>
      <FontAwesomeIcon icon={faSquareCheck} size="lg" style={{color: "#08bf26",}} /> Finalizar Carregamento
      </button>
      <button className="btn pausar" onClick={onPause}>
        {isPaused ? '▶ Retomar Carregamento' : '⏸ Pausar Carregamento'}
      </button>
    </div>
  );
};

export default Actions;


