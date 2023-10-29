import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../token/token.module';
import { RoleModule } from '../role/role.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

@Module({
    imports: [UserModule, TokenModule, RoleModule, JwtModule],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule {}
