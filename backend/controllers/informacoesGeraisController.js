// backend/controllers/informacoesGeraisController.js
import InformacoesGerais from "../models/informacoesGerais.js";

/**
 * Registra ou atualiza informações gerais por data
 */
export const updateInformacoesGerais = async (req, res) => {
  const { data } = req.params;
  const novosDados = req.body;

  try {
    const existentes = await InformacoesGerais.findOne({ data });

    const dadosAtualizados = {
      totalPedidos: novosDados.totalPedidos ?? existentes?.totalPedidos ?? "",
      confZonas: novosDados.confZonas ?? existentes?.confZonas ?? "",
      zonaum: novosDados.zonaum ?? existentes?.zonaum ?? "",
      carregmanha: novosDados.carregmanha ?? existentes?.carregmanha ?? "",
      data,
    };

    const atualizado = await InformacoesGerais.findOneAndUpdate(
      { data },
      dadosAtualizados,
      { upsert: true, new: true },
    );

    res.json(atualizado);
  } catch (error) {
    console.error("Erro ao salvar informações gerais:", error);
    res.status(500).json({ erro: "Erro ao salvar informações" });
  }
};

/**
 * Obtém informações gerais por data
 */
export const getInformacoesGerais = async (req, res) => {
  const { data } = req.params;

  try {
    const info = await InformacoesGerais.findOne({ data });

    if (!info) {
      return res.json({
        data,
        totalPedidos: "",
        confZonas: "",
        zonaum: "",
        carregmanha: "",
      });
    }

    res.json(info);
  } catch (error) {
    console.error("Erro ao buscar informações gerais:", error);
    res.status(500).json({ erro: "Erro ao buscar informações" });
  }
};
