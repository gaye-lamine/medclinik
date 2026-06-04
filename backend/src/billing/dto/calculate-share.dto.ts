import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateShareDto {
  @ApiProperty({ example: 'uuid-patient' })
  @IsNotEmpty({ message: 'L\'ID du patient est requis' })
  @IsUUID('all', { message: 'ID patient invalide' })
  patientId: string;

  @ApiProperty({ example: 15000 })
  @IsNotEmpty({ message: 'Le montant est requis' })
  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  @Min(0, { message: 'Le montant doit être positif' })
  @Type(() => Number)
  amount: number;
}
