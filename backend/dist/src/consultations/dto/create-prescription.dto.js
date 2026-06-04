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
exports.CreatePrescriptionDto = exports.MedicineDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class MedicineDto {
    name;
    dosage;
    duration;
}
exports.MedicineDto = MedicineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Paracétamol 500mg' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom du médicament est requis' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1 comprimé 3 fois par jour' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La posologie est requise' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "dosage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '5 jours' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La durée est requise' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "duration", void 0);
class CreatePrescriptionDto {
    medicines;
    instructions;
}
exports.CreatePrescriptionDto = CreatePrescriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MedicineDto] }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La liste des médicaments est requise' }),
    (0, class_validator_1.IsArray)({ message: 'Les médicaments doivent être fournis sous forme de tableau' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicineDto),
    __metadata("design:type", Array)
], CreatePrescriptionDto.prototype, "medicines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Prendre après les repas.', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "instructions", void 0);
//# sourceMappingURL=create-prescription.dto.js.map