import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './apikey-auth.guard';

@Injectable()
export class ApiKeyOrJwtGuard implements CanActivate {
  constructor(private readonly apiKeyGuard: ApiKeyGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try JWT first
    const jwtGuard = new (AuthGuard('jwt'))();
    try {
      const jwtResult = await jwtGuard.canActivate(context);
      if (jwtResult) return true;
    } catch {
      // JWT failed, try API key
    }

    return this.apiKeyGuard.canActivate(context);
  }
}
