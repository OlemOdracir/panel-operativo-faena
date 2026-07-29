import { Controller, Get, Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller()
class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('areas')
  areas() {
    return this.prisma.area.findMany({ orderBy: { name: 'asc' } });
  }

  @Get('sensors')
  sensors() {
    return this.prisma.sensor.findMany({ include: { area: true }, orderBy: { code: 'asc' } });
  }

  @Get('teams')
  teams() {
    return this.prisma.team.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }
}

@Module({ controllers: [CatalogController] })
export class CatalogModule {}
