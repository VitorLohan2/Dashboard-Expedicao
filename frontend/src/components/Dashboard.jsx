/// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlateTable from './PlateTable';
import PlateDetails from './PlateDetails';
import Actions from './Actions';
import axios from 'axios';
import '../App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/toastStyles.css';
import logo from '../assets/logo2.png';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';


const Dashboard = () => {
  const navigate = useNavigate();

  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  });

  const [plates, setPlates] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState(null);
  const [equipe, setEquipe] = useState('');
  const [conferente, setConferente] = useState('');
  const [tempo, setTempo] = useState('00:00:00');
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    const fetchPlates = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/carregamentos?data=${dataSelecionada}`);
        const placasFormatadas = res.data.map(item => ({
          id: item._id,
          idPlaca: item.idPlaca,
          placa: item.placa,          // ✅ Adicione isso
          modelo: item.modelo,        // ✅ Corrigir isso
          codigoBarra: item.codigoBarra,
          status: item.status,
          equipe: item.equipe || '',
          conferente: item.conferente || '',
          horaInicio: item.horaInicio,
          horaFim: item.horaFim,
          tempo: item.tempo || '00:00:00'
        }));
        setPlates(placasFormatadas);
      } catch (err) {
        console.error("Erro ao buscar placas:", err);
        toast.warning("⚠️ Não foi possível carregar placas salvas.");
      }
    };
    fetchPlates();
  }, [dataSelecionada]);

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
    setTempo(plate.tempo || '00:00:00');
    setEquipe('');
    setConferente('');
    pararCronometro();
  };

  const handleStart = async () => {
    if (!selectedPlate || !equipe || !conferente) {
      toast.error("⚠️ Preencha todos os campos antes de iniciar!");
      return;
    }

    const updated = plates.map(p =>
      p.idPlaca === selectedPlate.idPlaca
        ? { ...p, status: "Em andamento" }
        : p
    );
    setPlates(updated);
    iniciarCronometro();

    try {
      const res = await axios.put(`http://localhost:3001/carregamentos/${selectedPlate.idPlaca}/iniciar`, {
        equipe,
        conferente,
        data: dataSelecionada
      });

      if (res.data.alerta) {
        toast.warning("⚠️ Dados dessa placa já existiam e foram sobrescritos!", { className: 'toast-error' });
      } else {
        toast.success("✅ Carregamento iniciado com sucesso!", { className: 'toast-success' });
      }

      if (res.data.carregamento?._id) {
        setSelectedPlate(prev => ({ ...prev, id: res.data.carregamento._id }));
      }
    } catch (error) {
      console.error("Erro ao iniciar:", error);
      toast.error("❌ Erro ao iniciar o carregamento.", { className: 'toast-error' });
    }
  };

  const handleFinish = async () => {
    if (!selectedPlate) return;
    pararCronometro();

    try {
      const res = await axios.put(`http://localhost:3001/carregamentos/${selectedPlate.idPlaca}/finalizar`, {
        data: dataSelecionada
      });
      const finalizado = res.data.carregamento;

      const updated = plates.map(p =>
        p.idPlaca === finalizado.idPlaca ? finalizado : p
      );
      setPlates(updated);
      setSelectedPlate(finalizado);
      toast.success("✅ Carregamento finalizado com sucesso!", { className: 'toast-success' });
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast.error("❌ Erro ao finalizar o carregamento.");
    }
  };

  return (
    <div className="container">
      <div className="logo-wrapper">
        <img src={logo} alt="Logo da Empresa" className="logo" />
      </div>

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
          <strong><FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#fff", fontSize: "16px"}} /> Consulta</strong>
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

      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Dashboard;
