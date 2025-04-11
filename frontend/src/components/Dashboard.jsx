// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlateTable from './PlateTable';
import PlateDetails from './PlateDetails';
import Actions from './Actions';
import axios from 'axios';
import '../App.css';

const Dashboard = () => {
  // Declare todas as variáveis de estado primeiro
  const navigate = useNavigate();
  
  // Estados para datas e listagem
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  });

  const [plates, setPlates] = useState([
    { placa: "TM24R22", modelo: "0001", codigoBarra: "TM24R22-045", status: "Não iniciado" },
    { placa: "TM24R23", modelo: "0002", codigoBarra: "TM24R23-045", status: "Não iniciado" }
    // ... (seus dados existentes)
  ]);

  const [selectedPlate, setSelectedPlate] = useState(null);
  const [equipe, setEquipe] = useState('');
  const [conferente, setConferente] = useState('');
  const [tempo, setTempo] = useState('00:00:00');
  const [timerInterval, setTimerInterval] = useState(null);

  // Funções auxiliares
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

  // Handlers de eventos
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
        //data: dataAjustada.toISOString().split('T')[0] ANALISAR!
      });

      if (res.data.carregamento?.id) {
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

export default Dashboard;