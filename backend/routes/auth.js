// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/usuario');

// Login simples: usuario + senha
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  console.log('🔍 Login tentado com:', usuario);

  try {
    const user = await User.findOne({ usuario });
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const senhaConfere = await bcrypt.compare(senha, user.senha);
    if (!senhaConfere) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    console.log('✅ Login bem-sucedido para:', user.nome);
    res.json({ 
      message: 'Login realizado com sucesso',
      usuario: {
        nome: user.nome,       // Adicione esta linha
        usuario: user.usuario,
        // Outros campos se necessário
      }
    });
  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;

