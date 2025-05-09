import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';   // No seu handleLogin, adicione navegação após login bem-sucedido
import logo from '../assets/logo2.png';

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/login', { usuario, senha });

       console.log('Dados recebidos:', res.data); // Verifique se o nome está vindo

      if (!res.data.usuario?.nome) {
      throw new Error('Nome não retornado pelo servidor');
      }

       // Armazena todos os dados do usuário no localStorage
      localStorage.setItem('userData', JSON.stringify(res.data.usuario));

      // Passa o objeto completo do usuário para o componente pai
      onLogin(res.data.usuario);
      navigate('/Dashboard');
    } catch (err) {
      setErro('Login inválido');
    }
  };

    const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-wrapper">
                <img src={logo} alt="Logo da Empresa" className="logo" />
        </div>
        <h1 className="welcome-text">Sistema de Carregamento</h1>
        {/*<p className="welcome-subtext">Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet.</p>*/}
        
        <div className="login-form">
          {/*<h2 className="login-title">LOGIN</h2>*/}

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
        
        <p className="design-credit">Sistema de Carregamento</p>
      </div>
    </div>
  );
}

export default Login;

