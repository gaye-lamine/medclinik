import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterQueueDto } from './dto/register-queue.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Queue')
@ApiBearerAuth()
@Controller('queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer la file d\'attente active' })
  @ApiResponse({ status: 200, description: 'File d\'attente récupérée' })
  async getQueue() {
    return this.queueService.getQueue();
  }

  @Post('register')
  @ApiOperation({ summary: 'Enregistrer un patient dans la file d\'attente' })
  @ApiResponse({ status: 201, description: 'Enregistrement réussi' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async register(@Body() body: RegisterQueueDto) {
    return this.queueService.register(body);
  }

  @Post('call/:id')
  @ApiOperation({ summary: 'Appeler un patient par son numéro de file' })
  @ApiResponse({ status: 200, description: 'Patient appelé et notifié par SMS' })
  @ApiResponse({ status: 404, description: 'Entrée introuvable' })
  async call(@Param('id') id: string, @Req() req: any) {
    // If a doctor calls, assign them
    const doctorId = req.user.role === 'DOCTOR' ? req.user.sub : undefined;
    return this.queueService.call(id, doctorId);
  }

  @Post('start/:id')
  @ApiOperation({ summary: 'Démarrer la consultation/constantes pour le patient' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  async start(@Param('id') id: string) {
    return this.queueService.start(id);
  }

  @Post('finish/:id')
  @ApiOperation({ summary: 'Retirer un patient de la file d\'attente' })
  @ApiResponse({ status: 200, description: 'Retrait réussi' })
  async finish(@Param('id') id: string) {
    return this.queueService.finish(id);
  }
}
