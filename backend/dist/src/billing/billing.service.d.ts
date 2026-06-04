import { PrismaService } from '../prisma/prisma.service';
import { QueueGateway } from '../queue/queue.gateway';
export declare class BillingService {
    private prisma;
    private queueGateway;
    constructor(prisma: PrismaService, queueGateway: QueueGateway);
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
    pay(id: string, cashierId: string | null, data: any): Promise<{
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
    validateInsurance(id: string, data: {
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
}
