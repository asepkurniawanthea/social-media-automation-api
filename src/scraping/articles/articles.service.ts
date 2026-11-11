import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticlesDto } from './dto/create-articles.dto';
import { UpdateArticlesDto } from './dto/update-articles.dto';
import { GetArticlesFilterDto } from './dto/get-articles-filter.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { toHttpException } from '../../common/prisma-errors';

// Satu select untuk semua respons. Kolom baru (mis. kredensial scraping)
// tidak ikut keluar kecuali sengaja ditambahkan di sini.
const ARTICLE_SELECT = {
  id: true,
  sources_id: true,
  url: true,
  title: true,
  raw_content: true,
  author: true,
  published_at: true,
  scraped_at: true,
  status: true,
  created_at: true,
  updated_at: true,
  sources: { select: { channel: true, domain: true, active: true } },
} satisfies Prisma.ArticlesSelect;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateArticlesDto) {
    try {
      return await this.prisma.articles.create({
        data: dto,
        select: ARTICLE_SELECT,
      });
    } catch (e) {
      throw toHttpException(e, {
        duplicate: `Article ${dto.url} already exists`,
      });
    }
  }

  async findAll(filterDto: GetArticlesFilterDto) {
    const { search, channel, status, page = 1, limit = 10 } = filterDto;

    const where: Prisma.ArticlesWhereInput = {};

    if (search) {
      where.OR = [
        { url: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (channel) {
      where.sources = { channel };
    }

    if (status !== undefined) {
      where.status = status;
    }

    where.sources = { active: true };

    const [totalItems, data] = await Promise.all([
      this.prisma.articles.count({ where }),
      this.prisma.articles.findMany({
        where,
        select: ARTICLE_SELECT,
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
    const article = await this.prisma.articles.findUnique({
      where: { id },
      select: ARTICLE_SELECT,
    });
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    return article;
  }

  async update(id: number, dto: UpdateArticlesDto) {
    try {
      return await this.prisma.articles.update({
        where: { id },
        data: dto,
        select: ARTICLE_SELECT,
      });
    } catch (e) {
      throw toHttpException(e, {
        notFound: `Article ${id} not found`,
        duplicate: 'URL is already registered',
      });
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.articles.delete({
        where: { id },
        select: { id: true },
      });
    } catch (e) {
      throw toHttpException(e, {
        notFound: `Article ${id} not found`,
        inUse:
          'Article still has associated data. Deactivate it instead of deleting.',
      });
    }
    return { message: `Article ${id} deleted successfully` };
  }
}
