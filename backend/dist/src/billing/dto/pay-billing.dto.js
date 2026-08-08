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
exports.PayBillingDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class PayBillingDto {
    paymentMethod;
    transactionId;
    amountPaid;
}
exports.PayBillingDto = PayBillingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CASH' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La méthode de paiement est requise' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayBillingDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TX-12345', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayBillingDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3000, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le montant versé doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le montant versé doit être supérieur ou égal à 0' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PayBillingDto.prototype, "amountPaid", void 0);
//# sourceMappingURL=pay-billing.dto.js.map