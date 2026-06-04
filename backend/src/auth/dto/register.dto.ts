import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'collab@medclinik.com' })
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  @IsNotEmpty({ message: 'L\'adresse e-mail est requise' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit faire au moins 6 caractères' })
  password: string;

  @ApiProperty({ example: 'Jean Dupont' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  name: string;

  @ApiProperty({ enum: Role, example: Role.DOCTOR })
  @IsEnum(Role, { message: 'Le rôle doit être valide' })
  @IsNotEmpty({ message: 'Le rôle est requis' })
  role: Role;

  @ApiProperty({ example: '+221770000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
