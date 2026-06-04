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
exports.ValidateInsuranceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ValidateInsuranceDto {
    mutuelleName;
    coverageShare;
}
exports.ValidateInsuranceDto = ValidateInsuranceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AXA Assurances' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom de la mutuelle est requis' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidateInsuranceDto.prototype, "mutuelleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 80 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le taux de couverture est requis' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux de couverture doit être un nombre' }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ValidateInsuranceDto.prototype, "coverageShare", void 0);
//# sourceMappingURL=validate-insurance.dto.js.map