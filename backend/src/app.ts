import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth.routes';
import stockRoutes from './routes/stock.routes';
import logisticsRoutes from './routes/logistics.routes';
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimit';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// Segurança
app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// CORS
app.use(
  cors({
    origin: config.isProduction
      ? config.cors.origins
      : [...config.cors.origins, 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Stock-Id', 'Idempotency-Key'],
  })
);

// Body parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logger
app.use(
  pinoHttp({
    logger: logger as any,
    autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/health/ready' },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

// Rate limiter geral
app.use(generalLimiter);

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'stoker-api', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'up', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, '[Health] Banco de dados indisponível');
    res.status(503).json({ status: 'degraded', db: 'down', timestamp: new Date().toISOString() });
  }
});

// Rotas da API
app.use('/auth', authRoutes);
app.use('/stocks', stockRoutes);
app.use('/admin/logistica', logisticsRoutes);

// Rota 404
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint não encontrado' } });
});

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

export default app;
