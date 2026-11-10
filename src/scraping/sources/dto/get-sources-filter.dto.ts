import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  emptyToUndefined,
  toBoolean,
  trimToUndefined,
} from '../../../common/transforms';
import { SOURCE_CHANNELS } from '../sources.constants';
import type { SourceChannel } from '../sources.constants';

export class GetSourcesFilterDto {
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(SOURCE_CHANNELS)
  channel?: SourceChannel;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
