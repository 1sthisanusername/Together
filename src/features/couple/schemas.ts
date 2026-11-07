import { z } from 'zod';

export const createCoupleSchema = z.object({
  coupleName: z.string().max(50, 'Couple name is too long').optional(),
});

export type CreateCoupleInput = z.infer<typeof createCoupleSchema>;

export const acceptInviteSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6, 'Invite code must be 6 characters')
    .max(6, 'Invite code must be 6 characters')
    .transform((val) => val.toUpperCase()),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

