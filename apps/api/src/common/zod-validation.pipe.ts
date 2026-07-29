import {
  BadRequestException,
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform<unknown> {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `Invalid ${metadata.type}`,
        details: result.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
      });
    }
    return result.data;
  }
}
