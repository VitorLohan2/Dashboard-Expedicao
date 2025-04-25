/// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlateTable from './PlateTable';
import PlateDetails from './PlateDetails';
import Actions from './Actions';
import axios from 'axios';

import api from '../services/api'; // ajuste o caminho conforme sua estrutura

import '../App.css';
import { ToastContainer, toast } from 'react-toastify'; //Notificação
import 'react-toastify/dist/ReactToastify.css';
import '../styles/toastStyles.css';
import logo from '../assets/logo2.png';

import '@fontsource/inter/400.css';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    toast.info('⚠️ Atenção: Confira a data selecionada antes de iniciar os carregamentos.', {
      position: 'top-center',
      autoClose: 8000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: 'toast-aviso-importante', // <- classe customizada
    });
  }, []);

  useEffect(() => {
    const fetchPlates = async () => {
      try {
        const res = await api.get(`/carregamentos?data=${dataSelecionada}`);
        const placasFormatadas = res.data
          .filter(item => item.placa && item.placa.trim() !== "") // <-- filtra placas vazias
          .map(item => ({
          id: item._id,
          idPlaca: item.idPlaca,
          placa: item.placa,
          modelo: item.modelo,
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

  const iniciarCronometro = (segundosJaDecorridos = 0) => {
    const start = Date.now() - segundosJaDecorridos * 1000;
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
    setEquipe(plate.equipe || '');
    setConferente(plate.conferente || '');
    pararCronometro();

    if (plate.status === 'Em andamento' && plate.horaInicio) {
      const inicio = new Date(plate.horaInicio);
      const diff = Math.floor((Date.now() - new Date(inicio).getTime()) / 1000);
      setTempo(formatarTempo(diff));
      iniciarCronometro(diff);
    } else {
      setTempo(plate.tempo || '00:00:00');
    }
  };

  const handleStart = async () => {
    if (!selectedPlate || !equipe || !conferente) {
      toast.error("⚠️ Preencha todos os campos antes de iniciar!");
      return;
    }

    if (selectedPlate.status === 'Em andamento' || selectedPlate.status === 'Finalizado') {
      toast.info("⚠️ Essa placa já foi iniciada ou finalizada.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.put(`/carregamentos/${selectedPlate.idPlaca}/iniciar`, {
        equipe,
        conferente,
        data: dataSelecionada
      });

      const atualizado = res.data.carregamento;

      if (res.data.alerta) {
        toast.warning("⚠️ Dados dessa placa já existiam e foram sobrescritos!", { className: 'toast-error' });
      } else {
        toast.success("✅ Carregamento iniciado com sucesso!", { className: 'toast-success' });
      }

      const updated = plates.map(p => p.idPlaca === atualizado.idPlaca ? atualizado : p);
      setPlates(updated);
      setSelectedPlate(atualizado);

      if (atualizado.horaInicio) {
        const diff = Math.floor((Date.now() - new Date(atualizado.horaInicio).getTime()) / 1000);
        setTempo(formatarTempo(diff));
        iniciarCronometro(diff);
      }
    } catch (error) {
      console.error("Erro ao iniciar:", error);
      toast.error("❌ Erro ao iniciar o carregamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedPlate) return;

    if (selectedPlate.status !== 'Em andamento') {
      toast.info("⚠️ Essa placa ainda não foi iniciada.");
      return;
    }

    setLoading(true);
    pararCronometro();

    try {
      const res = await api.put(`/carregamentos/${selectedPlate.idPlaca}/finalizar`, {
        data: dataSelecionada
      });

      const finalizado = res.data.carregamento;
      const updated = plates.map(p => p.idPlaca === finalizado.idPlaca ? finalizado : p);
      setPlates(updated);
      setSelectedPlate(finalizado);

      toast.success("✅ Carregamento finalizado com sucesso!", { className: 'toast-success' });
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      toast.error("❌ Erro ao finalizar o carregamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo-wrapper">
        <img src={logo} alt="Logo da Empresa" className="logo" />
      </div>

      <h1 className="titulo-dashboard">Carregamento Expedição</h1>
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
          <Actions
            onStart={handleStart}
            onFinish={handleFinish}
            loading={loading}
          />
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

