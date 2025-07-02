import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo2.png';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Loading from './Loading';

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErro('');
    setLoading(true);
    setProgress(0);

    // Simula progresso animado
    let simulatedProgress = 0;
    const interval = setInterval(() => {
      simulatedProgress += Math.floor(Math.random() * 10) + 5;
      if (simulatedProgress >= 90) {
        clearInterval(interval);
      }
      setProgress(Math.min(simulatedProgress, 90));
    }, 200);

    try {
      const res = await api.post('/api/login', { usuario, senha });

      if (!res.data.usuario?.nome) {
        throw new Error('Nome não retornado pelo servidor');
      }

      // Finaliza a barra
      setProgress(100);

      setTimeout(() => {
        localStorage.setItem('userData', JSON.stringify(res.data.usuario));
        onLogin(res.data.usuario);
        navigate('/Dashboard');
      }, 500); // aguarda um pouco antes de redirecionar
    } catch (err) {
      setErro('Login inválido');
      setLoading(false);  // <- Isso aqui para o loading
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (loading) {
    return <Loading progress={progress} />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-wrapper">
          <img src={logo} alt="Logo da Empresa" className="logo" />
        </div>
        <h1 className="welcome-text">Sistema de Carregamento</h1>

        <div className="login-form">
          <div className="input-group">
            <label htmlFor="username">LOGIN DE USUÁRIO</label>
            <input
              id="username"
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">SENHA</label>
            <input
              id="password"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <button className="login-button" onClick={handleLogin}>LOGIN</button>
        </div>

        {erro && <p className="error-message">{erro}</p>}

        <p className="design-credit">-------------------- OUTROS --------------------</p>
        <div className="outros-button">
          <button className="login-suporte">
            <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="a-suporte">
              <FontAwesomeIcon icon={faEnvelope} /> SUPORTE
            </a>
          </button>
          <button className="login-discord">
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="b-suporte">
              <FontAwesomeIcon icon={faDiscord} size="lg" /> DISCORD
            </a>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
