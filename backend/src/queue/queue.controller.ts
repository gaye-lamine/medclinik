import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Get()
  async getQueue() {
    return this.queueService.getQueue();
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.queueService.register(body);
  }

  @Post('call/:id')
  async call(@Param('id') id: string, @Req() req: any) {
    // If a doctor calls, assign them
    const doctorId = req.user.role === 'DOCTOR' ? req.user.sub : undefined;
    return this.queueService.call(id, doctorId);
  }

  @Post('start/:id')
  async start(@Param('id') id: string) {
    return this.queueService.start(id);
  }

  @Post('finish/:id')
  async finish(@Param('id') id: string) {
    return this.queueService.finish(id);
  }
}
