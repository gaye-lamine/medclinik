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
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_1 = require("./appointments.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
const update_appointment_dto_1 = require("./dto/update-appointment.dto");
const swagger_1 = require("@nestjs/swagger");
let AppointmentsController = class AppointmentsController {
    appointmentsService;
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    async findAll() {
        return this.appointmentsService.findAll();
    }
    async findByDoctor(doctorId) {
        return this.appointmentsService.findByDoctor(doctorId);
    }
    async findOne(id) {
        return this.appointmentsService.findOne(id);
    }
    async create(body) {
        return this.appointmentsService.create(body);
    }
    async update(id, body) {
        return this.appointmentsService.update(id, body);
    }
    async remove(id) {
        return this.appointmentsService.remove(id);
    }
    async admit(id) {
        return this.appointmentsService.admit(id);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Liste de tous les rendez-vous' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendez-vous récupérés' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('doctor/:doctorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Liste des rendez-vous affectés à un médecin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendez-vous médecin récupérés' }),
    __param(0, (0, common_1.Param)('doctorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "findByDoctor", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Détails d\'un rendez-vous' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendez-vous trouvé' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Rendez-vous introuvable' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un rendez-vous' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Rendez-vous planifié et SMS de confirmation envoyé' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour un rendez-vous' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendez-vous mis à jour' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Rendez-vous introuvable' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_appointment_dto_1.UpdateAppointmentDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Annuler/supprimer un rendez-vous' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rendez-vous supprimé' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('admit/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Admettre le patient en consultation (crée la facture)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient admis, facture impayée générée' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "admit", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, swagger_1.ApiTags)('Appointments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('appointments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map