// src/services/api.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const API_TIMEOUT = 20000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para logs em desenvolvimento
if (process.env.NODE_ENV === "development") {
  api.interceptors.request.use(
    (config) => {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("[API Error]", error.response?.status, error.message);
      return Promise.reject(error);
    },
  );
}

export default api;
