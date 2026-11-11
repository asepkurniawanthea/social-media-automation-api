import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimToUndefined, emptyToUndefined } from '../../../common/transforms';
import { ArticleStatus } from './create-articles.dto';
import { SourceChannel } from '../../sources/dto/create-sources.dto';

export class GetArticlesFilterDto {
  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(SourceChannel)
  channel?: SourceChannel;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

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
