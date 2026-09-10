import { prisma } from '../lib/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { generateShareCode } from '../utils/calc';
import { StockRole, AuditAction } from '@prisma/client';

export class MemberService {
  async listMembers(stockId: string) {
    const members = await prisma.stockMember.findMany({
      where: { stock_id: stockId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatar_url,
      role: m.role,
      joinedAt: m.joined_at,
    }));
  }

  async updateMemberRole(stockId: string, actorUserId: string, targetUserId: string, newRole: StockRole) {
    if (actorUserId === targetUserId) {
      throw new BadRequestError('Você não pode alterar seu próprio nível de acesso diretamente');
    }

    const member = await prisma.stockMember.findUnique({
      where: {
        stock_id_user_id: {
          stock_id: stockId,
          user_id: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundError('Membro não encontrado neste estoque');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.stockMember.update({
        where: { id: member.id },
        data: { role: newRole },
      });

      await tx.auditLog.create({
        data: {
          user_id: actorUserId,
          stock_id: stockId,
          action: AuditAction.MEMBER_UPDATE_ROLE,
          entity: 'StockMember',
          entity_id: member.id,
          details: {
            targetUser: member.user.name,
            targetEmail: member.user.email,
            previousRole: member.role,
            newRole,
          },
        },
      });

      return res;
    });

    return updated;
  }

  async removeMember(stockId: string, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      // Dono saindo: checa se é o único Dono
      const ownersCount = await prisma.stockMember.count({
        where: { stock_id: stockId, role: StockRole.OWNER },
      });

      if (ownersCount <= 1) {
        throw new BadRequestError('O estoque não pode ficar sem nenhum Dono. Transfira a posse antes de sair.');
      }
    }

    const member = await prisma.stockMember.findUnique({
      where: {
        stock_id_user_id: {
          stock_id: stockId,
          user_id: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundError('Membro não encontrado neste estoque');
    }

    await prisma.$transaction(async (tx) => {
      await tx.stockMember.delete({
        where: { id: member.id },
      });

      await tx.auditLog.create({
        data: {
          user_id: actorUserId,
          stock_id: stockId,
          action: AuditAction.MEMBER_REMOVE,
          entity: 'StockMember',
          entity_id: member.id,
          details: {
            removedUser: member.user.name,
            removedEmail: member.user.email,
            role: member.role,
          },
        },
      });
    });

    return { message: 'Membro removido do estoque com sucesso' };
  }

  async createInvite(stockId: string, actorUserId: string, data: { email?: string | null; role?: StockRole }) {
    const code = generateShareCode();

    const invite = await prisma.stockInvite.create({
      data: {
        stock_id: stockId,
        invited_by_id: actorUserId,
        email: data.email,
        role: data.role || StockRole.GUEST,
        code,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: actorUserId,
        stock_id: stockId,
        action: AuditAction.MEMBER_INVITE,
        entity: 'StockInvite',
        entity_id: invite.id,
        details: { code: invite.code, email: invite.email, role: invite.role },
      },
    });

    return invite;
  }
}

export const memberService = new MemberService();

