import {
  IsBoolean,
  IsFQDN,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  normalizeDomain,
  toBoolean,
  trimToUndefined,
} from '../../../common/transforms';

export enum SourceChannel {
  hardcode = 'hardcode',
  colors1001 = '1001colors',
  ngabring = 'ngabring',
  kangbadru = 'kangbadru',
}

export class CreateSourcesDto {
  // Hostname saja. IsFQDN menolak IP, "localhost", dan host dengan port.
  @Transform(normalizeDomain)
  @IsFQDN()
  @MaxLength(253)
  domain!: string;

  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsEnum(SourceChannel)
  channel!: SourceChannel;

  // Tidak dikirim = default database (true)
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  active?: boolean;
}
