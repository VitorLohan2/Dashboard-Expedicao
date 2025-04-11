// src/Dashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 IMPORTANTE
import PlateTable from './PlateTable';
import PlateDetails from './PlateDetails';
import Actions from './Actions';
import axios from 'axios';
import '../App.css';

const App = () => {
  const navigate = useNavigate(); // 👈 Para navegar para a rota de consulta

  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });

  const [plates, setPlates] = useState([
    { placa: "TM24R22", modelo: "0001", codigoBarra: "TM24R22-045", status: "Não iniciado" },
    { placa: "XYZ9Z87", modelo: "0002", codigoBarra: "XYZ9Z87-123", status: "Não iniciado" },
    { placa: "QWE2R34", modelo: "0003", codigoBarra: "QWE2R34-078", status: "Não iniciado" },
    { placa: "QWE2R35", modelo: "0003", codigoBarra: "QWE2R35-078", status: "Não iniciado" },
    { placa: "QWE2R36", modelo: "0003", codigoBarra: "QWE2R36-078", status: "Não iniciado" },
    { placa: "QWE2R37", modelo: "0003", codigoBarra: "QWE2R37-078", status: "Não iniciado" },
    { placa: "QWE2R38", modelo: "0003", codigoBarra: "QWE2R38-078", status: "Não iniciado" },
    { placa: "QWE2R39", modelo: "0003", codigoBarra: "QWE2R39-078", status: "Não iniciado" },
    { placa: "QWE2R40", modelo: "0003", codigoBarra: "QWE2R40-078", status: "Não iniciado" },
    { placa: "QWE2R41", modelo: "0003", codigoBarra: "QWE2R41-078", status: "Não iniciado" },
    { placa: "QWE2R42", modelo: "0003", codigoBarra: "QWE2R42-078", status: "Não iniciado" },
    { placa: "QWE2R43", modelo: "0003", codigoBarra: "QWE2R43-078", status: "Não iniciado" },
    { placa: "QWE2R44", modelo: "0003", codigoBarra: "QWE2R44-078", status: "Não iniciado" },
    { placa: "QWE2R45", modelo: "0003", codigoBarra: "QWE2R45-078", status: "Não iniciado" },
    { placa: "QWE2R47", modelo: "0003", codigoBarra: "QWE2R47-078", status: "Não iniciado" },
  ]);

  const [selectedPlate, setSelectedPlate] = useState(null);
  const [equipe, setEquipe] = useState('');
  const [conferente, setConferente] = useState('');
  const [tempo, setTempo] = useState('00:00:00');
  const [timerInterval, setTimerInterval] = useState(null);

  const formatarTempo = (segundos) => {
    const h = String(Math.floor(segundos / 3600)).padStart(2, '0');
    const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    const s = String(segundos % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const iniciarCronometro = () => {
    const start = Date.now();

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setTempo(formatarTempo(diff));
    }, 1000);

    setTimerInterval(interval);
  };

  const pararCronometro = () => {
    clearInterval(timerInterval);
    setTimerInterval(null);
  };

  const handleSelectPlate = (plate) => {
    setSelectedPlate(plate);
    setTempo('00:00:00');
    pararCronometro();
    setEquipe('');
    setConferente('');
  };

  const handleStart = async () => {
    if (!selectedPlate || !equipe || !conferente) {
      alert("Selecione uma placa e preencha os campos.");
      return;
    }

    const updated = plates.map(p =>
      p.codigoBarra === selectedPlate.codigoBarra
        ? { ...p, status: "Em andamento" }
        : p
    );
    setPlates(updated);
    iniciarCronometro();

    try {
      const res = await axios.post('http://localhost:3001/carregamentos', {
        placa: selectedPlate.placa,
        modelo: selectedPlate.modelo,
        codigoBarra: selectedPlate.codigoBarra,
        status: "Em andamento",
        equipe,
        conferente,
        tempo: "00:00:00",
        data: dataSelecionada
      });

      if (res.data.carregamento && res.data.carregamento.id) {
        setSelectedPlate(prev => ({ ...prev, id: res.data.carregamento.id }));
      }
    } catch (error) {
      console.error("Erro ao iniciar:", error);
    }
  };

  const handleFinish = async () => {
    if (!selectedPlate) return;

    pararCronometro();

    try {
      const res = await axios.put(`http://localhost:3001/carregamentos/${selectedPlate.id}/finalizar`);
      const finalizado = res.data.carregamento;

      const updated = plates.map(p =>
        p.codigoBarra === finalizado.codigoBarra ? finalizado : p
      );
      setPlates(updated);
      setSelectedPlate(finalizado);
    } catch (error) {
      console.error("Erro ao finalizar:", error);
    }
  };

  return (
    <div className="container">
      <h1>Carregamento Expedição</h1>

      <div className="data-seletor">
      <div className="data-e-botao">
      <label htmlFor="data">Selecione a Data:</label>
      <input
          type="date"
          id="data"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
        />
        </div>
        <button onClick={() => navigate('/consulta')} className="btn-consulta">
          🔍 Consulta
        </button>
      </div>

      <PlateTable
        plates={plates}
        selectedPlate={selectedPlate}
        onSelect={handleSelectPlate}
      />

      {selectedPlate && (
        <>
          <PlateDetails
            selectedPlate={selectedPlate}
            equipe={equipe}
            setEquipe={setEquipe}
            conferente={conferente}
            setConferente={setConferente}
            tempo={tempo}
          />
          <Actions onStart={handleStart} onFinish={handleFinish} />
        </>
      )}
    </div>
  );
};

export default App;
