import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID', '');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET', '');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL', `${config.get('FRONTEND_URL', 'http://localhost:3000')}/api/auth/google/callback`);

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<void> {
    const { id, emails, displayName, photos } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value,
      name: displayName,
      avatarUrl: photos?.[0]?.value,
    };
    done(null, user);
  }
}
