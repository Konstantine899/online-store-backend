import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * SSO SAML Guard
 * Использует Passport AuthGuard для SAML стратегии
 */
@Injectable()
export class SSOSAMLGuard extends AuthGuard('saml') {}

