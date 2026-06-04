import { IsNotEmpty, IsOptional, IsString, IsUUID, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-patient' })
  @IsNotEmpty({ message: 'L\'ID du patient est requis' })
  @IsUUID('all', { message: 'ID patient invalide' })
  patientId: string;

  @ApiProperty({ example: 'uuid-doctor' })
  @IsNotEmpty({ message: 'L\'ID du médecin est requis' })
  @IsUUID('all', { message: 'ID médecin invalide' })
  doctorId: string;

  @ApiProperty({ example: '2026-06-15T10:00:00Z' })
  @IsNotEmpty({ message: 'La date et l\'heure du rendez-vous sont requises' })
  @IsISO8601({}, { message: 'Format de date et heure invalide (ISO 8601)' })
  dateTime: string;

  @ApiProperty({ example: 'General' })
  @IsNotEmpty({ message: 'La spécialité médicale est requise' })
  @IsString()
  specialty: string;

  @ApiProperty({ example: 'Consultation de suivi post-opératoire', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
