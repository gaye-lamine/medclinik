import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN)
  async getDashboardData() {
    return this.reportsService.getDashboardData();
  }

  @Get('advanced')
  @Roles(Role.ADMIN)
  async getAdvancedReports() {
    return this.reportsService.getAdvancedReports();
  }
}
