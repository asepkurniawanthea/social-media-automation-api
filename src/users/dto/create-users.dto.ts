import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../auth/auth.types';
import { normalizeEmail, toBoolean } from '../../common/transforms';

export class CreateUsersDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  // Terima true/false (JSON) maupun "true"/"false" (string).
  // Nilai lain dibiarkan apa adanya sehingga ditolak oleh @IsBoolean.
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  active?: boolean;
}
