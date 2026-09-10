import { z } from 'zod';

export const createStockSchema = z.object({
  name: z.string().min(2, 'Nome do estoque deve ter no mínimo 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  allowNegativeStock: z.boolean().optional().default(false),
});

export const updateStockSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  allowNegativeStock: z.boolean().optional(),
});

export const joinStockSchema = z.object({
  shareCode: z
    .string()
    .trim()
    .length(6, 'O código de compartilhamento deve conter exatamente 6 caracteres')
    .toUpperCase(),
});

