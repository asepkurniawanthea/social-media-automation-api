import { PartialType } from '@nestjs/mapped-types';
import { CreateSourcesDto } from './create-sources.dto';

export class UpdateSourcesDto extends PartialType(CreateSourcesDto) {}
