import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ez az email cím már regisztrálva van');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        companyName: dto.companyName,
        taxNumber: dto.taxNumber,
      },
    });

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

    const token = this.generateToken(user.id, user.email);
    await this.createSession(user.id, token, ip, userAgent);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
        subscriptionTier: user.subscriptionTier,
      },
      token,
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
