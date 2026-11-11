import { PartialType } from '@nestjs/swagger';
import { CreateArticlesDto } from './create-articles.dto';

export class UpdateArticlesDto extends PartialType(CreateArticlesDto) {}
