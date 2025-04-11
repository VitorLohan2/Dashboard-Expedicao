// src/components/PlateTable.jsx
import React from 'react';

const PlateTable = ({ plates, onSelect, selectedPlate }) => {
  return (
    <div>
      {/* Cabeçalho fixo */}
      <table>
        <thead>
          <tr>
            <th>Placa do Caminhão</th>
            <th>Status</th>
          </tr>
        </thead>
      </table>

      {/* Corpo rolável */}
      <div className="table-scroll-container">
        <table>
          <tbody>
            {plates.map((plate) => (
              <tr
                key={plate.codigoBarra}
                className={selectedPlate?.codigoBarra === plate.codigoBarra ? 'highlight' : ''}
                onClick={() => onSelect(plate)}
              >
                <td><strong>{plate.placa}</strong></td>
                <td className={`status ${plate.status === 'Não iniciado' ? 'red' : plate.status === 'Em andamento' ? 'blue' : 'green'}`}>
                  {plate.status === 'Não iniciado' && '❌ Não iniciado'}
                  {plate.status === 'Em andamento' && '⏳ Em andamento'}
                  {plate.status === 'Finalizado' && '✅ Finalizado'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlateTable;
