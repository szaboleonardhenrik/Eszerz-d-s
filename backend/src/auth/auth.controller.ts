import { Controller, Post, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return ApiResponse.ok(result);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    const result = await this.authService.getProfile(req.user.userId);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: any,
    @Body() body: {
      name?: string;
      companyName?: string;
      taxNumber?: string;
      phone?: string;
      notifyOnSign?: boolean;
      notifyOnDecline?: boolean;
      notifyOnExpire?: boolean;
      notifyOnComment?: boolean;
      emailDigest?: string;
    },
  ) {
    const result = await this.authService.updateProfile(req.user.userId, body);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    const result = await this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Req() req: any) {
    const result = await this.authService.getLoginHistory(req.user.userId);
    return ApiResponse.ok(result);
  }
}
