import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSourcesDto {
  @IsString()
  @IsNotEmpty()
  domain!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  channel!: string;

  @IsString()
  @IsNotEmpty()
  is_active!: string;
}
