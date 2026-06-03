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
const sms_module_1 = require("./sms/sms.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const patients_controller_1 = require("./patients/patients.controller");
const patients_service_1 = require("./patients/patients.service");
const queue_controller_1 = require("./queue/queue.controller");
const queue_service_1 = require("./queue/queue.service");
const queue_gateway_1 = require("./queue/queue.gateway");
const vitals_controller_1 = require("./vitals/vitals.controller");
const vitals_service_1 = require("./vitals/vitals.service");
const billing_controller_1 = require("./billing/billing.controller");
const billing_service_1 = require("./billing/billing.service");
const consultations_controller_1 = require("./consultations/consultations.controller");
const consultations_service_1 = require("./consultations/consultations.service");
const stock_controller_1 = require("./stock/stock.controller");
const stock_service_1 = require("./stock/stock.service");
const reports_controller_1 = require("./reports/reports.controller");
const reports_service_1 = require("./reports/reports.service");
const appointments_module_1 = require("./appointments/appointments.module");
const files_controller_1 = require("./files/files.controller");
const wave_controller_1 = require("./wave/wave.controller");
const wave_service_1 = require("./wave/wave.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, appointments_module_1.AppointmentsModule, sms_module_1.SmsModule],
        controllers: [
            app_controller_1.AppController,
            patients_controller_1.PatientsController,
            queue_controller_1.QueueController,
            vitals_controller_1.VitalsController,
            billing_controller_1.BillingController,
            consultations_controller_1.ConsultationsController,
            stock_controller_1.StockController,
            reports_controller_1.ReportsController,
            files_controller_1.FilesController,
            wave_controller_1.WaveController,
        ],
        providers: [
            app_service_1.AppService,
            patients_service_1.PatientsService,
            queue_service_1.QueueService,
            queue_gateway_1.QueueGateway,
            vitals_service_1.VitalsService,
            billing_service_1.BillingService,
            consultations_service_1.ConsultationsService,
            stock_service_1.StockService,
            reports_service_1.ReportsService,
            wave_service_1.WaveService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map