import { prisma } from '../lib/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { AuditAction } from '@prisma/client';

export class CategoryService {
  async listCategories(stockId: string) {
    const categories = await prisma.category.findMany({
      where: { stock_id: stockId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      stockId: cat.stock_id,
      name: cat.name,
      description: cat.description,
      color: cat.color || '#E11D48',
      itemCount: cat._count.items,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    }));
  }

  async createCategory(
    stockId: string,
    userId: string,
    data: { name: string; description?: string | null; color?: string | null }
  ) {
    const trimmedName = data.name.trim();

    const existing = await prisma.category.findUnique({
      where: {
        stock_id_name: {
          stock_id: stockId,
          name: trimmedName,
        },
      },
    });

    if (existing) {
      throw new BadRequestError(`Já existe uma categoria chamada "${trimmedName}" neste estoque`);
    }

    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          stock_id: stockId,
          name: trimmedName,
          description: data.description ? data.description.trim() : null,
          color: data.color || '#E11D48',
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.CATEGORY_CREATE,
          entity: 'Category',
          entity_id: created.id,
          details: { name: created.name, color: created.color },
        },
      });

      return created;
    });

    return {
      id: category.id,
      stockId: category.stock_id,
      name: category.name,
      description: category.description,
      color: category.color,
      itemCount: 0,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }

  async updateCategory(
    stockId: string,
    categoryId: string,
    userId: string,
    data: { name?: string; description?: string | null; color?: string | null }
  ) {
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, stock_id: stockId },
    });

    if (!existing) {
      throw new NotFoundError('Categoria não encontrada no estoque');
    }

    if (data.name) {
      const trimmedName = data.name.trim();
      if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
        const conflict = await prisma.category.findUnique({
          where: {
            stock_id_name: {
              stock_id: stockId,
              name: trimmedName,
            },
          },
        });
        if (conflict) {
          throw new BadRequestError(`Já existe uma categoria chamada "${trimmedName}" neste estoque`);
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.update({
        where: { id: categoryId },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
          ...(data.color !== undefined && { color: data.color }),
        },
        include: {
          _count: {
            select: { items: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.CATEGORY_UPDATE,
          entity: 'Category',
          entity_id: cat.id,
          details: { changes: data, previousName: existing.name },
        },
      });

      return cat;
    });

    return {
      id: updated.id,
      stockId: updated.stock_id,
      name: updated.name,
      description: updated.description,
      color: updated.color,
      itemCount: updated._count.items,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async deleteCategory(stockId: string, categoryId: string, userId: string) {
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, stock_id: stockId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Categoria não encontrada no estoque');
    }

    await prisma.$transaction(async (tx) => {
      // Desassocia os itens vinculados antes da exclusão
      await tx.item.updateMany({
        where: { category_id: categoryId },
        data: { category_id: null },
      });

      await tx.category.delete({
        where: { id: categoryId },
      });

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.CATEGORY_DELETE,
          entity: 'Category',
          entity_id: categoryId,
          details: {
            name: existing.name,
            detachedItemsCount: existing._count.items,
          },
        },
      });
    });

    return {
      message: 'Categoria excluída com sucesso',
      detachedItemsCount: existing._count.items,
    };
  }
}

export const categoryService = new CategoryService();
