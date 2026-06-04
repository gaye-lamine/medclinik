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
exports.CreateAppointmentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateAppointmentDto {
    patientId;
    doctorId;
    dateTime;
    specialty;
    notes;
}
exports.CreateAppointmentDto = CreateAppointmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-patient' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID du patient est requis' }),
    (0, class_validator_1.IsUUID)('all', { message: 'ID patient invalide' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-doctor' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID du médecin est requis' }),
    (0, class_validator_1.IsUUID)('all', { message: 'ID médecin invalide' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "doctorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-15T10:00:00Z' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La date et l\'heure du rendez-vous sont requises' }),
    (0, class_validator_1.IsISO8601)({}, { message: 'Format de date et heure invalide (ISO 8601)' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "dateTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'General' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La spécialité médicale est requise' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "specialty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Consultation de suivi post-opératoire', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-appointment.dto.js.map