import { Controller, Get, Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller()
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('areas')
  areas() {
    return this.prisma.area.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('sensors')
  sensors() {
    return this.prisma.sensor.findMany({
      select: {
        id: true,
        areaId: true,
        code: true,
        name: true,
        unit: true,
        minValue: true,
        maxValue: true,
        area: { select: { id: true, code: true, name: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  @Get('teams')
  teams() {
    return this.prisma.team.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, active: true, areaId: true },
      orderBy: { name: 'asc' },
    });
  }
}

@Module({ controllers: [CatalogController] })
export class CatalogModule {}
