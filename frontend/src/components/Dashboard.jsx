// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PlateTable from './PlateTable';
import PlateDetails from './PlateDetails';
import Actions from './Actions';
import InformacoesForm from "../components/InformacoesForm";
import axios from 'axios';
import api from '../services/api';
import '../App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/toastStyles.css';
import logo from '../assets/logo2.png';
import '@fontsource/inter/400.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  });

  const [plates, setPlates] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState(null);
  const [equipe, setEquipe] = useState('');
  const [conferente, setConferente] = useState('');
  const [tempo, setTempo] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [totalPedidos, settotalPedidos] = useState('');
  const [confZonas, setconfZonas] = useState('');
  const [zonaum, setzonaum] = useState('');
  const [termino, settermino] = useState('');
  const [termino2, settermino2] = useState('');

  useEffect(() => {
    toast.info('⚠️ Atenção: Confira a data selecionada antes de iniciar os carregamentos.', {
      position: 'top-center',
      autoClose: 8000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: 'toast-aviso-importante',
    });
  }, []);

  useEffect(() => {
    const fetchPlates = async () => {
      try {
        const res = await api.get(`/carregamentos?data=${dataSelecionada}`);
        const placasFormatadas = res.data
          .filter(item => item.placa && item.placa.trim() !== "")
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

        // Verificar se a placa anteriormente selecionada ainda existe na nova lista
        if (selectedPlate) {
          const placaAtualizada = placasFormatadas.find(p => p.idPlaca === selectedPlate.idPlaca);
          if (placaAtualizada) {
            handleSelectPlate(placaAtualizada);
          } else {
            setSelectedPlate(null);
            setTempo('00:00:00');
            setEquipe('');
            setConferente('');
          }
        }

      } catch (err) {
        console.error("Erro ao buscar placas:", err);
        toast.warning("⚠️ Não foi possível carregar placas salvas.");
      }
    };
    fetchPlates();
  }, [dataSelecionada]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatarTempo = (segundos) => {
    const h = String(Math.floor(segundos / 3600)).padStart(2, '0');
    const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    const s = String(segundos % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const iniciarCronometro = (segundosJaDecorridos = 0) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    segundosJaDecorridos = Math.max(0, segundosJaDecorridos);
    const start = Date.now() - segundosJaDecorridos * 1000;

    timerRef.current = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      setTempo(formatarTempo(diff));
    }, 1000);
  };

  const pararCronometro = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSelectPlate = (plate) => {
    setSelectedPlate(plate);
    setEquipe(plate.equipe || '');
    setConferente(plate.conferente || '');
    pararCronometro();
    setTempo('00:00:00');
  
    if (plate.status === 'Em andamento' && plate.horaInicio) {
      try {
        const inicio = new Date(plate.horaInicio);
        if (isNaN(inicio.getTime())) throw new Error('Data inválida de início');
  
        const fim = plate.horaFim ? new Date(plate.horaFim) : null;
        if (fim && isNaN(fim.getTime())) throw new Error('Data inválida de fim');
  
        const diff = Math.floor((Date.now() - inicio.getTime()) / 1000);
        if (diff > 0 && diff < 86400) {
          setTempo(formatarTempo(diff));
          iniciarCronometro(diff);
        } else {
          setTempo('00:00:00');
        }
  
      } catch (error) {
        console.error("Erro ao calcular tempo:", error);
        setTempo('00:00:00');
        toast.error(`⚠️ Erro: ${error.message}`);
      }
    } else {
      setTempo(plate.tempo || '00:00:00');
    }
  };
  

  const handleStart = async () => {
    if (!selectedPlate || !equipe.trim() || !conferente.trim()) {
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

      const atualizado = { ...selectedPlate, ...res.data.carregamento };

      if (res.data.alerta) {
        toast.warning("⚠️ Dados dessa placa já existiam e foram sobrescritos!", { className: 'toast-error' });
      } else {
        toast.success("✅ Carregamento iniciado com sucesso!", { className: 'toast-success' });
      }

      setTempo('00:00:00');
      iniciarCronometro(0);

      const updatedPlates = plates.map(p =>
        p.idPlaca === atualizado.idPlaca ? atualizado : p
      );

      setPlates(updatedPlates);
      setSelectedPlate(atualizado);

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
        <button 
        className="btn-consulta" 
        onClick={() => navigate('/consulta')}>
        <span className="text">Consulta</span>
        <span className="icon-wrapper">
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
        </button>
      </div>
      <InformacoesForm
      selectedPlate={selectedPlate}
      dataSelecionada={dataSelecionada}
      />
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
