// src/components/gerarPDF.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Gera e faz download do PDF de carregamentos finalizados.
 *
 * @param {Object} params
 * @param {Array}  params.carregamentos         - Lista filtrada de carregamentos a exibir na tabela
 * @param {Array}  params.conferentesContagem   - Array de [nome, qtd] para o resumo por conferente
 * @param {string} params.dataSelecionada       - Data no formato YYYY-MM-DD
 * @param {string|null} params.conferenteSelecionado - Conferente selecionado (ou null)
 * @returns {string} Nome do arquivo gerado
 */
export function gerarPDF({
  carregamentos,
  conferentesContagem,
  dataSelecionada,
  conferenteSelecionado,
}) {
  const doc = new jsPDF();
  const dataFormatada = dataSelecionada.split("-").reverse().join("/");

  // Título
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text("Relatório de Carregamentos", 14, 20);

  // Subtítulo
  doc.setFontSize(12);
  doc.setTextColor(100);
  const subtitulo = conferenteSelecionado
    ? `Data: ${dataFormatada} | Conferente: ${conferenteSelecionado}`
    : `Data: ${dataFormatada}`;
  doc.text(subtitulo, 14, 28);

  // Tabela — usa o parâmetro "carregamentos", não "carregamentosFiltrados"
  const dados = carregamentos.map((c) => [
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

  autoTable(doc, {
    head: [
      [
        "Placa",
        "Modelo",
        "Conferente",
        "Equipe",
        "Início",
        "Fim",
        "Início (C-Plus)",
        "Fim (C-Plus)",
        "Tempo",
      ],
    ],
    body: dados,
    startY: 35,
    theme: "striped",
    styles: { fontSize: 8 },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  // Rodapé com contagem por conferente
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text("Resumo por Conferente:", 14, finalY);

  let yPosition = finalY + 8;
  doc.setFontSize(10);
  doc.setTextColor(60);

  conferentesContagem.forEach(([nome, qtd]) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(`• ${nome}: ${qtd} caminhão(ões)`, 14, yPosition);
    yPosition += 6;
  });

  // Salvar — sem showMessage aqui; quem chama decide o que fazer depois
  const nomeArquivo = conferenteSelecionado
    ? `carregamentos_${dataSelecionada}_${conferenteSelecionado}.pdf`
    : `carregamentos_${dataSelecionada}.pdf`;

  doc.save(nomeArquivo);
  return nomeArquivo;
}
