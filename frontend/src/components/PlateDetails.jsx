// src/components/PlateDetails.jsx
import React, { useEffect } from 'react';
import JsBarcode from 'jsbarcode';

const PlateDetails = ({ selectedPlate, equipe, setEquipe, conferente, setConferente, tempo }) => {
  useEffect(() => {
    if (selectedPlate && selectedPlate.codigoBarra) {
      JsBarcode("#barcode", selectedPlate.codigoBarra, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: true
      });
    }
  }, [selectedPlate]); // Agora, 'selectedPlate' é a dependência

  return (
    <div className="details">
      <div>
        <h2>Detalhes da Placa</h2>
        <p><strong>Placa:</strong> {selectedPlate.placa}</p>
        <p><strong>Modelo:</strong> {selectedPlate.modelo}</p>
        <svg
          id="barcode"
          style={{ width: "100%", maxWidth: "100%", height: "auto", maxHeight: "80px", marginTop: "10px" }}>
        </svg>
      </div>
      <div>
        <h2>Equipe & Conferente</h2>
        <label>Equipe:</label>
        <select value={equipe} onChange={(e) => setEquipe(e.target.value)}>
          <option value="">Selecione</option>
          {[...Array(7)].map((_, i) => (
            <option key={i} value={i + 4}>{i + 4} pessoas</option>
          ))}
        </select>

        <label>Conferente:</label>
        <select value={conferente} onChange={(e) => setConferente(e.target.value)}>
          <option value="">Selecione</option>
          {["Renan", "Fellippe", "Lopes", "Alamir", "Douglas", "Lucas", "Robson", "Luis", "Couto", "Camargo", "Jeferson", "Aruan", "Tavares"].map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <p><strong>Tempo:</strong> {tempo}</p>
      </div>
    </div>
  );
};

export default PlateDetails;
