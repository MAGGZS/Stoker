import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/errors';
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

    // Cria apenas a conta do usuário (sem criar estoque automático inicial)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
      },
    });

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
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin,
      tokenVersion: user.token_version,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
      },
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
      isAdmin: user.is_admin,
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
        isAdmin: user.is_admin,
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
      isAdmin: user.is_admin,
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
        is_admin: true,
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
      isAdmin: user.is_admin,
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
        token_version: { increment: 1 },
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}

export const authService = new AuthService();
