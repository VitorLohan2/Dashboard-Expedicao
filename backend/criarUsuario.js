// scripts/criarUsuario.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Usuario = require('./models/usuario');  // caminho relativo

// Configura variáveis de ambiente
dotenv.config();

// Conexão com MongoDB usando a mesma URI do seed.js
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://vitor:32096321@clustercarregamento.to7zl3e.mongodb.net/carregamentos_db?retryWrites=true&w=majority&appName=ClusterCarregamento';

async function criarUsuarioAdmin() {
  try {
    // Conecta ao MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado ao MongoDB');

    // Configuração do usuário admin
    const usuario = 'lopes';
    const senha = 'dime123';
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Verifica se o usuário já existe
    const usuarioExistente = await Usuario.findOne({ usuario });
    if (usuarioExistente) {
      console.log('ℹ️ Usuário já existe no banco de dados');
      return;
    }

    // Cria o novo usuário
    const novoUsuario = new Usuario({ 
      usuario, 
      senha: senhaCriptografada,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await novoUsuario.save();
    console.log('👤 Usuário criado com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err);
    process.exit(1);
  } finally {
    // Desconecta do MongoDB
    await mongoose.disconnect();
    process.exit(0);
  }
}

criarUsuarioAdmin();