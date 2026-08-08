import { IsNotEmpty, IsOptional, IsString, IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
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

  @ApiProperty({ example: 2, description: 'Quantité de boîtes / unités à prescrire' })
  @IsNotEmpty({ message: 'La quantité de médicament est requise' })
  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité doit être au moins de 1' })
  quantity: number;

  @ApiProperty({ example: 'uuid-stock-item-id', required: false })
  @IsOptional()
  @IsString()
  stockItemId?: string;
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
