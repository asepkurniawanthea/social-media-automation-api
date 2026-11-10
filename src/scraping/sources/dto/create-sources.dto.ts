import {
  IsBoolean,
  IsFQDN,
  IsIn,
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
import { SOURCE_CHANNELS } from '../sources.constants';
import type { SourceChannel } from '../sources.constants';

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

  @IsIn(SOURCE_CHANNELS)
  channel!: SourceChannel;

  // Tidak dikirim = default database (true)
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  active?: boolean;
}
