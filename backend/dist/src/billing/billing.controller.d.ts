import { BillingService } from './billing.service';
import { WaveService } from '../wave/wave.service';
import { SmsService } from '../sms/sms.service';
import { CalculateShareDto } from './dto/calculate-share.dto';
import { CreateBillingDto } from './dto/create-billing.dto';
import { PayBillingDto } from './dto/pay-billing.dto';
import { ValidateInsuranceDto } from './dto/validate-insurance.dto';
import { SendWaveSmsDto } from './dto/send-wave-sms.dto';
export declare class BillingController {
    private billingService;
    private waveService;
    private smsService;
    constructor(billingService: BillingService, waveService: WaveService, smsService: SmsService);
    findAll(): Promise<({
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
        };
        cashier: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientId: string;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        cashierId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
        };
        cashier: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientId: string;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        cashierId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientId: string;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        cashierId: string | null;
    }>;
    pay(id: string, body: PayBillingDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientId: string;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        cashierId: string | null;
    }>;
    validateInsurance(id: string, body: ValidateInsuranceDto): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            firstName: string;
            lastName: string;
            dateOfBirth: Date;
            gender: string;
            phoneNumber: string;
            address: string | null;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientId: string;
        amount: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        cashierId: string | null;
    }>;
    createWaveCheckout(id: string): Promise<{
        waveUrl: string;
    }>;
    sendWaveSms(id: string, body: SendWaveSmsDto): Promise<{
        success: boolean;
    }>;
}
