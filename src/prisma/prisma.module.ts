import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: PrismaService bisa di-inject di modul mana pun tanpa import ulang.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
