// backend/controllers/authController.js

import bcrypt from "bcryptjs";
import User from "../models/usuario";

const login = async (req, res) => {
  const { usuario, senha } = req.body;
  console.log("Login tentando com:", usuario);

  try {
    const user = await User.findOne({ usuario });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const senhaConferiada = await bcrypt.compare(senha, user.senha);
    if (!senhaConferiada) {
      return res.status(401).json({ message: "Credencias inválidas" });
    }

    console.log("Login bem-sucedido para:", user.nome);
    res.json({
      message: "Login realizado com sucesso",
      usuario: {
        nome: user.nome,
        usuario: user.usuario,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor" });
  }
};

export { login };
