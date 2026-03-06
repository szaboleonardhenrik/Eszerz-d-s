import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    const result = await this.authService.register(dto, req.ip, req.headers['user-agent']);
    return ApiResponse.ok(result);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);
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
  async getSessions(@Req() req: any, @Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    const result = await this.authService.getSessions(req.user.userId, token);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  async revokeSession(@Param('id') id: string, @Req() req: any) {
    const result = await this.authService.revokeSession(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  async revokeAllOtherSessions(@Req() req: any, @Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    const currentTokenHash = this.authService.hashToken(token);
    const result = await this.authService.revokeAllOtherSessions(req.user.userId, currentTokenHash);
    return ApiResponse.ok(result);
  }
}
