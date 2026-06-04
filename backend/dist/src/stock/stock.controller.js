"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const create_stock_dto_1 = require("./dto/create-stock.dto");
const update_stock_dto_1 = require("./dto/update-stock.dto");
const swagger_1 = require("@nestjs/swagger");
let StockController = class StockController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    async findAll() {
        return this.stockService.findAll();
    }
    async findAlerts() {
        return this.stockService.findAlerts();
    }
    async create(body) {
        return this.stockService.create(body);
    }
    async update(id, body) {
        return this.stockService.update(id, body);
    }
    async findPrescriptionByCode(code) {
        return this.stockService.findPrescriptionByCode(code);
    }
    async deliverPrescription(id) {
        return this.stockService.deliverPrescription(id);
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Liste des articles en stock' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stock récupéré' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StockController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({ summary: 'Articles en alerte de stock bas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alertes de stock récupérées' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StockController.prototype, "findAlerts", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Ajouter un nouvel article en stock' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Article ajouté' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_dto_1.CreateStockDto]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('update/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.DOCTOR, client_1.Role.NURSE),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour la quantité et le seuil critique d\'un article' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Article mis à jour' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stock_dto_1.UpdateStockDto]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('prescription/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Rechercher une ordonnance par son code RX' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ordonnance trouvée' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ordonnance introuvable' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "findPrescriptionByCode", null);
__decorate([
    (0, common_1.Post)('deliver/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Délivrer une ordonnance (déduit le stock et crée la facture pharmacie)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ordonnance délivrée' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "deliverPrescription", null);
exports.StockController = StockController = __decorate([
    (0, swagger_1.ApiTags)('Stock'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('stock'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
//# sourceMappingURL=stock.controller.js.map