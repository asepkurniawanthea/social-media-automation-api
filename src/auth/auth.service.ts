import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload, Role } from './auth.types';

// Hash dummy dipakai saat email tidak ditemukan, supaya waktu respons
// tetap mirip dan penyerang tidak bisa menebak email yang terdaftar.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: AuthDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        active: true,
      },
    });

    const isMatch = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_HASH,
    );

    // Email tidak ada, password salah, atau akun nonaktif:
    // semuanya dijawab sama agar status akun tidak bocor.
    if (!user || !isMatch || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    };

    return {
      access_token: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, password: true, active: true },
    });
    if (!user || !user.active) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      // 400 (bukan 401) supaya interceptor frontend tidak mengira sesi habis
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, 10) }, // pakai konstanta yang sama dengan login
      select: { id: true },
    });

    return { message: 'Password changed successfully' };
  }
}
