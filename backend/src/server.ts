import app from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const server = app.listen(config.port, () => {
  logger.info(`🚀 Stoker API rodando na porta ${config.port} [${config.env}]`);
  logger.info(`   Health check: http://localhost:${config.port}/health`);
});

// Encerramento gracioso
const gracefulShutdown = async (signal: string) => {
  logger.info(`Recebido ${signal}. Encerrando servidor Stoker...`);
  server.close(async () => {
    logger.info('Servidor HTTP encerrado.');
    await prisma.$disconnect();
    logger.info('Conexão com banco de dados encerrada.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Encerramento forçado após timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

