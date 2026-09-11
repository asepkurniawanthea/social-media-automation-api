import { Injectable } from '@nestjs/common';
import { CreateSourcesDto } from './dto/create-sources.dto';
import { UpdateSourcesDto } from './dto/update-sources.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSourcesDto) {
    return this.prisma.sources.create({ data: dto });
  }

  async findAll() {
    return this.prisma.sources.findMany();
  }

  findOne(id: number) {
    return this.prisma.sources.findUnique({ where: { id } });
  }

  async update(id: number, dto: UpdateSourcesDto) {
    return this.prisma.sources.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.sources.delete({ where: { id } });
  }
}
