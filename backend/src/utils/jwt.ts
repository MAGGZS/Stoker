import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from './errors';

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  tokenVersion: number;
  type: 'access' | 'refresh';
}

export function generateAccessToken(payload: {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  tokenVersion: number;
}): string {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      name: payload.name,
      isAdmin: payload.isAdmin ?? false,
      tokenVersion: payload.tokenVersion,
      type: 'access',
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
}

export function generateRefreshToken(payload: {
  id: string;
  email: string;
  name: string;
  tokenVersion: number;
}): string {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      name: payload.name,
      tokenVersion: payload.tokenVersion,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Token de acesso expirado ou inválido');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Refresh token expirado ou inválido');
  }
}
