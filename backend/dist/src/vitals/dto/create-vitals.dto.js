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
exports.CreateVitalsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateVitalsDto {
    patientId;
    temperature;
    bloodPressure;
    weight;
    heartRate;
    bloodSugar;
    oxygenSaturation;
    comments;
}
exports.CreateVitalsDto = CreateVitalsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-patient' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID du patient est requis' }),
    (0, class_validator_1.IsUUID)('all', { message: 'ID patient invalide' }),
    __metadata("design:type", String)
], CreateVitalsDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 37.5, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La température doit être un nombre' }),
    (0, class_validator_1.Min)(30, { message: 'Température anormalement basse' }),
    (0, class_validator_1.Max)(45, { message: 'Température anormalement élevée' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVitalsDto.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '120/80', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVitalsDto.prototype, "bloodPressure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 70.5, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le poids doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le poids doit être positif' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVitalsDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 72, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Le rythme cardiaque doit être un entier' }),
    (0, class_validator_1.Min)(30, { message: 'Fréquence cardiaque basse' }),
    (0, class_validator_1.Max)(250, { message: 'Fréquence cardiaque élevée' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVitalsDto.prototype, "heartRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.95, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La glycémie doit être un nombre' }),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVitalsDto.prototype, "bloodSugar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 98, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'L\'oxygénation doit être un entier' }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVitalsDto.prototype, "oxygenSaturation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Patient stable.', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVitalsDto.prototype, "comments", void 0);
//# sourceMappingURL=create-vitals.dto.js.map