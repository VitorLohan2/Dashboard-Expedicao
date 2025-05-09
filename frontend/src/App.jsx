// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Consulta from './components/consulta';
import Login from './components/Login';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  // Função para verificar autenticação em rotas protegidas
  const RequireAuth = ({ children }) => {
    return usuarioLogado ? children : <Navigate to="/" replace />;
  };

  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login onLogin={setUsuarioLogado}/>} />
        <Route path="/dashboard" element={ <RequireAuth>
          <Dashboard usuario={usuarioLogado} />
        </RequireAuth>
        } 
        />
        <Route path="/consulta" element={ <RequireAuth> <Consulta /> </RequireAuth> } />
      </Routes>
    </Router>
  );
}

export default App;
