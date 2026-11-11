import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSourcesDto } from './dto/create-sources.dto';
import { UpdateSourcesDto } from './dto/update-sources.dto';
import { GetSourcesFilterDto } from './dto/get-sources-filter.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { toHttpException } from '../../common/prisma-errors';

// Satu select untuk semua respons. Kolom baru (mis. kredensial scraping)
// tidak ikut keluar kecuali sengaja ditambahkan di sini.
const SOURCE_SELECT = {
  id: true,
  domain: true,
  name: true,
  channel: true,
  active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.SourcesSelect;

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSourcesDto) {
    try {
      return await this.prisma.sources.create({
        data: dto,
        select: SOURCE_SELECT,
      });
    } catch (e) {
      throw toHttpException(e, {
        duplicate: `Source ${dto.domain} already exists`,
      });
    }
  }

  async findAll(filterDto: GetSourcesFilterDto) {
    const { search, channel, active, page = 1, limit = 10 } = filterDto;

    const where: Prisma.SourcesWhereInput = {};

    if (search) {
      where.OR = [
        { domain: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (channel) {
      where.channel = channel;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [totalItems, data] = await Promise.all([
      this.prisma.sources.count({ where }),
      this.prisma.sources.findMany({
        where,
        select: SOURCE_SELECT,
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
    const source = await this.prisma.sources.findUnique({
      where: { id },
      select: SOURCE_SELECT,
    });
    if (!source) throw new NotFoundException(`Source ${id} not found`);
    return source;
  }

  async update(id: number, dto: UpdateSourcesDto) {
    try {
      return await this.prisma.sources.update({
        where: { id },
        data: dto,
        select: SOURCE_SELECT,
      });
    } catch (e) {
      throw toHttpException(e, {
        notFound: `Source ${id} not found`,
        duplicate: 'Domain is already registered',
      });
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.sources.delete({
        where: { id },
        select: { id: true },
      });
    } catch (e) {
      throw toHttpException(e, {
        notFound: `Source ${id} not found`,
        inUse: 'Source still has articles. Deactivate it instead of deleting.',
      });
    }
    return { message: `Source ${id} deleted successfully` };
  }

  findOptions() {
    return this.prisma.sources.findMany({
      where: { active: true },
      select: { id: true, domain: true },
      orderBy: { name: 'asc' },
    });
  }
}
