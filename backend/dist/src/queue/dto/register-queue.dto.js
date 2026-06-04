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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterQueueDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
class RegisterQueueDto {
    patientId;
    department;
    priority;
    assignedDoctorId;
}
exports.RegisterQueueDto = RegisterQueueDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-patient' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID du patient est requis' }),
    (0, class_validator_1.IsUUID)('all', { message: 'ID patient invalide' }),
    __metadata("design:type", String)
], RegisterQueueDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.QueueDepartment, example: client_1.QueueDepartment.VITALS }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le département est requis' }),
    (0, class_validator_1.IsEnum)(client_1.QueueDepartment, { message: 'Département de file d\'attente invalide' }),
    __metadata("design:type", String)
], RegisterQueueDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NORMAL', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['NORMAL', 'URGENT', 'EMERGENCY'], { message: 'Priorité invalide' }),
    __metadata("design:type", String)
], RegisterQueueDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-doctor', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('all', { message: 'ID médecin invalide' }),
    __metadata("design:type", String)
], RegisterQueueDto.prototype, "assignedDoctorId", void 0);
//# sourceMappingURL=register-queue.dto.js.map