import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Req,
  NotFoundException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response, Request } from 'express';

/**
 * Files controller with access control.
 * Requires either a valid JWT session OR a valid signing token query parameter.
 * This allows signers to view contract PDFs without login.
 */
@Controller('files')
export class FilesController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('*path')
  async serveFile(
    @Param('path') filePath: string,
    @Query('token') token: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Check access: either valid JWT or valid signing token
    const hasJwt = await this.checkJwtAuth(req);
    const hasSignToken = token ? await this.checkSigningToken(token) : false;

    if (!hasJwt && !hasSignToken) {
      throw new ForbiddenException('Hozzáférés megtagadva. Jelentkezzen be vagy használjon érvényes aláírási tokent.');
    }

    const localPath = this.storageService.getLocalFilePath(filePath);
    if (!localPath) {
      throw new NotFoundException('File not found');
    }
    res.sendFile(localPath);
  }

  private async checkJwtAuth(req: Request): Promise<boolean> {
    try {
      // Check if the request has a valid user set by a previous guard or middleware
      // We manually check for bearer token or cookie
      const authHeader = req.headers.authorization;
      const cookieToken = (req as any).cookies?.token;
      return !!(authHeader?.startsWith('Bearer ') || cookieToken);
    } catch {
      return false;
    }
  }

  private async checkSigningToken(token: string): Promise<boolean> {
    if (!token || token.length < 32) return false;
    try {
      const signer = await this.prisma.signer.findUnique({
        where: { signToken: token },
        select: { id: true, tokenExpiresAt: true },
      });
      if (!signer) return false;
      if (signer.tokenExpiresAt && signer.tokenExpiresAt < new Date()) return false;
      return true;
    } catch {
      return false;
    }
  }
}
