import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * SSO OAuth2 Guard
 * Использует Passport AuthGuard для OAuth 2.0 стратегии
 */
@Injectable()
export class SSOOAuth2Guard extends AuthGuard('oauth2') {}

