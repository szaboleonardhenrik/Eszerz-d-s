import { Controller, Post, Get, Patch, Delete, Body, Param, Query, Res, UseGuards, Req, Headers } from '@nestjs/common';
import type { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

const COOKIE_OPTIONS = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setTokenCookie(res: Response, token: string) {
    res.cookie('token', token, COOKIE_OPTIONS(process.env.NODE_ENV === 'production'));
  }

  private extractToken(req: any, authHeader?: string): string {
    return req?.cookies?.token || authHeader?.replace('Bearer ', '') || '';
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto, req.ip, req.headers['user-agent']);
    if (result.token) {
      this.setTokenCookie(res, result.token);
    }
    return ApiResponse.ok(result);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);
    if ('token' in result && result.token) {
      this.setTokenCookie(res, result.token);
    }
    return ApiResponse.ok(result);
  }

  @Post('verify-mfa')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyMfa(@Body() body: { mfaToken: string; code: string }, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyMfaLogin(body.mfaToken, body.code, req.ip, req.headers['user-agent']);
    if (result.token) {
      this.setTokenCookie(res, result.token);
    }
    return ApiResponse.ok(result);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: Response, @Query('error') error?: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      // Handle Google OAuth cancel/error before Passport processes
      if (error) {
        const message = encodeURIComponent('Google bejelentkezés megszakítva');
        return res.redirect(`${frontendUrl}/login?error=${message}`);
      }

      // Manually run Passport authenticate to catch errors gracefully
      return new Promise<void>((resolve) => {
        const passport = require('passport');
        passport.authenticate('google', async (err: any, user: any) => {
          try {
            if (err || !user) {
              const message = encodeURIComponent(err?.message || 'Google bejelentkezés megszakítva');
              res.redirect(`${frontendUrl}/login?error=${message}`);
              return resolve();
            }
            const result = await this.authService.validateOrCreateOAuthUser(
              user,
              req.ip,
              req.headers['user-agent'],
            );
            this.setTokenCookie(res, result.token);
            res.redirect(`${frontendUrl}/dashboard`);
            resolve();
          } catch (serviceErr: any) {
            const message = encodeURIComponent(serviceErr?.message || 'Google bejelentkezés sikertelen');
            res.redirect(`${frontendUrl}/login?error=${message}`);
            resolve();
          }
        })(req, res);
      });
    } catch {
      // Catch-all: always redirect to login, never show raw JSON
      const message = encodeURIComponent('Google bejelentkezés sikertelen');
      return res.redirect(`${frontendUrl}/login?error=${message}`);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    // Audit: logout (best-effort, don't block)
    if (req.user?.userId) {
      this.authService.logLogout(req.user.userId, req.ip, req.headers['user-agent']).catch(() => {});
    }
    res.clearCookie('token', COOKIE_OPTIONS(process.env.NODE_ENV === 'production'));
    return ApiResponse.ok({ success: true });
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    const result = await this.authService.verifyEmail(body.token);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@Req() req: any) {
    const result = await this.authService.resendVerificationEmail(req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async forgotPassword(@Body() body: { email: string }) {
    const result = await this.authService.forgotPassword(body.email);
    return ApiResponse.ok(result);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async resetPassword(@Body() body: { token: string; password: string }) {
    const result = await this.authService.resetPassword(body.token, body.password);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setup2fa(@Req() req: any) {
    const result = await this.authService.setup2fa(req.user.userId);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  async verify2fa(@Req() req: any, @Body() body: { code: string }) {
    const result = await this.authService.verify2fa(req.user.userId, body.code);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disable2fa(@Req() req: any, @Body() body: { password: string }) {
    const result = await this.authService.disable2fa(req.user.userId, body.password);
    return ApiResponse.ok(result);
  }

  @Post('update-consent')
  @UseGuards(JwtAuthGuard)
  async updateConsent(@Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    await this.authService.updateConsent(req.user.userId, ip);
    return ApiResponse.ok({ message: 'Hozzájárulás frissítve' });
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
      notifyOnComplete?: boolean;
      notifyMarketing?: boolean;
      emailDigest?: string;
      brandLogoUrl?: string;
      brandColor?: string;
    },
  ) {
    const result = await this.authService.updateProfile(req.user.userId, body);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('saved-signature')
  async saveSavedSignature(
    @Req() req: any,
    @Body() body: { signatureImageBase64?: string; stampImageBase64?: string },
  ) {
    const result = await this.authService.saveSavedSignature(req.user.userId, body);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('saved-signature')
  async deleteSavedSignature(@Req() req: any) {
    await this.authService.deleteSavedSignature(req.user.userId);
    return ApiResponse.ok({ message: 'Mentett aláírás törölve' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved-signature')
  async getSavedSignature(@Req() req: any) {
    const result = await this.authService.getSavedSignature(req.user.userId);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('onboarding')
  async completeOnboarding(
    @Req() req: any,
    @Body() body: { companyName?: string; taxNumber?: string; address?: string },
  ) {
    await this.authService.completeOnboarding(req.user.userId, body);
    return ApiResponse.ok({ message: 'Onboarding befejezve' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  async changeEmail(
    @Req() req: any,
    @Body() body: { newEmail: string; password: string },
  ) {
    const result = await this.authService.changeEmail(req.user.userId, body.newEmail, body.password);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
    // Clear cookie since all sessions are invalidated on password change
    res.clearCookie('token', COOKIE_OPTIONS(process.env.NODE_ENV === 'production'));
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Req() req: any, @Headers('authorization') auth: string) {
    const token = this.extractToken(req, auth);
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
    const token = this.extractToken(req, auth);
    const currentTokenHash = this.authService.hashToken(token);
    const result = await this.authService.revokeAllOtherSessions(req.user.userId, currentTokenHash);
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  async deleteAccount(@Req() req: any, @Body() body: { password?: string; confirmEmail?: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.deleteAccount(req.user.userId, body.password ?? '', body.confirmEmail);
    res.clearCookie('token', COOKIE_OPTIONS(process.env.NODE_ENV === 'production'));
    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export-data')
  async exportData(@Req() req: any, @Res() res: Response) {
    const data = await this.authService.exportAllData(req.user.userId);
    const filename = `legitas-adatexport-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(data, null, 2));
  }
}
