import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  description: z.string().max(255, 'Descrição deve ter no máximo 255 caracteres').optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)').optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria não pode ser vazio').max(50).optional(),
  description: z.string().max(255).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)').optional().nullable(),
});
