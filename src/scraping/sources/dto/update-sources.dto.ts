import { PartialType } from '@nestjs/swagger';
import { CreateSourcesDto } from './create-sources.dto';

export class UpdateSourcesDto extends PartialType(CreateSourcesDto) {}
