// src/components/consulta.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Consulta.css';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { faArrowLeft, faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '@fontsource/inter/400.css';

import lupaImg from '../assets/lupa.png';

const Consulta = () => {
  const [data, setData] = useState('');
  const [carregamentos, setCarregamentos] = useState([]);
  const [tempoTotal, setTempoTotal] = useState('');
  const navigate = useNavigate();

  const formatarHorario = (isoString) => {
    if (!isoString) return '';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const gerarPDF = () => {
    if (carregamentos.length === 0) {
      alert("Nenhum carregamento finalizado para gerar relatório.");
      return;
    }
  
    const doc = new jsPDF();    //RELATÓRIO PDF
  
    doc.setFontSize(16);
    doc.text('Relatório de Carregamentos Finalizados', 14, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${data}`, 14, 28);
    doc.text(`Tempo Total: ${tempoTotal}`, 14, 35);
  
    const tableData = carregamentos.map(item => ([
      item.placa,
      item.modelo || '-',
      item.equipe || '-',
      item.conferente || '-',
      formatarHorario(item.horaInicio),
      formatarHorario(item.horaFim),
      item.tempo || '-'
    ]));
  
    autoTable(doc, {
      startY: 45,
      head: [['Placa', 'Modelo', 'Equipe', 'Conferente', 'Início', 'Fim', 'Tempo']],
      body: tableData,
    });
  
    doc.save(`relatorio_carregamentos_${data}.pdf`);
  };
  
  
  const buscarCarregamentos = async () => {
    if (!data) return alert("Selecione uma data!");

    try {
      const response = await axios.get(`http://localhost:3001/carregamentos?data=${data}`);
      const finalizados = response.data.filter(item => item.status === "Finalizado");

      finalizados.sort((a, b) => new Date(a.horaInicio) - new Date(b.horaInicio));
      setCarregamentos(finalizados);

      // Calcular tempo total
      const totalSegundos = finalizados.reduce((total, item) => {
        const partes = item.tempo?.split(':');
        if (!partes || partes.length !== 3) return total;
        const [h, m, s] = partes.map(Number);
        return total + (h * 3600 + m * 60 + s);
      }, 0);

      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;

      setTempoTotal(`${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  return (
    <div className="consulta-container">
      <h2>
        Consulta de Carregamento <img src={lupaImg} alt="Lupa" style={{ width: '28px', height: '28px' }} />
      </h2>

      <div className="filtro-data">
        <label htmlFor="data">Data:</label>
        <input
          type="date"
          id="data"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
        <button onClick={buscarCarregamentos}><strong>Buscar</strong></button>
        <button className="btn-voltar" onClick={() => navigate('/')}>
          <strong><FontAwesomeIcon icon={faArrowLeft} style={{ color: "#fff", fontSize: "13px" }} /> Voltar</strong>
        </button>
        <button className="btn-relatorio" onClick={gerarPDF}>
        <strong><FontAwesomeIcon icon={faDownload} style={{ color: "#000", fontSize: "13px" }} /> Relatório</strong>
        </button>

      </div>

      {tempoTotal && (
        <div className="tempo-total-destaque">
          ⏱️ <strong>Tempo Total do Dia:</strong> {tempoTotal}
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Roteiro</th>
            <th>Modelo</th>
            <th>Equipe</th>
            <th>Conferente</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Tempo</th>
          </tr>
        </thead>
        <tbody className="efectlist">
          {carregamentos.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.placa}</strong></td>
              <td></td>
              <td>{item.modelo}</td>
              <td>{item.equipe}</td>
              <td>{item.conferente}</td>
              <td>{formatarHorario(item.horaInicio)}</td>
              <td>{formatarHorario(item.horaFim)}</td>
              <td>{item.tempo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Consulta;

