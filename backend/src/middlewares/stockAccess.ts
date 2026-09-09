import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { StockRole } from '@prisma/client';

export async function requireStockAccess(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Usuário não autenticado');
  }

  const stockId =
    (req.params.stockId as string) ||
    (req.query.stockId as string) ||
    (req.headers['x-stock-id'] as string) ||
    (req.body && req.body.stockId ? String(req.body.stockId) : undefined);

  if (!stockId) {
    throw new NotFoundError('Identificador do estoque (stockId) não especificado');
  }

  // Verifica se o usuário tem vínculo ativo com o estoque
  const member = await prisma.stockMember.findUnique({
    where: {
      stock_id_user_id: {
        stock_id: stockId,
        user_id: req.user.id,
      },
    },
    include: {
      stock: {
        select: {
          id: true,
          name: true,
          allow_negative_stock: true,
        },
      },
    },
  });

  if (!member) {
    throw new ForbiddenError('Você não possui vínculo com este estoque');
  }

  req.stockId = member.stock_id;
  req.stockRole = member.role;

  next();
}

/**
 * Middleware para exigir exclusivamente nível DONO (OWNER) no estoque.
 */
export function requireOwner(req: Request, _res: Response, next: NextFunction): void {
  if (!req.stockRole) {
    throw new ForbiddenError('Acesso ao estoque não foi inicializado');
  }

  if (req.stockRole !== StockRole.OWNER) {
    throw new ForbiddenError('Esta operação requer permissão de Dono do estoque');
  }

  next();
}

