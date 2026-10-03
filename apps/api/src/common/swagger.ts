import { z, type ZodType } from 'zod';

// Chuyển schema Zod thành JSON Schema để Swagger hiển thị body request.
export function zodBody(schema: ZodType) {
  return { schema: z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown> };
}
