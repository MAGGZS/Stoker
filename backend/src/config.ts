import dotenv from 'dotenv';
import path from 'path';

// Carrega .env.local se existir, senão .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '4000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'stoker-super-secret-jwt-key-dev',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'stoker-super-secret-refresh-jwt-key-dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map((o) => o.trim()),
  },
};

