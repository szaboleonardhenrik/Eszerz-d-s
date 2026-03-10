import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TOTP, generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const CURRENT_CONSENT_VERSION = '2026-03-07';

@Injectable()
export class AuthService {
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    if (!dto.acceptTerms) {
      throw new BadRequestException('Az ÁSZF és Adatvédelmi tájékoztató elfogadása kötelező');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ez az email cím már regisztrálva van');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        companyName: dto.companyName,
        taxNumber: dto.taxNumber,
        consentGivenAt: new Date(),
        consentVersion: CURRENT_CONSENT_VERSION,
        consentIp: ip || null,
        emailVerifyToken,
        emailVerifyExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email (non-blocking)
    this.notificationsService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl: `${this.frontendUrl}/verify-email/${emailVerifyToken}`,
    }).catch(() => {});

    const token = this.generateToken(user.id, user.email);
    await this.createSession(user.id, token, ip, userAgent);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Hibás email vagy jelszó');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Hibás email vagy jelszó');
    }

    // If 2FA enabled, return a temporary MFA token instead
    if (user.twoFactorEnabled) {
      const mfaToken = this.jwtService.sign(
        { sub: user.id, email: user.email, mfa: true },
        { expiresIn: '5m' },
      );
      return { requiresMfa: true, mfaToken };
    }

    const token = this.generateToken(user.id, user.email);
    await this.createSession(user.id, token, ip, userAgent);

    // Check if user needs to re-accept updated terms
    const needsConsent = !user.consentVersion || user.consentVersion !== CURRENT_CONSENT_VERSION;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
        subscriptionTier: user.subscriptionTier,
      },
      token,
      ...(needsConsent && {
        requiresConsentUpdate: true,
        consentVersion: CURRENT_CONSENT_VERSION,
      }),
    };
  }

  async verifyMfaLogin(mfaToken: string, code: string, ip?: string, userAgent?: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(mfaToken);
    } catch {
      throw new UnauthorizedException('Érvénytelen vagy lejárt MFA token');
    }
    if (!payload.mfa) throw new UnauthorizedException('Érvénytelen MFA token');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.twoFactorSecret) throw new UnauthorizedException('2FA nincs beállítva');

    // Try TOTP code first
    const isValid = verifySync({ token: code, secret: user.twoFactorSecret });

    if (!isValid) {
      // Try backup codes
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const backupIdx = user.twoFactorBackup.indexOf(codeHash);
      if (backupIdx === -1) throw new UnauthorizedException('Érvénytelen kód');

      // Remove used backup code
      const newBackup = [...user.twoFactorBackup];
      newBackup.splice(backupIdx, 1);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackup: newBackup },
      });
    }

    const token = this.generateToken(user.id, user.email);
    await this.createSession(user.id, token, ip, userAgent);

    // Check if user needs to re-accept updated terms
    const needsConsent = !user.consentVersion || user.consentVersion !== CURRENT_CONSENT_VERSION;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
        subscriptionTier: user.subscriptionTier,
      },
      token,
      ...(needsConsent && {
        requiresConsentUpdate: true,
        consentVersion: CURRENT_CONSENT_VERSION,
      }),
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        taxNumber: true,
        phone: true,
        subscriptionTier: true,
        role: true,
        dapLinked: true,
        emailVerified: true,
        twoFactorEnabled: true,
        notifyOnSign: true,
        notifyOnDecline: true,
        notifyOnExpire: true,
        notifyOnComment: true,
        emailDigest: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: {
    name?: string;
    companyName?: string;
    taxNumber?: string;
    phone?: string;
    notifyOnSign?: boolean;
    notifyOnDecline?: boolean;
    notifyOnExpire?: boolean;
    notifyOnComment?: boolean;
    emailDigest?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        taxNumber: true,
        phone: true,
        subscriptionTier: true,
        role: true,
        notifyOnSign: true,
        notifyOnDecline: true,
        notifyOnExpire: true,
        notifyOnComment: true,
        emailDigest: true,
      },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Felhasználó nem található');
    }

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('A jelenlegi jelszó nem egyezik');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Az új jelszónak legalább 8 karakter hosszúnak kell lennie');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all existing sessions on password change
    await this.prisma.session.deleteMany({ where: { userId } });

    return { message: 'Jelszó sikeresen módosítva' };
  }

  async getSessions(userId: string, currentToken?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        device: true,
        lastActive: true,
        createdAt: true,
        tokenHash: true,
      },
    });

    const currentHash = currentToken ? this.hashToken(currentToken) : null;

    return sessions.map(({ tokenHash, ...session }) => ({
      ...session,
      current: currentHash ? tokenHash === currentHash : false,
    }));
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Munkamenet nem található');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Nincs jogosultság a munkamenet törléséhez');
    }

    await this.prisma.session.delete({ where: { id: sessionId } });
    return { message: 'Munkamenet sikeresen törölve' };
  }

  async revokeAllOtherSessions(userId: string, currentTokenHash: string) {
    const result = await this.prisma.session.deleteMany({
      where: {
        userId,
        tokenHash: { not: currentTokenHash },
      },
    });
    return { message: `${result.count} munkamenet törölve` };
  }

  // ─── EMAIL VERIFICATION ────────────────────────────

  async verifyEmail(verifyToken: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: verifyToken, emailVerifyExp: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Érvénytelen vagy lejárt megerősítő link');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExp: null },
    });
    return { verified: true };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Felhasználó nem található');
    if (user.emailVerified) throw new BadRequestException('Az email cím már megerősítve');

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken, emailVerifyExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    await this.notificationsService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl: `${this.frontendUrl}/verify-email/${emailVerifyToken}`,
    });
    return { sent: true };
  }

  // ─── FORGOT PASSWORD ─────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return { sent: true };

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.notificationsService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: `${this.frontendUrl}/reset-password/${resetToken}`,
    });
    return { sent: true };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('A jelszónak legalább 8 karakter hosszúnak kell lennie');
    }

    const reset = await this.prisma.passwordReset.findFirst({
      where: { token: resetToken, used: false, expiresAt: { gt: new Date() } },
    });
    if (!reset) throw new BadRequestException('Érvénytelen vagy lejárt jelszó-visszaállítási link');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      this.prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
      this.prisma.session.deleteMany({ where: { userId: reset.userId } }),
    ]);

    return { reset: true };
  }

  // ─── 2FA / TOTP ──────────────────────────────────

  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Felhasználó nem található');
    if (user.twoFactorEnabled) throw new BadRequestException('2FA már engedélyezve van');

    const secret = generateSecret();
    const otpAuthUrl = generateURI({ issuer: 'SzerződésPortál', label: user.email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Store secret temporarily (not enabled yet until verify)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { qrCode: qrCodeDataUrl, secret, manualEntry: secret };
  }

  async verify2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('Először állítsa be a 2FA-t');

    const isValid = verifySync({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new UnauthorizedException('Érvénytelen kód');

    // Generate backup codes
    const backupCodes: string[] = [];
    const backupHashes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
      backupHashes.push(crypto.createHash('sha256').update(code).digest('hex'));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorBackup: backupHashes },
    });

    return { enabled: true, backupCodes };
  }

  async disable2fa(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Hibás jelszó');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackup: [] },
    });
    return { disabled: true };
  }

  // ─── ACCOUNT MANAGEMENT ──────────────────────────

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Hibás jelszó');

    // Delete in order respecting foreign keys
    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.session.deleteMany({ where: { userId } }),
      this.prisma.contact.deleteMany({ where: { userId } }),
      this.prisma.webhook.deleteMany({ where: { userId } }),
      this.prisma.apiKey.deleteMany({ where: { userId } }),
      this.prisma.referral.deleteMany({ where: { referrerId: userId } }),
      this.prisma.comment.deleteMany({ where: { userId } }),
      this.prisma.tag.deleteMany({ where: { userId } }),
      this.prisma.folder.deleteMany({ where: { userId } }),
      this.prisma.teamMember.deleteMany({ where: { userId } }),
      // Delete contracts and their children
      this.prisma.auditLog.deleteMany({ where: { contract: { ownerId: userId } } }),
      this.prisma.signer.deleteMany({ where: { contract: { ownerId: userId } } }),
      this.prisma.contractTag.deleteMany({ where: { contract: { ownerId: userId } } }),
      this.prisma.contractVersion.deleteMany({ where: { contract: { ownerId: userId } } }),
      this.prisma.contractReminder.deleteMany({ where: { contract: { ownerId: userId } } }),
      this.prisma.contract.deleteMany({ where: { ownerId: userId } }),
      this.prisma.quoteItem.deleteMany({ where: { quote: { ownerId: userId } } }),
      this.prisma.quoteComment.deleteMany({ where: { quote: { ownerId: userId } } }),
      this.prisma.quote.deleteMany({ where: { ownerId: userId } }),
      this.prisma.quoteTemplate.deleteMany({ where: { ownerId: userId } }),
      this.prisma.templateVersion.deleteMany({ where: { template: { ownerId: userId } } }),
      this.prisma.template.deleteMany({ where: { ownerId: userId } }),
      this.prisma.team.deleteMany({ where: { ownerId: userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { deleted: true };
  }

  async exportAllData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, companyName: true, taxNumber: true,
        phone: true, subscriptionTier: true, role: true, createdAt: true,
        consentGivenAt: true, consentVersion: true,
        notifyOnSign: true, notifyOnDecline: true, notifyOnExpire: true,
        notifyOnComment: true, emailDigest: true,
        emailVerified: true, twoFactorEnabled: true,
        brandLogoUrl: true, brandColor: true,
      },
    });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const contacts = await this.prisma.contact.findMany({
      where: { userId },
      select: { name: true, email: true, company: true, phone: true, taxNumber: true, address: true, notes: true, group: true, createdAt: true },
    });

    const contracts = await this.prisma.contract.findMany({
      where: { ownerId: userId },
      select: {
        id: true, title: true, status: true, createdAt: true, expiresAt: true,
        signers: { select: { name: true, email: true, role: true, status: true, signedAt: true, signatureMethod: true } },
      },
    });

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { contract: { ownerId: userId } },
      select: { eventType: true, ipAddress: true, createdAt: true, contract: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: { ipAddress: true, device: true, lastActive: true, createdAt: true },
    });

    const teamMembers = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { role: true, joinedAt: true, team: { select: { name: true } } },
    });

    return {
      exportDate: new Date().toISOString(),
      gdprNote: 'GDPR 20. cikk szerinti adathordozhatóság — géppel olvasható formátum',
      profile: user,
      contacts,
      contracts,
      auditLogs: auditLogs.map(l => ({ ...l, contractTitle: l.contract?.title })),
      sessions,
      teamMembers: teamMembers.map(tm => ({ role: tm.role, teamName: tm.team?.name, joinedAt: tm.joinedAt })),
    };
  }

  async updateConsent(userId: string, ip: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        consentGivenAt: new Date(),
        consentVersion: CURRENT_CONSENT_VERSION,
        consentIp: ip,
      },
    });
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDevice(userAgent?: string): string {
    if (!userAgent) return 'Ismeretlen';
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/Mobile/i.test(userAgent)) return 'Mobil';
    if (/Mac/i.test(userAgent)) return 'Mac';
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Linux/i.test(userAgent)) return 'Linux';
    return 'Ismeretlen';
  }

  private async createSession(userId: string, token: string, ip?: string, userAgent?: string) {
    const tokenHash = this.hashToken(token);
    const device = this.parseDevice(userAgent);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        ipAddress: ip || null,
        userAgent: userAgent || null,
        device,
        expiresAt,
      },
    });
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
