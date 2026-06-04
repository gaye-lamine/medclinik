import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsIn } from 'class-validator';
import { QueueDepartment } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterQueueDto {
  @ApiProperty({ example: 'uuid-patient' })
  @IsNotEmpty({ message: 'L\'ID du patient est requis' })
  @IsUUID('all', { message: 'ID patient invalide' })
  patientId: string;

  @ApiProperty({ enum: QueueDepartment, example: QueueDepartment.VITALS })
  @IsNotEmpty({ message: 'Le département est requis' })
  @IsEnum(QueueDepartment, { message: 'Département de file d\'attente invalide' })
  department: QueueDepartment;

  @ApiProperty({ example: 'NORMAL', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['NORMAL', 'URGENT', 'EMERGENCY'], { message: 'Priorité invalide' })
  priority?: string;

  @ApiProperty({ example: 'uuid-doctor', required: false })
  @IsOptional()
  @IsUUID('all', { message: 'ID médecin invalide' })
  assignedDoctorId?: string;
}
