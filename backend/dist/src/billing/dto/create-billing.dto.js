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
exports.CreateBillingDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateBillingDto {
    patientId;
    amount;
    doctorId;
    specialty;
}
exports.CreateBillingDto = CreateBillingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-patient' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID du patient est requis' }),
    (0, class_validator_1.IsUUID)('all', { message: 'ID patient invalide' }),
    __metadata("design:type", String)
], CreateBillingDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15000 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le montant est requis' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le montant doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le montant doit être supérieur ou égal à 0' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateBillingDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-doctor' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'ID du médecin est requis' }),
    (0, class_validator_1.IsUUID)('all', { message: 'ID médecin invalide' }),
    __metadata("design:type", String)
], CreateBillingDto.prototype, "doctorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'General', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBillingDto.prototype, "specialty", void 0);
//# sourceMappingURL=create-billing.dto.js.map