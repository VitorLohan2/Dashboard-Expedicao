// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Consulta from "./pages/Consulta";
import Placas from "./pages/Placas";
import Grafico from "./pages/Grafico";

// Styles
import "./styles/variables.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/placas" element={<Placas />} />
        <Route path="/grafico" element={<Grafico />} />
      </Routes>
    </Router>
  );
}

export default App;
