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
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from '../common/encryption.util';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const CURRENT_CONSENT_VERSION = '2026-03-01';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_MFA_ATTEMPTS = 5;
const MFA_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
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
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        companyName: dto.companyName,
        taxNumber: dto.taxNumber,
        accountType: dto.accountType ?? 'company',
        companyAddress: dto.companyAddress,
        subscriptionTier: 'pro_trial',
        trialEndsAt,
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
      throw new UnauthorizedException('Nem található fiók ezzel az email címmel');
    }

    // Check if account is deactivated
    if (user.isActive === false) {
      throw new UnauthorizedException('Ez a fiók inaktiválva lett. Lépj kapcsolatba az adminisztrátorral.');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `A fiók ideiglenesen zárolva. Próbáld újra ${remainingMin} perc múlva.`,
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Ez a fiók Google bejelentkezéssel lett létrehozva. Használd a Google gombot.');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        updateData.failedLoginAttempts = 0;
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData });

      // Audit: failed login
      this.logAuthEvent(user.id, 'login_failed', ip, userAgent).catch(() => {});

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new UnauthorizedException(
          'Túl sok sikertelen próbálkozás. A fiók 15 percre zárolva.',
        );
      }
      throw new UnauthorizedException('Hibás jelszó');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
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

    // Audit: successful login
    this.logAuthEvent(user.id, 'login', ip, userAgent).catch(() => {});

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

  async validateOrCreateOAuthUser(profile: { googleId: string; email: string; name: string; avatarUrl?: string }, ip?: string, userAgent?: string) {
    // Try to find by googleId first
    let user = await this.prisma.user.findFirst({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      // Try to find by email (link existing account)
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Only link Google to existing account if email is verified
        if (!user.emailVerified) {
          throw new UnauthorizedException(
            'Ez az email cím már regisztrálva van, de nincs megerősítve. Először erősítsd meg az email címedet.',
          );
        }
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId, oauthProvider: 'google' },
        });
      } else {
        // Create new user with consent fields set (OAuth login implies consent)
        const oauthTrialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            googleId: profile.googleId,
            oauthProvider: 'google',
            passwordHash: '',
            emailVerified: true,
            avatarUrl: profile.avatarUrl || null,
            subscriptionTier: 'pro_trial',
            trialEndsAt: oauthTrialEndsAt,
            consentGivenAt: new Date(),
            consentVersion: CURRENT_CONSENT_VERSION,
            consentIp: ip || null,
          },
        });
      }
    }

    const token = this.generateToken(user.id, user.email);
    await this.createSession(user.id, token, ip, userAgent);

    return { user, token };
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

    // Check MFA lockout (reuses the same lockout mechanism as login)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Túl sok sikertelen próbálkozás. Próbáld újra ${remainingMin} perc múlva.`,
      );
    }

    // Try TOTP code first
    const totpSecret = this.decryptTotpSecret(user.twoFactorSecret);
    const isValid = verifySync({ token: code, secret: totpSecret });

    if (!isValid) {
      // Try backup codes
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const backupIdx = user.twoFactorBackup.indexOf(codeHash);
      if (backupIdx === -1) {
        // Track failed MFA attempt
        const attempts = user.failedLoginAttempts + 1;
        const updateData: any = { failedLoginAttempts: attempts };
        if (attempts >= MAX_MFA_ATTEMPTS) {
          updateData.lockedUntil = new Date(Date.now() + MFA_LOCKOUT_DURATION_MS);
          updateData.failedLoginAttempts = 0;
        }
        await this.prisma.user.update({ where: { id: user.id }, data: updateData });

        if (attempts >= MAX_MFA_ATTEMPTS) {
          throw new UnauthorizedException('Túl sok sikertelen próbálkozás. A fiók 15 percre zárolva.');
        }
        throw new UnauthorizedException('Érvénytelen kód');
      }

      // Remove used backup code
      const newBackup = [...user.twoFactorBackup];
      newBackup.splice(backupIdx, 1);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackup: newBackup },
      });
    }

    // Reset failed attempts on successful MFA
    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
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
        notifyOnComplete: true,
        notifyMarketing: true,
        emailDigest: true,
        consentVersion: true,
        trialEndsAt: true,
        accountType: true,
        companyAddress: true,
        onboardingCompleted: true,
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
    notifyOnComplete?: boolean;
    notifyMarketing?: boolean;
    emailDigest?: string;
    companyAddress?: string;
    accountType?: string;
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
        notifyOnComplete: true,
        notifyMarketing: true,
        emailDigest: true,
      },
    });
  }

  async getSavedSignature(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { savedSignatureUrl: true, savedStampUrl: true },
    });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    let signatureBase64: string | null = null;
    let stampBase64: string | null = null;

    if (user.savedSignatureUrl) {
      try {
        const buf = await this.storageService.downloadFile(user.savedSignatureUrl);
        signatureBase64 = `data:image/png;base64,${buf.toString('base64')}`;
      } catch { /* file missing */ }
    }
    if (user.savedStampUrl) {
      try {
        const buf = await this.storageService.downloadFile(user.savedStampUrl);
        stampBase64 = `data:image/png;base64,${buf.toString('base64')}`;
      } catch { /* file missing */ }
    }

    return { hasSignature: !!user.savedSignatureUrl, hasStamp: !!user.savedStampUrl, signatureBase64, stampBase64 };
  }

  async saveSavedSignature(userId: string, data: { signatureImageBase64?: string; stampImageBase64?: string }) {
    const updates: { savedSignatureUrl?: string; savedStampUrl?: string } = {};

    if (data.signatureImageBase64) {
      const buf = Buffer.from(data.signatureImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const key = `saved-signatures/${userId}/signature.png`;
      await this.storageService.uploadImage(key, buf);
      updates.savedSignatureUrl = key;
    }
    if (data.stampImageBase64) {
      const buf = Buffer.from(data.stampImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const key = `saved-signatures/${userId}/stamp.png`;
      await this.storageService.uploadImage(key, buf);
      updates.savedStampUrl = key;
    }

    await this.prisma.user.update({ where: { id: userId }, data: updates });
    return { saved: true };
  }

  async deleteSavedSignature(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { savedSignatureUrl: true, savedStampUrl: true },
    });
    if (user?.savedSignatureUrl) {
      try { await this.storageService.deleteFile(user.savedSignatureUrl); } catch { /* ok */ }
    }
    if (user?.savedStampUrl) {
      try { await this.storageService.deleteFile(user.savedStampUrl); } catch { /* ok */ }
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { savedSignatureUrl: null, savedStampUrl: null },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Felhasználó nem található');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Ez a fiók Google bejelentkezéssel lett létrehozva. Jelszó módosítás nem lehetséges.');
    }
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('A jelenlegi jelszó nem egyezik');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Az új jelszónak legalább 8 karakter hosszúnak kell lennie');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new BadRequestException('A jelszónak tartalmaznia kell kis- és nagybetűt, számot, valamint speciális karaktert');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all existing sessions on password change
    await this.prisma.session.deleteMany({ where: { userId } });

    // Audit: password changed
    this.logAuthEvent(userId, 'password_changed').catch(() => {});

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
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send the unhashed token in the email; only the hash is stored in the DB
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new BadRequestException('A jelszónak tartalmaznia kell kis- és nagybetűt, számot, valamint speciális karaktert');
    }

    // Hash the incoming token to match the stored hash
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const reset = await this.prisma.passwordReset.findFirst({
      where: { token: tokenHash, used: false, expiresAt: { gt: new Date() } },
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
    const otpAuthUrl = generateURI({ issuer: 'Legitas', label: user.email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Store secret encrypted (not enabled yet until verify)
    const encryptedSecret = encrypt(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptedSecret },
    });

    return { qrCode: qrCodeDataUrl, secret, manualEntry: secret };
  }

  async verify2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('Először állítsa be a 2FA-t');

    const secret = this.decryptTotpSecret(user.twoFactorSecret);
    const isValid = verifySync({ token: code, secret });
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

    // Audit: 2FA enabled
    this.logAuthEvent(userId, '2fa_enabled').catch(() => {});

    return { enabled: true, backupCodes };
  }

  async disable2fa(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    if (!user.passwordHash) {
      throw new BadRequestException('Ez a fiók Google bejelentkezéssel lett létrehozva.');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Hibás jelszó');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackup: [] },
    });

    // Audit: 2FA disabled
    this.logAuthEvent(userId, '2fa_disabled').catch(() => {});

    return { disabled: true };
  }

  // ─── ACCOUNT MANAGEMENT ──────────────────────────

  async deleteAccount(userId: string, password: string, confirmEmail?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    if (!user.passwordHash) {
      // Google OAuth users: confirm by email match
      if (!confirmEmail || confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
        throw new BadRequestException('A fiók törléséhez add meg az e-mail címedet megerősítésként.');
      }
    } else {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Hibás jelszó');
    }

    // Collect R2 file keys for cleanup before deleting DB records
    const userContracts = await this.prisma.contract.findMany({
      where: { ownerId: userId },
      select: { pdfUrl: true },
    });
    const signers = await this.prisma.signer.findMany({
      where: { contract: { ownerId: userId } },
      select: { signatureImageUrl: true },
    });

    const fileKeys: string[] = [];
    for (const c of userContracts) {
      if (c.pdfUrl) fileKeys.push(c.pdfUrl);
    }
    for (const s of signers) {
      if (s.signatureImageUrl) fileKeys.push(s.signatureImageUrl);
    }

    // Delete files from R2/local storage (best-effort, don't block on failures)
    await Promise.allSettled(
      fileKeys.map(key => this.storageService.deleteFile(key)),
    );

    // Delete Stripe customer if exists (best-effort, don't block account deletion)
    if (user.stripeCustomerId && this.config.get<string>('STRIPE_SECRET_KEY')) {
      try {
        const stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY', ''));
        await stripe.customers.del(user.stripeCustomerId);
      } catch (err) {
        // Log but don't block account deletion
      }
    }

    // Audit: account deleted (log before deleting user)
    await this.logAuthEvent(userId, 'account_deleted').catch(() => {});

    // Delete in order respecting foreign keys
    await this.prisma.$transaction([
      this.prisma.authAuditLog.deleteMany({ where: { userId } }),
      this.prisma.apiUsageLog.deleteMany({ where: { userId } }),
      this.prisma.promoCodeUsage.deleteMany({ where: { userId } }),
      this.prisma.invoice.deleteMany({ where: { userId } }),
      this.prisma.authorizedSigner.deleteMany({ where: { userId } }),
      this.prisma.emailLog.deleteMany({ where: { userId } }),
      this.prisma.creditTransaction.deleteMany({ where: { userId } }),
      this.prisma.passwordReset.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.session.deleteMany({ where: { userId } }),
      // ContactCompany references both contact and company — delete before either
      this.prisma.contactCompany.deleteMany({ where: { contact: { userId } } }),
      this.prisma.contact.deleteMany({ where: { userId } }),
      this.prisma.company.deleteMany({ where: { userId } }),
      // WebhookDeliveryLog references webhook — delete before webhook
      this.prisma.webhookDeliveryLog.deleteMany({ where: { webhook: { userId } } }),
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
        notifyOnComment: true, notifyOnComplete: true, notifyMarketing: true, emailDigest: true,
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
        id: true, title: true, status: true, contentHtml: true, createdAt: true, expiresAt: true,
        signers: { select: { name: true, email: true, role: true, status: true, signedAt: true, signatureMethod: true } },
      },
    });

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { contract: { ownerId: userId } },
      select: { eventType: true, ipAddress: true, createdAt: true, contract: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: { ipAddress: true, device: true, lastActive: true, createdAt: true },
    });

    const teamMembers = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { role: true, joinedAt: true, team: { select: { name: true } } },
    });

    const templates = await this.prisma.template.findMany({
      where: { ownerId: userId },
      select: { name: true, category: true, description: true, contentHtml: true, variables: true, isPublic: true, createdAt: true },
    });

    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      select: { name: true, prefix: true, scopes: true, createdAt: true },
    });

    const webhooks = await this.prisma.webhook.findMany({
      where: { userId },
      select: { url: true, events: true, active: true, createdAt: true },
    });

    const creditTransactions = await this.prisma.creditTransaction.findMany({
      where: { userId },
      select: { type: true, amount: true, description: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const quotes = await this.prisma.quote.findMany({
      where: { ownerId: userId },
      select: {
        id: true, title: true, clientName: true, clientEmail: true, status: true,
        currency: true, validUntil: true, createdAt: true,
        items: { select: { description: true, quantity: true, unitPrice: true, unit: true, taxRate: true } },
      },
    });

    const tags = await this.prisma.tag.findMany({
      where: { userId },
      select: { name: true, color: true, createdAt: true },
    });

    const folders = await this.prisma.folder.findMany({
      where: { userId },
      select: { name: true, color: true, createdAt: true },
    });

    const emailLogs = await this.prisma.emailLog.findMany({
      where: { userId },
      select: { to: true, subject: true, type: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const invoices = await this.prisma.invoice.findMany({
      where: { userId },
      select: {
        invoiceNumber: true, amount: true, currency: true, taxRate: true,
        buyerName: true, buyerEmail: true, status: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const quoteComments = await this.prisma.quoteComment.findMany({
      where: { quote: { ownerId: userId } },
      select: { author: true, isOwner: true, content: true, createdAt: true, quote: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
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
      templates,
      apiKeys,
      webhooks,
      creditTransactions,
      quotes,
      tags,
      folders,
      emailLogs,
      invoices,
      quoteComments: quoteComments.map(qc => ({ ...qc, quoteTitle: qc.quote?.title })),
    };
  }

  async completeOnboarding(userId: string, data?: { companyName?: string; taxNumber?: string; address?: string }): Promise<void> {
    const updateData: any = { onboardingCompleted: true };
    if (data?.companyName) updateData.companyName = data.companyName;
    if (data?.taxNumber) updateData.taxNumber = data.taxNumber;
    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
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

  /**
   * Decrypt a TOTP secret, with backwards compatibility for old plaintext secrets.
   */
  private decryptTotpSecret(storedSecret: string): string {
    try {
      return decrypt(storedSecret);
    } catch {
      // Backwards compatibility: if decryption fails, assume it's an old plaintext secret
      return storedSecret;
    }
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

  private async logAuthEvent(userId: string, action: string, ip?: string, userAgent?: string, metadata?: Record<string, any>) {
    return this.prisma.authAuditLog.create({
      data: {
        userId,
        action,
        ipAddress: ip || null,
        userAgent: userAgent || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  async changeEmail(userId: string, newEmail: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    if (!user.passwordHash) {
      throw new BadRequestException('Google fiók esetén az e-mail cím nem módosítható.');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Hibás jelszó');

    const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw new ConflictException('Ez az email cím már használatban van');

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: false,
        emailVerifyToken,
        emailVerifyExp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.notificationsService.sendVerificationEmail({
      to: newEmail,
      name: user.name,
      verifyUrl: `${this.frontendUrl}/verify-email/${emailVerifyToken}`,
    });

    this.logAuthEvent(userId, 'email_changed', undefined, undefined, { oldEmail: user.email, newEmail }).catch(() => {});

    return { message: 'Az új e-mail címre megerősítő linket küldtünk.' };
  }

  async logLogout(userId: string, ip?: string, userAgent?: string) {
    return this.logAuthEvent(userId, 'logout', ip, userAgent);
  }
}
