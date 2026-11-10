import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

interface PrismaErrorMessages {
  notFound?: string; // P2025
  duplicate?: string; // P2002
  inUse?: string; // P2003
}

// Mengubah error Prisma yang umum menjadi exception HTTP yang tepat.
// Error lain dikembalikan apa adanya.
export function toHttpException(
  e: unknown,
  messages: PrismaErrorMessages = {},
): unknown {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2025') {
      return new NotFoundException(messages.notFound ?? 'Record not found');
    }
    if (e.code === 'P2002') {
      return new ConflictException(
        messages.duplicate ?? 'Record already exists',
      );
    }
    if (e.code === 'P2003') {
      return new ConflictException(
        messages.inUse ?? 'Record is still referenced by other data',
      );
    }
  }
  return e;
}
