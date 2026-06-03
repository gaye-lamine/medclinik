import { BillingService } from './billing.service';
import { WaveService } from '../wave/wave.service';
import { SmsService } from '../sms/sms.service';
export declare class BillingController {
    private billingService;
    private waveService;
    private smsService;
    constructor(billingService: BillingService, waveService: WaveService, smsService: SmsService);
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
    findOne(id: string): Promise<({
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
    }) | null>;
    calculateShare(body: any): Promise<{
        amount: number;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
    }>;
    create(body: any): Promise<{
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
    pay(id: string, body: any, req: any): Promise<{
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
    validateInsurance(id: string, body: {
        mutuelleName: string;
        coverageShare: number;
    }): Promise<{
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
    sendWaveSms(id: string, body: {
        phone: string;
        waveUrl: string;
    }): Promise<{
        success: boolean;
    }>;
}
