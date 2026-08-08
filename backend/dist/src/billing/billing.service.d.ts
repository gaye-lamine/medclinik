import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
export declare class BillingService {
    private prisma;
    private queueGateway;
    constructor(prisma: PrismaService, queueGateway: QueueGateway);
    findAll(): Promise<({
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        cashierId: string | null;
        amount: number;
        amountPaid: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        refundReason: string | null;
    })[]>;
    findOne(id: string): Promise<({
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        cashierId: string | null;
        amount: number;
        amountPaid: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        refundReason: string | null;
    }) | null>;
    calculateShare(patientId: string, amount: number): Promise<{
        amount: number;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
    }>;
    create(data: any): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        cashierId: string | null;
        amount: number;
        amountPaid: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        refundReason: string | null;
    }>;
    pay(id: string, cashierId: string | null, data: any): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        cashierId: string | null;
        amount: number;
        amountPaid: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        refundReason: string | null;
    }>;
    refund(id: string, cashierId: string | null, reason: string): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        cashierId: string | null;
        amount: number;
        amountPaid: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        refundReason: string | null;
    }>;
    cancel(id: string, cashierId: string | null, reason: string): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        cashierId: string | null;
        amount: number;
        amountPaid: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        refundReason: string | null;
    }>;
    validateInsurance(id: string, data: {
        mutuelleName: string;
        coverageShare: number;
    }): Promise<{
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mutuelleName: string | null;
            insuranceCoverageShare: number;
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
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        cashierId: string | null;
        amount: number;
        amountPaid: number;
        status: import("@prisma/client").$Enums.BillingStatus;
        paymentMethod: string | null;
        mutuelleName: string | null;
        insuranceCoverageShare: number;
        patientShare: number;
        insuranceShare: number;
        transactionId: string | null;
        insuranceValidated: boolean;
        insuranceAuthCode: string | null;
        refundReason: string | null;
    }>;
}
