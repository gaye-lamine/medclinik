import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class DemoLoginDto {
  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role, { message: 'Le rôle doit être un rôle valide de la clinique' })
  @IsNotEmpty({ message: 'Le rôle de démo est requis' })
  role: Role;
}
