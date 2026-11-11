import {
  IsOptional,
  IsString,
  IsUrl,
  IsInt,
  IsDate,
  Min,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ArticleStatus {
  Pending = 'pending',
  Processed = 'processed',
  Failed = 'failed',
}

export class CreateArticlesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sources_id!: number;

  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  raw_content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  author?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  published_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scraped_at?: Date;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}
