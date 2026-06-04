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
exports.CreatePatientDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreatePatientDto {
    firstName;
    lastName;
    dateOfBirth;
    gender;
    phoneNumber;
    address;
    mutuelleName;
    insuranceCoverageShare;
}
exports.CreatePatientDto = CreatePatientDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Moussa' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le prénom est requis' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Traoré' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom de famille est requis' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1980-05-15' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La date de naissance est requise' }),
    (0, class_validator_1.IsISO8601)({}, { message: 'Format de date invalide (AAAA-MM-JJ)' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'M' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le genre est requis' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+221771234567' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le numéro de téléphone est requis' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Dakar, Plateau', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'IPM Senelec', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "mutuelleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 80, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La part de couverture doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'La part de couverture doit être supérieure ou égale à 0' }),
    (0, class_validator_1.Max)(100, { message: 'La part de couverture doit être inférieure ou égale à 100' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePatientDto.prototype, "insuranceCoverageShare", void 0);
//# sourceMappingURL=create-patient.dto.js.map