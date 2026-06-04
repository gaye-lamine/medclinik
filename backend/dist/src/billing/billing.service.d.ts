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
    findOne(id: string): Promise<({
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
    pay(id: string, cashierId: string | null, data: any): Promise<{
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
    validateInsurance(id: string, data: {
        mutuelleName: string;
        coverageShare: number;
    }): Promise<{
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
}
