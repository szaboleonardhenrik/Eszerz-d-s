/**
 * Unit tests for AuthService
 *
 * All external dependencies (Prisma, JWT, Config, Notifications, Storage)
 * are fully mocked — no database or network calls.
 */

// Must be set before any import that touches encryption.util
process.env.ENCRYPTION_KEY = 'a'.repeat(64);

// Mock ESM modules that Jest cannot transform
let mockVerifySync = jest.fn().mockReturnValue(false);
jest.mock('otplib', () => ({
  TOTP: {},
  generateSecret: jest.fn().mockReturnValue('MOCKSECRET1234'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/Legitas:test@example.com?secret=MOCKSECRET1234'),
  verifySync: (...args: any[]) => mockVerifySync(...args),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqr'),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: { del: jest.fn() },
  }));
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { encrypt } from '../common/encryption.util';

// ─── Factory helpers ─────────────────────────────────────────────

function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    companyName: 'Test Kft.',
    taxNumber: '12345678-1-41',
    subscriptionTier: 'FREE',
    role: 'USER',
    emailVerified: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackup: [],
    failedLoginAttempts: 0,
    lockedUntil: null,
    googleId: null,
    oauthProvider: null,
    consentVersion: '2026-03-07',
    consentGivenAt: new Date(),
    consentIp: '127.0.0.1',
    emailVerifyToken: null,
    emailVerifyExp: null,
    stripeCustomerId: null,
    avatarUrl: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function createRegisterDto(overrides: Record<string, any> = {}) {
  return {
    email: 'new@example.com',
    password: 'StrongP@ss1',
    name: 'New User',
    companyName: 'New Kft.',
    taxNumber: '87654321-1-41',
    acceptTerms: true,
    ...overrides,
  };
}

function createLoginDto(overrides: Record<string, any> = {}) {
  return {
    email: 'test@example.com',
    password: 'StrongP@ss1',
    ...overrides,
  };
}

// ─── Mock builders ───────────────────────────────────────────────

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

function buildJwtMock() {
  return {
    sign: jest.fn().mockReturnValue('jwt-token'),
    verify: jest.fn(),
  };
}

function buildConfigMock() {
  return {
    get: jest.fn((key: string, fallback?: string) => {
      const map: Record<string, string> = {
        FRONTEND_URL: 'http://localhost:3000',
      };
      return map[key] ?? fallback ?? '';
    }),
  };
}

function buildNotificationsMock() {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };
}

function buildStorageMock() {
  return {
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };
}

