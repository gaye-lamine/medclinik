import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Stock')
@ApiBearerAuth()
@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des articles en stock' })
  @ApiResponse({ status: 200, description: 'Stock récupéré' })
  async findAll() {
    return this.stockService.findAll();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Articles en alerte de stock bas' })
  @ApiResponse({ status: 200, description: 'Alertes de stock récupérées' })
  async findAlerts() {
    return this.stockService.findAlerts();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ajouter un nouvel article en stock' })
  @ApiResponse({ status: 201, description: 'Article ajouté' })
  async create(@Body() body: CreateStockDto) {
    return this.stockService.create(body);
  }

  @Put('update/:id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE)
  @ApiOperation({ summary: 'Mettre à jour la quantité et le seuil critique d\'un article' })
  @ApiResponse({ status: 200, description: 'Article mis à jour' })
  async update(@Param('id') id: string, @Body() body: UpdateStockDto) {
    return this.stockService.update(id, body);
  }

  @Get('prescription/:code')
  @ApiOperation({ summary: 'Rechercher une ordonnance par son code RX' })
  @ApiResponse({ status: 200, description: 'Ordonnance trouvée' })
  @ApiResponse({ status: 404, description: 'Ordonnance introuvable' })
  async findPrescriptionByCode(@Param('code') code: string) {
    return this.stockService.findPrescriptionByCode(code);
  }

  @Post('deliver/:id')
  @ApiOperation({ summary: 'Délivrer une ordonnance (déduit le stock et crée la facture pharmacie)' })
  @ApiResponse({ status: 200, description: 'Ordonnance délivrée' })
  async deliverPrescription(@Param('id') id: string) {
    return this.stockService.deliverPrescription(id);
  }
}
