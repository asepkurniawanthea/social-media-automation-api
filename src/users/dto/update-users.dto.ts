import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUsersDto } from './create-users.dto';
import { emptyToUndefined } from '../../common/transforms';

export class UpdateUsersDto extends PartialType(
  OmitType(CreateUsersDto, ['password'] as const),
) {
  // Kosong ('' atau tidak dikirim) = password tidak diubah.
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;
}