// ─── Test suite ──────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let jwt: ReturnType<typeof buildJwtMock>;
  let notifications: ReturnType<typeof buildNotificationsMock>;

  beforeEach(async () => {
    mockVerifySync = jest.fn().mockReturnValue(false);
    prisma = buildPrismaMock();
    jwt = buildJwtMock();
    const config = buildConfigMock();
    notifications = buildNotificationsMock();
    const storage = buildStorageMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: NotificationsService, useValue: notifications },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ═══════════════════════════════════════════════════════════════
  // register
  // ═══════════════════════════════════════════════════════════════
  describe('register', () => {
    it('should create user, send verification email and return token', async () => {
      const dto = createRegisterDto();
      const createdUser = createMockUser({ id: 'new-1', email: dto.email, name: dto.name });

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(createdUser);
      prisma.session.create.mockResolvedValue({});

      const result = await service.register(dto, '1.2.3.4', 'Mozilla/5.0');

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe(dto.email);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.session.create).toHaveBeenCalledTimes(1);
      expect(notifications.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: dto.email }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(createMockUser());

      await expect(
        service.register(createRegisterDto({ email: 'test@example.com' })),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when terms not accepted', async () => {
      await expect(
        service.register(createRegisterDto({ acceptTerms: false })),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // login
  // ═══════════════════════════════════════════════════════════════
  describe('login', () => {
    it('should return user and token on valid credentials', async () => {
      const hash = await bcrypt.hash('StrongP@ss1', 4);
      const user = createMockUser({ passwordHash: hash });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({});

      const result = await service.login(createLoginDto(), '1.2.3.4');

      expect(result.token).toBe('jwt-token');
      expect((result as any).user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(createLoginDto())).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('CorrectP@ss1', 4);
      const user = createMockUser({ passwordHash: hash });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await expect(
        service.login(createLoginDto({ password: 'WrongP@ss1' })),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 1 }),
        }),
      );
    });

    it('should throw for google-only account (no passwordHash)', async () => {
      const user = createMockUser({ passwordHash: '' });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.login(createLoginDto())).rejects.toThrow(UnauthorizedException);
    });

    it('should lock account after 5 failed attempts', async () => {
      const hash = await bcrypt.hash('CorrectP@ss1', 4);
      const user = createMockUser({ passwordHash: hash, failedLoginAttempts: 4 });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await expect(
        service.login(createLoginDto({ password: 'WrongP@ss1' })),
      ).rejects.toThrow(/zárolva/);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('should reject login when account is currently locked', async () => {
      const user = createMockUser({
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.login(createLoginDto())).rejects.toThrow(/zárolva/);
    });

    it('should allow login if lockout has expired', async () => {
      const hash = await bcrypt.hash('StrongP@ss1', 4);
      const user = createMockUser({
        passwordHash: hash,
        lockedUntil: new Date(Date.now() - 1000), // expired
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({});

      const result = await service.login(createLoginDto());
      expect(result.token).toBe('jwt-token');
    });

    it('should reset failed attempts on successful login', async () => {
      const hash = await bcrypt.hash('StrongP@ss1', 4);
      const user = createMockUser({ passwordHash: hash, failedLoginAttempts: 3 });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({});

      await service.login(createLoginDto());

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { failedLoginAttempts: 0, lockedUntil: null },
        }),
      );
    });

    it('should return MFA token when 2FA is enabled', async () => {
      const hash = await bcrypt.hash('StrongP@ss1', 4);
      const user = createMockUser({ passwordHash: hash, twoFactorEnabled: true });
      prisma.user.findUnique.mockResolvedValue(user);

      jwt.sign.mockReturnValue('mfa-jwt');
      const result = await service.login(createLoginDto());

      expect(result).toEqual({ requiresMfa: true, mfaToken: 'mfa-jwt' });
    });

    it('should include requiresConsentUpdate when consent version differs', async () => {
      const hash = await bcrypt.hash('StrongP@ss1', 4);
      const user = createMockUser({ passwordHash: hash, consentVersion: '2020-01-01' });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({});

      const result = await service.login(createLoginDto());
      expect((result as any).requiresConsentUpdate).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // verifyMfaLogin
  // ═══════════════════════════════════════════════════════════════
  describe('verifyMfaLogin', () => {
    const totpSecret = 'JBSWY3DPEHPK3PXP';
    let encryptedSecret: string;

    beforeEach(() => {
      encryptedSecret = encrypt(totpSecret);
    });

    it('should succeed with valid TOTP code', async () => {
      mockVerifySync.mockReturnValue(true);

      const user = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
      });

      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', mfa: true });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({});

      const result = await service.verifyMfaLogin('mfa-token', '123456');

      expect(result.token).toBe('jwt-token');
      expect((result as any).user.email).toBe('test@example.com');
    });

    it('should succeed with valid backup code', async () => {
      const backupCode = 'ABCD1234';
      const backupHash = crypto.createHash('sha256').update(backupCode).digest('hex');

      const user = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackup: [backupHash, 'other-hash'],
      });

      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', mfa: true });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.session.create.mockResolvedValue({});

      const result = await service.verifyMfaLogin('mfa-token', backupCode);

      expect(result.token).toBe('jwt-token');
      // Backup code should be removed
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            twoFactorBackup: ['other-hash'],
          }),
        }),
      );
    });

    it('should throw on invalid/expired MFA token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('expired');
      });

      await expect(
        service.verifyMfaLogin('bad-token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when mfa flag is missing from token', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' }); // no mfa

      await expect(
        service.verifyMfaLogin('token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should track failed MFA attempts', async () => {
      const user = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackup: [],
        failedLoginAttempts: 0,
      });

      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', mfa: true });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await expect(
        service.verifyMfaLogin('mfa-token', 'WRONG-CODE'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 1 }),
        }),
      );
    });

    it('should lock account after 5 failed MFA attempts', async () => {
      const user = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackup: [],
        failedLoginAttempts: 4,
      });

      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', mfa: true });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await expect(
        service.verifyMfaLogin('mfa-token', 'WRONG-CODE'),
      ).rejects.toThrow(/zárolva/);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('should reject MFA when account is locked', async () => {
      const user = createMockUser({
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      });

      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', mfa: true });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.verifyMfaLogin('mfa-token', '123456'),
      ).rejects.toThrow(/próbálkozás/);
    });

    it('should throw when user has no 2FA secret', async () => {
      const user = createMockUser({ twoFactorSecret: null });

      jwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', mfa: true });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.verifyMfaLogin('mfa-token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // validateOrCreateOAuthUser
  // ═══════════════════════════════════════════════════════════════
  describe('validateOrCreateOAuthUser', () => {
    const profile = {
      googleId: 'google-123',
      email: 'oauth@example.com',
      name: 'OAuth User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('should create a new user when neither googleId nor email exists', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      const newUser = createMockUser({
        id: 'oauth-1',
        email: profile.email,
        googleId: profile.googleId,
      });
      prisma.user.create.mockResolvedValue(newUser);
      prisma.session.create.mockResolvedValue({});

      const result = await service.validateOrCreateOAuthUser(profile, '1.2.3.4');

      expect(result.token).toBe('jwt-token');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: profile.email,
            googleId: profile.googleId,
            oauthProvider: 'google',
            emailVerified: true,
          }),
        }),
      );
    });

    it('should link google to existing verified email user', async () => {
      const existingUser = createMockUser({
        email: profile.email,
        emailVerified: true,
        googleId: null,
      });

      prisma.user.findFirst.mockResolvedValue(null); // no match by googleId
      prisma.user.findUnique.mockResolvedValue(existingUser); // match by email
      const updatedUser = { ...existingUser, googleId: profile.googleId };
      prisma.user.update.mockResolvedValue(updatedUser);
      prisma.session.create.mockResolvedValue({});

      const result = await service.validateOrCreateOAuthUser(profile);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            googleId: profile.googleId,
            oauthProvider: 'google',
          }),
        }),
      );
      expect(result.token).toBe('jwt-token');
    });

    it('should block linking to unverified email account', async () => {
      const unverifiedUser = createMockUser({
        email: profile.email,
        emailVerified: false,
      });

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(unverifiedUser);

      await expect(
        service.validateOrCreateOAuthUser(profile),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return existing user found by googleId', async () => {
      const existingUser = createMockUser({ googleId: profile.googleId });
      prisma.user.findFirst.mockResolvedValue(existingUser);
      prisma.session.create.mockResolvedValue({});

      const result = await service.validateOrCreateOAuthUser(profile);

      expect(result.user.id).toBe(existingUser.id);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // forgotPassword
  // ═══════════════════════════════════════════════════════════════
  describe('forgotPassword', () => {
    it('should create reset token and send email when user exists', async () => {
      const user = createMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.passwordReset.create.mockResolvedValue({});

      const result = await service.forgotPassword('test@example.com');

      expect(result).toEqual({ sent: true });
      expect(prisma.passwordReset.create).toHaveBeenCalledTimes(1);
      expect(notifications.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@example.com' }),
      );
    });

    it('should return success even for non-existent email (prevent enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result).toEqual({ sent: true });
      expect(prisma.passwordReset.create).not.toHaveBeenCalled();
      expect(notifications.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // resetPassword
  // ═══════════════════════════════════════════════════════════════
  describe('resetPassword', () => {
    const validPassword = 'NewStr0ng!Pass';

    it('should reset password, mark token used, and delete sessions', async () => {
      const resetRecord = {
        id: 'reset-1',
        userId: 'user-1',
        token: 'valid-token',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
      };
      prisma.passwordReset.findFirst.mockResolvedValue(resetRecord);
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.resetPassword('valid-token', validPassword);

      expect(result).toEqual({ reset: true });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw on expired or already-used token', async () => {
      prisma.passwordReset.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('expired-token', validPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw on weak password (too short)', async () => {
      await expect(
        service.resetPassword('token', 'short'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw on password missing complexity requirements', async () => {
      await expect(
        service.resetPassword('token', 'alllowercase1!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // setup2fa / verify2fa / disable2fa
  // ═══════════════════════════════════════════════════════════════
  describe('setup2fa', () => {
    it('should generate QR code and store encrypted secret', async () => {
      const user = createMockUser({ twoFactorEnabled: false });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.setup2fa('user-1');

      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('manualEntry');
      expect(result.qrCode).toContain('data:image/png');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            twoFactorSecret: expect.any(String),
          }),
        }),
      );
    });

    it('should throw if 2FA is already enabled', async () => {
      const user = createMockUser({ twoFactorEnabled: true });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.setup2fa('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.setup2fa('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verify2fa', () => {
    it('should throw if no twoFactorSecret is set', async () => {
      prisma.user.findUnique.mockResolvedValue(createMockUser({ twoFactorSecret: null }));

      await expect(service.verify2fa('user-1', '123456')).rejects.toThrow(BadRequestException);
    });

    it('should throw on invalid TOTP code', async () => {
      const secret = encrypt('JBSWY3DPEHPK3PXP');
      prisma.user.findUnique.mockResolvedValue(
        createMockUser({ twoFactorSecret: secret }),
      );

      await expect(service.verify2fa('user-1', '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('disable2fa', () => {
    it('should disable 2FA with correct password', async () => {
      const hash = await bcrypt.hash('StrongP@ss1', 4);
      const user = createMockUser({
        passwordHash: hash,
        twoFactorEnabled: true,
        twoFactorSecret: 'enc-secret',
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      const result = await service.disable2fa('user-1', 'StrongP@ss1');

      expect(result).toEqual({ disabled: true });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackup: [],
          },
        }),
      );
    });

    it('should throw on wrong password', async () => {
      const hash = await bcrypt.hash('StrongP@ss1', 4);
      prisma.user.findUnique.mockResolvedValue(createMockUser({ passwordHash: hash }));

      await expect(
        service.disable2fa('user-1', 'WrongPassword1!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for google-only account', async () => {
      prisma.user.findUnique.mockResolvedValue(createMockUser({ passwordHash: '' }));

      await expect(
        service.disable2fa('user-1', 'any'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.disable2fa('no-user', 'pass')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // changePassword
  // ═══════════════════════════════════════════════════════════════
  describe('changePassword', () => {
    const newPass = 'BrandNew1!Pass';

    it('should change password and invalidate all sessions', async () => {
      const hash = await bcrypt.hash('OldP@ss1', 4);
      const user = createMockUser({ passwordHash: hash });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.session.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.changePassword('user-1', 'OldP@ss1', newPass);

      expect(result).toEqual({ message: 'Jelszó sikeresen módosítva' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: expect.any(String) }),
        }),
      );
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should throw when old password is wrong', async () => {
      const hash = await bcrypt.hash('CorrectOld1!', 4);
      prisma.user.findUnique.mockResolvedValue(createMockUser({ passwordHash: hash }));

      await expect(
        service.changePassword('user-1', 'WrongOld1!', newPass),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for google-only account', async () => {
      prisma.user.findUnique.mockResolvedValue(createMockUser({ passwordHash: '' }));

      await expect(
        service.changePassword('user-1', 'any', newPass),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when new password is too short', async () => {
      const hash = await bcrypt.hash('OldP@ss1', 4);
      prisma.user.findUnique.mockResolvedValue(createMockUser({ passwordHash: hash }));

      await expect(
        service.changePassword('user-1', 'OldP@ss1', 'Sh1!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when new password lacks complexity', async () => {
      const hash = await bcrypt.hash('OldP@ss1', 4);
      prisma.user.findUnique.mockResolvedValue(createMockUser({ passwordHash: hash }));

      await expect(
        service.changePassword('user-1', 'OldP@ss1', 'alllowercase'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('no-user', 'old', 'new'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
