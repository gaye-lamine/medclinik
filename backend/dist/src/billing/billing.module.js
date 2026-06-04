"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const billing_controller_1 = require("./billing.controller");
const billing_service_1 = require("./billing.service");
const billing_guard_1 = require("./billing.guard");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const queue_module_1 = require("../queue/queue.module");
const sms_module_1 = require("../sms/sms.module");
const wave_module_1 = require("../wave/wave.module");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            queue_module_1.QueueModule,
            sms_module_1.SmsModule,
            (0, common_1.forwardRef)(() => wave_module_1.WaveModule),
        ],
        controllers: [billing_controller_1.BillingController],
        providers: [billing_service_1.BillingService, billing_guard_1.BillingGuard],
        exports: [billing_service_1.BillingService, billing_guard_1.BillingGuard],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map