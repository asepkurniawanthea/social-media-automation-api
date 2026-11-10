import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { CurrentUser, Roles } from '../auth/decorators';
import { Role } from '../auth/auth.types';
import type { AuthUser } from '../auth/auth.types';

// Autentikasi (JWT) dan pengecekan role ditangani guard global di AppModule.
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() dto: CreateUsersDto) {
    return this.usersService.create(dto);
  }

  @Roles(Role.Admin)
  @Get()
  findAll(@Query() filterDto: GetUsersFilterDto) {
    return this.usersService.findAll(filterDto);
  }

  // Admin boleh melihat siapa pun, user lain hanya akunnya sendiri.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() me: AuthUser) {
    if (me.role !== Role.Admin && me.userId !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.findOne(id);
  }

  // Tanpa @Roles: service yang memutuskan (admin boleh semua,
  // user biasa hanya dirinya sendiri dan tanpa ubah role/active).
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsersDto,
    @CurrentUser() me: AuthUser,
  ) {
    return this.usersService.update(id, dto, me);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() me: AuthUser) {
    return this.usersService.remove(id, me);
  }
}
