import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureFlagGuard, RequireFeature } from '../common/feature-flag.guard';
import { ApiResponse } from '../common/api-response';

@Controller('teams')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('team_management')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getTeam(@Req() req: any) {
    const team = await this.teamsService.getOrCreateTeam(req.user.userId);
    return ApiResponse.ok(team);
  }

  @Post('invite')
  async invite(@Body() body: { email: string; role: string }, @Req() req: any) {
    const team = await this.teamsService.getOrCreateTeam(req.user.userId);
    const member = await this.teamsService.inviteMember(
      team.id, body.email, body.role ?? 'member', req.user.userId,
    );
    return ApiResponse.ok(member);
  }

  @Patch('members/:memberId')
  async updateRole(
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
    @Req() req: any,
  ) {
    const team = await this.teamsService.getOrCreateTeam(req.user.userId);
    const member = await this.teamsService.updateMemberRole(
      team.id, memberId, body.role, req.user.userId,
    );
    return ApiResponse.ok(member);
  }

  @Delete('members/:memberId')
  async remove(@Param('memberId') memberId: string, @Req() req: any) {
    const team = await this.teamsService.getOrCreateTeam(req.user.userId);
    await this.teamsService.removeMember(team.id, memberId, req.user.userId);
    return ApiResponse.ok({ message: 'Tag eltávolítva' });
  }
}
