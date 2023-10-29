import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RefreshTokenModel } from './refresh-token.model';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';

import { jwtConfig } from './helpers/jwt.config';

@Module({
    imports: [
        JwtModule.registerAsync(jwtConfig()),
        SequelizeModule.forFeature([RefreshTokenModel]),
        UserModule,
    ],
    providers: [TokenService, RefreshTokenRepository, JwtStrategy],
    exports: [TokenService, JwtStrategy],
})
export class TokenModule {}
