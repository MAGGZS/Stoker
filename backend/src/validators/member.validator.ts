import { z } from 'zod';

export const inviteMemberSchema = z.object({
  email: z.string().email('E-mail em formato inválido').optional().nullable(),
  role: z.enum(['OWNER', 'GUEST']).default('GUEST'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'GUEST']),
});

