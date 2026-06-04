import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendWaveSmsDto {
  @ApiProperty({ example: '+221770000000' })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'https://wave.com/c/checkout...' })
  @IsNotEmpty({ message: 'L\'URL de paiement Wave est requise' })
  @IsUrl({}, { message: 'L\'URL de paiement Wave doit être une URL valide' })
  waveUrl: string;
}
