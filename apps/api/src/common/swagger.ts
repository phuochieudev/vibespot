import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

// Chuyển schema Zod thành JSON Schema để Swagger hiển thị body request.
export function zodBody(schema: ZodType) {
  return { schema: z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown> };
}

// Tạo @ApiQuery cho từng trường của schema Zod, để Swagger hiển thị query string.
export function ApiZodQuery(schema: ZodType) {
  const json = z.toJSONSchema(schema, { io: 'input' }) as {
    properties?: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  return applyDecorators(
    ...Object.entries(json.properties ?? {}).map(([name, s]) =>
      ApiQuery({ name, required: json.required?.includes(name) ?? false, schema: s }),
    ),
  );
}
