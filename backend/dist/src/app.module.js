"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_controller_js_1 = require("./app.controller.js");
const app_service_js_1 = require("./app.service.js");
const prisma_module_js_1 = require("./prisma/prisma.module.js");
const auth_module_js_1 = require("./auth/auth.module.js");
const patients_module_js_1 = require("./patients/patients.module.js");
const queue_module_js_1 = require("./queue/queue.module.js");
const vitals_module_js_1 = require("./vitals/vitals.module.js");
const billing_module_js_1 = require("./billing/billing.module.js");
const consultations_module_js_1 = require("./consultations/consultations.module.js");
const stock_module_js_1 = require("./stock/stock.module.js");
const reports_module_js_1 = require("./reports/reports.module.js");
const appointments_module_js_1 = require("./appointments/appointments.module.js");
const sms_module_js_1 = require("./sms/sms.module.js");
const files_module_js_1 = require("./files/files.module.js");
const wave_module_js_1 = require("./wave/wave.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'global',
                    ttl: 60000,
                    limit: 60,
                },
                {
                    name: 'auth',
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            prisma_module_js_1.PrismaModule,
            auth_module_js_1.AuthModule,
            sms_module_js_1.SmsModule,
            patients_module_js_1.PatientsModule,
            queue_module_js_1.QueueModule,
            vitals_module_js_1.VitalsModule,
            billing_module_js_1.BillingModule,
            consultations_module_js_1.ConsultationsModule,
            stock_module_js_1.StockModule,
            reports_module_js_1.ReportsModule,
            appointments_module_js_1.AppointmentsModule,
            files_module_js_1.FilesModule,
            wave_module_js_1.WaveModule,
        ],
        controllers: [app_controller_js_1.AppController],
        providers: [
            app_service_js_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map