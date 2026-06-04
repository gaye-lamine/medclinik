import type { Request } from 'express';
import { BillingService } from './billing.service.js';
import { WaveService } from '../wave/wave.service.js';
import { SmsService } from '../sms/sms.service.js';
import { SmsRateLimiterService } from '../sms/sms-rate-limiter.service.js';
import { CalculateShareDto } from './dto/calculate-share.dto.js';
import { CreateBillingDto } from './dto/create-billing.dto.js';
import { PayBillingDto } from './dto/pay-billing.dto.js';
import { ValidateInsuranceDto } from './dto/validate-insurance.dto.js';
import { SendWaveSmsDto } from './dto/send-wave-sms.dto.js';
export declare class BillingController {
    private billingService;
    private waveService;
    private smsService;
    private smsRateLimiter;
    constructor(billingService: BillingService, waveService: WaveService, smsService: SmsService, smsRateLimiter: SmsRateLimiterService);
    findAll(): Promise<({
        patient: {
            id: string;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
        };
        cashier: {
            name: string;
        } | null;
    } & {
        id: string;
        patientId: string;
        cashierId: string | null;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        patient: {
            id: string;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
        };
        cashier: {
            name: string;
        } | null;
    } & {
        id: string;
        patientId: string;
        cashierId: string | null;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    calculateShare(body: CalculateShareDto): Promise<{
        amount: number;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
    }>;
    create(body: CreateBillingDto): Promise<{
        patient: {
            id: string;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
        };
    } & {
        id: string;
        patientId: string;
        cashierId: string | null;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    pay(id: string, body: PayBillingDto, req: any): Promise<{
        patient: {
            id: string;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
        };
        cashier: {
            name: string;
        } | null;
    } & {
        id: string;
        patientId: string;
        cashierId: string | null;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateInsurance(id: string, body: ValidateInsuranceDto): Promise<{
        patient: {
            id: string;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
        };
    } & {
        id: string;
        patientId: string;
        cashierId: string | null;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createWaveCheckout(id: string): Promise<{
        waveUrl: string;
    }>;
    sendWaveSms(id: string, body: SendWaveSmsDto, req: Request): Promise<{
        success: boolean;
    }>;
}
