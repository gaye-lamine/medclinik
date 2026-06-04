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
exports.CreateStockDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateStockDto {
    name;
    quantity;
    unit;
    criticalThreshold;
    category;
}
exports.CreateStockDto = CreateStockDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Paracétamol 500mg' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom de l\'article est requis' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStockDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La quantité est requise' }),
    (0, class_validator_1.IsNumber)({}, { message: 'La quantité doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'La quantité ne peut pas être négative' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateStockDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'boîtes' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L\'unité est requise' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStockDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le seuil critique est requis' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Le seuil critique doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le seuil critique ne peut pas être négatif' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateStockDto.prototype, "criticalThreshold", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Médicaments' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La catégorie est requise' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStockDto.prototype, "category", void 0);
//# sourceMappingURL=create-stock.dto.js.map