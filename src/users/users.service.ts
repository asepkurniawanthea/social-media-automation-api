import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { GetUsersFilterDto } from './dto/get-users-filter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AuthUser, Role } from '../auth/auth.types';
import { toHttpException } from '../common/prisma-errors';

const BCRYPT_ROUNDS = 10;

// Satu select untuk semua respons: password tidak pernah ikut keluar.
const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  active: true,
  created_at: true,
} satisfies Prisma.UsersSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsersDto) {
    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.users.create({
        data: { ...dto, password },
        select: USER_SELECT,
      });
    } catch (e) {
      throw toHttpException(e, {
        duplicate: `User ${dto.email} already exists`,
      });
    }
  }

  async findAll(filterDto: GetUsersFilterDto) {
    const { search, active, page = 1, limit = 10 } = filterDto;

    const where: Prisma.UsersWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [totalItems, data] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        select: USER_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      }),
    ]);

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

  async findOne(id: number) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: number, dto: UpdateUsersDto, me: AuthUser) {
    const isAdmin = me.role === Role.Admin;
    const isSelf = me.userId === id;

    if (!isAdmin && !isSelf) throw new ForbiddenException();

    const { password, role, active, ...data } = dto;

    if (isSelf && password) {
      throw new ForbiddenException(
        'Use /auth/change-password to change your own password',
      );
    }

    // Hanya admin yang boleh mengubah role dan status aktif.
    if (!isAdmin && (role !== undefined || active !== undefined)) {
      throw new ForbiddenException('Only admin can change role or status');
    }

    // Admin tidak boleh mengunci dirinya sendiri.
    if (isSelf && (active === false || (role && role !== Role.Admin))) {
      throw new ForbiddenException(
        'You cannot deactivate or demote your own account',
      );
    }

    try {
      return await this.prisma.users.update({
        where: { id },
        data: {
          ...data,
          ...(role !== undefined ? { role } : {}),
          ...(active !== undefined ? { active } : {}),
          ...(password
            ? { password: await bcrypt.hash(password, BCRYPT_ROUNDS) }
            : {}),
        },
        select: USER_SELECT,
      });
    } catch (e) {
      throw toHttpException(e, {
        notFound: `User ${id} not found`,
        duplicate: 'Email already in use',
      });
    }
  }

  async remove(id: number, me: AuthUser) {
    if (me.userId === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    try {
      await this.prisma.users.delete({ where: { id }, select: { id: true } });
    } catch (e) {
      throw toHttpException(e, {
        notFound: `User ${id} not found`,
        inUse: 'User is still referenced by other data; deactivate it instead',
      });
    }

    return { message: `User ${id} deleted successfully` };
  }
}
