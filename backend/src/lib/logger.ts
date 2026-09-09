import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.isProduction ? 'info' : 'debug',
  transport: !config.isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

