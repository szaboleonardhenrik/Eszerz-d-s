import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
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
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  async login(dto: LoginDto) {
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

  async getLoginHistory(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { updatedAt: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException('Felhasználó nem található');
    }

    return {
      lastActivity: user.updatedAt,
      createdAt: user.createdAt,
      sessions: [
        {
          current: true,
          lastActive: user.updatedAt,
        },
      ],
    };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
