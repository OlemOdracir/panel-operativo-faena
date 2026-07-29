import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { readingSchema } from '@faena/contracts';
import { Roles } from '../auth/roles.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ReadingsService } from './readings.service';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly readings: ReadingsService) {}

  @Post()
  @Roles('ADMIN')
  @UsePipes(new ZodValidationPipe(readingSchema))
  create(@Body() body: { sensorId: string; value: number; measuredAt: string }) {
    return this.readings.create(body);
  }
}
