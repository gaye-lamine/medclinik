import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2faDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Le jeton temporaire est requis' })
  @IsString()
  tempToken: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'Le code de validation OTP est requis' })
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit comporter exactement 6 chiffres' })
  code: string;
}
