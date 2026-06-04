export declare class MedicineDto {
    name: string;
    dosage: string;
    duration: string;
}
export declare class CreatePrescriptionDto {
    medicines: MedicineDto[];
    instructions?: string;
}
