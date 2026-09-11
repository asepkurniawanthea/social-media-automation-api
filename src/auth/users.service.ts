import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GetUsersFilterDto } from '../auth/dto/get-users-filter.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsersDto) {
    const password = await bcrypt.hash(dto.password, 10);

    return this.prisma.users.create({ data: { ...dto, password } });
  }

  async findAll(filterDto: GetUsersFilterDto) {
    const { search, active, page = 1, limit = 10 } = filterDto;

    const where: Prisma.UsersWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { role: { contains: search } },
      ];
    }

    if (active !== undefined) {
      where.active = active;
    }

    const skip = (page - 1) * limit;

    const [totalItems, data] = await Promise.all([
      this.prisma.users.count({ where: where }), // Hitung total seluruh data yang cocok
      this.prisma.users.findMany({
        where: where,
        skip: skip,
        take: limit, // Batasi jumlah data yang diambil
        orderBy: { createdAt: 'asc' }, // Urutkan dari yang paling baru
      }),
    ]);

    // 4. Kembalikan data berserta metadata untuk keperluan Frontend
    return {
      data,
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  findOne(id: number) {
    return this.prisma.users.findUnique({ where: { id } });
  }

  async update(id: number, dto: UpdateUsersDto) {
    const { password, ...data } = dto;

    return this.prisma.users.update({
      where: { id },
      data: {
        ...data,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
  }

  async remove(id: number) {
    return this.prisma.users.delete({ where: { id } });
  }
}
