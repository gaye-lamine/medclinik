import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MedicineDto {
  @ApiProperty({ example: 'Paracétamol 500mg' })
  @IsNotEmpty({ message: 'Le nom du médicament est requis' })
  @IsString()
  name: string;

  @ApiProperty({ example: '1 comprimé 3 fois par jour' })
  @IsNotEmpty({ message: 'La posologie est requise' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: '5 jours' })
  @IsNotEmpty({ message: 'La durée est requise' })
  @IsString()
  duration: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ type: [MedicineDto] })
  @IsNotEmpty({ message: 'La liste des médicaments est requise' })
  @IsArray({ message: 'Les médicaments doivent être fournis sous forme de tableau' })
  @ValidateNested({ each: true })
  @Type(() => MedicineDto)
  medicines: MedicineDto[];

  @ApiProperty({ example: 'Prendre après les repas.', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}
