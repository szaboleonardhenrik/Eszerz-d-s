import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateTeam(userId: string) {
    let team = await this.prisma.team.findFirst({
      where: { ownerId: userId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!team) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      team = await this.prisma.team.create({
        data: {
          name: user?.companyName ?? `${user?.name} csapata`,
          ownerId: userId,
          members: {
            create: { userId, role: 'admin' },
          },
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });
    }

    return team;
  }

  async inviteMember(teamId: string, email: string, role: string, inviterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Csapat nem található');
    if (team.ownerId !== inviterId) {
      const membership = await this.prisma.teamMember.findFirst({
        where: { teamId, userId: inviterId, role: 'admin' },
      });
      if (!membership) throw new ForbiddenException('Csak admin hívhat meg tagokat');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Felhasználó nem található ezzel az email címmel');

    const existing = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: user.id },
    });
    if (existing) throw new ConflictException('Ez a felhasználó már tag');

    // Check team member limit based on owner's tier
    const owner = await this.prisma.user.findUnique({
      where: { id: team.ownerId },
      select: { subscriptionTier: true, role: true },
    });
    const isAdmin = ['superadmin', 'employee'].includes(owner?.role ?? '');
    if (!isAdmin) {
      const teamMemberLimits: Record<string, number> = { free: 0, starter: 0, medium: 2, premium: 5, enterprise: 20 };
      const maxMembers = teamMemberLimits[owner?.subscriptionTier ?? 'free'] ?? 0;
      const currentCount = await this.prisma.teamMember.count({ where: { teamId } });
      if (currentCount >= maxMembers) {
        throw new ForbiddenException(
          maxMembers === 0
            ? 'A jelenlegi csomagodban nem érhető el a csapatkezelés. Válts Közepes vagy magasabb csomagra!'
            : `Elérted a csapattagok limitjét (${maxMembers}). Válts magasabb csomagra!`,
        );
      }
    }

    return this.prisma.teamMember.create({
      data: { teamId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateMemberRole(teamId: string, memberId: string, role: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.ownerId !== requesterId) {
      throw new ForbiddenException('Csak a csapat tulajdonosa módosíthatja a szerepköröket');
    }

    return this.prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeMember(teamId: string, memberId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Csapat nem található');

    const member = await this.prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Tag nem található');

    if (team.ownerId !== requesterId && member.userId !== requesterId) {
      throw new ForbiddenException('Nincs jogosultság');
    }

    if (member.userId === team.ownerId) {
      throw new ForbiddenException('A tulajdonos nem távolítható el');
    }

    return this.prisma.teamMember.delete({ where: { id: memberId } });
  }
}
