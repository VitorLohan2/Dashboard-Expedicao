// src/utils/timeUtils.js

/**
 * Formata segundos em string HH:MM:SS
 * @param {number} segundos - Total de segundos
 * @returns {string} Tempo formatado
 */
export const formatarTempo = (segundos) => {
  const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
  const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
  const s = String(segundos % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

/**
 * Calcula segundos decorridos desde uma data ISO
 * @param {string} isoString - Data no formato ISO
 * @returns {number} Segundos decorridos
 */
export const calcularSegundosDecorridos = (isoString) => {
  const inicio = new Date(isoString);
  if (isNaN(inicio.getTime())) {
    throw new Error("Data inválida");
  }
  return Math.floor((Date.now() - inicio.getTime()) / 1000);
};

/**
 * Formata data ISO para horário local (HH:MM:SS)
 * @param {string} isoString - Data no formato ISO
 * @returns {string} Horário formatado ou '-'
 */
export const formatarHorario = (isoString) => {
  if (!isoString) return "-";

  try {
    const data = new Date(isoString);
    if (isNaN(data.getTime())) return "-";

    return data.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
};

/**
 * Verifica se horário está em período de destaque
 * @param {string} horario - Horário no formato HH:MM:SS
 * @returns {boolean} True se está em período de destaque
 */
export const isHorarioDestaque = (horario) => {
  try {
    if (typeof horario !== "string" || !horario.includes(":")) return false;

    const [horaStr] = horario.split(":");
    const hora = parseInt(horaStr, 10);

    if (isNaN(hora)) return false;

    return (hora >= 0 && hora < 4) || (hora >= 8 && hora < 12);
  } catch {
    return false;
  }
};
