"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaveModule = void 0;
const common_1 = require("@nestjs/common");
const wave_service_1 = require("./wave.service");
const wave_controller_1 = require("./wave.controller");
const billing_module_1 = require("../billing/billing.module");
let WaveModule = class WaveModule {
};
exports.WaveModule = WaveModule;
exports.WaveModule = WaveModule = __decorate([
    (0, common_1.Module)({
        imports: [billing_module_1.BillingModule],
        providers: [wave_service_1.WaveService],
        controllers: [wave_controller_1.WaveController],
        exports: [wave_service_1.WaveService],
    })
], WaveModule);
//# sourceMappingURL=wave.module.js.map