// src/components/consulta.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Consulta.css';
import api from '../services/api'; //Servidor

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { faArrowLeft, faDownload, faTruckFront, faClipboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import '@fontsource/inter/400.css';

import lupaImg from '../assets/lupa.png';

const Consulta = () => {
  const [data, setData] = useState('');
  const [carregamentos, setCarregamentos] = useState([]);
  const [tempoTotal, setTempoTotal] = useState('');
  const [infoGerais, setInfoGerais] = useState(null);
  const [contagemConferentes, setContagemConferentes] = useState({});
  const navigate = useNavigate();

  const formatarHorario = (isoString) => {
    if (!isoString) return '-'; // retorno padrão
    try {
      const data = new Date(isoString);
      if (isNaN(data.getTime())) return '-';
      return data.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const gerarPDF = () => {
    if (carregamentos.length === 0) {
      alert("Nenhum carregamento finalizado para gerar relatório.");
      return;
    }
  
    const doc = new jsPDF();
  
    // Função corrigida para verificar horários
    const isHorarioDestaque = (horario) => {
      try {
        // Verifica se é string e tem formato de horário
        if (typeof horario !== 'string' || !horario.includes(':')) return false;
        
        const [horaStr] = horario.split(':');
        const hora = parseInt(horaStr, 10);
        
        // Verifica se é número válido
        if (isNaN(hora)) return false;
        
        return (hora >= 0 && hora < 4) || (hora >= 8 && hora < 12);
      } catch {
        return false;
      }
    };
  
    // Restante do cabeçalho permanece igual
    doc.setFontSize(16);
    doc.text('Relatório de Carregamentos Finalizados', 14, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${data}`, 14, 28);
    doc.text(`Tempo Total: ${tempoTotal}`, 14, 35);
    doc.text(`Total de Caminhões: ${carregamentos.length}`, 14, 42);

    // Informações Gerais (mantido igual)
    if (infoGerais) {
      const startY = 52;
      const colWidth = 45;
      
      doc.setFontSize(12);
      doc.text('Informações Gerais:', 14, startY);
      doc.setFillColor(240, 240, 240);
      doc.rect(14, startY + 2, 180, 10, 'F');
      doc.setFont(undefined, 'bold');
      doc.text(`Pedidos: ${infoGerais.totalPedidos || '-'}`, 16, startY + 8);
      doc.text(`Zona 1: ${infoGerais.confZonas || '-'}`, 5 + colWidth, startY + 8);
      doc.text(`Carregamento: ${infoGerais.zonaum || '-'}`, -5 + colWidth * 2, startY + 8);
      doc.text(`Carregamento Manhã: ${infoGerais.carregmanha || '-'}`, 0 + colWidth * 3, startY + 8);
      doc.setFont(undefined, 'normal');
    }
  
    // Tabela com tratamento seguro dos horários
    const tableData = carregamentos.map(item => {
      const inicioFormatado = formatarHorario(item.horaInicio) || '-';
      const fimFormatado = formatarHorario(item.horaFim) || '-';
      
      return [
        item.placa,
        item.modelo || '-',
        item.equipe || '-',
        item.conferente || '-',
        inicioFormatado,
        fimFormatado,
        item.tempo || '-'
      ];
    });
  
    autoTable(doc, {
      startY: infoGerais ? 70 : 45,
      head: [['Placa', 'Modelo', 'Equipe', 'Conferente', 'Início', 'Fim', 'Tempo']],
      body: tableData,
      didDrawCell: (data) => {
        if (data.column.index === 4 || data.column.index === 5) {
          try {
            const horario = data.cell.text[0]; // Acessa o texto da célula corretamente
            if (isHorarioDestaque(horario)) {
              doc.setFillColor(255, 200, 200);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              doc.setTextColor(255, 0, 0);
              doc.text(horario, data.cell.x + 2, data.cell.y + 5);
            }
          } catch (e) {
            console.error("Erro ao processar horário:", e);
          }
        }
      }
    });
  
    doc.save(`relatorio_carregamentos_${data}.pdf`);
  };
  
  const buscarCarregamentos = async () => {
    if (!data) return alert("Selecione uma data!");

    try {
      const response = await api.get(`/carregamentos?data=${data}`);
      const finalizados = response.data.filter(item => item.status === "Finalizado");

      finalizados.sort((a, b) => new Date(a.horaInicio) - new Date(b.horaInicio));
      setCarregamentos(finalizados);
      
      // Calcular contagem por conferente
      const contagem = finalizados.reduce((acc, item) => {
        const conferente = item.conferente || 'Sem conferente';
        acc[conferente] = (acc[conferente] || 0) + 1;
        return acc;
      }, {});
      
      setContagemConferentes(contagem);

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
      
      // Buscar informações gerais
      const infoRes = await api.get(`/informacoes-gerais/${data}`);
      setInfoGerais(infoRes.data);
    
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setInfoGerais(null); // Limpa caso não haja
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
        <button className="btn-voltar" onClick={() => navigate('/dashboard')}>
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
      
      {infoGerais && (
 <div className="info-gerais-container">
 <h3><FontAwesomeIcon icon={faClipboard}></FontAwesomeIcon>Informações Gerais da Expedição</h3>
 <div className="info-gerais-linha">
   <div className="info-item">Total de Pedidos: <strong>{infoGerais.totalPedidos || '-'}</strong></div>
   <div className="info-item">Zona 1 (Conferência): {infoGerais.confZonas || '-'}</div>
   <div className="info-item">Carregamento: {infoGerais.zonaum || '-'}</div>
   <div className="info-item">Carregamento Manhã: {infoGerais.carregmanha || '-'}</div>
   <div className="info-item">Total de Caminhões: <strong>{carregamentos.length}</strong></div>
 </div>
</div>
      )}

      {Object.keys(contagemConferentes).length > 0 && (
        <div className="contagem-conferentes">
          <h3><FontAwesomeIcon icon={faTruckFront}></FontAwesomeIcon> Caminhões por Conferente</h3>
          <div className="conferentes-grid">
            {Object.entries(contagemConferentes).map(([conferente, quantidade]) => (
              <div key={conferente} className="conferente-item">
                <span className="conferente-nome">{conferente}:</span>
                <span className="conferente-quantidade">{quantidade}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Modelo</th>
            <th>Equipe</th>
            <th>Conferente</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Tempo</th>
          </tr>
        </thead>
        <tbody className="efectlist">
          {carregamentos.map((item, index) => {
            const inicio = formatarHorario(item.horaInicio);
            const fim = formatarHorario(item.horaFim);
            const horaInicio = inicio ? parseInt(inicio.split(':')[0], 10) : null;
            const horaFim = fim ? parseInt(fim.split(':')[0], 10) : null;
            
            const destaqueInicio = horaInicio !== null && ((horaInicio >= 0 && horaInicio < 4) || (horaInicio >= 8 && horaInicio < 12));
            const destaqueFim = horaFim !== null && ((horaFim >= 0 && horaFim < 4) || (horaFim >= 8 && horaFim < 12));
            
            return (
              <tr key={index}>
                <td><strong>{item.placa}</strong></td>
                <td>{item.modelo}</td>
                <td>{item.equipe}</td>
                <td>{item.conferente}</td>
                <td className={destaqueInicio ? 'horario-destaque' : ''}>{inicio}</td>
                <td className={destaqueFim ? 'horario-destaque' : ''}>{fim}</td>
                <td>{item.tempo}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Consulta;

