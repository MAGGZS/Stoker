import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../lib/prisma';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticação não fornecido');
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (payload.type !== 'access') {
    throw new UnauthorizedError('Token inválido');
  }

  // Verifica se o usuário ainda existe e se o token_version bate
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, is_admin: true, token_version: true },
  });

  if (!user || user.token_version !== payload.tokenVersion) {
    throw new UnauthorizedError('Sessão expirada ou encerrada. Por favor, faça login novamente.');
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.is_admin,
  };

  next();
}
