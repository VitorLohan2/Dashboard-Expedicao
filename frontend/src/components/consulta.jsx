// src/components/consulta.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Consulta.css';

const Consulta = () => {
  const [data, setData] = useState('');
  const [carregamentos, setCarregamentos] = useState([]);
  const navigate = useNavigate();

  const buscarCarregamentos = async () => {
    if (!data) return alert("Selecione uma data!");

    try {
      const response = await axios.get(`http://localhost:3001/carregamentos?data=${data}`);
      const finalizados = response.data.filter(item => item.status === "Finalizado");

      finalizados.sort((a, b) => new Date(a.horaInicio) - new Date(b.horaInicio));
      setCarregamentos(finalizados);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  return (
    <div className="consulta-container">
      <h2>Consulta de Carregamentos 🔍</h2>

      <div className="filtro-data">
        <label htmlFor="data">Data:</label>
        <input
          type="date"
          id="data"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
        <button onClick={buscarCarregamentos}>Buscar</button>
        <button className="btn-voltar" onClick={() => navigate('/')}>⬅ Voltar</button>
      </div>

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
          {carregamentos.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.placa}</strong></td>
              <td>{item.modelo}</td>
              <td>{item.equipe}</td>
              <td>{item.conferente}</td>
              <td>{item.horaInicio}</td>
              <td>{item.horaFim}</td>
              <td>{item.tempo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Consulta;
