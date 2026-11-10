import { Body, Controller, HttpCode, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import type { AuthUser } from './auth.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser, Public } from './decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Publik (tanpa token) dan dibatasi 5 percobaan per menit per IP.
  @Public()
  @HttpCode(200)
  @ResponseMessage('Login successful')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: AuthDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @ResponseMessage('Password changed successfully')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Patch('change-password')
  changePassword(@CurrentUser() me: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(me.userId, dto);
  }
}
