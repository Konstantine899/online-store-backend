import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * SSO OIDC Guard
 * Использует Passport AuthGuard для OIDC стратегии (passport-custom)
 */
@Injectable()
export class SSOOIDCGuard extends AuthGuard('oidc') {}

