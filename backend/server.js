

const app = require('./app'); // também corrigi: faltava o "const" aqui
const sequelize = require('./src/infrastructure/out/database/config/supabase');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados (Supabase)');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });

    // captura erros de bind (porta ocupada, endereço inválido, etc.)
    server.on('error', (error) => {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

iniciarServidor();