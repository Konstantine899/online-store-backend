import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RefreshTokenModel } from './refresh-token.model';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_PRIVATE_KEY || 'SECRET',
      signOptions: { expiresIn: '24h' }, // время жизни токена
    }),
    SequelizeModule.forFeature([RefreshTokenModel]),
    UserModule,
  ],
  providers: [TokenService, RefreshTokenRepository],
  exports: [TokenService],
})
export class TokenModule {}
