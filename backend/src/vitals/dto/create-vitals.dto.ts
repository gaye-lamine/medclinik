import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVitalsDto {
  @ApiProperty({ example: 'uuid-patient' })
  @IsNotEmpty({ message: 'L\'ID du patient est requis' })
  @IsUUID('all', { message: 'ID patient invalide' })
  patientId: string;

  @ApiProperty({ example: 37.5, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'La température doit être un nombre' })
  @Min(30, { message: 'Température anormalement basse' })
  @Max(45, { message: 'Température anormalement élevée' })
  @Type(() => Number)
  temperature?: number;

  @ApiProperty({ example: '120/80', required: false })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiProperty({ example: 70.5, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'Le poids doit être un nombre' })
  @Min(0, { message: 'Le poids doit être positif' })
  @Type(() => Number)
  weight?: number;

  @ApiProperty({ example: 72, required: false })
  @IsOptional()
  @IsInt({ message: 'Le rythme cardiaque doit être un entier' })
  @Min(30, { message: 'Fréquence cardiaque basse' })
  @Max(250, { message: 'Fréquence cardiaque élevée' })
  @Type(() => Number)
  heartRate?: number;

  @ApiProperty({ example: 0.95, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'La glycémie doit être un nombre' })
  @Min(0)
  @Type(() => Number)
  bloodSugar?: number;

  @ApiProperty({ example: 98, required: false })
  @IsOptional()
  @IsInt({ message: 'L\'oxygénation doit être un entier' })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  oxygenSaturation?: number;

  @ApiProperty({ example: 'Patient stable.', required: false })
  @IsOptional()
  @IsString()
  comments?: string;
}
