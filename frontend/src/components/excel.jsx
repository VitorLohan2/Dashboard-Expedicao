// src/components/gerarExcel.js
import * as XLSX from "xlsx";

/**
 * Gera e faz download do Excel de carregamentos finalizados do mês inteiro.
 *
 * @param {Object} params
 * @param {Array}  params.carregamentos  - Lista de carregamentos do mês inteiro (com cplusInicio e cplusFim)
 * @param {string} params.mes            - Mês no formato YYYY-MM
 * @returns {string} Nome do arquivo gerado
 */
export function gerarExcel({ carregamentos, mes }) {
  const cabecalho = [
    "Data",
    "Placa",
    "Modelo",
    "Conferente",
    "Equipe",
    "Início",
    "Fim",
    "Início (C-Plus)",
    "Fim (C-Plus)",
    "Tempo",
  ];

  const linhas = carregamentos.map((c) => [
    c.data || "-",
    c.placa || "-",
    c.modelo || "-",
    c.conferente || "-",
    c.equipe || "-",
    c.horaInicio ? new Date(c.horaInicio).toLocaleTimeString("pt-BR") : "-",
    c.horaFim ? new Date(c.horaFim).toLocaleTimeString("pt-BR") : "-",
    c.cplusInicio || "-",
    c.cplusFim || "-",
    c.tempo || "00:00:00",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);

  ws["!cols"] = [
    { wch: 12 }, // Data
    { wch: 12 }, // Placa
    { wch: 16 }, // Modelo
    { wch: 20 }, // Conferente
    { wch: 16 }, // Equipe
    { wch: 10 }, // Início
    { wch: 10 }, // Fim
    { wch: 16 }, // Início (C-Plus)
    { wch: 14 }, // Fim (C-Plus)
    { wch: 12 }, // Tempo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Carregamentos");

  const nomeArquivo = `carregamentos_${mes}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
  return nomeArquivo;
}
