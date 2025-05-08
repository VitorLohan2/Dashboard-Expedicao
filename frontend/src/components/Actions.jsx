// src/components/Actions.jsx
import React from 'react';

const Actions = ({ onStart, onFinish, onPause, isPaused }) => {
  return (
    <div className="actions">
      <button className="btn iniciar" onClick={onStart}>
        🚚 Iniciar Carregamento
      </button>
      <button className="btn finalizar" onClick={onFinish}>
        ✅ Finalizar Carregamento
      </button>
      <button className="btn pausar" onClick={onPause}>
        {isPaused ? '▶️ Retomar Carregamento' : '⏸️ Pausar Carregamento'}
      </button>
    </div>
  );
};

export default Actions;


