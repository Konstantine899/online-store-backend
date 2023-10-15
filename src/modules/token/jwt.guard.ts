import { AuthGuard } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    handleRequest(error, user, info: Error) {
        if (error || info || !user) {
            throw error || info || new UnauthorizedException();
        }
        return user;
    }
}
