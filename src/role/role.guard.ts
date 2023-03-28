import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../auth/decorators/roles-auth.decorator';
import * as process from 'process';
import { RoleModel } from './role.model';

export interface IDecodedPayload {
  roles: RoleModel[];
  iat: number;
  exp: number;
  sub: string;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
	private readonly jwtService: JwtService,
	private reflector: Reflector,
  ) {}

  canActivate(
	context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
	const requiredRoles = this.reflector.getAllAndOverride<string[]>(
		ROLES_KEY,
		[context.getHandler(), context.getClass()],
	);
	// если роли не найдены, то endpoint доступен для всех пользователей
	if (!requiredRoles) {
		return true;
	}

	const request = context.switchToHttp().getRequest();
	const authorizationHeader: string = request.headers.authorization;
	const bearer: string = authorizationHeader.split(' ')[0];
	const accessToken: string = authorizationHeader.split(' ')[1];

	if (bearer !== 'bearer' || !accessToken) {
		throw new UnauthorizedException({
		status: HttpStatus.UNAUTHORIZED,
		message: 'Пользователь не авторизован',
		});
	}

	const user: IDecodedPayload = this.jwtService.verify(accessToken, {
		secret: process.env.JWT_PRIVATE_KEY,
	});
	request.user = user;
	const isRole = user.roles.some((role): boolean =>
		requiredRoles.includes(role.role),
	);
	if (!isRole) {
		throw new ForbiddenException({
		status: HttpStatus.FORBIDDEN,
		message: 'У вас не достаточно прав доступа',
		});
	}
	return isRole;
  }
}
