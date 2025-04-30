import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 20000 // Aumentando o timeout para 20 segundos
});

console.log('✅ URL da API:', api); // Verifique no console

console.log('API Base URL:', api.defaults.baseURL); // Verifique no console

export default api;