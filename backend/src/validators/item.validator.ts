import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(2, 'Nome do item é obrigatório').max(150),
  sku: z.string().min(1, 'Código SKU ou código de barras é obrigatório').max(50).toUpperCase(),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  unit: z.string().min(1).max(10).toUpperCase().default('UN'),
  initialQuantity: z.number().min(0, 'Quantidade inicial não pode ser negativa').default(0),
  minQuantity: z.number().min(0, 'Estoque mínimo não pode ser negativo').default(0),
  maxQuantity: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0, 'Preço de custo não pode ser negativo').default(0),
  salePrice: z.number().min(0, 'Preço de venda não pode ser negativo').default(0),
  location: z.string().max(100).optional().nullable(),
});

export const updateItemSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  sku: z.string().min(1).max(50).toUpperCase().optional(),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  unit: z.string().min(1).max(10).toUpperCase().optional(),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  location: z.string().max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const queryItemsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ACTIVE').optional(),
  lowStockOnly: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});
