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
const wave_controller_js_1 = require("./wave.controller.js");
const wave_service_js_1 = require("./wave.service.js");
const billing_module_js_1 = require("../billing/billing.module.js");
const auth_module_js_1 = require("../auth/auth.module.js");
let WaveModule = class WaveModule {
};
exports.WaveModule = WaveModule;
exports.WaveModule = WaveModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => billing_module_js_1.BillingModule), auth_module_js_1.AuthModule],
        controllers: [wave_controller_js_1.WaveController],
        providers: [wave_service_js_1.WaveService],
        exports: [wave_service_js_1.WaveService],
    })
], WaveModule);
//# sourceMappingURL=wave.module.js.map