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
import { ArticlesService } from './articles.service';
import { CreateArticlesDto } from './dto/create-articles.dto';
import { UpdateArticlesDto } from './dto/update-articles.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import { Roles } from '../../auth/decorators';
import { Role } from '../../auth/auth.types';

// Autentikasi (JWT) dan pengecekan role ditangani guard global di AppModule.
@ApiBearerAuth()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Roles(Role.Admin, Role.Editor)
  @Post()
  create(@Body() dto: CreateArticlesDto) {
    return this.articlesService.create(dto);
  }

  @Roles(Role.Admin, Role.Editor)
  @Get()
  findAll(@Query() filterDto: GetArticlesFilterDto) {
    return this.articlesService.findAll(filterDto);
  }

  @Roles(Role.Admin, Role.Editor)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.findOne(id);
  }

  @Roles(Role.Admin, Role.Editor)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticlesDto,
  ) {
    return this.articlesService.update(id, dto);
  }

  // Hanya admin: menghapus sumber bisa gagal bila masih punya artikel,
  // dan menonaktifkan (active = false) lewat PATCH sudah cukup untuk editor.
  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.remove(id);
  }
}
