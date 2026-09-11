import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { CreateSourcesDto } from './dto/create-sources.dto';
import { UpdateSourcesDto } from './dto/update-sources.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('sources')
@UseGuards(AuthGuard('jwt'))
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  create(@Body() createSourcesDto: CreateSourcesDto) {
    return this.sourcesService.create(createSourcesDto);
  }

  @Get()
  findAll() {
    return this.sourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.sourcesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateSourcesDto: UpdateSourcesDto) {
    return this.sourcesService.update(id, updateSourcesDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.sourcesService.remove(id);
  }
}
