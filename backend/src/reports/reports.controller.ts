import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardData() {
    return this.reportsService.getDashboardData();
  }

  @Get('advanced')
  async getAdvancedReports() {
    return this.reportsService.getAdvancedReports();
  }
}
