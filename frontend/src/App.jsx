// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Consulta from './components/consulta';
import Login from './components/Login';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(true); // 🔄 novo estado

   // 🔄 Recupera usuário do localStorage ao carregar o app
useEffect(() => {
    const usuarioSalvo = localStorage.getItem('userData');
    if (usuarioSalvo) {
      setUsuarioLogado(JSON.parse(usuarioSalvo));
    }
    setCarregando(false); // ✅ só muda depois de verificar o localStorage
  }, []);

  // Função para verificar autenticação em rotas protegidas 🔐 Protege as rotas
  const RequireAuth = ({ children }) => {
    if (carregando) return null; // ou um loader visual se preferir
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
