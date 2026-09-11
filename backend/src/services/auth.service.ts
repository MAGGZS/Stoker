import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/errors';
import { generateShareCode } from '../utils/calc';
import { StockRole, AuditAction } from '@prisma/client';
import { AuditAction } from '@prisma/client';

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('Já existe uma conta cadastrada com este e-mail');
    }

    const passwordHash = await hashPassword(data.password);

    // Cria o usuário e, imediatamente, o seu primeiro estoque principal como DONO
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password_hash: passwordHash,
        },
      });
    // Cria apenas a conta do usuário (sem criar estoque automático inicial)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
      },
    });

      const defaultStock = await tx.stock.create({
        data: {
          name: 'Estoque Principal',
          description: 'Estoque padrão inicial',
          share_code: generateShareCode(),
          share_code_expires_at: new Date(Date.now() + 15 * 60 * 1000),
          created_by_id: user.id,
          allow_negative_stock: false,
        },
      });

      // Vincula o criador como OWNER
      await tx.stockMember.create({
        data: {
          stock_id: defaultStock.id,
          user_id: user.id,
          role: StockRole.OWNER,
        },
      });

      // Cria algumas categorias padrão
      await tx.category.createMany({
        data: [
          { stock_id: defaultStock.id, name: 'Geral', color: '#DC2626' },
          { stock_id: defaultStock.id, name: 'Matéria-Prima', color: '#3B82F6' },
          { stock_id: defaultStock.id, name: 'Produtos Acabados', color: '#10B981' },
        ],
      });

      await tx.auditLog.create({
        data: {
          user_id: user.id,
          stock_id: defaultStock.id,
          action: AuditAction.USER_REGISTER,
          entity: 'User',
          entity_id: user.id,
          details: { message: 'Conta criada e estoque inicial gerado' },
        },
      });

      return { user, defaultStock };
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: AuditAction.USER_REGISTER,
        entity: 'User',
        entity_id: user.id,
        details: { message: 'Conta criada' },
      },
    });

    const accessToken = generateAccessToken({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      tokenVersion: result.user.token_version,
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    });

    const refreshToken = generateRefreshToken({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      tokenVersion: result.user.token_version,
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        id: user.id,
        name: user.name,
        email: user.email,
      },
      defaultStockId: result.defaultStock.id,
      defaultStockId: null,
      stocks: [],
      accessToken,
      refreshToken,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        stock_memberships: {
          include: {
            stock: {
              select: { id: true, name: true, share_code: true },
              select: {
                id: true,
                name: true,
                description: true,
                share_code: true,
                created_by_id: true,
              },
            },
          },
          orderBy: { joined_at: 'asc' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('E-mail ou senha incorretos');
    }

    const isValid = await comparePassword(data.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('E-mail ou senha incorretos');
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    });

    const stocks = user.stock_memberships.map((m) => ({
      id: m.stock.id,
      name: m.stock.name,
      description: m.stock.description,
      shareCode: m.stock.share_code,
      role: m.role,
      isCreator: m.stock.created_by_id === user.id,
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      stocks,
      defaultStockId: stocks[0]?.id || null,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.token_version !== payload.tokenVersion) {
      throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    });

    return { accessToken: newAccessToken };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        created_at: true,
        stock_memberships: {
          select: {
            role: true,
            joined_at: true,
            stock: {
              select: {
                id: true,
                name: true,
                description: true,
                share_code: true,
                allow_negative_stock: true,
                _count: {
                  select: {
                    items: true,
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      stocks: user.stock_memberships.map((m) => ({
        id: m.stock.id,
        name: m.stock.name,
        description: m.stock.description,
        shareCode: m.stock.share_code,
        role: m.role,
        allowNegativeStock: m.stock.allow_negative_stock,
        joinedAt: m.joined_at,
        itemsCount: m.stock._count.items,
        membersCount: m.stock._count.members,
      })),
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    const match = await comparePassword(currentPass, user.password_hash);
    if (!match) {
      throw new BadRequestError('Senha atual incorreta');
    }

    const newHash = await hashPassword(newPass);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newHash,
        token_version: { increment: 1 }, // invalida todas as sessões anteriores
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}

export const authService = new AuthService();

