import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourcesDto } from './dto/create-sources.dto';
import { UpdateSourcesDto } from './dto/update-sources.dto';
import { GetSourcesFilterDto } from './dto/get-sources-filter.dto';
import { Roles } from '../../auth/decorators';
import { Role } from '../../auth/auth.types';

// Autentikasi (JWT) dan pengecekan role ditangani guard global di AppModule.
@ApiBearerAuth()
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Roles(Role.Admin, Role.Editor)
  @Post()
  create(@Body() dto: CreateSourcesDto) {
    return this.sourcesService.create(dto);
  }

  @Roles(Role.Admin, Role.Editor)
  @Get()
  findAll(@Query() filterDto: GetSourcesFilterDto) {
    return this.sourcesService.findAll(filterDto);
  }

  @Roles(Role.Admin, Role.Editor)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sourcesService.findOne(id);
  }

  @Roles(Role.Admin, Role.Editor)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSourcesDto) {
    return this.sourcesService.update(id, dto);
  }

  // Hanya admin: menghapus sumber bisa gagal bila masih punya artikel,
  // dan menonaktifkan (active = false) lewat PATCH sudah cukup untuk editor.
  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sourcesService.remove(id);
  }
}
